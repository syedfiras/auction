import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { initSocket } from '../services/socket';
import { useAuctionStore } from '../stores/auctionStore';
import { useAuctionSocket } from '../hooks/useAuctionSocket';
import CaptainBidPanel from '../components/dashboard/CaptainBidPanel';
import SquadList from '../components/dashboard/SquadList';
import { api } from '../services/api';

export default function CaptainDashboard() {
  const [tournamentId, setTournamentId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { remainingPoints, squad, setMyTeamId, setRemainingPoints, setSquad } = useAuctionStore();

  useEffect(() => {
    const fetchTournamentAndTeam = async () => {
      try {
        setLoadError(null);
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchTournamentAndTeam();
    initSocket();
  }, [setMyTeamId, setRemainingPoints, setSquad]);

  useAuctionSocket(tournamentId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-slate-700 text-lg">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xl mb-2 text-slate-950 font-semibold">Captain dashboard unavailable</p>
          <p className="text-slate-600 text-sm">{loadError}</p>
          <p className="text-slate-500 text-sm mt-4">
            Ask the admin to activate the tournament and assign you as a team captain.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!tournamentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-700 text-xl font-semibold">Loading tournament details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CaptainBidPanel tournamentId={tournamentId} />
          </div>
          <div className="space-y-4">
            <SquadList squad={squad} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
