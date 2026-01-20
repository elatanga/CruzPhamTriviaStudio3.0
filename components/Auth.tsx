
import React, { useState } from 'react';
import { useGame } from './GameContext';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, googleProvider, signInWithPopup } from '../firebase';

const Auth: React.FC = () => {
  const { dispatch, notify } = useGame();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth!, email, password);
        notify('success', 'Identity Verified');
      } else {
        const res = await createUserWithEmailAndPassword(auth!, email, password);
        if (res.user) await updateProfile(res.user, { displayName: email.split('@')[0] });
        notify('success', 'Vault Created');
      }
      dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      await signInWithPopup(auth!, googleProvider);
      dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
    } catch (err: any) {
      notify('error', 'Google Protocol Failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-2">
         <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tighter">
           {isLogin ? 'Access Terminal' : 'Initialize Protocol'}
         </h2>
         <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.4em] font-black">
           Secure Environment
         </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="OPERATOR EMAIL" 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xs text-white placeholder:text-white/20 focus:border-[#d4af37] outline-none transition-all uppercase tracking-widest"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="ACCESS KEY" 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xs text-white placeholder:text-white/20 focus:border-[#d4af37] outline-none transition-all uppercase tracking-widest"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button 
            disabled={loading}
            className="w-full bg-[#d4af37] text-black font-black py-4 rounded-xl hover:bg-white transition-all uppercase tracking-[0.3em] text-[10px] disabled:opacity-50"
          >
            {loading ? 'Verifying...' : (isLogin ? 'Authorize' : 'Register')}
          </button>
        </form>

        <div className="flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-[8px] text-white/20 uppercase tracking-widest">OR</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <button 
          onClick={googleLogin}
          className="w-full border border-white/10 text-white/50 font-bold py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all uppercase tracking-[0.2em] text-[9px]"
        >
          Google Identity
        </button>

        <p className="text-center text-[9px] text-white/30 uppercase tracking-widest cursor-pointer hover:text-[#d4af37]" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Create New Account' : 'Return to Login'}
        </p>
      </div>
    </div>
  );
};

export default Auth;
