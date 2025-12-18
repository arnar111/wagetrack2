
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Shift, Sale, User, WageSummary } from '../types';
import { 
  TrendingUp, Users, Target, Filter, Zap, 
  ArrowUpRight, Users2, Layers, ShieldCheck, User as UserIcon, 
  Trophy, Activity, ChevronRight, BarChart4, LayoutGrid, List
} from 'lucide-react';
import { getProjectMomentum, ProjectMomentum } from '../utils/managerAnalytics.ts';

interface ManagerDashboardProps {
  allShifts: Shift[];
  allSales: Sale[];
  allUsers: User[];
  currentUser: User;
  personalSummary: WageSummary;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ allShifts, allSales, allUsers, currentUser, personalSummary }) => {
  const [viewMode, setViewMode] = useState<'team' | 'personal'>('team');
  const [projectFilter, setProjectFilter] = useState<'All' | 'Hringurinn' | 'Verið'>('All');
  const [momentum, setMomentum] = useState<ProjectMomentum | null>(null);

  useEffect(() => {
    setMomentum(getProjectMomentum(allShifts, allSales));
  }, [allShifts, allSales]);

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  // Efficiency Matrix Logic
  const efficiencyMatrix = useMemo(() => {
    const projects = ['Hringurinn', 'Verið'];
    return projects.map(p => {
      const pSales = allSales.filter(s => s.project === p);
      const pShifts = allShifts.filter(s => s.projectName === p);
      const totalSales = pSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = pShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      
      // Effective Hours = Total - 12.5% breaks
      const effectiveHours = totalHours * 0.875;
      const salesPerEffHour = effectiveHours > 0 ? totalSales / effectiveHours : 0;
      const agentCount = new Set(pShifts.map(s => s.userId)).size;

      return {
        name: p,
        totalSales,
        salesPerEffHour: Math.round(salesPerEffHour),
        agentCount
      };
    });
  }, [allSales, allShifts]);

  // Threshold Leaderboard Logic (Privacy-First: Achievement %)
  const leaderboard = useMemo(() => {
    return allUsers.filter(u => u.role === 'agent').map(u => {
      const uSales = allSales.filter(s => s.userId === u.staffId);
      const uShifts = allShifts.filter(s => s.userId === u.staffId);
      const totalSales = uSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = uShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      
      // 636 ISK threshold per effective hour
      const threshold = (totalHours * 0.875) * 636;
      const achievement = threshold > 0 ? (totalSales / threshold) * 100 : 0;

      return {
        name: u.name,
        team: u.team || 'Other',
        achievement: Math.round(achievement),
        isQualified: achievement >= 100
      };
    }).sort((a, b) => b.achievement - a.achievement);
  }, [allUsers, allSales, allShifts]);

  // Coach Bonus Progress
  const coachBonusProgress = useMemo(() => {
    const threshold = (personalSummary.totalHours * 0.875) * 636;
    return threshold > 0 ? (personalSummary.totalSales / threshold) * 100 : 0;
  }, [personalSummary]);

  return (
    <div className="space-y-8 pb-32 font-sans animate-in fade-in duration-700">
      {/* View Switcher Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#d4af37] italic uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck size={32} /> Manager Command Center
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Elite Strategic Oversight</p>
        </div>
        
        <div className="flex bg-[#0f172a] p-1.5 rounded-[24px] border border-white/5 shadow-2xl">
          <button 
            onClick={() => setViewMode('team')}
            className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'team' ? 'bg-[#d4af37] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Users size={16} /> Team Overview
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
        <div className="space-y-8">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-[32px] border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Team Revenue</p>
              <h4 className="text-2xl font-black text-white italic">{formatISK(allSales.reduce((acc, s) => acc + s.amount, 0))} <span className="text-[10px] opacity-40 not-italic">ISK</span></h4>
            </div>
            <div className="glass p-6 rounded-[32px] border-indigo-500/20">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Top Efficiency</p>
              <h4 className="text-2xl font-black text-[#d4af37] italic">{formatISK(Math.max(...efficiencyMatrix.map(m => m.salesPerEffHour)))} <span className="text-[10px] opacity-40 not-italic">/hr</span></h4>
            </div>
            <div className="glass p-6 rounded-[32px] border-emerald-500/20">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Qualified Agents</p>
              <h4 className="text-2xl font-black text-emerald-400 italic">{leaderboard.filter(l => l.isQualified).length} <span className="text-[10px] opacity-40 not-italic">Units</span></h4>
            </div>
            <div className="glass p-6 rounded-[32px] border-violet-500/20">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Momentum</p>
              <h4 className="text-2xl font-black text-violet-400 italic">
                {momentum?.hringurinn && momentum?.verid ? (momentum.hringurinn > momentum.verid ? 'Hringurinn' : 'Verið') : 'Bíð gagna'}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Efficiency Matrix Matrix */}
            <div className="glass p-8 rounded-[48px] border-white/5 shadow-2xl relative overflow-hidden min-h-[400px]">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <LayoutGrid size={150} />
              </div>
              <div className="flex items-center gap-3 mb-10">
                <Layers className="text-[#d4af37]" size={20} />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Project Efficiency Matrix</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Project</th>
                      <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Revenue</th>
                      <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sales / Eff.Hr</th>
                      <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {efficiencyMatrix.map(m => (
                      <tr key={m.name} className="group hover:bg-white/2 transition-all">
                        <td className="py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${m.name === 'Hringurinn' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-violet-500/10 text-violet-400'}`}>
                            {m.name}
                          </span>
                        </td>
                        <td className="py-6 font-black text-white text-sm">{formatISK(m.totalSales)}</td>
                        <td className="py-6 font-black text-[#d4af37] text-sm">{formatISK(m.salesPerEffHour)}</td>
                        <td className="py-6 font-black text-slate-500 text-sm">{m.agentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Privacy-First Leaderboard */}
            <div className="glass p-8 rounded-[48px] border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <Trophy className="text-[#d4af37]" size={20} />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Threshold Achievement Board</h3>
              </div>
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                {leaderboard.map((agent, idx) => (
                  <div key={agent.name} className="p-5 bg-white/2 rounded-3xl border border-white/5 flex items-center justify-between hover:border-[#d4af37]/40 transition-all group">
                    <div className="flex items-center gap-5">
                      <span className="text-xs font-black text-slate-700 w-6">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-black text-white group-hover:text-[#d4af37] transition-colors">{agent.name}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${agent.team === 'Hringurinn' ? 'text-indigo-500/60' : 'text-violet-500/60'}`}>{agent.team}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black italic tracking-tighter leading-none ${agent.achievement >= 100 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {agent.achievement}%
                      </p>
                      <p className="text-[8px] font-black text-slate-700 uppercase mt-1">Goal: 636/Hr</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-10 duration-500 space-y-8">
          {/* Playing Coach Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 glass p-10 rounded-[56px] border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 to-transparent relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5">
                 <ShieldCheck size={300} />
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                 <div className="relative h-48 w-48 flex items-center justify-center">
                    {/* Recharts Pie for Circular Gauge */}
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{v: coachBonusProgress}]}>
                        <Bar dataKey="v" fill="#d4af37" radius={[20, 20, 20, 20]} />
                        <XAxis hide />
                        <YAxis domain={[0, 100]} hide />
                      </BarChart>
                    </ResponsiveContainer>
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
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Personal Efficiency: {personalSummary.totalHours > 0 ? formatISK(personalSummary.totalSales / personalSummary.totalHours) : 0} / hr</p>
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
