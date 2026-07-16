export default function SquadList({ squad }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-cyan-500/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">&#128081;</span>
        <h3 className="text-lg font-bold">My Squad</h3>
        {squad.length > 0 && (
          <span className="ml-auto text-xs text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded-full">
            {squad.length}
          </span>
        )}
      </div>
      {squad.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">No players bought yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {squad.map(player => (
            <div key={player.id} className="flex justify-between items-center gap-3 p-2.5 bg-black/30 rounded-lg hover:bg-black/40 transition">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{player.full_name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {player.position || 'Position unavailable'} &middot; Age: {player.age ?? 'N/A'} &middot; {player.phone || 'Phone unavailable'}
                </p>
              </div>
              <span className="text-cyan-400 text-sm font-mono shrink-0">{player.sold_price} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
