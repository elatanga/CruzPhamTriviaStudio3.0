
import React from 'react';
import { useGame } from './GameContext';

const NotificationOverlay: React.FC = () => {
  const { state, dispatch } = useGame();
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-2 pointer-events-none">
      {state.notifications.map(n => (
        <div key={n.id} className="bg-black/80 border border-[#d4af37]/30 text-[#d4af37] px-6 py-3 rounded-full text-[10px] uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-2">
          {n.message}
        </div>
      ))}
    </div>
  );
};
export default NotificationOverlay;
