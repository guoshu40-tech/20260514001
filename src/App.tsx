/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Settings, 
  Hash, 
  Send, 
  Gamepad2, 
  TrendingUp,
  AlertCircle,
  History,
  Target,
  Lightbulb,
  Zap,
  ChevronRight
} from 'lucide-react';

// --- Types ---
type Difficulty = 'easy' | 'medium' | 'hard' | 'custom';
type GameMode = 'solo' | 'pvp' | 'cpu';
type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

interface GuessRecord {
  value: number;
  type: 'high' | 'low' | 'correct';
  lowAfter: number;
  highAfter: number;
  playerNum?: 1 | 2 | 'cpu';
}

interface MatchRecord {
  date: string;
  mode: GameMode;
  difficulty: Difficulty;
  winner: string;
  p1Attempts: number;
  p2Attempts?: number;
}

interface DifficultyConfig {
  min: number;
  max: number;
  attempts: number;
}

const DIFFICULTY_PRESETS: Record<Exclude<Difficulty, 'custom'>, DifficultyConfig> = {
  easy: { min: 1, max: 50, attempts: 10 },
  medium: { min: 1, max: 100, attempts: 7 },
  hard: { min: 1, max: 200, attempts: 5 },
};

const calculateRecommendedAttempts = (range: number) => {
  return Math.max(1, Math.ceil(Math.log2(range)));
};

// --- Components ---

// --- Components ---

/**
 * 背景裝飾元件：增加可愛與夢幻感
 */
const FloatingShapes = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <motion.div 
      animate={{ 
        y: [0, -40, 0], 
        rotate: [0, 90, 0],
        scale: [1, 1.2, 1] 
      }} 
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[5%] left-[10%] text-6xl opacity-20"
    >
      ✨
    </motion.div>
    <motion.div 
      animate={{ 
        y: [0, 50, 0], 
        rotate: [0, -60, 0],
        scale: [1, 1.3, 1] 
      }} 
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[10%] right-[5%] text-8xl opacity-15"
    >
      🌈
    </motion.div>
    <motion.div 
      animate={{ 
        x: [-20, 20, -20],
        y: [0, -30, 0]
      }} 
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[40%] right-[15%] text-5xl opacity-20"
    >
      🎈
    </motion.div>
    <motion.div 
      animate={{ 
        scale: [1, 1.5, 1],
        opacity: [0.1, 0.3, 0.1]
      }} 
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[20%] left-[25%] w-24 h-24 bg-pink-300 rounded-full blur-3xl"
    />
    <motion.div 
      animate={{ 
        scale: [1.2, 0.8, 1.2],
        opacity: [0.1, 0.2, 0.1]
      }} 
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[20%] left-[10%] w-40 h-40 bg-purple-300 rounded-full blur-3xl"
    />
  </div>
);

/**
 * 數線元件：視覺化顯示目前可能的範圍
 */
const VisualRange = ({ min, max, currentLow, currentHigh, history }: { 
  min: number; max: number; currentLow: number; currentHigh: number; history: GuessRecord[];
}) => {
  const range = max - min;
  const lowPercent = ((currentLow - min) / range) * 100;
  const highPercent = ((currentHigh - min) / range) * 100;
  
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        <span className="bg-slate-100 px-2 py-0.5 rounded-md">{min}</span>
        <span className="text-indigo-400 animate-pulse">狹縫搜尋中</span>
        <span className="bg-slate-100 px-2 py-0.5 rounded-md">{max}</span>
      </div>
      <div className="h-10 bg-pink-100 rounded-[24px] relative overflow-hidden p-2 shadow-inner border-[3px] border-pink-200">
        <div className="absolute inset-x-0 h-full bg-white/40 rounded-full" />
        
        {/* Past Guesses Markers */}
        {history.map((record, i) => {
          const pos = ((record.value - min) / range) * 100;
          return (
            <motion.div 
              key={`marker-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute top-0 bottom-0 w-2 z-10 rounded-full border-2 border-white shadow-sm transition-all ${
                record.playerNum === 1 ? 'bg-sky-400' : 
                record.playerNum === 2 ? 'bg-pink-400' :
                record.playerNum === 'cpu' ? 'bg-amber-400' : 'bg-slate-300'
              }`}
              style={{ left: `${pos}%` }}
            />
          );
        })}

        <motion.div 
          initial={false}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          animate={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
          className="absolute top-1 bottom-1 bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400 rounded-full shadow-lg z-0"
        />
      </div>
      <div className="flex justify-between text-xs font-black text-indigo-600 px-2">
        <motion.span 
          layout
          transition={{ type: "spring", stiffness: 300 }}
          animate={{ x: `${(currentLow - min) / range * 10}%` }} // Subtle relative offset
        >
          {currentLow}
        </motion.span>
        <motion.span 
          layout
          transition={{ type: "spring", stiffness: 300 }}
        >
          {currentHigh}
        </motion.span>
      </div>
    </div>
  );
};

export default function App() {
  // 遊戲配置
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [customMin, setCustomMin] = useState(1);
  const [customMax, setCustomMax] = useState(1000);
  
  // 遊戲核心狀態
  const [status, setStatus] = useState<GameStatus>('idle');
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [rangeConfig, setRangeConfig] = useState<DifficultyConfig>(DIFFICULTY_PRESETS.medium);
  const [currentLow, setCurrentLow] = useState(1);
  const [currentHigh, setCurrentHigh] = useState(100);
  
  // 玩家行為與回合控制
  const [guess, setGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [feedback, setFeedback] = useState<string>('');
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | 'cpu' | null>(null);
  const [isCpuThinking, setIsCpuThinking] = useState(false);
  
  // 統計數據
  const [stats, setStats] = useState({
    bestScore: Infinity,
    totalGames: 0,
    totalAttempts: 0,
    gamesWon: 0,
    pvpWins: { p1: 0, p2: 0 },
    cpuWins: { player: 0, cpu: 0 },
    matches: [] as MatchRecord[]
  });

  useEffect(() => {
    const savedStats = localStorage.getItem('num-game-v4-stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setStats(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('num-game-v4-stats', JSON.stringify(stats));
  }, [stats]);

  // 初始化遊戲
  const startGame = useCallback(() => {
    let config = difficulty === 'custom' 
      ? { min: customMin, max: customMax, attempts: calculateRecommendedAttempts(customMax - customMin + 1) }
      : DIFFICULTY_PRESETS[difficulty];
    
    setRangeConfig(config);
    const randomNum = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    setTargetNumber(randomNum);
    setCurrentLow(config.min);
    setCurrentHigh(config.max);
    setAttempts(0);
    setHistory([]);
    setWinner(null);
    setCurrentPlayer(1);
    setFeedback(gameMode === 'solo' ? '輸入一個數字開始吧！' : '玩家 1 先手。');
    setStatus('playing');
    setGuess('');
    setShowSuggestion(false);
  }, [difficulty, customMin, customMax, gameMode]);

  // 電腦自動猜測邏輯
  const performCPUTurn = useCallback((low: number, high: number, currentHistory: GuessRecord[]) => {
    const cpuGuess = Math.floor((low + high) / 2);
    const isWin = cpuGuess === targetNumber;
    
    let nextLow = low;
    let nextHigh = high;
    let type: 'high' | 'low' | 'correct';

    if (isWin) {
      type = 'correct';
    } else if (cpuGuess < targetNumber) {
      nextLow = Math.max(low, cpuGuess + 1);
      type = 'low';
    } else {
      nextHigh = Math.min(high, cpuGuess - 1);
      type = 'high';
    }

    const newRecord: GuessRecord = { 
      value: cpuGuess, 
      type, 
      lowAfter: nextLow, 
      highAfter: nextHigh,
      playerNum: 'cpu' 
    };

    return { cpuGuess, isWin, newRecord, nextLow, nextHigh };
  }, [targetNumber]);

  // 處理猜測邏輯
  const handleGuess = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (status !== 'playing') return;
    
    const numGuess = parseInt(guess);
    if (isNaN(numGuess) || numGuess < rangeConfig.min || numGuess > rangeConfig.max) {
      setFeedback(`嘿！範圍是 ${rangeConfig.min} 到 ${rangeConfig.max} 哦。`);
      return;
    }

    const newAttempts = attempts + 1;
    let isGameOver = false;
    let currentMatchWinner: 1 | 2 | 'cpu' | null = null;

    if (numGuess === targetNumber) {
      const newHistory = [{ value: numGuess, type: 'correct' as const, lowAfter: currentLow, highAfter: currentHigh, playerNum: currentPlayer }, ...history];
      setHistory(newHistory);
      setWinner(currentPlayer);
      currentMatchWinner = currentPlayer;
      isGameOver = true;
      setStatus('won');
      
      setStats(prev => {
        const newMatch: MatchRecord = {
          date: new Date().toISOString(),
          mode: gameMode,
          difficulty,
          winner: `Player ${currentPlayer}`,
          p1Attempts: currentPlayer === 1 ? newAttempts : attempts,
          p2Attempts: currentPlayer === 2 ? newAttempts : (gameMode === 'pvp' ? attempts : undefined)
        };
        return {
          ...prev,
          totalGames: prev.totalGames + 1,
          gamesWon: gameMode === 'solo' ? prev.gamesWon + 1 : prev.gamesWon,
          totalAttempts: prev.totalAttempts + newAttempts,
          bestScore: gameMode === 'solo' ? Math.min(prev.bestScore, newAttempts) : prev.bestScore,
          pvpWins: gameMode === 'pvp' ? {
            p1: prev.pvpWins.p1 + (currentPlayer === 1 ? 1 : 0),
            p2: prev.pvpWins.p2 + (currentPlayer === 2 ? 1 : 0)
          } : prev.pvpWins,
          cpuWins: gameMode === 'cpu' ? {
            ...prev.cpuWins,
            player: prev.cpuWins.player + 1
          } : prev.cpuWins,
          matches: [newMatch, ...prev.matches].slice(0, 50)
        };
      });
    } else {
      let nextLow = currentLow;
      let nextHigh = currentHigh;
      let type: 'high' | 'low';

      if (numGuess < targetNumber) {
        setFeedback(gameMode === 'solo' ? '太小了！往上看 ↗️' : `玩家 ${currentPlayer} 猜 ${numGuess} 太小了 ↗️`);
        nextLow = Math.max(currentLow, numGuess + 1);
        setCurrentLow(nextLow);
        type = 'low';
      } else {
        setFeedback(gameMode === 'solo' ? '太大了！往下找 ↘️' : `玩家 ${currentPlayer} 猜 ${numGuess} 太大了 ↘️`);
        nextHigh = Math.min(currentHigh, numGuess - 1);
        setCurrentHigh(nextHigh);
        type = 'high';
      }

      const newHistory = [{ value: numGuess, type, lowAfter: nextLow, highAfter: nextHigh, playerNum: currentPlayer }, ...history];
      setHistory(newHistory);

      if (newAttempts >= (gameMode === 'solo' ? rangeConfig.attempts : rangeConfig.attempts * 2)) {
        setStatus('lost');
        isGameOver = true;
        setStats(prev => ({
          ...prev,
          totalGames: prev.totalGames + 1,
          totalAttempts: prev.totalAttempts + newAttempts
        }));
      } else if (gameMode === 'pvp') {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        setAttempts(newAttempts);
      } else if (gameMode === 'cpu') {
        setCurrentPlayer(2);
        setAttempts(newAttempts);
      } else {
        setAttempts(newAttempts);
      }
    }
    setGuess('');
  };

  // 監聽並執行電腦回合
  useEffect(() => {
    if (gameMode === 'cpu' && currentPlayer === 2 && status === 'playing') {
      setIsCpuThinking(true);
      const timer = setTimeout(() => {
        const cpuResult = performCPUTurn(currentLow, currentHigh, history);
        
        if (cpuResult.isWin) {
          setHistory(prev => [cpuResult.newRecord, ...prev]);
          setWinner('cpu');
          setStatus('lost');
          setStats(prev => ({
            ...prev,
            totalGames: prev.totalGames + 1,
            cpuWins: { ...prev.cpuWins, cpu: prev.cpuWins.cpu + 1 },
            matches: [{
              date: new Date().toISOString(),
              mode: 'cpu',
              difficulty,
              winner: 'CPU',
              p1Attempts: attempts
            }, ...prev.matches].slice(0, 50)
          }));
        } else {
          setHistory(prev => [cpuResult.newRecord, ...prev]);
          setCurrentLow(cpuResult.nextLow);
          setCurrentHigh(cpuResult.nextHigh);
          setAttempts(prev => prev + 1);
          setCurrentPlayer(1);
          setFeedback(`電腦猜 ${cpuResult.cpuGuess}，太 ${cpuResult.newRecord.type === 'high' ? '大' : '小'} 了！換你猜。`);
        }
        setIsCpuThinking(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [gameMode, currentPlayer, status, currentLow, currentHigh, history, performCPUTurn, attempts, difficulty]);

  const remaining = rangeConfig.attempts - attempts;
  const suggestedGuess = Math.floor((currentLow + currentHigh) / 2);
  const optimalAttempts = Math.ceil(Math.log2(rangeConfig.max - rangeConfig.min + 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500 text-white selection:bg-pink-100 selection:text-pink-600 font-sans p-6 overflow-x-hidden relative">
      <FloatingShapes />
      
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 lg:gap-12 items-start justify-center py-12 relative z-10">
        
        {/* Branding and Stats */}
        <aside className="w-full md:w-80 space-y-8 sticky top-12">
          <motion.div
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <h1 className="text-8xl font-black tracking-tighter leading-none mb-2 select-none italic tracking-[-0.05em] uppercase drop-shadow-lg text-yellow-300">#NO</h1>
            <p className="text-white font-black uppercase tracking-[0.3em] bg-indigo-600/30 px-3 py-1 rounded-full text-[10px] inline-block">Logical Mystery v5.0 ✨</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl">
              <div className="text-[10px] font-black text-indigo-200 uppercase mb-1">最佳分數</div>
              <div className="text-3xl font-black leading-none">{stats.bestScore === Infinity ? '-' : stats.bestScore}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl">
              <div className="text-[10px] font-black text-indigo-200 uppercase mb-1">勝場/對戰銷量</div>
              <div className="text-3xl font-black leading-none">{stats.gamesWon}</div>
            </div>
          </div>

          <div className="p-6 bg-white/10 backdrop-blur-3xl rounded-[32px] border border-white/20 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-yellow-400 animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">對戰紀錄與統計</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs items-center p-3 bg-white/5 rounded-2xl">
                <span className="opacity-70 font-bold uppercase tracking-tighter">PvP 勝場 (P1 / P2)</span>
                <span className="font-black text-lg text-indigo-300">{stats.pvpWins.p1} : {stats.pvpWins.p2}</span>
              </div>
              <div className="flex justify-between text-xs items-center p-3 bg-white/5 rounded-2xl">
                <span className="opacity-70 font-bold uppercase tracking-tighter">vs CPU (Player / AI)</span>
                <span className="font-black text-lg text-pink-300">{stats.cpuWins.player} : {stats.cpuWins.cpu}</span>
              </div>
              <div className="h-px bg-white/10 mx-2" />
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.matches.map((match, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex justify-between text-[10px] p-2 bg-gradient-to-r from-white/5 to-transparent rounded-xl border border-white/5"
                  >
                    <span className="font-black text-indigo-300 tracking-tighter">{match.mode.toUpperCase()}</span>
                    <span className="opacity-60 font-bold">👑 {match.winner}</span>
                  </motion.div>
                ))}
                {stats.matches.length === 0 && <div className="text-[10px] opacity-40 text-center py-2 italic">尚無對戰紀錄</div>}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {status === 'idle' ? (
              <motion.div 
                key="start-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="bg-white rounded-[48px] p-10 lg:p-12 shadow-2xl text-slate-900 border-[12px] border-white/20"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-indigo-50 rounded-3xl mb-4">
                    <Target className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h2 className="text-4xl font-black mb-3 italic tracking-tight">選擇戰場</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">在這個充滿邏輯的數字世界裡，挑戰你的大腦極限。</p>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">遊戲模式</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['solo', 'pvp', 'cpu'] as GameMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setGameMode(m)}
                          className={`p-4 rounded-3xl text-sm font-black uppercase transition-all border-4 ${
                            gameMode === m 
                              ? 'bg-indigo-600 text-white border-indigo-200 shadow-lg' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-100'
                          }`}
                        >
                          {m === 'solo' && '單人'}
                          {m === 'pvp' && '雙人'}
                          {m === 'cpu' && '對抗電腦'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">難度設定</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {(['easy', 'medium', 'hard', 'custom'] as Difficulty[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                            difficulty === d 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="my-8">
                  {difficulty === 'custom' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-4 mb-8 p-6 bg-slate-50 rounded-3xl border-2 border-slate-200"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">最小值</label>
                          <input type="number" value={customMin} onChange={e => setCustomMin(Number(e.target.value))} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">最大值</label>
                          <input type="number" value={customMax} onChange={e => setCustomMax(Number(e.target.value))} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <button 
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-2xl font-black py-6 rounded-3xl shadow-[0_10px_0_rgb(55,48,163)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                >
                  開始對決 <Send className="w-6 h-6" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="game-screen"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-[56px] p-8 md:p-14 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] text-slate-900 border-[16px] border-white/20 relative">
                  {status !== 'playing' && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className={`absolute inset-0 z-50 rounded-[40px] backdrop-blur-xl flex flex-col p-12 overflow-y-auto ${
                        status === 'won' ? 'bg-indigo-600/95' : 'bg-red-600/95'
                      }`}
                    >
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-white mb-8">
                        <motion.div 
                          initial={{ scale: 0, rotate: -45 }} 
                          animate={{ scale: 1, rotate: 0 }} 
                          transition={{ type: "spring", damping: 12 }}
                          className="bg-white p-8 rounded-[40px] mb-8 shadow-2xl"
                        >
                          {status === 'won' ? <Trophy className="w-20 h-20 text-indigo-600" /> : <AlertCircle className="w-20 h-20 text-red-600" />}
                        </motion.div>
                        <h2 className="text-6xl font-black mb-4 tracking-tighter italic uppercase">{status === 'won' ? 'Bingo!' : 'Oops!'}</h2>
                        <p className="text-white/80 font-bold mb-8 text-xl">
                          {gameMode === 'solo' 
                            ? (status === 'won' ? `完美！你在第 ${attempts} 次猜中了。` : `可惜！答案是 ${targetNumber}。`)
                            : (winner === 'cpu' ? '電腦贏了！AI 的邏輯戰勝了一切。' : `恭喜 Player ${winner} 獲得勝利！`)
                          }
                        </p>

                        {/* Strategy Analysis */}
                        <div className="w-full max-w-sm bg-black/20 rounded-3xl p-6 text-left border border-white/10 space-y-4 mb-8">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">戰局總結</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="opacity-70">最後數值</span>
                              <span className="font-bold">{targetNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="opacity-70">總嘗試回合</span>
                              <span className="font-bold">{attempts} 次</span>
                            </div>
                            <div className="h-px bg-white/10 my-2" />
                            <p className="text-xs italic opacity-80 leading-relaxed">
                              {gameMode === 'pvp' 
                                ? "這是一場精彩的博弈，縮減範圍的時機是關鍵。" 
                                : gameMode === 'cpu' 
                                ? (winner === 1 ? "你擊敗了 AI！這是人類智慧的勝利。" : "下次試著每次都猜範圍正中心，那是 AI 的秘訣。")
                                : "根據統計學，二分搜尋法能在 log2(N) 次內完成任務。"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setStatus('idle')}
                        className="bg-white text-slate-900 px-12 py-5 rounded-3xl text-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-6 h-6" /> 返回首頁
                      </button>
                    </motion.div>
                  )}

                  <div className="flex justify-between items-end mb-8 border-b-2 border-slate-100 pb-6">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">模式 / 難度</div>
                      <div className="font-black text-xl text-indigo-600 uppercase leading-none">
                        {gameMode} · {difficulty}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {gameMode === 'solo' ? '剩餘次數' : '回合進度'}
                      </div>
                      <div className={`text-4xl font-black tabular-nums transition-colors ${gameMode === 'solo' && remaining <= 1 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                        {gameMode === 'solo' ? remaining : `${attempts + 1}/${rangeConfig.attempts * 2}`}
                      </div>
                    </div>
                  </div>

                  {gameMode !== 'solo' && (
                    <div className="mb-8 flex gap-4">
                      <div className={`flex-1 p-5 rounded-[32px] border-4 transition-all flex items-center justify-between ${currentPlayer === 1 ? 'bg-sky-400 text-white border-sky-200 shadow-xl' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                        <div className="flex flex-col">
                          <span className="font-black text-[10px] uppercase opacity-70 tracking-widest">Player 1</span>
                          <span className="font-black text-sm">你的回合 🫧</span>
                        </div>
                        {currentPlayer === 1 && !isCpuThinking && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                      <div className={`flex-1 p-5 rounded-[32px] border-4 transition-all flex items-center justify-between ${
                        gameMode === 'cpu' 
                        ? (currentPlayer === 2 ? 'bg-amber-400 text-white border-amber-200 shadow-xl' : 'bg-slate-50 border-slate-100 opacity-40')
                        : (currentPlayer === 2 ? 'bg-pink-400 text-white border-pink-200 shadow-xl' : 'bg-slate-50 border-slate-100 opacity-40')
                      }`}>
                        <div className="flex flex-col">
                          <span className="font-black text-[10px] uppercase opacity-70 tracking-widest">{gameMode === 'cpu' ? 'Mimi Bot (AI)' : 'Player 2'}</span>
                          <span className="font-black text-sm">
                            {isCpuThinking ? '正在思考 💭' : (currentPlayer === 2 ? '正在決策 🍭' : '休息中')}
                          </span>
                        </div>
                        {isCpuThinking && (
                          <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="w-5 h-5 border-3 border-white/40 border-t-white rounded-full"
                          />
                        )}
                        {currentPlayer === 2 && !isCpuThinking && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="w-3 h-3 bg-white rounded-full" />}
                      </div>
                    </div>
                  )}

                  <div className="mb-12">
                    <VisualRange 
                      min={rangeConfig.min} 
                      max={rangeConfig.max} 
                      currentLow={currentLow} 
                      currentHigh={currentHigh} 
                      history={history}
                    />
                  </div>

                  <div className={`w-full mb-10 rounded-[40px] p-10 flex flex-col items-center justify-center gap-3 border-[6px] transition-all relative ${
                    feedback.includes('大') ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-xl' : 
                    feedback.includes('小') ? 'bg-sky-50 border-sky-100 text-sky-500 shadow-xl' : 'bg-white border-indigo-50 shadow-lg text-indigo-700'
                  }`}>
                    {/* Decorative bubble tail */}
                    <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rotate-45 border-r-[6px] border-b-[6px] rounded-md ${
                      feedback.includes('大') ? 'bg-rose-50 border-rose-100' : 
                      feedback.includes('小') ? 'bg-sky-50 border-sky-100' : 'bg-white border-indigo-50'
                    }`} />
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={feedback}
                        initial={{ opacity: 0, y: 15, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="text-center"
                      >
                        <p className="text-4xl font-black italic tracking-tighter drop-shadow-sm">
                          {feedback} {feedback.includes('大') ? '🍭' : feedback.includes('小') ? '🎈' : '✨'}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="space-y-4">
                    <form onSubmit={handleGuess} className="relative">
                      <input 
                        type="number" 
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        placeholder="猜數字..."
                        disabled={status !== 'playing'}
                        autoFocus
                        className="w-full text-center py-8 text-6xl font-black rounded-[32px] bg-slate-50 border-4 border-slate-200 text-indigo-600 focus:border-indigo-500 focus:outline-none transition-all shadow-inner"
                      />
                      <div className="absolute -top-5 -right-5 bg-pink-500 text-white w-16 h-16 rounded-full flex flex-col items-center justify-center font-black shadow-xl border-[6px] border-white ring-4 ring-pink-100">
                        <span className="text-[10px] leading-none">NO.</span>
                        <span className="text-2xl leading-none">{attempts + 1}</span>
                      </div>
                    </form>

                    <div className="flex gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleGuess()}
                        disabled={status !== 'playing' || !guess}
                        className="flex-1 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-white text-3xl font-black py-8 rounded-[40px] shadow-[0_15px_0_rgba(190,24,93,0.3)] active:translate-y-2 active:shadow-none disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                      >
                        發射猜測! <Send className="w-8 h-8" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowSuggestion(!showSuggestion)}
                        className={`px-8 py-7 rounded-[32px] font-black transition-all border-4 flex items-center gap-2 ${
                          showSuggestion ? 'bg-amber-100 border-amber-200 text-amber-700 shadow-inner' : 'bg-white border-slate-200 text-slate-300 hover:text-amber-500 hover:border-amber-200 hover:shadow-xl'
                        }`}
                      >
                        <Lightbulb className="w-7 h-7" />
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {showSuggestion && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col items-center gap-3"
                        >
                          <div className="flex items-center gap-2 text-amber-800">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-black uppercase tracking-wider">最佳策略建議數字</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-4xl font-black text-amber-600 tabular-nums">{suggestedGuess}</span>
                            <button 
                              onClick={() => { setGuess(suggestedGuess.toString()); setShowSuggestion(false); }}
                              className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg active:scale-95 transition-transform"
                            >
                              帶入輸入框
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-indigo-100">
                    <History className="w-5 h-5 opacity-40" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">歷史足跡與範圍縮減</span>
                    <div className="h-px bg-white/20 flex-1"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {history.map((record, idx) => (
                        <motion.div
                          key={`${record.value}-${history.length - idx}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-lg border-2 ${
                              record.playerNum === 1 ? 'bg-indigo-600 border-indigo-400' :
                              record.playerNum === 2 ? 'bg-pink-500 border-pink-400' :
                              record.playerNum === 'cpu' ? 'bg-slate-900 border-slate-700' : 'bg-slate-500 border-slate-400'
                            }`}>
                              <span className="text-[8px] leading-none opacity-60">
                                {record.playerNum === 'cpu' ? 'AI' : `P${record.playerNum}`}
                              </span>
                              {record.value}
                            </div>
                            <div>
                                <div className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                                   record.type === 'correct' ? 'text-green-400' : 
                                   record.type === 'high' ? 'text-red-400' : 'text-blue-400'
                                }`}>
                                    {record.type === 'correct' ? '命中！' : record.type === 'high' ? '太大了' : '太小了'}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    <span className="opacity-40">範圍</span>
                                    <ChevronRight className="w-3 h-3 opacity-20" />
                                    <span className="text-white/80">{record.lowAfter} ~ {record.highAfter}</span>
                                </div>
                            </div>
                          </div>
                          <div className="text-[10px] font-black bg-white/10 px-2 py-1 rounded-md opacity-40">
                            #{history.length - idx}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {history.length === 0 && (
                      <div className="text-white/20 italic font-medium">還在等待你的第一發...</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

