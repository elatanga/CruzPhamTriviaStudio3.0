
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, Template, Category, Question, QuestionState, Player, User, Session, BoardConfig, TokenRequest
} from './types';
import { StorageService } from './services/storageService';
import { generateTriviaContent } from './services/geminiService';
import { logger } from './services/loggerService';
import { soundService } from './services/soundService'; 
import { API } from './services/api'; // Use API for Registration
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { UI_TEXT } from './constants/uiText';

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
  Attach: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
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

// --- DIRECTOR COMPONENT IMPORTS KEPT INLINE FOR SIMPLICITY ---
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

  const updateLog = (action: string) => {
    return [action, ...gameState.activityLog].slice(0, 15);
  };

  const updateTitle = (newTitle: string) => {
    setGameState(prev => ({
      ...prev,
      gameTitle: newTitle,
      activityLog: updateLog(`TITLE CHANGED: ${newTitle}`)
    }));
  };

  const updatePlayer = (idx: number, updates: Partial<Player>) => {
    setGameState(prev => {
      const ps = [...prev.players];
      ps[idx] = { ...ps[idx], ...updates };
      return { ...prev, players: ps, activityLog: updates.score !== undefined ? updateLog(`${ps[idx].name} SCORE: ${updates.score}`) : prev.activityLog };
    });
  };

  const updateQuestion = (cIndex: number, qIndex: number, updates: Partial<Question>) => {
    setGameState(prev => {
      const cats = [...prev.categories];
      cats[cIndex].questions[qIndex] = { ...cats[cIndex].questions[qIndex], ...updates };
      return { ...prev, categories: cats, activityLog: updateLog(`Q EDITED: ${cats[cIndex].name} $${cats[cIndex].questions[qIndex].points}`) };
    });
  };

  const isRevealed = gameState.currentQuestionState === QuestionState.REVEALED;

  const forceResolve = (action: 'AWARD' | 'VOID' | 'RETURN') => {
    if (!gameState.currentQuestion) return;
    if (action !== 'RETURN' && !isRevealed && action !== 'VOID') {
       return; 
    }

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
         activityLog: updateLog(`FORCE ${action}: ${categoryId}`)
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
                              DOUBLE OR NOTHING
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

// --- Internal App Logic ---

function CruzPhamTriviaApp() {
  const { showToast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'GAME' | 'DIRECTOR_DETACHED' | 'ADMIN_CONSOLE'>('LOGIN');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Audio State
  const [volume, setVolume] = useState(0.5);
  
  // Dashboard Pagination
  const [dashboardPage, setDashboardPage] = useState(0);
  const ITEMS_PER_PAGE = 8; 

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    eventName: "", // Initialize eventName
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
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Registration Form State
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    tiktokHandle: '',
    phoneNumber: '',
    preferredUsername: ''
  });
  const [reqSuccess, setReqSuccess] = useState(false);

  // Admin Console State
  const [adminRequests, setAdminRequests] = useState<TokenRequest[]>([]);
  // Admin: Token Modal State
  const [tokenModal, setTokenModal] = useState<{ isOpen: boolean; username: string; token: string } | null>(null);

  // Broadcast Channel for Detached Director
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef(false);

  // Hotkeys Toggle (for Director Panel)
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);

  // --- Initialization ---
  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('cruzpham_game_state');
    
    // Check if we are a detached director
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'director') {
      const ticket = params.get('ticket');
      if (ticket) {
         // Attempt to redeem ticket for session reuse
         const reusedSession = StorageService.redeemDetachTicket(ticket);
         if (reusedSession) {
            setSession(reusedSession);
            setView('DIRECTOR_DETACHED');
            // Disable hotkeys by default in detached mode to avoid conflict, user can enable
            setHotkeysEnabled(false); 
            // Request state from main window
            broadcastRef.current.postMessage({ type: 'REQUEST_STATE' });
            showToast("Director Mode Connected", 'success');
         } else {
            showToast("Invalid or Expired Director Ticket", 'error');
         }
      } else {
         showToast("Director Mode Requires Ticket", 'error');
      }
    }

    broadcastRef.current.onmessage = (event) => {
      // Loop Prevention Logic
      if (isBroadcastingRef.current) return;

      if (event.data.type === 'STATE_UPDATE') {
        isBroadcastingRef.current = true;
        setGameState(event.data.payload);
        
        // If we receive active game state and we are in LOGIN/DASHBOARD (but not detached), jump to GAME
        if (event.data.payload.isActive && view !== 'GAME' && view !== 'DIRECTOR_DETACHED') {
             setView('GAME');
        }
      } else if (event.data.type === 'REQUEST_STATE') {
         // Another window requested state, send ours if we have it
         if (gameState.isActive) {
            broadcastRef.current?.postMessage({ type: 'STATE_UPDATE', payload: gameState });
         }
      } else if (event.data.type === 'DIRECTOR_CLOSED') {
         // Detached window closed, restore panel here
         setIsDirectorPoppedOut(false);
         showToast("Director Controls Restored", 'info');
      }
    };

    return () => broadcastRef.current?.close();
  }, [view, gameState.isActive]);

  // Broadcast state changes
  useEffect(() => {
    // If this update came from broadcast (flag is true), reset flag and DO NOT broadcast back.
    if (isBroadcastingRef.current) {
        isBroadcastingRef.current = false;
        return;
    }

    if (broadcastRef.current && (gameState.isActive || view === 'DIRECTOR_DETACHED')) {
      broadcastRef.current.postMessage({ type: 'STATE_UPDATE', payload: gameState });
    }
  }, [gameState]);

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
    if (session) StorageService.logout(session.sessionId);
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
  const handleAuth = async (username: string, token: string) => {
    initAudio(); 
    soundService.playClick();
    setAuthLoading(true);
    setAuthError(null);
    try {
        const res = await StorageService.login(username, token || "");
        if (res.success && res.session) {
          setSession(res.session);
          setView('DASHBOARD');
          setTemplates(StorageService.getTemplates(res.session.username));
          showToast("Welcome to the Studio", 'success');
        } else {
          setAuthError(res.error || UI_TEXT.auth.errors.invalid);
          showToast("Invalid Credentials", 'error');
        }
    } catch {
      setAuthError(UI_TEXT.auth.errors.system);
      showToast("Critical Authentication Error", 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegistrationSubmit = async () => {
    initAudio();
    soundService.playClick();
    setAuthLoading(true);
    setAuthError(null);
    
    try {
       const res = await API.submitTokenRequest(regForm);
       if (res.success) {
          setReqSuccess(true);
          showToast("Request Sent Successfully", 'success');
       } else {
          setAuthError(res.error?.message || "Unknown error");
          showToast(res.error?.message || "Error submitting request", 'error');
       }
    } catch (e) {
       setAuthError("Network or System Error");
    } finally {
       setAuthLoading(false);
    }
  };

  // --- Admin Logic ---
  const isAdmin = session && ['admin', 'cruzpham', 'eldecoder'].includes(session.username);

  useEffect(() => {
    if (view === 'ADMIN_CONSOLE' && isAdmin) {
       API.getRequests().then(setAdminRequests);
    }
  }, [view, isAdmin]);

  const handleRetryEmail = async (requestId: string) => {
     soundService.playClick();
     showToast("Retrying Email...", 'info');
     try {
       const res = await API.retryTokenRequestEmail(requestId);
       if (res.success) {
          showToast("Email Sent Successfully", 'success');
          // Refresh list
          API.getRequests().then(setAdminRequests);
       } else {
          showToast(res.error?.message || "Retry Failed", 'error');
       }
     } catch (e: any) {
       showToast("Retry Failed: " + e.message, 'error');
     }
  };

  const handleApproveRequest = async (requestId: string) => {
    soundService.playAward();
    try {
      const res = await StorageService.approveTokenRequest(requestId);
      if (res.success && res.token) {
        // Fetch fresh request data to get username if needed, or iterate
        const req = adminRequests.find(r => r.id === requestId);
        setTokenModal({
           isOpen: true,
           username: req?.preferredUsername || 'User',
           token: res.token
        });
        API.getRequests().then(setAdminRequests);
        showToast("Token Generated Successfully", 'success');
      } else {
        showToast(res.error || "Failed to Approve", 'error');
      }
    } catch (e) {
      showToast("System Error", 'error');
    }
  };

  // --- Start Game Logic ---
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
                log = `${prev.players[prev.activePlayerIndex].name} +${points}${q.isDoubleOrNothing ? ' [D.O.N!]' : ''}`;
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
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="w-[90%] max-w-[400px] border border-gold-600/30 bg-luxury-dark/95 backdrop-blur-xl p-8 rounded-sm shadow-glow flex flex-col items-center relative shrink-0">
            {!isOnline && <div className="absolute top-2 right-2 text-red-500 text-[10px] flex items-center gap-1"><Icons.WifiOff/> {UI_TEXT.auth.offline}</div>}
            
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gold-gradient-text tracking-widest">{UI_TEXT.brand.appName}</h1>
                <p className="text-[10px] tracking-[0.6em] text-gold-600 mt-1">TRIVIA STUDIOS</p>
            </div>

            <div className="flex w-full mb-6 border-b border-gold-900">
                {['LOGIN', 'REGISTER'].map(m => (
                <button key={m} onClick={() => { setAuthMode(m as any); setAuthError(null); setReqSuccess(false); soundService.playClick(); }}
                    className={`flex-1 py-3 text-xs tracking-widest transition-colors ${authMode === m ? 'text-gold-300 border-b-2 border-gold-400' : 'text-zinc-600 hover:text-gold-700'}`}>
                    {m === 'LOGIN' ? UI_TEXT.auth.tabs.login : UI_TEXT.auth.tabs.register}
                </button>
                ))}
            </div>

            {authError && <div className="w-full text-center text-red-400 text-xs mb-4 bg-red-900/10 py-2 border border-red-900/30">{authError}</div>}

            {authMode === 'LOGIN' ? (
                <form className="w-full space-y-4" onSubmit={(e: any) => { e.preventDefault(); handleAuth(e.target.username.value, e.target.token.value); }}>
                <div className="space-y-1">
                    <input name="username" placeholder={UI_TEXT.auth.login.usernamePlaceholder} className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" />
                </div>
                <div className="space-y-1">
                    <input name="token" type="password" placeholder={UI_TEXT.auth.login.tokenPlaceholder} className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" />
                </div>
                <p className="text-[10px] text-zinc-600 text-center px-4">{UI_TEXT.auth.login.helper}</p>
                <Button className="w-full py-4 mt-2" disabled={authLoading || !isOnline}>{authLoading ? UI_TEXT.auth.login.authenticating : UI_TEXT.auth.login.button}</Button>
                </form>
            ) : reqSuccess ? (
                <div className="w-full text-center animate-pulse">
                   <p className="text-sm text-green-500 mb-4 font-bold">{UI_TEXT.auth.request.success.title}</p>
                   <p className="text-xs text-zinc-400 mb-6">{UI_TEXT.auth.request.success.message}</p>
                   <Button className="w-full" onClick={() => { setAuthMode('LOGIN'); setReqSuccess(false); soundService.playClick(); }}>{UI_TEXT.auth.request.success.done}</Button>
                </div>
            ) : (
                <form className="w-full space-y-3" onSubmit={(e: any) => { e.preventDefault(); handleRegistrationSubmit(); }}>
                   <p className="text-[10px] text-center text-zinc-500 mb-2">{UI_TEXT.auth.request.desc}</p>
                   <div className="grid grid-cols-2 gap-2">
                      <input placeholder={UI_TEXT.auth.request.fields.first} className="bg-black border border-gold-900 p-2 text-gold-200 text-xs text-center focus:border-gold-500 outline-none uppercase" 
                             value={regForm.firstName} onChange={e => setRegForm({...regForm, firstName: e.target.value})} required />
                      <input placeholder={UI_TEXT.auth.request.fields.last} className="bg-black border border-gold-900 p-2 text-gold-200 text-xs text-center focus:border-gold-500 outline-none uppercase"
                             value={regForm.lastName} onChange={e => setRegForm({...regForm, lastName: e.target.value})} required />
                   </div>
                   <input placeholder={UI_TEXT.auth.request.fields.tiktok} className="w-full bg-black border border-gold-900 p-2 text-gold-200 text-xs text-center focus:border-gold-500 outline-none"
                          value={regForm.tiktokHandle} onChange={e => setRegForm({...regForm, tiktokHandle: e.target.value})} required />
                   <input placeholder="PHONE NUMBER" className="w-full bg-black border border-gold-900 p-2 text-gold-200 text-xs text-center focus:border-gold-500 outline-none"
                          value={regForm.phoneNumber} onChange={e => setRegForm({...regForm, phoneNumber: e.target.value})} required />
                   <input placeholder={UI_TEXT.auth.request.fields.user} className="w-full bg-black border border-gold-900 p-2 text-gold-200 text-xs text-center focus:border-gold-500 outline-none uppercase"
                          value={regForm.preferredUsername} onChange={e => setRegForm({...regForm, preferredUsername: e.target.value})} required />
                   
                   <Button className="w-full py-3 mt-2" disabled={authLoading || !isOnline}>{authLoading ? UI_TEXT.auth.request.buttons.sending : UI_TEXT.auth.request.buttons.submit}</Button>
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
          {view === 'ADMIN_CONSOLE' ? UI_TEXT.admin.title : (gameState.isActive && gameState.gameTitle ? gameState.gameTitle : UI_TEXT.brand.appName)}
        </span>
        {gameState.isActive && view === 'GAME' && (
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
            {view === 'DASHBOARD' || view === 'ADMIN_CONSOLE' ? (
              <>
                {view === 'ADMIN_CONSOLE' ? (
                  <button onClick={() => {setView('DASHBOARD'); soundService.playClick();}} className="text-gold-500 hover:text-white transition-colors">BACK TO DASHBOARD</button>
                ) : (
                  <>
                     {isAdmin && <button onClick={() => {setView('ADMIN_CONSOLE'); soundService.playClick();}} className="text-red-500 hover:text-red-300 transition-colors border border-red-900/50 px-2 py-1 bg-red-900/10">ADMIN CONSOLE</button>}
                     <span>{templates.length} TEMPLATES</span>
                  </>
                )}
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
        
        {/* Mobile Hamburger Logic */}
        <div className="md:hidden flex gap-3">
             {view !== 'DASHBOARD' && view !== 'ADMIN_CONSOLE' && (
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

  // --- ADMIN CONSOLE VIEW ---
  if (view === 'ADMIN_CONSOLE') {
      return (
        <div className="h-dvh w-full flex flex-col bg-luxury-black text-gold-300">
           <Header />
           <div className="flex-1 p-6 overflow-y-auto relative">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-serif text-gold-200 tracking-widest">{UI_TEXT.admin.nav.requests}</h2>
                 <Button variant="secondary" onClick={() => API.getRequests().then(setAdminRequests)}><Icons.Refresh/> REFRESH</Button>
              </div>

              <div className="bg-luxury-panel border border-gold-900/30 rounded overflow-hidden">
                 <div className="grid grid-cols-6 gap-4 p-4 border-b border-gold-900 bg-black/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <div className="col-span-1">Timestamp</div>
                    <div className="col-span-1">Username</div>
                    <div className="col-span-1">TikTok</div>
                    <div className="col-span-1">Phone</div>
                    <div className="col-span-1">Email Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                 </div>
                 {adminRequests.length === 0 ? (
                    <div className="p-8 text-center text-zinc-600 text-sm">No pending requests</div>
                 ) : (
                    adminRequests.map(req => (
                       <div key={req.id} className="grid grid-cols-6 gap-4 p-4 border-b border-gold-900/10 hover:bg-gold-900/5 items-center text-xs">
                          <div className="text-zinc-400">{new Date(req.createdAt).toLocaleString()}</div>
                          <div className="text-gold-200 font-bold">{req.preferredUsername}</div>
                          <div className="text-zinc-400">{req.tiktokHandle}</div>
                          <div className="text-zinc-400">{req.phoneNumber}</div>
                          <div className="flex flex-col">
                             <span className={req.emailStatus === 'SENT' ? 'text-green-500' : 'text-red-500 font-bold'}>{req.emailStatus}</span>
                             {req.emailStatus === 'FAILED' && <span className="text-[9px] text-red-400/70 truncate" title={req.lastError}>{req.lastError}</span>}
                          </div>
                          <div className="flex justify-end gap-2">
                             {req.emailStatus === 'FAILED' && (
                                <Button variant="secondary" className="py-1 px-2 text-[10px]" onClick={() => handleRetryEmail(req.id)}>RETRY EMAIL</Button>
                             )}
                             <Button 
                               variant="primary" 
                               className="py-1 px-2 text-[10px]" 
                               disabled={req.status !== 'PENDING'}
                               onClick={() => handleApproveRequest(req.id)}
                             >
                                {req.status === 'PENDING' ? 'APPROVE' : 'DONE'}
                             </Button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
              
              {/* Token Modal */}
              {tokenModal && tokenModal.isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-luxury-panel border-2 border-gold-500 p-8 rounded-sm shadow-glow-strong text-center relative">
                        <h3 className="text-xl font-serif text-gold-400 tracking-widest mb-2">{UI_TEXT.admin.tokens.modalTitle}</h3>
                        <p className="text-xs text-zinc-500 mb-6 uppercase tracking-wider">For: <span className="text-white font-bold">{tokenModal.username}</span></p>
                        
                        <div className="bg-black border border-zinc-800 p-4 mb-6 select-all">
                            <span className="font-mono text-2xl text-green-500 tracking-wider break-all">{tokenModal.token}</span>
                        </div>
                        
                        <p className="text-xs text-red-500 mb-6 font-bold">{UI_TEXT.admin.tokens.warning}</p>
                        
                        <div className="flex gap-2">
                            <Button className="flex-1 py-3" onClick={() => { navigator.clipboard.writeText(tokenModal.token); showToast("Token Copied", 'success'); }}>{UI_TEXT.admin.tokens.copy}</Button>
                            <Button variant="secondary" className="flex-1 py-3" onClick={() => setTokenModal(null)}>{UI_TEXT.admin.tokens.close}</Button>
                        </div>
                    </div>
                </div>
              )}
           </div>
           <Footer />
        </div>
      );
  }

  // --- DASHBOARD VIEW ---
  if (view === 'DASHBOARD') {
    return (
      <div className="h-dvh w-full flex flex-col bg-luxury-black text-gold-300">
        <Header />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-3xl font-serif text-gold-200 tracking-widest">{isAdmin ? UI_TEXT.dashboard.adminTitle : UI_TEXT.dashboard.title}</h2>
                <Button onClick={() => { 
                   // Create new template logic
                   const newT: Template = {
                     id: crypto.randomUUID(),
                     name: `NEW SHOW ${new Date().toLocaleDateString()}`,
                     rows: 5, cols: 5,
                     createdAt: Date.now(),
                     categories: Array(5).fill(null).map((_, i) => ({
                       id: crypto.randomUUID(),
                       name: `CATEGORY ${i+1}`,
                       questions: Array(5).fill(null).map((_, j) => ({
                         id: crypto.randomUUID(),
                         question: "", answer: "", points: (j+1)*100,
                         state: QuestionState.AVAILABLE, isDoubleOrNothing: false
                       }))
                     }))
                   };
                   if (session) {
                      StorageService.saveTemplate(session.username, newT);
                      setTemplates(StorageService.getTemplates(session.username));
                      setEditingTemplate(newT);
                      setIsEditorOpen(true);
                      soundService.playClick();
                   }
                }}><Icons.Edit /> {UI_TEXT.dashboard.newButton}</Button>
             </div>

             {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border border-zinc-800 rounded-sm bg-zinc-900/20 text-center">
                   <p className="text-zinc-500 mb-4">{UI_TEXT.dashboard.emptyState}</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   {templates.map(t => (
                      <div key={t.id} className="bg-luxury-panel border border-gold-900/50 p-4 hover:border-gold-600 transition-colors group relative">
                          <h3 className="text-gold-100 font-bold truncate mb-1">{t.name}</h3>
                          <p className="text-[10px] text-zinc-500 mb-4 uppercase tracking-wider">{new Date(t.createdAt).toLocaleDateString()}</p>
                          
                          <div className="grid grid-cols-2 gap-2">
                             <Button variant="primary" className="w-full text-[10px]" onClick={() => startGame(t)}>{UI_TEXT.dashboard.card.live}</Button>
                             <Button variant="secondary" className="w-full text-[10px]" onClick={() => {
                                setEditingTemplate(t);
                                setIsEditorOpen(true);
                                soundService.playClick();
                             }}>{UI_TEXT.dashboard.card.edit}</Button>
                             <Button variant="ghost" className="w-full text-[10px]" onClick={() => {
                                StorageService.exportTemplate(session!.username, t.id);
                             }} title="Download JSON"><Icons.Copy/></Button>
                             <Button variant="danger" className="w-full text-[10px]" onClick={() => {
                                if(confirm("Delete this show?")) {
                                   StorageService.deleteTemplate(session!.username, t.id);
                                   setTemplates(StorageService.getTemplates(session!.username));
                                   soundService.playVoid();
                                }
                             }}><Icons.Trash/></Button>
                          </div>
                      </div>
                   ))}
                </div>
             )}
        </div>
        <Footer />
        
        {/* Editor Modal */}
        {isEditorOpen && editingTemplate && (
           <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
              <div className="p-4 border-b border-gold-900 flex justify-between items-center bg-luxury-panel">
                 <h2 className="text-gold-400 font-serif tracking-widest">{UI_TEXT.editor.title}</h2>
                 <div className="flex gap-2">
                    <Button variant="primary" onClick={() => {
                        if (session && editingTemplate) {
                           StorageService.saveTemplate(session.username, editingTemplate);
                           setTemplates(StorageService.getTemplates(session.username));
                           setIsEditorOpen(false);
                           setEditingTemplate(null);
                           soundService.playClick();
                           showToast("Changes Saved", 'success');
                        }
                    }}>{UI_TEXT.editor.save}</Button>
                    <Button variant="secondary" onClick={() => { setIsEditorOpen(false); setEditingTemplate(null); }}>{UI_TEXT.editor.cancel}</Button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                 <div className="mb-6 flex flex-col md:flex-row gap-4 items-end bg-zinc-900/30 p-4 border border-zinc-800">
                    <div className="flex-1 w-full">
                       <label className="text-[10px] text-gold-600 font-bold uppercase tracking-wider mb-1 block">Show Name</label>
                       <input 
                         className="w-full bg-black border border-gold-900 p-2 text-gold-100" 
                         value={editingTemplate.name}
                         onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                       />
                    </div>
                    <div className="flex-1 w-full">
                       <label className="text-[10px] text-gold-600 font-bold uppercase tracking-wider mb-1 block">{UI_TEXT.editor.aiLabel}</label>
                       <div className="flex gap-2">
                          <input 
                             className="flex-1 bg-black border border-gold-900 p-2 text-gold-100 text-xs" 
                             placeholder={UI_TEXT.editor.aiPlaceholder}
                             value={aiPrompt}
                             onChange={e => setAiPrompt(e.target.value)}
                          />
                          <select className="bg-black border border-gold-900 text-gold-500 text-xs p-2" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                             <option>Easy</option>
                             <option>Medium</option>
                             <option>Hard</option>
                          </select>
                          <Button disabled={isGenerating || !aiPrompt} onClick={handleAi}>
                             {isGenerating ? '...' : UI_TEXT.editor.aiButton}
                          </Button>
                       </div>
                    </div>
                 </div>

                 {/* Grid Editor */}
                 <div className="flex overflow-x-auto pb-8 gap-4">
                    {editingTemplate.categories.map((cat, cIdx) => (
                       <div key={cat.id} className="min-w-[250px] w-[250px] flex-shrink-0 flex flex-col gap-2">
                          <input 
                             className="w-full bg-gold-900/20 border border-gold-900 p-2 text-center text-gold-400 font-bold text-sm mb-2 uppercase"
                             value={cat.name}
                             onChange={e => {
                                const newCats = [...editingTemplate.categories];
                                newCats[cIdx].name = e.target.value;
                                setEditingTemplate({...editingTemplate, categories: newCats});
                             }}
                          />
                          {cat.questions.map((q, qIdx) => (
                             <div key={q.id} className="bg-zinc-900 border border-zinc-800 p-2 text-xs flex flex-col gap-2 group hover:border-gold-700 transition-colors">
                                <div className="flex justify-between text-[9px] text-zinc-500">
                                   <span>${q.points}</span>
                                   <button 
                                     onClick={() => {
                                       const newCats = [...editingTemplate.categories];
                                       newCats[cIdx].questions[qIdx].isDoubleOrNothing = !q.isDoubleOrNothing;
                                       setEditingTemplate({...editingTemplate, categories: newCats});
                                     }}
                                     className={q.isDoubleOrNothing ? "text-red-500 font-bold" : "hover:text-gold-500"}
                                   >
                                      {q.isDoubleOrNothing ? "★ D.O.N." : "☆ NORMAL"}
                                   </button>
                                </div>
                                <textarea 
                                   className="w-full bg-black border border-zinc-800 p-1 text-zinc-300 h-12 focus:border-gold-500 outline-none"
                                   placeholder="Question"
                                   value={q.question}
                                   onChange={e => {
                                      const newCats = [...editingTemplate.categories];
                                      newCats[cIdx].questions[qIdx].question = e.target.value;
                                      setEditingTemplate({...editingTemplate, categories: newCats});
                                   }}
                                />
                                <input 
                                   className="w-full bg-black border border-zinc-800 p-1 text-green-500/80 focus:border-green-500 outline-none"
                                   placeholder="Answer"
                                   value={q.answer}
                                   onChange={e => {
                                      const newCats = [...editingTemplate.categories];
                                      newCats[cIdx].questions[qIdx].answer = e.target.value;
                                      setEditingTemplate({...editingTemplate, categories: newCats});
                                   }}
                                />
                             </div>
                          ))}
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  }

  // --- GAME VIEW ---
  if (view === 'GAME') {
     return (
        <div className="h-dvh w-full flex flex-col bg-luxury-black text-gold-300 relative">
           <Header />
           <div className="flex-1 overflow-hidden relative flex">
              {/* Main Game Board */}
              <div className="flex-1 flex flex-col relative">
                  {/* ... Board or Question ... */}
                  {gameState.currentQuestion ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
                          <div className="mb-8 max-w-4xl">
                              <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight mb-8">
                                  {gameState.categories.find(c => c.id === gameState.currentQuestion?.categoryId)?.questions.find(q => q.id === gameState.currentQuestion?.questionId)?.question}
                              </h2>
                              {gameState.currentQuestionState === QuestionState.REVEALED && (
                                  <div className="text-2xl md:text-4xl font-sans font-bold text-gold-400 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                      {gameState.categories.find(c => c.id === gameState.currentQuestion?.categoryId)?.questions.find(q => q.id === gameState.currentQuestion?.questionId)?.answer}
                                  </div>
                              )}
                          </div>
                      </div>
                  ) : (
                      <div className="flex-1 p-4 grid" style={{ gridTemplateColumns: `repeat(${gameState.categories.length}, minmax(0, 1fr))` }}>
                          {gameState.categories.map(cat => (
                              <div key={cat.id} className="flex flex-col gap-2">
                                  <div className="text-center py-4 bg-luxury-dark border-b-2 border-gold-600 mb-2">
                                      <h3 className="text-gold-100 font-bold text-sm md:text-xl uppercase tracking-widest shadow-black drop-shadow-md">{cat.name}</h3>
                                  </div>
                                  <div className="flex flex-col gap-2 px-1">
                                      {cat.questions.map(q => (
                                          <button
                                              key={q.id}
                                              disabled={q.state !== QuestionState.AVAILABLE}
                                              onClick={() => selectQuestion(cat.id, q.id)}
                                              className={`
                                                  h-16 md:h-24 flex items-center justify-center text-xl md:text-3xl font-serif font-bold transition-all duration-300
                                                  ${q.state === QuestionState.AVAILABLE 
                                                      ? 'bg-luxury-panel text-gold-400 border border-gold-900/50 hover:bg-gold-600 hover:text-black hover:scale-105 shadow-lg cursor-pointer' 
                                                      : 'opacity-0 cursor-default pointer-events-none'
                                                  }
                                              `}
                                          >
                                              ${q.points}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Director Panel (In-Game) */}
              {gameState.directorMode && !isDirectorPoppedOut && (
                  <div className="w-96 border-l border-gold-600 shadow-2xl z-40 bg-luxury-black shrink-0 hidden lg:block">
                      <DirectorPanel 
                          gameState={gameState} 
                          setGameState={setGameState} 
                          onClose={() => setGameState(p => ({...p, directorMode: false}))}
                          openDetached={openDetachedDirector}
                          hotkeysEnabled={hotkeysEnabled}
                          toggleHotkeys={() => setHotkeysEnabled(!hotkeysEnabled)}
                      />
                  </div>
              )}
              
              {/* Director Placeholder */}
              {isDirectorPoppedOut && (
                 <div className="absolute top-4 right-4 z-50">
                    <DirectorPlaceholder onBringBack={handleBringBackDirector} className="w-64 rounded border border-gold-500" />
                 </div>
              )}
           </div>
           
           {/* Player Scores Footer */}
           <div className="h-24 bg-black border-t border-gold-900 shrink-0 grid grid-cols-4 md:grid-cols-8 divide-x divide-gold-900/30">
              {gameState.players.map((p, i) => (
                  <div key={p.id} className={`flex flex-col items-center justify-center relative ${i === gameState.activePlayerIndex ? 'bg-gold-900/20' : ''}`}>
                      {i === gameState.activePlayerIndex && <div className="absolute top-0 w-full h-1 bg-gold-500 animate-pulse" />}
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 truncate max-w-full px-2">{p.name}</span>
                      <span className={`text-xl font-bold font-mono ${p.score < 0 ? 'text-red-500' : 'text-gold-200'}`}>{p.score}</span>
                  </div>
              ))}
           </div>
        </div>
     );
  }

  // Fallback
  return null;
}

const AppWrapper = () => (
  <ErrorBoundary>
    <ToastProvider>
      <CruzPhamTriviaApp />
    </ToastProvider>
  </ErrorBoundary>
);

export default AppWrapper;
