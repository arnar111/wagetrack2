import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shift, Sale, Goals } from '../types';
import { PROJECTS } from '../constants';
import { ShoppingBag, TrendingUp, Clock, LogIn, LogOut, CheckCircle2, Sparkles, Target, Flame, Trophy, X, ArrowUpRight, ArrowDownRight, Sun, Moon, Edit2, Trash2 } from 'lucide-react';

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
}

const Registration: React.FC<RegistrationProps> = ({ 
  onSaveShift, onSaveSale, onDeleteSale, onUpdateSale, currentSales, shifts, editingShift, goals, onUpdateGoals, userRole 
}) => {
  const [now, setNow] = useState(new Date());
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  
  // Goal Input Modal State
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [tempGoal, setTempGoal] = useState(goals.daily.toString());

  // Editing Sale State
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [editProject, setEditProject] = useState(PROJECTS[0]);

  // Live Hours State
  const [liveHours, setLiveHours] = useState({ day: 0, evening: 0 });

  const [saleData, setSaleData] = useState({
    amount: 0,
    project: PROJECTS[0]
  });

  // --- Helpers (Moved UP so they are available for effects) ---
  const getRoundedTime = useCallback((date: Date) => {
    const coeff = 1000 * 60 * 15; // 15 minutes
    return new Date(Math.round(date.getTime() / coeff) * coeff);
  }, []);

  const calculateShiftSplit = useCallback((start: Date, end: Date) => {
    const isWeekend = start.getDay() === 0 || start.getDay() === 6;
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (diffHours <= 0) return { day: 0, evening: 0 };
    if (isWeekend) return { day: 0, evening: diffHours };

    const hourOfDay = end.getHours();
    // Simple logic: If current time is past 17:00, attribute to evening
    // This is an estimation for the live view
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
      
      // FIX: Force immediate calculation on load
      const current = new Date();
      const roundedNow = getRoundedTime(current);
      const roundedStart = getRoundedTime(parsedStart);
      setLiveHours(calculateShiftSplit(roundedStart, roundedNow));
    }
    setTempGoal(goals.daily.toString());
  }, [getRoundedTime, calculateShiftSplit, goals.daily]);

  // Handle Edit State
  useEffect(() => {
    if (editingSale) {
        setEditAmount(editingSale.amount);
        setEditProject(editingSale.project);
    }
  }, [editingSale]);

  // --- Live Timer (Updates Hours) ---
  useEffect(() => {
    const updateTime = () => {
      const current = new Date();
      setNow(current);

      if (clockInTime) {
        const roundedNow = getRoundedTime(current);
        const roundedStart = getRoundedTime(clockInTime);
        setLiveHours(calculateShiftSplit(roundedStart, roundedNow));
      } else {
        setLiveHours({ day: 0, evening: 0 });
      }
    };

    // Run immediately to prevent 00:00 flash
    updateTime();

    // Then set interval
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, [clockInTime, getRoundedTime, calculateShiftSplit]);

  // --- Notification Auto-Dismiss ---
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
  
  const { avgSalesPerHour } = useMemo(() => {
    if (shifts.length === 0) return { avgSalesPerHour: 0 };
    const totalHistorySales = shifts.reduce((acc, s) => acc + s.totalSales, 0);
    const totalHistoryHours = shifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
    return { avgSalesPerHour: totalHistoryHours > 0 ? totalHistorySales / totalHistoryHours : 0 };
  }, [shifts]);

  // Streak Calculation
  const currentStreak = useMemo(() => {
    const uniqueDates = Array.from(new Set(shifts.map(s => s.date))).sort().reverse();
    let streak = 0;
    if (uniqueDates.length > 0) streak = uniqueDates.length > 5 ? 5 : uniqueDates.length; 
    return Math.max(1, streak); 
  }, [shifts]);

  const currentShiftDuration = liveHours.day + liveHours.evening;
  const hoursRemaining = Math.max(0.5, 4 - currentShiftDuration); 
  const projectedFinal = totalSalesToday + (avgSalesPerHour * hoursRemaining);

  // --- Smart Clock Logic ---
  const handleClockClick = () => {
    if (clockInTime) {
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
    
    // Immediate visual update
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
    localStorage.removeItem('takk_shift_start');
    setLiveHours({ day: 0, evening: 0 });
    setNotification({ msg: `Vakt vistuð! (${(finalHours.day + finalHours.evening).toFixed(2)} klst)`, type: 'success' });
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleData.amount <= 0) return;
    onSaveSale({
      id: Math.random().toString(36).substr(2, 9),
      date: todayStr,
      timestamp: new Date().toISOString(),
      amount: saleData.amount,
      project: saleData.project,
      userId: '' 
    });
    setSaleData({ ...saleData, amount: 0 });
    setNotification({ msg: "Sölu bætt við!", type: 'success' });
  };

  const handleUpdate = () => {
    if (editingSale && editAmount > 0) {
        onUpdateSale({
            ...editingSale,
            amount: editAmount,
            project: editProject
        });
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

  // Visuals
  const progressPercent = Math.min(100, (totalSalesToday / goals.daily) * 100);
  const remainingAmount = Math.max(0, goals.daily - totalSalesToday);
  const requiredSpeed = remainingAmount / Math.max(0.5, hoursRemaining); 

  const averageShiftSales = avgSalesPerHour * 4; 
  const performanceDiff = totalSalesToday - averageShiftSales;
  const performancePercent = averageShiftSales > 0 ? (performanceDiff / averageShiftSales) * 100 : 0;
  const isPerformingWell = performanceDiff >= 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 relative animate-in fade-in duration-500">
      
      {/* --- GOAL INPUT POPUP --- */}
      {showGoalInput && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass p-8 rounded-[40px] w-full max-w-sm border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center relative">
                <button onClick={() => setShowGoalInput(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
                <div className="mb-6 flex justify-center">
                    <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400">
                        <Target size={32} />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Hvað er dagsmarkmiðið?</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Settu þér markmið og rústaðu því!</p>
                <input 
                    type="number" 
                    value={tempGoal} 
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-full bg-black/40 border border-emerald-500/30 p-4 rounded-2xl text-center text-3xl font-black text-white outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
                    autoFocus
                />
                <button onClick={confirmClockIn} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white font-black uppercase text-sm shadow-xl transition-all active:scale-95">
                    Byrja Vakt
                </button>
            </div>
        </div>
      )}

      {/* --- EDIT SALE POPUP --- */}
      {editingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass p-8 rounded-[40px] w-full max-w-sm border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] relative">
                <button onClick={() => setEditingSale(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
                <h3 className="text-xl font-black text-white italic tracking-tighter mb-6 text-center">Breyta Færslu</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Upphæð</label>
                        <input 
                            type="number" 
                            value={editAmount} 
                            onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-2xl font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Verkefni</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PROJECTS.map(p => (
                                <button 
                                    key={p} 
                                    onClick={() => setEditProject(p)} 
                                    className={`p-2 rounded-xl text-[10px] font-bold transition-all ${editProject === p ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleUpdate} className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-white font-black uppercase text-sm shadow-xl transition-all active:scale-95 mt-4">
                        Uppfæra
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Toast */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
            <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border ${notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-white' : 'bg-indigo-500/20 border-indigo-500/50 text-white'}`}>
                {notification.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Clock size={18} className="text-indigo-400" />}
                <span className="font-bold text-sm">{notification.msg}</span>
            </div>
        </div>
      )}

      {/* 1. Header with Clock Button */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
         <div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Skráning</h2>
            <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-1">
                {clockInTime ? 'Vakt í gangi - Gangi þér vel!' : 'Byrjaðu vaktina'}
            </p>
         </div>
         
         <button 
            onClick={handleClockClick}
            className={`w-full md:w-auto px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${clockInTime ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
         >
            {clockInTime ? <LogOut size={20} /> : <LogIn size={20} />}
            {clockInTime ? "Skrá út" : "Skrá inn"}
         </button>
      </div>

      {/* 2. Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {/* Metric 1: Live Hours */}
        <div className="glass p-5 rounded-[32px] border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tímar í dag</p>
                <div className={`p-1 rounded-full ${clockInTime ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-white/10 text-slate-500'}`}>
                    <Clock size={12} />
                </div>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
                <div className="flex items-center gap-1">
                    <Sun size={12} className="text-indigo-400" />
                    <span className="text-lg font-black text-white">{liveHours.day.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Moon size={12} className="text-violet-400" />
                    <span className="text-lg font-black text-white">{liveHours.evening.toFixed(1)}</span>
                </div>
            </div>
        </div>

        {/* Metric 2: Today's Sales */}
        <div 
            onClick={() => setExpandedMetric(expandedMetric === 'today' ? null : 'today')}
            className="glass p-5 rounded-[32px] border-indigo-500/10 cursor-pointer hover:bg-white/5 transition-all group"
        >
            <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sala dagsins</p>
                <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400">
                    <Sparkles size={12} />
                </div>
            </div>
            <p className="text-xl font-black text-white">{formatISK(totalSalesToday)}</p>
            {expandedMetric === 'today' && (
                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400 animate-in slide-in-from-top-1">
                    Markmið: {formatISK(goals.daily)} <br/>
                    <span className="text-rose-400 font-bold">Vantar: {formatISK(remainingAmount)}</span>
                </div>
            )}
        </div>

        {/* Metric 3: Average */}
        <div className="glass p-5 rounded-[32px] border-emerald-500/10">
            <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Meðaltal / klst</p>
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    <TrendingUp size={12} />
                </div>
            </div>
            <p className="text-xl font-black text-emerald-400">{formatISK(avgSalesPerHour)}</p>
        </div>

        {/* Metric 4: Count */}
        <div className="glass p-5 rounded-[32px] border-violet-500/10">
            <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Fjöldi sala</p>
                <div className="p-1 rounded-full bg-violet-500/20 text-violet-400">
                    <Target size={12} />
                </div>
            </div>
            <p className="text-xl font-black text-violet-400">{todaySales.length}</p>
        </div>

        {/* Metric 5: Projected */}
        <div 
            onClick={() => setExpandedMetric(expandedMetric === 'proj' ? null : 'proj')}
            className="glass p-5 rounded-[32px] border-indigo-500/20 relative overflow-hidden cursor-pointer hover:bg-white/5 transition-all"
        >
            <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Áætluð lokasala</p>
                {expandedMetric === 'proj' && <Sparkles size={10} className="text-indigo-400" />}
            </div>
            <p className="text-xl font-black text-indigo-400">{formatISK(projectedFinal)}</p>
            {expandedMetric === 'proj' && (
                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400 animate-in slide-in-from-top-1">
                    <span className="block text-slate-500 mb-1">Þú þarft að selja fyrir:</span>
                    <span className="text-emerald-400 font-bold">{formatISK(requiredSpeed)} / klst</span> <br/>
                    til að ná markmiði.
                </div>
            )}
        </div>
      </div>

      {/* MAIN CONTENT - TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* LEFT COLUMN - Sales Registration Area */}
        <div className="lg:col-span-2 glass p-8 md:p-10 rounded-[40px] border-white/10 flex flex-col shadow-2xl relative h-full">
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400"><ShoppingBag size={24} /></div>
              <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Skrá Sölu</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Bættu við árangurinn þinn</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {PROJECTS.map(p => (
                <button key={p} onClick={() => setSaleData({...saleData, project: p})} className={`p-4 rounded-2xl border text-[10px] font-black transition-all ${saleData.project === p ? 'gradient-bg text-white border-white/20 shadow-lg scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}>{p}</button>
              ))}
            </div>
            <form onSubmit={handleAddSale} className="relative max-w-2xl mx-auto">
              <input type="number" required placeholder="0 kr." value={saleData.amount || ''} onChange={e => setSaleData({...saleData, amount: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 p-8 rounded-[32px] text-5xl font-black text-white outline-none focus:ring-4 focus:ring-indigo-500/20 pr-40 text-center placeholder:text-white/10" />
              <button type="submit" className="absolute right-4 top-4 bottom-4 px-8 gradient-bg rounded-[24px] text-white font-black uppercase text-sm shadow-xl hover:scale-105 transition-all active:scale-95">Bæta við</button>
            </form>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5">
             <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Nýlegar færslur í dag</h4>
             <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {todaySales.length > 0 ? [...todaySales].reverse().map(s => (
                  <div key={s.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                          <div className="flex flex-col">
                              <span className="font-black text-white text-xs">{s.project}</span>
                              <span className="text-[9px] text-slate-500">{new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className="font-black text-indigo-400 text-sm">{formatISK(s.amount)}</span>
                          <div className="flex gap-2">
                              <button onClick={() => setEditingSale(s)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Edit2 size={14} /></button>
                              <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"><Trash2 size={14} /></button>
                          </div>
                      </div>
                  </div>
                )) : <p className="text-slate-700 text-xs font-bold italic py-10 text-center">Engin sala skráð í dag.</p>}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN - PERFORMANCE HUB */}
        <div className="flex flex-col gap-6 lg:col-span-1 h-full">
            
            {/* 1. Visual Goal Tracker (Removed Green Bar) */}
            <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col items-center justify-center relative overflow-hidden group flex-grow">
                <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                        <circle 
                            cx="80" cy="80" r="70" 
                            stroke={progressPercent >= 100 ? "#10b981" : "#6366f1"} 
                            strokeWidth="12" 
                            fill="none" 
                            strokeDasharray="440" 
                            strokeDashoffset={440 - (440 * progressPercent) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="text-center">
                        <span className="text-3xl font-black text-white">{Math.round(progressPercent)}%</span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">af markmiði</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <Target size={14} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-300">{formatISK(goals.daily)} kr.</span>
                </div>
            </div>

            {/* 2. Streak Counter (Added Fire Chain Visuals) */}
            <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                        <Flame size={24} className={currentStreak > 1 ? "animate-pulse" : ""} />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Streak</span>
                </div>
                <div>
                    <h3 className="text-5xl font-black text-white tracking-tighter mb-1">{currentStreak}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight mb-6">
                        Vaktir í röð <br/>
                        <span className="text-amber-400">Haltu áfram!</span>
                    </p>
                    
                    {/* Visual Fire Chain */}
                    <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-2 flex-1 rounded-full transition-all ${i < currentStreak ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Comparison / Personal Best (Big & Visual) */}
            <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between flex-grow relative overflow-hidden">
                <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                        <Trophy size={24} />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Árangur</span>
                </div>
                
                <div className="mt-4">
                    <div className="flex items-center gap-3 mb-2">
                        {isPerformingWell ? (
                            <ArrowUpRight size={28} className="text-emerald-400" />
                        ) : (
                            <ArrowDownRight size={28} className="text-rose-400" />
                        )}
                        <h3 className={`text-4xl font-black tracking-tighter ${isPerformingWell ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {performanceDiff > 0 ? '+' : ''}{Math.round(performancePercent)}%
                        </h3>
                    </div>
                    
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Miðað við meðaltal
                    </p>

                    {/* Comparison Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                            <span>Þú</span>
                            <span>Meðaltal</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (totalSalesToday / (averageShiftSales * 1.5)) * 100)}%` }} />
                            <div className="w-[2px] h-full bg-white/20 z-10" /> 
                        </div>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default Registration;
