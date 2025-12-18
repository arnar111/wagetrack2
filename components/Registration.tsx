
import React, { useState, useEffect, useMemo } from 'react';
import { Shift, Sale, Goals } from '../types';
import { PROJECTS } from '../constants';
import { Save, Clock, ShoppingBag, TrendingUp, Trophy, RefreshCcw, Edit3, Zap } from 'lucide-react';

interface RegistrationProps {
  onSaveShift: (shift: Shift) => void;
  onSaveSale: (sale: Sale) => void;
  currentSales: Sale[];
  shifts: Shift[];
  editingShift: Shift | null;
  goals: Goals;
  onUpdateGoals: (g: Goals) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onSaveShift, onSaveSale, currentSales, shifts, editingShift, goals, onUpdateGoals }) => {
  const [now, setNow] = useState(new Date());
  const [showPopup, setShowPopup] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [vaktData, setVaktData] = useState({
    date: new Date().toISOString().split('T')[0],
    dayHours: 0,
    eveningHours: 0,
    notes: '',
    projectName: 'Other'
  });

  const [saleData, setSaleData] = useState({
    amount: 0,
    project: PROJECTS[0]
  });

  useEffect(() => {
    if (editingShift) {
      setVaktData({
        date: editingShift.date,
        dayHours: editingShift.dayHours,
        eveningHours: editingShift.eveningHours,
        notes: editingShift.notes,
        projectName: editingShift.projectName || 'Other'
      });
      setShowPopup(false);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const savedHours = localStorage.getItem(`takk_hours_${today}`);
      if (savedHours) {
        setVaktData(prev => ({ ...prev, ...JSON.parse(savedHours), date: today }));
        setShowPopup(false);
      } else {
        setShowPopup(true);
      }
    }
  }, [editingShift]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const todaySales = useMemo(() => currentSales.filter(s => s.date === vaktData.date), [currentSales, vaktData.date]);
  const totalSalesToday = useMemo(() => todaySales.reduce((acc, s) => acc + s.amount, 0), [todaySales]);
  const totalHoursPlanned = vaktData.dayHours + vaktData.eveningHours;
  const numSales = todaySales.length;

  const { avgPerHour, projectedFinal } = useMemo(() => {
    if (todaySales.length === 0 || totalHoursPlanned <= 0) return { avgPerHour: 0, projectedFinal: 0 };
    const timestamps = todaySales.map(s => new Date(s.timestamp).getTime());
    const firstSaleTime = Math.min(...timestamps);
    const elapsedMs = Math.max(15 * 60 * 1000, now.getTime() - firstSaleTime);
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const currentPace = totalSalesToday / elapsedHours;
    const projected = currentPace * totalHoursPlanned;
    return { avgPerHour: currentPace, projectedFinal: projected };
  }, [todaySales, totalHoursPlanned, now, totalSalesToday]);

  const progressPercent = Math.min(100, (totalSalesToday / goals.daily) * 100);
  const isGoalMet = totalSalesToday >= goals.daily;

  const handleQuickAdd = (type: 'hringurinn' | 'verid') => {
    if (type === 'hringurinn') {
      setVaktData(prev => ({ ...prev, dayHours: 6, eveningHours: 2, projectName: 'Hringurinn' }));
      setSaleData(prev => ({ ...prev, project: 'Hringurinn' }));
    } else {
      setVaktData(prev => ({ ...prev, dayHours: 4, eveningHours: 4, projectName: 'Verið' }));
      setSaleData(prev => ({ ...prev, project: 'Verið' }));
    }
    setShowPopup(false);
  };

  const handleSaveHours = () => {
    if (vaktData.dayHours + vaktData.eveningHours > 0) {
      localStorage.setItem(`takk_hours_${vaktData.date}`, JSON.stringify({
        dayHours: vaktData.dayHours,
        eveningHours: vaktData.eveningHours,
        projectName: vaktData.projectName
      }));
      setShowPopup(false);
    }
  };

  const handleSaveShift = () => {
    onSaveShift({
      id: editingShift ? editingShift.id : Math.random().toString(36).substr(2, 9),
      date: vaktData.date,
      dayHours: vaktData.dayHours,
      eveningHours: vaktData.eveningHours,
      totalSales: totalSalesToday,
      notes: vaktData.notes,
      projectName: vaktData.projectName,
      userId: '' // Handled in App.tsx
    });
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
      userId: '' // Handled in App.tsx
    });
    setSaleData({ ...saleData, amount: 0 });
  };

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 relative">
      {/* Hours Setup Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass p-10 rounded-[40px] w-full max-w-md border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
            <h3 className="text-2xl font-black text-white uppercase italic mb-6 text-center">Ný Vakt</h3>
            
            {/* Quick Add Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <button 
                onClick={() => handleQuickAdd('hringurinn')}
                className="flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
              >
                <div className="text-left">
                  <p className="text-xs font-black text-white uppercase tracking-tighter">Hringurinn</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Full vakt (6+2)</p>
                </div>
                <Zap size={16} className="text-indigo-400 group-hover:scale-125 transition-transform" />
              </button>
              <button 
                onClick={() => handleQuickAdd('verid')}
                className="flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-violet-500/30 transition-all group"
              >
                <div className="text-left">
                  <p className="text-xs font-black text-white uppercase tracking-tighter">Verið</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Full vakt (4+4)</p>
                </div>
                <Zap size={16} className="text-violet-400 group-hover:scale-125 transition-transform" />
              </button>
            </div>

            <div className="relative flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Eða handvirkt</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">Dagvinna</label>
                <input type="number" step="0.5" value={vaktData.dayHours || ''} onChange={e => setVaktData({...vaktData, dayHours: parseFloat(e.target.value) || 0})} placeholder="h" className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-3xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3 block">Eftirvinna</label>
                <input type="number" step="0.5" value={vaktData.eveningHours || ''} onChange={e => setVaktData({...vaktData, eveningHours: parseFloat(e.target.value) || 0})} placeholder="h" className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-3xl outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>
            <button onClick={handleSaveHours} className="w-full py-5 gradient-bg rounded-[32px] text-white font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Byrja Vakt</button>
          </div>
        </div>
      )}

      {/* Mælikvarðar efst */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass p-5 rounded-[32px] border-indigo-500/10">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-[0.2em]">Sala dagsins</p>
          <p className="text-xl font-black text-white">{formatISK(totalSalesToday)} <span className="text-[10px] text-indigo-400 tracking-normal italic">ISK</span></p>
        </div>
        <div className="glass p-5 rounded-[32px] border-emerald-500/10">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-[0.2em]">Meðaltal / klst</p>
          <p className="text-xl font-black text-emerald-400">{formatISK(avgPerHour)} <span className="text-[10px] tracking-normal italic">ISK</span></p>
        </div>
        <div className="glass p-5 rounded-[32px] border-violet-500/10">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-[0.2em]">Fjöldi sala</p>
          <p className="text-xl font-black text-violet-400">{numSales} <span className="text-[10px] tracking-normal italic">stk</span></p>
        </div>
        <div className="glass p-5 rounded-[32px] border-indigo-500/20 relative overflow-hidden group">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-[0.2em]">Áætluð lokasala</p>
          <p className="text-xl font-black text-indigo-400 group-hover:scale-105 transition-transform">{formatISK(projectedFinal)} <span className="text-[10px] tracking-normal italic">ISK</span></p>
          <TrendingUp className="absolute right-2 bottom-2 text-white/5" size={40} />
        </div>
      </div>

      {/* Markmiðsmælir */}
      <div className="glass p-6 rounded-[40px] border-white/5 relative overflow-hidden">
        <div className="flex justify-between items-end mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vantar í dagsmarkmið</p>
              <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="text-indigo-400 hover:text-white transition-colors"><Edit3 size={12} /></button>
            </div>
            <div className="flex items-center gap-3">
              {isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <input type="number" value={goals.daily} onChange={e => onUpdateGoals({...goals, daily: parseInt(e.target.value) || 0})} onBlur={() => setIsEditingGoal(false)} autoFocus className="bg-white/5 border border-white/10 rounded-lg p-1 text-lg font-black text-white w-32 outline-none" />
                  <span className="text-xs text-slate-500 font-bold">ISK Markmið</span>
                </div>
              ) : (
                <h4 className="text-xl font-black text-white uppercase tracking-tight">
                  {formatISK(Math.max(0, goals.daily - totalSalesToday))} ISK 
                  <span className="text-[10px] text-slate-500 font-bold normal-case tracking-normal ml-2">(af {formatISK(goals.daily)})</span>
                </h4>
              )}
            </div>
          </div>
          <span className="text-2xl font-black text-indigo-400 italic">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-4 bg-white/5 rounded-full p-1 border border-white/5 shadow-inner">
          <div className="h-full gradient-bg rounded-full transition-all duration-1000 ease-out shadow-lg" style={{ width: `${progressPercent}%` }} />
        </div>
        {isGoalMet && (
          <div className="mt-6 flex items-center justify-center gap-3 text-indigo-400 animate-bounce bg-indigo-500/5 py-3 rounded-2xl border border-indigo-500/10">
            <Trophy size={20} className="text-amber-400" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Markmiði náð! Snillingur! 🌟</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Form */}
        <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between shadow-2xl relative">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400"><ShoppingBag size={24} /></div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Skrá Sölu</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
              {PROJECTS.map(p => (
                <button 
                  key={p} 
                  onClick={() => setSaleData({...saleData, project: p})} 
                  className={`p-3 rounded-2xl border text-[10px] font-black transition-all ${saleData.project === p ? 'gradient-bg text-white border-white/20 shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <form onSubmit={handleAddSale} className="relative">
              <input type="number" required placeholder="Upphæð..." value={saleData.amount || ''} onChange={e => setSaleData({...saleData, amount: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 p-7 rounded-[32px] text-4xl font-black text-white outline-none focus:ring-4 focus:ring-indigo-500/20 pr-32 shadow-inner" />
              <button type="submit" className="absolute right-3 top-3 bottom-3 px-8 gradient-bg rounded-2xl text-white font-black uppercase text-sm hover:scale-[1.05] active:scale-95 transition-all shadow-xl">Bæta</button>
            </form>
          </div>
          <div className="mt-10 space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar border-t border-white/5 pt-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Skráð í dag</p>
            {todaySales.length > 0 ? [...todaySales].reverse().map(s => (
              <div key={s.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                <div className="flex flex-col">
                  <span className="font-black text-white uppercase tracking-tighter text-xs">{s.project}</span>
                  <span className="text-[9px] text-slate-500 font-bold">{new Date(s.timestamp).toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className="font-black text-indigo-400 text-sm">{formatISK(s.amount)}</span>
              </div>
            )) : <p className="text-center text-slate-700 text-xs py-10 font-bold italic">Engin sala skráð.</p>}
          </div>
        </div>

        {/* Shift Management */}
        <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400"><Clock size={24} /></div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Vaktaupplýsingar</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Dagvinna</p>
                <p className="text-3xl font-black text-white">{vaktData.dayHours}<span className="text-sm opacity-50 ml-1">h</span></p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">Eftirvinna</p>
                <p className="text-3xl font-black text-white">{vaktData.eveningHours}<span className="text-sm opacity-50 ml-1">h</span></p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team: {vaktData.projectName}</label>
              <textarea rows={4} value={vaktData.notes} onChange={e => setVaktData({...vaktData, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" placeholder="Hvernig var stemningin?" />
            </div>
          </div>
          <div className="flex gap-4 mt-10">
            <button onClick={() => setShowPopup(true)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-[24px] text-slate-400 font-black text-xs uppercase tracking-widest transition-all border border-white/5">Breyta vinnutíma</button>
            <button onClick={handleSaveShift} className="flex-1 py-5 gradient-bg rounded-[24px] text-white font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95">Ljúka og Vista</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
