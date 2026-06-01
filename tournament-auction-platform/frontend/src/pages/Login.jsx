import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getUserRole, getDashboardPath } from '../utils/auth';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const signIn = useAuthStore(state => state.signIn);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await signIn(email, password);
      navigate(getDashboardPath(getUserRole(data.user)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-96 border border-cyan-500/30"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-cyan-400">TournamentAuctionX</h1>
        <h2 className="text-xl text-center mb-6 text-white">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-gray-400 mt-4">
          Don't have an account? <a href="/register" className="text-cyan-400">Register</a>
        </p>
      </motion.div>
    </div>
  );
}