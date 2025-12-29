import React, { useState, useEffect, useMemo } from 'react';
import { Shift, Sale, Goals } from '../types';
import { PROJECTS } from '../constants';
import { ShoppingBag, TrendingUp, Clock, Zap, LogIn, LogOut, CheckCircle2, AlertCircle, Sparkles, Target, Moon, Sun } from 'lucide-react';

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

  // Live Hours State
  const [liveHours, setLiveHours] = useState({ day: 0, evening: 0 });

  const [saleData, setSaleData] = useState({
    amount: 0,
    project: PROJECTS[0]
  });

  // Load Clock-In state on mount
  useEffect(() => {
    const storedStart = localStorage.getItem('takk_shift_start');
    if (storedStart) {
      setClockInTime(new Date(storedStart));
    }
  }, []);

  // Rounding Helper (Nearest 15 minutes)
  const getRoundedTime = (date: Date) => {
    const coeff = 1000 * 60 * 15;
    return new Date(Math.round(date.getTime() / coeff) * coeff);
  };

  // Helper: Split hours into Day/Evening based on 17:00 cutoff
  const calculateShiftSplit = (start: Date, end: Date) => {
    const isWeekend = start.getDay() === 0 || start.getDay() === 6;
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (diffHours <= 0) return { day: 0, evening: 0 };
    if (isWeekend) return { day: 0, evening: diffHours };

    // Simple Weekday Logic: Day until 17:00, then Evening
    // This is an estimation for the live view
    const hourOfDay = end.getHours();
    if (hourOfDay >= 17) {
        // If current time is past 17:00, assume logic (simplified for live view)
        // A robust implementation would iterate through the hours interval
        // For visual simplicity now:
        const eveningPart = Math.max(0, hourOfDay - 17 + (end.getMinutes()/60));
        const dayPart = Math.max(0, diffHours - eveningPart);
        return { day: dayPart, evening: eveningPart };
    }
    
    return { day: diffHours, evening: 0 };
  };

  // Timer for "Live" calculations (Updates every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);

      // Update Live Hours Metric
      if (clockInTime) {
        const roundedNow = getRoundedTime(current);
        const roundedStart = getRoundedTime(clockInTime);
        setLiveHours(calculateShiftSplit(roundedStart, roundedNow));
      } else {
        setLiveHours({ day: 0, evening: 0 });
      }

    }, 30000); // 30 sec update

    if (notification) {
        const notifTimer = setTimeout(() => setNotification(null), 3000);
        return () => { clearInterval(timer); clearTimeout(notifTimer); };
    }
    return () => clearInterval(timer);
  }, [notification, clockInTime]);

  // --- Smart Clock In / Out (With Auto Save) ---
  const handleSmartClock = () => {
    if (clockInTime) {
        // --- CLOCK OUT & SAVE ---
        const endTime = getRoundedTime(new Date());
        const startTime = getRoundedTime(clockInTime);
        
        // Calculate final split
        const finalHours = calculateShiftSplit(startTime, endTime);
        
        // 1. Save to Database
        onSaveShift({
            id: Math.random().toString(36).substr(2, 9),
            date: startTime.toISOString().split('T')[0],
            dayHours: parseFloat(finalHours.day.toFixed(2)),
            eveningHours: parseFloat(finalHours.evening.toFixed(2)),
            totalSales: totalSalesToday, // Saves the sales accumulated during this session
            notes: '', // Can be edited in History later
            projectName: 'Other',
            userId: '' 
        });

        // 2. Reset State
        setClockInTime(null);
        localStorage.removeItem('takk_shift_start');
        setLiveHours({ day: 0, evening: 0 });
        setNotification({ 
            msg: `Vakt vistuð! (${(finalHours.day + finalHours.evening).toFixed(2)} klst)`, 
            type: 'success' 
        });

    } else {
        // --- CLOCK IN ---
        const start = getRoundedTime(new Date());
        setClockInTime(start);
        localStorage.setItem('takk_shift_start', start.toISOString());
        setNotification({ msg: `Skráður inn kl. ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, type: 'success' });
    }
  };

  // --- Sales Logic ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = useMemo(() => currentSales.filter(s => s.date === todayStr), [currentSales, todayStr]);
  const totalSalesToday = useMemo(() => todaySales.reduce((acc, s) => acc + s.amount, 0), [todaySales]);
  
  // Projection Logic
  const { avgSalesPerHour } = useMemo(() => {
    if (shifts.length === 0) return { avgSalesPerHour: 0 };
    const totalHistorySales = shifts.reduce((acc, s) => acc + s.totalSales, 0);
    const totalHistoryHours = shifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
    return { avgSalesPerHour: totalHistoryHours > 0 ? totalHistorySales / totalHistoryHours : 0 };
  }, [shifts]);

  const currentShiftDuration = liveHours.day + liveHours.evening;
  // If just started, assume at least 1 hour for projection, otherwise use actual time
  const projectedFinal = totalSalesToday + (avgSalesPerHour * Math.max(1, 4 - currentShiftDuration)); // Proj for rest of a 4h block? 
  // Simplified: Current + (Avg * 4 hours standard block)
  const simpleProjection = totalSalesToday + (avgSalesPerHour * 4);

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 relative animate-in fade-in duration-500">
      
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
            onClick={handleSmartClock}
            className={`w-full md:w-auto px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${clockInTime ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
         >
            {clockInTime ? <LogOut size={20} /> : <LogIn size={20} />}
            {clockInTime ? "Skrá út (Vista)" : "Skrá inn"}
         </button>
      </div>

      {/* 2. Metrics Row (5 Columns) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Metric 1: Live Hours (New) */}
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
                    <span className={totalSalesToday >= goals.daily ? "text-emerald-400" : "text-rose-400"}>
                        {Math.round((totalSalesToday / goals.daily) * 100)}% komið
                    </span>
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
            <p className="text-xl font-black text-indigo-400">{formatISK(simpleProjection)}</p>
            {expandedMetric === 'proj' && (
                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400 animate-in slide-in-from-top-1">
                    Miðað við 4 klst vakt <br/>
                    og sögulegan hraða.
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Large Sales Registration Area (Now Full Width) */}
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
      </div>
    </div>
  );
};

export default Registration;
