
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { AppState, AppAction, User, Notification, Template, Player } from '../types';
import { auth, onAuthStateChanged, signOut, syncUserRecord, upsertTemplate, db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { rebalanceQuestions } from '../utils/gameUtils';
import { audioManager } from '../utils/audioUtils';
import { SOUND_ASSETS, INITIAL_BOARD_DATA } from '../constants';

const initialState: AppState = {
  user: null,
  view: 'landing',
  notifications: [],
  loading: true,
  activeTemplate: null,
  activeQuestionId: null,
  isAnswerRevealed: false,
  isEditing: false,
  isLiveMode: false,
  players: [
    { id: 'p1', name: 'Player 1', score: 0, isActive: true },
    { id: 'p2', name: 'Player 2', score: 0, isActive: false }
  ],
  activityLog: [],
  timer: 30,
  isTimerRunning: false,
  isSoundEnabled: true,
  saveStatus: 'saved'
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    
    // Game/Template Logic
    case 'LOAD_TEMPLATE':
      return { ...state, activeTemplate: action.payload, view: 'studio', timer: action.payload.settings.timerDuration || 30, saveStatus: 'saved' };
    
    case 'UPDATE_TEMPLATE_SETTINGS':
      if (!state.activeTemplate) return state;
      const rebalancedCategories = rebalanceQuestions(state.activeTemplate.categories, action.payload);
      return {
        ...state,
        saveStatus: 'unsaved',
        activeTemplate: {
          ...state.activeTemplate,
          settings: action.payload,
          categories: rebalancedCategories,
          updatedAt: Date.now()
        }
      };

    case 'UPDATE_CATEGORY':
      if (!state.activeTemplate) return state;
      const updatedCats = [...state.activeTemplate.categories];
      updatedCats[action.payload.categoryIndex] = {
        ...updatedCats[action.payload.categoryIndex],
        [action.payload.field]: action.payload.value
      };
      return {
        ...state,
        saveStatus: 'unsaved',
        activeTemplate: { ...state.activeTemplate, categories: updatedCats, updatedAt: Date.now() }
      };

    case 'UPDATE_QUESTION':
      if (!state.activeTemplate) return state;
      const { categoryIndex, questionIndex, field, value } = action.payload;
      const qCats = [...state.activeTemplate.categories];
      const qList = [...qCats[categoryIndex].questions];
      
      qList[questionIndex] = { ...qList[questionIndex], [field]: value };
      qCats[categoryIndex] = { ...qCats[categoryIndex], questions: qList };
      
      return {
        ...state,
        saveStatus: 'unsaved',
        activeTemplate: { ...state.activeTemplate, categories: qCats, updatedAt: Date.now() }
      };

    case 'SET_ACTIVE_QUESTION':
      return { 
        ...state, 
        activeQuestionId: action.payload, 
        isAnswerRevealed: false,
        timer: state.activeTemplate?.settings?.timerDuration || 30, 
        isTimerRunning: false
      };
      
    case 'REVEAL_ANSWER':
      return { ...state, isAnswerRevealed: action.payload };

    case 'MARK_QUESTION_STATUS':
      if (!state.activeTemplate) return state;
      const compCats = [...state.activeTemplate.categories];
      const compQList = [...compCats[action.payload.categoryIndex].questions];
      compQList[action.payload.questionIndex] = { ...compQList[action.payload.questionIndex], status: action.payload.status };
      compCats[action.payload.categoryIndex] = { ...compCats[action.payload.categoryIndex], questions: compQList };
      return {
        ...state,
        saveStatus: 'unsaved',
        activeTemplate: { ...state.activeTemplate, categories: compCats, updatedAt: Date.now() },
        activeQuestionId: null,
        isAnswerRevealed: false
      };

    case 'TOGGLE_EDITING':
      return { ...state, isEditing: !state.isEditing };
    case 'TOGGLE_LIVE_MODE':
      return { ...state, isLiveMode: !state.isLiveMode };

    case 'UPDATE_PLAYER':
      return { ...state, players: state.players.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'ADD_PLAYER':
      if (state.players.length >= 8) return state;
      return { ...state, players: [...state.players, action.payload] };
    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload) };
    case 'SET_PLAYER_ACTIVE':
      return { ...state, players: state.players.map(p => ({ ...p, isActive: p.id === action.payload })) };
    case 'ADJUST_SCORE':
      return { 
        ...state, 
        players: state.players.map(p => p.id === action.payload.playerId ? { ...p, score: p.score + action.payload.delta } : p) 
      };
    case 'LOG_ACTIVITY':
      const newLog = { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), message: action.payload };
      return { ...state, activityLog: [newLog, ...state.activityLog].slice(0, 50) };
    
    case 'SET_TIMER':
      return { ...state, timer: action.payload };
    case 'TOGGLE_TIMER':
      return { ...state, isTimerRunning: action.payload };
    case 'TOGGLE_SOUND':
      audioManager.setMute(state.isSoundEnabled); 
      return { ...state, isSoundEnabled: !state.isSoundEnabled };
      
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };

    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  notify: (type: Notification['type'], message: string) => void;
  logout: () => void;
  saveTemplate: () => Promise<void>;
  log: (message: string) => void;
  playSound: (key: keyof typeof SOUND_ASSETS) => void;
} | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const debounceRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  const notify = (type: Notification['type'], message: string) => {
    const id = Math.random().toString(36).substring(7);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { id, type, message } });
    setTimeout(() => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }), 5000);
  };

  const log = (message: string) => {
    dispatch({ type: 'LOG_ACTIVITY', payload: message });
  };

  const playSound = (key: keyof typeof SOUND_ASSETS) => {
    if (state.isSoundEnabled) {
      audioManager.play(key);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'SET_VIEW', payload: 'landing' });
      notify('info', 'Session Terminated');
    } catch (e) {
      console.error(e);
    }
  };

  const saveTemplate = async () => {
    if (state.activeTemplate) {
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
      try {
        await upsertTemplate(state.activeTemplate);
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
      } catch (e) {
        console.error("Save failed", e);
        dispatch({ type: 'SET_SAVE_STATUS', payload: 'unsaved' });
      }
    }
  };

  // Timer Logic
  useEffect(() => {
    if (state.isTimerRunning && state.timer > 0) {
      timerIntervalRef.current = setInterval(() => {
        dispatch({ type: 'SET_TIMER', payload: state.timer - 1 });
      }, 1000);
    } else if (state.timer === 0 && state.isTimerRunning) {
      playSound('timer'); // Play end sound
      dispatch({ type: 'TOGGLE_TIMER', payload: false });
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [state.isTimerRunning, state.timer]);

  // Auto-save logic
  useEffect(() => {
    if (state.activeTemplate) {
      // If we already have unsaved changes marked by the reducer, trigger debounce save
      if (state.saveStatus === 'unsaved') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          saveTemplate();
        }, 2000); 
      }
    }
  }, [state.activeTemplate, state.saveStatus]);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || 'Creator'
        };
        await syncUserRecord(user);

        // Seeding Sample Logic
        if (db) {
            try {
                // Check if user has any templates
                const templatesRef = collection(db, 'templates');
                const q = query(templatesRef, where('ownerId', '==', user.id), limit(1));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    console.log("No templates found. Seeding sample template...");
                    // Create deep copy of initial data to avoid reference issues
                    const sampleCategories = JSON.parse(JSON.stringify(INITIAL_BOARD_DATA));
                    
                    const sampleTemplate: Template = {
                        id: `tpl-sample-${Date.now()}`,
                        ownerId: user.id,
                        name: "Demo: Tech & Luxury",
                        settings: {
                            minPoints: 200,
                            maxPoints: 1000,
                            step: 200,
                            currencySymbol: '$',
                            timerDuration: 30
                        },
                        categories: sampleCategories,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        updatedBy: user.id
                    };
                    await upsertTemplate(sampleTemplate);
                }
            } catch (err) {
                console.warn("Auto-seeding sample template failed (likely offline or permission issue):", err);
            }
        }

        dispatch({ type: 'SET_USER', payload: user });
      } else {
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });
    return () => unsub();
  }, []);

  // Keyboard Shortcuts for Game Control
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key >= '1' && e.key <= '8') {
        const pIdx = parseInt(e.key) - 1;
        if (state.players[pIdx]) {
           dispatch({ type: 'SET_PLAYER_ACTIVE', payload: state.players[pIdx].id });
        }
      }
      
      const isPlus = e.key === '+' || e.key === '=' || e.key === 'ArrowUp';
      const isMinus = e.key === '-' || e.key === '_' || e.key === 'ArrowDown';

      if (isPlus || isMinus) {
        const activePlayer = state.players.find(p => p.isActive);
        const step = state.activeTemplate?.settings.step || 100;
        if (activePlayer) {
           const delta = isPlus ? step : -step;
           dispatch({ type: 'ADJUST_SCORE', payload: { playerId: activePlayer.id, delta } });
           playSound(isPlus ? 'correct' : 'wrong');
           log(`${isPlus ? 'Added' : 'Deducted'} ${step} ${isPlus ? 'to' : 'from'} ${activePlayer.name}`);
        }
      }

      if (e.code === 'KeyM') {
         dispatch({ type: 'TOGGLE_SOUND' });
      }

      if (e.code === 'KeyF') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [state.players, state.activeTemplate, state.isSoundEnabled]);

  return (
    <AppContext.Provider value={{ state, dispatch, notify, logout, saveTemplate, log, playSound }}>
      {children}
    </AppContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};
