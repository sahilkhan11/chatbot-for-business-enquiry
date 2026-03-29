from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Intvar API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: set your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ---------- Models ----------

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    service: Optional[str] = None
    message: str

class LeadStatusUpdate(BaseModel):
    status: str  # "new" | "contacted" | "closed"

class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = []


# ---------- Auth helper ----------

async def get_current_user(authorization: str = Header(None)):
    """Verify Supabase JWT token for admin routes."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Public routes ----------

@app.get("/")
def root():
    return {"status": "ok", "message": "Intvar API is running"}


@app.post("/leads", status_code=201)
def submit_lead(lead: LeadCreate):
    """Anyone can submit a lead (contact form)."""
    try:
        data = {
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "service": lead.service,
            "message": lead.message,
            "status": "new",
            "created_at": datetime.utcnow().isoformat(),
        }
        result = supabase.table("leads").insert(data).execute()
        return {"success": True, "id": result.data[0]["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(body: ChatMessage):
    """AI chatbot endpoint using Claude API."""
    import httpx

    ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
    if not ANTHROPIC_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")

    system_prompt = """You are a friendly customer assistant for Intvar, a web and Android development agency in India.

About Intvar:
- Services: Web development, Android app development, business automation
- Owner: Sahil Khan | Contact: 7372908326
- Instagram: @Intvar.automate
- Target: Small and medium businesses in India

Rules:
- Answer only questions about Intvar and its services
- Keep replies to 2-3 sentences max
- Push interested leads to contact Sahil: 7372908326
- If unsure, say: "Please contact Sahil at 7372908326 for this"
Tone: Friendly, professional, concise."""

    messages = body.history[-10:] if body.history else []
    messages.append({"role": "user", "content": body.message})

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 300,
                "system": system_prompt,
                "messages": messages,
            },
        )
    data = res.json()
    if res.status_code != 200:
        raise HTTPException(status_code=500, detail=data.get("error", {}).get("message", "Claude error"))

    reply = data["content"][0]["text"]
    return {"reply": reply}


# ---------- Admin routes (require auth) ----------

@app.get("/admin/leads")
def get_leads(user=Depends(get_current_user)):
    """Get all leads - admin only."""
    try:
        result = supabase.table("leads").select("*").order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/admin/leads/{lead_id}")
def update_lead_status(lead_id: str, body: LeadStatusUpdate, user=Depends(get_current_user)):
    """Update lead status - admin only."""
    if body.status not in ["new", "contacted", "closed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        supabase.table("leads").update({"status": body.status}).eq("id", lead_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/admin/leads/{lead_id}")
def delete_lead(lead_id: str, user=Depends(get_current_user)):
    """Delete a lead - admin only."""
    try:
        supabase.table("leads").delete().eq("id", lead_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/admin/stats")
def get_stats(user=Depends(get_current_user)):
    """Dashboard stats - admin only."""
    try:
        all_leads = supabase.table("leads").select("status, created_at").execute().data
        today = datetime.utcnow().date().isoformat()
        total = len(all_leads)
        new = sum(1 for l in all_leads if l["status"] == "new")
        contacted = sum(1 for l in all_leads if l["status"] == "contacted")
        closed = sum(1 for l in all_leads if l["status"] == "closed")
        today_count = sum(1 for l in all_leads if l["created_at"][:10] == today)
        return {
            "total": total,
            "new": new,
            "contacted": contacted,
            "closed": closed,
            "today": today_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
