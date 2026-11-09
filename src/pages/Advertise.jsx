import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, useApi, usePublicConfig, naira, fmtTime, PAY_METHODS, ApiError } from '../api.js'
import { StatusPill } from '../components/Shell.jsx'

export function DepositTable({ orders }) {
  if (!orders || !orders.length) return <p className="muted">No deposits yet.</p>
  return (
    <div className="table-wrap"><table>
      <thead><tr><th>Date</th><th>Package</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
      <tbody>{orders.map((o) => (
        <tr key={o.id}><td>{fmtTime(o.createdAt)}</td><td>{o.packageName}<div className="small muted">{o.title}</div></td><td>{naira(o.priceKobo)}</td>
          <td>{PAY_METHODS[o.method]}{o.ref ? <div className="small muted">ref {o.ref}</div> : null}</td>
          <td><StatusPill status={o.status} />{o.rejectReason ? <div className="small muted">{o.rejectReason}</div> : null}</td></tr>
      ))}</tbody></table></div>
  )
}

// Browser -> Cloudinary directly, using a signature from our API. Large files never touch our server.
async function uploadVideo(file) {
  const sig = await api.post('/uploads/video-signature')
  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', sig.apiKey)
  fd.append('timestamp', sig.timestamp)
  fd.append('folder', sig.folder)
  fd.append('signature', sig.signature)
  let res
  try { res = await fetch(sig.uploadUrl, { method: 'POST', body: fd }) } catch { throw new ApiError('Video upload failed. Check your connection.', 0) }
  const j = await res.json().catch(() => ({}))
  if (!res.ok || !j.public_id) throw new ApiError((j.error && j.error.message) || 'Video upload failed.', res.status)
  return j.public_id
}

export function Advertise() {
  const { cfg } = usePublicConfig()
  const orders = useApi('/orders')
  const [params, setParams] = useSearchParams()
  const [f, setF] = useState({ packageId: params.get('package') || 'spark', method: 'PAYSTACK', title: '' })
  const [video, setVideo] = useState(null)
  const [proof, setProof] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState('')
  const handled = useRef(false)
  const reuseId = params.get('reuse')
  const prev = useApi(reuseId ? `/advertiser/campaigns/${reuseId}` : '', { skip: !reuseId })
  const reuse = prev.data && prev.data.videoPublicId ? { publicId: prev.data.videoPublicId, title: prev.data.item.title, packageId: prev.data.item.packageId } : null
  const filled = useRef(false)
  useEffect(() => {
    if (reuse && !filled.current) { filled.current = true; setF((x) => ({ ...x, title: reuse.title, packageId: reuse.packageId || x.packageId })) }
  }, [reuse])

  // Returning from Paystack/Flutterwave: ask the server to verify the payment with the provider.
  useEffect(() => {
    const id = params.get('order')
    if (!id || handled.current) return
    handled.current = true
    api.post(`/orders/${id}/verify`).then((r) => {
      setMsg(r.status === 'PAID' ? { text: 'Payment confirmed. Your video is now in content review before it goes live.' }
        : { text: 'We have not received confirmation of this payment yet. If you paid, wait a minute and use "Check payment".' })
      orders.reload()
    }).catch((e) => setMsg({ bad: true, text: e.message })).finally(() => { params.delete('order'); setParams(params, { replace: true }) })
  }, [params, setParams, orders])

  if (!cfg) return <p className="muted">Loading…</p>
  const pkg = cfg.packages.find((p) => p.id === f.packageId) || cfg.packages[0]
  const list = (orders.data && orders.data.orders) || []
  const subscribed = list.some((o) => o.status === 'PAID')
  const waiting = list.filter((o) => o.status === 'AWAITING_PAYMENT')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (f.title.trim().length < 3) return setMsg({ bad: true, text: 'Enter a title for your video.' })
    if (!video && !reuse) return setMsg({ bad: true, text: 'Choose your sponsor video file.' })
    if (video && !video.type.startsWith('video/')) return setMsg({ bad: true, text: 'That file is not a video.' })
    if (video && video.size > 100 * 1024 * 1024) return setMsg({ bad: true, text: 'Video must be under 100 MB.' })
    if (f.method === 'BANK_TRANSFER' && !proof) return setMsg({ bad: true, text: 'Upload your proof of payment for a bank transfer.' })
    try {
      const videoPublicId = video || !reuse ? (setBusy('Uploading your video…'), await uploadVideo(video)) : reuse.publicId
      setBusy('Creating your order…')
      let body = { packageId: f.packageId, method: f.method, title: f.title.trim(), videoPublicId }
      if (f.method === 'BANK_TRANSFER') {
        body = new FormData()
        Object.entries({ packageId: f.packageId, method: f.method, title: f.title.trim(), videoPublicId }).forEach(([k, v]) => body.append(k, v))
        body.append('proof', proof)
      }
      const r = await api.post('/orders', body)
      if (r.paymentUrl) { window.location.href = r.paymentUrl; return }
      setMsg({ text: r.message || 'Order received.' })
      setVideo(null); setProof(null); setF({ ...f, title: '' })
      orders.reload()
    } catch (err) { setMsg({ bad: true, text: err.message }) } finally { setBusy('') }
  }
  const check = async (id) => {
    try { const r = await api.post(`/orders/${id}/verify`); setMsg({ text: r.status === 'PAID' ? 'Payment confirmed.' : 'Still waiting for the payment provider to confirm.' }); orders.reload() }
    catch (err) { setMsg({ bad: true, text: err.message }) }
  }
  const cancel = async (id) => { try { await api.post(`/orders/${id}/cancel`); orders.reload() } catch (err) { setMsg({ bad: true, text: err.message }) } }

  return (
    <>
      <div>
        <h1 style={{ fontSize: '1.8rem' }}>Advertise</h1>
        <p className="muted">Run your own sponsor video. Your package price funds a campaign budget, and members are paid from it for validated views. This is separate from earning, which is always free.</p>
      </div>
      <div className="row"><span className={'pill' + (subscribed ? '' : ' grey')}>Advertiser status: {subscribed ? 'Subscribed' : 'Free'}</span><Link className="btn ghost sm" to="/app/campaigns">My campaigns</Link></div>

      <div className="grid g3">
        {cfg.packages.map((p) => (
          <div key={p.id} className="card stack" style={p.id === f.packageId ? { borderColor: 'var(--orange-500)', borderWidth: 2 } : undefined}>
            <h3>{p.name}</h3>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{naira(p.priceKobo)}</div>
            <p className="muted small">{p.completions.toLocaleString()} validated views · members earn {naira(p.memberRewardKobo)} per view</p>
            <button type="button" className={'btn sm' + (p.id === f.packageId ? '' : ' ghost')} onClick={() => setF({ ...f, packageId: p.id })}>{p.id === f.packageId ? 'Selected' : 'Choose'}</button>
          </div>
        ))}
      </div>

      {msg ? <div className={'notice ' + (msg.bad ? 'red' : 'green')} role={msg.bad ? 'alert' : 'status'}>{msg.text}</div> : null}

      {waiting.map((o) => (
        <div key={o.id} className="card stack">
          <h3>Waiting for payment: {o.packageName} · {naira(o.priceKobo)} via {PAY_METHODS[o.method]}</h3>
          <p className="muted small">Paid already? Use "Check payment". Otherwise cancel and start again.</p>
          <div className="row"><button className="btn" onClick={() => check(o.id)}>Check payment</button><button className="btn ghost" onClick={() => cancel(o.id)}>Cancel order</button></div>
        </div>
      ))}

      <form className="card stack" onSubmit={submit}>
        <h2>Fund a campaign</h2>
        <div className="field"><label htmlFor="vt">Video title</label><input id="vt" value={f.title} onChange={set('title')} /></div>
        <div className="field"><label htmlFor="vf">Sponsor video (10 to 120 seconds, under 100 MB)</label>
          {reuse && !video ? <div className="notice green small">Using the video from your earlier campaign: <b>{reuse.title}</b>. Choose a file below only if you want to use a different video.</div> : null}
          <input id="vf" type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0] || null)} />
          <span className="small muted">Only original, lawful sponsor videos are approved. An admin reviews every video before it goes live.</span></div>
        <div className="field"><label htmlFor="pm">Payment method</label>
          <select id="pm" value={f.method} onChange={set('method')}>{Object.entries(PAY_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        {f.method === 'BANK_TRANSFER' ? (
          <div className="notice green stack">
            <div>Transfer <b>{naira(pkg.priceKobo)}</b> to <b>{cfg.bank.bank}</b>, account name <b>{cfg.bank.accountName}</b>, account number <b>{cfg.bank.accountNumber}</b>, then upload your proof of payment.</div>
            <div className="field" style={{ marginBottom: 0 }}><label htmlFor="pf">Proof of payment (JPG, PNG, WEBP or PDF, max 5 MB)</label>
              <input id="pf" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setProof(e.target.files[0] || null)} /></div>
          </div>
        ) : null}
        <div className="row between">
          <span className="muted">Total: <b>{naira(pkg.priceKobo)}</b> for {pkg.completions.toLocaleString()} views</span>
          <button className="btn" disabled={!!busy}>{busy || (f.method === 'BANK_TRANSFER' ? 'Submit transfer for review' : `Continue to ${PAY_METHODS[f.method]}`)}</button>
        </div>
      </form>

      <div className="card"><h2>Deposit history</h2>{orders.loading && !orders.data ? <p className="muted">Loading…</p> : <DepositTable orders={list} />}</div>
    </>
  )
}
