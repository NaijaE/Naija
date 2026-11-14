import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useAuth, naira } from '../api.js'

const TONES = ['t1', 't2', 't3']

// Live, approved sponsor videos shown in random order on the public home page. Rotates by itself every 30 seconds.
export default function FeaturedVideos() {
  const { user } = useAuth()
  const v = useApi('/videos/featured')
  const reload = v.reload
  useEffect(() => {
    const t = setInterval(reload, 30000)
    return () => clearInterval(t)
  }, [reload])

  const videos = (v.data && v.data.videos) || []
  if (videos.length === 0) return null
  const isMember = user && user.role === 'MEMBER'
  return (
    <section id="demo" className="container stack section">
      <div className="center">
        <span className="pill">Live now</span>
        <h2>Sponsor videos you can watch today</h2>
        <p className="muted">These are real, approved videos with funded rewards. They change every few seconds, so check back often.</p>
      </div>
      <div className="feed">
        {videos.map((c, i) => (
          <div key={c.id} className={'ad ' + TONES[i % TONES.length]}>
            <div className="thumb">
              <span className="ad-tag">Sponsored</span>
              <span className="ad-icon" aria-hidden="true">▶</span>
              <span className="ad-len">0:{String(c.durationSec).padStart(2, '0')}</span>
            </div>
            <div className="ad-meta">
              <b>{c.title}</b>
              <span className="small muted">{c.sponsor}</span>
              <div className="row between" style={{ marginTop: 8 }}>
                <span className="pill orange">{naira(c.rewardKobo)}</span>
                {isMember
                  ? <Link className="btn sm" to={`/app/watch/${c.id}`}>Watch</Link>
                  : <Link className="btn sm" to="/login">Log in to watch</Link>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="center"><button className="btn ghost sm" onClick={reload}>Show different videos</button></div>
    </section>
  )
}
