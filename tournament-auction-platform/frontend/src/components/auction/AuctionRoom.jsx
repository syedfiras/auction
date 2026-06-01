import { useAuctionStore } from '../../stores/auctionStore';
import Timer from './Timer';
import CurrentPlayerCard from './CurrentPlayerCard';
import BidButton from './BidButton';

export default function AuctionRoom({ tournamentId }) {
  const { currentPlayer, currentBid, timer, isActive } = useAuctionStore();

  if (!isActive) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-cyan-500/30">
        <p className="text-2xl text-gray-400">Auction is not active. Wait for admin to start.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30 shadow-glow">
      <CurrentPlayerCard player={currentPlayer} currentBid={currentBid} />
      <Timer value={timer} />
      <BidButton tournamentId={tournamentId} currentBid={currentBid} />
    </div>
  );
}