import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, usePublicConfig, naira } from '../api.js'

// Fictional sponsors, used only for the demo preview on the home page.
const ADS = [
  { id: 'a1', sponsor: 'Zobo & Co', title: 'Ice-cold zobo, delivered to your door', sec: 5, tone: 't1', icon: '🥤' },
  { id: 'a2', sponsor: 'Lagos Tech Hub', title: 'Learn to code in 12 weeks', sec: 6, tone: 't2', icon: '💻' },
  { id: 'a3', sponsor: 'Ankara Street', title: 'New season prints are here', sec: 5, tone: 't3', icon: '👗' },
]

function AdDemo({ rewards, cap }) {
  const [playing, setPlaying] = useState(null)
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState([])
  const el = useRef(0)

  useEffect(() => {
    if (!playing) return undefined
    const ad = ADS.find((a) => a.id === playing)
    el.current = 0
    const t = setInterval(() => {
      el.current += 0.1
      setPct(Math.min(100, (el.current / ad.sec) * 100))
      if (el.current >= ad.sec) { clearInterval(t); setDone((d) => [...d, ad.id]); setPlaying(null) }
    }, 100)
    return () => clearInterval(t)
  }, [playing])

  const earned = done.reduce((a, id) => a + rewards[ADS.findIndex((x) => x.id === id)], 0)
  const full = done.length >= cap
  const start = (id) => { setPct(0); setPlaying(id) }
  const reset = () => { setDone([]); setPlaying(null); setPct(0) }

  return (
    <div className="browser">
      <div className="browser-bar">
        <i /><i /><i /><span className="url">naijaearn.com / dashboard</span>
      </div>
      <div className="browser-body">
        <div className="row between" style={{ marginBottom: 14 }}>
          <div><b>Today's sponsor videos</b><div className="small muted">{done.length} of {cap} watched today</div></div>
          <div className="earn-chip">+{naira(earned)}</div>
        </div>
        <div className="feed">
          {ADS.map((a, i) => {
            const isDone = done.includes(a.id)
            const isPlaying = playing === a.id
            return (
              <div key={a.id} className={'ad ' + a.tone + (isDone ? ' done' : '')}>
                <div className="thumb">
                  <span className="ad-tag">Sponsored</span>
                  <span className="ad-icon" aria-hidden="true">{isDone ? '✓' : a.icon}</span>
                  <span className="ad-len">0:{String(a.sec).padStart(2, '0')}</span>
                  {isPlaying ? <div className="ad-progress"><i style={{ width: `${pct}%` }} /></div> : null}
                </div>
                <div className="ad-meta">
                  <b>{a.title}</b>
                  <span className="small muted">{a.sponsor}</span>
                  <div className="row between" style={{ marginTop: 8 }}>
                    <span className="pill orange">{naira(rewards[i])}</span>
                    {isDone ? <span className="pill">Watched</span>
                      : isPlaying ? <span className="small muted">Playing… no skipping</span>
                      : <button className="btn sm" disabled={!!playing || full} onClick={() => start(a.id)}>Watch</button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="row between" style={{ marginTop: 14 }}>
          <span className="small muted">{full ? 'Daily limit reached. New videos appear tomorrow.' : 'Press Watch. In the real app a reward is credited only after the full video plays.'}</span>
          {done.length ? <button className="btn ghost sm" onClick={reset}>Replay demo</button> : null}
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const { cfg, error } = usePublicConfig()
  if (!cfg) return <div className="container" style={{ padding: 40 }}>{error ? <div className="notice red" role="alert">We can't reach the server right now. Please try again shortly.</div> : <p className="muted">Loading…</p>}</div>
  const rewards = [0, 1, 2].map((i) => cfg.packages[i % cfg.packages.length].memberRewardKobo)
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const advertiseTo = (id) => (user && user.role === 'MEMBER' ? `/app/advertise?package=${id}` : '/register')
  const popular = cfg.packages[1]?.id

  return (
    <>
      <section className="hero-band hero2">
        <span className="orb o1" aria-hidden="true" /><span className="orb o2" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="stack">
            <span className="pill orange">Free to join · No activation fee</span>
            <h1>Watch sponsor videos. <span className="accent">Earn rewards</span> funded by real campaigns.</h1>
            <p>Complete short, approved sponsor videos and get paid from advertisers' prepaid budgets. You never pay to earn, and cashing out is never tied to recruiting anyone.</p>
            <div className="row">
              <Link className="btn orange" to="/register">Join free</Link>
              <button className="btn ghost light" onClick={() => go('demo')}>See how videos appear</button>
              <button className="btn ghost light" onClick={() => go('packages')}>Advertise with us</button>
            </div>
          </div>
          <div className="float-stage" aria-hidden="true">
            <div className="phone float-a">
              <div className="phone-screen">
                <div className="mini-player"><span>▶</span><div className="mini-progress"><i /></div></div>
                <b>Zobo & Co</b><span className="small">Ice-cold zobo, delivered</span>
              </div>
            </div>
            <div className="chip c1 float-b">+{naira(rewards[0])} credited</div>
            <div className="chip c2 float-c">✓ Watched</div>
            <div className="chip c3 float-b">1 of {cfg.dailyCap} today</div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="strip">
          <div><b>{cfg.dailyCap}</b><span>videos per day</span></div>
          <div><b>₦0</b><span>to join</span></div>
          <div><b>{naira(cfg.minWithdrawalKobo)}</b><span>minimum cash-out</span></div>
          <div><b>100%</b><span>campaign-funded rewards</span></div>
        </div>
      </div>

      <section id="demo" className="container stack section">
        <div className="center">
          <span className="pill">Live preview</span>
          <h2>This is how sponsor videos appear</h2>
          <p className="muted">Try it: press Watch on a video. Rewards shown here come from our current package settings. Sponsors in this preview are fictional.</p>
        </div>
        <AdDemo rewards={rewards} cap={cfg.dailyCap} />
      </section>

      <section className="container stack section">
        <div className="center"><h2>How it works</h2></div>
        <div className="steps">
          <div className="card lift"><h3>Join for free</h3><p className="muted">Sign up with your name, phone and email, then verify your contacts. No payment needed.</p></div>
          <div className="card lift"><h3>Watch to the end</h3><p className="muted">Pick an approved sponsor video. A reward is credited only after the server validates a full, genuine view.</p></div>
          <div className="card lift"><h3>Withdraw to your bank</h3><p className="muted">Once your balance reaches {naira(cfg.minWithdrawalKobo)}, request a payout. Fees are shown before you submit.</p></div>
        </div>
      </section>

      <section id="packages" className="packages-band">
        <div className="container stack section">
          <div className="center">
            <span className="pill orange">For advertisers</span>
            <h2>Advert subscription packages</h2>
            <p className="muted">Buy a package, submit your video, and members are rewarded for watching it. Every video is reviewed before it goes live. Packages are for advertisers only: members never pay.</p>
          </div>
          <div className="grid g3 pricing">
            {cfg.packages.map((p) => {
              const rate = p.advertiserRateKobo
              return (
                <div key={p.id} className={'card price lift' + (p.id === popular ? ' featured' : '')}>
                  {p.id === popular ? <span className="ribbon">Most popular</span> : null}
                  <h3>{p.name}</h3>
                  <div className="amount">{naira(p.priceKobo)}</div>
                  <ul className="ticks">
                    <li>{p.completions.toLocaleString()} validated views</li>
                    <li>About {naira(rate)} per view</li>
                    <li>Members earn {naira(p.memberRewardKobo)} per view</li>
                    <li>Video reviewed before going live</li>
                    <li>Pay by Paystack, Flutterwave or bank transfer</li>
                  </ul>
                  <Link className={'btn' + (p.id === popular ? ' orange' : '')} style={{ width: '100%' }} to={advertiseTo(p.id)}>Choose {p.name}</Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container stack section">
        <div className="center"><h2>Straight answers</h2></div>
        <div className="grid g2">
          <div className="card lift"><h3>Is there a fee to join?</h3><p className="muted">No. Sign-up is free and nothing is deducted from you to start.</p></div>
          <div className="card lift"><h3>How much can I watch?</h3><p className="muted">Up to {cfg.dailyCap} eligible videos per day (resets at midnight, Africa/Lagos).</p></div>
          <div className="card lift"><h3>Where do rewards come from?</h3><p className="muted">Each reward is paid from a specific advertiser campaign that has been pre-funded. When a campaign's budget is used up, it closes.</p></div>
          <div className="card lift"><h3>Do I have to refer people?</h3><p className="muted">No. Referral codes are optional and are never required to withdraw.</p></div>
        </div>
        <div className="notice" role="note">
          Rewards depend on available funded campaigns and are not guaranteed income. Only approved first-party sponsor videos are eligible. YouTube views, likes, comments and subscriptions never earn rewards.
        </div>
      </section>
    </>
  )
}
