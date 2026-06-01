import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('player');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const signUp = useAuthStore(state => state.signUp);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signUp(email, password, { full_name: fullName, role });
      navigate('/login');
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
        <h2 className="text-xl text-center mb-6 text-white">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none"
            required
          />
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
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="player">Player</option>
            <option value="captain">Team Captain</option>
          </select>
          <p className="text-gray-500 text-xs">Admin accounts are created separately and cannot sign up here.</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition"
          >
            Register
          </button>
        </form>
        <p className="text-center text-gray-400 mt-4">
          Already have an account? <a href="/login" className="text-cyan-400">Login</a>
        </p>
      </motion.div>
    </div>
  );
}