export default function SquadList({ squad }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-cyan-500/30">
      <h3 className="text-xl font-bold mb-3">My Squad</h3>
      {squad.length === 0 ? (
        <p className="text-gray-400">No players bought yet.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {squad.map(player => (
            <div key={player.id} className="flex justify-between items-center p-2 bg-black/30 rounded">
              <span>{player.full_name}</span>
              <span className="text-cyan-400">{player.sold_price} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}