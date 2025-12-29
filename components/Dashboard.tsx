import React, { useMemo, useEffect, useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import { Shift, WageSummary, Goals, Sale } from '../types';
import { DollarSign, TrendingUp, Activity, Star, BarChart3, Target, Sparkles, TrendingDown, ArrowRightCircle } from 'lucide-react';
import { getSmartDashboardAnalysis } from '../geminiService.ts';
import { forceSeedUser123 } from '../utils/seeder.ts';

interface DashboardProps {
  summary: WageSummary;
  shifts: Shift[];
  // Added prop for precise calculation
  periodShifts?: Shift[]; 
  aiInsights: string;
  onAddClick: () => void;
  goals: Goals;
  onUpdateGoals: (g: Goals) => void;
  sales: Sale[];
  staffId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ summary, shifts, periodShifts, goals, onUpdateGoals, staffId }) => {
  const [smartData, setSmartData] = useState<any>(null);
  const [isLoadingSmart, setIsLoadingSmart] = useState(false);

  useEffect(() => {
    const fetchSmartAnalysis = async () => {
      if (shifts.length === 0) return;
      setIsLoadingSmart(true);
      const data = await getSmartDashboardAnalysis(shifts, goals, summary);
      setSmartData(data);
      setIsLoadingSmart(false);
    };
    fetchSmartAnalysis();
  }, [shifts, goals, summary.totalSales]);

  const chartData = useMemo(() => shifts.slice(0, 10).reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString('is-IS', { weekday: 'short' }),
    val: s.totalSales
  })), [shifts]);

  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', maximumFractionDigits: 0 }).format(val);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const salesToday = shifts.find(s => s.date === todayStr)?.totalSales || 0;
   
  const dailyProgress = Math.min(100, (salesToday / (goals.daily || 1)) * 100);
  const monthlyProgress = Math.min(100, (summary.totalSales / (goals.monthly || 1)) * 100);

  // FIXED: Count days ONLY from the Period Shifts if available
  const daysWorked = useMemo(() => {
    const relevantShifts = periodShifts || shifts;
    return new Set(relevantShifts.map(s => s.date)).size || 1;
  }, [shifts, periodShifts]);

  // Calculate Average based on Period Total / Period Days
  const avgSalesPerDay = summary.totalSales / Math.max(1, daysWorked);

  return (
    <div className="space-y-6 md:space-y-8 pb-32 md:pb-10">

      {/* TEMP DEBUG BUTTON - Visible for development/test purposes */}
      {staffId === '123' && (
        <button 
          onClick={forceSeedUser123}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-[24px] shadow-2xl shadow-red-600/20 animate-pulse transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          🚨 FORCE REPAIR TEST DATA (User 123) 🚨
        </button>
      )}
      
      {/* AI Smart Coach Widget */}
      <div className="glass p-6 md:p-8 rounded-[40px] border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-transparent relative overflow-hidden group shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Smart Coach</h3>
            </div>
            {isLoadingSmart ? (
              <div className="space-y-3">
                <div className="h-6 w-3/4 bg-white/5 rounded-full animate-pulse" />
                <div className="h-4 w-1/2 bg-white/5 rounded-full animate-pulse" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg md:text-xl font-black text-white italic tracking-tight leading-snug">
                  „{smartData?.smartAdvice || "Skráðu vaktir til að virkja AI ráðgjöf."}“
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/20">
                    {smartData?.trend === 'up' ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Trend: {smartData?.trend || 'stable'}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 italic">"{smartData?.motivationalQuote || 'Allur árangur byrjar á ákvörðun.'}"</p>
                </div>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">
            Sjá Greiningu <ArrowRightCircle size={16} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="glass p-6 rounded-[32px] border-indigo-500/20 group hover:bg-indigo-500/5 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400"><DollarSign size={20} /></div>
            <div className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Nettó</div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Samtals safnað á tímabili</p>
          <h3 className="text-2xl font-black text-white tracking-tighter italic">{formatISK(summary.totalSales)}</h3>
        </div>

        <div className="glass p-6 rounded-[32px] border-emerald-500/10 group hover:bg-emerald-500/5 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400"><TrendingUp size={20} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Meðal sala á dag</p>
          <h3 className="text-2xl font-black text-white tracking-tighter italic">{formatISK(avgSalesPerDay)}</h3>
        </div>

        <div className="glass p-6 rounded-[32px] border-violet-500/30 bg-violet-500/5 group hover:bg-violet-500/10 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-violet-500/20 text-violet-400"><Activity size={20} /></div>
            <div className="text-[9px] font-black text-violet-400 bg-violet-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">✨ AI</div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">AI Mánaðarspá</p>
          <h3 className="text-2xl font-black text-white tracking-tighter italic">
            {isLoadingSmart ? "Reiknar..." : formatISK(smartData?.projectedEarnings || summary.totalSales * 1.2)}
          </h3>
        </div>

        <div className="glass p-6 rounded-[32px] border-amber-500/10 group hover:bg-amber-500/5 transition-all shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400"><Star size={20} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Árangur / klst</p>
          <h3 className="text-2xl font-black text-white tracking-tighter italic">{formatISK(summary.totalHours > 0 ? summary.totalSales / summary.totalHours : 0)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 glass p-6 md:p-8 rounded-[40px] border-white/5 relative min-h-[400px]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Söluþróun</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Síðustu 10 vaktir</p>
            </div>
            <BarChart3 className="text-indigo-400 opacity-30" size={24} />
          </div>
          {/* Added h-[300px] and min-h-[300px] to prevent ResponsiveContainer crash during zero-height phases */}
          <div className="h-[300px] min-h-[300px] w-full" style={{ minHeight: '300px' }}>
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

        <div className="glass p-8 rounded-[40px] border-indigo-500/20 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
           
          <div className="space-y-12">
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <Target size={20} className="text-indigo-400" />
                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Mánaðarmarkmið</h4>
              </div>
              <div className="relative h-40 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ v: summary.totalSales }, { v: Math.max(0, goals.monthly - summary.totalSales) }]}
                      cx="50%" cy="100%" innerRadius={60} outerRadius={85} startAngle={180} endAngle={0} dataKey="v" stroke="none" cornerRadius={10}
                    >
                      <Cell fill="#6366f1" /><Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-2 text-center">
                  <span className="text-2xl font-black text-white italic tracking-tighter">{Math.round(monthlyProgress)}%</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Breyta Markmiði (ISK)</label>
                <input 
                  type="number" 
                  step="5000"
                  value={goals.monthly} 
                  onChange={e => onUpdateGoals({...goals, monthly: parseInt(e.target.value) || 0})}
                  className="w-full bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-2xl text-center text-lg font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <Star size={20} className="text-emerald-400" />
                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Dagsmarkmið</h4>
              </div>
              <div className="relative h-40 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ v: salesToday }, { v: Math.max(0, goals.daily - salesToday) }]}
                      cx="50%" cy="100%" innerRadius={60} outerRadius={85} startAngle={180} endAngle={0} dataKey="v" stroke="none" cornerRadius={10}
                    >
                      <Cell fill="#10b981" /><Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-2 text-center">
                  <span className="text-2xl font-black text-white italic tracking-tighter">{Math.round(dailyProgress)}%</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">Breyta Markmiði (ISK)</label>
                <input 
                  type="number" 
                  step="500"
                  value={goals.daily} 
                  onChange={e => onUpdateGoals({...goals, daily: parseInt(e.target.value) || 0})}
                  className="w-full bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-2xl text-center text-lg font-black text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
