import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout, MemberLayout, AdminLayout } from './components/Shell.jsx'
import Landing from './pages/Landing.jsx'
import { Register, Login, Verify, Forgot, Reset } from './pages/Auth.jsx'
import { Dashboard, Videos, Watch, Withdraw, Referrals } from './pages/Member.jsx'
import { Advertise } from './pages/Advertise.jsx'
import { Overview, Campaigns, Deposits, Withdrawals, Members, Settings, AuditLog, Regulator } from './pages/Admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
      </Route>
      <Route path="/app" element={<MemberLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="videos" element={<Videos />} />
        <Route path="watch/:campaignId" element={<Watch />} />
        <Route path="advertise" element={<Advertise />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="withdraw" element={<Withdraw />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="deposits" element={<Deposits />} />
        <Route path="withdrawals" element={<Withdrawals />} />
        <Route path="users" element={<Members />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="regulator" element={<Regulator />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
