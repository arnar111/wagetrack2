import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ScatterChart, Scatter, ZAxis, ComposedChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Shift, Sale, User, WageSummary } from '../types';
import { 
  TrendingUp, Users, Target, Zap, 
  ShieldCheck, User as UserIcon, 
  Trophy, Activity, Layers, BarChart4, LayoutGrid, BrainCircuit, Star, List, ArrowUpRight, Heart, Sword, ShoppingBag
} from 'lucide-react';
import { PROJECTS } from '../constants';
import { calculateTeamMetrics } from '../utils/managerAnalytics.ts';
import { getManagerCommandAnalysis } from '../geminiService.ts';

interface ManagerDashboardProps {
  allShifts: Shift[];
  allSales: Sale[];
  allUsers: User[];
  currentUser: User;
  personalSummary: WageSummary;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ allShifts, allSales, allUsers, currentUser, personalSummary }) => {
  const [viewMode, setViewMode] = useState<'team' | 'personal'>('team');
  const [aiAnalysis, setAiAnalysis] = useState<{ topProject: string; efficiencyLeader: string; strategicAdvice: string } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [managerSaleAmount, setManagerSaleAmount] = useState<number | string>('');
  const [managerSaleProject, setManagerSaleProject] = useState('Hringurinn');

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  // Deep Analytics: Project Battle Comparison
  const projectBattle = useMemo(() => {
    const mainProjects = ['Hringurinn', 'Verið'];
    return mainProjects.map(p => {
      const pSales = allSales.filter(s => s.project === p);
      const pShifts = allShifts.filter(s => s.projectName === p);
      const totalSales = pSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = pShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      const effectiveHours = totalHours * 0.875;
      const efficiency = effectiveHours > 0 ? totalSales / effectiveHours : 0;
      const threshold = effectiveHours * 636;
      
      return {
        name: p,
        donations: totalSales,
        efficiency: Math.round(efficiency),
        threshold: Math.round(threshold),
        hours: Math.round(totalHours),
        isAboveThreshold: totalSales > threshold
      };
    });
  }, [allSales, allShifts]);

  const teamMetrics = useMemo(() => calculateTeamMetrics(allUsers, allShifts, allSales), [allUsers, allShifts, allSales]);

  // AI Strategic Analysis Trigger
  useEffect(() => {
    const runAnalysis = async () => {
      if (allSales.length === 0 || viewMode !== 'team') return;
      setIsLoadingAI(true);
      const res = await getManagerCommandAnalysis({ projectBattle, agentLeaderboard: teamMetrics.slice(0, 10) });
      setAiAnalysis(res);
      setIsLoadingAI(false);
    };
    runAnalysis();
  }, [allSales, viewMode, projectBattle, teamMetrics]);

  const coachBonusProgress = useMemo(() => {
    const threshold = (personalSummary.totalHours * 0.875) * 636;
    return threshold > 0 ? (personalSummary.totalSales / threshold) * 100 : 0;
  }, [personalSummary]);

  const topProject = [...projectBattle].sort((a, b) => b.efficiency - a.efficiency)[0];

  return (
    <div className="space-y-8 pb-32 font-sans overflow-hidden">
      {/* COMMAND CENTER HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3">
             <div className="p-3 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
               <ShieldCheck size={32} className="text-[#d4af37]" />
             </div>
             <div>
               <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Command Center</h2>
               <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-[0.4em] opacity-70">Deep Non-Profit Strategic Intelligence</p>
             </div>
          </div>
        </motion.div>
        
        <div className="flex bg-[#0f172a] p-1.5 rounded-[24px] border border-white/5 shadow-2xl">
          <button onClick={() => setViewMode('team')} className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'team' ? 'bg-[#d4af37] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            <Users size={16} /> Team Battleview
          </button>
          <button onClick={() => setViewMode('personal')} className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'personal' ? 'bg-[#d4af37] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            <UserIcon size={16} /> Coach Profile
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'team' ? (
          <motion.div key="team" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            
            {/* NON-PROFIT PROJECT BATTLE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projectBattle.map((proj) => (
                <div key={proj.name} className={`glass p-8 rounded-[48px] relative overflow-hidden transition-all duration-500 ${proj.name === topProject.name ? 'neon-border-gold border-[#d4af37]/40 bg-gradient-to-br from-[#d4af37]/10 to-transparent' : 'border-white/5'}`}>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Heart size={12} className={proj.name === 'Hringurinn' ? 'text-indigo-400' : 'text-violet-400'} />
                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">{proj.name}</h4>
                      </div>
                      <h3 className="text-4xl font-black text-white italic tracking-tighter">{formatISK(proj.donations)}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Efficiency Rating</p>
                      <p className={`text-2xl font-black italic ${proj.isAboveThreshold ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {formatISK(proj.efficiency)} <span className="text-[10px] uppercase opacity-40">/hr</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-3 gap-4 relative z-10">
                     <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Threshold</p>
                        <p className="text-sm font-black text-white">{formatISK(proj.threshold)}</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Invested Hours</p>
                        <p className="text-sm font-black text-white">{proj.hours}h</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Status</p>
                        <p className={`text-xs font-black uppercase ${proj.isAboveThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>{proj.isAboveThreshold ? 'Dominant' : 'Trailing'}</p>
                     </div>
                  </div>

                  <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12">
                    {proj.name === topProject.name ? <Trophy size={180} /> : <Activity size={180} />}
                  </div>
                </div>
              ))}
            </div>

            {/* INTEGRATED TREND ANALYTICS */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 glass p-10 rounded-[56px] border-white/5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><BarChart4 size={24} /></div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Campaign vs. Target Analysis</h3>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest opacity-50">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#d4af37]" /> Donations</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> 636 Threshold</div>
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={projectBattle}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                       <YAxis hide />
                       <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#01040f', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }} />
                       <Bar dataKey="donations" name="Actual Donations" fill="#d4af37" radius={[15, 15, 0, 0]} barSize={60} />
                       <Line type="monotone" dataKey="threshold" name="Profit Line" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI COMMAND STRATEGY WIDGET */}
              <div className="glass p-10 rounded-[56px] border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><BrainCircuit size={150} /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-10">
                    <BrainCircuit className="text-[#d4af37]" size={24} />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Strategy Engine</h3>
                  </div>
                  {isLoadingAI ? (
                    <div className="space-y-6"><div className="h-24 w-full bg-white/5 rounded-[32px] animate-pulse" /><div className="h-24 w-full bg-white/5 rounded-[32px] animate-pulse" /></div>
                  ) : (
                    <div className="space-y-8">
                       <div className="group">
                         <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Star size={10} /> Top Recommendation</p>
                         <p className="text-sm font-bold text-slate-200 leading-relaxed italic">"Focus optimization on <span className="text-[#d4af37] font-black">{aiAnalysis?.topProject}</span> for maximum evening yields."</p>
                       </div>
                       <div>
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Trophy size={10} /> Efficiency Leader</p>
                         <p className="text-sm font-black text-white">{aiAnalysis?.efficiencyLeader}</p>
                       </div>
                       <div className="pt-6 border-t border-white/5">
                         <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">{aiAnalysis?.strategicAdvice}</p>
                       </div>
                    </div>
                  )}
                </div>
                <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-10 text-center italic opacity-40">Command Node 4 • Real-time Neural Synthesis</p>
              </div>
            </div>

            {/* LIVE AGENT INDEX */}
            <div className="glass p-10 rounded-[56px] border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400"><LayoutGrid size={24} /></div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Agent Deep-Dive Index</h3>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ranked by Threshold Achievement</p>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-white/5">
                          <th className="pb-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Commander</th>
                          <th className="pb-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                          <th className="pb-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Achievement %</th>
                          <th className="pb-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Wage Flow</th>
                          <th className="pb-8 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Est. Bonus</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {teamMetrics.map((agent) => (
                         <tr key={agent.staffId} className="group hover:bg-white/2 transition-all">
                            <td className="py-8">
                               <div className="flex items-center gap-4">
                                  <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center font-black text-[11px] transition-all group-hover:scale-110 ${agent.achievement >= 100 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                    {agent.name.charAt(0)}
                                  </div>
                                  <p className="text-sm font-black text-white">{agent.name}</p>
                               </div>
                            </td>
                            <td className="py-8"><span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">{agent.team}</span></td>
                            <td className="py-8">
                               <div className="flex items-center gap-4">
                                  <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                     <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, agent.achievement)}%` }} transition={{ duration: 1.5 }} className={`h-full ${agent.achievement >= 100 ? 'bg-emerald-500' : 'bg-[#d4af37]'}`} />
                                  </div>
                                  <span className={`text-xs font-black italic ${agent.achievement >= 100 ? 'text-emerald-400' : 'text-white'}`}>{agent.achievement}%</span>
                               </div>
                            </td>
                            <td className="py-8 font-black text-white italic tracking-tighter text-sm">{formatISK(agent.hourlyWage)} <span className="text-[9px] opacity-40 not-italic uppercase ml-1">/hr</span></td>
                            <td className="py-8 text-right font-black text-[#d4af37] text-sm">{agent.bonus > 0 ? `+${formatISK(agent.bonus)}` : '---'}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="personal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
               <div className="glass p-12 rounded-[56px] border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 to-transparent relative overflow-hidden shadow-2xl">
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                   <div className="relative h-64 w-64 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                         <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                         <motion.circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={690} initial={{ strokeDashoffset: 690 }} animate={{ strokeDashoffset: 690 - (690 * Math.min(1, coachBonusProgress/100)) }} transition={{ duration: 2, ease: "easeOut" }} className="text-[#d4af37]" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h5 className="text-6xl font-black text-white italic tracking-tighter">{Math.round(coachBonusProgress)}%</h5>
                        <p className="text-[10px] font-black text-[#d4af37] uppercase mt-2 tracking-[0.3em]">Bonus Quota</p>
                      </div>
                   </div>
                   <div className="flex-1 space-y-8">
                     <div>
                       <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">Playing Coach Performance</h3>
                       <p className="text-slate-400 font-medium leading-relaxed italic">"Leading through direct operational contribution. Your achievement pace is 1.4x the team average."</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white/2 rounded-[32px] border border-white/5 shadow-inner">
                           <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Personal Donations</p>
                           <p className="text-2xl font-black text-white tracking-tighter">{formatISK(personalSummary.totalSales)}</p>
                        </div>
                        <div className="p-6 bg-white/2 rounded-[32px] border border-white/5 shadow-inner">
                           <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Active Field Time</p>
                           <p className="text-2xl font-black text-white tracking-tighter">{personalSummary.totalHours.toFixed(1)}h</p>
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="glass p-10 rounded-[48px] border-emerald-500/20 shadow-xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400"><ShoppingBag size={20} /></div>
                     <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Fast Entry (Coach)</h4>
                  </div>
                  <div className="space-y-6">
                     <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Donation Amount</label>
                        <input type="number" value={managerSaleAmount} onChange={(e) => setManagerSaleAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border border-white/10 p-5 rounded-[24px] text-white font-black text-2xl outline-none focus:ring-2 focus:ring-emerald-500" />
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Assign to Project</label>
                        <select value={managerSaleProject} onChange={(e) => setManagerSaleProject(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-[24px] text-white font-black text-xs uppercase tracking-widest outline-none">
                           <option value="Hringurinn">Hringurinn</option>
                           <option value="Verið">Verið</option>
                        </select>
                     </div>
                     <button className="w-full py-5 bg-emerald-500 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-[24px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Record Deployment</button>
                  </div>
               </div>
               <div className="glass p-10 rounded-[48px] border-indigo-500/10 text-center relative">
                  <Activity className="mx-auto mb-4 text-indigo-400 opacity-20" size={32} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Network Sentiment</p>
                  <p className="text-sm font-black text-indigo-400 italic">"Operational stability: Optimal. Leadership presence detected."</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;