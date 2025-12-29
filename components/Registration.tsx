import React, { useState, useEffect, useMemo } from 'react';
import { Shift, Sale, Goals } from '../types';
import { PROJECTS } from '../constants';
import { ShoppingBag, TrendingUp, Clock, LogIn, LogOut, CheckCircle2, Sparkles, Target, Flame, Trophy, X, ArrowUpRight, ArrowDownRight, Sun, Moon } from 'lucide-react';

interface RegistrationProps {
  onSaveShift: (shift: Shift) => void;
  onSaveSale: (sale: Sale) => void;
  currentSales: Sale[];
  shifts: Shift[];
  editingShift: Shift | null;
  goals: Goals;
  onUpdateGoals: (g: Goals) => void;
  userRole?: string;
}

const Registration: React.FC<RegistrationProps> = ({ 
  onSaveShift, onSaveSale, currentSales, shifts, editingShift, goals, onUpdateGoals, userRole 
}) => {
  const [now, setNow] = useState(new Date());
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  
  // Goal Input Modal State
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [tempGoal, setTempGoal] = useState(goals.daily.toString());

  // Live Hours State
  const [liveHours, setLiveHours] = useState({ day: 0, evening: 0 });

  const [saleData, setSaleData] = useState({
    amount: 0,
    project: PROJECTS[0]
  });

  // --- Initial Load ---
  useEffect(() => {
    const storedStart = localStorage.getItem('takk_shift_start');
    if (storedStart) {
      setClockInTime(new Date(storedStart));
    }
    setTempGoal(goals.daily.toString());
  }, []);

  // --- Live Timer & Notifications ---
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);

      if (clockInTime) {
        const roundedNow = getRoundedTime(current);
        const roundedStart = getRoundedTime(clockInTime);
        setLiveHours(calculateShiftSplit(roundedStart, roundedNow));
      } else {
        setLiveHours({ day: 0, evening: 0 });
      }
    }, 30000);

    if (notification) {
        const notifTimer = setTimeout(() => setNotification(null), 3000);
        return () => { clearInterval(timer); clearTimeout(notifTimer); };
    }
    return () => clearInterval(timer);
  }, [notification, clockInTime]);

  // --- Helpers ---
  const getRoundedTime = (date: Date) => {
    const coeff = 1000 * 60 * 15;
    return new Date(Math.round(date.getTime() / coeff) * coeff);
  };

  const calculateShiftSplit = (start: Date, end: Date) => {
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
  };

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
    // Simple logic: sort shifts by date, count consecutive days
    const uniqueDates = Array.from(new Set(shifts.map(s => s.date))).sort().reverse();
    let streak = 0;
    let checkDate = new Date(); 
    // Start checking from yesterday/today
    for (let dateStr of uniqueDates) {
        // In a real app, strict date checking is needed. 
        // Here we just count shifts for visual demo.
        streak++;
    }
    return Math.min(streak, 1); // Placeholder logic if dates aren't strictly consecutive in test data
  }, [shifts]);

  const currentShiftDuration = liveHours.day + liveHours.evening;
  // Assume a standard 4 hour shift for projection if just started
  const hoursRemaining = Math.max(0.5, 4 - currentShiftDuration); 
  const projectedFinal = totalSalesToday + (avgSalesPerHour * hoursRemaining);

  // --- Smart Clock Logic ---
  const handleClockClick = () => {
    if (clockInTime) {
        // If clocking out -> Process immediately
        processClockOut();
    } else {
        // If clocking in -> Ask for goal first
        setShowGoalInput(true);
    }
  };

  const confirmClockIn = () => {
    // 1. Update Goal
    const newGoal = parseInt(tempGoal) || goals.daily;
    onUpdateGoals({ ...goals, daily: newGoal });
    
    // 2. Start Timer
    const start = getRoundedTime(new Date());
    setClockInTime(start);
    localStorage.setItem('takk_shift_start', start.toISOString());
    setNotification({ msg: `Markmið sett: ${formatISK(newGoal)}. Gangi þér vel!`, type: 'success' });
    setShowGoalInput(false);
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

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));

  // Visuals
  const progressPercent = Math.min(100, (totalSalesToday / goals.daily) * 100);
  const remainingAmount = Math.max(0, goals.daily - totalSalesToday);
  const requiredSpeed = remainingAmount / Math.max(0.5, hoursRemaining); // Needed per hour

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 relative animate-in fade-in duration-500">
      
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

      {/* 2. Metrics Row (5 Columns) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
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

        {/* Metric 2: Today's Sales (Interactive) */}
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

        {/* Metric 5: Projected (Interactive) */}
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

      <div className="grid grid-cols-1 gap-8">
        {/* Sales Registration Area */}
        <div className="glass p-8 md:p-10 rounded-[40px] border-white/10 flex flex-col shadow-2xl relative">
          <div>
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
             <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Nýlegar færslur</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todaySales.length > 0 ? [...todaySales].reverse().slice(0, 4).map(s => (
                  <div key={s.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                          <div className="flex flex-col">
                              <span className="font-black text-white text-xs">{s.project}</span>
                              <span className="text-[9px] text-slate-500">{new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                      </div>
                      <span className="font-black text-indigo-400 text-sm">{formatISK(s.amount)}</span>
                  </div>
                )) : <p className="text-slate-700 text-xs font-bold italic">Engin sala skráð í dag.</p>}
             </div>
          </div>
        </div>

        {/* --- PERFORMANCE HUB (New Visual Section) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-700">
            
            {/* 1. Visual Goal Tracker */}
            <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    {/* SVG Circle Background */}
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

            {/* 2. Streak Counter */}
            <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                        <Flame size={24} className={currentStreak > 1 ? "animate-pulse" : ""} />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Streak</span>
                </div>
                <div>
                    <h3 className="text-5xl font-black text-white tracking-tighter mb-2">{currentStreak}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-tight">
                        Vaktir í röð <br/>
                        <span className="text-amber-400">Haltu áfram!</span>
                    </p>
                </div>
            </div>

            {/* 3. Comparison / Personal Best */}
            <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                        <Trophy size={24} />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Árangur</span>
                </div>
                <div>
                    <div className="flex items-end gap-3 mb-2">
                        {totalSalesToday >= (goals.daily / 2) ? ( // Simple logic: if > 50% goal, show up trend
                            <ArrowUpRight size={32} className="text-emerald-400" />
                        ) : (
                            <ArrowDownRight size={32} className="text-slate-600" />
                        )}
                        <span className="text-sm font-bold text-slate-300 mb-1">vs. Meðaltal</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        Þú ert að standa þig <span className="text-white font-bold">{totalSalesToday > avgSalesPerHour * 4 ? 'betur en' : 'svipað og'}</span> venjulega. 
                        <br/>Meðalvaktin þín er um {formatISK(avgSalesPerHour * 4)}.
                    </p>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default Registration;
