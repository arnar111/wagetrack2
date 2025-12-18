
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { Sale, Shift } from '../types';
import { PROJECTS } from '../constants';
import { PieChart, TrendingUp, Target, ShoppingBag, Clock, ChevronRight, Activity, Award } from 'lucide-react';

interface ProjectInsightsProps {
  sales: Sale[];
  shifts: Shift[];
}

const ProjectInsights: React.FC<ProjectInsightsProps> = ({ sales, shifts }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', maximumFractionDigits: 0 }).format(val);
  };

  const projectStats = useMemo(() => {
    const daysWorkedCount = new Set(shifts.map(s => s.date)).size || 1;
    
    return PROJECTS.map(p => {
      const pSales = sales.filter(s => s.project === p);
      const total = pSales.reduce((acc, s) => acc + s.amount, 0);
      const count = pSales.length;
      const uniqueDays = new Set(pSales.map(s => s.date)).size || 1;
      
      return {
        name: p,
        total,
        count,
        avgPerDay: total / uniqueDays,
        monthlyAvg: (total / uniqueDays) * 22, // Estimate
        color: PROJECTS.indexOf(p) % 2 === 0 ? '#6366f1' : '#a855f7'
      };
    }).sort((a, b) => b.total - a.total);
  }, [sales, shifts]);

  const activeStats = useMemo(() => {
    if (!selectedProject) return null;
    return projectStats.find(p => p.name === selectedProject);
  }, [selectedProject, projectStats]);

  const topProjects = projectStats.slice(0, 5);

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* 1. Samanburðaryfirlit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-8 rounded-[40px] border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Samanburður Félaga</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Topp 5 verkefni eftir heildarsölu</p>
            </div>
            <Activity className="text-indigo-400 opacity-30" size={24} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProjects} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#f8fafc', fontSize: 10, fontWeight: 900}} 
                  width={100}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.03)'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff', fontWeight: 900 }}
                  formatter={(val: number) => [formatISK(val), 'Sala']}
                />
                <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={30}>
                  {topProjects.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-[40px] border-violet-500/10 flex flex-col justify-between bg-violet-500/5">
          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-3xl inline-block text-violet-400">
              <Award size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Öflugasta Félagið</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Byggt á heildarsölu á tímabilinu</p>
            </div>
            <div className="pt-6 border-t border-white/5">
              <h5 className="text-4xl font-black text-white italic tracking-tighter">{projectStats[0]?.name}</h5>
              <p className="text-indigo-400 font-black text-xl mt-1 tracking-tighter">{formatISK(projectStats[0]?.total || 0)}</p>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center italic mt-10">
            Haltu áfram að bæta við sölum til að sjá lifandi breytingar.
          </p>
        </div>
      </div>

      {/* 2. Listi og Nánari Greining */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* List of Non-profits */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-4">Veldu félag til að kafa dýpra</h4>
          {projectStats.map((stat) => (
            <button 
              key={stat.name}
              onClick={() => setSelectedProject(stat.name)}
              className={`w-full glass p-5 rounded-[28px] flex items-center justify-between border-white/5 transition-all hover:border-indigo-500/30 group ${selectedProject === stat.name ? 'gradient-bg border-white/20 shadow-2xl scale-[1.02]' : 'bg-white/5'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm ${selectedProject === stat.name ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'}`}>
                  {stat.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className={`font-black uppercase tracking-tight text-sm ${selectedProject === stat.name ? 'text-white' : 'text-slate-300'}`}>{stat.name}</p>
                  <p className={`text-[10px] font-bold uppercase opacity-60 ${selectedProject === stat.name ? 'text-white/80' : 'text-slate-500'}`}>{stat.count} sölur</p>
                </div>
              </div>
              <ChevronRight size={18} className={`${selectedProject === stat.name ? 'text-white' : 'text-slate-700 group-hover:text-slate-400'} transition-all`} />
            </button>
          ))}
        </div>

        {/* Detailed Metrics Modal-like Area */}
        <div className="relative">
          {activeStats ? (
            <div className="glass p-8 rounded-[40px] border-indigo-500/20 sticky top-28 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                <div className="p-4 rounded-[24px] gradient-bg text-white shadow-lg">
                  <PieChart size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{activeStats.name}</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">Nákvæm árangursgreining</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white/2 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag size={14} className="text-indigo-400" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Heildarsala</p>
                  </div>
                  <p className="text-2xl font-black text-white tracking-tighter">{formatISK(activeStats.total)}</p>
                </div>

                <div className="p-6 bg-white/2 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-emerald-400" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Meðaltal / dag</p>
                  </div>
                  <p className="text-2xl font-black text-white tracking-tighter">{formatISK(activeStats.avgPerDay)}</p>
                </div>

                <div className="p-6 bg-white/2 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-violet-400" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mánaðar-spá</p>
                  </div>
                  <p className="text-2xl font-black text-white tracking-tighter">{formatISK(activeStats.monthlyAvg)}</p>
                </div>

                <div className="p-6 bg-white/2 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-amber-400" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Heildarfjöldi sala</p>
                  </div>
                  <p className="text-2xl font-black text-white tracking-tighter">{activeStats.count} <span className="text-xs opacity-50 uppercase ml-1">Stk</span></p>
                </div>
              </div>

              <div className="mt-10 p-5 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 text-center">
                 <p className="text-[10px] font-bold text-indigo-300 leading-relaxed uppercase tracking-wider italic">
                   „Sérhver sala fyrir {activeStats.name} breytir lífi fólks til hins betra.“ ❤️
                 </p>
              </div>
            </div>
          ) : (
            <div className="glass p-16 rounded-[40px] border-white/5 border-dashed border-2 flex flex-col items-center justify-center text-center h-full min-h-[500px] text-slate-700">
               <PieChart size={64} className="mb-6 opacity-20" />
               <p className="text-sm font-black uppercase tracking-widest italic">Veldu félag til að sjá nákvæmar tölur</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectInsights;
