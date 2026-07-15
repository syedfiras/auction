import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { initSocket } from '../services/socket';
import PlayerRegistrationForm from '../components/dashboard/PlayerRegistrationForm';

const STATUS_CONFIG = {
  pending: { color: 'text-yellow-700', bg: 'bg-white', border: 'border-yellow-200', msg: 'Waiting for admin approval.' },
  approved: { color: 'text-green-700', bg: 'bg-white', border: 'border-green-200', msg: 'You have been approved and will appear in the auction.' },
  rejected: { color: 'text-red-700', bg: 'bg-white', border: 'border-red-200', msg: 'Your registration was rejected. Contact the tournament admin.' },
  captain: { color: 'text-indigo-700', bg: 'bg-white', border: 'border-indigo-200', msg: 'You have been assigned as a team captain and will not enter the player auction.' },
  sold: { color: 'text-blue-700', bg: 'bg-white', border: 'border-blue-200', msg: '' },
  unsold: { color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', msg: 'You went unsold in the auction.' },
};

export default function PlayerDashboard() {
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRegistration = async () => {
    try {
      const data = await api.getMyRegistration();
      setRegistration(data || null);
    } catch (err) {
      console.error(err);
      setRegistration(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistration();
  }, []);

  useEffect(() => {
    const socket = initSocket();
    if (!socket) return;
    const refresh = () => fetchRegistration();
    socket.on('playerSoldNotification', refresh);
    socket.on('playerStatusUpdated', refresh);
    return () => {
      socket.off('playerSoldNotification', refresh);
      socket.off('playerStatusUpdated', refresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-700">Loading...</div>
      </div>
    );
  }

  const st = STATUS_CONFIG[registration?.status] || { color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', msg: '' };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-950">Player Dashboard</h1>
          <p className="text-slate-500 text-sm">Manage your tournament registration</p>
        </motion.div>

        {registration ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={registration.status}>
            <div className={`${st.bg} ${st.border} p-6 rounded-lg border shadow-sm`}>
              <h2 className="text-xl font-semibold mb-4">Your Registration</h2>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium">{registration.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Position</span>
                  <span className="font-medium">{registration.position || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-semibold ${st.color}`}>{registration.status.toUpperCase()}</span>
                </div>
              </div>
              {registration.status === 'sold' && registration.team_name && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-lg font-semibold text-blue-700">Congratulations</p>
                  <p className="mt-1">
                    Bought by <span className="text-slate-950 font-semibold">{registration.team_name}</span>
                  </p>
                  {registration.sold_price != null && (
                    <p className="text-slate-600 mt-1">
                      Sold for <span className="text-slate-950 font-semibold">{registration.sold_price}</span> points
                    </p>
                  )}
                </div>
              )}
              {st.msg && <p className={`mt-3 ${st.color} text-sm`}>{st.msg}</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-slate-500 mb-4 text-sm">
              Registration opens once the admin activates a tournament.
            </p>
            <PlayerRegistrationForm onSuccess={fetchRegistration} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
