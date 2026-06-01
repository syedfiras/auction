import { motion } from 'framer-motion';

export default function Timer({ value }) {
  const isLow = value <= 10;
  return (
    <div className="text-center my-6">
      <motion.div
        animate={isLow ? { scale: [1, 1.1, 1], textShadow: '0 0 8px red' } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className={`text-6xl font-mono font-bold ${isLow ? 'text-red-500 timer-glow' : 'text-cyan-400'}`}
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <p className="text-sm text-gray-400">seconds remaining</p>
    </div>
  );
}