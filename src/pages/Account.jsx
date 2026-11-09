import { useState } from 'react'
import { useAuth, changePassword } from '../api.js'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Account() {
  const { user } = useAuth()
  const min = user.role === 'ADMIN' ? 10 : 8
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (f.next.length < min) return setMsg({ bad: true, text: `Your new password must be at least ${min} characters.` })
    if (f.next !== f.confirm) return setMsg({ bad: true, text: 'The new password and its confirmation do not match.' })
    if (f.next === f.current) return setMsg({ bad: true, text: 'Choose a password that is different from your current one.' })
    setBusy(true)
    try {
      await changePassword(f.current, f.next)
      setF({ current: '', next: '', confirm: '' })
      setMsg({ text: 'Password changed. You have been signed out of your other devices.' })
    } catch (err) { setMsg({ bad: true, text: err.message }) } finally { setBusy(false) }
  }
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Account</h1>
      <div className="card stack">
        <h2>Your details</h2>
        <p><b>Name:</b> {user.name}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Phone:</b> {user.phone}</p>
        <p className="muted small">To change your name, email or phone number, contact support.</p>
      </div>
      <form className="card stack" onSubmit={submit}>
        <h2>Change password</h2>
        {msg ? <div className={'notice ' + (msg.bad ? 'red' : 'green')} role={msg.bad ? 'alert' : 'status'}>{msg.text}</div> : null}
        <div className="field"><label htmlFor="cp">Current password</label><PasswordInput id="cp" autoComplete="current-password" value={f.current} onChange={set('current')} /></div>
        <div className="field"><label htmlFor="np">New password (min. {min} characters)</label><PasswordInput id="np" autoComplete="new-password" value={f.next} onChange={set('next')} /></div>
        <div className="field"><label htmlFor="cf">Confirm new password</label><PasswordInput id="cf" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></div>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      </form>
    </>
  )
}
