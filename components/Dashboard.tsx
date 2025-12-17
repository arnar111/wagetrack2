
import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Shift, WageSummary } from '../types';
import { DollarSign, Clock, TrendingUp, Sparkles, ShoppingBag, BrainCircuit, ChevronRight } from 'lucide-react';

interface DashboardProps {
  summary: WageSummary;
  shifts: Shift[];
  aiInsights: string;
  onAddClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ summary, shifts, aiInsights, onAddClick }) => {
  const chartData = shifts.slice(0, 10).reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString('is-IS', { weekday: 'short' }),
    val: s.hourlyRate
  }));

  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-3xl group hover:border-indigo-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <DollarSign size={24} />
            </div>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Áætluð Nettó Laun</p>
          <h3 className="text-2xl font-bold text-white">{formatISK(summary.netPay)}</h3>
        </div>

        <div className="glass p-6 rounded-3xl group hover:border-violet-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Heildarstundir</p>
          <h3 className="text-2xl font-bold text-white">{summary.totalHours.toFixed(1)} klst</h3>
        </div>

        <div className="glass p-6 rounded-3xl group hover:border-amber-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Heildarsala</p>
          <h3 className="text-2xl font-bold text-white">{formatISK(summary.totalSales)}</h3>
        </div>

        <div className="glass p-6 rounded-3xl group hover:border-rose-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
              <Sparkles size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Væntanleg útborgun</p>
          <h3 className="text-2xl font-bold text-white">{formatISK(summary.netPay)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-bold text-white">Launahraði</h4>
            <div className="bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 rounded-full px-4 py-1.5">
              Síðustu 10 vaktir
            </div>
          </div>
          <div className="h-[300px] w-full">
            {shifts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <p>Engin gögn til að sýna</p>
              </div>
            )}
          </div>
        </div>

        <div className="gradient-bg text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BrainCircuit size={120} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-indigo-200 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase opacity-80">AI Greining</span>
            </div>
            <h4 className="text-2xl font-bold mb-6">Hvernig gengur?</h4>
            <div className="space-y-4 text-indigo-50 leading-relaxed min-h-[160px]">
              {aiInsights ? (
                <p className="text-sm font-medium italic">"{aiInsights}"</p>
              ) : (
                <p className="text-sm opacity-70">Smelltu á 'AI Innsýn' hnappinn efst til að fá greiningu á þínum vöktum og sölu.</p>
              )}
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2">
            Nákvæmari Greining <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
