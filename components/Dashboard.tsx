
import React, { useEffect, useState } from 'react';
import { useGame } from './GameContext';
import { subscribeToTemplates, upsertTemplate, db } from '../firebase';
import { Template } from '../types';
import { createNewTemplate, exportTemplateToJSON, calculateGridMetrics } from '../utils/gameUtils';
import { validateTemplate } from '../utils/validators';
import { doc, deleteDoc } from 'firebase/firestore';

const Dashboard: React.FC = () => {
  const { state, dispatch, logout, notify } = useGame();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [rowCount, setRowCount] = useState(5);

  // Calculate metrics for preview
  const previewMetrics = calculateGridMetrics(rowCount);

  useEffect(() => {
    if (!state.user) return;
    const unsub = subscribeToTemplates(state.user.id, (data) => {
      setTemplates(data as Template[]);
      setLoading(false);
    });
    return () => unsub();
  }, [state.user]);

  const initiateCreate = () => {
    if (templates.length >= 40) {
      notify('error', 'Storage Limit Reached. Max 40 Productions.');
      return;
    }
    setNewProdName('');
    setRowCount(5);
    setIsModalOpen(true);
  };

  const confirmCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTpl = createNewTemplate(state.user!.id, newProdName || "Untitled Production", rowCount);
      await upsertTemplate(newTpl);
      dispatch({ type: 'LOAD_TEMPLATE', payload: newTpl });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to initialize production.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (templates.length >= 40) {
      notify('error', 'Storage Limit Reached.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const valid = validateTemplate(json);
        // Reset IDs to avoid conflict
        const newTpl = {
          ...valid,
          id: `tpl-${Date.now()}`,
          ownerId: state.user!.id,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await upsertTemplate(newTpl);
        notify('success', 'Production Imported Successfully');
      } catch (err) {
        notify('error', 'Invalid File Structure');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this production permanently?")) {
        if(db) {
            await deleteDoc(doc(db, 'templates', id));
            notify('info', 'Production Deleted');
        }
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-12 animate-in fade-in duration-700 relative">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 border-b border-white/5 pb-8 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tight leading-none mb-2">Cruzpham Studio Trivia Dashboard</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] font-black">Operator: {state.user?.username}</p>
            </div>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em]">Vault: {templates.length} / 40</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
             <label className="group px-6 py-3 border border-white/10 bg-white/5 rounded-full text-[10px] text-white/50 hover:text-white hover:border-[#d4af37]/50 uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2">
                <svg className="w-4 h-4 opacity-50 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Import JSON
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
             </label>
            <button onClick={logout} className="px-6 py-3 border border-red-900/30 bg-red-900/5 rounded-full text-[10px] text-red-500/70 hover:bg-red-900/20 hover:text-red-400 uppercase tracking-widest transition-all">
               Disconnect
            </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center mt-32 space-y-4">
             <div className="w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em]">Accessing Vault...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {/* Create Button - Luxury Card */}
          <div 
            onClick={initiateCreate}
            className="group relative h-[300px] glass-card rounded-[2rem] border border-white/10 flex flex-col items-center justify-center gap-6 cursor-pointer overflow-hidden transition-all duration-500 hover:border-[#d4af37]/50 hover:shadow-[0_0_50px_rgba(212,175,55,0.1)]"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/0 to-[#d4af37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#d4af37] group-hover:border-[#d4af37] transition-all duration-500 shadow-2xl">
                <span className="text-4xl font-light text-white/50 group-hover:text-black transition-colors">+</span>
             </div>
             <div className="text-center z-10">
                 <h3 className="text-xl font-display font-bold text-white group-hover:text-[#d4af37] transition-colors">New Production</h3>
                 <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-2 group-hover:text-white/60">Initialize Wizard</p>
             </div>
          </div>
          
          {/* Template List */}
          {templates.map(tpl => (
            <div 
                key={tpl.id}
                onClick={() => dispatch({ type: 'LOAD_TEMPLATE', payload: tpl })}
                className="group relative h-[300px] glass-card p-8 rounded-[2rem] border border-white/5 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:border-[#d4af37]/30 hover:bg-white/[0.02] hover:-translate-y-1"
            >
               {/* Delete Action (Top Right) */}
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <button 
                        onClick={(e) => handleDelete(tpl.id, e)}
                        className="p-2 text-white/20 hover:text-red-500 hover:bg-white/5 rounded-full transition-all"
                        title="Delete Production"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
               </div>
               
               <div className="space-y-6">
                 {/* Visual Icon */}
                 <div className="flex items-start justify-between">
                     <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8a7018] flex items-center justify-center text-black font-black text-xs shadow-lg group-hover:scale-110 transition-transform duration-500">
                        CP
                     </div>
                     <span className="text-[10px] text-white/20 font-mono group-hover:text-[#d4af37] transition-colors">v8.0</span>
                 </div>

                 <div>
                    <h3 className="text-2xl font-display font-bold text-white leading-none mb-3 truncate group-hover:text-[#d4af37] transition-colors">{tpl.name}</h3>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[8px] text-white/50 uppercase tracking-wider">
                            {tpl.categories.length} Columns
                        </span>
                        <span className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[8px] text-white/50 uppercase tracking-wider">
                            {tpl.settings.maxPoints} Max PTS
                        </span>
                    </div>
                 </div>
               </div>

               <div className="space-y-3 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center text-[9px] text-white/30 uppercase tracking-wider">
                      <span>Last Edit</span>
                      <span className="text-white/50">{new Date(tpl.updatedAt).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Action Bar showing on hover */}
                  <div className="pt-2 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => { e.stopPropagation(); exportTemplateToJSON(tpl); }}
                        className="w-full py-3 bg-white/5 hover:bg-[#d4af37] hover:text-black border border-white/5 hover:border-[#d4af37] rounded-xl text-[9px] text-white/50 uppercase tracking-[0.2em] font-bold transition-all"
                      >
                        Export Data
                      </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Credits Footer */}
      <footer className="mt-12 text-center border-t border-white/5 pt-8">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold">
            Built by <span className="text-[#d4af37]">CruzPham</span> & <span className="text-[#d4af37]">El</span>
        </p>
      </footer>

      {/* Creation Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="w-full max-w-lg glass-card p-8 rounded-3xl border border-[#d4af37]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                  <div className="text-center mb-8">
                      <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Initialize Production</h2>
                      <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mt-2">Configure Grid Parameters</p>
                  </div>
                  
                  <form onSubmit={confirmCreate} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[9px] text-white/40 uppercase tracking-widest font-bold ml-1">Production Name</label>
                          <input 
                              type="text"
                              value={newProdName}
                              onChange={e => setNewProdName(e.target.value)}
                              placeholder="ENTER TITLE..."
                              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-center text-sm text-white placeholder:text-white/10 focus:border-[#d4af37] outline-none transition-all uppercase tracking-widest"
                              autoFocus
                          />
                      </div>

                      <div className="space-y-4">
                          <div className="flex justify-between items-end">
                              <label className="text-[9px] text-white/40 uppercase tracking-widest font-bold ml-1">Grid Rows (Points)</label>
                              <span className="text-[#d4af37] font-mono text-xl font-bold">{rowCount}</span>
                          </div>
                          <input 
                              type="range"
                              min="1"
                              max="10"
                              value={rowCount}
                              onChange={e => setRowCount(parseInt(e.target.value))}
                              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
                          />
                          <div className="flex justify-between text-[8px] text-white/20 uppercase tracking-wider">
                              <span>1 Row</span>
                              <span>Max 10 Rows</span>
                          </div>
                      </div>

                      <div className="p-4 bg-[#d4af37]/5 rounded-xl border border-[#d4af37]/10 flex flex-col gap-2">
                         <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/60">
                            <span>Max Value:</span>
                            <span className="text-[#d4af37] font-bold">{previewMetrics.maxPoints}</span>
                         </div>
                         <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/60">
                            <span>Step Value:</span>
                            <span className="text-[#d4af37] font-bold">{previewMetrics.step}</span>
                         </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button 
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 py-4 border border-white/10 rounded-xl text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold hover:bg-white/5 hover:text-white transition-all"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className="flex-1 py-4 bg-[#d4af37] text-black rounded-xl text-[10px] uppercase tracking-[0.2em] font-black hover:bg-white transition-all shadow-lg"
                          >
                              Create & Save
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
