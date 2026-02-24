import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Circle, 
  Triangle, 
  Square, 
  RotateCcw, 
  Trophy, 
  User,
  Hash
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Constants ---
const GRID_SIZE = 7;
const WIN_LENGTH = 4;
const PLAYERS = [
  { id: 1, name: 'Player 1', symbol: 'X', color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500', icon: X },
  { id: 2, name: 'Player 2', symbol: 'O', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', icon: Circle },
  { id: 3, name: 'Player 3', symbol: 'Y', color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', icon: Triangle },
  { id: 4, name: 'Player 4', symbol: 'S', color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', icon: Square },
];

type PlayerId = 1 | 2 | 3 | 4 | null;

export default function App() {
  const [grid, setGrid] = useState<PlayerId[]>(Array(GRID_SIZE * GRID_SIZE).fill(null));
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState<PlayerId | 'draw'>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });

  const currentPlayer = PLAYERS[currentPlayerIndex];

  const checkWinner = useCallback((newGrid: PlayerId[]) => {
    const lines: number[][] = [];

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c <= GRID_SIZE - WIN_LENGTH; c++) {
        lines.push(Array.from({ length: WIN_LENGTH }, (_, i) => r * GRID_SIZE + c + i));
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r <= GRID_SIZE - WIN_LENGTH; r++) {
        lines.push(Array.from({ length: WIN_LENGTH }, (_, i) => (r + i) * GRID_SIZE + c));
      }
    }

    // Diagonal (top-left to bottom-right)
    for (let r = 0; r <= GRID_SIZE - WIN_LENGTH; r++) {
      for (let c = 0; c <= GRID_SIZE - WIN_LENGTH; c++) {
        lines.push(Array.from({ length: WIN_LENGTH }, (_, i) => (r + i) * GRID_SIZE + (c + i)));
      }
    }

    // Diagonal (top-right to bottom-left)
    for (let r = 0; r <= GRID_SIZE - WIN_LENGTH; r++) {
      for (let c = WIN_LENGTH - 1; c < GRID_SIZE; c++) {
        lines.push(Array.from({ length: WIN_LENGTH }, (_, i) => (r + i) * GRID_SIZE + (c - i)));
      }
    }

    for (const line of lines) {
      const first = newGrid[line[0]];
      if (first && line.every(index => newGrid[index] === first)) {
        return { winner: first, line };
      }
    }

    if (newGrid.every(cell => cell !== null)) {
      return { winner: 'draw' as const, line: [] };
    }

    return null;
  }, []);

  const handleCellClick = (index: number) => {
    if (grid[index] || winner) return;

    const newGrid = [...grid];
    newGrid[index] = currentPlayer.id as PlayerId;
    setGrid(newGrid);

    const result = checkWinner(newGrid);
    if (result) {
      if (result.winner !== 'draw') {
        setWinner(result.winner);
        setWinningLine(result.line);
        setScores(prev => ({ ...prev, [result.winner as number]: prev[result.winner as number] + 1 }));
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [PLAYERS[(result.winner as number) - 1].bg.replace('bg-', '')]
        });
      } else {
        setWinner('draw');
      }
    } else {
      setCurrentPlayerIndex((prev) => (prev + 1) % PLAYERS.length);
    }
  };

  const resetGame = () => {
    setGrid(Array(GRID_SIZE * GRID_SIZE).fill(null));
    setWinner(null);
    setWinningLine([]);
    setCurrentPlayerIndex(0);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-2xl mb-8 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <div className="bg-slate-900 p-2 rounded-xl shadow-lg">
            <Hash className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Quad-Tac-Toe</h1>
        </motion.div>
        <p className="text-slate-500 font-medium">Connect 4 symbols in a row to win!</p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-start">
        
        {/* Player Stats - Left */}
        <div className="flex flex-col gap-4 order-2 lg:order-1">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Players</h2>
          {PLAYERS.slice(0, 2).map((player, idx) => (
            <PlayerCard 
              key={player.id} 
              player={player} 
              score={scores[player.id]} 
              isActive={!winner && currentPlayerIndex === idx}
              isWinner={winner === player.id}
            />
          ))}
        </div>

        {/* Game Board - Center */}
        <div className="flex flex-col items-center order-1 lg:order-2">
          <div className="relative bg-white p-4 rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100">
            <div 
              className="grid gap-2" 
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: 'min(85vw, 450px)',
                height: 'min(85vw, 450px)'
              }}
            >
              {grid.map((cell, i) => (
                <Cell 
                  key={i} 
                  value={cell} 
                  onClick={() => handleCellClick(i)} 
                  isWinningCell={winningLine.includes(i)}
                  disabled={!!winner}
                />
              ))}
            </div>

            {/* Overlay for Win/Draw */}
            <AnimatePresence>
              {winner && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-[2rem]"
                >
                  <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center text-center">
                    {winner === 'draw' ? (
                      <>
                        <RotateCcw className="w-12 h-12 text-slate-400 mb-4" />
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">It's a Draw!</h2>
                        <p className="text-slate-500 mb-6">Everyone played well.</p>
                      </>
                    ) : (
                      <>
                        <Trophy className={`w-16 h-16 ${PLAYERS[(winner as number) - 1].color} mb-4`} />
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                          {PLAYERS[(winner as number) - 1].name} Wins!
                        </h2>
                        <p className="text-slate-500 mb-6">Masterful strategy!</p>
                      </>
                    )}
                    <button 
                      onClick={resetGame}
                      className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Play Again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Current Turn Indicator (Mobile/Tablet) */}
          {!winner && (
            <motion.div 
              layout
              className="mt-6 lg:hidden flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-md border border-slate-100"
            >
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Turn:</span>
              <div className={`flex items-center gap-2 ${currentPlayer.color} font-bold`}>
                <currentPlayer.icon className="w-5 h-5" />
                {currentPlayer.name}
              </div>
            </motion.div>
          )}

          <button 
            onClick={resetGame}
            className="mt-8 text-slate-400 hover:text-slate-600 font-medium flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Board
          </button>
        </div>

        {/* Player Stats - Right */}
        <div className="flex flex-col gap-4 order-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2 lg:text-right">Players</h2>
          {PLAYERS.slice(2, 4).map((player, idx) => (
            <PlayerCard 
              key={player.id} 
              player={player} 
              score={scores[player.id]} 
              isActive={!winner && currentPlayerIndex === idx + 2}
              isWinner={winner === player.id}
              alignRight
            />
          ))}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-auto pt-12 text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">
        Local Multiplayer • 7x7 Grid • Connect 4
      </footer>
    </div>
  );
}

interface PlayerCardProps {
  key?: React.Key;
  player: typeof PLAYERS[0];
  score: number;
  isActive: boolean;
  isWinner: boolean;
  alignRight?: boolean;
}

function PlayerCard({ 
  player, 
  score, 
  isActive, 
  isWinner,
  alignRight = false 
}: PlayerCardProps) {
  return (
    <motion.div 
      animate={{ 
        scale: isActive ? 1.05 : 1,
        opacity: isActive || isWinner ? 1 : 0.6
      }}
      className={`
        relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
        ${isActive ? `${player.border} bg-white shadow-lg` : 'border-transparent bg-slate-100'}
        ${isWinner ? 'ring-4 ring-offset-2 ring-yellow-400' : ''}
        ${alignRight ? 'flex-row-reverse text-right' : ''}
      `}
    >
      <div className={`p-3 rounded-xl ${player.bg} text-white shadow-inner`}>
        <player.icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-900">{player.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Score</span>
          <span className="text-lg font-black text-slate-900 leading-none">{score}</span>
        </div>
      </div>
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className={`absolute ${alignRight ? '-left-2' : '-right-2'} w-4 h-4 ${player.bg} rounded-full border-4 border-white shadow-sm`}
        />
      )}
    </motion.div>
  );
}

interface CellProps {
  key?: React.Key;
  value: PlayerId;
  onClick: () => void;
  isWinningCell: boolean;
  disabled: boolean;
}

function Cell({ 
  value, 
  onClick, 
  isWinningCell,
  disabled
}: CellProps) {
  const player = value ? PLAYERS[value - 1] : null;
  const Icon = player?.icon;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !!value}
      className={`
        relative flex items-center justify-center rounded-xl transition-all duration-200
        ${!value && !disabled ? 'bg-slate-50 hover:bg-slate-100 cursor-pointer active:scale-95' : 'bg-white'}
        ${isWinningCell ? `${player?.bg} shadow-lg z-10` : 'border border-slate-100'}
      `}
    >
      <AnimatePresence mode="wait">
        {Icon && (
          <motion.div
            key={value}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`${isWinningCell ? 'text-white' : player?.color}`}
          >
            <Icon className="w-2/3 h-2/3 mx-auto" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
