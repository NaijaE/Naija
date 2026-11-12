import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, useApi, naira, fmtTime, PAY_METHODS } from '../api.js'
import { uploadVideoToCloudinary, videoFileProblem } from '../upload.js'
import { Stat } from '../components/Shell.jsx'
import { company as c } from '../company.js'

const Loading = () => <p className="muted">Loading…</p>
const Problem = ({ error, onRetry }) => (
  <div className="notice red" role="alert">{error.message} {onRetry ? <button className="btn ghost sm" onClick={onRetry}>Try again</button> : null}</div>
)

const STATUS = {
  NEEDS_VIDEO: ['Add your video', 'orange'], LIVE: ['Live', ''], IN_REVIEW: ['In review', 'orange'], PAYMENT_REVIEW: ['Checking your transfer', 'orange'], WAITING_PAYMENT: ['Waiting for payment', 'orange'],
  PAUSED: ['Paused', 'grey'], COMPLETED: ['Completed', ''], CLOSED: ['Stopped', 'grey'], REJECTED: ['Video not approved', 'red'],
  PAYMENT_REJECTED: ['Payment rejected', 'red'], CANCELLED: ['Cancelled', 'grey'],
}
export const CampaignPill = ({ status }) => {
  const [label, tone] = STATUS[status] || [status, 'grey']
  return <span className={'pill ' + tone}>{label}</span>
}
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0)

export function MyCampaigns() {
  const q = useApi('/advertiser/campaigns')
  if (q.error) return <Problem error={q.error} onRetry={q.reload} />
  if (!q.data) return <Loading />
  const { summary: s, items } = q.data
  return (
    <>
      <div className="row between">
        <div><h1 style={{ fontSize: '1.8rem' }}>My campaigns</h1>
          <p className="muted">How your sponsor videos are doing. You see counts of validated views, never who watched.</p></div>
        <Link className="btn orange" to="/app/advertise">Buy a package</Link>
      </div>

      {s.campaigns > 0 ? (
        <div className="grid g3">
          <Stat label="Total spent" value={naira(s.totalSpentKobo)} hint="Confirmed packages" />
          <Stat label="Views delivered" value={`${s.viewsDelivered.toLocaleString()} of ${s.viewsPurchased.toLocaleString()}`} hint={`${s.viewsRemaining.toLocaleString()} still to deliver`} />
          <Stat label="Budget remaining" value={naira(s.budgetRemainingKobo)} hint="Prepaid, not yet used" />
          <Stat label="Live now" value={s.live} hint={s.inReview ? `${s.inReview} waiting for review` : 'Showing to members'} />
        </div>
      ) : null}
      {s.needsVideo ? <div className="notice" role="status"><b>{s.needsVideo} paid package{s.needsVideo === 1 ? '' : 's'} need{s.needsVideo === 1 ? 's' : ''} a video.</b> Open it below and press <b>Add video</b>. Members cannot watch anything until a video is approved.</div> : null}
      {s.waitingPayment ? <div className="notice">You have {s.waitingPayment} order(s) waiting for payment. Open one and use "Check payment" on the Advertise page if you have already paid.</div> : null}
      {s.refundDueKobo ? <div className="notice red" role="alert">{naira(s.refundDueKobo)} is due back to you for a video that was not approved. Please contact <Link to="/support">support</Link> with the campaign details.</div> : null}

      {items.length === 0 ? (
        <div className="card stack"><h2>No campaigns yet</h2>
          <p className="muted">Choose a package, add your sponsor video, and members will be rewarded for watching it to the end.</p>
          <div><Link className="btn" to="/app/advertise">Buy your first package</Link></div></div>
      ) : (
        <div className="stack">
          {items.map((i) => (
            <div key={i.id} className="card stack">
              <div className="row between">
                <div><h3 style={{ margin: 0 }}>{i.title}</h3><div className="muted small">{i.packageName} package · ordered {fmtTime(i.createdAt)}</div></div>
                <CampaignPill status={i.status} />
              </div>
              <div>
                <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={i.viewsPurchased} aria-valuenow={i.viewsDelivered}><i style={{ width: `${pct(i.viewsDelivered, i.viewsPurchased)}%` }} /></div>
                <div className="row between small muted" style={{ marginTop: 6 }}>
                  <span>{i.viewsDelivered.toLocaleString()} of {i.viewsPurchased.toLocaleString()} views delivered</span>
                  <span>{naira(i.priceKobo)} · {naira(i.advertiserRateKobo)} per view</span>
                </div>
              </div>
              {i.estimatedDaysLeft != null && i.status === 'LIVE' ? <p className="small muted">{i.estimatedDaysLeft === 0 ? 'About to finish.' : `At the current pace, about ${i.estimatedDaysLeft} day${i.estimatedDaysLeft === 1 ? '' : 's'} left.`} This is only an estimate.</p> : null}
              <div className="row">
                {i.needsVideo ? <Link className="btn sm orange" to={`/app/campaigns/${i.id}`}>Add video</Link> : null}
                <Link className={'btn sm' + (i.needsVideo ? ' ghost' : '')} to={`/app/campaigns/${i.id}`}>Details</Link>
                {i.hasReceipt ? <Link className="btn sm ghost" to={`/app/receipt/${i.id}`}>Receipt</Link> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// Bars for validated views per day. Plain SVG, with a text summary for screen readers.
function DailyBars({ daily }) {
  const total = daily.reduce((a, d) => a + d.views, 0)
  const max = Math.max(1, ...daily.map((d) => d.views))
  const W = 600; const H = 150; const bw = W / daily.length
  const short = (d) => d.slice(5)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={`Validated views per day for the last ${daily.length} days: ${total} in total`} style={{ width: '100%', height: 'auto' }}>
        <line x1="0" y1={H} x2={W} y2={H} stroke="var(--line)" />
        {daily.map((d, i) => {
          const h = Math.round((d.views / max) * (H - 14))
          return (
            <rect key={d.date} x={i * bw + 2} y={H - h} width={bw - 4} height={h} rx="3" fill="var(--green-500)">
              <title>{`${d.date}: ${d.views} view${d.views === 1 ? '' : 's'}`}</title>
            </rect>
          )
        })}
        <text x="0" y={H + 17} fontSize="11" fill="var(--muted)">{short(daily[0].date)}</text>
        <text x={W / 2} y={H + 17} fontSize="11" fill="var(--muted)" textAnchor="middle">{short(daily[Math.floor(daily.length / 2)].date)}</text>
        <text x={W} y={H + 17} fontSize="11" fill="var(--muted)" textAnchor="end">{short(daily[daily.length - 1].date)}</text>
        <text x={W} y="11" fontSize="11" fill="var(--muted)" textAnchor="end">peak {max}</text>
      </svg>
      <p className="small muted">{total.toLocaleString()} validated view{total === 1 ? '' : 's'} in the last {daily.length} days.</p>
    </div>
  )
}

// Step 2 of advertising: add the video to a package that has been paid for.
function AddVideo({ orderId, returnedReason, onDone }) {
  const all = useApi('/advertiser/campaigns')
  const seen = new Set()
  const earlier = ((all.data && all.data.items) || []).filter((i) => i.videoPublicId && i.id !== orderId && !seen.has(i.videoPublicId) && seen.add(i.videoPublicId))
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [reuse, setReuse] = useState('')
  const [busy, setBusy] = useState('')
  const [pct, setPct] = useState(0)
  const [msg, setMsg] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (title.trim().length < 3) return setMsg({ bad: true, text: 'Enter a title for your video.' })
    if (!file && !reuse) return setMsg({ bad: true, text: 'Choose a video file, or pick one you used before.' })
    if (file) { const p = videoFileProblem(file); if (p) return setMsg({ bad: true, text: p }) }
    try {
      let videoPublicId = reuse
      if (file) { setPct(0); setBusy('Uploading'); videoPublicId = await uploadVideoToCloudinary(file, '/uploads/video-signature', setPct) }
      setBusy('Submitting…')
      await api.post(`/advertiser/campaigns/${orderId}/video`, { title: title.trim(), videoPublicId })
      setMsg({ text: 'Video submitted. We will review it and it will go live once approved.' })
      onDone()
    } catch (err) { setMsg({ bad: true, text: err.message }) } finally { setBusy('') }
  }
  return (
    <form className="card stack" onSubmit={submit}>
      <h2>Add your video</h2>
      {returnedReason ? <div className="notice red" role="alert"><b>Your last video was sent back.</b> Reason: {returnedReason}. Your payment is still safe. Please upload a corrected video.</div> : null}
      <p className="muted small">Your payment is confirmed. Add the video members will watch. It must be 10 to 120 seconds long and under 100 MB. It must be your own or properly licensed, lawful, truthful and not misleading. Every video is reviewed before it goes live.</p>
      {msg ? <div className={'notice ' + (msg.bad ? 'red' : 'green')} role={msg.bad ? 'alert' : 'status'}>{msg.text}</div> : null}
      <div className="field"><label htmlFor="avt">Video title</label><input id="avt" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label htmlFor="avf">Video file</label><input id="avf" type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0] || null)} /></div>
      {earlier.length ? (
        <div className="field"><label htmlFor="avr">Or use a video from an earlier campaign</label>
          <select id="avr" value={reuse} onChange={(e) => setReuse(e.target.value)} disabled={!!file}>
            <option value="">Choose…</option>{earlier.map((i) => <option key={i.videoPublicId} value={i.videoPublicId}>{i.title}</option>)}
          </select></div>
      ) : null}
      {busy === 'Uploading' ? <div><div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{ width: `${pct}%` }} /></div><p className="small muted">Uploading your video… {pct}%. Keep this page open until it finishes.</p></div> : null}
      <button className="btn" disabled={!!busy}>{busy === 'Uploading' ? `Uploading… ${pct}%` : busy || 'Submit video for review'}</button>
    </form>
  )
}

export function CampaignDetail() {
  const { id } = useParams()
  const q = useApi(`/advertiser/campaigns/${id}`)
  if (q.error) return <Problem error={q.error} onRetry={q.reload} />
  if (!q.data) return <Loading />
  const { item: i, timeline, daily, videoUrl, ref } = q.data
  const left = Math.max(0, i.viewsPurchased - i.viewsDelivered)
  return (
    <>
      <div>
        <Link to="/app/campaigns">← My campaigns</Link>
        <div className="row between" style={{ marginTop: 8 }}>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>{i.title}</h1><CampaignPill status={i.status} />
        </div>
        <p className="muted">{i.packageName} package · ordered {fmtTime(i.createdAt)}</p>
      </div>

      {i.status === 'REJECTED' ? <div className="notice red" role="alert"><b>Your video was not approved.</b> {i.rejectReason ? `Reason: ${i.rejectReason}. ` : ''}A refund of {naira(i.priceKobo)} is due. Please contact <Link to="/support">support</Link> and quote this campaign.</div> : null}
      {i.status === 'PAYMENT_REJECTED' ? <div className="notice red" role="alert"><b>Your payment was rejected.</b> {i.rejectReason ? `Reason: ${i.rejectReason}. ` : ''}You can place a new order from the Advertise page.</div> : null}
      {i.status === 'NEEDS_VIDEO' ? <AddVideo orderId={id} returnedReason={i.videoRejectReason} onDone={q.reload} /> : null}
      {i.status === 'WAITING_PAYMENT' ? <div className="notice">This order is waiting for payment. If you have already paid, open the <Link to="/app/advertise">Advertise page</Link> and press "Check payment".</div> : null}
      {i.status === 'PAYMENT_REVIEW' ? <div className="notice">We have your bank transfer and proof of payment. An admin will confirm it against our bank statement.</div> : null}
      {i.status === 'IN_REVIEW' ? <div className="notice">Payment confirmed. We review every video before it goes live, and you will see it here as soon as it is approved.</div> : null}

      <div className="grid g3">
        <Stat label="Views delivered" value={i.viewsDelivered.toLocaleString()} hint={`of ${i.viewsPurchased.toLocaleString()} purchased`} />
        <Stat label="Still to deliver" value={left.toLocaleString()} hint={i.estimatedDaysLeft != null && i.status === 'LIVE' ? `about ${i.estimatedDaysLeft} day(s) at this pace` : 'validated views'} />
        <Stat label="Cost per view" value={naira(i.advertiserRateKobo)} hint={`${naira(i.priceKobo)} package`} />
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={i.viewsPurchased} aria-valuenow={i.viewsDelivered}><i style={{ width: `${pct(i.viewsDelivered, i.viewsPurchased)}%` }} /></div>

      <div className="card stack"><h2>Views per day</h2><DailyBars daily={daily} /></div>

      <div className="grid g2">
        <div className="card stack"><h2>Progress</h2>
          <ol className="timeline">
            {timeline.map((e) => (
              <li key={e.key}><b>{e.label}</b><div className="small muted">{fmtTime(e.at)}{e.note ? ` · ${e.note}` : ''}</div></li>
            ))}
          </ol>
        </div>
        <div className="card stack"><h2>Your video</h2>
          {!videoUrl && i.status === 'NEEDS_VIDEO' ? <p className="muted">No video added yet.</p> : null}
          {videoUrl ? <video src={videoUrl} controls preload="metadata" playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} /> : <p className="muted">No preview available.</p>}
        </div>
      </div>

      <div className="card stack">
        <h2>Payment</h2>
        <p><b>Amount:</b> {naira(i.priceKobo)} · <b>Method:</b> {PAY_METHODS[i.method]}{ref ? <> · <b>Reference:</b> {ref}</> : null}</p>
        <div className="row">
          {i.hasReceipt ? <Link className="btn" to={`/app/receipt/${i.id}`}>View receipt</Link> : null}
        </div>
      </div>
    </>
  )
}

export function Receipt() {
  const { id } = useParams()
  const q = useApi(`/advertiser/receipts/${id}`)
  if (q.error) return <Problem error={q.error} onRetry={q.reload} />
  if (!q.data) return <Loading />
  const r = q.data
  return (
    <>
      <div className="row between no-print">
        <Link to={`/app/campaigns/${id}`}>← Back to campaign</Link>
        <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
      </div>
      <article className="card receipt">
        <header className="row between" style={{ alignItems: 'flex-start' }}>
          <div><h2 style={{ margin: 0 }}>{c.name}</h2>
            <div className="small muted">{c.tradingName}<br />RC {c.rcNumber} · TIN {c.tin}<br />{c.address}<br />{c.supportEmail} · {c.supportPhone}</div></div>
          <div style={{ textAlign: 'right' }}><h1 style={{ margin: 0, fontSize: '1.5rem' }}>RECEIPT</h1>
            <div className="small muted">No. {r.receiptNumber}<br />{fmtTime(r.issuedAt)}</div></div>
        </header>
        <hr />
        <p className="small muted" style={{ marginBottom: 4 }}>Received from</p>
        <p style={{ marginTop: 0 }}><b>{r.buyer.name}</b><br />{r.buyer.email}<br />{r.buyer.phone}</p>
        <table>
          <thead><tr><th>Description</th><th>Validated views</th><th>Per view</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
          <tbody><tr><td>{r.description}</td><td>{r.views.toLocaleString()}</td><td>{naira(r.advertiserRateKobo)}</td><td style={{ textAlign: 'right' }}>{naira(r.amountKobo)}</td></tr></tbody>
          <tfoot><tr><td colSpan="3" style={{ textAlign: 'right' }}><b>Total paid</b></td><td style={{ textAlign: 'right' }}><b>{naira(r.amountKobo)}</b></td></tr></tfoot>
        </table>
        <p className="small">Paid by {PAY_METHODS[r.method]}. Payment reference: <b>{r.reference}</b></p>
        <p className="small muted">{c.vatNote}</p>
        <p className="small muted">This receipt confirms payment for an advertising package. Views are counted only when a member watches the full video and our system validates it. Thank you for advertising with {c.tradingName}.</p>
      </article>
    </>
  )
}
