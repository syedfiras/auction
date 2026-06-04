import { useState } from 'react';
import { api } from '../../services/api';

export default function PlayerApproval({ players, onUpdate, tournamentActive }) {
  const [loading, setLoading] = useState(null);

  const handleAction = async (id, action) => {
    setLoading(id);
    try {
      if (action === 'approve') await api.approvePlayer(id);
      else await api.rejectPlayer(id);
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">&#9919;</div>
        <h2 className="text-2xl font-bold">Player Registrations</h2>
        {players.length > 0 && (
          <span className="ml-auto bg-yellow-600/30 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-600/30">
            {players.length} pending
          </span>
        )}
      </div>

      {players.length === 0 ? (
        <div className="p-6 bg-black/20 rounded-xl text-center">
          <p className="text-gray-400">No pending registrations.</p>
          <p className="text-gray-500 text-xs mt-1">Players will appear here once they register.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {players.map(player => (
            <div key={player.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl hover:bg-black/40 transition">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{player.full_name}</p>
                <p className="text-xs text-gray-400">
                  {player.position || 'N/A'} &middot; Age: {player.age ?? '?'}
                </p>
              </div>
              <div className="flex gap-2 ml-3 shrink-0">
                <button
                  onClick={() => handleAction(player.id, 'approve')}
                  disabled={loading === player.id}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  {loading === player.id ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleAction(player.id, 'reject')}
                  disabled={loading === player.id}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  {loading === player.id ? '...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
