import { useState } from 'react'

// Copies text to the clipboard and briefly shows "Copied". Works on phones and older browsers too.
export default function CopyButton({ text, label = 'Copy', className = 'btn sm ghost' }) {
  const [done, setDone] = useState(false)
  async function copy() {
    const value = String(text ?? '')
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const t = document.createElement('textarea')
      t.value = value; t.style.position = 'fixed'; t.style.opacity = '0'
      document.body.appendChild(t); t.select()
      try { document.execCommand('copy') } catch { /* nothing more to try */ }
      document.body.removeChild(t)
    }
    setDone(true); setTimeout(() => setDone(false), 1500)
  }
  return <button type="button" className={className} onClick={copy}>{done ? 'Copied ✓' : label}</button>
}
