import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Shift, Sale, User, WageSummary } from '../types';
import { 
  TrendingUp, Users, Target, Zap, 
  ShieldCheck, User as UserIcon, 
  Trophy, Activity, Layers, BarChart4, LayoutGrid, BrainCircuit, Star, List, ArrowUpRight
} from 'lucide-react';
import { getProjectMomentum, ProjectMomentum, calculateTeamMetrics } from '../utils/managerAnalytics.ts';
import { getManagerAIGuidance } from '../geminiService.ts';

interface ManagerDashboardProps {
  allShifts: Shift[];
  allSales: Sale[];
  allUsers: User[];
  currentUser: User;
  personalSummary: WageSummary;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ allShifts, allSales, allUsers, currentUser, personalSummary }) => {
  const [viewMode, setViewMode] = useState<'team' | 'personal'>('team');
  const [aiGuidance, setAiGuidance] = useState<{ topOpportunity: string; agentToWatch: string } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  // Efficiency Matrix Logic (Fixed: Cloning before sort to prevent "read only property" crash)
  const efficiencyMatrix = useMemo(() => {
    const projects = ['Hringurinn', 'Verið'];
    return projects.map(p => {
      const pSales = allSales.filter(s => s.project === p);
      const pShifts = allShifts.filter(s => s.projectName === p);
      const totalSales = pSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = pShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      
      // Effective Hours = Total - 12.5% breaks (0.875 multiplier)
      const effectiveHours = totalHours * 0.875;
      const salesPerEffHour = effectiveHours > 0 ? totalSales / effectiveHours : 0;
      const agentCount = new Set(pShifts.map(s => s.userId)).size;

      return {
        name: p,
        totalSales,
        totalHours: Math.round(totalHours),
        effectiveHours: Math.round(effectiveHours),
        salesPerEffHour: Math.round(salesPerEffHour),
        agentCount
      };
    });
  }, [allSales, allShifts]);

  const teamMetrics = useMemo(() => calculateTeamMetrics(allUsers, allShifts, allSales), [allUsers, allShifts, allSales]);

  const avgAchievement = teamMetrics.length > 0 
    ? teamMetrics.reduce((acc, m) => acc + m.achievement, 0) / teamMetrics.length 
    : 0;

  // Fix: Cloning the array with [...] before sorting to avoid mutating read-only data
  const topProject = [...efficiencyMatrix].sort((a, b) => b.salesPerEffHour - a.salesPerEffHour)[0];

  const scatterData = teamMetrics.map(m => ({
    x: m.totalHours,
    y: m.totalSales,
    name: m.name,
    achievement: m.achievement
  }));

  useEffect(() => {
    const fetchAI = async () => {
      if (allSales.length === 0 || viewMode !== 'team') return;
      setIsLoadingAI(true);
      const guidance = await getManagerAIGuidance({
        projectStats: efficiencyMatrix,
        leaderboard: teamMetrics.slice(0, 5)
      });
      setAiGuidance(guidance);
      setIsLoadingAI(false);
    };
    fetchAI();
  }, [allSales, viewMode, efficiencyMatrix, teamMetrics]);

  const coachBonusProgress = useMemo(() => {
    const threshold = (personalSummary.totalHours * 0.875) * 636;
    return threshold > 0 ? (personalSummary.totalSales / threshold) * 100 : 0;
  }, [personalSummary]);

  return (
    <div className="space-y-8 pb-32 font-sans overflow-hidden">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-black text-[#d4af37] italic uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck size={32} /> Command Center
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Strategic Performance & Oversight</p>
        </motion.div>
        
        <div className="flex bg-[#0f172a] p-1.5 rounded-[24px] border border-white/5 shadow-2xl">
          <button 
            onClick={() => setViewMode('team')}
            className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'team' ? 'bg-[#d4af37] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Users size={16} /> Team Oversight
          </button>
          <button 
            onClick={() => setViewMode('personal')}
            className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'personal' ? 'bg-[#d4af37] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <UserIcon size={16} /> Playing Coach
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'team' ? (
          <motion.div 
            key="team-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* BIG NUMBER KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-8 rounded-[40px] border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <Activity size={100} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Monthly Team Revenue</p>
                <h4 className="text-4xl font-black text-white italic tracking-tighter">
                  {formatISK(allSales.reduce((acc, s) => acc + s.amount, 0))}
                </h4>
                <div className="mt-4 flex items-center gap-2 text-[#d4af37]">
                  <ArrowUpRight size={14} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Active Traffic Flow</span>
                </div>
              </div>

              <div className="glass p-8 rounded-[40px] border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <Target size={100} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg. Efficiency</p>
                <h4 className="text-4xl font-black text-white italic tracking-tighter">
                  {Math.round(avgAchievement)}%
                </h4>
                <p className="text-[8px] font-bold text-emerald-500 uppercase mt-2 tracking-widest">Team Performance to 636/Hr</p>
              </div>

              <div className="glass p-8 rounded-[40px] border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <Layers size={100} />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dominant Project</p>
                <h4 className="text-4xl font-black text-[#d4af37] italic tracking-tighter">
                  {topProject?.name || "Pending..."}
                </h4>
                <p className="text-[8px] font-bold text-violet-400 uppercase mt-2 tracking-widest">
                  {topProject ? `${formatISK(topProject.salesPerEffHour)} per effective hr` : 'Awaiting data...'}
                </p>
              </div>
            </div>

            {/* COMPARISON CHARTS SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Project Battle: Bar Chart */}
              <div className="glass p-8 rounded-[48px] border-white/5 shadow-2xl relative overflow-hidden min-h-[450px]">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <BarChart4 size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Project Battle: Sales vs. Hours</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={efficiencyMatrix} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="totalSales" name="Raw Sales (ISK)" fill="#d4af37" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="totalHours" name="Invested Hours" fill="#6366f1" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Agent Performance Scatter Plot */}
              <div className="glass p-8 rounded-[48px] border-white/5 shadow-2xl relative overflow-hidden min-h-[450px]">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <LayoutGrid size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Effort vs. Efficiency Matrix</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" dataKey="x" name="Hours" unit="h" axisLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 700}} />
                      <YAxis type="number" dataKey="y" name="Sales" unit=" kr" axisLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 700}} />
                      <ZAxis type="number" dataKey="achievement" range={[100, 1000]} name="Achievement" unit="%" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <Scatter name="Agents" data={scatterData}>
                        {scatterData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.achievement >= 100 ? '#10b981' : '#d4af37'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute bottom-6 left-8 flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-[8px] font-black uppercase text-slate-500">Qualified (100%+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                    <span className="text-[8px] font-black uppercase text-slate-500">Developing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LOWER STRATEGY ROW */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* AI STRATEGY WIDGET */}
              <div className="xl:col-span-4 glass p-8 rounded-[40px] border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-transparent flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BrainCircuit size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <BrainCircuit className="text-indigo-400" size={24} />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Strategy Engine</h3>
                  </div>
                  {isLoadingAI ? (
                    <div className="space-y-6">
                      <div className="h-20 w-full bg-white/5 rounded-3xl animate-pulse" />
                      <div className="h-20 w-full bg-white/5 rounded-3xl animate-pulse" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                          <Star size={10} className="text-[#d4af37]" />
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Project Opportunity</p>
                        </div>
                        <p className="text-sm font-bold text-white leading-relaxed italic group-hover:text-indigo-200">
                          "{aiGuidance?.topOpportunity || "Gathering more data for neural analysis..."}"
                        </p>
                      </div>
                      <div className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={10} className="text-emerald-400" />
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Agent to Watch</p>
                        </div>
                        <p className="text-sm font-bold text-white leading-relaxed italic group-hover:text-emerald-200">
                          "{aiGuidance?.agentToWatch || "Calculating individual momentum trends..."}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-8 text-center italic opacity-50">
                  Powered by Gemini 3 Pro • Real-time Pattern Recognition
                </p>
              </div>

              {/* LIVE AGENT PERFORMANCE TABLE */}
              <div className="xl:col-span-8 glass p-8 rounded-[40px] border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                    <List size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Live Agent Performance Index</h3>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Agent</th>
                        <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Threshold Status</th>
                        <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Bonus</th>
                        <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-Time Wage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {teamMetrics.map(m => (
                        <tr key={m.staffId} className="group hover:bg-white/2 transition-all">
                          <td className="py-6">
                            <div className="flex items-center gap-4">
                              <div className="h-9 w-9 rounded-xl bg-[#d4af37]/10 flex items-center justify-center font-black text-[#d4af37] text-[10px] border border-[#d4af37]/20 group-hover:scale-110 transition-transform">
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-white">{m.name}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{m.team}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, m.achievement)}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className={`h-full ${m.achievement >= 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[#d4af37]'}`} 
                                />
                              </div>
                              <span className={`text-[10px] font-black tracking-tighter ${m.achievement >= 100 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {m.achievement}%
                              </span>
                            </div>
                          </td>
                          <td className="py-6">
                            <span className={`text-sm font-black italic tracking-tighter ${m.bonus > 0 ? 'text-[#d4af37]' : 'text-slate-600'}`}>
                              {m.bonus > 0 ? `+${formatISK(m.bonus)}` : '---'}
                            </span>
                          </td>
                          <td className="py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white italic tracking-tighter">
                                {formatISK(m.hourlyWage)} <span className="text-[8px] opacity-40 not-italic uppercase tracking-widest ml-1">/ hr</span>
                              </span>
                              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">Gross Integrated Rate</p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="personal-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Playing Coach Profile Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 glass p-10 rounded-[56px] border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 to-transparent relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-12 opacity-5 scale-125">
                   <ShieldCheck size={300} />
                 </div>
                 
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                   <div className="relative h-56 w-56 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#d4af37]/5 rounded-full border-4 border-dashed border-[#d4af37]/20 animate-[spin_20s_linear_infinite]" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.h5 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-6xl font-black text-white italic tracking-tighter"
                        >
                          {Math.round(coachBonusProgress)}%
                        </motion.h5>
                        <p className="text-[10px] font-black text-[#d4af37] uppercase mt-2 tracking-[0.2em]">1604 Bonus Track</p>
                      </div>
                   </div>

                   <div className="flex-1 space-y-8 text-center md:text-left">
                     <div>
                       <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-3">Lead by Example</h3>
                       <p className="text-slate-400 font-medium leading-relaxed max-w-md">
                         As a playing coach, you maintain management oversight while driving personal sales targets. Your performance sets the pace for the entire team.
                       </p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 shadow-inner">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Personal Sales</p>
                          <p className="text-2xl font-black text-[#d4af37] italic tracking-tighter">{formatISK(personalSummary.totalSales)}</p>
                       </div>
                       <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 shadow-inner">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Coaching Hours</p>
                          <p className="text-2xl font-black text-white italic tracking-tighter">{personalSummary.totalHours.toFixed(1)}h</p>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                 <div className="glass p-8 rounded-[48px] border-emerald-500/20 text-center flex-1 flex flex-col justify-center items-center shadow-xl relative overflow-hidden group">
                    <div className="p-6 bg-emerald-500/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                      <Zap className="text-emerald-400" size={40} />
                    </div>
                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">Peak Output</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                      Personal Efficiency: <span className="text-emerald-400 font-black">{personalSummary.totalHours > 0 ? formatISK(personalSummary.totalSales / (personalSummary.totalHours * 0.875)) : 0}</span> / eff.hr
                    </p>
                    <div className="absolute top-0 right-0 p-4">
                       <Star size={16} className="text-emerald-500 opacity-20" />
                    </div>
                 </div>

                 <div className="glass p-8 rounded-[48px] border-indigo-500/20 text-center shadow-xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Coach Status Indicator</p>
                    <p className="text-lg font-black text-indigo-400 italic leading-snug">
                      "Operational excellence maintained. Consistency within target range."
                    </p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;