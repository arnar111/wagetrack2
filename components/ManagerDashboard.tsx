import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ScatterChart, Scatter, ZAxis, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { Shift, Sale, User, WageSummary } from '../types';
import { 
  TrendingUp, Users, Target, Zap, 
  ShieldCheck, User as UserIcon, 
  Trophy, Activity, Layers, BarChart4, LayoutGrid, BrainCircuit, Star, List, ArrowUpRight, Heart, Sword, ShoppingBag, PieChart as PieIcon, Settings, Save, AlertCircle
} from 'lucide-react';
import { PROJECTS } from '../constants';
import { calculateEffectiveHours, calculateSalesBonus } from '../utils/calculations.ts';
import { getManagerCommandAnalysis } from '../geminiService.ts';

interface ManagerDashboardProps {
  allShifts: Shift[];
  allSales: Sale[];
  allUsers: User[];
  currentUser: User;
  personalSummary: WageSummary;
}

interface TeamGoals {
  weekly: number;
  monthly: number;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ allShifts, allSales, allUsers, currentUser, personalSummary }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'projects' | 'agents'>('overview');
  const [teamGoals, setTeamGoals] = useState<TeamGoals>({ weekly: 2000000, monthly: 8000000 });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSavingGoals, setIsSavingGoals] = useState(false);
  
  // Manager's own recording state
  const [managerSaleAmount, setManagerSaleAmount] = useState<number | string>('');
  const [managerSaleProject, setManagerSaleProject] = useState('Samhjálp');

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  // Load Team Goals from Firestore
  useEffect(() => {
    const fetchGoals = async () => {
      const goalDoc = await getDoc(doc(db, "config", "team_goals"));
      if (goalDoc.exists()) {
        setTeamGoals(goalDoc.data() as TeamGoals);
      }
    };
    fetchGoals();
  }, []);

  const saveTeamGoals = async () => {
    setIsSavingGoals(true);
    try {
      await setDoc(doc(db, "config", "team_goals"), teamGoals);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingGoals(false);
    }
  };

  // Helper: Aggregate Weekly Data
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);

    const aggregate = (start: Date, label: string) => {
      const days = [];
      for(let i=0; i<7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        const daySales = allSales
          .filter(s => s.date === dStr)
          .reduce((acc, s) => acc + s.amount, 0);
        days.push({ day: d.toLocaleDateString('is-IS', { weekday: 'short' }), sales: daySales });
      }
      return days;
    };

    const currentWeek = aggregate(startOfWeek, 'Current');
    const lastWeek = aggregate(lastWeekStart, 'Previous');

    return currentWeek.map((day, idx) => ({
      name: day.day,
      current: day.sales,
      previous: lastWeek[idx].sales
    }));
  }, [allSales]);

  // Project Battle Analytics
  const projectBattle = useMemo(() => {
    const mainProjects = ['Hringurinn', 'Verið'];
    return mainProjects.map(p => {
      const pSales = allSales.filter(s => s.project === p);
      const pShifts = allShifts.filter(s => s.projectName === p);
      const totalSales = pSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = pShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      const effHours = calculateEffectiveHours(totalHours);
      const efficiency = effHours > 0 ? totalSales / effHours : 0;
      
      return {
        name: p,
        sales: totalSales,
        efficiency: Math.round(efficiency),
        hours: Math.round(effHours),
        count: pSales.length
      };
    });
  }, [allSales, allShifts]);

  // Agent Performance Index
  const agentPerformance = useMemo(() => {
    return allUsers.filter(u => u.role === 'agent').map(u => {
      const uSales = allSales.filter(s => s.userId === u.staffId);
      const uShifts = allShifts.filter(s => s.userId === u.staffId);
      
      const totalSales = uSales.reduce((acc, s) => acc + s.amount, 0);
      const totalHours = uShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      const effHours = calculateEffectiveHours(totalHours);
      
      const threshold = effHours * 636;
      const achievement = threshold > 0 ? (totalSales / threshold) * 100 : 0;
      
      return {
        name: u.name,
        staffId: u.staffId,
        team: u.team,
        sales: totalSales,
        hours: totalHours,
        effHours: effHours,
        achievement: Math.round(achievement)
      };
    }).sort((a, b) => b.achievement - a.achievement);
  }, [allUsers, allShifts, allSales]);

  // AI Analytics
  useEffect(() => {
    if (allSales.length > 0 && activeSubTab === 'overview') {
      const runAI = async () => {
        setIsLoadingAI(true);
        const res = await getManagerCommandAnalysis({ 
          weeklyTotal: allSales.reduce((acc, s) => acc + s.amount, 0),
          projects: projectBattle,
          topAgent: agentPerformance[0]?.name 
        });
        setAiAnalysis(res);
        setIsLoadingAI(false);
      };
      runAI();
    }
  }, [activeSubTab, allSales, projectBattle, agentPerformance]);

  const handleRecordSale = async () => {
    if (!managerSaleAmount) return;
    try {
      await addDoc(collection(db, "sales"), {
        amount: Number(managerSaleAmount),
        project: managerSaleProject,
        userId: currentUser.staffId,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });
      setManagerSaleAmount('');
      alert("Sala skráð!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-6 pb-2 border-b border-white/5">
        <div className="flex gap-4">
          {[
            { id: 'overview', label: 'Team Overview', icon: <Activity size={16} /> },
            { id: 'projects', label: 'Projects', icon: <PieIcon size={16} /> },
            { id: 'agents', label: 'Sales Agents', icon: <Users size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-[#d4af37] text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Goal Settings Trigger */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/2 p-2 rounded-2xl border border-white/5">
            <input 
              type="number" 
              value={teamGoals.monthly} 
              onChange={e => setTeamGoals({...teamGoals, monthly: Number(e.target.value)})}
              className="bg-transparent text-white font-black text-xs outline-none w-24 text-center"
            />
            <button onClick={saveTeamGoals} className="p-2 bg-[#d4af37]/10 text-[#d4af37] rounded-xl hover:bg-[#d4af37]/20 transition-all">
              <Save size={14} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            {/* KPI Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-8 rounded-[40px] border-[#d4af37]/20 relative overflow-hidden group">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Monthly Team Sales</p>
                <h4 className="text-4xl font-black text-white italic tracking-tighter">{formatISK(allSales.reduce((acc, s) => acc + s.amount, 0))}</h4>
                <div className="mt-4 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d4af37]" style={{ width: `${Math.min(100, (allSales.reduce((acc, s) => acc + s.amount, 0) / teamGoals.monthly) * 100)}%` }} />
                </div>
                <Activity className="absolute bottom-4 right-4 text-[#d4af37]/5" size={80} />
              </div>
              <div className="glass p-8 rounded-[40px] border-emerald-500/20 relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Team Goal Progress</p>
                <h4 className="text-4xl font-black text-emerald-400 italic tracking-tighter">
                  {Math.round((allSales.reduce((acc, s) => acc + s.amount, 0) / teamGoals.monthly) * 100)}%
                </h4>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Target: {formatISK(teamGoals.monthly)}</p>
                <Target className="absolute bottom-4 right-4 text-emerald-400/5" size={80} />
              </div>
              <div className="glass p-8 rounded-[40px] border-indigo-500/20 relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Eff. Hours Invested</p>
                <h4 className="text-4xl font-black text-white italic tracking-tighter">
                  {Math.round(calculateEffectiveHours(allShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0)))}h
                </h4>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Integrated Break Deduction (0.875x)</p>
                <ShieldCheck className="absolute bottom-4 right-4 text-indigo-500/5" size={80} />
              </div>
            </div>

            {/* Battle Comparison Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 glass p-10 rounded-[56px] border-white/5 relative overflow-hidden min-h-[450px]">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><BarChart4 size={24} /></div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Weekly Flow: This Week vs Last</h3>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest opacity-50">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#d4af37]" /> Current</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-700" /> Previous</div>
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colorCur" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4af37" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#01040f', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Area type="monotone" dataKey="current" stroke="#d4af37" strokeWidth={4} fillOpacity={1} fill="url(#colorCur)" />
                      <Area type="monotone" dataKey="previous" stroke="#1e293b" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Strategy Widget */}
              <div className="xl:col-span-4 glass p-10 rounded-[56px] border-[#d4af37]/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <BrainCircuit className="text-[#d4af37]" size={24} />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Strategy</h3>
                  </div>
                  {isLoadingAI ? (
                    <div className="space-y-4"><div className="h-20 w-full bg-white/5 rounded-3xl animate-pulse" /><div className="h-20 w-full bg-white/5 rounded-3xl animate-pulse" /></div>
                  ) : (
                    <div className="space-y-8">
                      <div>
                        <p className="text-[9px] font-black text-[#d4af37] uppercase tracking-widest mb-2">Dominant Project</p>
                        <p className="text-xl font-black text-white italic">{aiAnalysis?.topProject || "Bíð gagna..."}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Efficiency Leader</p>
                        <p className="text-xl font-black text-white italic">{aiAnalysis?.efficiencyLeader || "Óvíst..."}</p>
                      </div>
                      <div className="pt-6 border-t border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">
                          "{aiAnalysis?.strategicAdvice || "Greini gögn..."}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'projects' && (
          <motion.div key="projects" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {projectBattle.map(proj => (
                <div key={proj.name} className="glass p-10 rounded-[56px] border-white/5 relative overflow-hidden neon-border-gold">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{proj.name} Deep-Dive</h4>
                      <h3 className="text-5xl font-black text-white italic tracking-tighter">{formatISK(proj.sales)}</h3>
                      <p className="text-[10px] font-bold text-[#d4af37] mt-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Star size={12} /> {formatISK(proj.efficiency)} per effective hour
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-3xl">
                      {proj.name === 'Hringurinn' ? <Heart className="text-indigo-400" size={32} /> : <Sword className="text-violet-400" size={32} />}
                    </div>
                  </div>
                  <div className="mt-10 grid grid-cols-2 gap-4">
                    <div className="bg-white/2 p-6 rounded-3xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Effective Hours</p>
                      <p className="text-xl font-black text-white">{proj.hours}h</p>
                    </div>
                    <div className="bg-white/2 p-6 rounded-3xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Call Volume</p>
                      <p className="text-xl font-black text-white">{proj.count} units</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12 scale-150">
                    <Trophy size={180} />
                  </div>
                </div>
              ))}
            </div>

            {/* Volume Distribution Pie */}
            <div className="glass p-10 rounded-[56px] border-white/5">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-10 flex items-center gap-3">
                <PieIcon className="text-indigo-400" size={24} /> Donation Volume Distribution
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectBattle}
                      cx="50%" cy="50%" innerRadius={100} outerRadius={150} paddingAngle={8} dataKey="sales" stroke="none" cornerRadius={20}
                    >
                      {projectBattle.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#d4af37' : '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#01040f', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'agents' && (
          <motion.div key="agents" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Leaderboard */}
              <div className="xl:col-span-7 glass p-10 rounded-[56px] border-white/5">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-10">Threshold Leaderboard</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                  {agentPerformance.map((agent, idx) => (
                    <div key={agent.staffId} className="p-6 bg-white/2 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-[#d4af37]/30 transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${agent.achievement >= 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-[#d4af37] transition-colors">{agent.name}</p>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{agent.team}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black italic tracking-tighter ${agent.achievement >= 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {agent.achievement}%
                        </p>
                        <p className="text-[8px] font-black text-slate-700 uppercase mt-1">Goal: 636/hr</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Entry & Scatter */}
              <div className="xl:col-span-5 space-y-8">
                {/* Fast Entry Form */}
                <div className="glass p-10 rounded-[56px] border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent shadow-2xl">
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                    <ShoppingBag className="text-indigo-400" size={20} /> Record Your Sales
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Donation Amount</label>
                      <input 
                        type="number" 
                        value={managerSaleAmount} 
                        onChange={e => setManagerSaleAmount(e.target.value)} 
                        placeholder="ISK..." 
                        className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-2xl outline-none focus:ring-4 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Project</label>
                      <select 
                        value={managerSaleProject} 
                        onChange={e => setManagerSaleProject(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-xs uppercase tracking-widest outline-none cursor-pointer"
                      >
                        {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <button onClick={handleRecordSale} className="w-full py-6 gradient-bg rounded-[32px] text-white font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                      Save Entry
                    </button>
                  </div>
                </div>

                {/* Performance Scatter */}
                <div className="glass p-10 rounded-[56px] border-white/5 h-[350px]">
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">Agent Efficiency Matrix</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" dataKey="hours" name="Hours" unit="h" axisLine={false} tick={{fill: '#475569', fontSize: 10}} />
                      <YAxis type="number" dataKey="sales" name="Sales" unit="kr" axisLine={false} tick={{fill: '#475569', fontSize: 10}} />
                      <ZAxis type="number" dataKey="achievement" range={[50, 400]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Agents" data={agentPerformance}>
                        {agentPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.achievement >= 100 ? '#10b981' : '#d4af37'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
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