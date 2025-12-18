
import React, { useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area
} from 'recharts';
import { Shift, WageSummary, Goals, Sale } from '../types';
import { DollarSign, TrendingUp, Target, Star, Activity, BarChart3, Calendar } from 'lucide-react';

interface DashboardProps {
  summary: WageSummary;
  shifts: Shift[];
  aiInsights: string;
  onAddClick: () => void;
  goals: Goals;
  onUpdateGoals: (g: Goals) => void;
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ summary, shifts, aiInsights, goals, onUpdateGoals }) => {
  const chartData = useMemo(() => shifts.slice(0, 10).reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString('is-IS', { weekday: 'short' }),
    val: s.totalSales
  })), [shifts]);

  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', maximumFractionDigits: 0 }).format(val);
  };

  const monthlyProgress = Math.min(100, (summary.totalSales / (goals.monthly || 1)) * 100);

  // Mælikvarðar
  const daysWorked = useMemo(() => new Set(shifts.map(s => s.date)).size || 1, [shifts]);
  const avgSalesPerDay = summary.totalSales / daysWorked;
  const estimatedMonthlySales = (summary.totalSales / daysWorked) * 22; // Miðað við 22 vinnudaga

  return (
    <div className="space-y-6 md:space-y-8">
      
      {/* 1. Lykilmælikvarðar - Responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="glass p-6 rounded-[32px] border-indigo-500/20 group hover:bg-indigo-500/5 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400"><DollarSign size={20} /></div>
            <div className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Nettó</div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Útgreitt tímabil</p>
          <h3 className="text-2xl font-black text-white tracking-tighter italic break-words">{formatISK(summary.netPay)}</h3>
        </div>

        <div className="glass p-6 rounded-[32px] border-emerald-500/10 group hover:bg-emerald-500/5 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400"><TrendingUp size={20} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Meðal sala á dag</p>
          <h3 className="text-2xl font-black text-white tracking-tighter italic break-words">{formatISK(avgSalesPerDay)}</h3>
        </div>

        <div className="glass p-6 rounded-[32px] border-violet-500/10 group hover:bg-violet-500/5 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400"><Activity size={20} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mánaðarspá (Sala)</p>
          <h3 className="text-2xl font-black text-white tracking-tighter italic break-words">{formatISK(estimatedMonthlySales)}</h3>
        </div>

        <div className="glass p-6 rounded-[32px] border-amber-500/10 group hover:bg-amber-500/5 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400"><Star size={20} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Árangur / klst</p>
          <h3 className="text-2xl font-black text-white tracking-tighter italic break-words">{formatISK(summary.totalHours > 0 ? summary.totalSales / summary.totalHours : 0)}</h3>
        </div>
      </div>

      {/* 2. Charts Section - Stack on mobile/medium */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 glass p-6 md:p-8 rounded-[40px] border-white/5 relative min-h-[400px]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Söluþróun</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Samanburður síðustu 10 vaktir</p>
            </div>
            <BarChart3 className="text-indigo-400 opacity-30" size={24} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  itemStyle={{ color: '#6366f1', fontWeight: 900 }}
                  labelStyle={{ display: 'none' }}
                />
                <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-[40px] border-indigo-500/20 flex flex-col justify-between min-h-[500px] shadow-2xl">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400"><Target size={24} /></div>
              <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Markmiðin þín</h4>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Dagsmarkmið</label>
                <input 
                  type="number"
                  value={goals.daily}
                  onChange={e => onUpdateGoals({...goals, daily: parseInt(e.target.value) || 0})}
                  className="bg-transparent text-3xl font-black text-white outline-none w-full border-b-2 border-white/5 focus:border-indigo-500 transition-all pb-2 italic tracking-tighter"
                />
                <span className="absolute right-0 bottom-4 text-slate-700 font-black text-xs uppercase">ISK</span>
              </div>

              <div className="relative group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Mánaðarmarkmið</label>
                <input 
                  type="number"
                  value={goals.monthly}
                  onChange={e => onUpdateGoals({...goals, monthly: parseInt(e.target.value) || 0})}
                  className="bg-transparent text-3xl font-black text-white outline-none w-full border-b-2 border-white/5 focus:border-indigo-500 transition-all pb-2 italic tracking-tighter"
                />
                <span className="absolute right-0 bottom-4 text-slate-700 font-black text-xs uppercase">ISK</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full h-5 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                <div className="h-full gradient-bg rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${monthlyProgress}%` }} />
              </div>
              <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <span className="text-indigo-400">{Math.round(monthlyProgress)}% af mánaðarmarkmiði</span>
                <span className="text-slate-400">{formatISK(summary.totalSales)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-10 p-5 bg-white/2 rounded-3xl border border-white/5">
             <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-relaxed text-center">
               „{aiInsights || "Haltu áfram að skrá vaktir til að fá nýja AI innsýn í árangurinn þinn."}“
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
