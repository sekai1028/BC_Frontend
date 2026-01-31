import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Terminal from './pages/Terminal'
import Profile from './pages/Profile'
import Shop from './pages/Shop'
import Leaderboard from './pages/Leaderboard'
import Intel from './pages/Intel'
import Legal from './pages/Legal'
import Support from './pages/Support'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Terminal />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/intel" element={<Intel />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
