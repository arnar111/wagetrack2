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

  // Check if user is currently working
  useEffect(() => {
    const active = !!localStorage.getItem('takk_shift_start');
    setIsShiftActive(active);
  }, []);

  const salesToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sales.filter(s => s.date === todayStr).reduce((acc, s) => acc + s.amount, 0);
  }, [sales]);

  useEffect(() => {
    const fetchAI = async () => {
        const data = await getSmartDashboardAnalysis(salesToday, summary.totalSales, goals);
        setAiData(data);
    };
    if (sales.length > 0) fetchAI();
  }, [salesToday, summary.totalSales, goals.daily, goals.monthly]);

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);

  const metrics = useMemo(() => {
    const currentTotal = summary.totalSales;
    const completedShifts = periodShifts.length;
    const effectiveShiftCount = completedShifts + (isShiftActive ? 1 : 0);
    const avgPerShift = effectiveShiftCount > 0 ? currentTotal / effectiveShiftCount : 0;
    const projected = avgPerShift * 20;

    return {
        total: currentTotal,
        count: effectiveShiftCount,
        average: avgPerShift,
        projected,
        progress: Math.min(100, (currentTotal / goals.monthly) * 100)
    };
  }, [summary, periodShifts, isShiftActive, goals.monthly]);

  const chartData = useMemo(() => {
    const salesByDate: Record<string, number> = {};
    periodShifts.forEach(s => {
        const d = s.date.split('T')[0];
        salesByDate[d] = (salesByDate[d] || 0) + s.totalSales;
    });
    const sortedDates = Object.keys(salesByDate).sort();
    let cumulative = 0;
    const points = sortedDates.map(date => {
        cumulative += salesByDate[date];
        return { date, value: cumulative, daily: salesByDate[date] };
    });
    if (points.length === 0) return { points: [], svgPath: "", fillPath: "", max: goals.monthly, bestDay: 0 };
    const maxVal = Math.max(goals.monthly, cumulative * 1.1);
    const width = 100;
    const height = 50;
    const svgPoints = points.map((p, i) => {
        const x = (i / (points.length - 1 || 1)) * width;
        const y = height - (p.value / maxVal) * height;
        return `${x},${y}`;
    });
    const svgPath = `M ${svgPoints.join(" L ")}`;
    const fillPath = `${svgPath} L 100,50 L 0,50 Z`;
    return { points, svgPath, fillPath, max: maxVal, bestDay: Math.max(...points.map(p => p.daily)) };
  }, [periodShifts, goals.monthly]);

  // --- MOBILE VIEW ---
  const isMobile = window.innerWidth < 1024;

  if (isMobile) {
    return (
        <div className="space-y-6 pb-24">
            
            {/* AI Highlight */}
            {aiData && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <Activity className="text-indigo-400 flex-shrink-0" size={20} />
                    <p className="text-xs font-bold text-white leading-relaxed">"{aiData.smartAdvice}"</p>
                </div>
            )}

            {/* Total Card */}
            <div className="glass p-6 rounded-[32px] border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-24 bg-indigo-500/10 blur-[60px] rounded-full" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Mánaðarheild</p>
                <h2 className="text-5xl font-black text-white tracking-tighter mb-4">{formatISK(metrics.total)}</h2>
                
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-indigo-500" style={{ width: `${metrics.progress}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>{metrics.progress.toFixed(0)}%</span>
                    <span>Markmið: {formatISK(goals.monthly)}</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-[24px] border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vaktir</p>
                    <p className="text-2xl font-black text-white">{metrics.count}</p>
                </div>
                <div className="glass p-5 rounded-[24px] border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Meðaltal</p>
                    <p className="text-2xl font-black text-emerald-400">{formatISK(metrics.average)}</p>
                </div>
            </div>

            {/* Sales Trend Mini */}
            <div className="glass p-6 rounded-[32px] border-white/10">
                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-violet-400" /> Þróun
                </h3>
                <div className="h-24 w-full">
                    {chartData.points.length > 1 ? (
                        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                            <path d={chartData.fillPath} fill="rgba(99,102,241,0.2)" />
                            <path d={chartData.svgPath} fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <p className="text-xs text-slate-500 text-center py-8">Vantar gögn</p>
                    )}
                </div>
            </div>
        </div>
    );
  }

  // --- DESKTOP VIEW (Kept Exactly as before) ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${metrics.progress}%` }} />
                </div>
            </div>
        </div>

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
                    Reiknað út frá {metrics.count} vöktum
                </p>
            </div>
        </div>

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

      <div className="glass p-8 rounded-[48px] border-white/10 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
         <div className="relative z-10 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                        <TrendingUp className="text-indigo-400" size={20} /> Söluþróun mánaðarins
                    </h3>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Besta vaktin</p>
                        <p className="text-lg font-black text-emerald-400">{formatISK(chartData.bestDay)}</p>
                    </div>
                </div>

                <div className="h-48 w-full relative">
                    {chartData.points.length > 1 ? (
                        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <line 
                                x1="0" y1={50 - (goals.monthly / chartData.max) * 50} 
                                x2="100" y2={50 - (goals.monthly / chartData.max) * 50} 
                                stroke="#475569" strokeWidth="0.5" strokeDasharray="2" 
                            />
                            <path d={chartData.fillPath} fill="url(#chartGradient)" />
                            <path d={chartData.svgPath} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            {chartData.points.map((p, i) => {
                                const x = (i / (chartData.points.length - 1)) * 100;
                                const y = 50 - (p.value / chartData.max) * 50;
                                return (
                                    <g key={i} className="group cursor-pointer">
                                        <circle cx={x} cy={y} r="1.5" className="fill-indigo-400 group-hover:fill-white transition-all group-hover:r-2" />
                                        <foreignObject x={x - 10} y={y - 15} width="40" height="20" className="opacity-0 group-hover:opacity-100 transition-opacity overflow-visible">
                                            <div className="bg-slate-900 text-white text-[6px] font-bold px-2 py-1 rounded-md text-center shadow-lg border border-white/10 whitespace-nowrap">
                                                {formatISK(p.value)}
                                            </div>
                                        </foreignObject>
                                    </g>
                                );
                            })}
                        </svg>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                            Vantar fleiri vaktir til að sýna graf
                        </div>
                    )}
                </div>
                
                <div className="flex justify-between mt-2 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>26. {new Date().getMonth() === 0 ? 'Des' : 'í síðasta mán'}</span>
                    <span>Í dag</span>
                    <span>25. {new Date().toLocaleDateString('is-IS', {month: 'short'})}</span>
                </div>
            </div>
         </div>
      </div>

      {aiData?.motivationalQuote && (
        <div className="glass p-8 rounded-[32px] border-white/5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-center">
            <p className="text-lg font-black text-white italic tracking-tight">"{aiData.motivationalQuote}"</p>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-2">MorriAI</p>
        </div>
      )}

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
