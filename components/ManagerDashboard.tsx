
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Shift, Sale, User, WageSummary } from '../types';
import { 
  TrendingUp, Users, Target, Zap, 
  ShieldCheck, User as UserIcon, 
  Trophy, Activity, Layers, BarChart4, LayoutGrid, BrainCircuit, Star, List
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
  const [momentum, setMomentum] = useState<ProjectMomentum | null>(null);
  const [aiGuidance, setAiGuidance] = useState<{ topOpportunity: string; agentToWatch: string } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  useEffect(() => {
    setMomentum(getProjectMomentum(allShifts, allSales));
  }, [allShifts, allSales]);

  useEffect(() => {
    const fetchAI = async () => {
      setIsLoadingAI(true);
      const guidance = await getManagerAIGuidance({
        projectStats: efficiencyMatrix,
        leaderboard: teamMetrics.slice(0, 5)
      });
      setAiGuidance(guidance);
      setIsLoadingAI(false);
    };
    if (viewMode === 'team' && allSales.length > 0) fetchAI();
  }, [allSales, viewMode]);

  const efficiencyMatrix = useMemo(() => {
    const projects = ['Hringurinn', 'Verið'];
    return projects.map(p => {
      const pSales = allSales.filter(s => s.project === p);
      const pShifts = allShifts.filter(s => s.projectName === p);
      const totalSales = pSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = pShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      const effectiveHours = totalHours * 0.875;
      const salesPerEffHour = effectiveHours > 0 ? totalSales / effectiveHours : 0;
      const agentCount = new Set(pShifts.map(s => s.userId)).size;

      return {
        name: p,
        totalSales,
        totalHours,
        salesPerEffHour: Math.round(salesPerEffHour),
        agentCount
      };
    });
  }, [allSales, allShifts]);

  const teamMetrics = useMemo(() => calculateTeamMetrics(allUsers, allShifts, allSales), [allUsers, allShifts, allSales]);

  const avgAchievement = teamMetrics.length > 0 
    ? teamMetrics.reduce((acc, m) => acc + m.achievement, 0) / teamMetrics.length 
    : 0;

  const topProject = efficiencyMatrix.sort((a, b) => b.salesPerEffHour - a.salesPerEffHour)[0];

  const scatterData = teamMetrics.map(m => ({
    x: m.totalHours,
    y: m.totalSales,
    name: m.name,
    achievement: m.achievement
  }));

  const coachBonusProgress = useMemo(() => {
    const threshold = (personalSummary.totalHours * 0.875) * 636;
    return threshold > 0 ? (personalSummary.totalSales / threshold) * 100 : 0;
  }, [personalSummary]);

  return (
    <div className="space-y-8 pb-32 font-sans animate-in fade-in duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#d4af37] italic uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck size={32} /> Command Center
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Team Strategy & Performance Matrix</p>
        </div>
        
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

      {viewMode === 'team' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-8 rounded-[40px] border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Team Revenue</p>
              <h4 className="text-4xl font-black text-white italic tracking-tighter">{formatISK(allSales.reduce((acc, s) => acc + s.amount, 0))}</h4>
              <p className="text-[8px] font-bold text-[#d4af37] uppercase mt-2">Active Month Total</p>
              <Activity className="absolute bottom-4 right-4 text-[#d4af37]/10" size={60} />
            </div>
            <div className="glass p-8 rounded-[40px] border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg. Achievement</p>
              <h4 className="text-4xl font-black text-white italic tracking-tighter">{Math.round(avgAchievement)}%</h4>
              <p className="text-[8px] font-bold text-emerald-400 uppercase mt-2">636 ISK/hr Efficiency</p>
              <Target className="absolute bottom-4 right-4 text-emerald-400/10" size={60} />
            </div>
            <div className="glass p-8 rounded-[40px] border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Top Project</p>
              <h4 className="text-4xl font-black text-[#d4af37] italic tracking-tighter">{topProject?.name || "Bíð gagna"}</h4>
              <p className="text-[8px] font-bold text-violet-400 uppercase mt-2">{formatISK(topProject?.salesPerEffHour || 0)} per hour</p>
              <Layers className="absolute bottom-4 right-4 text-violet-400/10" size={60} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Battle Bar Chart */}
            <div className="glass p-8 rounded-[48px] border-white/5 shadow-2xl relative overflow-hidden h-[450px]">
              <div className="flex items-center gap-3 mb-10">
                <BarChart4 className="text-[#d4af37]" size={20} />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Project Battle: Sales vs Hours</h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyMatrix} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.02)'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="totalSales" name="Total Sales" fill="#d4af37" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="totalHours" name="Total Hours" fill="#6366f1" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Efficiency Scatter Plot */}
            <div className="glass p-8 rounded-[48px] border-white/5 shadow-2xl relative overflow-hidden h-[450px]">
              <div className="flex items-center gap-3 mb-10">
                <LayoutGrid className="text-indigo-400" size={20} />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Effort vs. Efficiency Matrix</h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="x" name="Hours" unit="h" axisLine={false} tick={{fill: '#475569', fontSize: 10}} />
                    <YAxis type="number" dataKey="y" name="Sales" unit="kr" axisLine={false} tick={{fill: '#475569', fontSize: 10}} />
                    <ZAxis type="number" dataKey="achievement" range={[50, 400]} name="Achievement" unit="%" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Scatter name="Agents" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.achievement >= 100 ? '#10b981' : '#d4af37'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute bottom-6 right-8 flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[8px] font-black uppercase text-slate-500">Qualified</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#d4af37]" /> <span className="text-[8px] font-black uppercase text-slate-500">Developing</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* AI Strategy Widget */}
            <div className="xl:col-span-4 glass p-8 rounded-[40px] border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-transparent flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <BrainCircuit className="text-indigo-400" size={24} />
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Strategy Engine</h3>
                </div>
                {isLoadingAI ? (
                  <div className="space-y-4">
                    <div className="h-6 w-full bg-white/5 animate-pulse rounded-full" />
                    <div className="h-4 w-5/6 bg-white/5 animate-pulse rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Star size={10} /> Project Opportunity</p>
                      <p className="text-sm font-bold text-white leading-relaxed italic">"{aiGuidance?.topOpportunity}"</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp size={10} /> Agent to Watch</p>
                      <p className="text-sm font-bold text-white leading-relaxed italic">"{aiGuidance?.agentToWatch}"</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-8 text-center italic">Calculated using neural analysis of real-time team flow</p>
            </div>

            {/* Live Agent Table */}
            <div className="xl:col-span-8 glass p-8 rounded-[40px] border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <List className="text-[#d4af37]" size={20} />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Live Agent Performance Index</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Agent</th>
                      <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Achievement %</th>
                      <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Bonus</th>
                      <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-Time Wage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teamMetrics.map(m => (
                      <tr key={m.staffId} className="group hover:bg-white/2 transition-all">
                        <td className="py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-xl bg-[#d4af37]/10 flex items-center justify-center font-black text-[#d4af37] text-[10px]">{m.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-black text-white">{m.name}</p>
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{m.team}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6">
                           <div className="flex items-center gap-3">
                             <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <div className={`h-full transition-all duration-1000 ${m.achievement >= 100 ? 'bg-emerald-500' : 'bg-[#d4af37]'}`} style={{ width: `${Math.min(100, m.achievement)}%` }} />
                             </div>
                             <span className={`text-xs font-black ${m.achievement >= 100 ? 'text-emerald-400' : 'text-white'}`}>{m.achievement}%</span>
                           </div>
                        </td>
                        <td className="py-6 font-black text-white text-sm">{formatISK(m.bonus)}</td>
                        <td className="py-6 font-black text-[#d4af37] text-sm italic">{formatISK(m.hourlyWage)} <span className="text-[8px] not-italic opacity-40">/ hr</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-10 duration-500 space-y-8">
          {/* Playing Coach Profile (Existing Logic) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 glass p-10 rounded-[56px] border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 to-transparent relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5">
                 <ShieldCheck size={300} />
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                 <div className="relative h-48 w-48 flex items-center justify-center">
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <h5 className="text-5xl font-black text-white italic tracking-tighter">{Math.round(coachBonusProgress)}%</h5>
                      <p className="text-[10px] font-black text-slate-500 uppercase mt-2">Personal Bonus</p>
                    </div>
                 </div>

                 <div className="flex-1 space-y-8 text-center md:text-left">
                   <div>
                     <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Lead by Example</h3>
                     <p className="text-slate-400 font-medium leading-relaxed max-w-md">Sem spilandi þjálfari skráir þú þína eigin sölu á meðan þú stýrir teyminu. Þinn árangur hvetur aðra.</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Eigin Sala</p>
                        <p className="text-2xl font-black text-[#d4af37] italic">{formatISK(personalSummary.totalSales)}</p>
                     </div>
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Coach Hours</p>
                        <p className="text-2xl font-black text-white italic">{personalSummary.totalHours.toFixed(1)}h</p>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
               <div className="glass p-8 rounded-[40px] border-emerald-500/20 text-center flex-1 flex flex-col justify-center items-center">
                  <div className="p-5 bg-emerald-500/10 rounded-full mb-6">
                    <Zap className="text-emerald-400" size={32} />
                  </div>
                  <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">High Output Mode</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Personal Efficiency: {personalSummary.totalHours > 0 ? formatISK(personalSummary.totalSales / (personalSummary.totalHours * 0.875)) : 0} / eff.hr</p>
               </div>
               <div className="glass p-8 rounded-[40px] border-indigo-500/20 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Team Sentiment</p>
                  <p className="text-sm font-black text-indigo-400 italic">"Leader is consistent. Morale is high."</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
