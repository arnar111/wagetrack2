import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { Shift, Sale, User, WageSummary } from '../types';
import {
  Users, TrendingUp, DollarSign, Hash, Activity, Crown
} from 'lucide-react';

interface ManagerDashboardProps {
  allShifts: Shift[];
  allSales: Sale[];
  allUsers: User[];
  currentUser: User;
  personalSummary: WageSummary;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ allShifts, allSales, allUsers, currentUser }) => {
  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  // Get manager's team
  const myTeam = currentUser.team;
  const teamUsers = useMemo(() => allUsers.filter(u => u.team === myTeam), [allUsers, myTeam]);
  const teamUserIds = useMemo(() => new Set(teamUsers.map(u => u.staffId)), [teamUsers]);

  // Today's data
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = useMemo(() => allSales.filter(s => s.date === todayStr && teamUserIds.has(s.userId)), [allSales, todayStr, teamUserIds]);

  // Team metrics
  const totalSales = todaySales.reduce((acc, s) => acc + s.amount, 0);
  const saleCount = todaySales.length;
  const avgSale = saleCount > 0 ? totalSales / saleCount : 0;

  // Per-agent stats for today
  const agentStats = useMemo(() => {
    return teamUsers
      .filter(u => u.role === 'agent')
      .map(u => {
        const uSales = todaySales.filter(s => s.userId === u.staffId);
        const total = uSales.reduce((acc, s) => acc + s.amount, 0);
        const count = uSales.length;
        const avg = count > 0 ? total / count : 0;
        return { ...u, total, count, avg };
      })
      .sort((a, b) => b.total - a.total);
  }, [teamUsers, todaySales]);

  // Chart data: last 7 days for the team
  const weeklyChart = useMemo(() => {
    const days: { date: string; label: string; total: number; count: number }[] = [];
    const dayNames = ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = allSales.filter(s => s.date === dateStr && teamUserIds.has(s.userId));
      const total = daySales.reduce((acc, s) => acc + s.amount, 0);
      days.push({
        date: dateStr,
        label: dayNames[d.getDay()],
        total,
        count: daySales.length,
      });
    }
    return days;
  }, [allSales, teamUserIds]);

  // Best performer today
  const topAgent = agentStats[0];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{myTeam}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Yfirlit liðsins í dag</p>
        </div>
        <div className="p-3 bg-[#d4af37]/20 rounded-2xl text-[#d4af37]">
          <Users size={24} />
        </div>
      </div>

      {/* TOP 3 METRICS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-6 rounded-[32px] border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2 text-[#d4af37]">
            <DollarSign size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Heild</span>
          </div>
          <p className="text-2xl font-black text-white">{formatISK(totalSales)}</p>
          <p className="text-[10px] text-slate-500 font-bold">kr</p>
        </div>

        <div className="glass p-6 rounded-[32px] border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2 text-indigo-400">
            <Hash size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Fjöldi</span>
          </div>
          <p className="text-2xl font-black text-white">{saleCount}</p>
          <p className="text-[10px] text-slate-500 font-bold">sölur</p>
        </div>

        <div className="glass p-6 rounded-[32px] border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2 text-emerald-400">
            <TrendingUp size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Meðal</span>
          </div>
          <p className="text-2xl font-black text-white">{formatISK(avgSale)}</p>
          <p className="text-[10px] text-slate-500 font-bold">kr/sala</p>
        </div>
      </div>

      {/* BEST PERFORMER HIGHLIGHT */}
      {topAgent && topAgent.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-5 rounded-[32px] border-[#d4af37]/20 bg-gradient-to-r from-[#d4af37]/5 to-transparent flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d4af37] flex items-center justify-center">
              <Crown size={22} className="text-slate-900" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">Stjarna dagsins</p>
              <p className="text-lg font-black text-white italic">{topAgent.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-[#d4af37]">{formatISK(topAgent.total)}</p>
            <p className="text-[10px] text-slate-500 font-bold">{topAgent.count} sölur</p>
          </div>
        </motion.div>
      )}

      {/* AGENT TABLE */}
      <div className="glass p-6 rounded-[32px] border-white/10">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity size={14} /> Liðsmenn dagsins
        </h4>

        {agentStats.length === 0 ? (
          <div className="text-center py-8 text-slate-600 font-bold italic text-xs">Enginn liðsmaður skráður.</div>
        ) : (
          <div className="space-y-0">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Nafn</div>
              <div className="col-span-2 text-right">Heild</div>
              <div className="col-span-2 text-right">Fjöldi</div>
              <div className="col-span-2 text-right">Meðal</div>
            </div>

            {agentStats.map((agent, idx) => (
              <motion.div
                key={agent.staffId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`grid grid-cols-12 gap-2 px-4 py-4 items-center border-b border-white/5 last:border-0 ${idx === 0 && agent.total > 0 ? 'bg-[#d4af37]/5' : 'hover:bg-white/2'} transition-colors rounded-xl`}
              >
                <div className="col-span-1">
                  <span className={`text-sm font-black ${idx === 0 && agent.total > 0 ? 'text-[#d4af37]' : 'text-slate-600'}`}>
                    {idx + 1}
                  </span>
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400">
                    {agent.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-white truncate">{agent.name}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-black text-white">{formatISK(agent.total)}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-bold text-slate-400">{agent.count}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-bold text-emerald-400">{formatISK(agent.avg)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* WEEKLY CHART */}
      <div className="glass p-6 rounded-[32px] border-white/10">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <TrendingUp size={14} /> Síðustu 7 dagar
        </h4>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChart} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 900 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 10 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 900, fontSize: 10, textTransform: 'uppercase' }}
                formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('is-IS').format(value) + (name === 'total' ? ' kr' : ' sölur'),
                  name === 'total' ? 'Heild' : 'Fjöldi'
                ]}
              />
              <Bar dataKey="total" fill="#d4af37" radius={[8, 8, 0, 0]} name="total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default ManagerDashboard;
