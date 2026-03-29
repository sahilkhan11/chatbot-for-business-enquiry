import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import './index.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState('home') // 'home' | 'login' | 'admin'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setPage('admin')
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="loader-screen">
      <div className="loader-dot" />
    </div>
  )

  if (page === 'login' && !session) return <Login setPage={setPage} />
  if (page === 'admin' && session) return <Admin session={session} setPage={setPage} />

  return <Home setPage={setPage} />
}
