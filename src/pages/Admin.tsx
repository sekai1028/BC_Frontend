/**
 * GDD 20: Admin Command Center — nested routes: /admin, /admin/users, /admin/chat
 */
import { Routes, Route } from 'react-router-dom'
import { AdminProvider } from '../context/AdminContext'
import AdminLayout from './admin/AdminLayout'
import AdminHome from './admin/AdminHome'
import AdminUsersPage from './admin/AdminUsersPage'
import AdminChatPage from './admin/AdminChatPage'

export default function Admin() {
  return (
    <AdminProvider>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="chat" element={<AdminChatPage />} />
        </Route>
      </Routes>
    </AdminProvider>
  )
}
