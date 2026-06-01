import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getUserRole, getDashboardPath } from '../../utils/auth';
import { motion } from 'framer-motion';

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
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-black/70 backdrop-blur-md border-b border-cyan-500/30 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-cyan-400">
              TournamentAuctionX
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to={dashboardPath}
              className="text-gray-300 hover:text-cyan-400 transition px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600/80 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}