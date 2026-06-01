import { useState, useEffect } from 'react';
import { api } from '../services/api';
import AdminControls from '../components/dashboard/AdminControls';
import PlayerApproval from '../components/dashboard/PlayerApproval';
import TeamManagement from '../components/dashboard/TeamManagement';
import TournamentSetup from '../components/dashboard/TournamentSetup';

export default function AdminDashboard() {
  const [tournament, setTournament] = useState(null);
  const [pendingPlayers, setPendingPlayers] = useState([]);

  useEffect(() => {
    fetchTournament();
    fetchPendingPlayers();
  }, []);

  const fetchTournament = async () => {
    try {
      const data = await api.getCurrentTournament();
      setTournament(data);
    } catch (err) {
      console.error('Failed to load tournament', err);
    }
  };

  const fetchPendingPlayers = async () => {
    try {
      const data = await api.getPendingPlayers();
      setPendingPlayers(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">Admin Control Center</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TournamentSetup tournament={tournament} onTournamentChange={setTournament} />
            <AdminControls
              tournamentId={tournament?.id}
              disabled={tournament?.status !== 'active'}
              onAuctionEnded={fetchTournament}
            />
            <PlayerApproval players={pendingPlayers} onUpdate={fetchPendingPlayers} />
          </div>
          <div>
            <TeamManagement tournamentId={tournament?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}