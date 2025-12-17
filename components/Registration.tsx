
import React, { useState } from 'react';
// Fix: PROJECTS is exported from constants.ts, not types.ts
import { Shift, Sale } from '../types';
import { PROJECTS } from '../constants';
import { Save, Calendar, Clock, DollarSign, ShoppingBag, Target, TrendingUp } from 'lucide-react';

interface RegistrationProps {
  onSaveShift: (shift: Shift) => void;
  onSaveSale: (sale: Sale) => void;
  currentSales: Sale[];
}

const Registration: React.FC<RegistrationProps> = ({ onSaveShift, onSaveSale, currentSales }) => {
  const [vaktData, setVaktData] = useState({
    date: new Date().toISOString().split('T')[0],
    dayHours: 0,
    eveningHours: 0,
    totalSales: 0,
    notes: ''
  });

  const [saleData, setSaleData] = useState({
    amount: 0,
    project: PROJECTS[0]
  });

  // Calculate metrics for the selected date
  const todaySales = currentSales.filter(s => s.date === vaktData.date);
  const totalSalesToday = todaySales.reduce((acc, s) => acc + s.amount, 0);
  const totalHoursToday = vaktData.dayHours + vaktData.eveningHours;
  const avgPerHour = totalHoursToday > 0 ? totalSalesToday / totalHoursToday : 0;
  const projected = avgPerHour * 8; // Assuming standard 8h day for projection

  const handleSaveShift = () => {
    onSaveShift({
      ...vaktData,
      id: Math.random().toString(36).substr(2, 9),
      totalSales: totalSalesToday
    });
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleData.amount <= 0) return;
    onSaveSale({
      id: Math.random().toString(36).substr(2, 9),
      date: vaktData.date,
      amount: saleData.amount,
      project: saleData.project
    });
    setSaleData({ ...saleData, amount: 0 });
  };

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Live Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-3xl border-indigo-500/20">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Sala dagsins</p>
          <p className="text-xl font-black text-white">{formatISK(totalSalesToday)} <span className="text-xs text-indigo-400">ISK</span></p>
        </div>
        <div className="glass p-4 rounded-3xl">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Meðaltal á klst</p>
          <p className="text-xl font-black text-emerald-400">{formatISK(avgPerHour)} <span className="text-xs">ISK</span></p>
        </div>
        <div className="glass p-4 rounded-3xl">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Áætluð lokasala</p>
          <p className="text-xl font-black text-indigo-400">{formatISK(projected)} <span className="text-xs">ISK</span></p>
        </div>
        <div className="glass p-4 rounded-3xl bg-indigo-500/5">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Vinnustundir</p>
          <p className="text-xl font-black text-white">{totalHoursToday} <span className="text-xs">klst</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Logger */}
        <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400"><ShoppingBag size={24} /></div>
              <h3 className="text-xl font-black text-white">Flýtiskráning Sölu</h3>
            </div>

            <form onSubmit={handleAddSale} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {PROJECTS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSaleData({...saleData, project: p})}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                      saleData.project === p 
                      ? 'gradient-bg border-white/20 text-white' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input 
                  type="number"
                  required
                  placeholder="Upphæð sölu..."
                  value={saleData.amount || ''}
                  onChange={e => setSaleData({...saleData, amount: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-3xl font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-3 bottom-3 px-6 gradient-bg rounded-2xl text-white font-black hover:scale-105 active:scale-95 transition-all"
                >
                  Bæta við
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {todaySales.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl text-xs">
                <span className="font-bold text-slate-400">{s.project}</span>
                <span className="font-black text-white">{formatISK(s.amount)} ISK</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Logger */}
        <div className="glass p-8 rounded-[40px] border-white/10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-400"><Clock size={24} /></div>
            <h3 className="text-xl font-black text-white">Vaktayfirlit</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Dagsetning</label>
              <input 
                type="date"
                value={vaktData.date}
                onChange={e => setVaktData({...vaktData, date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block text-indigo-400">Dagvinna (08-17)</label>
                <input 
                  type="number" step="0.5"
                  value={vaktData.dayHours}
                  onChange={e => setVaktData({...vaktData, dayHours: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-black text-xl outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block text-violet-400">Eftirvinna (17-00)</label>
                <input 
                  type="number" step="0.5"
                  value={vaktData.eveningHours}
                  onChange={e => setVaktData({...vaktData, eveningHours: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-black text-xl outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveShift}
              className="w-full py-5 gradient-bg rounded-3xl text-white font-black text-xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3"
            >
              <Save size={24} /> Vista Vakt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
