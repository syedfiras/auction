import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getUserRole, getDashboardPath } from '../../utils/auth';

export default function Navbar() {
  const { session, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const role = getUserRole(session?.user);
  const dashboardPath = getDashboardPath(role);

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <span className="hidden sm:inline">Auction Arena</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500 uppercase tracking-wider">
              {role}
            </span>
            <Link
              to={dashboardPath}
              className="text-slate-600 hover:text-slate-950 transition px-3 py-1.5 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-slate-950 hover:bg-slate-800 text-white px-4 py-1.5 rounded-md text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
