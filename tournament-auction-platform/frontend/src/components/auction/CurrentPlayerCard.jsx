import { motion } from 'framer-motion';

export default function CurrentPlayerCard({ player, currentBid }) {
  if (!player) return <div className="text-center text-gray-400 py-8">Loading next player...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <img
        src={player.photo_url || 'https://via.placeholder.com/150'}
        alt={player.full_name}
        className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-cyan-400 shadow-glow"
      />
      <h2 className="text-3xl font-bold mt-4">{player.full_name}</h2>
      <p className="text-xl text-gray-300">{player.position} • {player.skill_rating} rating</p>
      <p className="text-2xl text-cyan-400 mt-2">Current Bid: {currentBid} pts</p>
    </motion.div>
  );
}