import { useEffect, useState } from 'react';
import { initSocket } from '../services/socket';
import { useAuctionStore } from '../stores/auctionStore';
import { useAuctionSocket } from '../hooks/useAuctionSocket';
import CaptainBidPanel from '../components/dashboard/CaptainBidPanel';
import SquadList from '../components/dashboard/SquadList';
import { api } from '../services/api';

export default function CaptainDashboard() {
  const [tournamentId, setTournamentId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const { remainingPoints, squad, setMyTeamId, setRemainingPoints, setSquad } = useAuctionStore();

  useEffect(() => {
    const fetchTournamentAndTeam = async () => {
      try {
        setLoadError(null);
        const tournament = await api.getActiveTournament();
        setTournamentId(tournament.id);
        const team = await api.getMyTeam();
        setMyTeamId(team.id);
        setRemainingPoints(team.remaining_points);
        const squadData = await api.getMySquad();
        setSquad(squadData);
      } catch (err) {
        console.error(err);
        setLoadError(err.message);
      }
    };
    fetchTournamentAndTeam();
    initSocket();
  }, [setMyTeamId, setRemainingPoints, setSquad]);

  useAuctionSocket(tournamentId);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8">
        <div className="text-center text-white max-w-md">
          <p className="text-xl mb-2">Captain dashboard unavailable</p>
          <p className="text-gray-400 text-sm">{loadError}</p>
          <p className="text-gray-500 text-sm mt-4">
            Ask the admin to activate the tournament and assign you as a team captain.
          </p>
        </div>
      </div>
    );
  }

  if (!tournamentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-xl">Loading auction...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CaptainBidPanel tournamentId={tournamentId} />
          </div>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-cyan-500/30">
              <h3 className="text-xl font-bold">Remaining Points</h3>
              <p className="text-3xl font-mono text-cyan-400">{remainingPoints}</p>
            </div>
            <SquadList squad={squad} />
          </div>
        </div>
      </div>
    </div>
  );
}
