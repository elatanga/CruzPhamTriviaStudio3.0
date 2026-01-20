
import React, { useEffect, useState } from 'react';
import { useGame } from './GameContext';

const QuestionView: React.FC = () => {
  const { state, dispatch, playSound, log } = useGame();
  const { activeTemplate, activeQuestionId, isAnswerRevealed, timer, isTimerRunning } = state;

  if (!activeTemplate || !activeQuestionId) return null;

  // Find the question data
  let questionData: any = null;
  let catIndex = -1;
  let qIndex = -1;

  activeTemplate.categories.forEach((cat, cIdx) => {
    cat.questions.forEach((q, qIdx) => {
      if (q.id === activeQuestionId) {
        questionData = { ...q, categoryTitle: cat.title };
        catIndex = cIdx;
        qIndex = qIdx;
      }
    });
  });

  if (!questionData) return null;

  // Play select sound on mount
  useEffect(() => {
    playSound('select');
    log(`Opened ${questionData.categoryTitle} for ${questionData.points}`);
  }, []); // Run once on mount

  // Play reveal sound when answer is revealed
  useEffect(() => {
    if (isAnswerRevealed) {
        playSound('reveal');
        log(`Answer Revealed: ${questionData.answer}`);
    }
  }, [isAnswerRevealed]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      dispatch({ type: 'REVEAL_ANSWER', payload: !isAnswerRevealed });
    }
    if (e.code === 'Escape') {
       dispatch({ type: 'SET_ACTIVE_QUESTION', payload: null });
    }
    if (e.code === 'KeyT') {
        dispatch({ type: 'TOGGLE_TIMER', payload: !isTimerRunning });
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerRevealed, isTimerRunning]);

  const handleStatus = (status: 'completed' | 'void') => {
    dispatch({ type: 'MARK_QUESTION_STATUS', payload: { categoryIndex: catIndex, questionIndex: qIndex, status } });
    log(`Question marked as ${status}`);
    // If marking as completed (correct), maybe award points to active player? 
    // For now, keep it manual via scoreboard to avoid accidental attribution.
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300">
       {/* Timer */}
       <div className="absolute top-6 right-6 flex items-center gap-4">
          <div className={`text-4xl font-mono font-bold ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-[#d4af37]'}`}>
            {timer}
          </div>
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_TIMER', payload: !isTimerRunning })}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
             {isTimerRunning ? (
                 <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
             ) : (
                 <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
             )}
          </button>
       </div>

       <div className="absolute top-8 left-0 w-full text-center">
          <h3 className="text-[#d4af37] font-black uppercase tracking-[0.3em] text-sm md:text-xl drop-shadow-2xl">
            {questionData.categoryTitle} • {questionData.points}
          </h3>
       </div>

       <div className="max-w-6xl w-full text-center space-y-12 flex flex-col items-center">
          {/* Media Content */}
          {questionData.type === 'image' && questionData.mediaUrl && (
              <div className="w-full max-w-2xl h-64 md:h-80 relative rounded-2xl overflow-hidden border border-[#d4af37]/30 shadow-2xl mb-8">
                  <img src={questionData.mediaUrl} alt="Clue" className="w-full h-full object-cover" />
              </div>
          )}
          
          {questionData.type === 'audio' && questionData.mediaUrl && (
              <div className="w-full max-w-md bg-white/5 p-6 rounded-2xl border border-[#d4af37]/30 mb-8">
                  <div className="text-[#d4af37] text-xs uppercase tracking-widest mb-4 font-bold">Audio Clue</div>
                  <audio controls src={questionData.mediaUrl} className="w-full" />
              </div>
          )}

          <div className="min-h-[15vh] flex items-center justify-center">
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-display font-bold text-white leading-tight drop-shadow-lg max-w-5xl">
                {questionData.prompt}
            </h1>
          </div>

          <div className={`transition-all duration-700 transform ${isAnswerRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             <div className="inline-block relative">
                <div className="absolute inset-0 bg-[#d4af37] blur-3xl opacity-20 rounded-full"></div>
                <h2 className="relative text-2xl md:text-4xl lg:text-5xl font-display font-bold text-[#d4af37] bg-black/50 border border-[#d4af37]/30 px-12 py-6 rounded-2xl backdrop-blur-md">
                    {questionData.answer}
                </h2>
             </div>
          </div>
       </div>

       <div className="absolute bottom-12 flex items-center gap-8">
          <button 
             onClick={() => handleStatus('void')}
             className="px-8 py-4 rounded-full border border-white/10 text-white/40 hover:bg-white/10 hover:text-white uppercase tracking-widest text-xs font-bold transition-all"
          >
             VOID TILE
          </button>
          
          <button 
             onClick={() => dispatch({ type: 'REVEAL_ANSWER', payload: !isAnswerRevealed })}
             className="px-12 py-6 bg-[#d4af37] text-black font-black rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform uppercase tracking-[0.3em] text-sm"
          >
             {isAnswerRevealed ? 'Hide Answer' : 'Reveal Answer'}
          </button>

          <button 
             onClick={() => handleStatus('completed')}
             className="px-8 py-4 rounded-full border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-all"
          >
             Mark Done
          </button>
       </div>

       <div className="absolute top-8 right-24 text-white/20 text-[10px] uppercase tracking-widest font-mono hidden md:block">
          [T] Timer • [SPACE] Reveal • [ESC] Close
       </div>
    </div>
  );
};

export default QuestionView;
