import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, useApi, useAuth, logout, naira } from '../api.js'

// "Delete my account" section for members and admins. Shown at the bottom of the Account page.
export default function DeleteAccount() {
  const { user } = useAuth()
  const nav = useNavigate()
  const isMember = user.role === 'MEMBER'
  const dash = useApi('/me/dashboard', { skip: !isMember })
  const balance = isMember && dash.data ? dash.data.balanceKobo || 0 : 0
  const [f, setF] = useState({ password: '', confirm: '', forfeit: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (f.confirm !== 'DELETE') return setError('Type DELETE in capital letters to confirm.')
    if (balance > 0 && !f.forfeit) return setError('Tick the box to confirm you give up your remaining balance, or withdraw it first.')
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return
    setBusy(true)
    try {
      await api.post('/me/delete', { password: f.password, confirm: 'DELETE', forfeitBalance: balance > 0 ? f.forfeit : false })
      logout(); nav('/', { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h2>Delete my account</h2>
      <p className="muted">Deleting your account removes your name, email, phone number and password, and you will not be able to log in again. Payment and reward records are kept as required for financial record-keeping, but they no longer show who you are. This cannot be undone.</p>
      <ul className="muted small">
        <li>You can't delete while a withdrawal is pending or approved. Wait until it is paid or rejected.</li>
        {isMember ? <li>You can't delete while an advertising campaign of yours is unfinished.</li> : <li>Admin accounts can be deleted only if another active admin remains.</li>}
      </ul>
      {balance > 0 ? (
        <div className="notice red" role="alert">
          You still have {naira(balance)} in your balance. Withdraw it first if you can. If you delete now, it is given up and cannot be recovered.
          <label className="check" style={{ marginTop: 8 }}><input type="checkbox" checked={f.forfeit} onChange={(e) => setF({ ...f, forfeit: e.target.checked })} /><span>I understand I will lose {naira(balance)}.</span></label>
        </div>
      ) : null}
      {error ? <div className="notice red" role="alert">{error}</div> : null}
      <div className="field"><label htmlFor="del-pw">Your password</label><input id="del-pw" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      <div className="field"><label htmlFor="del-confirm">Type DELETE to confirm</label><input id="del-confirm" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} autoComplete="off" /></div>
      <div><button className="btn danger" disabled={busy || !f.password}>{busy ? 'Deleting…' : 'Delete my account permanently'}</button></div>
    </form>
  )
}
