import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shift, Sale, Goals, Level } from '../types';
import { PROJECTS } from '../constants';
import { LEVELS } from '../utils/gamification.ts';
import { getRoundedTime, calculateShiftSplit } from '../utils/time.ts';
import BountyCard from './gamification/BountyCard.tsx';
import LevelProgress from './gamification/LevelProgress.tsx';
import NumberTicker from './NumberTicker.tsx';
import {
    ShoppingBag,
    TrendingUp,
    Clock,
    LogIn,
    LogOut,
    CheckCircle2,
    Sparkles,
    Target,
    X,
    Edit2,
    Trash2,
    UserPlus,
    TrendingUp as TrendingUpIcon,
    Plus,
    Minus,
    AlertTriangle,
    Ghost,
    Zap // <--- Added
} from 'lucide-react';

interface RegistrationProps {
    onSaveShift: (shift: Shift) => void;
    onSaveSale: (sale: Sale) => void;
    onDeleteSale: (saleId: string) => void;
    onUpdateSale: (sale: Sale) => void;
    currentSales: Sale[];
    shifts: Shift[];
    editingShift: Shift | null;
    goals: Goals;
    onUpdateGoals: (g: Goals) => void;
    userRole: string;
    userId: string;
    dailyBounties?: { task: string, reward: string }[];
    coachPersonality?: string; // <--- Added

    // Global Shift Props
    isShiftActive: boolean;
    clockInTime: Date | null;
    onClockIn: (goal: number) => void;
    onClockOut: (shiftData: any) => void;
}

const Registration: React.FC<RegistrationProps> = ({
    onSaveShift, onSaveSale, onDeleteSale, onUpdateSale, currentSales, shifts, editingShift, goals, onUpdateGoals, userRole, userId, dailyBounties, coachPersonality = "standard",
    isShiftActive, clockInTime, onClockIn, onClockOut
}) => {
    const [now, setNow] = useState(new Date());
    const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'info' } | null>(null);
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    // --- GAMIFICATION STATE ---
    const [showConfetti, setShowConfetti] = useState(false);
    const [showInterceptor, setShowInterceptor] = useState(false);
    const [interceptorMsg, setInterceptorMsg] = useState("");

    // Goal Input Modal State
    const [showGoalInput, setShowGoalInput] = useState(false);
    const [tempGoal, setTempGoal] = useState(goals.daily.toString());

    // Editing Sale State
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [editAmount, setEditAmount] = useState(0);
    const [editProject, setEditProject] = useState(PROJECTS[0]);
    const [editType, setEditType] = useState<'new' | 'upgrade'>('new');

    // Live Hours State
    const [liveHours, setLiveHours] = useState({ day: 0, evening: 0 });

    // New Sale State
    const [saleType, setSaleType] = useState<'new' | 'upgrade'>('new');
    const [saleData, setSaleData] = useState({
        amount: 0,
        project: PROJECTS[0]
    });

    // --- WINGMAN LOGIC ---
    const [wingmanMsg, setWingmanMsg] = useState<string | null>(null);

    useEffect(() => {
        const checkWingman = async () => {
            if (isShiftActive && Math.random() > 0.05) { // 5% chance every 30s check implicitly or on mount
                // In real app, check time diff. 
            }
            if (isShiftActive && Math.random() > 0.7) {
                const msg = await import('../geminiService').then(m => m.getWingmanMessage(45, coachPersonality));
                setWingmanMsg(msg);
            }
        };
        // Simple trigger on mount for demo
        if (isShiftActive) checkWingman();
    }, [isShiftActive, coachPersonality]);

    // --- Initial Load ---
    useEffect(() => {
        setTempGoal(goals.daily.toString());
    }, [goals.daily]);

    useEffect(() => {
        if (editingSale) {
            setEditAmount(editingSale.amount);
            setEditProject(editingSale.project);
            setEditType(editingSale.saleType || 'new');
        }
    }, [editingSale]);

    // --- Live Timer ---
    useEffect(() => {
        const updateTime = () => {
            const current = new Date();
            setNow(current);

            if (isShiftActive && clockInTime) {
                const roundedNow = getRoundedTime(current);
                const roundedStart = getRoundedTime(clockInTime);
                setLiveHours(calculateShiftSplit(roundedStart, roundedNow));
            } else {
                setLiveHours({ day: 0, evening: 0 });
            }
        };

        updateTime();
        const timer = setInterval(updateTime, 30000);
        return () => clearInterval(timer);
    }, [isShiftActive, clockInTime]);

    // --- Notification Auto-Dismiss ---
    useEffect(() => {
        if (notification) {
            const notifTimer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(notifTimer);
        }
    }, [notification]);

    // --- Data Calculations ---
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = useMemo(() => currentSales.filter(s => s.date === todayStr), [currentSales, todayStr]);
    const totalSalesToday = useMemo(() => todaySales.reduce((acc, s) => acc + s.amount, 0), [todaySales]);

    // Breakdown Counts
    const newSalesCount = useMemo(() => todaySales.filter(s => s.saleType !== 'upgrade').length, [todaySales]);

    const { avgSalesPerHour, avgShiftLength } = useMemo(() => {
        if (shifts.length === 0) return { avgSalesPerHour: 0, avgShiftLength: 4 };

        const totalHistorySales = shifts.reduce((acc, s) => acc + s.totalSales, 0);
        const totalHistoryHours = shifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);

        const avgSpeed = totalHistoryHours > 0 ? totalHistorySales / totalHistoryHours : 0;
        const avgLen = totalHistoryHours / shifts.length;

        return { avgSalesPerHour: avgSpeed, avgShiftLength: avgLen };
    }, [shifts]);

    // Streak Calculation
    const currentStreak = useMemo(() => {
        const uniqueDates = Array.from(new Set(shifts.map(s => s.date))).sort().reverse();
        let streak = 0;
        if (uniqueDates.length > 0) streak = uniqueDates.length > 5 ? 5 : uniqueDates.length;
        return Math.max(1, streak);
    }, [shifts]);

    const currentShiftDuration = liveHours.day + liveHours.evening;

    // Projection Logic
    const hoursRemaining = Math.max(0, avgShiftLength - currentShiftDuration);
    const rawProjection = totalSalesToday + (avgSalesPerHour * hoursRemaining);
    const projectedFinal = Math.round(rawProjection / 100) * 100;

    // Ghost Racer Logic
    const currentHour = now.getHours();
    const ghostTarget = avgSalesPerHour * (Math.max(0, currentHour - 10)); // Rough estimate starting at 10am
    const isWinningGhost = totalSalesToday > ghostTarget;

    const currentLevel = LEVELS.find(l => totalSalesToday >= l.min && totalSalesToday < l.max) || LEVELS[LEVELS.length - 1];
    const nextLevel = LEVELS.find(l => l.id === currentLevel.id + 1);
    const distToNextLevel = nextLevel ? nextLevel.min - totalSalesToday : 0;

    // Check for Completed Bounties
    const completedBountyIndices = useMemo(() => {
        if (!dailyBounties) return [];
        return dailyBounties.map((b, i) => {
            if (b.task.includes("30.000") && totalSalesToday >= 30000) return i;
            if (b.task.includes("Nýir") && newSalesCount >= 3) return i;
            if (b.task.includes(" röð") && newSalesCount >= 3) return i; // Catch-all for sequential tasks if simplified logic
            if (b.task.includes("5.000") && todaySales.some(s => s.amount >= 5000)) return i;
            if (b.task.includes("25.000") && totalSalesToday >= 25000) return i;
            if (b.task.includes("Tvær sölur") && todaySales.length >= 2) return i; // Simplified check for "next 60 mins" for now
            return -1;
        }).filter(i => i !== -1);
    }, [dailyBounties, totalSalesToday, newSalesCount, todaySales]);

    // --- Actions ---
    const handleClockClick = () => {
        if (isShiftActive && clockInTime) {
            // --- INTERCEPTOR LOGIC ---
            if (nextLevel && distToNextLevel > 0 && distToNextLevel <= 2000) {
                setInterceptorMsg(`Bíddu! Þú ert aðeins ${formatISK(distToNextLevel)} frá því að ná ${nextLevel.title}! Eina sölu í viðbót?`);
                setShowInterceptor(true);
                return;
            }

            const remainder = totalSalesToday % 10000;
            if (remainder >= 8000 && totalSalesToday > 0) {
                const distToRound = 10000 - remainder;
                setInterceptorMsg(`Vá, þú ert næstum komin í ${formatISK(totalSalesToday + distToRound)}! Aðeins ${formatISK(distToRound)} í viðbót.`);
                setShowInterceptor(true);
                return;
            }

            processClockOut();
        } else {
            setShowGoalInput(true);
        }
    };

    const confirmClockIn = () => {
        const newGoal = parseInt(tempGoal) || goals.daily;
        onUpdateGoals({ ...goals, daily: newGoal });
        onClockIn(newGoal);

        setNotification({ msg: `Markmið sett: ${formatISK(newGoal)}. Gangi þér vel!`, type: 'success' });
        setShowGoalInput(false);
        setLiveHours({ day: 0, evening: 0 });
    };

    const processClockOut = () => {
        if (!clockInTime) return;
        const endTime = getRoundedTime(new Date());
        const startTime = getRoundedTime(clockInTime);
        const finalHours = calculateShiftSplit(startTime, endTime);

        onClockOut({
            id: Math.random().toString(36).substr(2, 9),
            date: startTime.toISOString().split('T')[0],
            dayHours: parseFloat(finalHours.day.toFixed(2)),
            eveningHours: parseFloat(finalHours.evening.toFixed(2)),
            totalSales: totalSalesToday,
            notes: '',
            projectName: 'Other',
            userId: ''
        });

        setShowInterceptor(false);
        setLiveHours({ day: 0, evening: 0 });
        setNotification({ msg: `Vakt vistuð! (${(finalHours.day + finalHours.evening).toFixed(2)} klst)`, type: 'success' });
    };

    const handleAddSale = (e: React.FormEvent) => {
        e.preventDefault();
        if (saleData.amount <= 0) return;

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);

        onSaveSale({
            id: Math.random().toString(36).substr(2, 9),
            date: todayStr,
            timestamp: new Date().toISOString(),
            amount: saleData.amount,
            project: saleData.project,
            saleType: saleType,
            userId: ''
        });
        setSaleData({ ...saleData, amount: 0 });
        setNotification({ msg: "Sölu bætt við!", type: 'success' });
    };

    const handleUpdate = () => {
        if (editingSale && editAmount > 0) {
            onUpdateSale({
                ...editingSale,
                amount: editAmount,
                project: editProject,
                saleType: editType
            });
            setEditingSale(null);
            setNotification({ msg: "Færsla uppfærð!", type: 'success' });
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Ertu viss um að þú viljir eyða þessari færslu?")) {
            onDeleteSale(id);
            setNotification({ msg: "Færslu eytt.", type: 'info' });
        }
    };

    const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));

    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
        return (
            <div className="pb-32 space-y-6">

                {showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-[500] flex items-center justify-center overflow-hidden">
                        <div className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ top: '40%', left: '50%' }} />
                        <div className="absolute w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ top: '60%', left: '30%' }} />
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic">Söluskráning</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase">{todaySales.length} færslur í dag</p>
                    </div>
                </div>

                {dailyBounties && dailyBounties.length > 0 && (
                    <BountyCard bounties={dailyBounties} completedIndices={completedBountyIndices} />
                )}

                {/* NEW: Wingman Card */}
                {wingmanMsg && (
                    <div className="mx-2 p-4 rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl animate-in slide-in-from-right-8 duration-500 flex items-center gap-4 relative overflow-hidden">
                        <div className="p-2 bg-white/20 rounded-full animate-pulse">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-75">MorriAI Wingman</p>
                            <p className="text-sm font-bold italic">"{wingmanMsg}"</p>
                        </div>
                        <button onClick={() => setWingmanMsg(null)} className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full text-white/50">X</button>
                    </div>
                )}

                <LevelProgress currentLevel={currentLevel} nextLevel={nextLevel} currentAmount={totalSalesToday} />

                <div className={`glass p-6 rounded-[32px] border-indigo-500/20 shadow-2xl relative overflow-hidden ${currentStreak > 3 ? 'border-amber-500/50 shadow-amber-500/20' : ''}`}>
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 custom-scrollbar">
                        {PROJECTS.map(p => (
                            <button key={p} onClick={() => setSaleData({ ...saleData, project: p })} className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${saleData.project === p ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}>
                                {p}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                        <button onClick={() => setSaleType('new')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase ${saleType === 'new' ? 'bg-indigo-500 text-white' : 'text-slate-500'}`}>Nýr</button>
                        <button onClick={() => setSaleType('upgrade')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase ${saleType === 'upgrade' ? 'bg-amber-500 text-slate-900' : 'text-slate-500'}`}>Hækkun</button>
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => setSaleData(d => ({ ...d, amount: Math.max(0, d.amount - 500) }))} className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all border border-white/5">
                            <Minus size={24} />
                        </button>
                        <div className="text-center">
                            <span className="text-4xl font-black text-white tracking-tighter">{saleData.amount}</span>
                            <span className="text-xs font-bold text-slate-500 block uppercase">Krónur</span>
                        </div>
                        <button onClick={() => setSaleData(d => ({ ...d, amount: d.amount + 500 }))} className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all border border-white/5">
                            <Plus size={24} />
                        </button>
                    </div>

                    <button onClick={handleAddSale} className="w-full py-4 gradient-bg rounded-2xl text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                        Staðfesta Sölu
                    </button>
                </div>

                <div className="glass p-4 rounded-[24px] border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Ghost size={20} className={isWinningGhost ? "text-emerald-400" : "text-rose-400"} />
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ghost Racer</p>
                            <p className={`text-xs font-bold ${isWinningGhost ? "text-emerald-400" : "text-rose-400"}`}>
                                {isWinningGhost ? `+${formatISK(totalSalesToday - ghostTarget)} vs Meðaltal` : `-${formatISK(ghostTarget - totalSalesToday)} vs Meðaltal`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Nýlegt</h4>
                    {todaySales.slice().reverse().map(s => (
                        <div key={s.id} className="glass p-4 rounded-2xl border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`h-2 w-2 rounded-full ${s.saleType === 'upgrade' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                <div>
                                    <p className="font-bold text-white text-sm">{s.project}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-white">{formatISK(s.amount)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {showGoalInput && (
                    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl">
                        <div className="w-full max-w-sm">
                            <h3 className="text-2xl font-black text-white text-center mb-6">Dagsmarkmið?</h3>
                            <input type="number" value={tempGoal} onChange={e => setTempGoal(e.target.value)} className="w-full bg-white/10 p-4 rounded-2xl text-center text-white font-black text-3xl mb-6 outline-none focus:ring-2 focus:ring-emerald-500" />
                            <button onClick={confirmClockIn} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase">Byrja</button>
                        </div>
                    </div>
                )}

                {showInterceptor && (
                    <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95">
                        <div className="w-full max-w-sm text-center">
                            <div className="p-4 bg-amber-500/20 rounded-full w-fit mx-auto mb-6 text-amber-400 animate-bounce">
                                <AlertTriangle size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4">Bíddu aðeins!</h3>
                            <p className="text-lg font-bold text-slate-300 mb-8 leading-relaxed">{interceptorMsg}</p>
                            <div className="space-y-3">
                                <button onClick={() => setShowInterceptor(false)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white font-black uppercase text-sm shadow-xl active:scale-95 transition-all">
                                    Ég tek eina í viðbót! 🚀
                                </button>
                                <button onClick={processClockOut} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-slate-400 font-bold uppercase text-xs">
                                    Nei, ég þarf að fara
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {notification && (
                    <div className="fixed bottom-24 left-4 right-4 bg-emerald-500 text-white p-4 rounded-2xl font-bold shadow-2xl text-center z-[100] animate-in slide-in-from-bottom-4">
                        {notification.msg}
                    </div>
                )}
            </div>
        );
    }

    // --- DESKTOP RENDER ---
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 relative animate-in fade-in duration-500">

            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[500] flex items-center justify-center overflow-hidden">
                    <div className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ top: '40%', left: '50%' }} />
                </div>
            )}

            {showInterceptor && (
                <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95">
                    <div className="w-full max-w-sm text-center">
                        <div className="p-4 bg-amber-500/20 rounded-full w-fit mx-auto mb-6 text-amber-400 animate-bounce">
                            <AlertTriangle size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4">Bíddu aðeins!</h3>
                        <p className="text-lg font-bold text-slate-300 mb-8 leading-relaxed">{interceptorMsg}</p>
                        <div className="space-y-3">
                            <button onClick={() => setShowInterceptor(false)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white font-black uppercase text-sm shadow-xl active:scale-95 transition-all">
                                Ég tek eina í viðbót! 🚀
                            </button>
                            <button onClick={processClockOut} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-slate-400 font-bold uppercase text-xs">
                                Nei, ég þarf að fara
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGoalInput && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass p-8 rounded-[40px] w-full max-w-sm border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center relative">
                        <button onClick={() => setShowGoalInput(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
                        <div className="mb-6 flex justify-center"><div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400"><Target size={32} /></div></div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Hvað er dagsmarkmiðið?</h3>
                        <input type="number" value={tempGoal} onChange={(e) => setTempGoal(e.target.value)} className="w-full bg-black/40 border border-emerald-500/30 p-4 rounded-2xl text-center text-3xl font-black text-white outline-none focus:ring-2 focus:ring-emerald-500 mb-6" autoFocus />
                        <button onClick={confirmClockIn} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white font-black uppercase text-sm shadow-xl transition-all active:scale-95">Byrja Vakt</button>
                    </div>
                </div>
            )}

            {editingSale && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass p-8 rounded-[40px] w-full max-w-sm border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] relative">
                        <button onClick={() => setEditingSale(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-white italic tracking-tighter mb-6 text-center">Breyta Færslu</h3>
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-4">
                                <button onClick={() => setEditType('new')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${editType === 'new' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Nýr</button>
                                <button onClick={() => setEditType('upgrade')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${editType === 'upgrade' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Hækkun</button>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Upphæð</label>
                                <input type="number" value={editAmount} onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-2xl font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <button onClick={handleUpdate} className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-white font-black uppercase text-sm shadow-xl transition-all active:scale-95 mt-4">Uppfæra</button>
                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border ${notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-white' : 'bg-indigo-500/20 border-indigo-500/50 text-white'}`}>
                        <CheckCircle2 size={18} className={notification.type === 'success' ? "text-emerald-400" : "text-indigo-400"} />
                        <span className="font-bold text-sm">{notification.msg}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Skráning</h2>
                    <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-1">
                        {isShiftActive ? 'Vakt í gangi - Gangi þér vel!' : 'Byrjaðu vaktina'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="glass p-5 rounded-[32px] border-white/10 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tímar í dag</p><div className={`p-1 rounded-full ${isShiftActive ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-white/10 text-slate-500'}`}><Clock size={12} /></div></div>
                    <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-lg font-black text-white">{liveHours.day.toFixed(1)}</span>
                    </div>
                </div>
                <div onClick={() => setExpandedMetric(expandedMetric === 'today' ? null : 'today')} className="glass p-5 rounded-[32px] border-indigo-500/10 cursor-pointer hover:bg-white/5 transition-all group">
                    <div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sala dagsins</p><div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400"><Sparkles size={12} /></div></div>
                    <p className="text-xl font-black text-white"><NumberTicker value={totalSalesToday} /></p>
                </div>
                <div className="glass p-5 rounded-[32px] border-emerald-500/10">
                    <div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Meðaltal / klst</p><div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400"><TrendingUp size={12} /></div></div>
                    <p className="text-xl font-black text-emerald-400"><NumberTicker value={avgSalesPerHour} /></p>
                </div>
                <div className="glass p-5 rounded-[32px] border-violet-500/10">
                    <div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Fjöldi sala</p><div className="p-1 rounded-full bg-violet-500/20 text-violet-400"><Target size={12} /></div></div>
                    <p className="text-xl font-black text-violet-400 mb-1">{todaySales.length}</p>
                </div>
                <div className="glass p-5 rounded-[32px] border-indigo-500/20">
                    <div className="flex justify-between items-start mb-1"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Áætluð lokasala</p></div>
                    <p className="text-xl font-black text-indigo-400"><NumberTicker value={projectedFinal} /></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700">

                <div className="lg:col-span-2 glass p-8 md:p-10 rounded-[40px] border-white/10 flex flex-col shadow-2xl relative h-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400"><ShoppingBag size={24} /></div>
                            <div><h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Skrá Sölu</h3></div>
                        </div>
                    </div>
                    <form onSubmit={handleAddSale} className="relative max-w-2xl mx-auto w-full">
                        <input type="number" required placeholder="0 kr." value={saleData.amount || ''} onChange={e => setSaleData({ ...saleData, amount: parseInt(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 p-8 rounded-[32px] text-5xl font-black text-white outline-none focus:ring-4 focus:ring-indigo-500/20 pr-40 text-center placeholder:text-white/10" />
                        <button type="submit" className="absolute right-4 top-4 bottom-4 px-8 gradient-bg rounded-[24px] text-white font-black uppercase text-sm shadow-xl hover:scale-105 transition-all active:scale-95">Bæta við</button>
                    </form>

                    <div className="mt-8 flex justify-center">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {PROJECTS.map(p => (
                                <button key={p} onClick={() => setSaleData({ ...saleData, project: p })} className={`p-4 rounded-2xl border text-[10px] font-black transition-all ${saleData.project === p ? 'gradient-bg text-white border-white/20 shadow-lg scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}>{p}</button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Nýlegar færslur í dag</h4>
                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {todaySales.length > 0 ? [...todaySales].reverse().map(s => (
                                <div key={s.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full ${s.saleType === 'upgrade' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                                        <div className="flex flex-col"><span className="font-black text-white text-xs">{s.project}</span><span className="text-[9px] text-slate-500">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span ></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-white text-sm">{formatISK(s.amount)}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingSale(s)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="text-slate-700 text-xs font-bold italic py-10 text-center">Engin sala skráð í dag.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1 h-full">
                    {dailyBounties && dailyBounties.length > 0 && (
                        <BountyCard bounties={dailyBounties} completedIndices={completedBountyIndices} />
                    )}

                    {/* NEW: Wingman Card (Desktop) */}
                    {wingmanMsg && (
                        <div className="glass p-5 rounded-[32px] bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-violet-500/30 flex items-center gap-4 relative overflow-hidden animate-in slide-in-from-right-8 duration-500">
                            <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-violet-500/20 blur-[40px] rounded-full pointer-events-none" />
                            <div className="p-3 bg-indigo-500 rounded-xl text-white animate-pulse shadow-lg shadow-indigo-500/20">
                                <Zap size={24} fill="currentColor" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">MorriAI Wingman</p>
                                <p className="text-sm font-bold text-white italic leading-relaxed">"{wingmanMsg}"</p>
                            </div>
                            <button onClick={() => setWingmanMsg(null)} className="absolute top-3 right-3 p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors"><X size={16} /></button>
                        </div>
                    )}

                    <LevelProgress currentLevel={currentLevel} nextLevel={nextLevel} currentAmount={totalSalesToday} />

                    <div className="glass p-6 rounded-[32px] border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Ghost size={24} className={isWinningGhost ? "text-emerald-400" : "text-rose-400"} />
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ghost Racer</p>
                                <p className={`text-lg font-black ${isWinningGhost ? "text-emerald-400" : "text-rose-400"}`}>
                                    {isWinningGhost ? `+${formatISK(totalSalesToday - ghostTarget)}` : `-${formatISK(ghostTarget - totalSalesToday)}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registration;
