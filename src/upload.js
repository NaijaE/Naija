import { api, ApiError } from './api.js'

// Browser -> Cloudinary directly, using a one-off signature from our API. Large files never touch our server.
// Members use the default signature route; admins pass '/admin/uploads/video-signature'.
export async function uploadVideoToCloudinary(file, signaturePath = '/uploads/video-signature') {
  const sig = await api.post(signaturePath)
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

// Quick checks before a large upload starts.
export function videoFileProblem(file) {
  if (!file) return 'Choose your video file.'
  if (!file.type.startsWith('video/')) return 'That file is not a video.'
  if (file.size > 100 * 1024 * 1024) return 'The video must be under 100 MB.'
  return ''
}
