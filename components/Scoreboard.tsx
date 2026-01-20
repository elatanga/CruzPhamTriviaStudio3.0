
import React from 'react';
import { useGame } from './GameContext';

const Scoreboard: React.FC = () => {
  const { state, dispatch, log, playSound } = useGame();
  const { players, activityLog, isSoundEnabled } = state;

  const handleScore = (id: string, delta: number) => {
    dispatch({ type: 'ADJUST_SCORE', payload: { playerId: id, delta } });
    if (delta > 0) playSound('correct');
    else playSound('wrong');
    const p = players.find(player => player.id === id);
    if(p) log(`${delta > 0 ? '+' : ''}${delta} to ${p.name}`);
  };

  const handleNameChange = (id: string, newName: string) => {
    const p = players.find(player => player.id === id);
    if (p) dispatch({ type: 'UPDATE_PLAYER', payload: { ...p, name: newName } });
  };

  const addPlayer = () => {
    if (players.length >= 8) return;
    const id = `p${Date.now()}`;
    dispatch({ type: 'ADD_PLAYER', payload: { id, name: `Player ${players.length + 1}`, score: 0, isActive: false } });
    log("New Challenger Approaching");
  };

  const removePlayer = (id: string) => {
    dispatch({ type: 'REMOVE_PLAYER', payload: id });
  };

  const step = state.activeTemplate?.settings.step || 100;

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] text-white shadow-2xl overflow-hidden">
       {/* Header */}
       <div className="shrink-0 p-3 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between z-10 h-14">
         <div className="flex flex-col items-start">
             <h2 className="text-[10px] font-display font-bold text-[#d4af37] uppercase tracking-widest">Scoreboard</h2>
             <span className="text-[8px] text-white/30 uppercase tracking-widest">{players.length} / 8 Active</span>
         </div>
         <div className="flex gap-2">
             <button onClick={() => dispatch({ type: 'TOGGLE_SOUND' })} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${isSoundEnabled ? 'border-[#d4af37] text-[#d4af37]' : 'border-white/10 text-white/30'}`}>
                {isSoundEnabled ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                )}
             </button>
             <button onClick={addPlayer} disabled={players.length >= 8} className="w-8 h-8 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-20 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </button>
         </div>
       </div>

       {/* Players Grid - Flexbox Scaling */}
       <div className="flex-1 flex flex-col min-h-0 p-2 gap-2 overflow-y-auto">
          {players.map((p, idx) => (
              <div 
                key={p.id} 
                onClick={() => dispatch({ type: 'SET_PLAYER_ACTIVE', payload: p.id })}
                className={`
                    relative flex-1 min-h-[50px] flex flex-col justify-center px-1 rounded-xl border transition-all duration-300 group
                    ${p.isActive ? 'bg-[#d4af37]/10 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}
                `}
              >
                  {/* Active Indicator / Rank */}
                  <div className={`absolute top-1 left-2 text-[8px] font-mono font-bold ${p.isActive ? 'text-[#d4af37]' : 'text-white/20'}`}>
                      P{idx + 1}
                  </div>
                  
                  {/* Delete (Hover Only) */}
                  <button onClick={(e) => { e.stopPropagation(); removePlayer(p.id); }} className="absolute top-1 right-2 text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <div className="flex items-center justify-between w-full h-full pt-1">
                      {/* Decrease Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleScore(p.id, -step); }} 
                        className="w-8 h-full flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-l-lg transition-all active:scale-90"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"/></svg>
                      </button>

                      {/* Info Center */}
                      <div className="flex flex-col items-center justify-center flex-1 px-1 overflow-hidden">
                          <input 
                            value={p.name} 
                            onChange={(e) => handleNameChange(p.id, e.target.value)}
                            className="w-full bg-transparent text-center font-bold text-[10px] md:text-xs text-white/60 focus:text-[#d4af37] outline-none truncate mb-0.5"
                          />
                          <div className={`text-xl md:text-2xl font-display font-bold leading-none ${p.score < 0 ? 'text-red-400' : 'gold-gradient'}`}>
                            {p.score}
                          </div>
                      </div>

                      {/* Increase Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleScore(p.id, step); }} 
                        className="w-8 h-full flex items-center justify-center text-white/20 hover:text-green-500 hover:bg-green-500/10 rounded-r-lg transition-all active:scale-90"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                      </button>
                  </div>
              </div>
          ))}
          
          {/* Add Player Placeholder if empty space */}
          {players.length < 8 && (
             <button 
                onClick={addPlayer} 
                className="shrink-0 h-10 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 hover:text-[#d4af37] hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5 transition-all text-[9px] uppercase tracking-widest"
             >
                + Add Slot
             </button>
          )}
       </div>

       {/* Activity Log - Compact */}
       <div className="shrink-0 h-24 border-t border-white/10 bg-[#080808]/90 p-3 flex flex-col backdrop-blur-md z-10">
          <h3 className="text-[8px] text-white/30 uppercase tracking-widest mb-2 font-bold flex items-center gap-2">
             <div className="w-1 h-1 rounded-full bg-[#d4af37]"></div>
             Game Log
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
             {activityLog.length === 0 && <div className="text-[9px] text-white/10 italic">No activity recorded.</div>}
             {activityLog.map(log => (
                 <div key={log.id} className="text-[9px] text-white/60 font-mono truncate flex gap-2">
                    <span className="text-[#d4af37]/50 opacity-50">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                    <span className="truncate">{log.message}</span>
                 </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default Scoreboard;
