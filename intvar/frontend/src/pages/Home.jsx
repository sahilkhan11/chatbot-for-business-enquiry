import { useState, useRef, useEffect } from 'react'
import { apiPost } from '../lib/supabase'

const SERVICES = [
  { icon: '◈', title: 'Web Development', desc: 'Custom websites, landing pages, e-commerce & web apps tailored to your business.' },
  { icon: '◉', title: 'Android Apps', desc: 'Native Android applications that give your business a mobile presence.' },
  { icon: '⬡', title: 'Business Automation', desc: 'Automate repetitive tasks and workflows to save time and grow faster.' },
]

export default function Home({ setPage }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: "Hi! 👋 I'm the Intvar assistant. Ask me anything about our services!" }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [chatHistory])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiPost('/leads', form)
      setSubmitted(true)
      showToast("Message sent! Sahil will get back to you soon.")
    } catch {
      showToast("Something went wrong. Please call 7372908326 directly.")
    }
    setSubmitting(false)
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    const newHistory = [...chatHistory, { role: 'user', content: msg }]
    setChatHistory(newHistory)
    setChatLoading(true)
    try {
      const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
      const messages = [
        { role: 'system', content: `You are a friendly customer assistant for Intvar, a web and Android development agency in India. Services: Web development, Android apps, business automation. Owner: Sahil Khan. Contact: 7372908326. Instagram: @Intvar.automate. Only answer questions about Intvar. Keep replies to 2-3 sentences. If unsure say: Please contact Sahil at 7372908326.` },
        ...newHistory.slice(-10).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      ]
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'llama3-8b-8192', messages, max_tokens: 300, temperature: 0.7 })
      })
      const data = await res.json()
      const reply = data.choices[0].message.content
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
    setChatLoading(false)
  }

  return (
    <div className="home">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">Intvar<span>.</span></div>
          <div className="nav-links">
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('login')}>Admin</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-inner">
          <div className="hero-tag">Web · Android · Automation</div>
          <h1 className="hero-title">
            We Build Digital<br />
            <span className="hero-accent">Solutions</span> That<br />
            Grow Your Business
          </h1>
          <p className="hero-sub">
            Intvar helps Indian businesses go digital with custom websites,
            Android apps, and smart automation — built by Sahil Khan.
          </p>
          <div className="hero-cta">
            <a href="#contact" className="btn btn-primary">Start a Project →</a>
            <a href="tel:7372908326" className="btn btn-ghost">Call: 7372908326</a>
          </div>
          <div className="hero-stats">
            <div className="stat"><span>SMB</span>Focused</div>
            <div className="stat-div" />
            <div className="stat"><span>3</span>Core Services</div>
            <div className="stat-div" />
            <div className="stat"><span>India</span>Based</div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="section-inner">
          <div className="section-tag">What We Do</div>
          <h2 className="section-title">Our Services</h2>
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div className="service-card" key={i}>
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="section-inner">
          <div className="section-tag">Get In Touch</div>
          <h2 className="section-title">Start Your Project</h2>
          <div className="contact-layout">
            <div className="contact-info">
              <p className="contact-desc">
                Ready to take your business online? Fill the form and Sahil will reach out within 24 hours.
              </p>
              <div className="contact-details">
                <a href="tel:7372908326" className="contact-item">
                  <span className="ci-icon">☎</span>
                  <span>7372908326</span>
                </a>
                <a href="https://instagram.com/Intvar.automate" target="_blank" rel="noreferrer" className="contact-item">
                  <span className="ci-icon">◎</span>
                  <span>@Intvar.automate</span>
                </a>
              </div>
            </div>
            <div className="contact-form-wrap">
              {submitted ? (
                <div className="submitted-msg">
                  <div className="submitted-icon">✓</div>
                  <h3>Message Sent!</h3>
                  <p>Sahil will contact you within 24 hours.</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="field">
                      <label>Name *</label>
                      <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                    </div>
                    <div className="field">
                      <label>Email *</label>
                      <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label>Phone</label>
                      <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="WhatsApp number" />
                    </div>
                    <div className="field">
                      <label>Service</label>
                      <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
                        <option value="">Select service</option>
                        <option>Web Development</option>
                        <option>Android App</option>
                        <option>Business Automation</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Message *</label>
                    <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us about your project..." />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
                    {submitting ? 'Sending...' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="nav-logo">Intvar<span>.</span></span>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>© 2025 Intvar · Built by Sahil Khan</span>
          <a href="https://instagram.com/Intvar.automate" target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', fontSize: 13 }}>@Intvar.automate</a>
        </div>
      </footer>

      {/* CHATBOT */}
      <div className="chat-widget">
        {chatOpen && (
          <div className="chat-box">
            <div className="chat-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="chat-avatar">Iv</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Intvar Assistant</div>
                  <div style={{ fontSize: 12, color: 'var(--accent2)' }}>● Online</div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', color: 'var(--muted)', fontSize: 18 }}>×</button>
            </div>
            <div className="chat-messages" ref={messagesRef}>
              {chatHistory.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role}`}>
                  <div className="chat-bubble">{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg assistant">
                  <div className="chat-bubble typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input-row">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask about our services..."
              />
              <button onClick={sendChat} className="btn btn-primary btn-sm" disabled={chatLoading}>→</button>
            </div>
          </div>
        )}
        <button className="chat-toggle" onClick={() => setChatOpen(o => !o)}>
          {chatOpen ? '×' : '💬'}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        .home { min-height: 100vh; }

        /* NAV */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; border-bottom: 1px solid var(--border); background: rgba(6,6,8,0.85); backdrop-filter: blur(12px); }
        .nav-inner { max-width: 1100px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
        .nav-logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .nav-logo span { color: var(--accent); }
        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-links a { font-size: 14px; color: var(--muted); transition: color 0.2s; }
        .nav-links a:hover { color: var(--text); }

        /* HERO */
        .hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; padding: 120px 24px 80px; }
        .hero-glow { position: absolute; top: 10%; left: 50%; transform: translateX(-50%); width: 700px; height: 500px; background: radial-gradient(ellipse, rgba(124,106,255,0.12) 0%, transparent 65%); pointer-events: none; }
        .hero-inner { max-width: 1100px; margin: 0 auto; width: 100%; }
        .hero-tag { display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); border: 1px solid rgba(124,106,255,0.3); padding: 6px 14px; border-radius: 20px; margin-bottom: 28px; }
        .hero-title { font-size: clamp(42px, 7vw, 80px); font-weight: 800; line-height: 1.05; margin-bottom: 24px; }
        .hero-accent { color: var(--accent); }
        .hero-sub { font-size: 17px; color: var(--muted); max-width: 500px; margin-bottom: 36px; line-height: 1.7; }
        .hero-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 56px; }
        .hero-stats { display: flex; align-items: center; gap: 24px; }
        .stat { font-size: 13px; color: var(--muted); }
        .stat span { display: block; font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--text); }
        .stat-div { width: 1px; height: 32px; background: var(--border2); }

        /* SERVICES */
        .services { padding: 100px 24px; }
        .section-inner { max-width: 1100px; margin: 0 auto; }
        .section-tag { font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
        .section-title { font-size: clamp(28px, 4vw, 42px); margin-bottom: 48px; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .service-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r); padding: 32px 28px; transition: border-color 0.2s, transform 0.2s; }
        .service-card:hover { border-color: var(--accent); transform: translateY(-3px); }
        .service-icon { font-size: 28px; color: var(--accent); margin-bottom: 16px; }
        .service-card h3 { font-size: 18px; margin-bottom: 10px; }
        .service-card p { font-size: 14px; color: var(--muted); line-height: 1.7; }

        /* CONTACT */
        .contact { padding: 100px 24px; background: var(--bg2); border-top: 1px solid var(--border); }
        .contact-layout { display: grid; grid-template-columns: 1fr 1.6fr; gap: 60px; align-items: start; }
        @media (max-width: 768px) { .contact-layout { grid-template-columns: 1fr; } }
        .contact-desc { font-size: 15px; color: var(--muted); line-height: 1.7; margin-bottom: 32px; }
        .contact-details { display: flex; flex-direction: column; gap: 14px; }
        .contact-item { display: flex; align-items: center; gap: 12px; font-size: 15px; color: var(--text); transition: color 0.2s; }
        .contact-item:hover { color: var(--accent); }
        .ci-icon { font-size: 20px; color: var(--accent); }
        .contact-form-wrap { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r); padding: 32px; }
        .contact-form { display: flex; flex-direction: column; gap: 18px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }
        .submitted-msg { text-align: center; padding: 48px 24px; }
        .submitted-icon { font-size: 36px; color: var(--accent2); margin-bottom: 16px; }
        .submitted-msg h3 { font-size: 22px; margin-bottom: 8px; }
        .submitted-msg p { color: var(--muted); }

        /* FOOTER */
        .footer { border-top: 1px solid var(--border); padding: 24px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }

        /* CHATBOT */
        .chat-widget { position: fixed; bottom: 24px; right: 24px; z-index: 200; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
        .chat-toggle { width: 52px; height: 52px; background: var(--accent); border-radius: 50%; font-size: 22px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 8px 24px rgba(124,106,255,0.4); }
        .chat-toggle:hover { transform: scale(1.08); }
        .chat-box { width: 340px; background: var(--bg2); border: 1px solid var(--border2); border-radius: var(--r); overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.6); }
        .chat-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
        .chat-avatar { width: 34px; height: 34px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; }
        .chat-messages { height: 300px; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .chat-msg { display: flex; }
        .chat-msg.user { justify-content: flex-end; }
        .chat-bubble { max-width: 82%; padding: 10px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.55; }
        .chat-msg.assistant .chat-bubble { background: var(--bg3); border: 1px solid var(--border); }
        .chat-msg.user .chat-bubble { background: var(--accent); color: #fff; }
        .typing-dots { display: flex; gap: 5px; align-items: center; padding: 14px; }
        .typing-dots span { width: 6px; height: 6px; background: var(--muted); border-radius: 50%; animation: td 1.2s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes td { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        .chat-input-row { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--border); }
        .chat-input-row input { flex: 1; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--rs); padding: 9px 12px; font-size: 13px; color: var(--text); }
        .chat-input-row input:focus { border-color: var(--accent); }
        .chat-input-row input::placeholder { color: var(--muted); }
      `}</style>
    </div>
  )
}
