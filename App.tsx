import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { 
  GameState, Template, Category, Question, QuestionState, Player, User, Session, BoardConfig, AuthToken, AuditLogEntry, UserStatus, TokenRequest, TokenRequestStatus
} from './types';
import { StorageService } from './services/storageService';
import { CommunicationService } from './services/communicationService'; 
import { API } from './services/api';
import { generateTriviaContent } from './services/geminiService';
import { logger } from './services/loggerService';
import { soundService } from './services/soundService'; 
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { UI_TEXT } from './constants/uiText';

const CLIENT_SESSION_KEY = 'cruzphamtrivia_client_session_v1';
const EVENT_NAME_KEY = 'cruzphamtrivia_event_name_v1';

// --- SVGs & Icons ---
const Icons = {
  Play: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg>,
  Pause: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
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
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Chat: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Shield: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
};

// --- Helper Components ---
const Button: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' | 'success';
  className?: string;
  disabled?: boolean;
  title?: string;
  testId?: string;
}> = ({ onClick, children, variant = 'primary', className = '', disabled, title, testId }) => {
  const base = "font-serif text-xs md:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed select-none disabled:grayscale touch-manipulation";
  
  const styles = {
    primary: "bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold hover:brightness-110 shadow-lg px-4 py-3 md:py-2 rounded-sm active:scale-95",
    secondary: "border border-gold-600 text-gold-400 hover:bg-gold-900/30 px-4 py-3 md:py-2 rounded-sm active:scale-95",
    danger: "bg-red-900/50 text-red-200 hover:bg-red-800 border border-red-800 px-4 py-3 md:py-2 rounded-sm active:scale-95",
    ghost: "text-gold-500 hover:text-gold-200 px-2",
    icon: "p-3 md:p-2 hover:bg-gold-900/20 text-gold-400 rounded-full active:scale-95",
    success: "bg-green-900/80 text-green-100 border border-green-500 px-4 py-3 md:py-2 rounded-sm active:scale-95"
  };

  return <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`} disabled={disabled} title={title} data-testid={testId}>{children}</button>;
};

// --- GLOBAL HEADER COMPONENT ---
const BrandHeader: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center justify-between px-3 md:px-4 py-1 bg-luxury-black border-b border-gold-900/30 text-[9px] md:text-[10px] tracking-widest font-serif text-gold-600 select-none ${className}`}>
    <span className="font-bold">{UI_TEXT.brand.studioName}</span>
    <span className="opacity-50 hidden sm:inline">{UI_TEXT.brand.appName}</span>
  </div>
);

// --- ONBOARDING MODAL ---
const OnboardingModal: React.FC<{ onSave: (name: string) => void; onSkip: () => void }> = ({ onSave, onSkip }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = input.trim();
    if (trimmed.length < 3) { setError("Name too short (min 3 chars)"); return; }
    if (trimmed.length > 50) { setError("Name too long (max 50 chars)"); return; }
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-luxury-panel border-y-2 border-gold-500 w-full max-w-md p-8 flex flex-col items-center text-center shadow-glow-strong relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-pulse"></div>
        <h2 className="text-2xl font-serif font-bold text-gold-100 mb-2 tracking-widest">{UI_TEXT.onboarding.welcome}</h2>
        <p className="text-zinc-500 text-xs mb-8 uppercase tracking-widest">{UI_TEXT.brand.studioName}</p>
        
        <div className="w-full space-y-4 mb-8">
          <label className="block text-left text-[10px] text-gold-600 font-bold tracking-widest uppercase ml-1">{UI_TEXT.onboarding.prompt}</label>
          <input 
            autoFocus
            className="w-full bg-black border border-gold-900/50 p-4 text-center text-gold-200 text-lg focus:border-gold-500 outline-none placeholder:text-zinc-800 transition-all shadow-inner"
            placeholder={UI_TEXT.onboarding.placeholder}
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          {error && <p className="text-red-500 text-[10px] tracking-wide animate-pulse">{error}</p>}
        </div>

        <div className="flex gap-4 w-full">
          <Button variant="ghost" className="flex-1" onClick={onSkip}>{UI_TEXT.onboarding.skip}</Button>
          <Button variant="primary" className="flex-1 py-3" onClick={handleSave}>{UI_TEXT.onboarding.continue}</Button>
        </div>
      </div>
    </div>
  );
};

// --- LOGIN COMPONENT ---
const LoginView: React.FC<{ onLogin: (u: string, t: string) => void; isOnline: boolean; loading: boolean; error: string | null }> = ({ onLogin, isOnline, loading, error }) => {
  const [mode, setMode] = useState<'AUTH' | 'REQUEST' | 'SUCCESS'>('AUTH');
  
  // Request Form State
  const [reqData, setReqData] = useState({ firstName: '', lastName: '', tiktokHandle: '', phoneNumber: '', preferredUsername: '' });
  const [reqError, setReqError] = useState<string | null>(null);
  const [reqLoading, setReqLoading] = useState(false);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);
    setReqLoading(true);
    
    try {
      // Use API Service instead of direct storage access
      const result = await API.submitTokenRequest(reqData);
      
      if (result.success) {
        setMode('SUCCESS');
      } else {
        const errCode = result.error?.code;
        if (errCode === 'ERR_DUPLICATE_REQUEST') setReqError(UI_TEXT.auth.request.errors.duplicate);
        else if (errCode === 'ERR_RATE_LIMIT') setReqError(UI_TEXT.auth.request.errors.limit);
        else if (errCode === 'ERR_VALIDATION') setReqError(result.error?.message || UI_TEXT.auth.request.errors.required);
        else setReqError(UI_TEXT.auth.errors.system);
      }
    } catch (err) {
      setReqError(UI_TEXT.auth.errors.system);
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-luxury-black bg-luxury-radial font-serif text-gold-400 overflow-hidden">
      <BrandHeader />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* --- AUTH MODE --- */}
        {mode === 'AUTH' && (
          <div className="w-[90%] max-w-[400px] border border-gold-600/30 bg-luxury-dark/95 backdrop-blur-xl p-8 rounded-sm shadow-glow flex flex-col items-center relative animate-in fade-in zoom-in duration-300">
            {!isOnline && <div className="absolute top-2 right-2 text-red-500 text-[10px] flex items-center gap-1"><Icons.WifiOff/> {UI_TEXT.auth.offline}</div>}
            
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gold-gradient-text tracking-widest">{UI_TEXT.brand.appName}</h1>
              <p className="text-[10px] tracking-[0.6em] text-gold-600 mt-1">TRIVIA STUDIOS</p>
            </div>
            
            {error && <div className="w-full text-center text-red-400 text-xs mb-4 bg-red-900/10 py-2 border border-red-900/30">{error}</div>}
            
            <form className="w-full space-y-4" onSubmit={(e: any) => { e.preventDefault(); onLogin(e.target.username.value, e.target.token.value); }}>
              <div className="space-y-1"><input name="username" data-testid="login-username" placeholder={UI_TEXT.auth.login.usernamePlaceholder} className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" /></div>
              <div className="space-y-1"><input name="token" type="password" data-testid="login-token" placeholder={UI_TEXT.auth.login.tokenPlaceholder} className="w-full bg-black border border-gold-900 p-3 text-center text-gold-200 focus:border-gold-500 outline-none placeholder:text-zinc-800 tracking-wider text-sm" /></div>
              <p className="text-[10px] text-zinc-600 text-center px-4">{UI_TEXT.auth.login.helper}</p>
              
              <div className="flex flex-col gap-3 mt-4">
                <Button className="w-full py-4" disabled={loading || !isOnline} testId="login-button">{loading ? UI_TEXT.auth.login.authenticating : UI_TEXT.auth.login.button}</Button>
                <div className="relative flex items-center justify-center my-2">
                   <div className="h-px bg-gold-900 w-full absolute"></div>
                   <span className="bg-luxury-dark px-2 text-[10px] text-gold-700 relative z-10 font-sans tracking-widest">NO ACCESS?</span>
                </div>
                <Button variant="secondary" className="w-full py-3 text-xs" onClick={() => setMode('REQUEST')}>{UI_TEXT.auth.login.getToken}</Button>
              </div>
            </form>
          </div>
        )}

        {/* --- REQUEST MODE --- */}
        {mode === 'REQUEST' && (
          <div className="w-[90%] max-w-[400px] border border-gold-600/30 bg-luxury-dark/95 backdrop-blur-xl p-8 rounded-sm shadow-glow flex flex-col relative animate-in slide-in-from-right duration-300">
             <div className="mb-6 text-center border-b border-gold-900/50 pb-4">
               <h2 className="text-xl font-bold text-gold-100 tracking-widest">{UI_TEXT.auth.request.title}</h2>
               <p className="text-[10px] text-zinc-500 mt-2 font-sans">{UI_TEXT.auth.request.desc}</p>
             </div>

             {reqError && <div className="w-full text-center text-red-400 text-xs mb-4 bg-red-900/10 py-2 border border-red-900/30">{reqError}</div>}

             <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <label className="text-[9px] text-gold-600 font-bold block mb-1">{UI_TEXT.auth.request.fields.first}</label>
                      <input className="w-full bg-black border border-gold-900 p-2 text-gold-200 text-sm focus:border-gold-500 outline-none" value={reqData.firstName} onChange={e => setReqData({...reqData, firstName: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[9px] text-gold-600 font-bold block mb-1">{UI_TEXT.auth.request.fields.last}</label>
                      <input className="w-full bg-black border border-gold-900 p-2 text-gold-200 text-sm focus:border-gold-500 outline-none" value={reqData.lastName} onChange={e => setReqData({...reqData, lastName: e.target.value})} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gold-600 font-bold block mb-1">{UI_TEXT.auth.request.fields.tiktok}</label>
                    <input className="w-full bg-black border border-gold-900 p-2 text-gold-200 text-sm focus:border-gold-500 outline-none" placeholder="@" value={reqData.tiktokHandle} onChange={e => setReqData({...reqData, tiktokHandle: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[9px] text-gold-600 font-bold block mb-1">PHONE NUMBER</label>
                    <input className="w-full bg-black border border-gold-900 p-2 text-gold-200 text-sm focus:border-gold-500 outline-none" placeholder="123-456-7890" value={reqData.phoneNumber} onChange={e => setReqData({...reqData, phoneNumber: e.target.value})} />
                  </div>
                </div>
                <div>
                   <label className="text-[9px] text-gold-600 font-bold block mb-1">{UI_TEXT.auth.request.fields.user}</label>
                   <input className="w-full bg-black border border-gold-900 p-2 text-gold-200 text-sm focus:border-gold-500 outline-none" value={reqData.preferredUsername} onChange={e => setReqData({...reqData, preferredUsername: e.target.value.replace(/\s/g, '')})} />
                   <p className="text-[9px] text-zinc-600 mt-1 text-right">{UI_TEXT.auth.request.fields.userHelp}</p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                   <Button className="w-full py-3" disabled={reqLoading}>{reqLoading ? UI_TEXT.auth.request.buttons.sending : UI_TEXT.auth.request.buttons.submit}</Button>
                   <Button variant="ghost" onClick={() => setMode('AUTH')}>{UI_TEXT.auth.request.buttons.back}</Button>
                </div>
             </form>
          </div>
        )}

        {/* --- SUCCESS MODE --- */}
        {mode === 'SUCCESS' && (
          <div className="w-[90%] max-w-[400px] border-2 border-gold-500 bg-luxury-dark/95 backdrop-blur-xl p-8 rounded-sm shadow-glow-strong flex flex-col items-center text-center animate-in zoom-in duration-300">
             <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mb-6 border border-gold-500 text-gold-400">
                <Icons.Check />
             </div>
             <h2 className="text-xl font-bold text-gold-100 tracking-widest mb-4">{UI_TEXT.auth.request.success.title}</h2>
             
             <div className="bg-gold-900/30 border border-gold-600/50 p-4 mb-6 rounded">
                <p className="text-sm font-serif text-gold-300 leading-relaxed">
                   {UI_TEXT.auth.request.success.message}
                </p>
             </div>
             
             <div className="w-full h-1 bg-zinc-800 rounded mb-6 overflow-hidden">
                <div className="h-full bg-gold-500 w-full"></div>
             </div>
             <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-6">STEP 1 OF 1 COMPLETE</p>

             <Button className="w-full py-3" onClick={() => setMode('AUTH')}>{UI_TEXT.auth.request.success.done}</Button>
          </div>
        )}

      </div>
    </div>
  );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard: React.FC<{ session: Session; logout: () => void; onSwitchToStudio: () => void }> = ({ session, logout, onSwitchToStudio }) => {
  const [tab, setTab] = useState<'USERS' | 'REQUESTS' | 'AUDIT'>('REQUESTS'); // Default to Inbox
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [requests, setRequests] = useState<TokenRequest[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [reqFilter, setReqFilter] = useState<TokenRequestStatus | 'ALL'>('PENDING');
  
  const [newUserUsername, setNewUserUsername] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState<AuthToken[]>([]);
  
  // Credential Modal State
  const [credentialModal, setCredentialModal] = useState<{
    isOpen: boolean;
    username: string;
    token: string;
    userId: string;
  } | null>(null);
  
  // Sharing State
  const [shareMode, setShareMode] = useState<'NONE' | 'EMAIL' | 'SMS'>('NONE');
  const [shareInput, setShareInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    refreshData();
  }, [tab]);

  const refreshData = () => {
    setUsers(StorageService.getUsers());
    setAuditLogs(StorageService.getAuditLogs());
    setRequests(StorageService.getTokenRequests().sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleOpenStudio = () => {
    logger.info('ADMIN_OPEN_STUDIO_CLICKED', { adminId: session.userId });
    showToast("Opening Studio...", 'info');
    setTimeout(() => {
        onSwitchToStudio();
        logger.info('ADMIN_OPEN_STUDIO_SUCCESS', { adminId: session.userId });
    }, 250);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await StorageService.adminCreateUser(session.userId, newUserUsername);
    if (res.success && res.user) {
      const token = await StorageService.adminIssueToken(session.userId, res.user.id, null);
      setCredentialModal({ isOpen: true, username: res.user.username, token: token, userId: res.user.id });
      setNewUserUsername('');
      refreshData();
      showToast('Identity Provisioned', 'success');
    } else {
      showToast(res.error || 'Failed to create user', 'error');
    }
  };

  // --- REQUEST APPROVAL WORKFLOW ---
  const handleApproveRequest = async (request: TokenRequest) => {
    // 1. Create User
    const userRes = await StorageService.adminCreateUser(session.userId, request.preferredUsername);
    
    // Handle Username Conflict specifically for requests
    if (!userRes.success && userRes.error === 'Username taken.') {
       // Check if user exists and is just inactive? For now, simplistic error.
       showToast(`Username '${request.preferredUsername}' is taken. Edit username or contact user.`, 'error');
       return;
    }

    if (userRes.success && userRes.user) {
       // 2. Issue Token
       const token = await StorageService.adminIssueToken(session.userId, userRes.user.id, null); // Permanent by default
       
       // 3. Update Request Status
       await StorageService.adminUpdateRequestStatus(session.userId, request.id, 'APPROVED');
       
       // 4. Show Modal
       setCredentialModal({ isOpen: true, username: request.preferredUsername, token: token, userId: userRes.user.id });
       
       refreshData();
       showToast("Request Approved & Account Created", 'success');
    } else {
       showToast(userRes.error || "System Error during approval", 'error');
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: TokenRequestStatus) => {
    await StorageService.adminUpdateRequestStatus(session.userId, requestId, status);
    refreshData();
    showToast(`Request marked as ${status}`, 'info');
  };

  const handleCopyReply = (req: TokenRequest) => {
    const text = CommunicationService.generateResponseTemplate(req);
    navigator.clipboard.writeText(text);
    showToast(UI_TEXT.admin.requests.actions.replyCopied, 'success');
  };

  const toggleExpand = (id: string, type: 'USER' | 'REQUEST') => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (type === 'USER') setUserTokens(StorageService.getTokens(id));
    }
  };

  const handleIssueToken = async (userId: string, username: string, expiry: number | null) => {
    const token = await StorageService.adminIssueToken(session.userId, userId, expiry);
    setCredentialModal({ isOpen: true, username: username, token: token, userId: userId });
    setUserTokens(StorageService.getTokens(userId));
    refreshData();
  };

  const handleStatusChange = (userId: string, status: UserStatus) => {
    StorageService.adminSetUserStatus(session.userId, userId, status);
    refreshData();
    showToast(`User ${status.toLowerCase()}`, 'info');
  };

  const handleShare = async () => {
    if (!credentialModal) return;
    setIsSending(true);
    let success = false;
    try {
      if (shareMode === 'EMAIL') {
        success = await CommunicationService.sendLoginEmail(session.userId, credentialModal.userId, shareInput, credentialModal.username, credentialModal.token);
      } else if (shareMode === 'SMS') {
        success = await CommunicationService.sendLoginSms(session.userId, credentialModal.userId, shareInput, credentialModal.username, credentialModal.token);
      }
      
      if (success) {
        showToast(UI_TEXT.admin.credentials.sentSuccess, 'success');
        setShareMode('NONE');
        setShareInput('');
      } else {
        showToast('Failed to send. Try again or copy manually.', 'error');
      }
    } catch (e) {
      showToast('System Error during send.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    if (!credentialModal) return;
    const msg = CommunicationService.getShareMessage(credentialModal.username, credentialModal.token);
    navigator.clipboard.writeText(msg);
    setIsCopied(true);
    showToast('Login details copied to clipboard', 'success');
    setShareMode('NONE');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Filters
  const filteredUsers = users.filter(u => u.username.includes(searchTerm.toLowerCase()));
  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.tiktokHandle.toLowerCase().includes(searchTerm.toLowerCase()) || r.preferredUsername.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = reqFilter === 'ALL' || r.status === reqFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-dvh flex flex-col bg-luxury-black text-gold-300 font-sans">
      <BrandHeader />
      <div className="flex items-center justify-between p-4 border-b border-gold-900 bg-luxury-panel">
        <h2 className="text-xl font-serif font-bold tracking-widest text-gold-100">{UI_TEXT.admin.title}</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleOpenStudio}>{UI_TEXT.admin.nav.studio}</Button>
          <Button variant="ghost" onClick={() => logout()}>LOGOUT</Button>
        </div>
      </div>
      
      <div className="flex border-b border-gold-900">
        <button onClick={() => setTab('REQUESTS')} className={`flex-1 py-3 text-xs tracking-widest ${tab === 'REQUESTS' ? 'bg-gold-900/20 text-gold-100 border-b-2 border-gold-500' : 'text-zinc-500'}`}>{UI_TEXT.admin.nav.requests} {requests.filter(r => r.status === 'PENDING').length > 0 && <span className="bg-red-500 text-white rounded-full px-1 text-[9px] ml-1">{requests.filter(r => r.status === 'PENDING').length}</span>}</button>
        <button onClick={() => setTab('USERS')} className={`flex-1 py-3 text-xs tracking-widest ${tab === 'USERS' ? 'bg-gold-900/20 text-gold-100 border-b-2 border-gold-500' : 'text-zinc-500'}`}>{UI_TEXT.admin.nav.users}</button>
        <button onClick={() => setTab('AUDIT')} className={`flex-1 py-3 text-xs tracking-widest ${tab === 'AUDIT' ? 'bg-gold-900/20 text-gold-100 border-b-2 border-gold-500' : 'text-zinc-500'}`}>{UI_TEXT.admin.nav.audit}</button>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        
        {/* --- REQUESTS INBOX --- */}
        {tab === 'REQUESTS' && (
          <div className="max-w-4xl mx-auto space-y-4">
             <div className="flex gap-2">
                <input 
                  className="flex-1 bg-black border border-zinc-800 p-2 text-gold-200 outline-none focus:border-gold-500 text-sm" 
                  placeholder={UI_TEXT.admin.requests.search}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <select className="bg-black text-gold-400 border border-zinc-800 text-xs px-2 outline-none focus:border-gold-500" value={reqFilter} onChange={(e) => setReqFilter(e.target.value as any)}>
                   <option value="PENDING">PENDING</option>
                   <option value="CONTACTED">CONTACTED</option>
                   <option value="APPROVED">APPROVED</option>
                   <option value="REJECTED">REJECTED</option>
                   <option value="ALL">ALL</option>
                </select>
             </div>

             {filteredRequests.length === 0 ? <p className="text-zinc-500 text-sm text-center py-8">{UI_TEXT.admin.requests.empty}</p> : (
               <div className="space-y-3">
                  {filteredRequests.map(req => {
                     const isExpanded = expandedId === req.id;
                     const statusColors: any = { PENDING: 'text-yellow-500', CONTACTED: 'text-blue-400', APPROVED: 'text-green-500', REJECTED: 'text-red-500' };
                     return (
                       <div key={req.id} className={`border ${isExpanded ? 'border-gold-500 bg-zinc-900/50' : 'border-zinc-800 bg-black/50'} rounded transition-colors`}>
                          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-900" onClick={() => toggleExpand(req.id, 'REQUEST')}>
                             <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-bold ${statusColors[req.status] || 'text-zinc-500'} w-16`}>{req.status}</span>
                                <div className="flex flex-col">
                                   <span className="font-bold text-gold-100">{req.firstName} {req.lastName}</span>
                                   <span className="text-[10px] text-zinc-500">{req.tiktokHandle} • {new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>
                             </div>
                             <span className="text-zinc-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
                          </div>
                          {isExpanded && (
                             <div className="p-4 border-t border-zinc-800 bg-black space-y-4 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                   <div><span className="text-[9px] text-zinc-500 block">{UI_TEXT.admin.requests.details.tiktok}</span><span className="text-gold-200">{req.tiktokHandle}</span></div>
                                   <div><span className="text-[9px] text-zinc-500 block">PHONE NUMBER</span><span className="text-gold-200">{req.phoneNumber}</span></div>
                                   <div><span className="text-[9px] text-zinc-500 block">{UI_TEXT.admin.requests.details.user}</span><span className="text-gold-200 font-bold">{req.preferredUsername}</span></div>
                                   <div className="col-span-2"><span className="text-[9px] text-zinc-500 block">{UI_TEXT.admin.requests.details.received}</span><span className="text-zinc-400">{new Date(req.createdAt).toLocaleString()}</span></div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-900">
                                   {req.status === 'PENDING' && (
                                      <>
                                        <Button variant="primary" className="py-2" onClick={() => handleApproveRequest(req)}>{UI_TEXT.admin.requests.actions.approve}</Button>
                                        <Button variant="secondary" className="py-2" onClick={() => handleUpdateRequestStatus(req.id, 'CONTACTED')}>{UI_TEXT.admin.requests.actions.contact}</Button>
                                        <Button variant="danger" className="py-2" onClick={() => handleUpdateRequestStatus(req.id, 'REJECTED')}>{UI_TEXT.admin.requests.actions.reject}</Button>
                                      </>
                                   )}
                                   {req.status === 'CONTACTED' && (
                                      <>
                                        <Button variant="primary" className="py-2" onClick={() => handleApproveRequest(req)}>{UI_TEXT.admin.requests.actions.approve}</Button>
                                        <Button variant="danger" className="py-2" onClick={() => handleUpdateRequestStatus(req.id, 'REJECTED')}>{UI_TEXT.admin.requests.actions.reject}</Button>
                                      </>
                                   )}
                                   <Button variant="ghost" onClick={() => handleCopyReply(req)} className="ml-auto"><Icons.Copy /> {UI_TEXT.admin.requests.actions.copyReply}</Button>
                                </div>
                             </div>
                          )}
                       </div>
                     );
                  })}
               </div>
             )}
          </div>
        )}

        {/* --- USERS TAB --- */}
        {tab === 'USERS' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-luxury-panel border border-gold-900/50 p-4 rounded">
              <h3 className="text-sm font-bold text-gold-500 mb-4 tracking-wider">{UI_TEXT.admin.users.create}</h3>
              <form onSubmit={handleCreateUser} className="flex gap-2">
                <input 
                  className="flex-1 bg-black border border-zinc-800 p-2 text-gold-200 outline-none focus:border-gold-500" 
                  placeholder="USERNAME" 
                  value={newUserUsername}
                  onChange={e => setNewUserUsername(e.target.value)}
                />
                <Button variant="primary">CREATE & ISSUE TOKEN</Button>
              </form>
            </div>

            <div className="space-y-4">
              <input 
                className="w-full bg-black border border-zinc-800 p-2 text-gold-200 outline-none focus:border-gold-500 text-sm" 
                placeholder={UI_TEXT.admin.users.searchPlaceholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {filteredUsers.map(user => (
                <div key={user.id} className="border border-zinc-800 bg-black/50 rounded overflow-hidden">
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-900 transition-colors" onClick={() => toggleExpand(user.id, 'USER')}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-500'}`} />
                      <span className="font-bold text-gold-100">{user.username}</span>
                      {user.lastLoginAt && <span className="text-[10px] text-zinc-600">LAST SEEN: {new Date(user.lastLoginAt).toLocaleString()}</span>}
                    </div>
                    <span className="text-zinc-500 text-xs">{expandedId === user.id ? '▼' : '▶'}</span>
                  </div>
                  {expandedId === user.id && (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 space-y-4">
                      <div className="flex gap-2">
                        {user.status === 'ACTIVE' ? (
                          <Button variant="danger" className="py-1 text-[10px]" onClick={() => handleStatusChange(user.id, 'REVOKED')}>{UI_TEXT.admin.users.actions.revoke}</Button>
                        ) : (
                          <Button variant="secondary" className="py-1 text-[10px]" onClick={() => handleStatusChange(user.id, 'ACTIVE')}>{UI_TEXT.admin.users.actions.grant}</Button>
                        )}
                        <Button variant="secondary" className="py-1 text-[10px]" onClick={() => { StorageService.adminForceLogout(session.userId, user.id); showToast("User Logged Out"); }}>{UI_TEXT.admin.users.actions.logout}</Button>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-[10px] font-bold text-zinc-500 tracking-widest">ACCESS TOKENS</h4>
                          <div className="flex gap-1">
                             <Button variant="secondary" className="py-0 px-2 text-[9px]" onClick={() => handleIssueToken(user.id, user.username, null)}>+ PERMANENT</Button>
                             <Button variant="secondary" className="py-0 px-2 text-[9px]" onClick={() => handleIssueToken(user.id, user.username, 24*60*60*1000)}>+ 24H</Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {userTokens.map(token => (
                            <div key={token.id} className={`flex justify-between items-center p-2 border ${token.revokedAt ? 'border-red-900/30 bg-red-900/10' : 'border-zinc-800 bg-black'} text-xs`}>
                              <span className={token.revokedAt ? 'text-red-500 line-through' : 'text-zinc-300'}>
                                Created: {new Date(token.createdAt).toLocaleDateString()}
                                {token.expiresAt && ` (Exp: ${new Date(token.expiresAt).toLocaleDateString()})`}
                              </span>
                              {!token.revokedAt && (
                                <button onClick={() => { StorageService.adminRevokeToken(session.userId, token.id); setUserTokens(StorageService.getTokens(user.id)); }} className="text-red-500 hover:text-white text-[10px]">REVOKE</button>
                              )}
                            </div>
                          ))}
                          {userTokens.length === 0 && <p className="text-[10px] text-zinc-600 italic">No tokens issued.</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'AUDIT' && (
          <div className="max-w-4xl mx-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-zinc-500 border-b border-zinc-800">
                  <th className="p-2">TIME</th>
                  <th className="p-2">ACTION</th>
                  <th className="p-2">TARGET</th>
                  <th className="p-2">METADATA</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/30">
                    <td className="p-2 text-zinc-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-2 text-gold-400 font-bold">{log.action}</td>
                    <td className="p-2 text-zinc-300">{log.targetUserId || '-'}</td>
                    <td className="p-2 text-zinc-500 font-mono overflow-hidden max-w-xs truncate">{JSON.stringify(log.metadata || {})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {credentialModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-luxury-panel border border-gold-500 p-0 max-w-md w-full shadow-glow-strong flex flex-col overflow-hidden rounded-sm">
            <div className="bg-gold-600 p-4 flex items-center justify-between">
               <h3 className="text-black font-bold tracking-widest text-sm">{UI_TEXT.admin.credentials.title}</h3>
               <div className="text-[9px] font-bold bg-black/20 px-2 py-1 rounded text-black animate-pulse">{UI_TEXT.admin.credentials.warning}</div>
            </div>
            <div className="p-6 space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 tracking-widest block">{UI_TEXT.admin.credentials.usernameLabel}</label>
                  <div className="bg-black border border-zinc-800 p-3 font-mono text-gold-100 text-lg select-all">{credentialModal.username}</div>
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 tracking-widest block">{UI_TEXT.admin.credentials.tokenLabel}</label>
                  <div className="bg-black border border-gold-500/50 p-4 font-mono text-gold-400 text-xl tracking-wider break-all select-all text-center">{CommunicationService.formatToken(credentialModal.token)}</div>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <Button variant={isCopied ? 'success' : (shareMode === 'NONE' ? 'primary' : 'secondary')} onClick={handleCopy}>
                    <div className="flex flex-col items-center gap-1">
                      {isCopied ? <Icons.Check /> : <Icons.Copy />}
                      <span className="text-[9px]">{isCopied ? 'COPIED!' : UI_TEXT.admin.credentials.copyButton}</span>
                    </div>
                  </Button>
                  <Button variant={shareMode === 'EMAIL' ? 'primary' : 'secondary'} onClick={() => { setShareMode('EMAIL'); setShareInput(''); }}>
                    <div className="flex flex-col items-center gap-1"><Icons.Mail /><span className="text-[9px]">{UI_TEXT.admin.credentials.emailButton}</span></div>
                  </Button>
                  <Button variant={shareMode === 'SMS' ? 'primary' : 'secondary'} onClick={() => { setShareMode('SMS'); setShareInput(''); }}>
                    <div className="flex flex-col items-center gap-1"><Icons.Chat /><span className="text-[9px]">{UI_TEXT.admin.credentials.smsButton}</span></div>
                  </Button>
               </div>
               {shareMode !== 'NONE' && (
                 <div className="bg-zinc-900/50 p-4 border border-zinc-800 animate-in slide-in-from-top-2">
                    <label className="text-[10px] text-zinc-500 tracking-widest block mb-2">{shareMode === 'EMAIL' ? 'RECIPIENT EMAIL' : 'RECIPIENT PHONE'}</label>
                    <div className="flex gap-2">
                       <input className="flex-1 bg-black border border-zinc-700 p-2 text-sm text-white outline-none focus:border-gold-500" placeholder={shareMode === 'EMAIL' ? UI_TEXT.admin.credentials.emailPlaceholder : UI_TEXT.admin.credentials.smsPlaceholder} value={shareInput} onChange={e => setShareInput(e.target.value)} />
                       <Button disabled={isSending || !shareInput} onClick={handleShare}>{isSending ? 'SENDING...' : UI_TEXT.admin.credentials.send}</Button>
                    </div>
                 </div>
               )}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-black/50">
               <Button className="w-full py-3" onClick={() => setCredentialModal(null)}>{UI_TEXT.admin.credentials.done}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ... Rest of the file remains unchanged ...
const DirectorPlaceholder: React.FC<{ onBringBack: () => void; className?: string }> = ({ onBringBack, className = "" }) => (
  <div className={`bg-luxury-black border-l border-gold-900/50 flex flex-col items-center justify-center p-8 text-center gap-6 ${className}`}>
    <div className="w-24 h-24 rounded-full bg-gold-900/20 flex items-center justify-center border border-gold-600/30 animate-pulse">
      <Icons.Attach />
    </div>
    <div>
      <h3 className="text-xl font-bold text-gold-400 tracking-widest mb-2">{UI_TEXT.director.placeholder.title}</h3>
      <p className="text-zinc-500 text-xs font-sans max-w-[200px] mx-auto">{UI_TEXT.director.placeholder.desc}</p>
    </div>
    <Button onClick={onBringBack} variant="primary">{UI_TEXT.director.placeholder.button}</Button>
  </div>
);

const DirectorPanel: React.FC<{
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose?: () => void;
  openDetached?: () => void;
  isDetached?: boolean;
  hotkeysEnabled?: boolean;
  toggleHotkeys?: () => void;
  className?: string;
}> = ({ gameState, setGameState, onClose, openDetached, isDetached, hotkeysEnabled = true, toggleHotkeys, className = "" }) => {
  const tabs = ['game', 'players', 'questions', 'log'] as const;
  const [tab, setTab] = useState<typeof tabs[number]>('game');
  
  const updatePlayer = (index: number, delta: number) => {
    setGameState(prev => {
      const players = [...prev.players];
      players[index].score += delta;
      if (delta < 0) players[index].streak = 0; 
      else if (delta > 0) players[index].streak += 1;
      return { ...prev, players };
    });
  };

  const updatePlayerName = (index: number, name: string) => {
    setGameState(prev => {
      const players = [...prev.players];
      players[index].name = name;
      return { ...prev, players };
    });
  };

  const resetQuestion = (categoryId: string, questionId: string) => {
     setGameState(prev => {
       const cats = prev.categories.map(c => c.id === categoryId ? { ...c, questions: c.questions.map(q => q.id === questionId ? { ...q, state: QuestionState.AVAILABLE } : q) } : c);
       return { ...prev, categories: cats, currentQuestion: null, currentQuestionState: null };
     });
  };

  return (
    <div className={`flex flex-col bg-luxury-panel border-l border-gold-900/50 shadow-2xl h-full ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-gold-900/50 bg-black/40 shrink-0">
         <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold-500 tracking-widest uppercase">{isDetached ? UI_TEXT.director.detachedTitle : UI_TEXT.director.title}</span>
            {isDetached && <span className="text-[9px] bg-red-900/50 text-red-200 px-1 rounded animate-pulse">{UI_TEXT.director.sync}</span>}
         </div>
         <div className="flex items-center gap-1">
            {toggleHotkeys && (
              <button onClick={toggleHotkeys} className={`p-1 rounded ${hotkeysEnabled ? 'text-green-500' : 'text-red-500'}`} title="Toggle Hotkeys">
                 <Icons.Keyboard />
              </button>
            )}
            {!isDetached && openDetached && <button onClick={openDetached} className="p-1 text-gold-500 hover:text-white" title={UI_TEXT.director.popout}><Icons.Detach/></button>}
            {!isDetached && onClose && <button onClick={onClose} className="p-1 text-gold-500 hover:text-white" title={UI_TEXT.director.close}><Icons.Close/></button>}
         </div>
      </div>

      <div className="flex border-b border-gold-900/30 bg-black/20 shrink-0 overflow-x-auto">
         {tabs.map(t => (
           <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-[10px] font-bold tracking-wider ${tab === t ? 'text-gold-400 border-b-2 border-gold-500 bg-gold-900/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
             {UI_TEXT.director.tabs[t]}
           </button>
         ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-luxury-dark/50">
         {tab === 'game' && (
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] text-zinc-500 font-bold tracking-widest">{UI_TEXT.director.gameTab.eventLabel}</label>
                 <input className="w-full bg-black border border-zinc-800 p-2 text-gold-200 text-sm focus:border-gold-500 outline-none" value={gameState.eventName || ""} onChange={e => setGameState(p => ({...p, eventName: e.target.value}))} />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] text-zinc-500 font-bold tracking-widest">{UI_TEXT.director.gameTab.titleLabel}</label>
                 <input className="w-full bg-black border border-zinc-800 p-2 text-gold-200 text-sm focus:border-gold-500 outline-none" value={gameState.gameTitle} onChange={e => setGameState(p => ({...p, gameTitle: e.target.value}))} />
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] text-zinc-500 font-bold tracking-widest">{UI_TEXT.director.gameTab.timerLabel}</label>
                 <div className="flex items-center gap-2">
                    <input className="w-20 bg-black border border-zinc-800 p-2 text-gold-200 text-center font-mono" type="number" value={gameState.timer} onChange={e => setGameState(p => ({...p, timer: parseInt(e.target.value) || 0}))} />
                    <Button variant={gameState.isTimerRunning ? 'danger' : 'primary'} onClick={() => setGameState(p => ({...p, isTimerRunning: !p.isTimerRunning}))}>
                      {gameState.isTimerRunning ? <Icons.Pause /> : <Icons.Play />}
                    </Button>
                    {[10, 30, 60].map(s => (
                      <Button key={s} variant="secondary" onClick={() => setGameState(p => ({...p, timer: s, isTimerRunning: true}))} className="px-2">{s}s</Button>
                    ))}
                 </div>
              </div>

              {gameState.currentQuestion && (
                 <div className="p-3 border border-gold-900/50 bg-gold-900/10 rounded space-y-3">
                    <div className="flex justify-between items-center"><span className="text-[10px] text-gold-400 uppercase tracking-widest">{UI_TEXT.director.gameTab.actionsLabel}</span></div>
                    <div className="grid grid-cols-2 gap-2">
                       <Button variant="primary" onClick={() => {
                          setGameState(prev => {
                             if (!prev.currentQuestion) return prev;
                             const { categoryId, questionId } = prev.currentQuestion;
                             const cat = prev.categories.find(c => c.id === categoryId);
                             const q = cat?.questions.find(q => q.id === questionId);
                             if (!q) return prev;
                             const points = q.isDoubleOrNothing ? q.points * 2 : q.points;
                             const players = [...prev.players];
                             players[prev.activePlayerIndex].score += points;
                             const cats = prev.categories.map(c => c.id === categoryId ? { ...c, questions: c.questions.map(qq => qq.id === questionId ? { ...qq, state: QuestionState.AWARDED } : qq) } : c);
                             return { ...prev, categories: cats, players, currentQuestion: null, currentQuestionState: null, activityLog: [`DIRECTOR AWARDED ${points}`, ...prev.activityLog] };
                          });
                       }}>{UI_TEXT.director.gameTab.forceAward}</Button>
                       
                       <Button variant="danger" onClick={() => {
                          setGameState(prev => {
                             if (!prev.currentQuestion) return prev;
                             const { categoryId, questionId } = prev.currentQuestion;
                             const cats = prev.categories.map(c => c.id === categoryId ? { ...c, questions: c.questions.map(qq => qq.id === questionId ? { ...qq, state: QuestionState.VOIDED } : qq) } : c);
                             return { ...prev, categories: cats, currentQuestion: null, currentQuestionState: null, activityLog: [`DIRECTOR VOIDED`, ...prev.activityLog] };
                          });
                       }}>{UI_TEXT.director.gameTab.forceVoid}</Button>
                       
                       <Button variant="secondary" className="col-span-2" onClick={() => {
                          setGameState(prev => ({ ...prev, currentQuestion: null, currentQuestionState: null }));
                       }}>{UI_TEXT.director.gameTab.forceClose}</Button>
                    </div>
                 </div>
              )}
           </div>
         )}

         {/* ... other tabs (players, questions, log) unchanged ... */}
         {tab === 'players' && (
           <div className="space-y-4">
              {gameState.players.map((p, i) => (
                <div key={p.id} className={`p-3 border rounded flex flex-col gap-2 ${i === gameState.activePlayerIndex ? 'border-gold-500 bg-gold-900/20' : 'border-zinc-800 bg-black/40'}`}>
                   <div className="flex items-center gap-2">
                      <input className="flex-1 bg-transparent border-none text-gold-200 text-sm font-bold focus:bg-black/50 outline-none" value={p.name} onChange={e => updatePlayerName(i, e.target.value)} />
                      {i === gameState.activePlayerIndex && <span className="text-[9px] bg-gold-600 text-black px-1 rounded font-bold">ACTIVE</span>}
                      <button onClick={() => setGameState(prev => ({ ...prev, activePlayerIndex: i }))} className="text-zinc-500 hover:text-white"><Icons.User /></button>
                   </div>
                   <div className="flex items-center justify-between bg-black/50 p-1 rounded">
                      <button onClick={() => updatePlayer(i, -100)} className="w-8 h-8 flex items-center justify-center bg-red-900/30 hover:bg-red-900 text-red-400 rounded">-</button>
                      <span className="font-mono text-lg font-bold text-gold-100">{p.score}</span>
                      <button onClick={() => updatePlayer(i, 100)} className="w-8 h-8 flex items-center justify-center bg-green-900/30 hover:bg-green-900 text-green-400 rounded">+</button>
                   </div>
                </div>
              ))}
           </div>
         )}

         {tab === 'questions' && (
           <div className="space-y-6">
             {gameState.categories.map(c => (
               <div key={c.id}>
                 <h4 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">{c.name}</h4>
                 <div className="grid grid-cols-5 gap-1">
                    {c.questions.map(q => (
                      <button 
                        key={q.id}
                        onClick={() => {
                           if (q.state !== QuestionState.AVAILABLE) resetQuestion(c.id, q.id);
                        }}
                        className={`text-[10px] p-1 rounded border ${q.state === QuestionState.AVAILABLE ? 'border-zinc-800 text-zinc-500 opacity-50 cursor-default' : 'border-gold-900 bg-gold-900/20 text-gold-400 hover:bg-red-900/50 hover:text-white'}`}
                        title={q.state !== QuestionState.AVAILABLE ? "Click to RESET" : "Available"}
                      >
                        {q.points}
                      </button>
                    ))}
                 </div>
               </div>
             ))}
           </div>
         )}

         {tab === 'log' && (
           <div className="font-mono text-[10px] space-y-1 text-zinc-400">
              {gameState.activityLog.map((log, i) => (
                <div key={i} className="border-b border-zinc-800 pb-1">{log}</div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
};

// ... Rest of the file (SafeGameBoard, CruzPhamTriviaApp, App default export) remains unchanged from previous context ...
const SafeGameBoard: React.FC<{
  gameState: GameState;
  activeMobileTab: 'BOARD' | 'LEADERBOARD';
  selectQuestion: (cid: string, qid: string) => void;
  setActiveMobileTab: (tab: 'BOARD' | 'LEADERBOARD') => void;
  logRender?: () => void;
}> = ({ gameState, activeMobileTab, selectQuestion, setActiveMobileTab, logRender }) => {
  if (logRender) logRender();
  
  const activePlayer = gameState.players[gameState.activePlayerIndex];

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className={`flex-1 flex flex-col p-2 md:p-6 overflow-hidden transition-all duration-300 ${activeMobileTab === 'LEADERBOARD' ? 'hidden md:flex' : 'flex'}`}>
         {/* --- EVENT HEADER --- */}
         <div className="mb-2 shrink-0 border-b border-gold-900/30 pb-2 flex justify-center">
            <h2 className="font-serif font-bold text-gold-500 text-xs md:text-sm tracking-[0.2em] uppercase drop-shadow-md">
                EVENT: {gameState.eventName || UI_TEXT.onboarding.defaultName}
            </h2>
         </div>

         <div className="flex gap-2 md:gap-4 mb-2 md:mb-4 h-16 md:h-24 shrink-0">
            {gameState.categories.map(category => (
               <div key={category.id} className="flex-1 bg-luxury-panel border-b-4 border-gold-600 shadow-lg flex items-center justify-center p-2 text-center group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gold-400/5 group-hover:bg-gold-400/10 transition-colors"></div>
                  <h3 className="font-serif font-bold text-gold-100 text-[10px] md:text-sm lg:text-lg tracking-widest uppercase drop-shadow-md break-words w-full line-clamp-3 leading-tight">{category.name}</h3>
               </div>
            ))}
         </div>
         <div className="flex-1 flex gap-2 md:gap-4 min-h-0">
            {gameState.categories.map(category => (
               <div key={category.id} className="flex-1 flex flex-col gap-2 md:gap-4">
                  {category.questions.map(q => {
                     const isAvailable = q.state === QuestionState.AVAILABLE;
                     return (
                        <button
                           key={q.id}
                           disabled={!isAvailable}
                           onClick={() => selectQuestion(category.id, q.id)}
                           className={`
                             flex-1 relative flex items-center justify-center border-2 rounded-sm transition-all duration-300
                             ${isAvailable 
                               ? 'bg-luxury-panel border-gold-900/30 hover:border-gold-500 hover:bg-gold-900/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(221,184,86,0.3)] cursor-pointer text-gold-400 font-serif font-bold text-xl md:text-4xl shadow-lg' 
                               : 'bg-black/20 border-transparent text-transparent pointer-events-none'}
                           `}
                        >
                           {isAvailable && <span className="drop-shadow-lg tracking-widest">{q.points}</span>}
                        </button>
                     );
                  })}
               </div>
            ))}
         </div>
      </div>

      <div className={`w-full md:w-64 lg:w-80 bg-luxury-panel border-l border-gold-900/50 flex-col shrink-0 z-20 shadow-2xl ${activeMobileTab === 'BOARD' ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-4 bg-gradient-to-b from-black/40 to-transparent border-b border-gold-900/30">
            <h3 className="text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase mb-4 flex items-center gap-2"><Icons.Trophy /> LEADERBOARD</h3>
            <div className="bg-gradient-to-r from-gold-900/40 to-black border border-gold-500/50 p-4 rounded shadow-[0_0_15px_rgba(221,184,86,0.1)] relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_lime]"></div></div>
               <span className="text-[9px] text-gold-400 uppercase tracking-widest mb-1 block">CURRENT TURN</span>
               <div className="text-xl font-bold text-white truncate mb-2">{activePlayer.name}</div>
               <div className="flex items-end justify-between">
                  <span className="text-3xl font-serif text-gold-300 font-bold leading-none">{activePlayer.score}</span>
                  {activePlayer.streak > 2 && <span className="text-[9px] font-bold text-red-400 animate-bounce">🔥 {activePlayer.streak} STREAK</span>}
               </div>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {gameState.players.map((p, i) => (
               <div key={p.id} className={`flex items-center justify-between p-3 rounded border transition-colors ${i === gameState.activePlayerIndex ? 'bg-gold-900/20 border-gold-600/50' : 'bg-black/20 border-zinc-800'}`}>
                  <div className="flex flex-col overflow-hidden">
                     <span className={`text-xs font-bold truncate ${i === gameState.activePlayerIndex ? 'text-white' : 'text-zinc-400'}`}>{p.name}</span>
                     {i === gameState.activePlayerIndex && <span className="text-[8px] text-gold-600 uppercase tracking-wider">ACTIVE</span>}
                  </div>
                  <span className={`font-mono font-bold ${p.score < 0 ? 'text-red-500' : 'text-zinc-300'}`}>{p.score}</span>
               </div>
            ))}
         </div>
         <div className="h-32 bg-black border-t border-zinc-800 p-3 overflow-y-auto font-mono text-[9px] text-zinc-500">
             {gameState.activityLog.map((log, i) => <div key={i} className="mb-1 border-b border-zinc-900 pb-1 last:border-0">{log}</div>)}
         </div>
      </div>
    </div>
  );
};

// --- Internal App Logic ---

function CruzPhamTriviaApp() {
  const { showToast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'GAME' | 'DIRECTOR_DETACHED' | 'ADMIN_DASHBOARD'>('LOGIN');
  const [templates, setTemplates] = useState<(Template & { ownerName?: string })[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRestoring, setIsRestoring] = useState(true);
  
  // Audio State
  const [volume, setVolume] = useState(0.5);
  
  // Dashboard Pagination
  const [dashboardPage, setDashboardPage] = useState(0);
  const ITEMS_PER_PAGE = 8; 

  // Event State
  const [eventName, setEventName] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    eventName: "",
    gameTitle: "",
    templateId: null,
    categories: [],
    players: Array(8).fill(null).map((_, i) => ({ id: i, name: `PLAYER ${i + 1}`, score: 0, streak: 0 })),
    activePlayerIndex: 0,
    currentQuestion: null,
    currentQuestionState: null,
    activityLog: [],
    timer: 0,
    isTimerRunning: false,
    directorMode: false,
  });

  // ... (Other states)
  const [isDirectorPoppedOut, setIsDirectorPoppedOut] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'BOARD' | 'LEADERBOARD'>('BOARD');
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  
  const [setupConfig, setSetupConfig] = useState<BoardConfig>({
    version: 1, columns: 6, rows: 5, pointValues: [100, 200, 300, 400, 500]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref states for Broadcast and Editor
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const isBroadcastingRef = useRef(false);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);

  // --- View Persistence via Hash ---
  useEffect(() => {
    if (view === 'ADMIN_DASHBOARD') window.location.hash = 'admin';
    else if (view === 'DASHBOARD') window.location.hash = 'studio';
    else if (view === 'GAME') window.location.hash = 'game';
    else if (view === 'DIRECTOR_DETACHED') { /* handled by query param usually */ }
    else window.location.hash = '';
  }, [view]);

  // --- Persistence of Event Name ---
  useEffect(() => {
    if (eventName) {
      localStorage.setItem(EVENT_NAME_KEY, eventName);
    }
  }, [eventName]);

  // Update local eventName when GameState syncs from Director
  useEffect(() => {
    if (gameState.eventName && gameState.eventName !== eventName) {
      setEventName(gameState.eventName);
    }
  }, [gameState.eventName, eventName]);

  // --- Initialization & Session Restoration ---
  useEffect(() => {
    const restore = async () => {
      const storedSessionId = localStorage.getItem(CLIENT_SESSION_KEY);
      const storedEventName = localStorage.getItem(EVENT_NAME_KEY);
      if (storedEventName) setEventName(storedEventName);

      const params = new URLSearchParams(window.location.search);
      const isDirectorMode = params.get('mode') === 'director';

      if (storedSessionId) {
        const restoredSession = await StorageService.restoreSession(storedSessionId);
        if (restoredSession) {
          setSession(restoredSession);
          
          const activeGame = StorageService.getGameState(restoredSession.sessionId);
          if (activeGame) setGameState(activeGame);

          if (restoredSession.userType === 'ADMIN') {
            if (isDirectorMode) {
               setView('DIRECTOR_DETACHED');
               setHotkeysEnabled(false);
            } else {
               // Admin Persistence Check
               const hash = window.location.hash;
               if (hash === '#studio') setView('DASHBOARD');
               else if (hash === '#game' && activeGame?.isActive) setView('GAME');
               else setView('ADMIN_DASHBOARD');
            }
          } else {
            // User Logic
            setTemplates(StorageService.getTemplates(restoredSession.username, 'USER'));
            
            // Check for onboarding (only if not restoring active game or director)
            if (!activeGame && !isDirectorMode && !storedEventName) {
               setShowOnboarding(true);
            }

            if (activeGame) {
               if (isDirectorMode) {
                 setView('DIRECTOR_DETACHED');
                 setHotkeysEnabled(false);
               } else if (activeGame.isActive) {
                 setView('GAME');
               } else {
                 setView('DASHBOARD');
               }
            } else {
               setView(isDirectorMode ? 'DIRECTOR_DETACHED' : 'DASHBOARD');
            }
          }
          setIsRestoring(false);
          return;
        } else {
          localStorage.removeItem(CLIENT_SESSION_KEY);
          if (!isDirectorMode) showToast(UI_TEXT.auth.errors.expired, 'warning');
        }
      }
      
      // Director Ticket logic
      if (isDirectorMode && !session) { // only if not restored
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
              showToast("Invalid Ticket", 'error');
           }
        }
      }
      setIsRestoring(false);
    };
    restore();
    // Broadcast logic
    broadcastRef.current = new BroadcastChannel('cruzpham_game_state');
    broadcastRef.current.onmessage = (event) => {
      if (isBroadcastingRef.current) return;
      if (event.data.type === 'STATE_UPDATE') {
        isBroadcastingRef.current = true;
        try {
          if (event.data.payload && event.data.payload.categories) {
             setGameState(event.data.payload);
             if (event.data.payload.eventName) {
                setEventName(event.data.payload.eventName);
                localStorage.setItem(EVENT_NAME_KEY, event.data.payload.eventName);
             }
             if (event.data.payload.isActive && view !== 'GAME' && view !== 'DIRECTOR_DETACHED' && view !== 'ADMIN_DASHBOARD' && session && session.userType !== 'ADMIN') {
               setView('GAME');
             }
          }
        } catch (e) { logger.error('BROADCAST_STATE_ERROR', e as Error); }
      } else if (event.data.type === 'REQUEST_STATE') {
         if (gameState.isActive) broadcastRef.current?.postMessage({ type: 'STATE_UPDATE', payload: gameState });
      } else if (event.data.type === 'DIRECTOR_CLOSED') {
         setIsDirectorPoppedOut(false);
         showToast("Director Controls Restored", 'info');
      }
    };
    return () => broadcastRef.current?.close();
  }, [view]);

  // Persist Game State
  useEffect(() => {
    if (isBroadcastingRef.current) {
        isBroadcastingRef.current = false;
        if (session) StorageService.saveGameState(session.sessionId, gameState);
        return;
    }
    if (session) StorageService.saveGameState(session.sessionId, gameState);
    if (broadcastRef.current && (gameState.isActive || view === 'DIRECTOR_DETACHED')) {
      broadcastRef.current.postMessage({ type: 'STATE_UPDATE', payload: gameState });
    }
  }, [gameState, session]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast("Connection Restored", 'success'); };
    const handleOffline = () => { setIsOnline(false); showToast("Network Connection Lost", 'error'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [showToast]);

  const handleLogin = async (u: string, t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await StorageService.login(u, t);
      if (res.success && res.session) {
        setSession(res.session);
        localStorage.setItem(CLIENT_SESSION_KEY, res.session.sessionId);
        setView(res.isAdmin ? 'ADMIN_DASHBOARD' : 'DASHBOARD');
      } else {
        setError(res.error || "Login Failed");
      }
    } catch (e) {
      setError("System Error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    if (session) StorageService.logout(session.sessionId);
    setSession(null);
    setView('LOGIN');
    localStorage.removeItem(CLIENT_SESSION_KEY);
  };

  // Re-declare start game function for dashboard use
  const startGame = (template: Template) => {
    const cid = crypto.randomUUID();
    logger.info('GAME_START', { templateId: template.id, name: template.name }, cid);
    soundService.playClick();
    
    const hasExplicitDon = template.categories.some(c => c.questions.some(q => q.isDoubleOrNothing));
    const gameCategories = template.categories.map(c => {
      const doubleIndex = Math.floor(Math.random() * c.questions.length);
      return {
        ...c,
        questions: c.questions.map((q, idx) => ({ 
          ...q, state: QuestionState.AVAILABLE,
          isDoubleOrNothing: hasExplicitDon ? q.isDoubleOrNothing : (idx === doubleIndex)
        }))
      };
    });

    const currentEventName = eventName || UI_TEXT.onboarding.defaultName;

    setGameState(prev => ({
      ...prev, isActive: true, eventName: currentEventName, gameTitle: template.name.toUpperCase(), templateId: template.id, categories: gameCategories,
      currentQuestion: null, currentQuestionState: null, activityLog: [`STARTED: ${template.name}`],
      players: prev.players.map(p => ({ ...p, score: 0, streak: 0 })), timer: 0, isTimerRunning: false
    }));
    setView('GAME');
  };

  // Re-declare handleAi for dashboard use
  const handleAi = async () => {
    if (!editingTemplate || !aiPrompt) return;
    soundService.playClick();
    const cid = crypto.randomUUID(); setIsGenerating(true);
    try {
      const gen = await generateTriviaContent(aiPrompt, editingTemplate.cols, editingTemplate.rows, aiDifficulty);
      setEditingTemplate(prev => {
        if (!prev) return null;
        return {
          ...prev, categories: prev.categories.map((c, i) => gen[i] ? { ...c, name: gen[i].name, questions: c.questions.map((q, j) => ({ ...q, question: gen[i].questions[j]?.q || q.question, answer: gen[i].questions[j]?.a || q.answer })) } : c)
        };
      });
      soundService.playAward(); showToast("Content Generated Successfully", 'success');
    } catch (e) { soundService.playVoid(); showToast("AI Generation Failed. Try a different topic.", 'error'); } finally { setIsGenerating(false); }
  };

  const handleCreateFromSetup = () => {
      const rows = setupConfig.rows; 
      // Fix: Use 'columns' from BoardConfig, but Template expects 'cols'
      const cols = setupConfig.columns; 
      
      const newT: Template = { 
        id: crypto.randomUUID(), name: "UNTITLED SHOW", rows, cols,
        boardConfig: { version: 2, columns: cols, rows: rows, pointValues: Array.from({length: rows}, (_, i) => Math.min((i + 1) * 100, 1000)) },
        createdAt: Date.now(), 
        categories: Array(cols).fill(0).map((_, i) => {
           const doubleIndex = Math.floor(Math.random() * rows);
           return { id: crypto.randomUUID(), name: `CAT ${i+1}`, questions: Array(rows).fill(0).map((_, j) => ({ id: crypto.randomUUID(), question: "Edit Me", answer: "Answer", points: Math.min((j + 1) * 100, 1000), state: QuestionState.AVAILABLE, isDoubleOrNothing: j === doubleIndex })) };
        }) 
      };
      setEditingTemplate(newT); setIsSetupOpen(false); setIsEditorOpen(true); soundService.playClick();
  };

  // Helper to refresh templates
  const refreshTemplates = useCallback(() => {
    if (session) {
      setTemplates(StorageService.getTemplates(session.username, session.userType));
    }
  }, [session]);

  useEffect(() => {
    if (view === 'DASHBOARD' && session) {
      refreshTemplates();
    }
  }, [view, session, refreshTemplates]);

  if (isRestoring) return <div className="h-dvh flex items-center justify-center bg-black text-gold-500 font-serif tracking-widest animate-pulse">LOADING STUDIO...</div>;

  return (
    <>
      {view === 'LOGIN' && <LoginView onLogin={handleLogin} isOnline={isOnline} loading={loading} error={error} />}
      
      {view === 'ADMIN_DASHBOARD' && session && (
        <AdminDashboard 
          session={session} 
          logout={handleLogout} 
          onSwitchToStudio={() => setView('DASHBOARD')} 
        />
      )}

      {/* Basic Dashboard/Game placeholder since logic was truncated previously, restored full dashboard logic here */}
      {view === 'DASHBOARD' && (
         <div className="h-dvh w-full flex flex-col bg-luxury-black text-gold-300">
            <BrandHeader />
            <div className="h-[6dvh] min-h-[48px] flex items-center justify-between px-3 md:px-4 bg-gradient-to-r from-luxury-black to-luxury-dark border-b border-gold-900/50 shrink-0 z-30 pt-safe">
               <span className="font-serif font-bold text-base md:text-lg text-gold-400 tracking-widest truncate">{UI_TEXT.brand.appName}</span>
               <div className="flex items-center gap-4 text-[10px] font-bold text-gold-700 tracking-wider">
                  {session?.userType === 'ADMIN' && <button onClick={() => setView('ADMIN_DASHBOARD')} className="text-red-400 hover:text-white transition-colors">{UI_TEXT.dashboard.nav.adminConsole}</button>}
                  <span>{templates.length} SHOWS</span>
                  <button onClick={handleLogout} className="text-gold-500 hover:text-white transition-colors">LOGOUT</button>
               </div>
            </div>
            {/* EVENT NAME BAR */}
            <div className="bg-gradient-to-r from-luxury-black via-luxury-panel to-luxury-black border-b border-gold-900/30 py-2 flex justify-center shrink-0">
               <h2 className="font-serif font-bold text-gold-500 text-xs md:text-sm tracking-[0.2em] uppercase drop-shadow-md">
                  EVENT: {eventName || UI_TEXT.onboarding.defaultName}
               </h2>
            </div>

            <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0 overflow-y-auto">
               <div className="flex justify-between items-center mb-4 shrink-0">
                  <h2 className="text-xl md:text-2xl font-serif text-gold-200 tracking-widest">{session?.userType === 'ADMIN' ? UI_TEXT.dashboard.adminTitle : UI_TEXT.dashboard.title}</h2>
                  <Button onClick={() => setIsSetupOpen(true)} variant="primary">{UI_TEXT.dashboard.newButton}</Button>
               </div>
               {templates.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-600"><Icons.Menu /><p className="mt-4 text-sm font-sans">{UI_TEXT.dashboard.emptyState}</p></div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-20 md:pb-0">
                     {templates.slice(dashboardPage * ITEMS_PER_PAGE, (dashboardPage + 1) * ITEMS_PER_PAGE).map(t => (
                        <div key={t.id} className="relative group border border-gold-900/30 bg-luxury-panel/50 hover:bg-luxury-panel hover:border-gold-600/50 transition-all p-4 flex flex-col justify-between min-h-[140px]">
                           <div>
                              <h3 className="font-bold text-gold-100 truncate tracking-wide">{t.name}</h3>
                              <p className="text-[10px] text-zinc-600 mt-1 uppercase">{t.cols} x {t.rows} GRID {t.ownerName && session?.userType === 'ADMIN' && <span className="text-gold-600 block mt-1 border-t border-zinc-800 pt-1">OWNER: {t.ownerName}</span>}</p>
                           </div>
                           <div className="flex gap-2 mt-4 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="secondary" className="flex-1 py-1" onClick={() => { setEditingTemplate(t); setIsEditorOpen(true); soundService.playClick(); }}>{UI_TEXT.dashboard.card.edit}</Button>
                              <Button variant="primary" className="flex-1 py-1" onClick={() => startGame(t)}>{UI_TEXT.dashboard.card.live}</Button>
                              <button onClick={() => {
                                 if(session) {
                                    StorageService.deleteTemplate(session.username, t.id, session.userType);
                                    refreshTemplates();
                                    showToast("Template Deleted", 'info');
                                    soundService.playVoid();
                                 }
                              }} className="text-red-900 hover:text-red-500 p-1"><Icons.Trash/></button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      )}

      {/* EDITOR MODAL */}
      {isEditorOpen && editingTemplate && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
            <div className="h-16 border-b border-gold-900 flex items-center justify-between px-6 bg-luxury-panel shrink-0">
               <div className="flex items-center gap-4 overflow-hidden"><span className="text-gold-500 font-bold hidden sm:inline">{UI_TEXT.editor.title}</span><input className="bg-black border border-zinc-800 text-gold-100 px-2 py-1 focus:border-gold-500 outline-none w-32 md:w-64" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} /></div>
               <div className="flex items-center gap-2 md:gap-4">
                 <div className="hidden md:flex items-center gap-2 bg-black/30 p-1 border border-zinc-800 rounded">
                    <span className="text-[10px] text-purple-400 pl-2">{UI_TEXT.editor.aiLabel}</span>
                    <input className="bg-transparent text-white text-xs outline-none w-24" placeholder={UI_TEXT.editor.aiPlaceholder} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                    <select className="bg-black text-gold-400 text-[10px] border border-zinc-800 h-6 outline-none focus:border-gold-500 cursor-pointer" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}><option value="Easy">EASY</option><option value="Medium">MED</option><option value="Hard">HARD</option><option value="Expert">EXPT</option></select>
                    <Button variant="secondary" className="py-0 h-6 text-[10px]" onClick={handleAi} disabled={isGenerating}>{isGenerating ? '...' : UI_TEXT.editor.aiButton}</Button>
                 </div>
                 <Button variant="secondary" onClick={() => { setIsEditorOpen(false); setEditingTemplate(null); soundService.playClick(); }}>{UI_TEXT.editor.cancel}</Button>
                 <Button variant="primary" onClick={() => { 
                   if(session && editingTemplate) { 
                     const saved = StorageService.saveTemplate(session.username, editingTemplate, session.userType);
                     if (saved) {
                        refreshTemplates(); 
                        setIsEditorOpen(false);
                        showToast("Show Saved Successfully", 'success');
                        soundService.playAward();
                     } else {
                        showToast("Failed to save (Limit Reached or Denied)", 'error');
                        soundService.playVoid();
                     }
                   }
                 }}>{UI_TEXT.editor.save}</Button>
               </div>
            </div>
            <div className="flex-1 overflow-auto p-4 grid gap-4 custom-scrollbar" style={{ gridTemplateColumns: `repeat(${editingTemplate.cols}, minmax(200px, 1fr))` }}>
               {editingTemplate.categories.map((c, ci) => (
                 <div key={c.id} className="flex flex-col gap-2 pb-10">
                    <input className="bg-luxury-dark border border-gold-900 text-center text-gold-300 font-bold py-2" value={c.name} onChange={e => { const nc = [...editingTemplate.categories]; nc[ci].name = e.target.value; setEditingTemplate({...editingTemplate, categories: nc}); }} />
                    {c.questions.map((q, qi) => (
                      <div key={q.id} className={`bg-luxury-panel border p-2 flex flex-col gap-1 ${q.isDoubleOrNothing ? 'border-red-900/50 bg-red-900/10' : 'border-zinc-900'}`}>
                        <div className="flex justify-between items-center text-[10px] text-zinc-500">
                          <span>{q.points}</span>
                          <button onClick={() => { const nc = [...editingTemplate.categories]; nc[ci].questions[qi].isDoubleOrNothing = !nc[ci].questions[qi].isDoubleOrNothing; setEditingTemplate({...editingTemplate, categories: nc}); }} className={`px-1 py-1 rounded border whitespace-normal text-[8px] leading-tight h-auto ${q.isDoubleOrNothing ? 'text-red-500 border-red-500' : 'text-zinc-700 border-zinc-800 hover:text-zinc-400'}`}>{q.isDoubleOrNothing ? UI_TEXT.common.doubleOrNothing : 'NORMAL'}</button>
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

      {/* SETUP MODAL */}
      {isSetupOpen && (
           <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-4xl bg-luxury-panel border border-gold-600 shadow-glow-strong flex flex-col md:flex-row rounded-sm overflow-hidden animate-in fade-in zoom-in duration-300">
                 <div className="md:w-1/3 p-8 border-r border-gold-900/50 flex flex-col gap-8 bg-gradient-to-br from-luxury-dark to-black">
                    <h2 className="text-xl font-serif text-gold-400 tracking-widest border-b border-gold-800 pb-2">{UI_TEXT.setup.title}</h2>
                    <div className="space-y-4">
                       <div>
                          <label className="text-xs text-zinc-500 font-bold tracking-widest block mb-2">{UI_TEXT.setup.colsLabel}</label>
                          <div className="flex items-center gap-4">
                            <Button variant="secondary" onClick={() => setSetupConfig(p => ({...p, columns: Math.max(1, p.columns - 1)}))}>-</Button>
                            <span className="text-2xl font-mono text-gold-100 w-8 text-center">{setupConfig.columns}</span>
                            <Button variant="secondary" onClick={() => setSetupConfig(p => ({...p, columns: Math.min(8, p.columns + 1)}))}>+</Button>
                          </div>
                        </div>
                       <div><label className="text-xs text-zinc-500 font-bold tracking-widest block mb-2">{UI_TEXT.setup.rowsLabel}</label><div className="flex items-center gap-4"><Button variant="secondary" onClick={() => setSetupConfig(p => ({...p, rows: Math.max(1, p.rows - 1)}))}>-</Button><span className="text-2xl font-mono text-gold-100 w-8 text-center">{setupConfig.rows}</span><Button variant="secondary" onClick={() => setSetupConfig(p => ({...p, rows: Math.min(10, p.rows + 1)}))}>+</Button></div><p className="text-[9px] text-zinc-600 mt-2">{UI_TEXT.setup.rowsHelper}</p></div>
                    </div>
                    <div className="mt-auto flex flex-col gap-3"><Button variant="primary" onClick={handleCreateFromSetup} className="py-4 text-base">{UI_TEXT.setup.button}</Button><Button variant="ghost" onClick={() => setIsSetupOpen(false)}>{UI_TEXT.setup.cancel}</Button></div>
                 </div>
                 <div className="hidden md:flex md:w-2/3 p-8 bg-black flex-col items-center justify-center relative">
                    <span className="absolute top-4 right-4 text-[10px] text-zinc-600 uppercase tracking-widest">PREVIEW</span>
                    <div className="w-full max-w-lg aspect-square flex gap-1 justify-center p-4 border border-zinc-800 rounded">
                       {Array(setupConfig.columns).fill(0).map((_, i) => (<div key={i} className="flex flex-col gap-1 w-full max-w-[60px]"><div className="h-8 bg-gold-900/30 border border-gold-900 flex items-center justify-center"><span className="text-[6px] text-gold-700">CAT</span></div><div className="flex-1 flex flex-col gap-1">{Array(setupConfig.rows).fill(0).map((_, j) => (<div key={j} className="flex-1 bg-zinc-900 border border-zinc-800 flex items-center justify-center"><span className="text-[6px] text-zinc-700">{Math.min((j+1)*100, 1000)}</span></div>))}</div></div>))}
                    </div>
                 </div>
              </div>
           </div>
      )}

      {view === 'GAME' && (
        <div className="h-dvh flex flex-col bg-luxury-black">
           <div className="flex-1 flex overflow-hidden">
             <SafeGameBoard 
               gameState={gameState} 
               activeMobileTab={activeMobileTab} 
               selectQuestion={() => {}} 
               setActiveMobileTab={setActiveMobileTab} 
             />
             {!isDirectorPoppedOut && (
               <DirectorPanel 
                 gameState={gameState} 
                 setGameState={setGameState} 
                 className="w-96 border-l border-gold-900/50"
                 openDetached={() => setIsDirectorPoppedOut(true)}
               />
             )}
           </div>
           {isDirectorPoppedOut && (
             <DirectorPlaceholder onBringBack={() => setIsDirectorPoppedOut(false)} className="absolute bottom-4 right-4 w-64 rounded shadow-xl" />
           )}
           <button onClick={() => setView('DASHBOARD')} className="absolute top-2 right-2 text-zinc-500 text-xs hover:text-white">EXIT</button>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <CruzPhamTriviaApp />
      </ToastProvider>
    </ErrorBoundary>
  );
}
