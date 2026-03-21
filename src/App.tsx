import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Terminal from './pages/Terminal'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Support from './pages/Support'
import Intel from './pages/Intel'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import Gateway from './pages/Gateway'
import Manifesto from './pages/Manifesto'
import Shop from './pages/Shop'
import Admin from './pages/Admin'
import Vault from './pages/Vault'
import Layout from './components/Layout'
import { useAuthStore } from './store/authStore'

/** Root: GDD 2.8.3 — Gateway (3-button) when no session; Terminal when token exists (ACCESS TERMINAL bypasses lore) */
function HomePage() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  return token || user ? <Terminal /> : <Gateway />
}

/** Login page: redirect to chart if already logged in */
function LoginPage() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/" replace />
  return <Login />
}

/** Verify email: handle token from email link */
function VerifyEmailPage() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/" replace />
  return <VerifyEmail />
}

/** Protected route: redirect to login if not authenticated (preserve intended path in `state.from`) */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/play" element={<Terminal />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/shop" element={<RequireAuth><Shop /></RequireAuth>} />
          <Route path="/vault" element={<RequireAuth><Vault /></RequireAuth>} />
          <Route path="/intel" element={<Intel />} />
          <Route path="/about" element={<About />} />
          <Route path="/legal" element={<Navigate to="/about" replace />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
