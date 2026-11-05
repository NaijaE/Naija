import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import PasswordInput from '../components/PasswordInput.jsx'
import { api, register, login, refreshMe, rememberCodes, devCodes, useAuth } from '../api.js'

const Err = ({ text }) => (text ? <div className="notice red" role="alert" style={{ marginBottom: 14 }}>{text}</div> : null)

export function Register() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '', referralCode: params.get('ref') || '', consent: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try { await register(f); nav('/verify') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <form className="card auth" onSubmit={submit} noValidate>
      <h2>Create your free account</h2>
      <p className="muted">No payment is required. You'll confirm your email and phone right after sign-up.</p>
      <Err text={error} />
      <div className="field"><label htmlFor="name">Full name</label><input id="name" autoComplete="name" value={f.name} onChange={set('name')} /></div>
      <div className="field"><label htmlFor="phone">Phone number</label><input id="phone" inputMode="tel" autoComplete="tel" placeholder="08012345678" value={f.phone} onChange={set('phone')} /></div>
      <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></div>
      <div className="field"><label htmlFor="pw">Password (min. 8 characters)</label><PasswordInput id="pw" autoComplete="new-password" value={f.password} onChange={set('password')} /></div>
      <div className="field"><label htmlFor="ref">Referral code (optional)</label><input id="ref" value={f.referralCode} onChange={set('referralCode')} /></div>
      <div className="field"><label className="check"><input type="checkbox" checked={f.consent} onChange={set('consent')} />
        <span>I agree to the Terms and the Privacy Notice, and confirm I meet the eligibility rules.</span></label></div>
      <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      <p className="small muted" style={{ marginTop: 14 }}>Already have an account? <Link to="/login">Log in</Link></p>
    </form>
  )
}

export function Login() {
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const u = await login(f.email, f.password)
      nav(u.role === 'ADMIN' ? '/admin' : '/app')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>Log in</h2>
      <Err text={error} />
      <div className="field"><label htmlFor="e">Email address</label><input id="e" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div className="field"><label htmlFor="p">Password</label><PasswordInput id="p" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      <p className="small muted" style={{ marginTop: 14 }}><Link to="/forgot">Forgot password?</Link> · New here? <Link to="/register">Create a free account</Link></p>
    </form>
  )
}

export function Verify() {
  const nav = useNavigate()
  const { user, ready } = useAuth()
  const [f, setF] = useState({ emailCode: '', phoneCode: '' })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [codes, setCodes] = useState(devCodes())
  if (!ready) return <div className="container" style={{ padding: 40 }}><p className="muted">Loading…</p></div>
  if (!user) return <div className="card auth"><p>Please <Link to="/login">log in</Link> first.</p></div>
  if (user.emailVerified && user.phoneVerified) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try { await api.post('/auth/verify', f); await refreshMe(); nav('/app') } catch (err) { setError(err.message) }
  }
  const resend = async () => {
    setError(''); setInfo('')
    try { const r = await api.post('/auth/resend'); rememberCodes(r.devCodes); setCodes(r.devCodes || null); setInfo('New codes sent.') } catch (err) { setError(err.message) }
  }
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>Verify your contacts</h2>
      <p className="muted">Enter the 6-digit codes we sent to {user.email} and {user.phone}. They expire in 15 minutes.</p>
      {codes ? (
        <div className="notice" style={{ marginBottom: 14 }}>
          <b>Development mode:</b> codes are shown here because the server is not sending real email/SMS.
          <div>Email code: <code>{codes.emailCode}</code></div><div>Phone code: <code>{codes.phoneCode}</code></div>
        </div>
      ) : null}
      <Err text={error} />
      {info ? <div className="notice green" role="status" style={{ marginBottom: 14 }}>{info}</div> : null}
      <div className="field"><label htmlFor="ec">Email code</label><input id="ec" inputMode="numeric" maxLength={6} value={f.emailCode} onChange={(e) => setF({ ...f, emailCode: e.target.value })} /></div>
      <div className="field"><label htmlFor="pc">Phone code</label><input id="pc" inputMode="numeric" maxLength={6} value={f.phoneCode} onChange={(e) => setF({ ...f, phoneCode: e.target.value })} /></div>
      <button className="btn" style={{ width: '100%' }}>Verify</button>
      <p className="small muted" style={{ marginTop: 14 }}><button type="button" className="btn ghost sm" onClick={resend}>Send new codes</button></p>
    </form>
  )
}

export function Forgot() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(null)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { setSent(await api.post('/auth/forgot', { email })) } catch (err) { setError(err.message) }
  }
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>Forgot password</h2>
      <p className="muted">Enter your account email. If it exists, we'll send a reset code that expires in 15 minutes.</p>
      <Err text={error} />
      <div className="field"><label htmlFor="fe">Email address</label><input id="fe" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <button className="btn" style={{ width: '100%' }}>Send reset code</button>
      {sent ? (
        <div className="notice green" role="status" style={{ marginTop: 14 }}>
          {sent.message}
          {sent.devCode ? <div><b>Development mode:</b> your code is <code>{sent.devCode}</code></div> : null}
          <div style={{ marginTop: 10 }}><button type="button" className="btn sm" onClick={() => nav(`/reset?email=${encodeURIComponent(email.trim())}`)}>Enter code</button></div>
        </div>
      ) : null}
      <p className="small muted" style={{ marginTop: 14 }}><Link to="/login">Back to log in</Link></p>
    </form>
  )
}

export function Reset() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState({ email: params.get('email') || '', code: '', password: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setError('')
    try { await api.post('/auth/reset', f); setDone(true) } catch (err) { setError(err.message) }
  }
  if (done) return <div className="card auth stack"><h2>Password changed</h2><p className="muted">You can now log in with your new password.</p><button className="btn" onClick={() => nav('/login')}>Log in</button></div>
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>Reset password</h2>
      <Err text={error} />
      <div className="field"><label htmlFor="re">Email address</label><input id="re" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div className="field"><label htmlFor="rc">Reset code</label><input id="rc" inputMode="numeric" maxLength={6} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
      <div className="field"><label htmlFor="rp">New password (min. 8 characters)</label><PasswordInput id="rp" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      <button className="btn" style={{ width: '100%' }}>Change password</button>
    </form>
  )
}
