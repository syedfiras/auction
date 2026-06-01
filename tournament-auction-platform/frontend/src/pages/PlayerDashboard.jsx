import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { initSocket, getSocket } from '../services/socket';
import PlayerRegistrationForm from '../components/dashboard/PlayerRegistrationForm';

const STATUS_STYLES = {
  pending: 'text-yellow-400',
  approved: 'text-green-400',
  rejected: 'text-red-400',
  sold: 'text-blue-400',
  unsold: 'text-gray-400',
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
    if (!socket) return undefined;

    const refresh = () => fetchRegistration();
    socket.on('playerSoldNotification', refresh);
    return () => socket.off('playerSoldNotification', refresh);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        Loading...
      </div>
    );
  }

  const statusClass = STATUS_STYLES[registration?.status] || 'text-gray-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">Player Dashboard</h1>
        {registration ? (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-cyan-500/30">
            <h2 className="text-2xl font-bold mb-4">Your Registration Status</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {registration.full_name}</p>
              <p><strong>Position:</strong> {registration.position}</p>
              <p><strong>Rating:</strong> {registration.skill_rating}</p>
              <p>
                <strong>Status:</strong>
                <span className={`ml-2 font-semibold ${statusClass}`}>
                  {registration.status.toUpperCase()}
                </span>
              </p>

              {registration.status === 'pending' && (
                <p className="text-yellow-400 mt-2">Waiting for admin approval.</p>
              )}
              {registration.status === 'approved' && (
                <p className="text-green-400 mt-2">
                  You have been approved and will appear in the auction.
                </p>
              )}
              {registration.status === 'rejected' && (
                <p className="text-red-400 mt-2">
                  Your registration was rejected. Contact the tournament admin.
                </p>
              )}
              {registration.status === 'sold' && (
                <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/40 rounded-lg">
                  <p className="text-lg font-bold text-blue-300">Congratulations!</p>
                  <p className="mt-2">
                    You were bought by{' '}
                    <span className="text-cyan-400 font-bold text-xl">
                      {registration.team_name || 'your team'}
                    </span>
                  </p>
                  {registration.sold_price != null && (
                    <p className="text-gray-300 mt-1">
                      Sold for <span className="text-white font-semibold">{registration.sold_price}</span> points
                    </p>
                  )}
                </div>
              )}
              {registration.status === 'unsold' && (
                <p className="text-gray-400 mt-2">
                  You went unsold in the auction. Contact the admin if you have questions.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-4 text-sm">
              Registration opens once the admin activates a tournament.
            </p>
            <PlayerRegistrationForm onSuccess={fetchRegistration} />
          </>
        )}
      </div>
    </div>
  );
}
