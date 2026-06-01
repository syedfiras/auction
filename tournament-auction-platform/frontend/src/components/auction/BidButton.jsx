import { useState } from 'react';
import { getSocket } from '../../services/socket';
import { useAuctionStore } from '../../stores/auctionStore';

export default function BidButton({ tournamentId, currentBid }) {
  const [bidAmount, setBidAmount] = useState(currentBid + 10);
  const { myTeamId, remainingPoints } = useAuctionStore();
  const socket = getSocket();

  const handleBid = () => {
    if (!socket) return;
    if (bidAmount > remainingPoints) {
      alert('Insufficient points');
      return;
    }
    socket.emit('placeBid', { tournamentId, bidAmount, teamId: myTeamId });
  };

  const handlePass = () => {
    // Pass logic – simply do nothing? Or we can emit a pass event? For now just ignore.
    // The timer will run out.
  };

  return (
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
        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-xl"
      >
        BID
      </button>
      <button
        onClick={handlePass}
        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold text-xl"
      >
        PASS
      </button>
    </div>
  );
}