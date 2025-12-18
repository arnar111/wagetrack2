
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Shift, Sale, User } from '../types';
import { 
  TrendingUp, Users, Target, Calendar, Filter, Zap, 
  ArrowUpRight, Users2, Layers, Briefcase 
} from 'lucide-react';

interface ManagerDashboardProps {
  allShifts: Shift[];
  allSales: Sale[];
  allUsers: User[];
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ allShifts, allSales, allUsers }) => {
  const [projectFilter, setProjectFilter] = useState<'All' | 'Hringurinn' | 'Verið'>('All');
  const [dateRange, setDateRange] = useState<'month' | 'week'>('month');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

  const filteredSales = useMemo(() => {
    return allSales.filter(s => {
      const saleDate = new Date(s.date);
      const inRange = dateRange === 'month' ? saleDate >= startOfMonth : saleDate >= startOfWeek;
      const inProject = projectFilter === 'All' || s.project === projectFilter;
      return inRange && inProject;
    });
  }, [allSales, projectFilter, dateRange]);

  const filteredShifts = useMemo(() => {
    return allShifts.filter(s => {
      const shiftDate = new Date(s.date);
      const inRange = dateRange === 'month' ? shiftDate >= startOfMonth : shiftDate >= startOfWeek;
      const inProject = projectFilter === 'All' || s.projectName === projectFilter;
      return inRange && inProject;
    });
  }, [allShifts, projectFilter, dateRange]);

  const projectStats = useMemo(() => {
    const projects = ['Hringurinn', 'Verið'];
    return projects.map(p => {
      const pSales = allSales.filter(s => s.project === p);
      const pShifts = allShifts.filter(s => s.projectName === p);
      
      const totalSales = pSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = pShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      const efficiency = totalHours > 0 ? totalSales / totalHours : 0;

      return {
        name: p,
        totalSales,
        efficiency: Math.round(efficiency),
      };
    });
  }, [allSales, allShifts]);

  const teamMetrics = useMemo(() => {
    return allUsers.filter(u => u.role === 'agent').map(u => {
      const uSales = filteredSales.filter(s => s.userId === u.staffId);
      const uShifts = filteredShifts.filter(s => s.userId === u.staffId);
      
      const totalSales = uSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = uShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      
      // Threshold = (Effective Hours) * 636
      const threshold = (totalHours * 0.875) * 636;
      const bonusProgress = threshold > 0 ? (totalSales / threshold) * 100 : 0;

      return {
        name: u.name,
        staffId: u.staffId,
        team: u.team,
        sales: totalSales,
        hours: totalHours,
        threshold,
        bonusProgress: Math.min(100, bonusProgress)
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [allUsers, filteredSales, filteredShifts]);

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 pb-32">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass p-6 rounded-[32px] border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Filter size={20} />
          </div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Command Filters</h3>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value as any)}
            className="flex-1 md:w-48 bg-white/5 border border-white/10 p-3 rounded-2xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest"
          >
            <option value="All">Öll Verkefni</option>
            <option value="Hringurinn">Hringurinn</option>
            <option value="Verið">Verið</option>
          </select>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as any)}
            className="flex-1 md:w-48 bg-white/5 border border-white/10 p-3 rounded-2xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest"
          >
            <option value="month">Þessi mánuður</option>
            <option value="week">Þessi vika</option>
          </select>
        </div>
      </div>

      {/* High-Level Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-[40px] border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Managed Revenue</p>
          <h4 className="text-4xl font-black text-white tracking-tighter italic">{formatISK(filteredSales.reduce((acc, s) => acc + s.amount, 0))} <span className="text-sm opacity-50 not-italic">ISK</span></h4>
          <div className="mt-6 flex items-center gap-2 text-emerald-400">
            <ArrowUpRight size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Active Growth</span>
          </div>
        </div>
        <div className="glass p-8 rounded-[40px] border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Active Team Strength</p>
          <h4 className="text-4xl font-black text-white tracking-tighter italic">{allUsers.filter(u => u.role === 'agent').length} <span className="text-sm opacity-50 not-italic">Agents</span></h4>
          <div className="mt-6 flex items-center gap-2 text-indigo-400">
            <Users2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Across {projectFilter === 'All' ? '2' : '1'} Projects</span>
          </div>
        </div>
        <div className="glass p-8 rounded-[40px] border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent shadow-xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Team Efficiency Score</p>
          <h4 className="text-4xl font-black text-white tracking-tighter italic">
            {formatISK(filteredShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0) > 0 
              ? filteredSales.reduce((acc, s) => acc + s.amount, 0) / filteredShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0) 
              : 0)} 
            <span className="text-sm opacity-50 not-italic">/ hr</span>
          </h4>
          <div className="mt-6 flex items-center gap-2 text-amber-400">
            <Zap size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Global Hourly Performance</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Comparison Chart */}
        <div className="glass p-8 rounded-[48px] border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-10">
            <Layers className="text-indigo-400" size={20} />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Project Comparison</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                <Bar dataKey="totalSales" name="Heildarsala" radius={[10, 10, 0, 0]}>
                   {projectStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#a855f7'} />
                  ))}
                </Bar>
                <Bar dataKey="efficiency" name="Skilvirkni (/klst)" fill="#10b981" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Leaderboard & Bonus Tracker */}
        <div className="glass p-8 rounded-[48px] border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-10">
            <Target className="text-emerald-400" size={20} />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Bonus Threshold Tracker</h3>
          </div>
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {teamMetrics.map((agent) => (
              <div key={agent.staffId} className="p-5 bg-white/2 rounded-3xl border border-white/5 hover:border-indigo-500/20 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{agent.name}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${agent.team === 'Hringurinn' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-violet-500/20 text-violet-400'}`}>
                        {agent.team}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Sala: {formatISK(agent.sales)} / Markmið: {formatISK(agent.threshold)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white italic tracking-tighter">{Math.round(agent.bonusProgress)}%</p>
                    <p className="text-[8px] font-black text-emerald-400 uppercase">Efficiency: {agent.hours > 0 ? Math.round(agent.sales / agent.hours) : 0}</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${agent.bonusProgress >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500'}`} 
                    style={{ width: `${agent.bonusProgress}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
