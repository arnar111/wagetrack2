import React, { useMemo, useState, useEffect } from 'react';
import { WageSummary, Shift, Goals, Sale } from '../types';
import { TrendingUp, Award, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Target } from 'lucide-react';
import { getSmartDashboardAnalysis } from '../geminiService.ts';

interface DashboardProps {
  summary: WageSummary;
  shifts: Shift[];
  periodShifts: Shift[];
  aiInsights: string;
  onAddClick: () => void;
  goals: Goals;
  onUpdateGoals: (g: Goals) => void;
  sales: Sale[];
  staffId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  summary, shifts, periodShifts, onAddClick, goals, onUpdateGoals, sales 
}) => {
  const [aiData, setAiData] = useState<any>(null);
  const [isShiftActive, setIsShiftActive] = useState(false);

  // Check if user is currently working to adjust the average calculation
  useEffect(() => {
    const active = !!localStorage.getItem('takk_shift_start');
    setIsShiftActive(active);
  }, []);

  // --- AI Analysis ---
  useEffect(() => {
    const fetchAI = async () => {
        if (shifts.length > 0) {
            const data = await getSmartDashboardAnalysis(shifts, goals, summary);
            setAiData(data);
        }
    };
    fetchAI();
  }, [shifts.length, summary.totalSales]);

  // --- Calculations ---
  const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));

  const metrics = useMemo(() => {
    // 1. Calculate Period Sales (Sales within the Pay Period 26th-25th)
    // Note: 'summary.totalSales' usually comes from App.tsx filtered data, 
    // but we ensure we are using the filtered period shifts/sales for consistency.
    const currentTotal = summary.totalSales;

    // 2. Count Shifts (Completed + Active)
    // If user is clocked in, we add 1 to the divisor so the average doesn't spike artificially during a shift.
    const completedShifts = periodShifts.length;
    const effectiveShiftCount = completedShifts + (isShiftActive ? 1 : 0);

    // 3. Averages
    const avgPerShift = effectiveShiftCount > 0 ? currentTotal / effectiveShiftCount : 0;
    
    // 4. Projection
    // Simple projection: (Total / ShiftsSoFar) * (TargetShifts or approx 20 a month)
    // Or simpler: Daily Goal * 20
    const projected = avgPerShift * 20; 

    return {
        total: currentTotal,
        count: effectiveShiftCount,
        average: avgPerShift,
        projected,
        progress: Math.min(100, (currentTotal / goals.monthly) * 100)
    };
  }, [summary, periodShifts, isShiftActive, goals.monthly]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER WITH AI ADVICE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Mælaborð</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2 flex items-center gap-2">
                {aiData?.trend === 'up' ? <TrendingUp size={14} className="text-emerald-400" /> : <Activity size={14} className="text-indigo-400" />}
                {aiData ? aiData.smartAdvice : "Safna gögnum..."}
            </p>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mánaðarmarkmið</p>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all" onClick={() => {
                const newGoal = prompt("Nýtt mánaðarmarkmið:", goals.monthly.toString());
                if (newGoal) onUpdateGoals({ ...goals, monthly: parseInt(newGoal) });
            }}>
                <Target size={16} className="text-indigo-400" />
                <span className="text-xl font-black text-white">{formatISK(goals.monthly)}</span>
            </div>
        </div>
      </div>

      {/* MAIN METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Sales */}
        <div className="glass p-8 rounded-[40px] border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-24 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-all" />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                        <DollarSign size={24} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-lg">
                        {metrics.progress.toFixed(1)}%
                    </span>
                </div>
                <h3 className="text-4xl font-black text-white tracking-tight mb-1">{formatISK(metrics.total)}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Heildarsala</p>
                
                {/* Progress Bar */}
                <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${metrics.progress}%` }} />
                </div>
            </div>
        </div>

        {/* Card 2: Average Per Shift (FIXED LOGIC) */}
        <div className="glass p-8 rounded-[40px] border-emerald-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10 transition-all" />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                        <Activity size={24} />
                    </div>
                    {isShiftActive && (
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg animate-pulse">
                            Vakt í gangi
                        </span>
                    )}
                </div>
                <h3 className="text-4xl font-black text-white tracking-tight mb-1">{formatISK(metrics.average)}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meðalsala á vakt</p>
                <p className="text-[10px] text-slate-600 mt-2 font-medium">
                    Reiknað út frá {metrics.count} vöktum {isShiftActive ? "(þ.m.t. núverandi)" : ""}
                </p>
            </div>
        </div>

        {/* Card 3: Shift Count & Projection */}
        <div className="glass p-8 rounded-[40px] border-violet-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-24 bg-violet-500/5 blur-[60px] rounded-full group-hover:bg-violet-500/10 transition-all" />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
                        <Calendar size={24} />
                    </div>
                </div>
                <div className="flex items-end gap-2 mb-1">
                    <h3 className="text-4xl font-black text-white tracking-tight">{metrics.count}</h3>
                    <span className="text-lg font-bold text-slate-500 mb-1">vaktir</span>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Mæting í mánuðinum</p>
                
                <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Spáð lokasölu</span>
                        <span className="text-sm font-black text-violet-300">{formatISK(metrics.projected)}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* MOTIVATIONAL QUOTE CARD */}
      {aiData?.motivationalQuote && (
        <div className="glass p-8 rounded-[32px] border-white/5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-center">
            <p className="text-lg font-black text-white italic tracking-tight">"{aiData.motivationalQuote}"</p>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-2">MorriAI</p>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={onAddClick} className="p-6 rounded-[32px] bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left">
            <div className="p-3 bg-emerald-500/20 w-fit rounded-2xl text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
            </div>
            <h4 className="text-white font-bold">Skrá Sölu</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Bæta við árangur</p>
        </button>
        <button className="p-6 rounded-[32px] bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left opacity-50 cursor-not-allowed">
            <div className="p-3 bg-rose-500/20 w-fit rounded-2xl text-rose-400 mb-3">
                <Award size={24} />
            </div>
            <h4 className="text-white font-bold">Keppnir</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Væntanlegt</p>
        </button>
      </div>

    </div>
  );
};

export default Dashboard;
