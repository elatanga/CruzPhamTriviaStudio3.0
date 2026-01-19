import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, Template, Category, Question, QuestionState, Player, User, Session
} from './types';
import { StorageService } from './services/storageService';
import { generateTriviaContent } from './services/geminiService';
import { logger } from './services/loggerService';
import { soundService } from './services/soundService'; // NEW
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';

// --- SVGs & Icons ---
const Icons = {
  Play: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>,
  Pause: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>,
  ChevronLeft: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  WifiOff: () => <svg className="w-4 h-4 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M12 18h.01M8.414 14.414l3.586-3.586m4 0l3.586 3.586M5.707 11.707l2.828-2.828m8 0l2.828 2.828M2.929 9l3.536-3.536m11.314 0L21.071 9" /></svg>,
  VolumeUp: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
  VolumeMute: () => <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>,
  Detach: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
};

// --- Helper Components ---
const Button: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = '', disabled }) => {
  const base = "font-serif text-xs md:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed select-none";
  
  const styles = {
    primary: "bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold hover:brightness-110 shadow-lg px-4 py-2 rounded-sm active:scale-95",
    secondary: "border border-gold-600 text-gold-400 hover:bg-gold-900/30 px-4 py-2 rounded-sm active:scale-95",
    danger: "bg-red-900/50 text-red-200 hover:bg-red-800 border border-red-800 px-4 py-2 rounded-sm active:scale-95",
    ghost: "text-gold-500 hover:text-gold-200 px-2",
    icon: "p-2 hover:bg-gold-900/20 text-gold-400 rounded-full active:scale-95"
  };

  return <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`} disabled={disabled}>{children}</button>;
};

// --- Internal App Logic ---

function CruzPhamTriviaApp() {
  const { showToast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'GAME'>('LOGIN');
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
    templateId: null,
    categories: [],
    players: Array(8).fill(null).map((_, i) => ({ id: i, name: `PLAYER ${i + 1}`, score: 0, streak: 0 })),
    activePlayerIndex: 0,
    currentQuestion: null,
    activityLog: [],
    timer: 0,
    isTimerRunning: false,
    directorMode: false,
  });

  // Editor State
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

  // --- Initialization ---
  useEffect(() => {
    broadcastRef.current = new BroadcastChannel('cruzpham_game_state');
    
    // Listen for updates from other windows
    broadcastRef.current.onmessage = (event) => {
      if (event.data.type === 'STATE_UPDATE') {
        // Only update if we are not the source (prevent loops if needed, though simpler here)
        // If we are in "Director Mode" in another window, we receive game state.
        // Actually, simpler: All windows sync state.
        isBroadcastingRef.current = true;
        setGameState(event.data.payload);
        isBroadcastingRef.current = false;
      }
    };

    return () => broadcastRef.current?.close();
  }, []);

  // Broadcast state changes
  useEffect(() => {
    if (!isBroadcastingRef.current && broadcastRef.current && gameState.isActive) {
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
  const handleAuth = async (isRegister: boolean, username: string, token?: string) => {
    initAudio(); // Initialize audio context on user interaction
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
          setAuthError(res.error || "Registration failed");
          showToast(res.error || "Registration failed", 'error');
        }
      } else {
        const res = await StorageService.login(username, token || "");
        if (res.success && res.session) {
          setSession(res.session);
          setView('DASHBOARD');
          setTemplates(StorageService.getTemplates(res.session.username));
          showToast("Welcome to the Studio", 'success');
        } else {
          setAuthError(res.error || "Login failed");
          showToast("Invalid Credentials", 'error');
        }
      }
    } catch {
      setAuthError("System Error");
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
    
    // Deep copy and assign ONE random Double Or Nothing per category
    const gameCategories = template.categories.map(c => {
      const doubleIndex = Math.floor(Math.random() * c.questions.length);
      return {
        ...c,
        questions: c.questions.map((q, idx) => ({ 
          ...q, 
          state: QuestionState.AVAILABLE,
          isDoubleOrNothing: idx === doubleIndex // Randomly assign
        }))
      };
    });

    setGameState(prev => ({
      ...prev,
      isActive: true,
      templateId: template.id,
      categories: gameCategories,
      currentQuestion: null,
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
      // Check for Double or Nothing to play sound
      const cat = cats.find(c => c.id === categoryId);
      const q = cat?.questions.find(q => q.id === questionId);
      if (q?.isDoubleOrNothing) {
        setTimeout(() => soundService.playDoubleOrNothing(), 300); // Slight delay for drama
      }

      return { ...prev, categories: cats, currentQuestion: { categoryId, questionId } };
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
      return { ...prev, categories: cats, isTimerRunning: false };
    });
  }, [gameState.currentQuestion]);

  const resolveQuestion = useCallback((action: 'AWARD' | 'VOID' | 'RETURN') => {
    if (!gameState.currentQuestion) return;
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

      return { ...prev, categories: cats, players, currentQuestion: null, activityLog: [log, ...prev.activityLog].slice(0, 8) };
    });
  }, [gameState.currentQuestion]);

  // --- Keyboard & Timer ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (view !== 'GAME' || isEditorOpen) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

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
  }, [view, isEditorOpen, revealAnswer, resolveQuestion]);

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
    const url = window.location.href; // Opens same app
    // In a real scenario, we might add ?mode=director to URL to force a specific view,
    // but here we just rely on the BroadcastChannel to sync the same view state.
    window.open(url, '_blank', 'width=400,height=800');
    showToast("Director Panel Detached", 'info');
  };

  // --- Views ---

  if (view === 'LOGIN') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-luxury-black bg-luxury-radial font-serif text-gold-400">
        <div className="w-[90%] max-w-[400px] border border-gold-600/30 bg-luxury-dark/95 backdrop-blur-xl p-8 rounded-sm shadow-glow flex flex-col items-center relative">
          {!isOnline && <div className="absolute top-2 right-2 text-red-500 text-[10px] flex items-center gap-1"><Icons.WifiOff/> OFFLINE</div>}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gold-gradient-text tracking-widest">CRUZPHAM</h1>
            <p className="text-[10px] tracking-[0.6em] text-gold-600 mt-1">TRIVIA STUDIOS</p>
          </div>

          <div className="flex w-full mb-6 border-b border-gold-900">
            {['LOGIN', 'REGISTER'].map(m => (
              <button key={m} onClick={() => { setAuthMode(m as any); setAuthError(null); setRegisterSuccessToken(null); soundService.playClick(); }}
                className={`flex-1 py-3 text-xs tracking-widest transition-colors ${authMode === m ? 'text-gold-300 border-b-2 border-gold-400' : 'text-zinc-600 hover:text-gold-700'}`}>
                {m === 'LOGIN' ? 'ACCESS' : 'INITIALIZE'}
              </button>
            ))}
          </div>

          {authError && <div className="w-full text-center text-red-400 text-xs mb-4 bg-red-900/10 py-2 border border-red-900/30">{authError}</div>}

          {authMode === 'LOGIN' ? (
            <form className="w-full space-y-4" onSubmit={(e: any) => { e.preventDefault(); handleAuth(false, e.target.username.value, e.target.token.value); }}>
              <input name="username" placeholder="IDENTITY" className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" />
              <input name="token" type="password" placeholder="SECRET KEY" className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" />
              <Button className="w-full py-4 mt-2" disabled={authLoading || !isOnline}>{authLoading ? 'AUTHENTICATING...' : 'ENTER STUDIO'}</Button>
            </form>
          ) : registerSuccessToken ? (
            <div className="w-full text-center animate-pulse">
              <p className="text-xs text-green-500 mb-2 font-sans font-bold">IDENTITY GENERATED</p>
              <div className="bg-gold-200 text-black font-mono text-sm p-4 break-all border-2 border-gold-500 mb-2 cursor-pointer hover:bg-white" onClick={() => navigator.clipboard.writeText(registerSuccessToken)}>
                {registerSuccessToken}
              </div>
              <p className="text-[9px] text-red-500 uppercase font-bold tracking-wider mb-4">Copy now. Irretrievable.</p>
              <Button className="w-full" onClick={() => { setAuthMode('LOGIN'); setRegisterSuccessToken(null); soundService.playClick(); }}>PROCEED</Button>
            </div>
          ) : (
             <form className="w-full space-y-4" onSubmit={(e: any) => { e.preventDefault(); handleAuth(true, e.target.username.value); }}>
               <p className="text-[10px] text-center text-zinc-500">Secure token generation.</p>
               <input name="username" placeholder="NEW IDENTITY" className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" />
               <Button className="w-full py-4 mt-2" disabled={authLoading || !isOnline}>{authLoading ? 'GENERATING...' : 'CREATE IDENTITY'}</Button>
             </form>
          )}
          <div className="mt-8 text-[9px] text-zinc-700 tracking-widest text-center">SECURE ENCLAVE • SINGLE SESSION</div>
        </div>
      </div>
    );
  }

  // --- Layout Wrappers ---
  const Header = () => (
    <header className="h-[6vh] min-h-[40px] flex items-center justify-between px-4 bg-gradient-to-r from-luxury-black to-luxury-dark border-b border-gold-900/50 shrink-0 z-30">
      <div className="flex items-center gap-4">
        <span className="font-serif font-bold text-lg text-gold-400 tracking-widest">CRUZPHAM</span>
        {gameState.isActive && (
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-gold-900/30">
             <span className={`font-mono text-xl leading-none ${gameState.timer < 5 && gameState.isTimerRunning ? 'text-red-500 animate-ping' : 'text-gold-200'}`}>{gameState.timer < 10 ? `0${gameState.timer}` : gameState.timer}</span>
             <button onClick={() => setGameState(p => ({...p, isTimerRunning: !p.isTimerRunning}))} className="text-gold-500 hover:text-white">{gameState.isTimerRunning ? <Icons.Pause/> : <Icons.Play/>}</button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-[10px] font-bold text-gold-700 tracking-wider">
        <button onClick={toggleVolume} className="text-gold-500 hover:text-white transition-colors" title="Toggle Sound">
          {volume > 0 ? <Icons.VolumeUp/> : <Icons.VolumeMute/>}
        </button>
        {!isOnline && <span className="text-red-500 flex items-center gap-1 animate-pulse"><Icons.WifiOff/> CONNECTION LOST</span>}
        {view === 'DASHBOARD' ? (
          <>
            <span>{templates.length} / 40 TEMPLATES</span>
            <button onClick={() => {logout(); soundService.playClick();}} className="text-gold-500 hover:text-white transition-colors">LOGOUT</button>
          </>
        ) : (
          <>
             <span className="text-green-600 animate-pulse">● LIVE</span>
             <button onClick={openDetachedDirector} className="text-gold-500 hover:text-white transition-colors flex items-center gap-1"><Icons.Detach/> DIRECTOR</button>
             <button onClick={() => {setView('DASHBOARD'); soundService.playClick();}} className="text-gold-500 hover:text-white transition-colors">END GAME</button>
          </>
        )}
      </div>
    </header>
  );

  const Footer = () => (
    <div className="absolute bottom-2 right-4 text-[9px] text-zinc-800 font-serif tracking-widest pointer-events-none select-none z-10">
      CREATED BY EL CRUZPHAM • POWERED BY CRUZPHAM TRIVIA STUDIOS
    </div>
  );

  if (view === 'DASHBOARD') {
    const pageTemplates = templates.slice(dashboardPage * ITEMS_PER_PAGE, (dashboardPage + 1) * ITEMS_PER_PAGE);
    const createNew = () => {
      // Logic for new template creation with configurable rows/cols
      const rows = 5; // Default
      const cols = 5; // Default
      const newT: Template = { 
        id: crypto.randomUUID(), 
        name: "UNTITLED SHOW", 
        rows, 
        cols, 
        createdAt: Date.now(), 
        categories: Array(cols).fill(0).map((_,i)=>({
          id: crypto.randomUUID(), 
          name:`CAT ${i+1}`, 
          questions: Array(rows).fill(0).map((_,j)=>({
            id:crypto.randomUUID(), 
            question:"Edit Me", 
            answer:"Answer", 
            points: Math.min((j+1)*100, 1000), // Cap base points at 1000
            state:QuestionState.AVAILABLE, 
            isDoubleOrNothing:false
          }))
        })) 
      };
      setEditingTemplate(newT); setIsEditorOpen(true); soundService.playClick();
    };

    return (
      <div className="h-full w-full flex flex-col bg-luxury-black text-gold-300">
        <Header />
        <div className="flex-1 p-6 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-2xl font-serif text-gold-200 tracking-widest">SHOW LIBRARY</h2>
            <Button onClick={createNew} variant="primary">NEW SHOW</Button>
          </div>
          
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 min-h-0">
            {pageTemplates.map(t => (
              <div key={t.id} className="relative group border border-gold-900/30 bg-luxury-panel/50 hover:bg-luxury-panel hover:border-gold-600/50 transition-all p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gold-100 truncate tracking-wide">{t.name}</h3>
                  <p className="text-[10px] text-zinc-600 mt-1 uppercase">{t.cols} x {t.rows} GRID</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="secondary" className="flex-1 py-1" onClick={() => { setEditingTemplate(t); setIsEditorOpen(true); soundService.playClick(); }}>EDIT</Button>
                   <Button variant="primary" className="flex-1 py-1" onClick={() => startGame(t)}>LIVE</Button>
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

          <div className="h-[6vh] shrink-0 flex items-center justify-center gap-4 mt-4">
             <Button variant="icon" disabled={dashboardPage === 0} onClick={() => {setDashboardPage(p => p - 1); soundService.playClick();}}><Icons.ChevronLeft/></Button>
             <span className="text-xs font-mono text-zinc-600">PAGE {dashboardPage + 1}</span>
             <Button variant="icon" disabled={(dashboardPage + 1) * ITEMS_PER_PAGE >= templates.length} onClick={() => {setDashboardPage(p => p + 1); soundService.playClick();}}><Icons.ChevronRight/></Button>
          </div>
        </div>
        <Footer />
        
        {/* Editor Modal */}
        {isEditorOpen && editingTemplate && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <div className="h-16 border-b border-gold-900 flex items-center justify-between px-6 bg-luxury-panel">
               <div className="flex items-center gap-4">
                 <span className="text-gold-500 font-bold">EDITOR</span>
                 <input className="bg-black border border-zinc-800 text-gold-100 px-2 py-1 focus:border-gold-500 outline-none w-64" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
               </div>
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 bg-black/30 p-1 border border-zinc-800 rounded">
                    <span className="text-[10px] text-purple-400 pl-2">AI ASSIST</span>
                    <input className="bg-transparent text-white text-xs outline-none w-32" placeholder="Topic..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                    <select className="bg-black text-gold-400 text-[10px] border border-zinc-800 h-6 outline-none focus:border-gold-500 cursor-pointer" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                      <option value="Easy">EASY</option>
                      <option value="Medium">MED</option>
                      <option value="Hard">HARD</option>
                      <option value="Expert">EXPT</option>
                    </select>
                    <Button variant="secondary" className="py-0 h-6 text-[10px]" onClick={handleAi} disabled={isGenerating}>{isGenerating ? '...' : 'GEN'}</Button>
                 </div>
                 <Button variant="secondary" onClick={() => { setIsEditorOpen(false); setEditingTemplate(null); soundService.playClick(); }}>CANCEL</Button>
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
                 }}>SAVE</Button>
               </div>
            </div>
            <div className="flex-1 overflow-hidden p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${editingTemplate.cols}, minmax(200px, 1fr))` }}>
               {editingTemplate.categories.map((c, ci) => (
                 <div key={c.id} className="flex flex-col gap-2 overflow-y-auto pb-10">
                    <input className="bg-luxury-dark border border-gold-900 text-center text-gold-300 font-bold py-2" value={c.name} onChange={e => { const nc = [...editingTemplate.categories]; nc[ci].name = e.target.value; setEditingTemplate({...editingTemplate, categories: nc}); }} />
                    {c.questions.map((q, qi) => (
                      <div key={q.id} className="bg-luxury-panel border border-zinc-900 p-2 flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>{q.points}</span>
                          <span className="text-zinc-700">AUTO</span>
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
    return (
      <div className="h-full w-full flex flex-col bg-luxury-black text-gold-100 overflow-hidden relative">
        <Header />
        
        {/* --- MAIN GAME AREA --- */}
        <div className="flex-1 flex flex-col min-h-0 p-2 lg:p-4 gap-2 lg:gap-4 relative z-0">
          
          {/* TRIVIA GRID */}
          <div className="flex-1 grid gap-1 lg:gap-2 min-h-0" style={{ gridTemplateColumns: `repeat(${gameState.categories.length}, minmax(0, 1fr))` }}>
            {gameState.categories.map((cat, i) => (
              <div key={cat.id} className="flex flex-col h-full gap-1 lg:gap-2">
                {/* Header Tile */}
                <div className="h-[12%] min-h-[40px] bg-gradient-to-b from-luxury-panel to-black border border-gold-900 flex items-center justify-center p-1 shadow-lg">
                  <span className="font-serif font-bold text-center text-gold-300 leading-tight uppercase break-words text-responsive-base">{cat.name}</span>
                </div>
                {/* Question Tiles */}
                <div className="flex-1 flex flex-col gap-1 lg:gap-2">
                  {cat.questions.map(q => {
                    const isAvail = q.state === QuestionState.AVAILABLE || q.state === QuestionState.ACTIVE;
                    return (
                      <button 
                        key={q.id}
                        onClick={() => selectQuestion(cat.id, q.id)}
                        disabled={!isAvail}
                        className={`
                          flex-1 relative group flex items-center justify-center border transition-all duration-300
                          ${q.state === QuestionState.ACTIVE ? 'bg-gold-500 border-gold-300 shadow-glow-strong z-10' : 
                            isAvail ? 'bg-luxury-panel border-gold-900/40 hover:bg-gold-900/20 hover:border-gold-500' : 'opacity-0'}
                        `}
                      >
                         <span className={`font-serif font-black tracking-tighter text-responsive-lg ${q.state === QuestionState.ACTIVE ? 'text-black' : 'text-gold-500 shadow-black drop-shadow-md'}`}>
                           {isAvail ? q.points : ''}
                         </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* SCOREBOARD */}
          <div className="h-[15%] min-h-[80px] grid grid-cols-4 lg:grid-cols-8 gap-1 lg:gap-2 bg-luxury-dark/50 p-2 rounded border-t border-gold-900/50">
            {gameState.players.map((p, i) => (
              <div key={p.id} className={`
                 relative flex flex-col items-center justify-center rounded border bg-luxury-panel transition-all duration-300
                 ${i === gameState.activePlayerIndex ? 'border-gold-500 shadow-glow bg-gradient-to-b from-luxury-panel to-gold-900/20' : 'border-zinc-800 opacity-80'}
              `}>
                 <div className="text-[9px] lg:text-xs text-zinc-500 tracking-wider uppercase mb-1 font-bold">{p.name}</div>
                 <div className={`font-serif font-bold text-responsive-lg leading-none ${p.score < 0 ? 'text-red-500' : 'text-gold-300'}`}>{p.score}</div>
                 {i === gameState.activePlayerIndex && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-glow"/>}
                 
                 {/* STREAK INDICATOR */}
                 {p.streak >= 2 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 border border-orange-500/50 rounded-full px-2 py-0.5 shadow-[0_0_10px_rgba(249,115,22,0.4)] animate-in slide-in-from-bottom-2 duration-300 z-20">
                      <span className="text-[10px] animate-pulse filter drop-shadow-[0_0_2px_rgba(249,115,22,0.8)]">🔥</span>
                      <span className="text-[9px] font-mono font-bold text-orange-400">{p.streak}</span>
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* FOOTER: CONTROLS & FEED */}
          <div className="h-8 shrink-0 flex items-center justify-between gap-4 bg-luxury-panel/80 rounded border border-zinc-900 px-4 shadow-lg backdrop-blur-sm">
             {/* Legend */}
             <div className="flex items-center gap-4 text-[9px] text-zinc-600 font-bold uppercase tracking-widest overflow-hidden">
                 <span className="whitespace-nowrap hover:text-gold-500 transition-colors">[SPACE] REVEAL</span>
                 <span className="whitespace-nowrap hover:text-gold-500 transition-colors hidden sm:inline">[ENTER] AWARD</span>
                 <span className="whitespace-nowrap hover:text-gold-500 transition-colors hidden md:inline">[ESC] VOID</span>
                 <span className="whitespace-nowrap hover:text-gold-500 transition-colors hidden lg:inline">[BKSP] BACK</span>
                 <span className="whitespace-nowrap hover:text-gold-500 transition-colors hidden xl:inline">[ARROWS] PLAYER</span>
             </div>

             {/* Live Feed */}
             <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                   <span className="text-[9px] text-zinc-500 font-serif uppercase tracking-widest hidden sm:inline">LIVE FEED</span>
                </div>
                <div key={gameState.activityLog[0]} className="text-[10px] font-mono text-gold-400 font-bold uppercase tracking-wide animate-in slide-in-from-right fade-in duration-300 min-w-[100px] text-right">
                   {gameState.activityLog[0] || "STUDIO READY"}
                </div>
             </div>
          </div>
        </div>

        {/* --- OVERLAYS --- */}

        {/* DIRECTOR PANEL */}
        <div className={`absolute top-12 right-0 bottom-0 w-64 bg-luxury-black/95 border-l border-gold-800 shadow-2xl z-40 transform transition-transform duration-300 flex flex-col ${gameState.directorMode ? 'translate-x-0' : 'translate-x-60'}`}>
          <button onClick={() => {setGameState(p => ({...p, directorMode: !p.directorMode})); soundService.playClick();}} className="absolute -left-8 top-1/2 w-8 h-16 bg-gold-700 rounded-l flex items-center justify-center hover:w-10 transition-all text-black font-bold vertical-rl writing-mode-vertical">
             {gameState.directorMode ? <Icons.ChevronRight/> : <Icons.ChevronLeft/>}
          </button>
          <div className="p-4 border-b border-gold-900">
             <h3 className="font-serif text-gold-500">DIRECTOR</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
             {gameState.activityLog.map((l, i) => <div key={i} className="text-[10px] font-mono text-zinc-500 border-b border-zinc-900 py-1">{l}</div>)}
          </div>
        </div>

        {/* ACTIVE QUESTION OVERLAY */}
        {gameState.currentQuestion && (() => {
           const cat = gameState.categories.find(c => c.id === gameState.currentQuestion!.categoryId);
           const q = cat?.questions.find(q => q.id === gameState.currentQuestion!.questionId);
           if (!q) return null;
           return (
             <div className="absolute inset-0 z-50 bg-luxury-glass backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="w-full max-w-5xl aspect-video bg-black border-2 border-gold-600 shadow-glow-strong rounded-lg flex flex-col overflow-hidden relative">
                   {/* Card Header */}
                   <div className="h-16 flex items-center justify-between px-8 bg-gradient-to-r from-gold-900/20 to-transparent border-b border-gold-900/50">
                      <span className="font-serif text-gold-400 tracking-widest text-lg">{cat?.name}</span>
                      <span className="font-serif text-gold-200 font-bold text-2xl">{q.points}</span>
                   </div>
                   
                   {/* Card Content */}
                   <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative">
                      {q.isDoubleOrNothing && (
                        <div className="absolute top-8 px-6 py-2 bg-gradient-to-r from-red-900 to-red-600 text-white font-black text-xl skew-x-[-12deg] shadow-lg animate-bounce border border-red-400 z-10">DOUBLE OR NOTHING</div>
                      )}
                      
                      <h2 className="font-serif text-white font-bold leading-tight drop-shadow-lg text-responsive-hero max-w-4xl">{q.question}</h2>
                      
                      {q.state === QuestionState.REVEALED && (
                        <div className="mt-12 pt-8 border-t-2 border-gold-500/30 w-full animate-in slide-in-from-bottom-8 duration-500">
                           <p className="font-serif text-gold-400 text-responsive-xl">{q.answer}</p>
                        </div>
                      )}
                   </div>

                   {/* Card Footer Controls */}
                   <div className="h-24 bg-luxury-panel border-t border-gold-900 flex items-center justify-center gap-6">
                      {q.state !== QuestionState.REVEALED ? (
                        <Button onClick={revealAnswer} className="w-64 py-4 text-xl">REVEAL</Button>
                      ) : (
                        <>
                          <Button variant="danger" onClick={() => resolveQuestion('VOID')}>VOID</Button>
                          <Button variant="secondary" onClick={() => resolveQuestion('RETURN')}>RETURN</Button>
                          <Button variant="primary" onClick={() => resolveQuestion('AWARD')} className="w-64 py-4 text-xl">AWARD</Button>
                        </>
                      )}
                   </div>
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