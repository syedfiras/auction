import { useState, useEffect } from 'react';
import { useAuctionStore } from '../../stores/auctionStore';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function CaptainBidPanel({ tournamentId }) {
  const { remainingPoints, squad, myTeamId, currentPlayer, timer } = useAuctionStore();
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const team = await api.getMyTeam();
        setTeamInfo(team);
      } catch (err) {
        console.error('Failed to load captain team info', err);
      } finally {
        setLoading(false);
      }
    };
    if (myTeamId) fetchInfo();
  }, [myTeamId, squad]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
        <p className="text-slate-500">Loading team overview...</p>
      </div>
    );
  }

  const squadLimit = teamInfo?.tournaments?.squad_limit || 18;
  const initialPoints = teamInfo?.tournaments?.points_per_team || 1000;
  const spentPoints = initialPoints - remainingPoints;
  const pointsPercentage = initialPoints > 0 ? (remainingPoints / initialPoints) * 100 : 0;

  // Position breakdown
  const positionCounts = squad.reduce((acc, p) => {
    const pos = p.position || 'Unknown';
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      
      {/* Live Auction Broadcast Feed Card */}
      <AnimatePresence mode="wait">
        {currentPlayer && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-slate-900 border border-cyan-500/30 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden"
          >
            {/* Glowing active banner */}
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs uppercase tracking-widest font-extrabold text-cyan-400">
                  Live Auction Broadcast
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                Round {currentPlayer.status === 'unsold' ? '2' : '1'}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Photo & Position */}
              <div className="relative">
                <img
                  src={currentPlayer.photo_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Ccircle cx="100" cy="100" r="90" fill="%23333" stroke="%2300cccc" stroke-width="6"/%3E%3Ctext x="100" y="115" text-anchor="middle" fill="%2300cccc" font-size="60"%3E👤%3C/text%3E%3C/svg%3E'}
                  alt={currentPlayer.full_name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-cyan-400 shadow-md"
                />
              </div>

              {/* Name / Position details */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold uppercase tracking-wide">{currentPlayer.full_name}</h3>
                <p className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mt-0.5">
                  {currentPlayer.position || 'N/A'}
                </p>
                <div className="mt-3 flex justify-center md:justify-start gap-3 flex-wrap">
                  <span className="text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 truncate max-w-[200px]">
                    Skills: {currentPlayer.skills || 'All-Rounder'}
                  </span>
                </div>
              </div>

              {/* Ticking Timer */}
              <div className="text-center md:text-right md:border-l border-white/10 md:pl-6 shrink-0 w-full md:w-auto">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Auction Timer</p>
                <div className={`text-4xl md:text-5xl font-mono font-black py-2 px-4 rounded-xl inline-block bg-black/45 border ${timer <= 5 ? 'text-red-500 border-red-500/30 animate-pulse' : 'text-cyan-400 border-cyan-500/10'}`}>
                  {timer}s
                </div>
                <p className="text-[9px] text-gray-500 mt-2 font-medium italic">Bidding is room-physical. Captain input disabled.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Header/Banner Card */}
      <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden border border-cyan-500/20">
        <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-10 text-9xl select-none">
          ⚽
        </div>
        <div className="relative z-10">
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Team Hub
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3 tracking-tight">{teamInfo?.name || 'My Team'}</h2>
          <p className="text-sm text-cyan-200/80 mt-1 font-medium">
            Captain: <span className="text-white font-semibold">{teamInfo?.captain_name || 'Assigned'}</span>
          </p>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Point Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Point Pool</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-950 font-mono">{remainingPoints}</span>
              <span className="text-xs text-slate-500">pts remaining</span>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pointsPercentage}%` }}
                className="h-full rounded-full bg-cyan-600"
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-500">
              <span>{spentPoints} pts spent</span>
              <span>Total: {initialPoints}</span>
            </div>
          </div>
        </div>

        {/* Squad Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Squad Slots</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-950 font-mono">{squad.length}</span>
              <span className="text-xs text-slate-500">/ {squadLimit} players</span>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (squad.length / squadLimit) * 100)}%` }}
                className="h-full rounded-full bg-purple-600"
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-500">
              <span>{squadLimit - squad.length} slots left</span>
              <span>Limit: {squadLimit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Position Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['Striker', 'Midfielder', 'Defender', 'Goalkeeper'].map(pos => {
            const count = positionCounts[pos] || 0;
            return (
              <div key={pos} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-medium">{pos}s</p>
                <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
