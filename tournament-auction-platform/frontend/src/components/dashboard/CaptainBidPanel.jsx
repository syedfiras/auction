import { useState } from 'react';
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
  const [bidAmount, setBidAmount] = useState(currentBid + 10);
  const socket = getSocket();

  const handleBid = () => {
    if (!socket) return;
    if (bidAmount > remainingPoints) {
      alert('Insufficient points');
      return;
    }
    socket.emit('placeBid', { tournamentId, bidAmount, teamId: myTeamId });
  };

  if (!isActive) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
        <p className="text-xl text-gray-400">Auction is not active.</p>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
        <p className="text-xl text-gray-400">Loading next player...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30 shadow-glow">
      <div className="text-center mb-6">
        <img
          src={currentPlayer.photo_url || '/default-avatar.png'}
          alt={currentPlayer.full_name}
          className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-cyan-400"
        />
        <h2 className="text-3xl font-bold mt-4">{currentPlayer.full_name}</h2>
        <p className="text-xl text-gray-300">
          {currentPlayer.position} • Rating {currentPlayer.skill_rating}
        </p>
      </div>

      <div className="text-center mb-6">
        <motion.div
          animate={timer <= 10 ? { scale: [1, 1.1, 1], color: '#ff4444' } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="text-6xl font-mono font-bold text-cyan-400"
        >
          {timer.toString().padStart(2, '0')}
        </motion.div>
        <p className="text-sm text-gray-400">seconds remaining</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xl">
          <span>Current Bid:</span>
          <span className="text-cyan-400 font-bold">{currentBid} pts</span>
        </div>
        <div className="flex justify-between text-xl">
          <span>Your Points:</span>
          <span className="text-green-400 font-bold">{remainingPoints} pts</span>
        </div>

        <div className="flex gap-4 mt-4">
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            className="flex-1 p-3 rounded-lg bg-black/50 border border-gray-600 text-white text-center text-xl"
            min={currentBid + 10}
            step={10}
          />
          <button
            onClick={handleBid}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-xl transition"
          >
            BID
          </button>
        </div>
      </div>
    </div>
  );
}