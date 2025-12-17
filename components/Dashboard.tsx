
import React, { useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Shift, WageSummary, Goals } from '../types';
import { DollarSign, Clock, TrendingUp, Sparkles, ShoppingBag, BrainCircuit, ChevronRight, Target } from 'lucide-react';

interface DashboardProps {
  summary: WageSummary;
  shifts: Shift[];
  aiInsights: string;
  onAddClick: () => void;
  goals: Goals;
  onUpdateGoals: (g: Goals) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ summary, shifts, aiInsights, onAddClick, goals, onUpdateGoals }) => {
  const chartData = shifts.slice(0, 10).reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString('is-IS', { weekday: 'short' }),
    val: s.totalSales
  }));

  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', maximumFractionDigits: 0 }).format(val);
  };

  const monthlyProgress = Math.min(100, (summary.totalSales / (goals.monthly || 1)) * 100);

  return (
    <div className="space-y-8">
      {/* Markmið Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-[40px] border-indigo-500/20 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-indigo-400" />
            <h4 className="text-xl font-black text-white">Mánaðarmarkmið</h4>
          </div>
          <div className="flex items-end gap-4 mb-4">
             <input 
               type="number"
               value={goals.monthly}
               onChange={e => onUpdateGoals({...goals, monthly: parseInt(e.target.value) || 0})}
               className="bg-transparent text-4xl font-black text-white outline-none w-1/2 border-b-2 border-white/10 focus:border-indigo-500"
             />
             <span className="text-slate-500 font-bold mb-1">ISK</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full gradient-bg transition-all duration-1000" style={{ width: `${monthlyProgress}%` }} />
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {Math.round(monthlyProgress)}% af markmiði náð
          </p>
        </div>

        <div className="glass p-8 rounded-[40px] border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-emerald-400" />
            <h4 className="text-xl font-black text-white">Dagsmarkmið</h4>
          </div>
          <div className="flex items-end gap-4">
             <input 
               type="number"
               value={goals.daily}
               onChange={e => onUpdateGoals({...goals, daily: parseInt(e.target.value) || 0})}
               className="bg-transparent text-4xl font-black text-white outline-none w-1/2 border-b-2 border-white/10 focus:border-emerald-500"
             />
             <span className="text-slate-500 font-bold mb-1">ISK</span>
          </div>
          <p className="mt-6 text-xs font-bold text-emerald-400/80">
            Hafðu trú á þér í dag! 🚀
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-3xl group hover:border-indigo-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400"><DollarSign size={24} /></div>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Nettó Laun</p>
          <h3 className="text-2xl font-bold text-white">{formatISK(summary.netPay)}</h3>
        </div>

        <div className="glass p-6 rounded-3xl group hover:border-violet-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400"><Clock size={24} /></div>
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Stundir samtals</p>
          <h3 className="text-2xl font-bold text-white">{summary.totalHours.toFixed(1)} klst</h3>
        </div>

        <div className="glass p-6 rounded-3xl group hover:border-amber-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400"><ShoppingBag size={24} /></div>
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Sala samtals</p>
          <h3 className="text-2xl font-bold text-white">{formatISK(summary.totalSales)}</h3>
        </div>

        <div className="glass p-6 rounded-3xl group hover:border-rose-500/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400"><Sparkles size={24} /></div>
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Meðaltal Sölu</p>
          <h3 className="text-2xl font-bold text-white">{formatISK(summary.totalHours > 0 ? summary.totalSales / summary.totalHours : 0)}/h</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-bold text-white">Söluþróun</h4>
            <div className="bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 rounded-full px-4 py-1.5">Síðustu 10 skráningar</div>
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
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gradient-bg text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit size={120} /></div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-indigo-200 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase opacity-80">AI Greining</span>
            </div>
            <h4 className="text-2xl font-bold mb-6">Innsýn í þinn vöxt</h4>
            <div className="space-y-4 text-indigo-50 leading-relaxed min-h-[160px]">
              {aiInsights ? (
                <p className="text-sm font-medium italic">"{aiInsights}"</p>
              ) : (
                <p className="text-sm opacity-70">Notaðu 'AI Innsýn' hnappinn efst til að fá ráðleggingar um sölutækni og vinnutíma.</p>
              )}
            </div>
          </div>
          <button className="w-full mt-6 py-3 bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2">
            Sjá nánar <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
