import { useState } from 'react'

// Loads /logo.png (put the Naija Earn logo at public/logo.png).
// Falls back to a text wordmark until the file is added.
export default function Logo() {
  const [failed, setFailed] = useState(false)
  return (
    <span className="logo" aria-label="Naija Earn">
      {failed ? (
        <span className="wordmark">Naija<b>Earn</b></span>
      ) : (
        <img src="/logo.png" alt="Naija Earn — Earn More. Live Better." onError={() => setFailed(true)} />
      )}
    </span>
  )
}
