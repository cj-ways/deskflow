import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ErrorToast'
import Layout from './components/Layout'
import ProfileList from './pages/ProfileList'
import ProfileEditor from './pages/ProfileEditor'
import SnapshotReview from './pages/SnapshotReview'
import Settings from './pages/Settings'

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ProfileList />} />
            <Route path="profile/:id" element={<ProfileEditor />} />
            <Route path="snapshot" element={<SnapshotReview />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}
