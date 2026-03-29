import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { apiGet, apiPatch, apiDelete } from '../lib/supabase'

const STATUS_COLORS = { new: 'badge-new', contacted: 'badge-contacted', closed: 'badge-closed' }

export default function Admin({ session, setPage }) {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('leads') // 'leads' | 'stats'
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsData, statsData] = await Promise.all([apiGet('/admin/leads'), apiGet('/admin/stats')])
      setLeads(leadsData)
      setStats(statsData)
    } catch (e) {
      showToast('Failed to fetch data: ' + e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const updateStatus = async (id, status) => {
    try {
      await apiPatch(`/admin/leads/${id}`, { status })
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      if (stats) {
        fetchData()
      }
      showToast('Status updated')
    } catch {
      showToast('Failed to update status')
    }
  }

  const deleteLead = async (id) => {
    setDeleting(id)
    try {
      await apiDelete(`/admin/leads/${id}`)
      setLeads(prev => prev.filter(l => l.id !== id))
      showToast('Lead deleted')
      fetchData()
    } catch {
      showToast('Failed to delete lead')
    }
    setDeleting(null)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setPage('home')
  }

  const filtered = leads.filter(l => {
    const matchFilter = filter === 'all' || l.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.message || '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="admin">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">Intvar<span>.</span></div>
        <nav className="sidebar-nav">
          <button className={`sidebar-item ${tab === 'leads' ? 'active' : ''}`} onClick={() => setTab('leads')}>
            <span>◈</span> Leads
            {stats && stats.new > 0 && <span className="sidebar-badge">{stats.new}</span>}
          </button>
          <button className={`sidebar-item ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
            <span>◉</span> Dashboard
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{session.user.email[0].toUpperCase()}</div>
            <div className="sidebar-email">{session.user.email}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">{tab === 'leads' ? 'Client Leads' : 'Dashboard'}</h1>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>↻ Refresh</button>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="loader-dot" /></div>
        ) : tab === 'stats' ? (
          /* STATS */
          <div className="stats-grid">
            {[
              { label: 'Total Leads', value: stats?.total ?? 0, color: '#7c6aff' },
              { label: 'New', value: stats?.new ?? 0, color: '#a099ff' },
              { label: 'Contacted', value: stats?.contacted ?? 0, color: '#f59e0b' },
              { label: 'Closed', value: stats?.closed ?? 0, color: '#3de8b0' },
              { label: 'Today', value: stats?.today ?? 0, color: '#ff7eb3' },
            ].map((s, i) => (
              <div className="stat-card" key={i} style={{ '--sc': s.color }}>
                <div className="stat-val">{s.value}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          /* LEADS */
          <>
            <div className="leads-toolbar">
              <input
                className="search-input"
                placeholder="Search by name, email, message..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="filter-tabs">
                {['all', 'new', 'contacted', 'closed'].map(f => (
                  <button key={f} className={`ftab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
                <p>No leads found.</p>
              </div>
            ) : (
              <div className="leads-list">
                {filtered.map(lead => (
                  <div className="lead-card" key={lead.id}>
                    <div className="lead-top">
                      <div>
                        <div className="lead-name">{lead.name}</div>
                        <div className="lead-meta">
                          <a href={`mailto:${lead.email}`}>{lead.email}</a>
                          {lead.phone && <span>· <a href={`tel:${lead.phone}`}>{lead.phone}</a></span>}
                          {lead.service && <span>· {lead.service}</span>}
                        </div>
                      </div>
                      <div className="lead-actions">
                        <span className={`badge ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
                      </div>
                    </div>
                    <p className="lead-msg">{lead.message}</p>
                    <div className="lead-bottom">
                      <span className="lead-date">{formatDate(lead.created_at)}</span>
                      <div className="lead-btns">
                        <select
                          value={lead.status}
                          onChange={e => updateStatus(lead.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteLead(lead.id)}
                          disabled={deleting === lead.id}
                        >
                          {deleting === lead.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        .admin { display: flex; min-height: 100vh; }

        /* SIDEBAR */
        .sidebar {
          width: 220px; flex-shrink: 0;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          padding: 24px 16px;
          position: fixed; left: 0; top: 0; bottom: 0;
        }
        .sidebar-logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 36px; padding-left: 8px; }
        .sidebar-logo span { color: var(--accent); }
        .sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .sidebar-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: var(--rs);
          font-size: 14px; color: var(--muted);
          background: none; text-align: left;
          transition: all 0.15s; position: relative;
          font-family: 'Manrope', sans-serif;
        }
        .sidebar-item:hover { background: var(--bg3); color: var(--text); }
        .sidebar-item.active { background: rgba(124,106,255,0.12); color: var(--accent); }
        .sidebar-badge {
          margin-left: auto;
          background: var(--accent);
          color: #fff;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 10px;
          font-weight: 600;
        }
        .sidebar-footer { border-top: 1px solid var(--border); padding-top: 16px; display: flex; flex-direction: column; gap: 12px; }
        .sidebar-user { display: flex; align-items: center; gap: 10px; }
        .sidebar-avatar { width: 32px; height: 32px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #fff; flex-shrink: 0; }
        .sidebar-email { font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* MAIN */
        .admin-main { margin-left: 220px; flex: 1; padding: 32px; min-height: 100vh; }
        .admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .admin-title { font-size: 26px; }
        .admin-loading { display: flex; align-items: center; justify-content: center; height: 200px; }

        /* STATS */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        .stat-card {
          background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r);
          padding: 28px 24px;
          border-top: 3px solid var(--sc);
        }
        .stat-val { font-family: 'Syne', sans-serif; font-size: 40px; font-weight: 800; color: var(--sc); line-height: 1; margin-bottom: 6px; }
        .stat-lbl { font-size: 13px; color: var(--muted); font-weight: 500; }

        /* LEADS */
        .leads-toolbar { display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .search-input {
          flex: 1; min-width: 200px;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: var(--rs); padding: 10px 14px;
          font-size: 14px; color: var(--text);
          font-family: 'Manrope', sans-serif;
          transition: border-color 0.2s;
        }
        .search-input:focus { border-color: var(--accent); outline: none; }
        .search-input::placeholder { color: var(--muted); }
        .filter-tabs { display: flex; gap: 4px; }
        .ftab {
          padding: 8px 14px; border-radius: 20px; font-size: 13px;
          background: none; color: var(--muted); font-family: 'Manrope', sans-serif;
          border: 1px solid transparent; transition: all 0.15s;
        }
        .ftab:hover { color: var(--text); }
        .ftab.active { background: rgba(124,106,255,0.12); color: var(--accent); border-color: rgba(124,106,255,0.3); }

        .leads-list { display: flex; flex-direction: column; gap: 12px; }
        .lead-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: var(--r); padding: 20px 22px;
          transition: border-color 0.2s;
        }
        .lead-card:hover { border-color: var(--border2); }
        .lead-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
        .lead-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
        .lead-meta { font-size: 13px; color: var(--muted); display: flex; gap: 6px; flex-wrap: wrap; }
        .lead-meta a { color: var(--accent); }
        .lead-msg { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 14px; border-left: 2px solid var(--border2); padding-left: 12px; }
        .lead-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .lead-date { font-size: 12px; color: var(--muted); }
        .lead-btns { display: flex; gap: 8px; align-items: center; }
        .status-select {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: var(--rs); padding: 6px 10px;
          font-size: 13px; color: var(--text);
          font-family: 'Manrope', sans-serif; cursor: pointer;
        }
        .status-select:focus { outline: none; border-color: var(--accent); }

        .empty-state { text-align: center; padding: 80px 24px; color: var(--muted); }

        @media (max-width: 640px) {
          .sidebar { display: none; }
          .admin-main { margin-left: 0; padding: 20px; }
        }
      `}</style>
    </div>
  )
}
