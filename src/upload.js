import { api, ApiError } from './api.js'

// Turns Cloudinary's own error text into something a person can act on. The raw text stays in brackets for support.
function friendly(raw, status) {
  const r = raw || ''
  const tail = r ? ` (${r})` : ''
  if (status === 0) return 'The upload could not be completed. Check your connection and try again. Large videos need a steady connection.'
  if (/file size too large|too large/i.test(r)) return `This video is too large. Compress it to under 100 MB and try again.${tail}`
  if (/invalid signature|unknown api key|invalid cloud_name|api_key|must supply/i.test(r)) return `The upload was refused because the platform's video storage settings are wrong. Please tell support.${tail}`
  if (/stale request/i.test(r)) return `The upload took too long to start. Please try again.${tail}`
  if (/invalid (image|video)|unsupported|corrupt/i.test(r)) return `This video file could not be read. Try exporting it as an MP4 and upload again.${tail}`
  return `Video upload failed.${tail || ` (status ${status})`}`
}

// Browser -> Cloudinary directly, using a one-off signature from our API. Large files never touch our server.
// Members use the default signature route; admins pass '/admin/uploads/video-signature'.
// onProgress receives 0 to 100 while the file is sent.
export async function uploadVideoToCloudinary(file, signaturePath = '/uploads/video-signature', onProgress) {
  const sig = await api.post(signaturePath)
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('api_key', sig.apiKey)
    fd.append('timestamp', sig.timestamp)
    fd.append('folder', sig.folder)
    fd.append('signature', sig.signature)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', sig.uploadUrl)
    xhr.timeout = 15 * 60 * 1000
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onerror = () => reject(new ApiError(friendly('', 0), 0))
    xhr.ontimeout = () => reject(new ApiError('The upload timed out. Try a smaller video or a faster connection.', 0))
    xhr.onload = () => {
      let j = {}
      try { j = JSON.parse(xhr.responseText) } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && j.public_id) resolve(j.public_id)
      else reject(new ApiError(friendly(j.error && j.error.message, xhr.status), xhr.status))
    }
    xhr.send(fd)
  })
}

// Quick checks before a large upload starts.
export function videoFileProblem(file) {
  if (!file) return 'Choose your video file.'
  if (!file.type.startsWith('video/')) return 'That file is not a video.'
  if (file.size > 100 * 1024 * 1024) return 'The video must be under 100 MB.'
  return ''
}
