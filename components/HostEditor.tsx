
import React, { useState, useEffect } from 'react';
import { useGame } from './GameContext';

const HostEditor: React.FC = () => {
  const { state, dispatch, saveTemplate } = useGame();
  const { activeTemplate, saveStatus } = state;

  const [activeTab, setActiveTab] = useState<'config' | 'content'>('content');
  const [selectedCatIndex, setSelectedCatIndex] = useState(0);

  // Protect against browser navigation/close when unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  if (!activeTemplate) return null;

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch({
      type: 'UPDATE_TEMPLATE_SETTINGS',
      payload: { ...activeTemplate.settings, [name]: parseInt(value) || 0 }
    });
  };

  // Status Indicator Component
  const StatusIndicator = () => {
    if (saveStatus === 'saving') return (
        <div className="flex items-center gap-2 text-[#d4af37] animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div>
            <span className="text-[9px] uppercase tracking-widest font-bold">Syncing...</span>
        </div>
    );
    if (saveStatus === 'saved') return (
        <div className="flex items-center gap-2 text-white/30">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
            <span className="text-[9px] uppercase tracking-widest font-bold">Vault Synced</span>
        </div>
    );
    return (
        <div className="flex items-center gap-2 text-white/30">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
            <span className="text-[9px] uppercase tracking-widest font-bold">Unsaved</span>
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#050505]/95 backdrop-blur-3xl text-left border-l border-white/10 shadow-2xl">
      <div className="p-6 border-b border-white/10 bg-[#0a0a0a]">
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-display font-bold text-white">Director Panel</h2>
            <StatusIndicator />
        </div>
        
        <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/5">
           <button 
             onClick={() => setActiveTab('content')} 
             className={`flex-1 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-md transition-all duration-300 ${activeTab === 'content' ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'text-white/30 hover:text-white'}`}
           >
             Content
           </button>
           <button 
             onClick={() => setActiveTab('config')} 
             className={`flex-1 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-md transition-all duration-300 ${activeTab === 'config' ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'text-white/30 hover:text-white'}`}
           >
             Config
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {activeTab === 'config' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                 <label className="text-[10px] text-[#d4af37] uppercase tracking-[0.2em] font-bold">Production Identity</label>
                 <input 
                   className="w-full bg-transparent border-b border-white/10 py-3 text-lg font-display text-white focus:border-[#d4af37] outline-none transition-colors placeholder:text-white/20 text-left"
                   value={activeTemplate.name}
                   onChange={(e) => {
                     // Direct mutation trigger
                     activeTemplate.name = e.target.value; 
                     dispatch({ type: 'UPDATE_TEMPLATE_SETTINGS', payload: activeTemplate.settings }); 
                   }} 
                   placeholder="Untitled Production"
                 />
              </div>

              <div className="space-y-6 pt-4 border-t border-white/5">
                 <h3 className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">Grid Architecture</h3>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[9px] text-white/30 uppercase tracking-widest">Min Value</label>
                        <input type="number" name="minPoints" value={activeTemplate.settings.minPoints} onChange={handleConfigChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-xs focus:border-[#d4af37] outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] text-white/30 uppercase tracking-widest">Max Value</label>
                        <input type="number" name="maxPoints" value={activeTemplate.settings.maxPoints} onChange={handleConfigChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-xs focus:border-[#d4af37] outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] text-white/30 uppercase tracking-widest">Step</label>
                        <input type="number" name="step" value={activeTemplate.settings.step} onChange={handleConfigChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-xs focus:border-[#d4af37] outline-none transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] text-white/30 uppercase tracking-widest">Timer (s)</label>
                        <input type="number" name="timerDuration" value={activeTemplate.settings.timerDuration || 30} onChange={handleConfigChange} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-xs focus:border-[#d4af37] outline-none transition-colors" />
                    </div>
                 </div>
                 
                 <div className="p-4 bg-yellow-900/10 border border-yellow-700/20 rounded-xl flex gap-3 items-start">
                    <span className="text-xl">⚠️</span>
                    <p className="text-[10px] text-yellow-500/60 leading-relaxed font-light">
                        Modifying grid metrics will trigger a logic rebalance. Existing questions may be shifted or archived.
                    </p>
                 </div>
              </div>

              <div className="pt-8">
                 <button onClick={saveTemplate} className="w-full py-4 border border-[#d4af37]/30 text-[#d4af37] text-[10px] uppercase tracking-[0.3em] hover:bg-[#d4af37] hover:text-black transition-all rounded-xl font-bold shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                    Force Vault Sync
                 </button>
              </div>
           </div>
        )}

        {activeTab === 'content' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               {/* Category Selector */}
               <div className="space-y-3">
                  <label className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">Active Column</label>
                  <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x">
                      {activeTemplate.categories.map((cat, idx) => {
                          const hasIssues = cat.questions.some(q => 
                            !q.prompt || q.prompt.trim() === '' || q.prompt === 'Enter Question Prompt...' ||
                            !q.answer || q.answer.trim() === '' || q.answer === 'Enter Answer...'
                          );
                          const hasMedia = cat.questions.some(q => 
                             (q.type === 'image' || q.type === 'audio') && q.mediaUrl && q.mediaUrl.trim() !== ''
                          );

                          return (
                              <button
                                key={cat.id}
                                onClick={() => setSelectedCatIndex(idx)}
                                className={`shrink-0 w-12 h-12 rounded-xl text-[10px] font-bold flex items-center justify-center border transition-all duration-300 snap-center relative ${selectedCatIndex === idx ? 'bg-[#d4af37] text-black border-[#d4af37] scale-110 shadow-lg' : 'bg-white/5 border-white/10 text-white/30 hover:text-white hover:border-white/30'}`}
                              >
                                {idx + 1}
                                {/* Issue Indicator (Red Dot) */}
                                {hasIssues && (
                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)] border border-black/50 animate-pulse" title="Incomplete Fields Detected" />
                                )}
                                {/* Media Indicator (Cyan Dot) */}
                                {hasMedia && (
                                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)] border border-black/50" title="Contains Media Assets" />
                                )}
                              </button>
                          );
                      })}
                      {activeTemplate.categories.length < 12 && (
                         <button className="shrink-0 w-12 h-12 rounded-xl border border-white/10 text-white/20 hover:text-[#d4af37] hover:border-[#d4af37] flex items-center justify-center transition-all">
                             +
                         </button>
                      )}
                  </div>
               </div>

               <div className="space-y-4">
                   <div className="flex gap-2">
                       <div className="flex-1 relative group">
                           <label className="absolute -top-2.5 left-2 bg-[#050505] px-2 text-[9px] text-[#d4af37] uppercase tracking-widest font-bold">Column Header</label>
                           <input 
                              value={activeTemplate.categories[selectedCatIndex].title}
                              onChange={(e) => dispatch({ type: 'UPDATE_CATEGORY', payload: { categoryIndex: selectedCatIndex, field: 'title', value: e.target.value } })}
                              className="w-full bg-transparent border border-white/20 rounded-xl p-4 text-sm text-white font-display font-bold text-center focus:border-[#d4af37] outline-none transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                              placeholder="ENTER CATEGORY TITLE"
                           />
                       </div>
                       <div className="w-20 relative group">
                           <label className="absolute -top-2.5 left-2 bg-[#050505] px-2 text-[9px] text-[#d4af37] uppercase tracking-widest font-bold">Size (px)</label>
                           <input 
                              type="number"
                              value={activeTemplate.categories[selectedCatIndex].fontSize || ''}
                              placeholder="Auto"
                              onChange={(e) => dispatch({ 
                                  type: 'UPDATE_CATEGORY', 
                                  payload: { 
                                      categoryIndex: selectedCatIndex, 
                                      field: 'fontSize', 
                                      value: e.target.value ? parseInt(e.target.value) : undefined 
                                  } 
                              })}
                              className="w-full bg-transparent border border-white/20 rounded-xl p-4 text-sm text-white font-mono text-center focus:border-[#d4af37] outline-none transition-all"
                           />
                       </div>
                   </div>
               </div>

               <div className="space-y-6 pt-2">
                  {activeTemplate.categories[selectedCatIndex].questions.map((q, qIdx) => (
                      <div key={q.id} className="relative group bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-[#d4af37]/30 transition-all duration-300">
                          {/* Points Badge */}
                          <div className="flex justify-between items-center">
                              <div className="px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-bold border border-[#d4af37]/20">
                                  {q.points} PTS
                              </div>
                              <button 
                                onClick={() => dispatch({ type: 'MARK_QUESTION_STATUS', payload: { categoryIndex: selectedCatIndex, questionIndex: qIdx, status: q.status === 'available' ? 'void' : 'available' } })}
                                className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded transition-colors cursor-pointer ${q.status === 'void' ? 'text-red-500 hover:text-red-400' : 'text-white/20 hover:text-white'}`}
                              >
                                  {q.status === 'void' ? 'VOIDED' : 'ACTIVE'}
                              </button>
                          </div>
                          
                          <div className="space-y-3">
                              <textarea 
                                 rows={2}
                                 placeholder="Enter Clue..."
                                 value={q.prompt}
                                 onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', payload: { categoryIndex: selectedCatIndex, questionIndex: qIdx, field: 'prompt', value: e.target.value } })}
                                 className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-white focus:border-[#d4af37]/50 outline-none resize-none transition-colors placeholder:text-white/20"
                              />
                              <input 
                                 placeholder="Enter Answer..."
                                 value={q.answer}
                                 onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', payload: { categoryIndex: selectedCatIndex, questionIndex: qIdx, field: 'answer', value: e.target.value } })}
                                 className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-[#d4af37] font-bold focus:border-[#d4af37]/50 outline-none transition-colors placeholder:text-white/20"
                              />
                          </div>
                          
                          {/* Advanced Toggle (Simple implementation) */}
                          <details className="group/details">
                              <summary className="text-[8px] text-white/30 uppercase tracking-widest cursor-pointer hover:text-white list-none flex items-center gap-2">
                                  <span>+ Advanced Media Config</span>
                              </summary>
                              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-white/5 animate-in slide-in-from-top-2">
                                  <select 
                                    value={q.type || 'text'}
                                    onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', payload: { categoryIndex: selectedCatIndex, questionIndex: qIdx, field: 'type', value: e.target.value } })}
                                    className="bg-black/50 border border-white/10 rounded text-[9px] text-white/60 p-2 outline-none focus:border-[#d4af37]"
                                  >
                                      <option value="text">Text Only</option>
                                      <option value="image">Image URL</option>
                                      <option value="audio">Audio URL</option>
                                  </select>
                                  <input 
                                    placeholder="https://..."
                                    value={q.mediaUrl || ''}
                                    onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', payload: { categoryIndex: selectedCatIndex, questionIndex: qIdx, field: 'mediaUrl', value: e.target.value } })}
                                    className="bg-black/50 border border-white/10 rounded text-[9px] text-white/60 p-2 text-left outline-none focus:border-[#d4af37]"
                                  />
                              </div>
                          </details>
                      </div>
                  ))}
               </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default HostEditor;
