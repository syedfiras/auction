import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const signUp = useAuthStore(state => state.signUp);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signUp(email, password, { full_name: fullName });
      navigate('/player', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-950">Create Player Account</h1>
          <p className="text-slate-500 text-sm mt-2">Captains are assigned by the admin from registered players.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-700 text-sm block mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
              required
            />
          </div>
          <div>
            <label className="text-slate-700 text-sm block mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
              required
            />
          </div>
          <div>
            <label className="text-slate-700 text-sm block mb-1">Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md bg-white border border-slate-300 text-slate-950 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
              required
              minLength={6}
            />
          </div>
          <p className="text-slate-500 text-xs">Admin accounts are created separately. Captain access is granted after team assignment.</p>
          {error && (
            <p className="text-red-700 text-sm bg-red-50 border border-red-200 p-2 rounded-md">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-950 hover:bg-slate-800 text-white font-semibold py-3 rounded-md transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-slate-500 mt-6 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-slate-950 hover:text-slate-700 transition font-medium">Login</a>
        </p>
      </div>
    </div>
  );
}
