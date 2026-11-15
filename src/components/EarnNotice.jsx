import { Link } from 'react-router-dom'

// Shown to members who have not bought an advertising package yet.
export default function EarnNotice() {
  return (
    <div className="notice" role="status">
      Only members with an advertising package earn rewards from watching videos. <Link to="/app/advertise">Buy a package</Link> to start earning.
    </div>
  )
}
