import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shift, Sale, Goals, Level } from '../types';
import { PROJECTS } from '../constants';
import { ShoppingBag, TrendingUp, Clock, LogIn, LogOut, CheckCircle2, Sparkles, Target, Flame, Trophy, X, ArrowUpRight, ArrowDownRight, Sun, Moon, Edit2, Trash2, UserPlus, TrendingUp as TrendingUpIcon, Plus, Minus, AlertTriangle, Ghost, Crown, Star } from 'lucide-react';
import Confetti from 'react-confetti';

interface RegistrationProps {
  onSaveShift: (shift: Shift) => void;
  onSaveSale: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void; 
  onUpdateSale: (sale: Sale) => void; 
  currentSales: Sale[];
  shifts: Shift[];
  editingShift: Shift | null;
  goals: Goals;
  onUpdateGoals: (g: Goals) => void;
  userRole?: string;
  userId?: string;
  dailyBounty?: { task: string, reward: string } | null;
}

// --- GAMIFICATION LEVELS ---
const LEVELS: Level[] = [
    { id: 1, min: 0, max: 10000, title: "Upphitun", color: "bg-slate-500" },
    { id: 2, min: 10000, max: 20000, title: "Meðbyr", color: "bg-indigo-500" },
    { id: 3, min: 20000, max: 30000, title: "Á Eldi", color: "bg-amber-500" },
    { id: 4, min: 30000, max: 50000, title: "Goðsögn", color: "bg-emerald-500" },
    { id: 5, min: 50000, max: 999999, title: "Óstöðvandi", color: "bg-rose-500" },
];

const Registration: React.FC<RegistrationProps> = ({ 
  onSaveShift, onSaveSale, onDeleteSale, onUpdateSale, currentSales, shifts, editingShift, goals, onUpdateGoals, dailyBounty 
}) => {
  const [now, setNow] = useState(new Date());
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  
  // Gamification States
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInterceptor, setShowInterceptor] = useState(false);
  const [interceptorMsg, setInterceptorMsg] = useState("");
  
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [tempGoal, setTempGoal] = useState(goals.daily.toString());

  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [editProject, setEditProject] = useState(PROJECTS[0]);
  const [editType, setEditType] = useState<'new' | 'upgrade'>('new');

  const [liveHours, setLiveHours] = useState({ day: 0, evening: 0 });

  const [saleType, setSaleType] = useState<'new' | 'upgrade'>('new');
  const [saleData, setSaleData] = useState({ amount: 0, project: PROJECTS[0] });

  // --- Helpers ---
  const getRoundedTime = useCallback((date: Date) => {
    const coeff = 1000 * 60 * 15; 
    return new Date(Math.round(date.getTime() / coeff) * coeff);
  }, []);

  const calculateShiftSplit = useCallback((start: Date, end: Date) => {
    const isWeekend = start.getDay() === 0 || start.getDay() === 6;
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours <= 0) return { day: 0, evening: 0 };
    if (isWeekend) return { day: 0, evening: diffHours };
    const hourOfDay = end.getHours();
    if (hourOfDay >= 17) {
        const eveningPart = Math.max(0, hourOfDay - 17 + (end.getMinutes()/60));
        const dayPart = Math.max(0, diffHours - eveningPart);
        return { day: dayPart, evening: eveningPart };
    }
    return { day: diffHours, evening: 0 };
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    const storedStart = localStorage.getItem('takk_shift_start');
    if (storedStart) {
      const parsedStart = new Date(storedStart);
      setClockInTime(parsedStart);
      const current = new Date();
      setLiveHours(calculateShiftSplit(getRoundedTime(parsedStart), getRoundedTime(current)));
    }
    setTempGoal(goals.daily.toString());
  }, [getRoundedTime, calculateShiftSplit, goals.daily]);

  useEffect(() => {
    if (editingSale) {
        setEditAmount(editingSale.amount);
        setEditProject(editingSale.project);
        setEditType(editingSale.saleType || 'new');
    }
  }, [editingSale]);

  useEffect(() => {
    const updateTime = () => {
      const current = new Date();
      setNow(current);
      if (clockInTime) {
        setLiveHours(calculateShiftSplit(getRoundedTime(clockInTime), getRoundedTime(current)));
      } else {
        setLiveHours({ day: 0, evening: 0 });
      }
    };
    updateTime(); 
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, [clockInTime, getRoundedTime, calculateShiftSplit]);

  useEffect(() => {
    if (notification) {
        const notifTimer = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(notifTimer);
    }
  }, [notification]);

  // --- Data Calculations ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = useMemo(() => currentSales.filter(s => s.date === todayStr), [currentSales, todayStr]);
  const totalSalesToday = useMemo(() => todaySales.reduce((acc, s) => acc + s.amount, 0), [todaySales]);
  const newSalesCount = useMemo(() => todaySales.filter(s => s.saleType !== 'upgrade').length, [todaySales]);
  const upgradeSalesCount = useMemo(() => todaySales.filter(s => s.saleType === 'upgrade').length, [todaySales]);

  const { avgSalesPerHour, avgShiftLength } = useMemo(() => {
    if (shifts.length === 0) return { avgSalesPerHour: 0, avgShiftLength: 4 }; 
    const totalHistorySales = shifts.reduce((acc, s) => acc + s.totalSales, 0);
    const totalHistoryHours = shifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
    return { 
        avgSalesPerHour: totalHistoryHours > 0 ? totalHistorySales / totalHistoryHours : 0, 
        avgShiftLength: totalHistoryHours / shifts.length 
    };
  }, [shifts]);

  const currentStreak = useMemo(() => {
    const uniqueDates = Array.from(new Set(shifts.map(s => s.date))).sort().reverse();
    return Math.max(1, uniqueDates.length > 5 ? 5 : uniqueDates.length);
  }, [shifts]);

  const currentShiftDuration = liveHours.day + liveHours.evening;
  const hoursRemaining = Math.max(0, avgShiftLength - currentShiftDuration);
  const rawProjection = totalSalesToday + (avgSalesPerHour * hoursRemaining);
  const projectedFinal = Math.round(rawProjection / 100) * 100;

  // --- GAMIFICATION LOGIC ---
  const currentLevel = LEVELS.find(l => totalSalesToday >= l.min && totalSalesToday < l.max) || LEVELS[LEVELS.length - 1];
  const nextLevel = LEVELS.find(l => l.id === currentLevel.id + 1);
  const distToNextLevel = nextLevel ? nextLevel.min - totalSalesToday : 0;

  // Ghost Racer Logic (Compare vs Average at this hour)
  const currentHour = now.getHours();
  const ghostTarget = avgSalesPerHour * (Math.max(0, currentHour - 10)); 
  const isWinningGhost = totalSalesToday > ghostTarget;

  // Check if Bounty Complete
  const isBountyComplete = useMemo(() => {
      if (!dailyBounty) return false;
      // Simple logic for the MVP demo based on the string text
      if (dailyBounty.task.includes("30.000") && totalSalesToday >= 30000) return true;
      if (dailyBounty.task.includes("Nýir") && newSalesCount >= 3) return true;
      if (dailyBounty.task.includes("5.000") && todaySales.some(s => s.amount >= 5000)) return true;
      return false;
  }, [dailyBounty, totalSalesToday, newSalesCount, todaySales]);

  // --- Actions ---
  const handleClockClick = () => {
    if (clockInTime) {
        // Interceptor: Check break/end thresholds
        if (nextLevel && distToNextLevel > 0 && distToNextLevel <= 2000) {
            setInterceptorMsg(`Bíddu! Þú ert aðeins ${formatISK(distToNextLevel)} frá því að ná ${nextLevel.title}! Eina sölu í viðbót?`);
            setShowInterceptor(true);
            return;
        }
        processClockOut();
    } else {
        setShowGoalInput(true);
    }
  };

  const confirmClockIn = () => {
    const newGoal = parseInt(tempGoal) || goals.daily;
    onUpdateGoals({ ...goals, daily: newGoal });
    const start = getRoundedTime(new Date());
    setClockInTime(start);
    localStorage.setItem('takk_shift_start', start.toISOString());
    setNotification({ msg: `Markmið sett: ${formatISK(newGoal)}. Gangi þér vel!`, type: 'success' });
    setShowGoalInput(false);
    setLiveHours({ day: 0, evening: 0 });
  };

  const processClockOut = () => {
    const endTime = getRoundedTime(new Date());
    const startTime = getRoundedTime(clockInTime!);
    const finalHours = calculateShiftSplit(startTime, endTime);
    onSaveShift({
        id: Math.random().toString(36).substr(2, 9),
        date: startTime.toISOString().split('T')[0],
        dayHours: parseFloat(finalHours.day.toFixed(2)),
        eveningHours: parseFloat(finalHours.evening.toFixed(2)),
        totalSales: totalSalesToday,
        notes: '',
        projectName: 'Other',
        userId: '' 
    });
    setClockInTime(null);
    setShowInterceptor(false);
    localStorage.removeItem('takk_shift_start');
    setLiveHours({ day: 0, evening: 0 });
    setNotification({ msg: `Vakt vistuð! (${(finalHours.day + finalHours.evening).toFixed(2)} klst)`, type: 'success' });
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleData.amount <= 0) return;
    
    // CONFETTI JUICE
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    onSaveSale({
      id: Math.random().toString(36).substr(2, 9),
      date: todayStr,
      timestamp: new Date().toISOString(),
      amount: saleData.amount,
      project: saleData.project,
      saleType: saleType,
      userId: '' 
    });
    setSaleData({ ...saleData, amount: 0 });
    setNotification({ msg: "Sölu bætt við!", type: 'success' });
  };

  const handleUpdate = () => {
    if (editingSale && editAmount > 0) {
        onUpdateSale({ ...editingSale, amount: editAmount, project: editProject, saleType: editType });
        setEditingSale(null);
        setNotification({ msg: "Færsla uppfærð!", type: 'success' });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Ertu viss um að þú viljir eyða þessari færslu?")) {
        onDeleteSale(id);
        setNotification({ msg: "Færslu eytt.", type: 'info' });
    }
  };

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));

  const progressPercent = Math.min(100, (totalSalesToday / goals.daily) * 100);
  const remainingAmount = Math.max(0, goals.daily - totalSalesToday);
  const requiredSpeed = remainingAmount / Math.max(0.5, hoursRemaining); 
  const averageShiftSales = avgSalesPerHour * avgShiftLength; 
  const performanceDiff = totalSalesToday - averageShiftSales;
  const performancePercent = averageShiftSales > 0 ? (performanceDiff / averageShiftSales) * 100 : 0;
  const isPerformingWell = performanceDiff >= 0;

  const isMobile = window.innerWidth < 1024;

  return (
    <div className={`space-y-6 max-w-7xl mx-auto pb-20 relative animate-in fade-in duration-500 ${isMobile ? 'pb-32' : ''}`}>
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

      {/* --- INTERCEPTOR MODAL --- */}
      {showInterceptor && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95">
            <div className="w-full max-w-sm text-center">
                <div className="p-4 bg-amber-500/20 rounded-full w-fit mx-auto mb-6 text-amber-400 animate-bounce">
                    <AlertTriangle size={48} />
                </div>
                <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4">Bíddu aðeins!</h3>
                <p className="text-lg font-bold text-slate-300 mb-8 leading-relaxed">{interceptorMsg}</p>
                <div className="space-y-3">
                    <button onClick={() => setShowInterceptor(false)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white font-black uppercase text-sm shadow-xl active:scale-95 transition-all">
                        Ég tek eina í viðbót! 🚀
                    </button>
                    <button onClick={processClockOut} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-slate-400 font-bold uppercase text-xs">
                        Nei, ég þarf að fara
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- BOUNTY CARD (Universal) --- */}
      {dailyBounty && (
        <div className={`glass p-4 rounded-2xl border transition-all flex items-center justify-between mb-4 ${isBountyComplete ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50' : 'border-indigo-500/30 bg-indigo-500/10'}`}>
            <div className="flex items-center gap-3">
                {isBountyComplete ? <Crown className="text-amber-400" size={24} /> : <Target className="text-indigo-400" size={20} />}
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isBountyComplete ? 'text-amber-400' : 'text-indigo-400'}`}>
                        {isBountyComplete ? "BOUNTY COMPLETED!" : "Dagsverkefni"}
                    </p>
                    <p className={`text-sm font-bold ${isBountyComplete ? 'text-white line-through opacity-80' : 'text-white'}`}>{dailyBounty.task}</p>
                </div>
            </div>
            <span className={`text-xs font-black text-white px-2 py-1 rounded-lg ${isBountyComplete ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-indigo-500'}`}>{dailyBounty.reward}</span>
        </div>
      )}

      {/* --- MOBILE LAYOUT --- */}
      {isMobile ? (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div><h2 className="text-2xl font-black text-white uppercase italic">Söluskráning</h2><p className="text-xs text-slate-500 font-bold uppercase">{todaySales.length} færslur í dag</p></div>
                <button onClick={handleClockClick} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${clockInTime ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{clockInTime ? "Pása / Út" : "Skrá inn"}</button>
            </div>

            {/* LEVEL BAR (Mobile) */}
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                <div 
                    className={`h-full ${currentLevel.color} transition-all duration-1000 ease-out`} 
                    style={{ width: `${nextLevel ? ((totalSalesToday - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100}%` }} 
                />
            </div>
            {nextLevel && <p className="text-[10px] text-center text-slate-400 font-bold -mt-2 mb-4">Vantar {formatISK(distToNextLevel)} í {nextLevel.title}</p>}

            {/* QUICK ADD CARD */}
            <div className={`glass p-6 rounded-[32px] border-indigo-500/20 shadow-2xl relative overflow-hidden ${currentStreak > 3 ? 'border-amber-500/50 shadow-amber-500/20' : ''}`}>
                {currentStreak > 3 && <div className="absolute inset-0 bg-amber-500/5 animate-pulse pointer-events-none" />}
                
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 custom-scrollbar">
                    {PROJECTS.map(p => (
                        <button key={p} onClick={() => setSaleData({...saleData, project: p})} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${saleData.project === p ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}>{p}</button>
                    ))}
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                    <button onClick={() => setSaleType('new')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase ${saleType === 'new' ? 'bg-indigo-500 text-white' : 'text-slate-500'}`}>Nýr</button>
                    <button onClick={() => setSaleType('upgrade')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase ${saleType === 'upgrade' ? 'bg-amber-500 text-slate-900' : 'text-slate-500'}`}>Hækkun</button>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setSaleData(d => ({...d, amount: Math.max(0, d.amount - 500)}))} className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all border border-white/5"><Minus size={24} /></button>
                    <div className="text-center"><span className="text-4xl font-black text-white tracking-tighter">{saleData.amount}</span><span className="text-xs font-bold text-slate-500 block uppercase">Krónur</span></div>
                    <button onClick={() => setSaleData(d => ({...d, amount: d.amount + 500}))} className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all border border-white/5"><Plus size={24} /></button>
                </div>

                <button onClick={handleAddSale} className="w-full py-4 gradient-bg rounded-2xl text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Staðfesta Sölu</button>
            </div>

            {/* GHOST RACER (Mobile) */}
            <div className="glass p-4 rounded-[24px] border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Ghost size={20} className={isWinningGhost ? "text-emerald-400" : "text-rose-400"} />
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ghost Racer</p>
                        <p className={`text-xs font-bold ${isWinningGhost ? "text-emerald-400" : "text-rose-400"}`}>
                            {isWinningGhost ? `+${formatISK(totalSalesToday - ghostTarget)}` : `-${formatISK(ghostTarget - totalSalesToday)}`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Nýlegt</h4>
                {todaySales.slice().reverse().map(s => (
                    <div key={s.id} className="glass p-4 rounded-2xl border-white/5 flex justify-between items-center">
                        <div><p className="font-bold text-white text-sm">{s.project}</p><p className="text-[10px] text-slate-500">{new Date(s.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p></div>
                        <div className="text-right"><p className="font-black text-white">{formatISK(s.amount)}</p>{s.saleType === 'upgrade' && <span className="text-[8px] text-amber-400 font-bold uppercase">Hækkun</span>}</div>
                    </div>
                ))}
            </div>
        </div>
      ) : (
        // --- DESKTOP LAYOUT ---
        <>
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                <div><h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Skráning</h2><p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-1">{clockInTime ? 'Vakt í gangi - Gangi þér vel!' : 'Byrjaðu vaktina'}</p></div>
                <button onClick={handleClockClick} className={`w-full md:w-auto px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${clockInTime ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>{clockInTime ? <LogOut size={20} /> : <LogIn size={20} />}{clockInTime ? "Skrá út" : "Skrá inn"}</button>
            </div>
            
            {/* METRICS ROW (Desktop) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
               <div className="glass p-5 rounded-[32px] border-white/10 relative overflow-hidden"><div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tímar í dag</p><div className={`p-1 rounded-full ${clockInTime ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-white/10 text-slate-500'}`}><Clock size={12} /></div></div><div className="flex items-baseline gap-3 mt-1"><div className="flex items-center gap-1"><Sun size={12} className="text-indigo-400" /><span className="text-lg font-black text-white">{liveHours.day.toFixed(1)}</span></div><div className="flex items-center gap-1"><Moon size={12} className="text-violet-400" /><span className="text-lg font-black text-white">{liveHours.evening.toFixed(1)}</span></div></div></div>
               <div className="glass p-5 rounded-[32px] border-indigo-500/10"><div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sala dagsins</p><div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400"><Sparkles size={12} /></div></div><p className="text-xl font-black text-white">{formatISK(totalSalesToday)}</p></div>
               <div className="glass p-5 rounded-[32px] border-emerald-500/10"><div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Meðaltal / klst</p><div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400"><TrendingUp size={12} /></div></div><p className="text-xl font-black text-emerald-400">{formatISK(avgSalesPerHour)}</p></div>
               <div className="glass p-5 rounded-[32px] border-violet-500/10"><div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Fjöldi sala</p><div className="p-1 rounded-full bg-violet-500/20 text-violet-400"><Target size={12} /></div></div><p className="text-xl font-black text-violet-400 mb-1">{todaySales.length}</p></div>
               <div className="glass p-5 rounded-[32px] border-indigo-500/20 relative overflow-hidden"><div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Áætluð lokasala</p></div><p className="text-xl font-black text-indigo-400">{formatISK(projectedFinal)}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-8 md:p-10 rounded-[40px] border-white/10 flex flex-col shadow-2xl relative h-full">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                    {PROJECTS.map(p => (<button key={p} onClick={() => setSaleData({...saleData, project: p})} className={`p-4 rounded-2xl border text-[10px] font-black transition-all ${saleData.project === p ? 'gradient-bg text-white border-white/20 shadow-lg scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}>{p}</button>))}
                    </div>
                    <form onSubmit={handleAddSale} className="relative max-w-2xl mx-auto"><input type="number" required placeholder="0 kr." value={saleData.amount || ''} onChange={e => setSaleData({...saleData, amount: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 p-8 rounded-[32px] text-5xl font-black text-white outline-none focus:ring-4 focus:ring-indigo-500/20 pr-40 text-center placeholder:text-white/10" /><button type="submit" className="absolute right-4 top-4 bottom-4 px-8 gradient-bg rounded-[24px] text-white font-black uppercase text-sm shadow-xl hover:scale-105 transition-all active:scale-95">Bæta við</button></form>
                    <div className="mt-12 pt-8 border-t border-white/5"><h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Nýlegar færslur í dag</h4><div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">{todaySales.slice().reverse().map(s => (<div key={s.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5"><div className="flex items-center gap-3"><div className={`h-2 w-2 rounded-full ${s.saleType === 'upgrade' ? 'bg-amber-500' : 'bg-indigo-500'}`} /><div className="flex flex-col"><span className="font-black text-white text-xs">{s.project}</span><span className="text-[9px] text-slate-500">{new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div><div className="flex items-center gap-4"><span className="font-black text-white text-sm">{formatISK(s.amount)}</span><button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"><Trash2 size={14} /></button></div></div>))}</div></div>
                </div>

                {/* Right Column - Desktop Gamification */}
                <div className="flex flex-col gap-6 lg:col-span-1 h-full">
                    {/* LEVEL BAR (Desktop) */}
                    <div className="glass p-6 rounded-[32px] border-white/10 relative overflow-hidden">
                        <div className="flex justify-between items-end mb-2"><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Núverandi Level</p><h3 className={`text-2xl font-black text-white ${currentLevel.color.replace('bg-', 'text-')}`}>{currentLevel.title}</h3></div><div className="text-right"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Næsta Level</p><p className="text-sm font-bold text-white">{nextLevel ? nextLevel.title : "MAX"}</p></div></div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${currentLevel.color} transition-all duration-1000 ease-out`} style={{ width: `${nextLevel ? ((totalSalesToday - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100}%` }} /></div>
                    </div>

                    <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col items-center justify-center relative overflow-hidden group flex-grow">
                        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                            <svg className="absolute w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                                <circle cx="80" cy="80" r="70" stroke={progressPercent >= 100 ? "#10b981" : "#6366f1"} strokeWidth="12" fill="none" strokeDasharray="440" strokeDashoffset={440 - (440 * progressPercent) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="text-center"><span className="text-3xl font-black text-white">{Math.round(progressPercent)}%</span><p className="text-[10px] font-bold text-slate-500 uppercase">af markmiði</p></div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5"><Target size={14} className="text-slate-400" /><span className="text-xs font-black text-slate-300">{formatISK(goals.daily)} kr.</span></div>
                    </div>

                    <div className={`glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent flex-grow ${currentStreak > 3 ? 'border-amber-500/30' : ''}`}>
                        <div className="flex justify-between items-start mb-4"><div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400"><Flame size={24} className={currentStreak > 1 ? "animate-pulse" : ""} /></div><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Streak</span></div>
                        <div><h3 className="text-5xl font-black text-white tracking-tighter mb-1">{currentStreak}</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight mb-6">Vaktir í röð <br/><span className="text-amber-400">Haltu áfram!</span></p><div className="flex gap-2">{[...Array(5)].map((_, i) => (<div key={i} className={`h-2 flex-1 rounded-full transition-all ${i < currentStreak ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`} />))}</div></div>
                    </div>
                </div>
            </div>
        </>
      )}

      {/* EDIT & GOAL MODALS (Preserved) */}
      {showGoalInput && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl">
            <div className="w-full max-w-sm"><h3 className="text-2xl font-black text-white text-center mb-6">Dagsmarkmið?</h3><input type="number" value={tempGoal} onChange={e => setTempGoal(e.target.value)} className="w-full bg-white/10 p-4 rounded-2xl text-center text-white font-black text-3xl mb-6 outline-none focus:ring-2 focus:ring-emerald-500" /><button onClick={confirmClockIn} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase">Byrja</button></div>
        </div>
      )}
    </div>
  );
};

export default Registration;
