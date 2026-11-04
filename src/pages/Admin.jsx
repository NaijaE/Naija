import { useState } from 'react'
import { api, useApi, useAuth, naira, fmtTime, PAY_METHODS, toKobo, API_URL } from '../api.js'
import { Stat, StatusPill } from '../components/Shell.jsx'

const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0)
const ask = (label) => window.prompt(label)
const Loading = () => <p className="muted">Loading…</p>
const Problem = ({ error, onRetry }) => (
  <div className="notice red" role="alert">{error.message} {onRetry ? <button className="btn ghost sm" onClick={onRetry}>Try again</button> : null}</div>
)
function Msg({ m }) {
  if (!m) return null
  return <div className={'notice ' + (m.error ? 'red' : 'green')} role={m.error ? 'alert' : 'status'}>{m.error || m.ok}</div>
}
// Runs an admin action, shows the result, then refreshes the list.
async function act(setMsg, reload, fn, okText) {
  try { await fn(); setMsg({ ok: okText }); reload() } catch (e) { setMsg({ error: e.message }) }
}

export function Overview() {
  const o = useApi('/admin/overview')
  if (o.error) return <Problem error={o.error} onRetry={o.reload} />
  if (!o.data) return <Loading />
  const d = o.data
  const rows = d.last7Days
  const max = Math.max(1, ...rows.map((r) => Math.max(r.dailyActiveUsers, r.videosWatched)))
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Admin overview</h1>
      <div className="grid g3">
        <Stat label="Members" value={d.members} />
        <Stat label="Funded campaign budget" value={naira(d.fundedBudgetKobo)} hint={`${d.activeCampaigns} live campaign(s)`} />
        <Stat label="Budget remaining" value={naira(d.budgetRemainingKobo)} hint="Prepaid, not yet consumed" />
        <Stat label="Reward liability" value={naira(d.rewardLiabilityKobo)} hint="Member balances owed" />
        <Stat label="Paid out" value={naira(d.paidOutKobo)} hint="After fees, confirmed by reference" />
        <Stat label="Withdrawals awaiting review" value={d.pendingWithdrawals} hint={naira(d.pendingWithdrawalsKobo)} />
        <Stat label="Total deposits" value={naira(d.totalDepositsKobo)} hint={`${d.pendingDeposits} bank transfer(s) awaiting review`} />
      </div>
      <div className="card stack">
        <h2>Last 7 days</h2>
        <p className="muted small">Daily active users = members who started or finished a video that day. Videos watched = validated completions. Days use Africa/Lagos time.</p>
        <div className="table-wrap"><table>
          <thead><tr><th>Date</th><th>Daily active users</th><th>Videos watched</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.date}><td>{r.date}</td>
              <td><div className="row"><div style={{ height: 10, width: `${(r.dailyActiveUsers / max) * 160}px`, background: 'var(--green-500)', borderRadius: 6 }} /><b>{r.dailyActiveUsers}</b></div></td>
              <td><div className="row"><div style={{ height: 10, width: `${(r.videosWatched / max) * 160}px`, background: 'var(--orange-500)', borderRadius: 6 }} /><b>{r.videosWatched}</b></div></td></tr>
          ))}</tbody></table></div>
      </div>
      {d.pendingProposals ? <div className="notice">{d.pendingProposals} settings change(s) are waiting for a second reviewer. See Settings.</div> : null}
      <div className="notice green">Members pay no activation fee. Package purchases are advertiser deposits that fund campaign budgets, and every member reward is drawn from a specific prepaid campaign budget.</div>
    </>
  )
}

export function Deposits() {
  const d = useApi('/admin/deposits?page=1')
  const [msg, setMsg] = useState(null)
  if (d.error) return <Problem error={d.error} onRetry={d.reload} />
  if (!d.data) return <Loading />
  const all = d.data.deposits
  const pending = all.filter((o) => o.status === 'PENDING_REVIEW')
  const decide = (o, approve) => {
    const text = ask(approve ? 'Bank credit reference you matched to this deposit:' : 'Reason (shown to the member):')
    if (text === null) return
    act(setMsg, d.reload, () => api.post(`/admin/deposits/${o.id}/${approve ? 'approve' : 'reject'}`, approve ? { reference: text } : { reason: text }),
      approve ? 'Deposit confirmed. The campaign is now waiting for content approval.' : 'Deposit rejected.')
  }
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Deposits</h1>
      <div className="notice">Approve a manual deposit only after the money is visible in the bank account. Gateway payments (Paystack/Flutterwave) confirm themselves after the server verifies them with the provider.</div>
      <Msg m={msg} />
      <div className="card stack"><h2>Awaiting review ({pending.length})</h2>
        {pending.length === 0 ? <p className="muted">Nothing waiting.</p> : pending.map((o) => (
          <div key={o.id} className="row between" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <div>
              <b>{o.user?.name}</b> · {o.packageName} · {naira(o.priceKobo)}
              <div className="small muted">{fmtTime(o.createdAt)} · transfer reference <code>{o.id}</code></div>
              <div className="small">{o.proofUrl ? <a href={o.proofUrl} target="_blank" rel="noreferrer">View proof of payment ({o.proof?.name})</a> : 'No proof attached'}</div>
            </div>
            <div className="row"><button className="btn sm" onClick={() => decide(o, true)}>Approve</button><button className="btn sm danger" onClick={() => decide(o, false)}>Reject</button></div>
          </div>))}
      </div>
      <div className="card"><h2>All deposits</h2>
        {all.length === 0 ? <p className="muted">No deposits yet.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Member</th><th>Package</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
            <tbody>{all.map((o) => (<tr key={o.id}><td>{fmtTime(o.createdAt)}</td><td>{o.user?.email}</td><td>{o.packageName}</td><td>{naira(o.priceKobo)}</td><td>{PAY_METHODS[o.method]}{o.ref ? <div className="small muted">ref {o.ref}</div> : null}</td><td><StatusPill status={o.status} />{o.refundDue ? <div className="small muted">refund due</div> : null}</td></tr>))}</tbody></table></div>
        )}</div>
    </>
  )
}

async function uploadAdminVideo(file) {
  const sig = await api.post('/admin/uploads/video-signature')
  const fd = new FormData()
  fd.append('file', file); fd.append('api_key', sig.apiKey); fd.append('timestamp', sig.timestamp); fd.append('folder', sig.folder); fd.append('signature', sig.signature)
  const res = await fetch(sig.uploadUrl, { method: 'POST', body: fd })
  const j = await res.json().catch(() => ({}))
  if (!res.ok || !j.public_id) throw new Error((j.error && j.error.message) || 'Video upload failed.')
  return j.public_id
}

export function Campaigns() {
  const c = useApi('/admin/campaigns')
  const [msg, setMsg] = useState(null)
  const [f, setF] = useState({ name: '', sponsor: '', title: '', rewardNaira: 50, rateNaira: 75 })
  const [video, setVideo] = useState(null)
  const [busy, setBusy] = useState(false)
  if (c.error) return <Problem error={c.error} onRetry={c.reload} />
  if (!c.data) return <Loading />
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const create = async (e) => {
    e.preventDefault(); setMsg(null)
    if (!video) return setMsg({ error: 'Choose the sponsor video file.' })
    setBusy(true)
    try {
      const videoPublicId = await uploadAdminVideo(video)
      await api.post('/admin/campaigns', { name: f.name, sponsor: f.sponsor, title: f.title, videoPublicId, rewardKobo: toKobo(f.rewardNaira), advertiserRateKobo: toKobo(f.rateNaira) })
      setMsg({ ok: 'Campaign created and waiting for prepayment. It cannot go live until funds clear.' }); setVideo(null); c.reload()
    } catch (err) { setMsg({ error: err.message }) } finally { setBusy(false) }
  }
  const fund = (x) => {
    const amt = ask(`Cleared prepayment amount in ₦ for "${x.name}" (${naira(x.advertiserRateKobo)} per view):`)
    if (amt === null) return
    const ref = ask('Cleared payment reference (bank/PSP):')
    if (ref === null) return
    act(setMsg, c.reload, () => api.post(`/admin/campaigns/${x.id}/fund`, { amountKobo: toKobo(amt), reference: ref }), 'Campaign funded and live.')
  }
  const review = (x, approve) => {
    let reason
    if (!approve) { reason = ask('Reason for rejecting this video (refund is handled separately):'); if (reason === null) return }
    act(setMsg, c.reload, () => api.post(`/admin/campaigns/${x.id}/content`, approve ? { approve: true } : { approve: false, reason }), approve ? 'Campaign is live.' : 'Video rejected and campaign closed.')
  }
  const setStatus = (x, status) => {
    const reason = ask(`Reason to set "${x.name}" to ${status}:`)
    if (reason === null) return
    act(setMsg, c.reload, () => api.patch(`/admin/campaigns/${x.id}/status`, { status, reason }), 'Updated.')
  }
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Campaigns</h1>
      <Msg m={msg} />
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Campaign</th><th>Sponsor</th><th>Reward / advertiser rate</th><th>Budget</th><th>Used</th><th>Completions</th><th>Status</th><th /></tr></thead>
        <tbody>{c.data.campaigns.map((x) => (
          <tr key={x.id}>
            <td><b>{x.name}</b><div className="small muted">{x.title}</div></td><td>{x.sponsor}</td>
            <td>{naira(x.rewardKobo)} / {naira(x.advertiserRateKobo)}</td>
            <td>{naira(x.budgetKobo)}<div className="small muted">{x.prepaymentRef || 'no prepayment'}</div></td>
            <td>{naira(x.consumedKobo)}</td><td>{x.completions} / {x.completionCap}</td><td><StatusPill status={x.status} /></td>
            <td className="row">
              {x.status === 'CONTENT_REVIEW' ? <button className="btn sm" onClick={() => review(x, true)}>Approve &amp; go live</button> : null}
              {x.status === 'CONTENT_REVIEW' ? <button className="btn sm danger" onClick={() => review(x, false)}>Reject video</button> : null}
              {x.status === 'PENDING_REVIEW' ? <button className="btn sm" onClick={() => fund(x)}>Record prepayment</button> : null}
              {x.status === 'ACTIVE' ? <button className="btn sm ghost" onClick={() => setStatus(x, 'PAUSED')}>Pause</button> : null}
              {x.status === 'PAUSED' ? <button className="btn sm ghost" onClick={() => setStatus(x, 'ACTIVE')}>Resume</button> : null}
              {['ACTIVE', 'PAUSED'].includes(x.status) ? <button className="btn sm ghost" onClick={() => setStatus(x, 'CLOSED')}>Close</button> : null}
            </td>
          </tr>))}</tbody></table></div>
        {c.data.campaigns.length === 0 ? <p className="muted">No campaigns yet.</p> : null}</div>

      <form className="card stack" onSubmit={create}>
        <h2>New house campaign</h2>
        <p className="muted small">For an advertiser who pays outside the package checkout. It starts unfunded; after their prepayment clears, use "Record prepayment" to take it live. The advertiser rate must cover the member reward.</p>
        <div className="grid g2">
          <div className="field"><label>Campaign name</label><input value={f.name} onChange={set('name')} /></div>
          <div className="field"><label>Sponsor (advertiser)</label><input value={f.sponsor} onChange={set('sponsor')} /></div>
          <div className="field"><label>Video title</label><input value={f.title} onChange={set('title')} /></div>
          <div className="field"><label>Video file (10 to 120 s)</label><input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0] || null)} /></div>
          <div className="field"><label>Member reward (₦)</label><input value={f.rewardNaira} onChange={set('rewardNaira')} inputMode="decimal" /></div>
          <div className="field"><label>Advertiser rate per view (₦)</label><input value={f.rateNaira} onChange={set('rateNaira')} inputMode="decimal" /></div>
        </div>
        <button className="btn" disabled={busy}>{busy ? 'Uploading…' : 'Create campaign'}</button>
      </form>
    </>
  )
}

export function Withdrawals() {
  const w = useApi('/admin/withdrawals')
  const [msg, setMsg] = useState(null)
  if (w.error) return <Problem error={w.error} onRetry={w.reload} />
  if (!w.data) return <Loading />
  const move = (x, to) => {
    let body
    if (to === 'rejected') { const reason = ask('Reason (shown to the member):'); if (reason === null) return; body = { reason } }
    if (to === 'paid') { const payoutRef = ask('Bank transfer reference confirming the payout:'); if (payoutRef === null) return; body = { payoutRef } }
    const path = { approved: 'approve', rejected: 'reject', paid: 'paid' }[to]
    act(setMsg, w.reload, () => api.post(`/admin/withdrawals/${x.id}/${path}`, body), 'Updated.')
  }
  const NEXT = { PENDING: ['approved', 'rejected'], APPROVED: ['paid', 'rejected'] }
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Withdrawals</h1>
      <div className="notice">Approval is not payment. "Paid" can only be set with the bank transfer reference. Rejecting returns the full amount to the member's balance.</div>
      <Msg m={msg} />
      <div className="card">{w.data.withdrawals.length === 0 ? <p className="muted">No withdrawal requests yet.</p> : (
        <div className="table-wrap"><table><thead><tr><th>Requested</th><th>Member</th><th>Amount</th><th>Pay to</th><th>Status</th><th /></tr></thead>
          <tbody>{w.data.withdrawals.map((x) => (
            <tr key={x.id}><td>{fmtTime(x.createdAt)}</td><td>{x.user?.email}<div className="small muted">{x.user?.phone}</div></td>
              <td>{naira(x.amountKobo)}<div className="small muted">pay {naira(x.netKobo)} after {naira(x.feeKobo)} fee</div></td>
              <td>{x.bankName}<div className="small muted">{x.accountName} · {x.accountNumber}</div></td>
              <td><StatusPill status={x.status} />{x.payoutRef ? <div className="small muted">ref {x.payoutRef}</div> : null}{x.rejectReason ? <div className="small muted">{x.rejectReason}</div> : null}</td>
              <td className="row">{(NEXT[x.status] || []).map((to) => <button key={to} className={'btn sm' + (to === 'rejected' ? ' danger' : ' ghost')} onClick={() => move(x, to)}>{to}</button>)}</td></tr>))}</tbody></table></div>
      )}</div>
    </>
  )
}

export function Members() {
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const m = useApi(`/admin/users?page=1${applied ? `&search=${encodeURIComponent(applied)}` : ''}`)
  const [msg, setMsg] = useState(null)
  const toggle = (u) => {
    const next = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    const reason = ask(`Reason to set ${u.email} to ${next}:`)
    if (reason === null) return
    act(setMsg, m.reload, () => api.patch(`/admin/users/${u.id}/status`, { status: next, reason }), 'Updated.')
  }
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Members</h1>
      <Msg m={msg} />
      <form className="row" onSubmit={(e) => { e.preventDefault(); setApplied(q.trim()) }}>
        <input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" style={{ flex: 1 }} />
        <button className="btn">Search</button>
      </form>
      {m.error ? <Problem error={m.error} onRetry={m.reload} /> : !m.data ? <Loading /> : (
        <div className="card"><p className="muted small">{m.data.total} member(s)</p><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Total deposits</th><th>Balance</th><th>Status</th><th /></tr></thead>
          <tbody>{m.data.users.map((u) => (<tr key={u.id}><td>{u.name}{u.verified ? '' : <div className="small muted">not verified</div>}</td><td>{u.email}</td><td>{fmtTime(u.createdAt)}</td><td>{naira(u.totalDepositsKobo)}</td><td>{naira(u.balanceKobo)}</td><td><StatusPill status={u.status} /></td>
            <td><button className="btn sm ghost" onClick={() => toggle(u)}>{u.status === 'SUSPENDED' ? 'Restore' : 'Suspend'}</button></td></tr>))}</tbody></table></div>
          {m.data.users.length === 0 ? <p className="muted">No members found.</p> : null}</div>
      )}
    </>
  )
}

function SettingsForm({ cur, onDone, setMsg }) {
  const [f, setF] = useState({
    dailyCap: cur.dailyCap, minWithdrawal: cur.minWithdrawalKobo / 100, fee: cur.withdrawalFeeKobo / 100, referralReward: cur.referralRewardKobo / 100, reason: '',
    pkgs: cur.packages.map((p) => ({ id: p.id, name: p.name, price: p.priceKobo / 100, completions: p.completions, reward: p.memberRewardKobo / 100 })),
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setPkg = (i, k) => (e) => setF({ ...f, pkgs: f.pkgs.map((p, j) => (j === i ? { ...p, [k]: e.target.value } : p)) })
  const propose = async (e) => {
    e.preventDefault()
    const next = {
      dailyCap: Number(f.dailyCap), minWithdrawalKobo: toKobo(f.minWithdrawal), withdrawalFeeKobo: toKobo(f.fee), referralRewardKobo: toKobo(f.referralReward),
      packages: f.pkgs.map((p) => ({ id: p.id, name: p.name, priceKobo: toKobo(p.price), completions: Number(p.completions), memberRewardKobo: toKobo(p.reward) })),
    }
    const changes = Object.fromEntries(Object.entries(next).filter(([k, v]) => JSON.stringify(cur[k]) !== JSON.stringify(v)))
    if (!Object.keys(changes).length) return setMsg({ error: 'Nothing has changed.' })
    try { await api.post('/admin/settings/proposals', { changes, reason: f.reason }); setMsg({ ok: 'Change submitted. A different admin must approve it before it takes effect.' }); setF({ ...f, reason: '' }); onDone() }
    catch (err) { setMsg({ error: err.message }) }
  }
  return (
    <form className="card stack" onSubmit={propose}>
      <h2>Current settings (version {cur.version})</h2>
      <div className="grid g2">
        <div className="field"><label>Daily video cap per member</label><input value={f.dailyCap} onChange={set('dailyCap')} inputMode="numeric" /></div>
        <div className="field"><label>Minimum withdrawal (₦)</label><input value={f.minWithdrawal} onChange={set('minWithdrawal')} inputMode="decimal" /></div>
        <div className="field"><label>Withdrawal fee (₦, deducted from payout)</label><input value={f.fee} onChange={set('fee')} inputMode="decimal" /></div>
        <div className="field"><label>Referral reward (₦, 0 = none; paid only from campaign margin)</label><input value={f.referralReward} onChange={set('referralReward')} inputMode="decimal" /></div>
      </div>
      <h3 style={{ marginTop: 8 }}>Advertiser packages</h3>
      <p className="muted small">Price is paid by the advertiser. The member reward per view is paid from it and cannot exceed price ÷ views. Changes apply to new orders only.</p>
      <div className="table-wrap"><table><thead><tr><th>Package</th><th>Price (₦)</th><th>Views included</th><th>Member reward per view (₦)</th></tr></thead>
        <tbody>{f.pkgs.map((p, i) => (<tr key={p.id}><td><b>{p.name}</b></td>
          <td><input aria-label={`${p.name} price`} value={p.price} onChange={setPkg(i, 'price')} inputMode="decimal" /></td>
          <td><input aria-label={`${p.name} views`} value={p.completions} onChange={setPkg(i, 'completions')} inputMode="numeric" /></td>
          <td><input aria-label={`${p.name} reward`} value={p.reward} onChange={setPkg(i, 'reward')} inputMode="decimal" /></td></tr>))}</tbody></table></div>
      <div className="field"><label>Reason for change (required)</label><input value={f.reason} onChange={set('reason')} /></div>
      <button className="btn">Submit for second review</button>
    </form>
  )
}

export function Settings() {
  const { user } = useAuth()
  const s = useApi('/admin/settings')
  const [msg, setMsg] = useState(null)
  if (s.error) return <Problem error={s.error} onRetry={s.reload} />
  if (!s.data) return <Loading />
  const { current, history, proposals } = s.data
  const pending = proposals.filter((p) => p.status === 'PENDING')
  const decide = (id, ok) => {
    let body
    if (!ok) { const reason = ask('Reason for rejecting:'); if (reason === null) return; body = { reason } }
    act(setMsg, s.reload, () => api.post(`/admin/settings/proposals/${id}/${ok ? 'approve' : 'reject'}`, body), ok ? 'Approved and applied (new version).' : 'Rejected.')
  }
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Settings</h1>
      <div className="notice green">Every change is versioned, attributed and needs a second reviewer. Changes apply to future activity only: they never alter completed or in-progress videos.</div>
      <Msg m={msg} />
      {pending.length ? (
        <div className="card stack"><h2>Waiting for review</h2>
          {pending.map((p) => {
            const mine = p.proposedBy === user.id
            return (
              <div key={p.id} className="row between"><div><b>{JSON.stringify(p.changes)}</b><div className="small muted">By {p.proposedByEmail} · {fmtTime(p.createdAt)} · "{p.reason}"</div></div>
                <div className="row"><button className="btn sm" disabled={mine} onClick={() => decide(p.id, true)}>Approve</button><button className="btn sm ghost" disabled={mine} onClick={() => decide(p.id, false)}>Reject</button></div></div>
            )
          })}
          <p className="small muted">You can't review your own change. Another admin must approve it.</p></div>
      ) : null}
      <SettingsForm key={current.version} cur={current} onDone={s.reload} setMsg={setMsg} />
      <div className="card"><h2>Version history</h2><div className="table-wrap"><table>
        <thead><tr><th>Version</th><th>Effective</th><th>Cap</th><th>Min. withdrawal</th><th>Fee</th><th>Referral reward</th><th>Packages</th><th>By</th><th>Reason</th></tr></thead>
        <tbody>{history.map((v) => (<tr key={v.version}><td>v{v.version}</td><td>{fmtTime(v.effectiveAt)}</td><td>{v.dailyCap}</td><td>{naira(v.minWithdrawalKobo)}</td><td>{naira(v.withdrawalFeeKobo)}</td><td>{naira(v.referralRewardKobo)}</td><td className="small">{(v.packages || []).map((p) => `${p.name} ${naira(p.priceKobo)}/${p.completions}v/${naira(p.memberRewardKobo)}`).join(' · ')}</td><td>{v.by}</td><td>{v.reason}</td></tr>))}</tbody></table></div></div>
    </>
  )
}

export function AuditLog() {
  const a = useApi('/admin/audit')
  if (a.error) return <Problem error={a.error} onRetry={a.reload} />
  if (!a.data) return <Loading />
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Audit log</h1>
      <div className="card"><div className="table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead>
        <tbody>{a.data.logs.map((x) => (<tr key={x.id}><td>{fmtTime(x.createdAt)}</td><td>{x.actor}</td><td>{x.action}</td><td>{x.detail}</td></tr>))}</tbody></table>
        {a.data.logs.length === 0 ? <p className="muted">No events yet.</p> : null}</div></div>
    </>
  )
}

function download(name, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

// Read-only summary for regulators: where the money comes from and where it goes.
export function Regulator() {
  const r = useApi('/admin/regulator')
  const [err, setErr] = useState('')
  if (r.error) return <Problem error={r.error} onRetry={r.reload} />
  if (!r.data) return <Loading />
  const d = r.data
  const cfg = d.settings
  const exp = async (kind) => {
    setErr('')
    try {
      if (kind === 'ledger') { const x = await api.get('/admin/ledger'); download('ledger.csv', [['id', 'user', 'type', 'amount_kobo', 'campaign', 'note', 'time'], ...x.entries.map((e) => [e.id, e.user, e.type, e.amountKobo, e.campaign, e.note, e.createdAt])]) }
      if (kind === 'audit') { const x = await api.get('/admin/audit'); download('audit.csv', [['time', 'actor', 'action', 'detail'], ...x.logs.map((a) => [a.createdAt, a.actor, a.action, a.detail])]) }
      if (kind === 'campaigns') { const x = await api.get('/admin/campaigns'); download('campaigns.csv', [['id', 'name', 'sponsor', 'budget_kobo', 'consumed_kobo', 'completions', 'cap', 'status', 'prepayment_ref'], ...x.campaigns.map((c) => [c.id, c.name, c.sponsor, c.budgetKobo, c.consumedKobo, c.completions, c.completionCap, c.status, c.prepaymentRef])]) }
    } catch (e) { setErr(e.message) }
  }
  return (
    <>
      <h1 style={{ fontSize: '1.8rem' }}>Regulator view</h1>
      <div className="notice green">Read-only summary. Member activation fees: <b>none</b>. Member payment to join: <b>none</b>. Withdrawal gated by referrals: <b>no</b>. Advertiser package deposits are the only incoming funds.</div>
      <div className="grid g3">
        <Stat label="Advertiser funds received" value={naira(d.fundedKobo)} hint="Cleared campaign budgets" />
        <Stat label="Package deposits (confirmed)" value={naira(d.depositsKobo)} hint="Paystack, Flutterwave and approved transfers" />
        <Stat label="Budget consumed" value={naira(d.consumedKobo)} hint="Advertiser-billable completions" />
        <Stat label="Rewards credited to members" value={naira(d.rewardsCreditedKobo)} hint="Validated completions and referral bonuses" />
        <Stat label="Reward liability" value={naira(d.liabilityKobo)} hint="Member balances owed, not yet requested" />
        <Stat label="Held in withdrawal requests" value={naira(d.heldInWithdrawalsKobo)} hint="Pending or approved" />
        <Stat label="Paid out" value={naira(d.paidOutKobo)} hint="After fees, confirmed by reference" />
      </div>
      <div className="card stack">
        <h2>Coverage check</h2>
        <p className="muted">Remaining prepaid budget: <b>{naira(d.fundedKobo - d.consumedKobo)}</b>. Rewards credited: <b>{naira(d.rewardsCreditedKobo)}</b>. Budget consumed minus rewards credited is the platform's gross contribution before costs: <b>{naira(d.consumedKobo - d.rewardsCreditedKobo)}</b>.</p>
        <p className="small muted">Current configuration v{cfg.version}: daily cap {cfg.dailyCap}, minimum withdrawal {naira(cfg.minWithdrawalKobo)}, fee {naira(cfg.withdrawalFeeKobo)} deducted from payout, referral reward {naira(cfg.referralRewardKobo)}.</p>
      </div>
      {err ? <div className="notice red" role="alert">{err}</div> : null}
      <div className="row">
        <button className="btn ghost" onClick={() => exp('ledger')}>Export ledger (CSV)</button>
        <button className="btn ghost" onClick={() => exp('audit')}>Export audit log (CSV)</button>
        <button className="btn ghost" onClick={() => exp('campaigns')}>Export campaigns (CSV)</button>
      </div>
      <p className="small muted">API: {API_URL}</p>
    </>
  )
}
