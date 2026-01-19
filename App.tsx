import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { 
  GameState, Template, Category, Question, QuestionState, Player, User, Session, BoardConfig
} from './types';
import { StorageService } from './services/storageService';
import { generateTriviaContent } from './services/geminiService';
import { logger } from './services/loggerService';
import { soundService } from './services/soundService'; 
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { UI_TEXT } from './constants/uiText';

const CLIENT_SESSION_KEY = 'cruzphamtrivia_client_session_v1';

// --- SVGs & Icons ---
const Icons = {
  Play: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>,
  Pause: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>,
  ChevronLeft: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  WifiOff: () => <svg className="w-4 h-4 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M12 18h.01M8.414 14.414l3.586-3.586m4 0l3.586 3.586M5.707 11.707l2.828-2.828m8 0l2.828 2.828M2.929 9l3.536-3.536m11.314 0L21.071 9" /></svg>,
  VolumeUp: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
  VolumeMute: () => <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
  Detach: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
  Keyboard: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zm-6 0H6v4h2v-4zm16 0h2v4h-2v-4zm-14 0h2v4H8v-4zm0-6h2v4H8V9zm6 0h2v4h-2V9zm-6-6h2v4H8V3zm6 0h2v4h-2V3z" /></svg>,
  Menu: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  User: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Trophy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Attach: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg> // Icon for re-attaching
};

// --- Helper Components ---
const Button: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  className?: string;
  disabled?: boolean;
  title?: string;
}> = ({ onClick, children, variant = 'primary', className = '', disabled, title }) => {
  const base = "font-serif text-xs md:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed select-none disabled:grayscale touch-manipulation";
  
  const styles = {
    primary: "bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold hover:brightness-110 shadow-lg px-4 py-3 md:py-2 rounded-sm active:scale-95",
    secondary: "border border-gold-600 text-gold-400 hover:bg-gold-900/30 px-4 py-3 md:py-2 rounded-sm active:scale-95",
    danger: "bg-red-900/50 text-red-200 hover:bg-red-800 border border-red-800 px-4 py-3 md:py-2 rounded-sm active:scale-95",
    ghost: "text-gold-500 hover:text-gold-200 px-2",
    icon: "p-3 md:p-2 hover:bg-gold-900/20 text-gold-400 rounded-full active:scale-95"
  };

  return <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`} disabled={disabled} title={title}>{children}</button>;
};

// --- GLOBAL HEADER COMPONENT ---
const BrandHeader: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center justify-between px-3 md:px-4 py-1 bg-luxury-black border-b border-gold-900/30 text-[9px] md:text-[10px] tracking-widest font-serif text-gold-600 select-none ${className}`}>
    <span className="font-bold">{UI_TEXT.brand.studioName}</span>
    <span className="opacity-50 hidden sm:inline">{UI_TEXT.brand.appName}</span>
  </div>
);

// --- DIRECTOR PLACEHOLDER COMPONENT (For Main Window when detached) ---
const DirectorPlaceholder: React.FC<{
  onBringBack: () => void;
  className?: string;
}> = ({ onBringBack, className = "" }) => {
  return (
    <div className={`bg-luxury-black border-l border-gold-600 shadow-2xl z-50 flex flex-col items-center justify-center font-sans h-full p-4 ${className}`}>
       <div className="text-gold-500 animate-pulse mb-4">
         <Icons.Detach />
       </div>
       <h3 className="text-gold-200 font-bold tracking-widest text-center mb-2">{UI_TEXT.director.placeholder.title}</h3>
       <p className="text-zinc-500 text-xs text-center mb-6">{UI_TEXT.director.placeholder.desc}</p>
       <Button variant="secondary" onClick={onBringBack} className="w-full flex items-center gap-2">
          <Icons.Attach /> {UI_TEXT.director.placeholder.button}
       </Button>
    </div>
  );
};

// --- DIRECTOR PANEL COMPONENT ---
const DirectorPanel: React.FC<{
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose?: () => void;
  openDetached?: () => void;
  isDetached?: boolean;
  hotkeysEnabled?: boolean;
  toggleHotkeys?: () => void;
  className?: string;
}> = ({ gameState, setGameState, onClose, openDetached, isDetached, hotkeysEnabled, toggleHotkeys, className = "" }) => {
  const [tab, setTab] = useState<'GAME' | 'PLAYERS' | 'QUESTIONS' | 'LOG'>('GAME');
  const [editingQuestion, setEditingQuestion] = useState<{cIndex: number, qIndex: number} | null>(null);

  const updateLog = (action: string, log: string[]) => {
    return [action, ...log].slice(0, 15);
  };

  const updateTitle = (newTitle: string) => {
    setGameState(prev => ({
      ...prev,
      gameTitle: newTitle,
      activityLog: updateLog(`TITLE CHANGED: ${newTitle}`, prev.activityLog)
    }));
  };

  // IMMUTABLE PLAYER UPDATE
  const updatePlayer = (idx: number, updates: Partial<Player>) => {
    setGameState(prev => {
      const updatedPlayers = prev.players.map((p, i) => i === idx ? { ...p, ...updates } : p);
      return { 
        ...prev, 
        players: updatedPlayers, 
        activityLog: updates.score !== undefined ? updateLog(`${prev.players[idx].name} SCORE: ${updates.score}`, prev.activityLog) : prev.activityLog 
      };
    });
  };

  // IMMUTABLE QUESTION UPDATE
  const updateQuestion = (cIndex: number, qIndex: number, updates: Partial<Question>) => {
    setGameState(prev => {
      const newCategories = prev.categories.map((cat, i) => {
          if (i !== cIndex) return cat;
          const newQuestions = cat.questions.map((q, j) => {
              if (j !== qIndex) return q;
              return { ...q, ...updates };
          });
          return { ...cat, questions: newQuestions };
      });
      
      const catName = prev.categories[cIndex]?.name || 'CAT';
      const points = prev.categories[cIndex]?.questions[qIndex]?.points || 0;
      
      return { 
        ...prev, 
        categories: newCategories, 
        activityLog: updateLog(`Q EDITED: ${catName} $${points}`, prev.activityLog) 
      };
    });
  };

  const isRevealed = gameState.currentQuestionState === QuestionState.REVEALED;

  const forceResolve = (action: 'AWARD' | 'VOID' | 'RETURN') => {
    if (!gameState.currentQuestion) return;
    
    // Director override allows force actions anytime, but let's keep basic logic sane
    const { categoryId, questionId } = gameState.currentQuestion;
    
    setGameState(prev => {
       const cats = prev.categories.map(c => 
         c.id === categoryId ? { 
           ...c, 
           questions: c.questions.map(q => {
             if (q.id === questionId) {
               if (action === 'AWARD') return { ...q, state: QuestionState.AWARDED };
               if (action === 'VOID') return { ...q, state: QuestionState.VOIDED };
               return { ...q, state: QuestionState.AVAILABLE };
             }
             return q;
           }) 
         } : c
       );
       
       let newPlayers = prev.players;
       if (action === 'AWARD') {
          const q = prev.categories.find(c => c.id === categoryId)?.questions.find(q => q.id === questionId);
          if (q) {
             const points = q.isDoubleOrNothing ? q.points * 2 : q.points;
             newPlayers = prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, score: p.score + points, streak: p.streak + 1 } : p);
          }
       }

       return {
         ...prev,
         categories: cats,
         players: newPlayers,
         currentQuestion: null,
         currentQuestionState: null,
         activityLog: updateLog(`FORCE ${action}: ${categoryId}`, prev.activityLog)
       };
    });
  };

  return (
    <div className={`bg-luxury-black border-l border-gold-600 shadow-2xl z-50 flex flex-col font-sans h-full ${className}`}>
      {/* Sticky Brand Header */}
      <BrandHeader className="shrink-0" />
      
      {/* Controls Header */}
      <div className="h-12 border-b border-gold-800 bg-luxury-panel flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
           <span className="text-gold-400 font-bold tracking-widest text-xs truncate">{isDetached ? UI_TEXT.director.detachedTitle : UI_TEXT.director.title}</span>
           {isDetached && <span className="text-[10px] text-green-500 animate-pulse hidden sm:inline">● {UI_TEXT.director.sync}</span>}
        </div>
        <div className="flex gap-1">
           {toggleHotkeys && (
             <Button variant="icon" onClick={toggleHotkeys} title={`Keyboard Shortcuts: ${hotkeysEnabled ? 'ON' : 'OFF'}`} className={hotkeysEnabled ? 'text-gold-400' : 'text-zinc-600'}>
               <Icons.Keyboard />
             </Button>
           )}
           {!isDetached && openDetached && <Button variant="icon" onClick={openDetached} title={UI_TEXT.director.popout}><Icons.Detach/></Button>}
           {!isDetached && onClose && <Button variant="icon" onClick={onClose} title={UI_TEXT.director.close}><Icons.Close/></Button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gold-900 bg-black shrink-0 overflow-x-auto">
         {[
            { id: 'GAME', label: UI_TEXT.director.tabs.game },
            { id: 'PLAYERS', label: UI_TEXT.director.tabs.players },
            { id: 'QUESTIONS', label: UI_TEXT.director.tabs.questions },
            { id: 'LOG', label: UI_TEXT.director.tabs.log }
         ].map(t => (
           <button 
             key={t.id} 
             onClick={() => setTab(t.id as any)}
             className={`flex-1 py-3 text-[10px] font-bold tracking-wider hover:bg-gold-900/20 px-2 ${tab === t.id ? 'text-gold-400 border-b-2 border-gold-500' : 'text-zinc-600'}`}
           >
             {t.label}
           </button>
         ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-safe">
         {tab === 'GAME' && (
           <div className="space-y-6">
              <div>
                 <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">{UI_TEXT.director.gameTab.titleLabel}</label>
                 <input 
                   className="w-full bg-black border border-zinc-700 p-2 text-gold-200 text-sm focus:border-gold-500 outline-none" 
                   value={gameState.gameTitle} 
                   onChange={e => updateTitle(e.target.value)}
                 />
              </div>

              <div>
                 <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">{UI_TEXT.director.gameTab.actionsLabel}</label>
                 <div className="grid grid-cols-2 gap-2">
                    <Button variant="primary" disabled={!isRevealed} onClick={() => forceResolve('AWARD')} title={!isRevealed ? "Reveal First" : UI_TEXT.director.gameTab.forceAward}>{UI_TEXT.director.gameTab.forceAward}</Button>
                    <Button variant="danger" disabled={!isRevealed} onClick={() => forceResolve('VOID')} title={!isRevealed ? "Reveal First" : UI_TEXT.director.gameTab.forceVoid}>{UI_TEXT.director.gameTab.forceVoid}</Button>
                    <Button variant="secondary" disabled={!gameState.currentQuestion} onClick={() => setGameState(p => ({...p, currentQuestion: null}))}>{UI_TEXT.director.gameTab.forceClose}</Button>
                    <Button variant="secondary" onClick={() => setGameState(p => ({...p, timer: 0, isTimerRunning: false}))}>{UI_TEXT.director.gameTab.stopTimer}</Button>
                 </div>
                 {!isRevealed && gameState.currentQuestion && (
                    <div className="text-[9px] text-red-500 mt-1 text-center border border-red-900/30 p-1">⚠ REVEAL REQUIRED</div>
                 )}
              </div>

              <div>
                 <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 block">{UI_TEXT.director.gameTab.timerLabel}</label>
                 <div className="flex gap-2">
                    {[10, 15, 30, 60].map(sec => (
                      <button key={sec} onClick={() => setGameState(p => ({...p, timer: sec}))} className="flex-1 bg-zinc-900 border border-zinc-700 text-gold-500 text-xs py-1 hover:bg-zinc-800">{sec}s</button>
                    ))}
                 </div>
              </div>
           </div>
         )}
         {tab === 'PLAYERS' && (
           <div className="space-y-4">
              {gameState.players.map((p, i) => (
                <div key={p.id} className={`bg-zinc-900/50 p-2 border ${i === gameState.activePlayerIndex ? 'border-gold-500' : 'border-zinc-800'}`}>
                   <div className="flex justify-between items-center mb-2 gap-2">
                      <input 
                        className="bg-transparent text-xs font-bold text-gold-300 outline-none w-full"
                        value={p.name}
                        onChange={e => updatePlayer(i, { name: e.target.value })}
                      />
                      <button onClick={() => setGameState(pre => ({...pre, activePlayerIndex: i}))} className={`text-[9px] px-2 py-0.5 shrink-0 rounded ${i === gameState.activePlayerIndex ? 'bg-gold-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                        {i === gameState.activePlayerIndex ? 'ACTIVE' : 'SELECT'}
                      </button>
                   </div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => updatePlayer(i, { score: p.score - 100 })} className="w-8 h-8 bg-red-900/30 text-red-500 flex items-center justify-center border border-red-900">-</button>
                      <input 
                        type="number"
                        className="bg-black text-center text-gold-100 flex-1 border border-zinc-700 h-8 text-sm"
                        value={p.score}
                        onChange={e => updatePlayer(i, { score: parseInt(e.target.value) || 0 })}
                      />
                      <button onClick={() => updatePlayer(i, { score: p.score + 100 })} className="w-8 h-8 bg-green-900/30 text-green-500 flex items-center justify-center border border-green-900">+</button>
                   </div>
                </div>
              ))}
           </div>
         )}
         {tab === 'QUESTIONS' && (
           <div className="space-y-2">
              {!editingQuestion ? (
                 <div className="grid grid-cols-5 gap-1">
                    {gameState.categories.map((c, ci) => (
                      <div key={c.id} className="flex flex-col gap-1">
                         {c.questions.map((q, qi) => (
                           <button 
                             key={q.id} 
                             onClick={() => setEditingQuestion({cIndex: ci, qIndex: qi})}
                             className={`h-6 text-[8px] flex items-center justify-center border ${q.state === QuestionState.VOIDED ? 'bg-red-900/50 border-red-900 text-red-500' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}
                           >
                             {q.points}
                           </button>
                         ))}
                      </div>
                    ))}
                 </div>
              ) : (
                <div className="bg-black border border-gold-600 p-2 space-y-2">
                   <div className="flex justify-between text-xs text-gold-500">
                      <span>EDIT Q</span>
                      <button onClick={() => setEditingQuestion(null)} className="text-zinc-500">BACK</button>
                   </div>
                   {/* Question Edit Form */}
                   {(() => {
                     const q = gameState.categories[editingQuestion.cIndex].questions[editingQuestion.qIndex];
                     return (
                      <>
                        <textarea 
                          className="w-full bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 p-1 h-16"
                          value={q.question}
                          onChange={e => updateQuestion(editingQuestion.cIndex, editingQuestion.qIndex, { question: e.target.value })}
                        />
                        <input 
                          className="w-full bg-zinc-900 border border-zinc-700 text-xs text-green-400 p-1"
                          value={q.answer}
                          onChange={e => updateQuestion(editingQuestion.cIndex, editingQuestion.qIndex, { answer: e.target.value })}
                        />
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] text-zinc-500">POINTS</label>
                              <input 
                                type="number" className="w-12 bg-black border border-zinc-700 text-xs text-gold-300 px-1"
                                value={q.points}
                                onChange={e => updateQuestion(editingQuestion.cIndex, editingQuestion.qIndex, { points: parseInt(e.target.value) })}
                              />
                            </div>
                            <button 
                              onClick={() => updateQuestion(editingQuestion.cIndex, editingQuestion.qIndex, { isDoubleOrNothing: !q.isDoubleOrNothing })}
                              className={`text-[9px] px-2 py-1 border ${q.isDoubleOrNothing ? 'border-red-500 text-red-500' : 'border-zinc-700 text-zinc-700'}`}
                            >
                              {UI_TEXT.common.doubleOrNothing.toUpperCase()}
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            {q.state === QuestionState.VOIDED ? (
                                <button onClick={() => updateQuestion(editingQuestion.cIndex, editingQuestion.qIndex, { state: QuestionState.AVAILABLE })} className="w-full bg-green-900 text-green-200 text-xs font-bold border border-green-600 py-2 animate-pulse">ACTIVATE & UNVOID</button>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => updateQuestion(editingQuestion.cIndex, editingQuestion.qIndex, { state: QuestionState.AVAILABLE })} className="flex-1 bg-green-900/30 text-green-500 text-[9px] border border-green-900 py-1">RESTORE</button>
                                <button onClick={() => updateQuestion(editingQuestion.cIndex, editingQuestion.qIndex, { state: QuestionState.VOIDED })} className="flex-1 bg-red-900/30 text-red-500 text-[9px] border border-red-900 py-1">VOID</button>
                              </div>
                            )}
                        </div>
                      </>
                     );
                   })()}
                </div>
              )}
           </div>
         )}
         {tab === 'LOG' && (
           <div className="space-y-1">
              {gameState.activityLog.map((l, i) => (
                <div key={i} className="text-[9px] font-mono text-zinc-500 border-b border-zinc-900/50 py-1 break-words">{l}</div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
};

// --- SAFE GAME BOARD (ISOLATED COMPONENT) ---
const SafeGameBoard: React.FC<{
  gameState: GameState;
  activeMobileTab: string;
  selectQuestion: (cid: string, qid: string) => void;
  setActiveMobileTab: (tab: 'BOARD' | 'LEADERBOARD') => void;
  logRender: () => void;
}> = memo(({ gameState, activeMobileTab, selectQuestion, setActiveMobileTab, logRender }) => {
  logRender();

  // Defensive Checks: If data is missing (e.g. during sync), show loader instead of crashing
  if (!gameState.categories || !gameState.players) {
    logger.warn('GAME_BOARD_MISSING_DATA', { categories: !!gameState.categories, players: !!gameState.players });
    return <div className="flex-1 flex items-center justify-center text-gold-500 animate-pulse">SYNCHRONIZING BOARD...</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative z-0">
          {/* MOBILE TABS (ONLY VISIBLE ON MOBILE) */}
          <div className="md:hidden flex h-10 border-b border-zinc-900 bg-luxury-panel shrink-0">
            <button onClick={() => setActiveMobileTab('BOARD')} className={`flex-1 text-[10px] font-bold tracking-widest ${activeMobileTab === 'BOARD' ? 'text-gold-400 border-b-2 border-gold-500' : 'text-zinc-600'}`}>BOARD</button>
            <button onClick={() => setActiveMobileTab('LEADERBOARD')} className={`flex-1 text-[10px] font-bold tracking-widest ${activeMobileTab === 'LEADERBOARD' ? 'text-gold-400 border-b-2 border-gold-500' : 'text-zinc-600'}`}>LEADERBOARD</button>
          </div>

          {/* STAGE CONTENT CONTAINER */}
          <div className="flex-1 relative overflow-hidden flex flex-col p-2 md:p-4 gap-4">
              
              {/* BOARD GRID (Visible if Board Tab active OR on Desktop) */}
              <div className={`
                ${(activeMobileTab === 'BOARD' || window.innerWidth >= 768) ? 'flex' : 'hidden'}
                flex-1 grid gap-1 md:gap-2 min-h-0 overflow-auto custom-scrollbar
              `} style={{ gridTemplateColumns: `repeat(${gameState.categories.length}, minmax(100px, 1fr))` }}>
                {gameState.categories.map((cat, i) => (
                  <div key={cat.id || i} className="flex flex-col h-full gap-1 lg:gap-2">
                    {/* Header Tile */}
                    <div className="h-12 md:h-[12%] min-h-[40px] bg-gradient-to-b from-luxury-panel to-black border border-gold-900 flex items-center justify-center p-1 shadow-lg shrink-0">
                      <span className="font-serif font-bold text-center text-gold-300 leading-tight uppercase break-words text-responsive-base line-clamp-2">{cat.name || '...'}</span>
                    </div>
                    {/* Question Tiles */}
                    <div className="flex-1 flex flex-col gap-1 lg:gap-2 overflow-y-auto">
                      {cat.questions.map(q => {
                        const isAvail = q.state === QuestionState.AVAILABLE || q.state === QuestionState.ACTIVE;
                        return (
                          <button 
                            key={q.id}
                            onClick={() => selectQuestion(cat.id, q.id)}
                            disabled={!isAvail}
                            className={`
                              flex-1 min-h-[40px] relative group flex items-center justify-center border transition-all duration-300 shrink-0
                              ${q.state === QuestionState.ACTIVE ? 'bg-gold-500 border-gold-300 shadow-glow-strong z-10' : 
                                q.state === QuestionState.VOIDED ? 'bg-zinc-900/50 border-red-900/30 text-red-700 cursor-not-allowed' :
                                isAvail ? 'bg-luxury-panel border-gold-900/40 hover:bg-gold-900/20 hover:border-gold-500' : 'opacity-0 pointer-events-none'}
                            `}
                          >
                             <span className={`font-serif font-black tracking-tighter text-responsive-lg ${q.state === QuestionState.ACTIVE ? 'text-black' : 'text-gold-500 shadow-black drop-shadow-md'}`}>
                               {q.state === QuestionState.VOIDED ? <span className="text-[10px] font-bold tracking-widest text-red-900/50 transform -rotate-12">VOID</span> : (isAvail ? q.points : '')}
                             </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* LEADERBOARD (Visible if Leaderboard Tab active OR on Desktop) */}
              <div className={`
                 ${activeMobileTab === 'LEADERBOARD' ? 'flex flex-col overflow-y-auto' : 'hidden md:grid'}
                 md:h-[15%] md:min-h-[80px] md:grid-cols-8 gap-2 bg-luxury-dark/50 p-2 rounded border-t border-gold-900/50
              `}>
                {gameState.players.map((p, i) => (
                  <div key={p.id || i} className={`
                     relative flex md:flex-col items-center justify-between md:justify-center rounded border bg-luxury-panel transition-all duration-300 p-3 md:p-0 mb-2 md:mb-0
                     ${i === gameState.activePlayerIndex ? 'border-gold-500 shadow-glow bg-gradient-to-b from-luxury-panel to-gold-900/20' : 'border-zinc-800 opacity-80'}
                  `}>
                     <div className="flex items-center gap-2 md:block md:w-full md:text-center">
                       {i === gameState.activePlayerIndex && <span className="md:absolute md:top-1 md:right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-glow"></span>}
                       <div className="text-xs text-zinc-500 tracking-wider uppercase font-bold truncate">{p.name}</div>
                     </div>
                     
                     <div className={`font-serif font-bold text-lg md:text-responsive-lg leading-none ${p.score < 0 ? 'text-red-500' : 'text-gold-300'}`}>{p.score}</div>
                     
                     {p.streak >= 2 && (
                        <div className="flex items-center gap-1 bg-black/80 border border-orange-500/50 rounded-full px-2 py-0.5 md:absolute md:-top-3 md:left-1/2 md:-translate-x-1/2">
                          <span className="text-[10px] animate-pulse">🔥</span>
                          <span className="text-[9px] font-mono font-bold text-orange-400">{p.streak}</span>
                        </div>
                      )}
                  </div>
                ))}
              </div>

              {/* DESKTOP FOOTER FEED (Hidden on Mobile) */}
              <div className="hidden md:flex h-8 shrink-0 items-center justify-between gap-4 bg-luxury-panel/80 rounded border border-zinc-900 px-4 shadow-lg backdrop-blur-sm">
                 <div className="flex items-center gap-4 text-[9px] text-zinc-600 font-bold uppercase tracking-widest overflow-hidden">
                     <span>{UI_TEXT.game.tooltips.reveal}</span>
                     <span>{UI_TEXT.game.tooltips.award}</span>
                     <span>{UI_TEXT.game.tooltips.void}</span>
                     <span>{UI_TEXT.game.tooltips.return}</span>
                     <span>{UI_TEXT.game.tooltips.playerSelect}</span>
                 </div>
                 <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                       <span className="text-[9px] text-zinc-500 font-serif uppercase tracking-widest">{UI_TEXT.game.live}</span>
                    </div>
                    <div className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-wide min-w-[100px] text-right">
                       {gameState.activityLog[0] || UI_TEXT.game.ready}
                    </div>
                 </div>
              </div>
          </div>
    </div>
  );
});

// --- Internal App Logic ---

function CruzPhamTriviaApp() {
  const { showToast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'GAME' | 'DIRECTOR_DETACHED'>('LOGIN');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRestoring, setIsRestoring] = useState(true);
  
  // Audio State
  const [volume, setVolume] = useState(0.5);
  
  // Dashboard Pagination
  const [dashboardPage, setDashboardPage] = useState(0);
  const ITEMS_PER_PAGE = 8; 

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    gameTitle: "",
    templateId: null,
    categories: [],
    players: Array(8).fill(null).map((_, i) => ({ id: i, name: `PLAYER ${i + 1}`, score: 0, streak: 0 })),
    activePlayerIndex: 0,
    currentQuestion: null,
    currentQuestionState: null, // Initial State
    activityLog: [],
    timer: 0,
    isTimerRunning: false,
    directorMode: false,
  });

  // Local Director State (For Main Window Only)
  const [isDirectorPoppedOut, setIsDirectorPoppedOut] = useState(false);

  // Mobile Tabs
  const [activeMobileTab, setActiveMobileTab] = useState<'BOARD' | 'LEADERBOARD'>('BOARD');

  // Editor State
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupConfig, setSetupConfig] = useState({ cols: 5, rows: 5 });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);

  // Auth State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authLoading, setAuthLoading] = useState(false);
  const [registerSuccessToken, setRegisterSuccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Broadcast Channel for Detached Director
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef(false);

  // Hotkeys Toggle (for Director Panel)
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);

  // --- Initialization & Session Restoration ---
  useEffect(() => {
    const restore = async () => {
      const storedSessionId = localStorage.getItem(CLIENT_SESSION_KEY);
      const params = new URLSearchParams(window.location.search);
      const isDirectorMode = params.get('mode') === 'director';

      if (storedSessionId) {
        const restoredSession = await StorageService.restoreSession(storedSessionId);
        if (restoredSession) {
          setSession(restoredSession);
          setTemplates(StorageService.getTemplates(restoredSession.username));
          
          // Rehydrate Game State
          const activeGame = StorageService.getGameState(restoredSession.sessionId);
          if (activeGame) {
             setGameState(activeGame);
             if (isDirectorMode) {
               setView('DIRECTOR_DETACHED');
               setHotkeysEnabled(false);
               showToast("Director Mode Connected", 'success');
             } else if (activeGame.isActive) {
               setView('GAME');
             } else {
               setView('DASHBOARD');
             }
          } else {
             if (isDirectorMode) {
                setView('DIRECTOR_DETACHED'); 
             } else {
                setView('DASHBOARD');
             }
          }
          setIsRestoring(false);
          return;
        } else {
          localStorage.removeItem(CLIENT_SESSION_KEY);
          if (!isDirectorMode) showToast(UI_TEXT.auth.errors.expired, 'warning');
        }
      }

      if (isDirectorMode) {
        const ticket = params.get('ticket');
        if (ticket) {
           const reusedSession = StorageService.redeemDetachTicket(ticket);
           if (reusedSession) {
              localStorage.setItem(CLIENT_SESSION_KEY, reusedSession.sessionId);
              setSession(reusedSession);
              setView('DIRECTOR_DETACHED');
              setHotkeysEnabled(false);
              const activeGame = StorageService.getGameState(reusedSession.sessionId);
              if (activeGame) setGameState(activeGame);
              
              broadcastRef.current?.postMessage({ type: 'REQUEST_STATE' });
              showToast("Director Mode Connected", 'success');
           } else {
              showToast("Invalid or Expired Director Ticket", 'error');
           }
        } else {
           showToast("Director Mode Requires Ticket", 'error');
        }
      }
      
      setIsRestoring(false);
    };

    restore();
    
    // Setup Broadcast Channel
    broadcastRef.current = new BroadcastChannel('cruzpham_game_state');
    broadcastRef.current.onmessage = (event) => {
      if (isBroadcastingRef.current) return;

      if (event.data.type === 'STATE_UPDATE') {
        isBroadcastingRef.current = true;
        try {
          // SAFE STATE UPDATE: Ensure payload is valid before setting
          if (event.data.payload && event.data.payload.categories) {
             setGameState(event.data.payload);
             
             // Only switch view if not in a critical view already
             if (event.data.payload.isActive && view !== 'GAME' && view !== 'DIRECTOR_DETACHED' && session) {
               setView('GAME');
             }
          }
        } catch (e) {
          logger.error('BROADCAST_STATE_ERROR', e as Error);
        }
      } else if (event.data.type === 'REQUEST_STATE') {
         if (gameState.isActive) {
            broadcastRef.current?.postMessage({ type: 'STATE_UPDATE', payload: gameState });
         }
      } else if (event.data.type === 'DIRECTOR_CLOSED') {
         setIsDirectorPoppedOut(false);
         showToast("Director Controls Restored", 'info');
      }
    };

    return () => broadcastRef.current?.close();
  }, [view]);

  // --- Persistence Effects ---

  // Persist Game State on Change (if session active)
  useEffect(() => {
    if (isBroadcastingRef.current) {
        isBroadcastingRef.current = false;
        if (session) StorageService.saveGameState(session.sessionId, gameState);
        return;
    }

    if (session) {
       StorageService.saveGameState(session.sessionId, gameState);
    }

    if (broadcastRef.current && (gameState.isActive || view === 'DIRECTOR_DETACHED')) {
      broadcastRef.current.postMessage({ type: 'STATE_UPDATE', payload: gameState });
    }
  }, [gameState, session]);

  // Audio Init on first interaction
  const initAudio = () => {
    soundService.init();
    soundService.setVolume(volume);
  };

  const toggleVolume = () => {
    const newVol = volume > 0 ? 0 : 0.5;
    setVolume(newVol);
    soundService.setVolume(newVol);
  };

  // --- Network Monitor ---
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast("Connection Restored", 'success'); };
    const handleOffline = () => { setIsOnline(false); showToast("Network Connection Lost", 'error'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // --- Session Lifecycle ---
  const logout = useCallback(() => {
    if (session) {
      StorageService.logout(session.sessionId);
      StorageService.clearGameState(session.sessionId);
    }
    localStorage.removeItem(CLIENT_SESSION_KEY);
    setSession(null);
    setView('LOGIN');
    setGameState(prev => ({ ...prev, isActive: false }));
    showToast("Logged Out Successfully");
  }, [session, showToast]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (session) {
      interval = setInterval(async () => {
        const isValid = await StorageService.heartbeat(session.sessionId);
        if (!isValid) {
          showToast("Session Expired or Opened on another device.", 'error');
          logout();
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [session, logout, showToast]);

  // --- Actions ---
  const handleAuth = async (isRegister: boolean, username: string, token?: string) => {
    initAudio(); 
    soundService.playClick();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isRegister) {
        const res = await StorageService.register(username);
        if (res.success && res.token) {
          setRegisterSuccessToken(res.token);
          showToast("Identity Generated Successfully", 'success');
        } else {
          setAuthError(res.error || UI_TEXT.auth.errors.invalid);
          showToast(res.error || "Registration failed", 'error');
        }
      } else {
        const res = await StorageService.login(username, token || "");
        if (res.success && res.session) {
          setSession(res.session);
          localStorage.setItem(CLIENT_SESSION_KEY, res.session.sessionId);
          setView('DASHBOARD');
          setTemplates(StorageService.getTemplates(res.session.username));
          showToast("Welcome to the Studio", 'success');
        } else {
          setAuthError(res.error || UI_TEXT.auth.errors.invalid);
          showToast("Invalid Credentials", 'error');
        }
      }
    } catch {
      setAuthError(UI_TEXT.auth.errors.system);
      showToast("Critical Authentication Error", 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const startGame = (template: Template) => {
    initAudio();
    const cid = crypto.randomUUID();
    logger.info('GAME_START', { templateId: template.id, name: template.name }, cid);
    soundService.playClick();
    
    const hasExplicitDon = template.categories.some(c => c.questions.some(q => q.isDoubleOrNothing));

    const gameCategories = template.categories.map(c => {
      const doubleIndex = Math.floor(Math.random() * c.questions.length);
      return {
        ...c,
        questions: c.questions.map((q, idx) => ({ 
          ...q, 
          state: QuestionState.AVAILABLE,
          isDoubleOrNothing: hasExplicitDon ? q.isDoubleOrNothing : (idx === doubleIndex)
        }))
      };
    });

    setGameState(prev => ({
      ...prev,
      isActive: true,
      gameTitle: template.name.toUpperCase(),
      templateId: template.id,
      categories: gameCategories,
      currentQuestion: null,
      currentQuestionState: null, 
      activityLog: [`STARTED: ${template.name}`],
      players: prev.players.map(p => ({ ...p, score: 0, streak: 0 })),
      timer: 0,
      isTimerRunning: false
    }));
    setView('GAME');
  };

  const selectQuestion = useCallback((categoryId: string, questionId: string) => {
    soundService.playClick();
    logger.info('GAME_SELECT_QUESTION', { categoryId, questionId });
    setGameState(prev => {
      const cats = prev.categories.map(c => 
        c.id === categoryId ? { 
          ...c, 
          questions: c.questions.map(q => q.id === questionId ? { ...q, state: QuestionState.ACTIVE } : q)
        } : c
      );
      const cat = cats.find(c => c.id === categoryId);
      const q = cat?.questions.find(q => q.id === questionId);
      if (q?.isDoubleOrNothing) {
        setTimeout(() => soundService.playDoubleOrNothing(), 300);
      }

      return { 
        ...prev, 
        categories: cats, 
        currentQuestion: { categoryId, questionId },
        currentQuestionState: QuestionState.ACTIVE
      };
    });
  }, []);

  const revealAnswer = useCallback(() => {
    if (!gameState.currentQuestion) return;
    soundService.playReveal();
    logger.info('GAME_REVEAL_ANSWER', { ...gameState.currentQuestion });
    
    setGameState(prev => {
      if (!prev.currentQuestion) return prev;
      const { categoryId, questionId } = prev.currentQuestion;
      const cats = prev.categories.map(c => 
        c.id === categoryId ? { ...c, questions: c.questions.map(q => q.id === questionId ? { ...q, state: QuestionState.REVEALED } : q) } : c
      );
      return { 
        ...prev, 
        categories: cats, 
        currentQuestionState: QuestionState.REVEALED,
        isTimerRunning: false 
      };
    });
  }, [gameState.currentQuestion]); 

  const resolveQuestion = useCallback((action: 'AWARD' | 'VOID' | 'RETURN') => {
    if (!gameState.currentQuestion) return;
    
    if (gameState.currentQuestionState !== QuestionState.REVEALED && action !== 'VOID') { 
        if (gameState.currentQuestionState === QuestionState.ACTIVE) {
             showToast("Reveal the answer first", 'error');
             logger.warn("ILLEGAL_ACTION_BLOCKED", { action, state: gameState.currentQuestionState });
             return;
        }
    }
    
    if (gameState.currentQuestionState === QuestionState.ACTIVE) {
        showToast("Reveal the answer first", 'error');
        return;
    }

    const cid = crypto.randomUUID();
    logger.info(`GAME_RESOLVE_${action}`, { ...gameState.currentQuestion }, cid);

    if (action === 'AWARD') soundService.playAward();
    else if (action === 'VOID') soundService.playVoid();
    else soundService.playClick();

    setGameState(prev => {
      if (!prev.currentQuestion) return prev;
      const { categoryId, questionId } = prev.currentQuestion;
      let points = 0;
      let log = '';

      const cats = prev.categories.map(c => 
        c.id === categoryId ? { 
          ...c, 
          questions: c.questions.map(q => {
            if (q.id === questionId) {
              if (action === 'AWARD') {
                points = q.isDoubleOrNothing ? q.points * 2 : q.points;
                log = `${prev.players[prev.activePlayerIndex].name} +${points}${q.isDoubleOrNothing ? ` [${UI_TEXT.common.doubleOrNothing}]` : ''}`;
                logger.audit('GAME_POINTS_AWARDED', { player: prev.activePlayerIndex, points, double: q.isDoubleOrNothing }, cid);
                return { ...q, state: QuestionState.AWARDED };
              }
              if (action === 'VOID') {
                log = `VOIDED ${q.points} PTS`;
                logger.audit('GAME_QUESTION_VOIDED', { points: q.points }, cid);
                return { ...q, state: QuestionState.VOIDED };
              }
              log = `RETURNED`;
              return { ...q, state: QuestionState.AVAILABLE };
            }
            return q;
          }) 
        } : c
      );

      const players = prev.players.map((p, i) => {
        if (i === prev.activePlayerIndex) {
          const newStreak = action === 'AWARD' ? p.streak + 1 : p.streak;
          return { ...p, score: p.score + points, streak: newStreak };
        }
        return p;
      });

      return { 
        ...prev, 
        categories: cats, 
        players, 
        currentQuestion: null, 
        currentQuestionState: null,
        activityLog: [log, ...prev.activityLog].slice(0, 15) 
      };
    });
  }, [gameState.currentQuestion, gameState.currentQuestionState]);

  // --- Keyboard & Timer ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!hotkeysEnabled) return;

      if ((view !== 'GAME' && view !== 'DIRECTOR_DETACHED') || isEditorOpen) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (gameState.currentQuestion) {
         if (gameState.currentQuestionState === QuestionState.ACTIVE) {
            if (e.key === ' ') {
               e.preventDefault();
               revealAnswer();
               return;
            }
            if (['Enter', 'Escape', 'Backspace', 'ArrowUp', 'ArrowDown', '+', '-'].includes(e.key)) {
               e.preventDefault();
               showToast("Reveal the answer first", 'warning');
               return;
            }
            return; 
         }
      }

      switch(e.key) {
        case ' ': e.preventDefault(); revealAnswer(); break;
        case 'Enter': resolveQuestion('AWARD'); break;
        case 'Escape': resolveQuestion('VOID'); break;
        case 'Backspace': resolveQuestion('RETURN'); break;
        case 'ArrowUp': 
          setGameState(p => ({ ...p, activePlayerIndex: (p.activePlayerIndex - 1 + 8) % 8 })); 
          soundService.playClick();
          break;
        case 'ArrowDown': 
          setGameState(p => ({ ...p, activePlayerIndex: (p.activePlayerIndex + 1) % 8 })); 
          soundService.playClick();
          break;
        case '+': 
          setGameState(p => { const pl = [...p.players]; pl[p.activePlayerIndex].score += 100; return {...p, players: pl}; }); 
          soundService.playClick();
          break;
        case '-': 
          setGameState(p => { 
            const pl = [...p.players]; 
            pl[p.activePlayerIndex].score -= 100; 
            pl[p.activePlayerIndex].streak = 0; // Reset streak on penalty
            return {...p, players: pl}; 
          }); 
          soundService.playClick();
          break;
        case 't': case 'T': 
          setGameState(p => ({ ...p, isTimerRunning: !p.isTimerRunning })); 
          soundService.playClick();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [view, isEditorOpen, revealAnswer, resolveQuestion, gameState.currentQuestion, gameState.currentQuestionState, hotkeysEnabled]); 

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState.isTimerRunning && gameState.timer > 0) {
      soundService.playTimerTick();
      interval = setInterval(() => {
        setGameState(p => {
          if (p.timer <= 1) {
            soundService.playVoid(); // Time over sound
            return { ...p, timer: 0, isTimerRunning: false };
          }
          soundService.playTimerTick();
          return { ...p, timer: p.timer - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.isTimerRunning, gameState.timer]);

  // --- AI Gen ---
  const handleAi = async () => {
    if (!editingTemplate || !aiPrompt) return;
    initAudio();
    soundService.playClick();
    const cid = crypto.randomUUID();
    setIsGenerating(true);
    logger.info('AI_GENERATION_START', { prompt: aiPrompt, difficulty: aiDifficulty }, cid);
    
    try {
      const gen = await generateTriviaContent(aiPrompt, editingTemplate.cols, editingTemplate.rows, aiDifficulty);
      setEditingTemplate(prev => {
        if (!prev) return null;
        return {
          ...prev,
          categories: prev.categories.map((c, i) => gen[i] ? { 
            ...c, name: gen[i].name, 
            questions: c.questions.map((q, j) => ({ ...q, question: gen[i].questions[j]?.q || q.question, answer: gen[i].questions[j]?.a || q.answer }))
          } : c)
        };
      });
      logger.audit('AI_GENERATION_SUCCESS', { categories: gen.length }, cid);
      soundService.playAward(); // Success sound
      showToast("Content Generated Successfully", 'success');
    } catch (e) { 
      logger.error('AI_GENERATION_FAILED', e as Error, {}, cid);
      soundService.playVoid(); // Fail sound
      showToast("AI Generation Failed. Try a different topic.", 'error');
    } finally { 
      setIsGenerating(false); 
    }
  };

  const openDetachedDirector = () => {
    if (!session) return;
    
    try {
      const ticket = StorageService.createDetachTicket(session.sessionId);
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'director');
      url.searchParams.set('ticket', ticket);
      const win = window.open(url.toString(), '_blank', 'width=400,height=800');
      
      if (win) {
        setIsDirectorPoppedOut(true);
        showToast("Director Panel Detached", 'info');
      } else {
        showToast("Popup blocked. Allow popups to detach.", 'error');
      }
    } catch (e) {
      logger.error('POP_OUT_ERROR', e as Error);
      showToast("Failed to detach panel", 'error');
    }
  };
  
  const handleBringBackDirector = () => {
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'DIRECTOR_CLOSED' }); // Close the other window if open
    }
    setIsDirectorPoppedOut(false);
    showToast("Director Controls Re-attached", 'info');
  };
  
  // Listen for window close in detached mode
  useEffect(() => {
    if (view === 'DIRECTOR_DETACHED') {
      const handleBeforeUnload = () => {
        if (broadcastRef.current) {
           broadcastRef.current.postMessage({ type: 'DIRECTOR_CLOSED' });
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [view]);

  // --- Views ---

  if (isRestoring) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-luxury-black text-gold-500 font-serif tracking-widest animate-pulse">
         {UI_TEXT.common.reconnecting}
      </div>
    );
  }

  if (view === 'DIRECTOR_DETACHED') {
      return (
        <div className="h-dvh w-full bg-luxury-black overflow-hidden relative">
            <DirectorPanel 
                gameState={gameState}
                setGameState={setGameState}
                isDetached={true}
                hotkeysEnabled={hotkeysEnabled}
                toggleHotkeys={() => setHotkeysEnabled(!hotkeysEnabled)}
            />
        </div>
      );
  }

  if (view === 'LOGIN') {
    return (
      <div className="h-dvh w-full flex flex-col bg-luxury-black bg-luxury-radial font-serif text-gold-400 overflow-hidden">
        <BrandHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-[90%] max-w-[400px] border border-gold-600/30 bg-luxury-dark/95 backdrop-blur-xl p-8 rounded-sm shadow-glow flex flex-col items-center relative">
            {!isOnline && <div className="absolute top-2 right-2 text-red-500 text-[10px] flex items-center gap-1"><Icons.WifiOff/> {UI_TEXT.auth.offline}</div>}
            
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gold-gradient-text tracking-widest">{UI_TEXT.brand.appName}</h1>
                <p className="text-[10px] tracking-[0.6em] text-gold-600 mt-1">TRIVIA STUDIOS</p>
            </div>

            <div className="flex w-full mb-6 border-b border-gold-900">
                {['LOGIN', 'REGISTER'].map(m => (
                <button key={m} onClick={() => { setAuthMode(m as any); setAuthError(null); setRegisterSuccessToken(null); soundService.playClick(); }}
                    className={`flex-1 py-3 text-xs tracking-widest transition-colors ${authMode === m ? 'text-gold-300 border-b-2 border-gold-400' : 'text-zinc-600 hover:text-gold-700'}`}>
                    {m === 'LOGIN' ? UI_TEXT.auth.tabs.login : UI_TEXT.auth.tabs.register}
                </button>
                ))}
            </div>

            {authError && <div className="w-full text-center text-red-400 text-xs mb-4 bg-red-900/10 py-2 border border-red-900/30">{authError}</div>}

            {authMode === 'LOGIN' ? (
                <form className="w-full space-y-4" onSubmit={(e: any) => { e.preventDefault(); handleAuth(false, e.target.username.value, e.target.token.value); }}>
                <div className="space-y-1">
                    <input name="username" placeholder={UI_TEXT.auth.login.usernamePlaceholder} className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" />
                </div>
                <div className="space-y-1">
                    <input name="token" type="password" placeholder={UI_TEXT.auth.login.tokenPlaceholder} className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" />
                </div>
                <p className="text-[10px] text-zinc-600 text-center px-4">{UI_TEXT.auth.login.helper}</p>
                <Button className="w-full py-4 mt-2" disabled={authLoading || !isOnline}>{authLoading ? UI_TEXT.auth.login.authenticating : UI_TEXT.auth.login.button}</Button>
                </form>
            ) : registerSuccessToken ? (
                <div className="w-full text-center animate-pulse">
                <p className="text-xs text-green-500 mb-2 font-sans font-bold">{UI_TEXT.auth.register.successTitle}</p>
                <div className="bg-gold-200 text-black font-mono text-sm p-4 break-all border-2 border-gold-500 mb-2 cursor-pointer hover:bg-white" onClick={() => navigator.clipboard.writeText(registerSuccessToken)}>
                    {registerSuccessToken}
                </div>
                <p className="text-[9px] text-red-500 uppercase font-bold tracking-wider mb-4">{UI_TEXT.auth.register.copyWarning}</p>
                <Button className="w-full" onClick={() => { setAuthMode('LOGIN'); setRegisterSuccessToken(null); soundService.playClick(); }}>{UI_TEXT.auth.register.proceedButton}</Button>
                </div>
            ) : (
                <form className="w-full space-y-4" onSubmit={(e: any) => { e.preventDefault(); handleAuth(true, e.target.username.value); }}>
                <p className="text-[10px] text-center text-zinc-500">{UI_TEXT.auth.register.desc}</p>
                <input name="username" placeholder={UI_TEXT.auth.register.usernamePlaceholder} className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" />
                <Button className="w-full py-4 mt-2" disabled={authLoading || !isOnline}>{authLoading ? UI_TEXT.auth.register.generating : UI_TEXT.auth.register.button}</Button>
                </form>
            )}
            </div>
        </div>
      </div>
    );
  }

  // --- Layout Wrappers ---
  const Header = () => (
    <>
    {/* Global Top Brand Header */}
    <BrandHeader />
    <header className="h-[6dvh] min-h-[48px] flex items-center justify-between px-3 md:px-4 bg-gradient-to-r from-luxury-black to-luxury-dark border-b border-gold-900/50 shrink-0 z-30 pt-safe">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <span className="font-serif font-bold text-base md:text-lg text-gold-400 tracking-widest truncate">
          {gameState.isActive && gameState.gameTitle ? gameState.gameTitle : UI_TEXT.brand.appName}
        </span>
        {gameState.isActive && (
          <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-gold-900/30">
             <span className={`font-mono text-sm md:text-xl leading-none ${gameState.timer < 5 && gameState.isTimerRunning ? 'text-red-500 animate-ping' : 'text-gold-200'}`}>{gameState.timer < 10 ? `0${gameState.timer}` : gameState.timer}</span>
             <button onClick={() => setGameState(p => ({...p, isTimerRunning: !p.isTimerRunning}))} className="text-gold-500 hover:text-white">{gameState.isTimerRunning ? <Icons.Pause/> : <Icons.Play/>}</button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] font-bold text-gold-700 tracking-wider shrink-0">
        <button onClick={toggleVolume} className="text-gold-500 hover:text-white transition-colors" title="Toggle Sound">
          {volume > 0 ? <Icons.VolumeUp/> : <Icons.VolumeMute/>}
        </button>
        {!isOnline && <span className="text-red-500 hidden md:flex items-center gap-1 animate-pulse"><Icons.WifiOff/> LOST</span>}
        
        {/* Mobile Menu / Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
            {view === 'DASHBOARD' ? (
              <>
                <span>{templates.length} TEMPLATES</span>
                <button onClick={() => {logout(); soundService.playClick();}} className="text-gold-500 hover:text-white transition-colors">LOGOUT</button>
              </>
            ) : (
              <>
                 <span className="text-green-600 animate-pulse">● {UI_TEXT.game.live}</span>
                 <button onClick={() => setGameState(p => ({...p, directorMode: !p.directorMode}))} className={`transition-colors flex items-center gap-1 ${gameState.directorMode ? 'text-white' : 'text-gold-500 hover:text-white'}`}><Icons.Edit/> DIRECTOR</button>
                 <button onClick={() => {setView('DASHBOARD'); soundService.playClick();}} className="text-gold-500 hover:text-white transition-colors">END</button>
              </>
            )}
        </div>
        
        {/* Mobile Hamburger Logic could go here, but for now we simplify */}
        <div className="md:hidden flex gap-3">
             {view !== 'DASHBOARD' && (
                <button onClick={() => setGameState(p => ({...p, directorMode: true}))} className="text-gold-500"><Icons.Edit/></button>
             )}
             <button onClick={() => view === 'DASHBOARD' ? logout() : setView('DASHBOARD')} className="text-gold-500"><Icons.Close/></button>
        </div>
      </div>
    </header>
    </>
  );

  const Footer = () => (
    <div className="hidden md:block absolute bottom-2 right-4 text-[9px] text-zinc-800 font-serif tracking-widest pointer-events-none select-none z-10 pb-safe">
      {UI_TEXT.brand.footer}
    </div>
  );

  if (view === 'DASHBOARD') {
    const pageTemplates = templates.slice(dashboardPage * ITEMS_PER_PAGE, (dashboardPage + 1) * ITEMS_PER_PAGE);
    
    // Step 1: Initialize Creation with Setup Modal
    const startCreation = () => {
      soundService.playClick();
      setSetupConfig({ cols: 5, rows: 5 });
      setIsSetupOpen(true);
    };

    // Step 2: Generate Template from Config
    const handleCreateFromSetup = () => {
      const rows = setupConfig.rows;
      const cols = setupConfig.cols;
      
      const newT: Template = { 
        id: crypto.randomUUID(), 
        name: "UNTITLED SHOW", 
        rows, 
        cols,
        boardConfig: {
          version: 2,
          columns: cols,
          rows: rows,
          pointValues: Array.from({length: rows}, (_, i) => Math.min((i + 1) * 100, 1000))
        },
        createdAt: Date.now(), 
        categories: Array(cols).fill(0).map((_, i) => {
           // Randomly assign one Double or Nothing per category for the template default
           const doubleIndex = Math.floor(Math.random() * rows);
           return {
              id: crypto.randomUUID(), 
              name: `CAT ${i+1}`, 
              questions: Array(rows).fill(0).map((_, j) => ({
                id: crypto.randomUUID(), 
                question: "Edit Me", 
                answer: "Answer", 
                points: Math.min((j + 1) * 100, 1000), 
                state: QuestionState.AVAILABLE, 
                isDoubleOrNothing: j === doubleIndex
              }))
           };
        }) 
      };
      
      setEditingTemplate(newT); 
      setIsSetupOpen(false);
      setIsEditorOpen(true); 
      soundService.playClick();
    };

    return (
      <div className="h-dvh w-full flex flex-col bg-luxury-black text-gold-300">
        <Header />
        <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-xl md:text-2xl font-serif text-gold-200 tracking-widest">{UI_TEXT.dashboard.title}</h2>
            <Button onClick={startCreation} variant="primary">{UI_TEXT.dashboard.newButton}</Button>
          </div>
          
          {pageTemplates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                <Icons.Menu />
                <p className="mt-4 text-sm font-sans">{UI_TEXT.dashboard.emptyState}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-20 md:pb-0">
                {pageTemplates.map(t => (
                <div key={t.id} className="relative group border border-gold-900/30 bg-luxury-panel/50 hover:bg-luxury-panel hover:border-gold-600/50 transition-all p-4 flex flex-col justify-between min-h-[140px]">
                    <div>
                    <h3 className="font-bold text-gold-100 truncate tracking-wide">{t.name}</h3>
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase">{t.cols} x {t.rows} GRID</p>
                    </div>
                    <div className="flex gap-2 mt-4 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" className="flex-1 py-1" onClick={() => { setEditingTemplate(t); setIsEditorOpen(true); soundService.playClick(); }}>{UI_TEXT.dashboard.card.edit}</Button>
                    <Button variant="primary" className="flex-1 py-1" onClick={() => startGame(t)}>{UI_TEXT.dashboard.card.live}</Button>
                    <button onClick={() => {
                        if(session) {
                        StorageService.deleteTemplate(session.username, t.id);
                        setTemplates(StorageService.getTemplates(session.username));
                        showToast("Template Deleted", 'info');
                        soundService.playVoid();
                        }
                    }} className="text-red-900 hover:text-red-500 p-1"><Icons.Trash/></button>
                    </div>
                </div>
                ))}
            </div>
          )}

          <div className="h-12 shrink-0 flex items-center justify-center gap-4 mt-auto py-4">
             <Button variant="icon" disabled={dashboardPage === 0} onClick={() => {setDashboardPage(p => p - 1); soundService.playClick();}}><Icons.ChevronLeft/></Button>
             <span className="text-xs font-mono text-zinc-600">{UI_TEXT.dashboard.pagination} {dashboardPage + 1}</span>
             <Button variant="icon" disabled={(dashboardPage + 1) * ITEMS_PER_PAGE >= templates.length} onClick={() => {setDashboardPage(p => p + 1); soundService.playClick();}}><Icons.ChevronRight/></Button>
          </div>
        </div>
        <Footer />
        
        {/* BOARD SETUP MODAL */}
        {isSetupOpen && (
           <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-4xl bg-luxury-panel border border-gold-600 shadow-glow-strong flex flex-col md:flex-row rounded-sm overflow-hidden animate-in fade-in zoom-in duration-300">
                 {/* LEFT: Controls */}
                 <div className="md:w-1/3 p-8 border-r border-gold-900/50 flex flex-col gap-8 bg-gradient-to-br from-luxury-dark to-black">
                    <h2 className="text-xl font-serif text-gold-400 tracking-widest border-b border-gold-800 pb-2">{UI_TEXT.setup.title}</h2>
                    
                    <div className="space-y-4">
                       <div>
                          <label className="text-xs text-zinc-500 font-bold tracking-widest block mb-2">{UI_TEXT.setup.colsLabel}</label>
                          <div className="flex items-center gap-4">
                             <Button variant="secondary" onClick={() => setSetupConfig(p => ({...p, cols: Math.max(1, p.cols - 1)}))}>-</Button>
                             <span className="text-2xl font-mono text-gold-100 w-8 text-center">{setupConfig.cols}</span>
                             <Button variant="secondary" onClick={() => setSetupConfig(p => ({...p, cols: Math.min(8, p.cols + 1)}))}>+</Button>
                          </div>
                       </div>
                       
                       <div>
                          <label className="text-xs text-zinc-500 font-bold tracking-widest block mb-2">{UI_TEXT.setup.rowsLabel}</label>
                          <div className="flex items-center gap-4">
                             <Button variant="secondary" onClick={() => setSetupConfig(p => ({...p, rows: Math.max(1, p.rows - 1)}))}>-</Button>
                             <span className="text-2xl font-mono text-gold-100 w-8 text-center">{setupConfig.rows}</span>
                             <Button variant="secondary" onClick={() => setSetupConfig(p => ({...p, rows: Math.min(10, p.rows + 1)}))}>+</Button>
                          </div>
                          <p className="text-[9px] text-zinc-600 mt-2">{UI_TEXT.setup.rowsHelper}</p>
                       </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                       <Button variant="primary" onClick={handleCreateFromSetup} className="py-4 text-base">{UI_TEXT.setup.button}</Button>
                       <Button variant="ghost" onClick={() => setIsSetupOpen(false)}>{UI_TEXT.setup.cancel}</Button>
                    </div>
                 </div>

                 {/* RIGHT: Preview (Hidden on small mobile) */}
                 <div className="hidden md:flex md:w-2/3 p-8 bg-black flex-col items-center justify-center relative">
                    <span className="absolute top-4 right-4 text-[10px] text-zinc-600 uppercase tracking-widest">PREVIEW</span>
                    <div className="w-full max-w-lg aspect-square flex gap-1 justify-center p-4 border border-zinc-800 rounded">
                       {Array(setupConfig.cols).fill(0).map((_, i) => (
                          <div key={i} className="flex flex-col gap-1 w-full max-w-[60px]">
                             <div className="h-8 bg-gold-900/30 border border-gold-900 flex items-center justify-center">
                                <span className="text-[6px] text-gold-700">CAT</span>
                             </div>
                             <div className="flex-1 flex flex-col gap-1">
                                {Array(setupConfig.rows).fill(0).map((_, j) => (
                                   <div key={j} className="flex-1 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                      <span className="text-[6px] text-zinc-700">{Math.min((j+1)*100, 1000)}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Editor Modal */}
        {isEditorOpen && editingTemplate && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <div className="h-16 border-b border-gold-900 flex items-center justify-between px-6 bg-luxury-panel shrink-0">
               <div className="flex items-center gap-4 overflow-hidden">
                 <span className="text-gold-500 font-bold hidden sm:inline">{UI_TEXT.editor.title}</span>
                 <input className="bg-black border border-zinc-800 text-gold-100 px-2 py-1 focus:border-gold-500 outline-none w-32 md:w-64" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
               </div>
               <div className="flex items-center gap-2 md:gap-4">
                 <div className="hidden md:flex items-center gap-2 bg-black/30 p-1 border border-zinc-800 rounded">
                    <span className="text-[10px] text-purple-400 pl-2">{UI_TEXT.editor.aiLabel}</span>
                    <input className="bg-transparent text-white text-xs outline-none w-24" placeholder={UI_TEXT.editor.aiPlaceholder} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                    <select className="bg-black text-gold-400 text-[10px] border border-zinc-800 h-6 outline-none focus:border-gold-500 cursor-pointer" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                      <option value="Easy">EASY</option>
                      <option value="Medium">MED</option>
                      <option value="Hard">HARD</option>
                      <option value="Expert">EXPT</option>
                    </select>
                    <Button variant="secondary" className="py-0 h-6 text-[10px]" onClick={handleAi} disabled={isGenerating}>{isGenerating ? '...' : UI_TEXT.editor.aiButton}</Button>
                 </div>
                 <Button variant="secondary" onClick={() => { setIsEditorOpen(false); setEditingTemplate(null); soundService.playClick(); }}>{UI_TEXT.editor.cancel}</Button>
                 <Button variant="primary" onClick={() => { 
                   if(session && editingTemplate) { 
                     const saved = StorageService.saveTemplate(session.username, editingTemplate);
                     if (saved) {
                        setTemplates(StorageService.getTemplates(session.username)); 
                        setIsEditorOpen(false);
                        showToast("Show Saved Successfully", 'success');
                        soundService.playAward();
                     } else {
                        showToast("Failed to save (Limit Reached?)", 'error');
                        soundService.playVoid();
                     }
                   }
                 }}>{UI_TEXT.editor.save}</Button>
               </div>
            </div>
            {/* Dynamic Grid Layout for Editor */}
            <div className="flex-1 overflow-auto p-4 grid gap-4 custom-scrollbar" style={{ gridTemplateColumns: `repeat(${editingTemplate.cols}, minmax(200px, 1fr))` }}>
               {editingTemplate.categories.map((c, ci) => (
                 <div key={c.id} className="flex flex-col gap-2 pb-10">
                    <input className="bg-luxury-dark border border-gold-900 text-center text-gold-300 font-bold py-2" value={c.name} onChange={e => { const nc = [...editingTemplate.categories]; nc[ci].name = e.target.value; setEditingTemplate({...editingTemplate, categories: nc}); }} />
                    {c.questions.map((q, qi) => (
                      <div key={q.id} className={`bg-luxury-panel border p-2 flex flex-col gap-1 ${q.isDoubleOrNothing ? 'border-red-900/50 bg-red-900/10' : 'border-zinc-900'}`}>
                        <div className="flex justify-between items-center text-[10px] text-zinc-500">
                          <span>{q.points}</span>
                          <button 
                             onClick={() => {
                               const nc = [...editingTemplate.categories]; 
                               nc[ci].questions[qi].isDoubleOrNothing = !nc[ci].questions[qi].isDoubleOrNothing; 
                               setEditingTemplate({...editingTemplate, categories: nc});
                             }}
                             className={`px-1 py-1 rounded border whitespace-normal text-[8px] leading-tight h-auto ${q.isDoubleOrNothing ? 'text-red-500 border-red-500' : 'text-zinc-700 border-zinc-800 hover:text-zinc-400'}`}
                          >
                             {q.isDoubleOrNothing ? UI_TEXT.common.doubleOrNothing : 'NORMAL'}
                          </button>
                        </div>
                        <textarea className="bg-black text-zinc-300 text-xs p-1 resize-none h-12 border border-zinc-800 focus:border-gold-600 outline-none" value={q.question} onChange={e => { const nc = [...editingTemplate.categories]; nc[ci].questions[qi].question = e.target.value; setEditingTemplate({...editingTemplate, categories: nc}); }} />
                        <input className="bg-black text-green-600 text-xs p-1 border border-zinc-800 focus:border-gold-600 outline-none" value={q.answer} onChange={e => { const nc = [...editingTemplate.categories]; nc[ci].questions[qi].answer = e.target.value; setEditingTemplate({...editingTemplate, categories: nc}); }} />
                      </div>
                    ))}
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- GAME VIEW ---
  if (view === 'GAME') {
    const activePlayer = gameState.players[gameState.activePlayerIndex];

    return (
      <div className="h-dvh w-full flex flex-col bg-luxury-black text-gold-100 overflow-hidden relative">
        <Header />
        
        {/* --- MAIN STAGE AREA (FLEXIBLE) --- */}
        <ErrorBoundary>
          <SafeGameBoard 
            gameState={gameState} 
            activeMobileTab={activeMobileTab}
            selectQuestion={selectQuestion}
            setActiveMobileTab={setActiveMobileTab as any}
            logRender={() => logger.debug('GAME_BOARD_RENDER', { 
              timestamp: Date.now(), 
              activeQuestion: gameState.currentQuestion,
              directorMode: gameState.directorMode 
            })}
          />
        </ErrorBoundary>

        {/* --- MOBILE FIXED ACTION BAR (SAFE AREA) --- */}
        <div className="md:hidden shrink-0 bg-luxury-panel border-t border-gold-900/50 pb-safe z-30">
            <div className="flex flex-col gap-2 p-3">
               {/* Row 1: Active Player & Score Controls */}
               <div className="flex items-center justify-between bg-black/40 rounded p-2 border border-zinc-800">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <Button variant="icon" onClick={() => setGameState(p => ({ ...p, activePlayerIndex: (p.activePlayerIndex - 1 + 8) % 8 }))}><Icons.ChevronLeft/></Button>
                      <div className="flex flex-col">
                         <span className="text-[9px] text-zinc-500 uppercase tracking-widest">ACTIVE</span>
                         <span className="text-xs font-bold text-gold-300 truncate w-24">{activePlayer.name}</span>
                      </div>
                      <Button variant="icon" onClick={() => setGameState(p => ({ ...p, activePlayerIndex: (p.activePlayerIndex + 1) % 8 }))}><Icons.ChevronRight/></Button>
                   </div>
                   <div className="flex items-center gap-2">
                      <Button variant="danger" className="px-3 py-1 text-lg font-bold" onClick={() => setGameState(p => { const pl = [...p.players]; pl[p.activePlayerIndex].score -= 100; pl[p.activePlayerIndex].streak = 0; return {...p, players: pl}; })}>-</Button>
                      <span className={`font-mono text-lg font-bold w-12 text-center ${activePlayer.score < 0 ? 'text-red-500' : 'text-gold-300'}`}>{activePlayer.score}</span>
                      <Button variant="secondary" className="px-3 py-1 text-lg font-bold text-green-500 border-green-900" onClick={() => setGameState(p => { const pl = [...p.players]; pl[p.activePlayerIndex].score += 100; return {...p, players: pl}; })}>+</Button>
                   </div>
               </div>
               {/* Row 2: Game Actions (Context Sensitive) */}
               {gameState.currentQuestion && (
                 <div className="grid grid-cols-4 gap-2">
                    {gameState.currentQuestionState === QuestionState.REVEALED ? (
                      <>
                        <Button variant="primary" className="col-span-2" onClick={() => resolveQuestion('AWARD')}>{UI_TEXT.game.controls.award}</Button>
                        <Button variant="secondary" onClick={() => resolveQuestion('RETURN')}>{UI_TEXT.game.controls.back}</Button>
                        <Button variant="danger" onClick={() => resolveQuestion('VOID')}>{UI_TEXT.game.controls.void}</Button>
                      </>
                    ) : (
                      <Button variant="primary" className="col-span-4 animate-pulse" onClick={revealAnswer}>{UI_TEXT.game.controls.reveal}</Button>
                    )}
                 </div>
               )}
            </div>
        </div>

        {/* --- OVERLAYS --- */}

        {/* DIRECTOR PANEL DRAWER */}
        {gameState.directorMode && (
           <div className="fixed inset-0 z-50 md:absolute md:top-0 md:right-0 md:bottom-0 md:w-80 md:inset-auto">
             {isDirectorPoppedOut ? (
                <DirectorPlaceholder 
                   onBringBack={handleBringBackDirector} 
                   className="w-full h-full shadow-2xl" 
                />
             ) : (
                <DirectorPanel 
                  gameState={gameState} 
                  setGameState={setGameState} 
                  onClose={() => setGameState(p => ({...p, directorMode: false}))}
                  openDetached={openDetachedDirector}
                  hotkeysEnabled={hotkeysEnabled}
                  toggleHotkeys={() => setHotkeysEnabled(!hotkeysEnabled)}
                  className="w-full h-full shadow-2xl"
                />
             )}
           </div>
        )}

        {/* ACTIVE QUESTION OVERLAY (RESPONSIVE) */}
        {gameState.currentQuestion && (() => {
           const cat = gameState.categories.find(c => c.id === gameState.currentQuestion!.categoryId);
           const q = cat?.questions.find(q => q.id === gameState.currentQuestion!.questionId);
           if (!q) return null;
           const isVoided = q.state === QuestionState.VOIDED;

           return (
             <div className="fixed md:absolute inset-0 z-40 bg-luxury-black md:bg-luxury-glass md:backdrop-blur-md flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
                <div className={`w-full h-full md:h-auto md:max-w-5xl md:aspect-video bg-black md:border-2 shadow-glow-strong md:rounded-lg flex flex-col overflow-hidden relative ${isVoided ? 'border-red-900/50' : 'border-gold-600'}`}>
                   {/* Card Header */}
                   <div className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 bg-gradient-to-r from-gold-900/20 to-transparent border-b border-gold-900/50 pt-safe">
                      <span className={`font-serif tracking-widest text-sm md:text-lg ${isVoided ? 'text-zinc-600' : 'text-gold-400'}`}>{cat?.name}</span>
                      <span className={`font-serif font-bold text-xl md:text-2xl ${isVoided ? 'text-zinc-600' : 'text-gold-200'}`}>{q.points}</span>
                   </div>
                   
                   {/* Card Content */}
                   <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center relative overflow-y-auto custom-scrollbar">
                      {isVoided && <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center pointer-events-none"><span className="text-red-500 font-bold text-4xl tracking-[1em] border-4 border-red-900/50 p-8 transform -rotate-12">VOIDED</span></div>}
                      
                      {q.isDoubleOrNothing && !isVoided && (
                        <div className="absolute top-4 md:top-8 px-4 py-1 md:px-6 md:py-2 bg-gradient-to-r from-red-900 to-red-600 text-white font-black text-xs md:text-lg whitespace-nowrap skew-x-[-12deg] shadow-lg animate-bounce border border-red-400 z-10">{UI_TEXT.common.doubleOrNothing}</div>
                      )}
                      
                      <h2 className={`font-serif font-bold leading-tight drop-shadow-lg text-responsive-xl md:text-responsive-hero max-w-4xl my-auto ${isVoided ? 'text-zinc-700 blur-sm' : 'text-white'}`}>{q.question}</h2>
                      
                      {/* USE TOP-LEVEL STATE FOR RENDERING */}
                      {gameState.currentQuestionState === QuestionState.REVEALED && !isVoided && (
                        <div className="mt-8 md:mt-12 pt-8 border-t-2 border-gold-500/30 w-full animate-in slide-in-from-bottom-8 duration-500">
                           <p className="font-serif text-gold-400 text-lg md:text-responsive-xl">{q.answer}</p>
                        </div>
                      )}
                      
                      {gameState.currentQuestionState !== QuestionState.REVEALED && !isVoided && (
                         <div className="mt-auto pt-8 text-zinc-500 text-xs tracking-[0.3em] uppercase animate-pulse">Reveal to continue</div>
                      )}
                   </div>

                   {/* Card Footer Controls (Desktop Only - Mobile uses fixed bar) */}
                   <div className="hidden md:flex h-24 shrink-0 bg-luxury-panel border-t border-gold-900 items-center justify-center gap-6 z-30">
                      {isVoided ? (
                        <Button variant="secondary" onClick={() => resolveQuestion('RETURN')}>CLOSE VOIDED QUESTION</Button>
                      ) : (
                        <>
                           <Button 
                             variant="danger" 
                             disabled={gameState.currentQuestionState !== QuestionState.REVEALED} 
                             onClick={() => resolveQuestion('VOID')}
                             title={UI_TEXT.game.tooltips.void}
                           >
                             {UI_TEXT.game.controls.void}
                           </Button>

                           <Button 
                             variant="secondary" 
                             disabled={gameState.currentQuestionState !== QuestionState.REVEALED} 
                             onClick={() => resolveQuestion('RETURN')}
                             title={UI_TEXT.game.tooltips.return}
                           >
                             {UI_TEXT.game.controls.return}
                           </Button>
                           
                           {gameState.currentQuestionState !== QuestionState.REVEALED ? (
                              <Button onClick={revealAnswer} className="w-64 py-4 text-xl shadow-[0_0_20px_rgba(221,184,86,0.2)] animate-pulse">{UI_TEXT.game.controls.reveal}</Button>
                           ) : (
                              <div className="w-64 text-center text-gold-500 font-bold tracking-widest text-xs opacity-50 select-none">{UI_TEXT.game.controls.revealed}</div>
                           )}

                           <Button 
                             variant="primary" 
                             disabled={gameState.currentQuestionState !== QuestionState.REVEALED} 
                             onClick={() => resolveQuestion('AWARD')} 
                             className={gameState.currentQuestionState === QuestionState.REVEALED ? "w-48 py-3 text-lg" : ""}
                             title={UI_TEXT.game.tooltips.award}
                           >
                             {UI_TEXT.game.controls.award}
                           </Button>
                        </>
                      )}
                   </div>
                   {/* Padding for Mobile Safe Area behind fixed bar */}
                   <div className="md:hidden h-32 w-full shrink-0"></div>
                </div>
             </div>
           )
        })()}
        
        <Footer />
      </div>
    );
  }

  return null;
}

// Wrap with Providers
export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <CruzPhamTriviaApp />
      </ToastProvider>
    </ErrorBoundary>
  );
}