import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { getUserRole, getDashboardPath } from './utils/auth';
import Navbar from './components/common/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CaptainDashboard from './pages/CaptainDashboard';
import PlayerDashboard from './pages/PlayerDashboard';
import Viewer from './pages/Viewer';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const session = useAuthStore(state => state.session);
  const isLoading = useAuthStore(state => state.isLoading);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/viewer" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Viewer />
          </ProtectedRoute>
        } />
        <Route path="*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                isLoading ? (
                  <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>
                ) : session ? (
                  <Navigate to={getDashboardPath(getUserRole(session.user))} replace />
                ) : <Navigate to="/login" replace />
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/captain" element={
                <ProtectedRoute allowedRoles={['captain']}>
                  <CaptainDashboard />
                </ProtectedRoute>
              } />
              <Route path="/player" element={
                <ProtectedRoute allowedRoles={['player']}>
                  <PlayerDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;