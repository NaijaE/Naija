import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth, logout, usePublicConfig, naira } from '../api.js'

export const DemoBar = () => (import.meta.env.VITE_TEST_MODE === 'true' ? (
  <div className="demo-bar">Test mode: payments use test keys and no real money moves.</div>
) : null)

const Loading = () => <div className="container" style={{ padding: 40 }}><p className="muted">Loading…</p></div>

export function Footer() {
  return (
    <footer className="footer">
      <div className="container stack">
        <p>
          Naija Earn is a rewards platform. Rewards are paid only for validated completions of sponsor-funded video campaigns,
          depend on available campaigns, and are not guaranteed income. Joining is free. Advertisers pay for ad packages; members never pay to earn.
        </p>
        <p className="small">© Naija Earn · Terms · Privacy Notice · Support</p>
      </div>
    </footer>
  )
}

function Bar({ links, brandTo }) {
  const { user } = useAuth()
  const nav = useNavigate()
  return (
    <header className="nav">
      <div className="container">
        <Link to={brandTo}><Logo /></Link>
        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end className="home-link">⌂ Home</NavLink>
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
          ))}
          {user ? (
            <>
              <span className="muted small" style={{ padding: '0 8px' }}>{user.name}</span>
              <button className="btn ghost sm" onClick={() => { logout(); nav('/') }}>Log out</button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

function AdvertiseMenu({ user }) {
  const { cfg } = usePublicConfig()
  if (!cfg) return null
  const to = (id) => (user && user.role === 'MEMBER' ? `/app/advertise?package=${id}` : '/register')
  return (
    <div className="menu">
      <button type="button" className="menu-btn" aria-haspopup="true">Advertise ▾</button>
      <div className="menu-panel" role="menu">
        <div className="small muted" style={{ padding: '4px 10px 8px' }}>Advert subscription packages</div>
        {cfg.packages.map((p) => (
          <Link key={p.id} role="menuitem" to={to(p.id)} className="menu-item">
            <span><b>{p.name}</b><span className="small muted"> · {p.completions.toLocaleString()} views</span></span>
            <span className="pill orange">{naira(p.priceKobo)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function PublicLayout() {
  const { user } = useAuth()
  return (
    <>
      <DemoBar />
      <header className="nav">
        <div className="container">
          <Link to="/"><Logo /></Link>
          <nav className="nav-links" aria-label="Main">
            <NavLink to="/" end className="home-link">⌂ Home</NavLink>
            <AdvertiseMenu user={user} />
            {user ? (
              <Link className="btn sm" to={user.role === 'ADMIN' ? '/admin' : '/app'}>Open dashboard</Link>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link className="btn sm orange" to="/register">Join free</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
      <Footer />
    </>
  )
}

export function MemberLayout() {
  const { user, ready } = useAuth()
  if (!ready) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (!user.emailVerified || !user.phoneVerified) return <Navigate to="/verify" replace />
  return (
    <>
      <DemoBar />
      <Bar brandTo="/app" links={[['/app', 'Dashboard', true], ['/app/videos', 'Videos'], ['/app/advertise', 'Advertise'], ['/app/referrals', 'Referrals'], ['/app/withdraw', 'Withdraw']]} />
      <main className="container stack" style={{ paddingTop: 24 }}><Outlet /></main>
      <Footer />
    </>
  )
}

export function AdminLayout() {
  const { user, ready } = useAuth()
  if (!ready) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/app" replace />
  return (
    <>
      <DemoBar />
      <Bar brandTo="/admin" links={[
        ['/admin', 'Overview', true], ['/admin/campaigns', 'Campaigns'], ['/admin/deposits', 'Deposits'], ['/admin/withdrawals', 'Withdrawals'],
        ['/admin/users', 'Members'], ['/admin/settings', 'Settings'], ['/admin/audit', 'Audit log'], ['/admin/regulator', 'Regulator view'],
      ]} />
      <main className="container stack" style={{ paddingTop: 24 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export const Stat = ({ label, value, hint, hero }) => (
  <div className={'card stat' + (hero ? ' hero' : '')}>
    <div className="label">{label}</div>
    <div className="value">{value}</div>
    {hint ? <div className="hint">{hint}</div> : null}
  </div>
)

export const StatusPill = ({ status }) => {
  const tone = ['ACTIVE', 'APPROVED', 'PAID', 'COMPLETED', 'AVAILABLE'].includes(status) ? '' :
    ['REJECTED_WITH_REASON', 'FAILED', 'REVERSED', 'SUSPENDED', 'REJECTED', 'EXHAUSTED', 'CANCELLED'].includes(status) ? 'red' :
    ['PAUSED', 'CLOSED'].includes(status) ? 'grey' : 'orange'
  return <span className={'pill ' + tone}>{status.replaceAll('_', ' ')}</span>
}
