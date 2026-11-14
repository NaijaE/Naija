import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, usePublicConfig, naira } from '../api.js'
import FeaturedVideos from '../components/FeaturedVideos.jsx'

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
              <button className="btn ghost light" onClick={() => go('demo')}>See live videos</button>
              <button className="btn ghost light" onClick={() => go('packages')}>Advertise with us</button>
            </div>
          </div>
          <div className="float-stage" aria-hidden="true">
            <div className="phone float-a">
              <div className="phone-screen">
                <div className="mini-player"><span>▶</span><div className="mini-progress"><i /></div></div>
                <b>Sponsor video</b><span className="small">Watch to the end to earn</span>
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

      <FeaturedVideos />

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
