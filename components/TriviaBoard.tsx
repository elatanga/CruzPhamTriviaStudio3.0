
import React, { useMemo } from 'react';
import { useGame } from './GameContext';

const TriviaBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { activeTemplate } = state;

  // Compute layout metrics
  const layout = useMemo(() => {
    if (!activeTemplate) return null;

    const colCount = activeTemplate.categories.length;
    // Calculate max rows based on the category with most questions to ensure grid integrity
    // Default to at least 5 rows if empty, limit visual impact
    const maxQuestions = Math.max(...activeTemplate.categories.map(c => c.questions.length), 0);
    const rowCount = Math.max(maxQuestions, 5);

    return { colCount, rowCount };
  }, [activeTemplate]);

  if (!activeTemplate || !layout) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="text-white/30 uppercase tracking-widest animate-pulse font-mono text-xs">Waiting for Production Data...</div>
        </div>
    );
  }

  const { colCount, rowCount } = layout;

  // Dynamic Sizing Logic
  // We determine a "density" factor to scale text and spacing
  const isHighRowDensity = rowCount > 6;
  const isHighColDensity = colCount > 6;
  const isExtremeDensity = rowCount >= 9 || colCount >= 8;

  // Header Height Calculation
  // Shrink header slightly if we have many rows to maximize game board space
  const headerHeightClass = isHighRowDensity 
    ? 'h-14 md:h-20 lg:h-24' 
    : 'h-16 md:h-24 lg:h-28';

  // Tile Text Size Calculation
  const getTileTextSize = () => {
    if (isExtremeDensity) return 'text-sm sm:text-lg md:text-2xl lg:text-3xl';
    if (isHighRowDensity || isHighColDensity) return 'text-lg sm:text-xl md:text-3xl lg:text-4xl';
    return 'text-xl sm:text-2xl md:text-4xl lg:text-5xl';
  };
  const tileTextSize = getTileTextSize();

  // Category Title Size
  const getHeaderTitleSize = () => {
    if (colCount > 8) return 'text-[7px] sm:text-[9px] md:text-[10px]';
    if (colCount > 5) return 'text-[8px] sm:text-[10px] md:text-xs';
    return 'text-[10px] sm:text-xs md:text-sm lg:text-base tracking-widest';
  };
  const headerTitleSize = getHeaderTitleSize();

  return (
    // Outer container: fills parent, handles safe padding.
    // Reduced padding on small screens/dense layouts to maximize visible board area.
    <div className={`w-full h-full flex items-center justify-center overflow-hidden transition-all duration-500 ${isExtremeDensity ? 'p-1 md:p-2' : 'p-2 md:p-4 lg:p-6'}`}>
      
      {/* Board Frame: The actual game board container */}
      <div className="flex flex-col w-full h-full max-w-[1920px] mx-auto shadow-2xl bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 ring-1 ring-white/5">
        
        {/* Header Row (Categories) */}
        <div className={`flex w-full divide-x divide-white/10 border-b-2 border-white/10 bg-white/[0.03] shrink-0 transition-all duration-300`}>
            {activeTemplate.categories.map((cat) => (
                <div 
                    key={cat.id} 
                    style={{ width: `${100 / colCount}%` }}
                    className={`relative group flex flex-col items-center justify-center p-1 transition-colors hover:bg-white/5 ${headerHeightClass}`}
                >
                    <div className="w-full h-full flex items-center justify-center overflow-hidden px-0.5">
                        <h3 
                            style={{ fontSize: cat.fontSize ? `${cat.fontSize}px` : undefined }}
                            className={`
                                font-black text-[#d4af37] text-center uppercase leading-tight drop-shadow-md break-words w-full line-clamp-3
                                ${headerTitleSize}
                            `}
                        >
                            {cat.title}
                        </h3>
                    </div>
                    {/* Active Accent Line */}
                    <div className="absolute bottom-0 w-4 h-0.5 bg-[#d4af37] rounded-full opacity-30 group-hover:w-1/2 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
                </div>
            ))}
        </div>

        {/* Questions Grid Area */}
        {/* min-h-0 is critical for nested flex scrolling/containment */}
        <div className="flex-1 w-full min-h-0 bg-[#050505] relative">
             <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                    gridTemplateRows: `repeat(${rowCount}, 1fr)`,
                    width: '100%',
                    height: '100%',
                }}
             >
                {/* Render Grid Cells: Row by Row */}
                {Array.from({ length: rowCount }).map((_, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                        {activeTemplate.categories.map((cat, colIndex) => {
                            const q = cat.questions[rowIndex];
                            // Handle cases where a category has fewer questions than others
                            if (!q) {
                                return (
                                    <div key={`empty-${colIndex}-${rowIndex}`} className="border-r border-b border-white/5 bg-black/20" />
                                );
                            }

                            const isCompleted = q.status === 'completed';
                            const isVoid = q.status === 'void';
                            const isInactive = isCompleted || isVoid;
                            const isLastRow = rowIndex === rowCount - 1;
                            const isLastCol = colIndex === colCount - 1;

                            return (
                             <div 
                                key={q.id}
                                className={`
                                    relative w-full h-full
                                    ${!isLastCol && 'border-r border-white/5'}
                                    ${!isLastRow && 'border-b border-white/5'}
                                    // Use minimal padding for dense grids to prevent layout shifts
                                    ${isExtremeDensity ? 'p-0.5' : 'p-1 md:p-2'}
                                `}
                             >
                                <button
                                    onClick={() => !isInactive && dispatch({ type: 'SET_ACTIVE_QUESTION', payload: q.id })}
                                    disabled={isInactive}
                                    className={`
                                        w-full h-full rounded-md md:rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden group
                                        ${isInactive 
                                            ? 'cursor-default' 
                                            : 'hover:bg-[#d4af37]/10 hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] hover:border-[#d4af37]/40 border border-transparent cursor-pointer bg-gradient-to-br from-white/[0.02] to-transparent active:scale-[0.98]'
                                        }
                                    `}
                                >
                                    {isVoid ? (
                                        <span className={`text-white/10 font-mono uppercase tracking-widest -rotate-12 border-2 border-white/10 px-2 py-1 rounded opacity-50 ${isExtremeDensity ? 'text-[6px]' : 'text-[8px] md:text-[10px]'}`}>VOID</span>
                                    ) : !isCompleted ? (
                                        <span className={`
                                            font-display font-bold tracking-tighter transition-all duration-500 text-center leading-none
                                            ${isInactive ? 'opacity-0' : 'gold-gradient drop-shadow-sm group-hover:scale-110 group-hover:brightness-125'}
                                            ${tileTextSize}
                                        `}>
                                            {activeTemplate.settings.currencySymbol}{q.points}
                                        </span>
                                    ) : (
                                        // Completed State - Empty/Subtle
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-[#d4af37]/5 select-none text-2xl md:text-4xl">●</span>
                                        </div>
                                    )}
                                </button>
                             </div>
                            );
                        })}
                    </React.Fragment>
                ))}
             </div>
        </div>

        {/* Footer: Controls & Credits */}
        <div className="h-6 md:h-8 lg:h-10 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-between px-2 md:px-4 shrink-0 transition-all duration-300">
            <div className="flex items-center gap-2 md:gap-4 text-[6px] md:text-[8px] lg:text-[9px] text-white/30 font-mono uppercase tracking-wider overflow-hidden whitespace-nowrap">
               <span className="hidden sm:inline">SHORTCUTS:</span>
               <div className="flex gap-2 md:gap-3">
                   <span title="Select Player">1-8 <span className="text-white/10">PLAYER</span></span>
                   <span title="Adjust Score">+/- <span className="text-white/10">SCORE</span></span>
                   <span title="Fullscreen">F <span className="text-white/10">FULL</span></span>
                   <span title="Reveal Answer" className="hidden lg:inline">SPACE <span className="text-white/10">REVEAL</span></span>
               </div>
            </div>
            <div className="text-[6px] md:text-[8px] lg:text-[9px] text-[#d4af37]/40 uppercase tracking-[0.2em] font-black truncate ml-2">
                Powered by CruzPham
            </div>
        </div>

      </div>
    </div>
  );
};

export default TriviaBoard;
