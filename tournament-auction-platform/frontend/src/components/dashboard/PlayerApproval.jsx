import { api } from '../../services/api';

export default function PlayerApproval({ players, onUpdate }) {
  const handleApprove = async (id) => {
    try {
      await api.approvePlayer(id);
      onUpdate();
    } catch (error) {
      console.error('Failed to approve player:', error);
    }
  };
  const handleReject = async (id) => {
    try {
      await api.rejectPlayer(id);
      onUpdate();
    } catch (error) {
      console.error('Failed to reject player:', error);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-cyan-500/30">
      <h2 className="text-2xl font-bold mb-4">Player Registrations</h2>
      {players.length === 0 && <p className="text-gray-400">No pending registrations.</p>}
      <div className="space-y-3">
        {players.map(player => (
          <div key={player.id} className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
            <div>
              <p className="font-bold">{player.full_name}</p>
              <p className="text-sm text-gray-300">{player.position} • {player.skill_rating} rating</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleApprove(player.id)} className="bg-green-600 px-3 py-1 rounded">Approve</button>
              <button onClick={() => handleReject(player.id)} className="bg-red-600 px-3 py-1 rounded">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}