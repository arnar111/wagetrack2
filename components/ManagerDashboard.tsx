
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LineChart, Line
} from 'recharts';
import { Shift, Sale, User, WageSummary } from '../types';
import { 
  TrendingUp, Users, Target, Filter, Zap, 
  ArrowUpRight, Users2, Layers, ShieldCheck, User as UserIcon, 
  Trophy, Activity, ChevronRight, BarChart4
} from 'lucide-react';
import { calculateSalesBonus } from '../utils/calculations.ts';
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

  // Threshold Leaderboard Logic
  const thresholdLeaderboard = useMemo(() => {
    return allUsers.filter(u => u.role === 'agent').map(u => {
      const uSales = allSales.filter(s => s.userId === u.staffId);
      const uShifts = allShifts.filter(s => s.userId === u.staffId);
      const totalSales = uSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = uShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      const threshold = (totalHours * 0.875) * 636;
      const achievement = threshold > 0 ? (totalSales / threshold) * 100 : 0;

      return {
        name: u.name,
        team: u.team,
        achievement: Math.round(achievement),
        rawSales: totalSales
      };
    }).sort((a, b) => b.achievement - a.achievement);
  }, [allUsers, allSales, allShifts]);

  // Personal Bonus Progress (Manager as "Playing Coach")
  const personalBonusProgress = useMemo(() => {
    const totalHours = personalSummary.totalHours;
    const threshold = (totalHours * 0.875) * 636;
    return threshold > 0 ? (personalSummary.totalSales / threshold) * 100 : 0;
  }, [personalSummary]);

  return (
    <div className="space-y-8 pb-32 font-sans">
      {/* View Mode & Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#d4af37] italic uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck size={32} /> Manager Command Center
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Elite Performance & Oversight</p>
        </div>
        
        <div className="flex bg-[#0f172a] p-1.5 rounded-[24px] border border-white/5 shadow-2xl">
          <button 
            onClick={() => setViewMode('team')}
            className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'team' ? 'bg-[#d4af37] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <Users size={16} className="inline mr-2" /> Team Oversight
          </button>
          <button 
            onClick={() => setViewMode('personal')}
            className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'personal' ? 'bg-[#d4af37] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <UserIcon size={16} className="inline mr-2" /> Playing Coach
          </button>
        </div>
      </div>

      {viewMode === 'team' ? (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-[32px] border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Managed Volume</p>
              <h4 className="text-2xl font-black text-white italic">{formatISK(allSales.reduce((acc, s) => acc + s.amount, 0))}</h4>
              <div className="mt-4 flex items-center gap-2 text-[#d4af37]">
                <Activity size={14} />
                <span className="text-[8px] font-black uppercase">Real-time Traffic</span>
              </div>
            </div>
            <div className="glass p-6 rounded-[32px] border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Momentum</p>
              <h4 className="text-2xl font-black text-[#d4af37] italic">
                {momentum?.hringurinn && momentum?.verid ? (momentum.hringurinn > momentum.verid ? 'Hringurinn' : 'Verið') : 'Calculating...'}
              </h4>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{momentum?.recommendation}</p>
            </div>
            <div className="glass p-6 rounded-[32px] border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Agent Participation</p>
              <h4 className="text-2xl font-black text-white italic">{allUsers.filter(u => u.role === 'agent').length} <span className="text-xs opacity-50">Units</span></h4>
            </div>
            <div className="glass p-6 rounded-[32px] border-emerald-500/20">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Peak Efficiency</p>
              <h4 className="text-2xl font-black text-emerald-400 italic">
                {formatISK(Math.max(...efficiencyMatrix.map(m => m.salesPerEffHour)))} <span className="text-xs">/ hr</span>
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Efficiency Matrix Table */}
            <div className="glass p-8 rounded-[40px] border-white/5 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BarChart4 size={120} />
              </div>
              <div className="flex items-center gap-3 mb-8">
                <Layers className="text-[#d4af37]" size={20} />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Project Efficiency Matrix</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</th>
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sales/Eff.Hr</th>
                      <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Agents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {efficiencyMatrix.map(m => (
                      <tr key={m.name} className="group">
                        <td className="py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${m.name === 'Hringurinn' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-violet-500/10 text-violet-400'}`}>
                            {m.name}
                          </span>
                        </td>
                        <td className="py-5 font-black text-white text-sm">{formatISK(m.totalSales)}</td>
                        <td className="py-5 font-black text-[#d4af37] text-sm">{formatISK(m.salesPerEffHour)}</td>
                        <td className="py-5 font-black text-slate-400 text-sm">{m.agentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Threshold Leaderboard */}
            <div className="glass p-8 rounded-[40px] border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Trophy className="text-[#d4af37]" size={20} />
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Performance Threshold Leaderboard</h3>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {thresholdLeaderboard.map((agent, idx) => (
                  <div key={agent.name} className="p-4 bg-white/2 rounded-[24px] border border-white/5 flex items-center justify-between hover:border-[#d4af37]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-slate-600">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-black text-white">{agent.name}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{agent.team}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black italic tracking-tighter ${agent.achievement >= 100 ? 'text-emerald-400' : 'text-[#d4af37]'}`}>
                        {agent.achievement}%
                      </p>
                      <p className="text-[8px] font-black text-slate-600 uppercase">of 636 ISK/hr Goal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Personal Performance for Playing Coach */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 glass p-10 rounded-[48px] border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/5 to-transparent relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5">
                 <Trophy size={300} />
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className="relative h-48 w-48 flex items-center justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={[{ val: personalBonusProgress }]}>
                        <Bar dataKey="val" fill="#d4af37" radius={[10, 10, 10, 10]} />
                     </BarChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <p className="text-4xl font-black text-white italic tracking-tighter">{Math.round(personalBonusProgress)}%</p>
                     <p className="text-[8px] font-black text-slate-500 uppercase">Bonus Track</p>
                   </div>
                 </div>
                 
                 <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Coach's Bonus Status</h3>
                      <p className="text-sm text-slate-400 font-medium">You are recording sales as a manager. Keep the lead!</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Personal Sales</p>
                         <p className="text-xl font-black text-white">{formatISK(personalSummary.totalSales)}</p>
                       </div>
                       <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Coach Hours</p>
                         <p className="text-xl font-black text-white">{personalSummary.totalHours.toFixed(1)}h</p>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
            
            <div className="lg:col-span-4 glass p-8 rounded-[48px] border-white/5 flex flex-col justify-center text-center">
               <div className="p-6 bg-[#d4af37]/10 rounded-full mx-auto mb-6">
                 <Zap className="text-[#d4af37]" size={40} />
               </div>
               <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Lead by Example</h4>
               <p className="text-sm text-slate-500 font-medium leading-relaxed">
                 Managers at TAKK are playing coaches. Your efficiency sets the pace for the entire team.
               </p>
               <div className="mt-8 pt-8 border-t border-white/5">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Next Milestone</p>
                 <p className="text-2xl font-black text-[#d4af37] italic">115% Stretch</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
