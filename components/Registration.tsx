import React, { useState, useEffect, useMemo } from 'react';
import { Shift, Sale, Goals } from '../types';
import { PROJECTS } from '../constants';
import { Save, Clock, ShoppingBag, TrendingUp, Trophy, Edit3, Zap, BookOpen, ShieldCheck, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

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
  
  // State for visual feedback (Toast)
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);
  
  // State for expanding metric cards
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  // Clock In State
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  const [vaktData, setVaktData] = useState({
    date: new Date().toISOString().split('T')[0],
    dayHours: 0,
    eveningHours: 0,
    notes: '',
    managerNotes: '',
    projectName: 'Other'
  });

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
    
    // Also load draft data if exists
    if (editingShift) {
        setVaktData({
            date: editingShift.date,
            dayHours: editingShift.dayHours,
            eveningHours: editingShift.eveningHours,
            notes: editingShift.notes,
            managerNotes: editingShift.managerNotes || '',
            projectName: editingShift.projectName || 'Other'
        });
    }
  }, [editingShift]);

  // Timer for "Live" calculations
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    if (notification) {
        const notifTimer = setTimeout(() => setNotification(null), 3000);
        return () => { clearInterval(timer); clearTimeout(notifTimer); };
    }
    return () => clearInterval(timer);
  }, [notification]);

  // --- Rounding Helper (Nearest 15 minutes) ---
  const getRoundedTime = (date: Date) => {
    const coeff = 1000 * 60 * 15;
    return new Date(Math.round(date.getTime() / coeff) * coeff);
  };

  // --- Smart Clock Logic ---
  const handleSmartClock = () => {
    if (clockInTime) {
        // CLOCK OUT LOGIC
        const endTime = getRoundedTime(new Date());
        const startTime = getRoundedTime(clockInTime);
        
        const diffMs = endTime.getTime() - startTime.getTime();
        const diffHours = Math.max(0, diffMs / (1000 * 60 * 60)); // Convert ms to hours

        // Simple logic: Assume evening hours if shift goes past 17:00? 
        // For simplicity based on your request, we just set total hours to dayHours for now 
        // or split them 50/50 if you prefer. Let's just put it in DayHours and let user adjust.
        setVaktData(prev => ({ ...prev, dayHours: diffHours }));
        
        setClockInTime(null);
        localStorage.removeItem('takk_shift_start');
        setNotification({ msg: `Skráður út: ${diffHours.toFixed(2)} klst skráðar.`, type: 'info' });
    } else {
        // CLOCK IN LOGIC
        const start = getRoundedTime(new Date());
        setClockInTime(start);
        localStorage.setItem('takk_shift_start', start.toISOString());
        setNotification({ msg: `Skráður inn kl. ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, type: 'success' });
    }
  };

  // --- Calculations ---
  const todaySales = useMemo(() => currentSales.filter(s => s.date === vaktData.date), [currentSales, vaktData.date]);
  const totalSalesToday = useMemo(() => todaySales.reduce((acc, s) => acc + s.amount, 0), [todaySales]);
  
  // Historical Averages for Projection
  const { avgSalesPerHour, avgShiftLength } = useMemo(() => {
    if (shifts.length === 0) return { avgSalesPerHour: 0, avgShiftLength: 8 };
    
    const totalHistorySales = shifts.reduce((acc, s) => acc + s.totalSales, 0);
    const totalHistoryHours = shifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
    
    const avgSpeed = totalHistoryHours > 0 ? totalHistorySales / totalHistoryHours : 0;
    const avgLen = totalHistoryHours / shifts.length;
    
    return { avgSalesPerHour: avgSpeed, avgShiftLength: avgLen };
  }, [shifts]);

  // Projected Final: (Avg Speed * Avg Shift Length) OR (Avg Speed * Planned Hours)
  const totalPlannedHours = vaktData.dayHours + vaktData.eveningHours;
  // If user hasn't set hours yet, use their historical average shift length
  const hoursToUse = totalPlannedHours > 0 ? totalPlannedHours : avgShiftLength;
  const projectedFinal = avgSalesPerHour * hoursToUse;

  const handleSaveShift = () => {
    onSaveShift({
      id: editingShift ? editingShift.id : Math.random().toString(36).substr(2, 9),
      date: vaktData.date,
      dayHours: vaktData.dayHours,
      eveningHours: vaktData.eveningHours,
      totalSales: totalSalesToday,
      notes: vaktData.notes,
      managerNotes: vaktData.managerNotes,
      projectName: vaktData.projectName,
      userId: '' 
    });
    setNotification({ msg: "Vakt vistuð! Vel gert.", type: 'success' });
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleData.amount <= 0) return;
    onSaveSale({
      id: Math.random().toString(36).substr(2, 9),
      date: vaktData.date,
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
      
      {/* Visual Feedback (Toast) */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
            <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border ${notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-white' : 'bg-indigo-500/20 border-indigo-500/50 text-white'}`}>
                {notification.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Clock size={18} className="text-indigo-400" />}
                <span className="font-bold text-sm">{notification.msg}</span>
            </div>
        </div>
      )}

      {/* 1. Header with Smart Button */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
         <div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Skráning</h2>
            <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-1">
                {clockInTime ? 'Vakt í gangi...' : 'Byrjaðu vaktina'}
            </p>
         </div>
         
         <button 
            onClick={handleSmartClock}
            className={`w-full md:w-auto px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${clockInTime ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
         >
            {clockInTime ? <LogOut size={20} /> : <LogIn size={20} />}
            {clockInTime ? "Skrá út" : "Skrá inn"}
         </button>
      </div>

      {/* 2. Metrics Row (Clickable) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
            onClick={() => setExpandedMetric(expandedMetric === 'today' ? null : 'today')}
            className="glass p-5 rounded-[32px] border-indigo-500/10 cursor-pointer hover:bg-white/5 transition-all group"
        >
            <div className="flex justify-between items-start mb-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sala dagsins</p>
                {expandedMetric === 'today' && <AlertCircle size={10} className="text-indigo-400" />}
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

        <div className="glass p-5 rounded-[32px] border-emerald-500/10">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Meðaltal / klst</p>
            <p className="text-xl font-black text-emerald-400">{formatISK(avgSalesPerHour)}</p>
        </div>

        <div className="glass p-5 rounded-[32px] border-violet-500/10">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Fjöldi sala</p>
            <p className="text-xl font-black text-violet-400">{todaySales.length}</p>
        </div>

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
                    Miðað við {hoursToUse.toFixed(1)} klst vakt <br/>
                    og sögulegan hraða.
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Registration */}
        <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between shadow-2xl relative">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400"><ShoppingBag size={24} /></div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Skrá Sölu</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
              {PROJECTS.map(p => (
                <button key={p} onClick={() => setSaleData({...saleData, project: p})} className={`p-3 rounded-2xl border text-[10px] font-black transition-all ${saleData.project === p ? 'gradient-bg text-white border-white/20' : 'bg-white/5 border-white/5 text-slate-500'}`}>{p}</button>
              ))}
            </div>
            <form onSubmit={handleAddSale} className="relative">
              <input type="number" required placeholder="Upphæð..." value={saleData.amount || ''} onChange={e => setSaleData({...saleData, amount: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 p-7 rounded-[32px] text-4xl font-black text-white outline-none focus:ring-4 focus:ring-indigo-500/20 pr-32" />
              <button type="submit" className="absolute right-3 top-3 bottom-3 px-8 gradient-bg rounded-2xl text-white font-black uppercase text-sm">Bæta</button>
            </form>
          </div>
          <div className="mt-10 space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {todaySales.length > 0 ? [...todaySales].reverse().map(s => (
              <div key={s.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5"><div className="flex flex-col"><span className="font-black text-white text-xs">{s.project}</span><span className="text-[9px] text-slate-500">{new Date(s.timestamp).toLocaleTimeString()}</span></div><span className="font-black text-indigo-400 text-sm">{formatISK(s.amount)}</span></div>
            )) : <p className="text-center text-slate-700 text-xs py-10 font-bold italic">Engin sala skráð.</p>}
          </div>
        </div>

        {/* Shift Details & Manager Notes */}
        <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between relative overflow-hidden">
          {userRole === 'manager' && <ShieldCheck size={80} className="absolute top-0 right-0 p-4 opacity-5 text-[#d4af37]" />}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400"><Clock size={24} /></div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Vaktaupplýsingar</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Dagvinna</p>
                  <input 
                    type="number" 
                    step="0.25" 
                    value={vaktData.dayHours} 
                    onChange={e => setVaktData({...vaktData, dayHours: parseFloat(e.target.value) || 0})}
                    className="w-full bg-transparent text-3xl font-black text-white outline-none"
                  />
                  <span className="text-[10px] text-slate-500">klst</span>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-violet-400 uppercase mb-2">Eftirvinna</p>
                  <input 
                    type="number" 
                    step="0.25" 
                    value={vaktData.eveningHours} 
                    onChange={e => setVaktData({...vaktData, eveningHours: parseFloat(e.target.value) || 0})}
                    className="w-full bg-transparent text-3xl font-black text-white outline-none"
                  />
                  <span className="text-[10px] text-slate-500">klst</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase">Teymi: {vaktData.projectName}</label><textarea rows={2} value={vaktData.notes} onChange={e => setVaktData({...vaktData, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Lýsing..." /></div>
              {userRole === 'manager' && (
                <div className="space-y-2"><label className="text-[10px] font-black text-[#d4af37] uppercase flex items-center gap-2"><BookOpen size={12} /> Stjórnanda Athugasemdir</label><textarea rows={3} value={vaktData.managerNotes} onChange={e => setVaktData({...vaktData, managerNotes: e.target.value})} className="w-full bg-[#d4af37]/5 border border-[#d4af37]/20 p-5 rounded-3xl text-[#d4af37] text-xs outline-none focus:ring-2 focus:ring-[#d4af37] placeholder:text-[#d4af37]/40" placeholder="Skráðu athugasemdir um vaktina eða teymið..." /></div>
              )}
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <button onClick={handleSaveShift} className="w-full py-5 gradient-bg rounded-[24px] text-white font-black text-xs uppercase shadow-2xl hover:scale-[1.02] transition-all active:scale-95">Vista Vakt</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
