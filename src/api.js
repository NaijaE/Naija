// Naija Earn API client. All money rules live on the server; this file only talks to it.
// Money is integer kobo everywhere. The login token is kept in localStorage.
import { useEffect, useState, useSyncExternalStore } from 'react'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
const TOKEN_KEY = 'naija-earn-token'
const CODES_KEY = 'naija-dev-codes'

const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
const setToken = (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ } }

export class ApiError extends Error {
  constructor(message, status, details) { super(message); this.status = status; this.details = details }
}

// The API returns Mongo "_id"; the UI uses "id".
const norm = (x) => {
  if (Array.isArray(x)) return x.map(norm)
  if (x && typeof x === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(x)) out[k] = norm(v)
    if ('_id' in out && !('id' in out)) out.id = out._id
    return out
  }
  return x
}

async function request(method, path, body) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (body instanceof FormData) payload = body
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  let res
  try { res = await fetch(`${API_URL}/api${path}`, { method, headers, body: payload }) }
  catch { throw new ApiError('Cannot reach the server. Check your connection and try again.', 0) }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) dropSession()
    const fe = json && json.details && json.details.fieldErrors
    const first = fe ? Object.entries(fe).find(([, v]) => v && v.length) : null
    const msg = first ? `${first[0]}: ${first[1][0]}` : (json && json.error) || `Request failed (${res.status})`
    throw new ApiError(msg, res.status, json && json.details)
  }
  return norm(json)
}
export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  patch: (p, b) => request('PATCH', p, b ?? {}),
}

// ---------- auth state ----------
let auth = { user: null, ready: false }
const subs = new Set()
const setAuth = (a) => { auth = a; subs.forEach((f) => f()) }
export const useAuth = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => auth)
function dropSession() { setToken(null); setAuth({ user: null, ready: true }) }

export async function initAuth() {
  if (!getToken()) return setAuth({ user: null, ready: true })
  try { const r = await api.get('/me'); setAuth({ user: r.user, ready: true }) }
  catch (e) { if (e.status === 401 || e.status === 403) dropSession(); else setAuth({ user: null, ready: true }) }
}
export const refreshMe = async () => { const r = await api.get('/me'); setAuth({ user: r.user, ready: true }); return r.user }
export async function login(email, password) {
  const r = await api.post('/auth/login', { email, password })
  setToken(r.token); setAuth({ user: r.user, ready: true })
  return r.user
}
export async function register(f) {
  const r = await api.post('/auth/register', { name: f.name, phone: f.phone, email: f.email, password: f.password, consent: f.consent, ...(f.referralCode ? { referralCode: f.referralCode } : {}) })
  setToken(r.token); setAuth({ user: r.user, ready: true })
  rememberCodes(r.devCodes)
  return r.user
}
export async function changePassword(currentPassword, newPassword) {
  const r = await api.post('/auth/change-password', { currentPassword, newPassword })
  setToken(r.token) // other devices are signed out; this one keeps going
  return r
}
export const logout = () => { dropSession(); try { sessionStorage.removeItem(CODES_KEY) } catch { /* ignore */ } }

// Verification codes are only returned by the API in development (EXPOSE_DEV_CODES=true).
export const rememberCodes = (c) => { try { if (c) sessionStorage.setItem(CODES_KEY, JSON.stringify(c)) } catch { /* ignore */ } }
export const devCodes = () => { try { return JSON.parse(sessionStorage.getItem(CODES_KEY) || 'null') } catch { return null } }

initAuth()

// ---------- data hooks ----------
export function useApi(path, { skip = false } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: !skip })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (skip || !path) return undefined
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    api.get(path)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }))
    return () => { alive = false }
  }, [path, skip, tick])
  return { ...state, reload: () => setTick((t) => t + 1) }
}

let cfgCache = null
export function usePublicConfig() {
  const [cfg, setCfg] = useState(cfgCache)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (cfgCache) return undefined
    let alive = true
    api.get('/public/config').then((c) => { cfgCache = c; if (alive) setCfg(c) }).catch((e) => alive && setError(e))
    return () => { alive = false }
  }, [])
  return { cfg, error }
}

// ---------- helpers ----------
export const naira = (kobo) => '₦' + ((kobo || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const lagosDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(d)
export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' }) : '')
export const BANKS = ['Access Bank', 'First Bank of Nigeria', 'Guaranty Trust Bank', 'Kuda Bank', 'Opay', 'Palmpay',
  'Stanbic IBTC', 'Sterling Bank', 'United Bank for Africa', 'Wema Bank', 'Zenith Bank']
export const PAY_METHODS = { PAYSTACK: 'Paystack', FLUTTERWAVE: 'Flutterwave', BANK_TRANSFER: 'Bank transfer (manual)' }
export const toKobo = (naira) => Math.round(Number(naira) * 100)
