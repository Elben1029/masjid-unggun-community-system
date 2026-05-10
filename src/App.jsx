import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Splash from './pages/auth/Splash';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Events from './pages/public/Events';
import Donations from './pages/public/Donations';
import Korban from './pages/public/Korban';

import ProtectedRoute from './components/auth/ProtectedRoute';

import Dashboard from './pages/admin/Dashboard';
import EventsManager from './pages/admin/EventsManager';
import DonationsManager from './pages/admin/DonationsManager';
import KorbanManager from './pages/admin/KorbanManager';
import Inventory from './pages/admin/Inventory';
import UsersManager from './pages/admin/UsersManager';
import Settings from './pages/admin/Settings';

// Public Pages Additional
import PublicInventory from './pages/public/Inventory';
import About from './pages/public/About';
import Profile from './pages/auth/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth/Standalone Routes */}
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/korban" element={<Korban />} />
            <Route path="/inventory" element={<PublicInventory />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="events" element={<EventsManager />} />
            <Route path="donations" element={<DonationsManager />} />
            <Route path="korban" element={<KorbanManager />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="users" element={<UsersManager />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
