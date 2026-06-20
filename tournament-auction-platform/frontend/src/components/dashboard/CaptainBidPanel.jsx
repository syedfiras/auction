import { useState, useEffect } from 'react';
import { useAuctionStore } from '../../stores/auctionStore';
import { getSocket } from '../../services/socket';
import { motion } from 'framer-motion';

export default function CaptainBidPanel({ tournamentId }) {
  const {
    currentPlayer,
    currentBid,
    timer,
    isActive,
    myTeamId,
    remainingPoints,
  } = useAuctionStore();
  
  const [bidAmount, setBidAmount] = useState(0);
  const socket = getSocket();

  useEffect(() => {
    setBidAmount(currentBid + 10);
  }, [currentBid]);

  useEffect(() => {
    if (!socket) return;
    const handleBidRejected = (msg) => {
      alert(`Bid Rejected: ${msg}`);
    };
    socket.on('bidRejected', handleBidRejected);
    socket.on('error', handleBidRejected); // also listen to standard error
    return () => {
      socket.off('bidRejected', handleBidRejected);
      socket.off('error', handleBidRejected);
    };
  }, [socket]);

  const handleBid = () => {
    if (!socket) return;
    if (!myTeamId) {
      alert('Error: Team ID not found. Please refresh the page if you were just made a captain.');
      return;
    }
    if (bidAmount > remainingPoints) {
      alert('Insufficient points');
      return;
    }
    socket.emit('placeBid', { tournamentId, bidAmount, teamId: myTeamId });
  };

  if (!isActive) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 text-center border border-cyan-500/10">
        <div className="text-5xl mb-4 opacity-40">&#9200;</div>
        <p className="text-xl text-gray-400">Auction is not active</p>
        <p className="text-gray-500 text-sm mt-1">Wait for the admin to start the auction</p>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 text-center border border-cyan-500/10">
        <div className="animate-spin text-4xl mb-4">&#9917;</div>
        <p className="text-xl text-gray-400">Loading next player...</p>
      </div>
    );
  }

  const canBid = bidAmount > currentBid && bidAmount <= remainingPoints;

  return (
    <div className="bg-gradient-to-br from-cyan-900/10 to-purple-900/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-cyan-500/20 shadow-glow">
      <div className="text-center mb-6">
        <img
          src={currentPlayer.photo_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Ccircle cx="64" cy="64" r="60" fill="%23333" stroke="%2300cccc" stroke-width="4"/%3E%3Ctext x="64" y="74" text-anchor="middle" fill="%2300cccc" font-size="40"%3E👤%3C/text%3E%3C/svg%3E'}
          alt={currentPlayer.full_name}
          className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-cyan-400 shadow-lg shadow-cyan-500/20"
        />
        <h2 className="text-2xl md:text-3xl font-bold mt-4">{currentPlayer.full_name}</h2>
        <p className="text-lg text-gray-300">
          {currentPlayer.position || 'N/A'}
        </p>
      </div>

      <div className="text-center mb-6">
        <motion.div
          animate={timer <= 10 ? { scale: [1, 1.12, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className={`text-6xl font-mono font-bold ${timer <= 5 ? 'text-red-400' : timer <= 10 ? 'text-orange-400' : 'text-cyan-400'}`}
        >
          {timer.toString().padStart(2, '0')}
        </motion.div>
        <p className="text-sm text-gray-400">seconds remaining</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl">
          <span className="text-gray-300">Current Bid</span>
          <span className="text-cyan-400 font-bold text-xl">{currentBid} pts</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl">
          <span className="text-gray-300">Your Points</span>
          <span className="text-green-400 font-bold text-xl">{remainingPoints} pts</span>
        </div>

        <div className="flex gap-3 mt-4">
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(Math.max(0, Number(e.target.value)))}
            className="flex-1 p-3 rounded-xl bg-black/50 border border-gray-600 text-white text-center text-lg focus:border-cyan-400 focus:outline-none"
            min={currentBid + 10}
            step={10}
          />
          <button
            onClick={handleBid}
            disabled={!canBid}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold text-lg transition"
          >
            BID
          </button>
        </div>

        {bidAmount > remainingPoints && (
          <p className="text-red-400 text-xs text-center">Bid exceeds remaining points!</p>
        )}
      </div>
    </div>
  );
}
