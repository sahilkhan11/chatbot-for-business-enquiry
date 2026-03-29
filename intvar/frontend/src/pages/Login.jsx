import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ setPage }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let result
      if (mode === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password })
      } else {
        result = await supabase.auth.signUp({ email, password })
      }
      if (result.error) throw result.error
      if (mode === 'signup') {
        setError('Account created! Check your email to confirm, then login.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-glow" />
      <div className="login-card">
        <div className="login-logo">Intvar<span>.</span></div>
        <h2 className="login-title">{mode === 'login' ? 'Admin Login' : 'Create Account'}</h2>
        <p className="login-sub">Access the Intvar dashboard</p>

        <form onSubmit={handle} className="login-form">
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@intvar.in" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login →' : 'Create Account →'}
          </button>
        </form>

        <div className="login-switch">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => setMode('signup')}>Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode('login')}>Login</button></>
          )}
        </div>

        <button className="login-back" onClick={() => setPage('home')}>← Back to website</button>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .login-glow {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse 600px 500px at 50% 40%, rgba(124,106,255,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .login-card {
          position: relative;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 16px;
          padding: 40px 36px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
        }
        .login-logo {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 24px;
        }
        .login-logo span { color: var(--accent); }
        .login-title { font-size: 22px; margin-bottom: 6px; }
        .login-sub { font-size: 14px; color: var(--muted); margin-bottom: 28px; }
        .login-form { display: flex; flex-direction: column; gap: 18px; }
        .login-error {
          background: rgba(255,95,95,0.1);
          border: 1px solid rgba(255,95,95,0.2);
          color: #ff9090;
          border-radius: var(--rs);
          padding: 10px 14px;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .login-switch {
          text-align: center;
          font-size: 13px;
          color: var(--muted);
          margin-top: 20px;
        }
        .login-switch button {
          background: none;
          color: var(--accent);
          font-size: 13px;
          font-family: 'Manrope', sans-serif;
          margin-left: 4px;
        }
        .login-back {
          display: block;
          width: 100%;
          text-align: center;
          background: none;
          color: var(--muted);
          font-size: 13px;
          margin-top: 12px;
          font-family: 'Manrope', sans-serif;
          transition: color 0.2s;
        }
        .login-back:hover { color: var(--text); }
      `}</style>
    </div>
  )
}
