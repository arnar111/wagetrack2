
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart as RePie, 
  Pie, 
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Sale, Shift } from '../types';
import { PROJECTS } from '../constants';
import { TrendingUp, Target, ShoppingBag, ChevronRight, Activity, Award, Sparkles } from 'lucide-react';
import { getAIProjectComparison } from '../geminiService.ts';

interface ProjectInsightsProps {
  sales: Sale[];
  shifts: Shift[];
}

const ProjectInsights: React.FC<ProjectInsightsProps> = ({ sales, shifts }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    const fetchAiAnalysis = async () => {
      if (sales.length === 0) return;
      setIsLoadingAi(true);
      const res = await getAIProjectComparison(sales);
      setAiAnalysis(res);
      setIsLoadingAi(false);
    };
    fetchAiAnalysis();
  }, [sales]);

  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', maximumFractionDigits: 0 }).format(val);
  };

  const projectStats = useMemo(() => {
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
        monthlyAvg: (total / uniqueDays) * 22,
        color: PROJECTS.indexOf(p) % 2 === 0 ? '#6366f1' : '#a855f7'
      };
    }).sort((a, b) => b.total - a.total);
  }, [sales]);

  const activeStats = useMemo(() => {
    if (!selectedProject) return null;
    return projectStats.find(p => p.name === selectedProject);
  }, [selectedProject, projectStats]);

  const pieData = projectStats.filter(p => p.total > 0).map(p => ({
    name: p.name,
    value: p.total,
    color: p.color
  }));

  return (
    <div className="space-y-8 pb-32 max-w-6xl mx-auto">
      
      {/* AI Comparison Widget */}
      <div className="glass p-8 rounded-[40px] border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent relative shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">AI Verkefnagreining</h3>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">Gemini Pro samanburður</p>
          </div>
        </div>
        
        {isLoadingAi ? (
          <div className="space-y-3 py-4">
            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-5/6 bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-4/6 bg-white/5 rounded-full animate-pulse" />
          </div>
        ) : (
          <div className="p-6 bg-white/5 rounded-[32px] border border-white/5">
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
              {aiAnalysis || "Haltu áfram að selja til að fá dýpri greiningu á milli verkefna."}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-8 rounded-[40px] border-white/5 flex flex-col md:flex-row items-center gap-8">
          <div className="h-[250px] w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                  formatter={(val: number) => [formatISK(val), 'Heildarsala']}
                />
              </RePie>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 space-y-3">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Skipting sölna</h4>
             {pieData.slice(0, 4).map(p => (
               <div key={p.name} className="flex justify-between items-center text-xs">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                   <span className="font-bold text-slate-300">{p.name}</span>
                 </div>
                 <span className="font-black text-white">{formatISK(p.value)}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="glass p-8 rounded-[40px] border-violet-500/10 flex flex-col justify-between bg-violet-500/5">
          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-3xl inline-block text-violet-400">
              <Award size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Öflugasta Félagið</h4>
            </div>
            <div className="pt-6 border-t border-white/5">
              <h5 className="text-4xl font-black text-white italic tracking-tighter">{projectStats[0]?.name}</h5>
              <p className="text-indigo-400 font-black text-xl mt-1 tracking-tighter">{formatISK(projectStats[0]?.total || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-4">Gögnum kafað dýpra</h4>
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

        <div className="relative">
          {activeStats ? (
            <div className="glass p-8 rounded-[40px] border-indigo-500/20 sticky top-28 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                <div className="p-4 rounded-[24px] gradient-bg text-white shadow-lg">
                  <Award size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{activeStats.name}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white/2 rounded-3xl border border-white/5">
                  <ShoppingBag size={14} className="text-indigo-400 mb-2" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Heildarsala</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{formatISK(activeStats.total)}</p>
                </div>
                <div className="p-6 bg-white/2 rounded-3xl border border-white/5">
                  <Activity size={14} className="text-emerald-400 mb-2" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Meðaltal / dag</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{formatISK(activeStats.avgPerDay)}</p>
                </div>
                <div className="p-6 bg-white/2 rounded-3xl border border-white/5">
                  <TrendingUp size={14} className="text-violet-400 mb-2" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Mánaðarspá</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{formatISK(activeStats.monthlyAvg)}</p>
                </div>
                <div className="p-6 bg-white/2 rounded-3xl border border-white/5">
                  <Target size={14} className="text-amber-400 mb-2" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fjöldi sala</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{activeStats.count} <span className="text-xs opacity-50 uppercase ml-1">Stk</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass p-16 rounded-[40px] border-white/5 border-dashed border-2 flex flex-col items-center justify-center text-center h-full min-h-[500px] text-slate-700">
               <Activity size={64} className="mb-6 opacity-20" />
               <p className="text-sm font-black uppercase tracking-widest italic">Veldu félag til að sjá nákvæmar tölur</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectInsights;
