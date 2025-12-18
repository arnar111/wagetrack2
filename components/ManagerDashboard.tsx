import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { Shift, Sale, User, WageSummary } from '../types';
import { 
  TrendingUp, Users, Target, Zap, 
  ShieldCheck, User as UserIcon, 
  Trophy, Activity, Heart, Sword, ShoppingBag, PieChart as PieIcon, Settings, Save, X, DollarSign, ChevronDown, ChevronUp, Eye, EyeOff, BrainCircuit
} from 'lucide-react';
import { calculateEffectiveHours, getProjectMetrics, calculateVelocity } from '../utils/calculations.ts';
import { getManagerCommandAnalysis } from '../geminiService.ts';
import { PROJECTS } from '../constants.ts';

interface ManagerDashboardProps {
  allShifts: Shift[];
  allSales: Sale[];
  allUsers: User[];
  currentUser: User;
  personalSummary: WageSummary;
}

interface TeamGoals {
  monthly: number;
}

const Speedometer = ({ value, max, label }: { value: number; max: number; label: string }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="relative flex flex-col items-center justify-center p-8 glass rounded-[48px] border-[#d4af37]/30 shadow-2xl overflow-hidden min-h-[320px]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent pointer-events-none" />
      <div className="relative w-64 h-32 overflow-hidden mb-6">
        <div className="absolute top-0 left-0 w-64 h-64 border-[16px] border-white/5 rounded-full" />
        <div 
          className="absolute top-0 left-0 w-64 h-64 border-[16px] border-[#d4af37] rounded-full transition-all duration-1000 ease-out shadow-[0_0_30px_rgba(212,175,55,0.5)]"
          style={{ clipPath: `polygon(50% 50%, -50% -50%, 150% -50%, 150% 50%)`, transform: `rotate(${rotation}deg)` }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full z-10 shadow-lg border-4 border-slate-900" />
      </div>
      <div className="text-center z-10">
        <h4 className="text-5xl font-black text-white italic tracking-tighter">{Math.round(percentage)}%</h4>
        <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.3em] mt-2">{label}</p>
      </div>
    </div>
  );
};

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ allShifts, allSales, allUsers, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'agents'>('overview');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [teamGoals, setTeamGoals] = useState<TeamGoals>({ monthly: 8000000 });
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [aiPulse, setAiPulse] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [managerSaleAmount, setManagerSaleAmount] = useState<number | string>('');
  const [managerSaleProject, setManagerSaleProject] = useState(PROJECTS[0]);

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  useEffect(() => {
    const fetchGoals = async () => {
      const goalDoc = await getDoc(doc(db, "config", "team_goals"));
      if (goalDoc.exists()) setTeamGoals(goalDoc.data() as TeamGoals);
    };
    fetchGoals();
  }, []);

  const saveGoals = async () => {
    await setDoc(doc(db, "config", "team_goals"), teamGoals);
    alert("Mánaðarmarkmið vistuð!");
  };

  // Demo Data Generator
  const displayData = useMemo(() => {
    if (!isDemoMode) return { users: allUsers, shifts: allShifts, sales: allSales };
    
    const demoCharities = ["Samhjálp", "SKB", "Stígamót", "Ljósið", "Amnesty"];
    const users: User[] = [
      { id: 'g1', staffId: '101', name: 'Arnar Kristinn', role: 'agent', team: 'Hringurinn' },
      { id: 'g2', staffId: '102', name: 'Brynja Dögg', role: 'agent', team: 'Verið' },
      { id: 'g3', staffId: '103', name: 'Davíð Örn', role: 'agent', team: 'Hringurinn' },
      { id: 'g4', staffId: '104', name: 'Elísabet Jóns', role: 'agent', team: 'Verið' },
      { id: 'g5', staffId: '105', name: 'Gunnar Freyr', role: 'agent', team: 'Other' },
    ];

    const shifts: Shift[] = [];
    const sales: Sale[] = [];
    const today = new Date().toISOString().split('T')[0];

    users.forEach(u => {
      shifts.push({ id: `s-${u.id}`, userId: u.staffId, date: today, dayHours: 6, eveningHours: 2, totalSales: 0, notes: 'Sýndargögn', projectName: u.team });
      
      // Búa til sölur fyrir mismunandi góðgerðarfélög
      demoCharities.forEach(charity => {
        if (Math.random() > 0.3) {
           const amount = 5000 + Math.random() * 25000;
           sales.push({ id: `sa-${u.id}-${charity}`, userId: u.staffId, date: today, timestamp: new Date().toISOString(), amount, project: charity });
        }
      });
    });

    return { users, shifts, sales };
  }, [isDemoMode, allUsers, allShifts, allSales]);

  // Derived Metrics
  const projectStats = useMemo(() => getProjectMetrics(displayData.sales, displayData.shifts), [displayData]);
  const totalTeamSales = useMemo(() => displayData.sales.reduce((acc, s) => acc + s.amount, 0), [displayData.sales]);
  const totalTeamHours = useMemo(() => displayData.shifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0), [displayData.shifts]);
  const totalEffHours = calculateEffectiveHours(totalTeamHours);
  const velocity = useMemo(() => calculateVelocity(totalTeamSales, teamGoals.monthly), [totalTeamSales, teamGoals.monthly]);

  const agentLeaderboard = useMemo(() => {
    return displayData.users.filter(u => u.role === 'agent').map(u => {
      const uSales = displayData.sales.filter(s => s.userId === u.staffId);
      const uShifts = displayData.shifts.filter(s => s.userId === u.staffId);
      const rev = uSales.reduce((acc, s) => acc + s.amount, 0);
      const hrs = uShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
      const effH = calculateEffectiveHours(hrs);
      
      // Finna hvaða félag sölumaður selur best
      const projectTallies: Record<string, number> = {};
      uSales.forEach(s => projectTallies[s.project] = (projectTallies[s.project] || 0) + s.amount);
      const topProject = Object.entries(projectTallies).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Engin sala';

      return {
        ...u,
        totalSales: rev,
        totalHours: hrs,
        effHours: effH,
        efficiency: effH > 0 ? rev / effH : 0,
        topProject
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [displayData]);

  // AI Pulse Fetch
  useEffect(() => {
    const runAI = async () => {
      if (displayData.sales.length === 0) return;
      setIsLoadingAI(true);
      // Gemini greining á milli góðgerðarfélaga
      const res = await getManagerCommandAnalysis({ projectStats, totalTeamSales });
      setAiPulse(res);
      setIsLoadingAI(false);
    };
    runAI();
  }, [isDemoMode, activeTab]);

  const handleRecordSale = async () => {
    if (!managerSaleAmount) return;
    await addDoc(collection(db, "sales"), {
      amount: Number(managerSaleAmount),
      project: managerSaleProject,
      userId: currentUser.staffId,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
    setManagerSaleAmount('');
    alert("Sala skráð!");
  };

  const chartData = useMemo(() => {
    return Object.entries(projectStats).map(([name, data]) => ({
      name,
      sales: data.sales,
      efficiency: data.effHours > 0 ? data.sales / data.effHours : 0
    })).sort((a, b) => b.sales - a.sales);
  }, [projectStats]);

  return (
    <div className="space-y-8 pb-32">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
            <ShieldCheck size={36} className="text-[#d4af37]" /> Stjórnborð
          </h2>
          <p className="text-[10px] font-black text-[#d4af37]/60 uppercase tracking-[0.4em] mt-2">Góðgerðarfélög & Samanburður</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isDemoMode ? 'bg-indigo-500 text-white shadow-lg' : 'glass text-slate-500 hover:text-white'}`}
          >
            {isDemoMode ? <Eye size={16} /> : <EyeOff size={16} />} Sýndargögn
          </button>
          
          <div className="flex bg-[#0f172a] p-1.5 rounded-[24px] border border-white/5 shadow-2xl">
            {[
              { id: 'overview', label: 'Yfirlit', icon: <Activity size={16} /> },
              { id: 'projects', label: 'Góðgerðarfélög', icon: <Sword size={16} /> },
              { id: 'agents', label: 'Sölufólk', icon: <Users size={16} /> }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#d4af37] text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Speedometer value={totalTeamSales} max={teamGoals.monthly} label="Markmið mánaðarins" />
              
              <div className="glass p-10 rounded-[48px] border-white/5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><TrendingUp size={150} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mánaðarspá</p>
                  <h3 className="text-5xl font-black text-white italic tracking-tighter">{Math.round(velocity.pacePercent)}%</h3>
                  <p className={`text-[9px] font-bold uppercase mt-2 tracking-widest italic ${velocity.pacePercent >= 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {velocity.pacePercent >= 100 ? 'Á áætlun' : 'Undir áætlun'}
                  </p>
                </div>
                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-500 uppercase">Áætluð lokasala:</span>
                    <span className="text-white">{formatISK(velocity.projected)}</span>
                  </div>
                </div>
              </div>

              <div className="glass p-10 rounded-[48px] border-[#d4af37]/20 flex flex-col justify-between bg-gradient-to-br from-[#d4af37]/5 to-transparent relative">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <BrainCircuit className="text-[#d4af37]" size={24} />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Pulse</h3>
                  </div>
                  {isLoadingAI ? (
                    <div className="space-y-4 animate-pulse"><div className="h-4 w-full bg-white/5 rounded" /><div className="h-4 w-3/4 bg-white/5 rounded" /></div>
                  ) : (
                    <p className="text-sm font-bold text-slate-200 leading-relaxed italic">
                      "{aiPulse?.strategicAdvice || "Haltu áfram að safna gögnum fyrir nákvæmari greiningu."}"
                    </p>
                  )}
                </div>
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Öflugasta félagið</span>
                  <span className="text-xs font-black text-white uppercase italic tracking-tighter">{aiPulse?.topProject || "Samhjálp"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass p-6 rounded-[32px] border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Heildarsöfnun</p>
                <p className="text-xl font-black text-white italic">{formatISK(totalTeamSales)}</p>
              </div>
              <div className="glass p-6 rounded-[32px] border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Virkar vinnustundir</p>
                <p className="text-xl font-black text-indigo-400 italic">{totalEffHours.toFixed(1)} klst</p>
              </div>
              <div className="glass p-6 rounded-[32px] border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Árangur / Virka klst</p>
                <p className="text-xl font-black text-emerald-400 italic">{formatISK(totalEffHours > 0 ? totalTeamSales / totalEffHours : 0)}</p>
              </div>
              <div className="glass p-6 rounded-[32px] border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Fjöldi sala</p>
                <p className="text-xl font-black text-[#d4af37] italic">{displayData.sales.length} stk</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div key="projects" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="glass p-10 rounded-[56px] border-white/5 shadow-2xl">
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-10 flex items-center gap-3">
                   <Activity size={24} className="text-indigo-400" /> Tekjur per Góðgerðarfélag
                 </h3>
                 <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                          <YAxis hide />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: '#01040f', borderRadius: '16px', border: 'none'}} />
                          <Bar dataKey="sales" fill="#d4af37" radius={[15, 15, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
               </div>

               <div className="glass p-10 rounded-[56px] border-white/5 shadow-2xl">
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-10 flex items-center gap-3">
                   <Zap size={24} className="text-emerald-400" /> Skilvirkni (ISK/klst)
                 </h3>
                 <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                          <YAxis hide />
                          <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: '#01040f', borderRadius: '16px', border: 'none'}} />
                          <Bar dataKey="efficiency" fill="#10b981" radius={[15, 15, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
               </div>
            </div>

            <div className="glass p-12 rounded-[56px] border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
              <div className="flex items-center gap-4 mb-8">
                <BrainCircuit className="text-indigo-400" size={32} />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">AI Greining á Verkefnum</h3>
              </div>
              <div className="p-8 bg-white/2 rounded-[40px] border border-white/5">
                <p className="text-lg font-bold text-slate-200 leading-relaxed italic">
                  "{aiPulse?.strategicAdvice || "Greini árangur félaganna... Samhjálp og SKB virka sérstaklega vel í dag."}"
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'agents' && (
          <motion.div key="agents" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
            <div className="glass p-10 rounded-[56px] border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Sölulisti liðsins</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Raðað eftir heildarsölu í ISK</p>
              </div>

              <div className="space-y-4">
                {agentLeaderboard.map((agent, idx) => (
                  <div key={agent.staffId} className="space-y-4">
                    <button 
                      onClick={() => setExpandedAgentId(expandedAgentId === agent.staffId ? null : agent.staffId)}
                      className={`w-full p-6 rounded-[32px] border transition-all flex items-center justify-between group ${expandedAgentId === agent.staffId ? 'bg-[#d4af37]/10 border-[#d4af37]/40 shadow-2xl' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${idx < 3 ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-white/5 text-slate-600'}`}>
                          {idx + 1}
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-black text-white group-hover:text-[#d4af37] transition-all italic">{agent.name}</p>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">ID: {agent.staffId} • Teymi: {agent.team}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-12">
                         <div className="text-right">
                           <p className="text-2xl font-black text-white italic tracking-tighter">{formatISK(agent.totalSales)}</p>
                           <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Samtals Sala</p>
                         </div>
                         {expandedAgentId === agent.staffId ? <ChevronUp size={24} className="text-[#d4af37]" /> : <ChevronDown size={24} className="text-slate-800 group-hover:text-slate-500" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedAgentId === agent.staffId && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-8">
                          <div className="p-8 bg-white/2 border-x border-b border-white/5 rounded-b-[40px] grid grid-cols-1 md:grid-cols-3 gap-6 shadow-inner">
                            <div className="p-5 bg-white/2 rounded-3xl border border-white/5 text-center">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Helsta félag</p>
                              <p className="text-xl font-black text-white uppercase italic tracking-tighter">{agent.topProject}</p>
                            </div>
                            <div className="p-5 bg-white/2 rounded-3xl border border-white/5 text-center">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Skilvirkni</p>
                              <p className="text-xl font-black text-[#d4af37] italic">{formatISK(agent.efficiency)}/klst</p>
                            </div>
                            <div className="p-5 bg-white/2 rounded-3xl border border-white/5 text-center">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Virkar stundir</p>
                              <p className="text-xl font-black text-white italic">{agent.effHours.toFixed(1)}h</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYNC & GOALS FOOTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 glass p-10 rounded-[56px] border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-transparent flex flex-col md:flex-row items-center gap-10 shadow-2xl">
          <div className="flex items-center gap-6 shrink-0">
            <div className="p-5 bg-indigo-500/20 rounded-3xl text-indigo-400 shadow-xl"><ShoppingBag size={36} /></div>
            <div>
               <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Skráning stjórnanda</h4>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Loggaðu þína eigin söfnun</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
             <div className="flex-1 relative">
               <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
               <input type="number" value={managerSaleAmount} onChange={e => setManagerSaleAmount(e.target.value)} placeholder="Upphæð..." className="w-full bg-white/5 border border-white/10 p-6 pl-14 rounded-[32px] text-white font-black text-2xl outline-none focus:ring-4 focus:ring-indigo-500/20" />
             </div>
             <select value={managerSaleProject} onChange={e => setManagerSaleProject(e.target.value)} className="bg-white/5 border border-white/10 px-8 rounded-[32px] text-white font-black text-xs uppercase tracking-widest outline-none cursor-pointer">
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
             <button onClick={handleRecordSale} className="px-12 py-6 gradient-bg rounded-[32px] text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Vista</button>
          </div>
        </div>

        <div className="lg:col-span-4 glass p-10 rounded-[56px] border-[#d4af37]/20 flex flex-col justify-between shadow-2xl">
           <div className="flex items-center gap-3 mb-6">
              <Settings className="text-[#d4af37]" size={20} />
              <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Markmið Liðsins</h4>
           </div>
           <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mánaðarlegt Markmið (ISK)</label>
              <div className="flex gap-2">
                 <input type="number" value={teamGoals.monthly} onChange={e => setTeamGoals({...teamGoals, monthly: Number(e.target.value)})} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-black text-lg outline-none" />
                 <button onClick={saveGoals} className="p-4 bg-[#d4af37]/10 text-[#d4af37] rounded-2xl border border-[#d4af37]/20 hover:bg-[#d4af37]/20 transition-all"><Save size={20} /></button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;