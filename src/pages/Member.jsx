import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, useApi, useAuth, usePublicConfig, naira, fmtTime, lagosDate, toKobo, BANKS } from '../api.js'
import { Stat, StatusPill } from '../components/Shell.jsx'
import { DepositTable } from './Advertise.jsx'

const Loading = () => <p className="muted">Loading…</p>
const Problem = ({ error, onRetry }) => (
  <div className="notice red" role="alert">{error.message} {onRetry ? <button className="btn ghost sm" onClick={onRetry}>Try again</button> : null}</div>
)
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0)
const maskAcct = (n) => '******' + String(n).slice(-4)

export function Dashboard() {
  const { user } = useAuth()
  const { cfg } = usePublicConfig()
  const dash = useApi('/me/dashboard')
  const vids = useApi('/videos')
  const adv = useApi('/advertiser/campaigns')
  if (dash.error) return <Problem error={dash.error} onRetry={dash.reload} />
  if (!dash.data || !cfg) return <Loading />
  const d = dash.data
  const live = ((vids.data && vids.data.videos) || []).filter((v) => !v.watched)
  const paidOut = sum(d.withdrawals.filter((w) => w.status === 'PAID'), (w) => w.netKobo)
  const held = sum(d.withdrawals.filter((w) => ['PENDING', 'APPROVED'].includes(w.status)), (w) => w.amountKobo)
  const canWithdraw = d.balanceKobo >= d.minWithdrawalKobo
  return (
    <>
      <div>
        <h1 style={{ fontSize: '1.8rem' }}>Hello, {user.name.split(' ')[0]}</h1>
        <p className="muted">Your account is active. Joining was free: nothing was charged to you.</p>
        <span className={'pill' + (d.advertiserStatus === 'SUBSCRIBED' ? '' : ' grey')}>Advertiser status: {d.advertiserStatus === 'SUBSCRIBED' ? 'Subscribed' : 'Free'}</span>
      </div>

      {adv.data && adv.data.summary.needsVideo > 0 ? (
        <div className="notice" role="status"><b>You have {adv.data.summary.needsVideo} paid package{adv.data.summary.needsVideo === 1 ? '' : 's'} waiting for a video.</b> <Link to="/app/campaigns">Add your video</Link> so members can start watching it.</div>
      ) : null}

      <div className="card stat hero">
        <div className="label">Daily video limit</div>
        <div className="value">{d.watchedToday} of {d.dailyCap} watched today</div>
        <div className="hint">Resets at midnight (Africa/Lagos). Only approved sponsor videos earn rewards; YouTube views never do.</div>
      </div>

      <div className="row">
        <Link className="btn orange" to="/app/videos">Watch videos</Link>
        <Link className={'btn' + (canWithdraw ? '' : ' ghost')} to="/app/withdraw">Request withdrawal</Link>
      </div>

      <div className="grid g3">
        <Stat label="Total balance" value={naira(d.balanceKobo)} hint="Available to withdraw" />
        <Stat label="Today's earnings" value={naira(d.todayEarningsKobo)} hint="Resets at midnight (Africa/Lagos)" />
        <Stat label="Referral earnings" value={naira(d.referralEarningsKobo)} hint={`${d.verifiedReferrals} verified referral${d.verifiedReferrals === 1 ? '' : 's'} (optional)`} />
        <Stat label="Held in withdrawal requests" value={naira(held)} hint="Pending or approved, not yet paid" />
        <Stat label="Paid out" value={naira(paidOut)} hint="Confirmed bank payouts (after fees)" />
      </div>

      <div className="card stack">
        <div className="row between"><h2>Today's sponsor videos</h2><Link to="/app/videos">See all</Link></div>
        {live.length === 0 ? <div className="notice">No funded campaigns are available right now. Check back soon.</div> : (
          live.slice(0, 2).map((c) => (
            <div key={c.id} className="row between">
              <div><b>{c.title}</b><div className="muted small">{c.sponsor} · {c.durationSec}s · {naira(c.rewardKobo)} reward</div></div>
              <Link className="btn sm" to={`/app/watch/${c.id}`}>Watch</Link>
            </div>
          ))
        )}
      </div>

      <div className="grid g2">
        <div className="card stack">
          <h2>Withdraw</h2>
          <p className="muted">Minimum {naira(cfg.minWithdrawalKobo)}. Fee {naira(cfg.withdrawalFeeKobo)}, deducted from your payout. Referrals are optional and never required.</p>
          <Link className={'btn' + (canWithdraw ? '' : ' ghost')} to="/app/withdraw">{canWithdraw ? 'Request withdrawal' : `Reach ${naira(cfg.minWithdrawalKobo)} to withdraw`}</Link>
        </div>
        <div className="card stack">
          <h2>Referrals (optional)</h2>
          <p className="muted">{d.verifiedReferrals} verified referral{d.verifiedReferrals === 1 ? '' : 's'}. {cfg.referralRewardKobo > 0 ? `Each referral that completes a first video earns ${naira(cfg.referralRewardKobo)}.` : 'Referral rewards are not currently offered.'}</p>
          <Link className="btn ghost" to="/app/referrals">Your referral code</Link>
        </div>
      </div>

      <div className="card">
        <h2>Recent activity</h2>
        {d.recentActivity.length === 0 ? <p className="muted">No activity yet. Watch a sponsor video to get started.</p> : (
          <div className="table-wrap"><table><thead><tr><th>When</th><th>What</th><th>Amount</th></tr></thead>
            <tbody>{d.recentActivity.map((e) => (<tr key={e.id}><td>{fmtTime(e.createdAt)}</td><td>{e.note || e.type.replaceAll('_', ' ')}</td><td>{e.amountKobo < 0 ? '-' : ''}{naira(Math.abs(e.amountKobo))}</td></tr>))}</tbody></table></div>
        )}
      </div>

      <div className="card">
        <div className="row between"><h2>Deposit history</h2><Link to="/app/advertise">Advertise</Link></div>
        <DepositTable orders={d.deposits} />
      </div>

      <div className="card">
        <h2>Withdrawal history</h2>
        {d.withdrawals.length === 0 ? <p className="muted">No withdrawals yet.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Requested</th><th>Amount</th><th>To</th><th>Status</th></tr></thead>
            <tbody>{d.withdrawals.map((w) => (<tr key={w.id}><td>{fmtTime(w.createdAt)}</td><td>{naira(w.amountKobo)}<div className="small muted">you receive {naira(w.netKobo)}</div></td><td>{w.bankName} {maskAcct(w.accountNumber)}</td>
              <td><StatusPill status={w.status} />{w.rejectReason ? <div className="small muted">{w.rejectReason}</div> : null}</td></tr>))}</tbody></table></div>
        )}
      </div>
    </>
  )
}

export function Videos() {
  const v = useApi('/videos')
  if (v.error) return <Problem error={v.error} onRetry={v.reload} />
  if (!v.data) return <Loading />
  const { videos, watchedToday, dailyCap, remainingToday } = v.data
  return (
    <>
      <div><h1 style={{ fontSize: '1.8rem' }}>Sponsor videos</h1>
        <p className="muted">{watchedToday} of {dailyCap} watched today · {remainingToday} slot(s) left</p></div>
      <div className="notice green">Each video shows its sponsor, length and reward before you start. The reward you see is the reward you get.</div>
      <div className="grid g2">
        {videos.map((c) => (
          <div key={c.id} className="card stack">
            <div className="row between"><span className="row"><span className="pill">Sponsor-owned · approved</span>{c.liveAt && lagosDate(new Date(c.liveAt)) === lagosDate() ? <span className="pill orange">New today</span> : null}</span><b>{naira(c.rewardKobo)}</b></div>
            <h3>{c.title}</h3>
            <p className="muted small">{c.sponsor} · {c.durationSec}s</p>
            {c.watched ? <span className="pill">Watched</span> : remainingToday === 0 ? <span className="pill grey">Daily limit reached</span> : <Link className="btn" to={`/app/watch/${c.id}`}>Watch video</Link>}
          </div>
        ))}
      </div>
      {videos.length === 0 ? <div className="notice">No funded campaigns are live right now. We only offer rewards while a campaign has cleared funds.</div> : null}
    </>
  )
}

// Real playback of the sponsor video (Cloudinary). No controls are shown and forward-seeking is blocked.
// The SERVER decides whether the view is valid: it timed the session and checks the campaign's funds.
export function Watch() {
  const { campaignId } = useParams()
  const nav = useNavigate()
  const list = useApi('/videos')
  const [session, setSession] = useState(null)
  const [pos, setPos] = useState(0)
  const [paused, setPaused] = useState(true)
  const [msg, setMsg] = useState(null)
  const [result, setResult] = useState(null)
  const [ended, setEnded] = useState(false)
  const [busy, setBusy] = useState(false)
  const vid = useRef(null)
  const maxPlayed = useRef(0)

  useEffect(() => {
    const onHide = () => { if (document.hidden && vid.current) vid.current.pause() }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  if (list.error) return <Problem error={list.error} onRetry={list.reload} />
  if (!list.data) return <Loading />
  const c = list.data.videos.find((x) => x.id === campaignId)
  if (!c) return <div className="notice red">This video is not available. <Link to="/app/videos">Back to videos</Link></div>

  const start = async () => {
    setMsg(null)
    try { setSession(await api.post(`/videos/${c.id}/start`)) } catch (e) { setMsg(e.message) }
  }
  const claim = async () => {
    setBusy(true); setMsg(null)
    try { setResult(await api.post(`/videos/sessions/${session.sessionId}/complete`)) } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  const onEnded = () => { setEnded(true); setPaused(true); claim() }
  const onTime = (e) => {
    const t = e.currentTarget.currentTime
    if (t > maxPlayed.current + 1.5) { e.currentTarget.currentTime = maxPlayed.current; return }
    maxPlayed.current = Math.max(maxPlayed.current, t)
    setPos(t)
  }
  const onSeeking = (e) => { if (e.currentTarget.currentTime > maxPlayed.current + 0.5) e.currentTarget.currentTime = maxPlayed.current }
  const toggle = () => { const v = vid.current; if (!v) return; if (v.paused) v.play(); else v.pause() }
  const total = session ? session.durationSec : c.durationSec
  const fmt = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`

  return (
    <>
      <div><Link to="/app/videos">← Back to videos</Link><h1 style={{ fontSize: '1.8rem', marginTop: 8 }}>{c.title}</h1>
        <p className="muted">{c.sponsor} · {c.durationSec}s</p></div>
      <div className="notice">Watch to the very end. Skipping ahead is not possible, and your reward is credited as soon as the server confirms a full, valid view.</div>
      {session ? (
        <div className="player" style={{ padding: 0, overflow: 'hidden' }}>
          <video
            ref={vid} src={session.videoUrl} autoPlay playsInline
            controlsList="nodownload noplaybackrate noremoteplayback" disablePictureInPicture disableRemotePlayback
            onContextMenu={(e) => e.preventDefault()}
            onPlay={() => setPaused(false)} onPause={() => setPaused(true)}
            onTimeUpdate={onTime} onSeeking={onSeeking} onEnded={onEnded}
            onError={() => setMsg('The video could not be loaded. Go back and try again.')}
            style={{ width: '100%', display: 'block', background: '#000' }}
          />
        </div>
      ) : (
        <div className="player"><span className="big" aria-hidden="true">▶</span></div>
      )}
      {session ? (
        <>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.floor(pos)}><i style={{ width: `${Math.min(100, (pos / total) * 100)}%` }} /></div>
          <div className="row between"><span className="muted">{fmt(pos)} / {fmt(total)}</span><b>{naira(c.rewardKobo)} reward</b></div>
        </>
      ) : null}
      {msg ? <div className="notice red" role="alert">{msg}</div> : null}
      {result ? (
        <div className="notice green" role="status">
          {naira(result.rewardKobo)} added to your balance.
          <div className="row" style={{ marginTop: 10 }}><button className="btn sm" onClick={() => nav('/app')}>Go to dashboard</button><button className="btn sm ghost" onClick={() => nav('/app/videos')}>More videos</button></div>
        </div>
      ) : !session ? (
        <button className="btn" onClick={start}>Start video</button>
      ) : ended ? (
        <button className="btn orange" onClick={claim} disabled={busy}>{busy ? 'Confirming…' : 'Retry claiming reward'}</button>
      ) : (
        <div className="row"><button className="btn ghost" onClick={toggle}>{paused ? 'Resume' : 'Pause'}</button><span className="muted small">Watch to the end to earn your reward.</span></div>
      )}
    </>
  )
}

export function Withdraw() {
  const { cfg } = usePublicConfig()
  const dash = useApi('/me/dashboard')
  const [f, setF] = useState({ amount: '', bank: '', accountName: '', accountNumber: '', consent: false })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  if (dash.error) return <Problem error={dash.error} onRetry={dash.reload} />
  if (!dash.data || !cfg) return <Loading />
  const bal = dash.data.balanceKobo
  const meets = bal >= cfg.minWithdrawalKobo
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!f.consent) return setMsg({ bad: true, text: 'Please consent to processing this payout.' })
    if (!f.bank) return setMsg({ bad: true, text: 'Select a bank.' })
    setBusy(true)
    try {
      await api.post('/withdrawals', { amountKobo: toKobo(f.amount), bankName: f.bank, accountName: f.accountName, accountNumber: f.accountNumber })
      setMsg({ text: 'Request received. Operations will review it; you can track the status on your dashboard.' })
      setF({ ...f, amount: '', consent: false }); dash.reload()
    } catch (err) { setMsg({ bad: true, text: err.message }) } finally { setBusy(false) }
  }
  return (
    <>
      <div><h1 style={{ fontSize: '1.8rem' }}>Withdraw</h1><p className="muted">Minimum {naira(cfg.minWithdrawalKobo)} · Available {naira(bal)}</p></div>
      <div className="notice green">
        Fee: {naira(cfg.withdrawalFeeKobo)}, deducted from your payout. A request is marked paid only after the bank transfer is made and its reference recorded.
        You do <b>not</b> need referrals to withdraw.
      </div>
      <form className="card stack" onSubmit={submit}>
        {msg ? <div className={'notice ' + (msg.bad ? 'red' : 'green')} role={msg.bad ? 'alert' : 'status'}>{msg.text}</div> : null}
        <div className="field"><label htmlFor="amt">Amount (₦)</label><input id="amt" inputMode="decimal" value={f.amount} onChange={set('amount')} disabled={!meets} /></div>
        <div className="field"><label htmlFor="bank">Bank</label>
          <select id="bank" value={f.bank} onChange={set('bank')}><option value="">Select bank</option>{BANKS.map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="field"><label htmlFor="an">Account number</label><input id="an" inputMode="numeric" maxLength={10} value={f.accountNumber} onChange={set('accountNumber')} /></div>
        <div className="field"><label htmlFor="acn">Account name</label><input id="acn" value={f.accountName} onChange={set('accountName')} />
          <span className="small muted">Must match the name on the bank account. Operations check it before paying.</span></div>
        <label className="check"><input type="checkbox" checked={f.consent} onChange={set('consent')} /><span>I consent to Naija Earn processing this payout to the account above.</span></label>
        <button className="btn" disabled={!meets || busy}>{meets ? (busy ? 'Submitting…' : 'Submit withdrawal request') : `Reach ${naira(cfg.minWithdrawalKobo)} to withdraw`}</button>
      </form>
    </>
  )
}

export function Referrals() {
  const { user } = useAuth()
  const r = useApi('/me/referrals')
  if (r.error) return <Problem error={r.error} onRetry={r.reload} />
  if (!r.data) return <Loading />
  const link = `${location.origin}${location.pathname}#/register?ref=${user.referralCode}`
  const verified = r.data.referred.filter((x) => x.verified)
  return (
    <>
      <div><h1 style={{ fontSize: '1.8rem' }}>Referrals</h1><p className="muted">Optional. Invite friends if you like: it is never required to earn or withdraw.</p></div>
      <div className="card stack">
        <div className="field"><label>Your referral code</label><input readOnly value={user.referralCode} /></div>
        <div className="field"><label>Your invite link</label><input readOnly value={link} onFocus={(e) => e.target.select()} /></div>
        <div className="notice green">
          {r.data.bonusKobo > 0
            ? `Rule: you earn ${naira(r.data.bonusKobo)} once, when someone you invite verifies their contacts and completes their first validated video. It is paid from that campaign's margin, never from anyone's deposit.`
            : 'Rule: referral rewards are not currently offered. Referral counts are still recorded.'}
        </div>
      </div>
      <div className="card"><h2>{verified.length} verified referral{verified.length === 1 ? '' : 's'}</h2>
        {r.data.referred.length === 0 ? <p className="muted">No referrals yet.</p> : (
          <table><thead><tr><th>Joined</th><th>Member</th><th>Status</th></tr></thead><tbody>
            {r.data.referred.map((x, i) => <tr key={i}><td>{fmtTime(x.joinedAt)}</td><td>{x.name}</td><td>{x.verified ? (x.bonusPaid ? 'Bonus paid' : 'Verified') : 'Not verified yet'}</td></tr>)}
          </tbody></table>
        )}</div>
    </>
  )
}
