import React from 'react';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

const LeaderboardView = () => {
    const leaders = [
        { id: 1, name: "Arnór Smárason", sales: 1250000, avatar: "AS", rank: 1, trend: 'up' },
        { id: 2, name: "Sigga Dögg", sales: 980000, avatar: "SD", rank: 2, trend: 'stable' },
        { id: 3, name: "Jón Jónsson", sales: 850000, avatar: "JJ", rank: 3, trend: 'down' },
        { id: 4, name: "Þú (You)", sales: 620000, avatar: "ME", rank: 8, trend: 'up' },
    ];

    const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(val);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top 3 Podium */}
            <div className="flex justify-center items-end gap-4 mb-12 pt-8">
                {/* 2nd Place */}
                <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full border-2 border-slate-400 bg-slate-800 flex items-center justify-center text-slate-300 font-black text-sm shadow-[0_0_15px_rgba(148,163,184,0.3)] relative">
                        SD
                        <div className="absolute -bottom-2 bg-slate-600 text-[8px] font-bold px-1.5 py-0.5 rounded-full">#2</div>
                    </div>
                    <div className="w-20 h-24 bg-gradient-to-t from-slate-800/50 to-slate-700/20 rounded-t-2xl border-x border-t border-white/5 flex items-end justify-center pb-2">
                        <span className="text-xs font-black text-slate-400">{formatISK(980000)}</span>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center gap-2 z-10">
                    <Crown size={24} className="text-amber-400 animate-bounce" />
                    <div className="h-16 w-16 rounded-full border-4 border-amber-500/50 bg-amber-900/50 flex items-center justify-center text-amber-200 font-black text-lg shadow-[0_0_30px_rgba(245,158,11,0.4)] relative">
                        AS
                        <div className="absolute -bottom-3 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400">#1</div>
                    </div>
                    <div className="w-24 h-32 bg-gradient-to-t from-amber-600/20 to-amber-500/10 rounded-t-2xl border-x border-t border-amber-500/30 flex items-end justify-center pb-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/10 animate-pulse" />
                        <span className="text-sm font-black text-amber-400 relative">{formatISK(1250000)}</span>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full border-2 border-amber-700 bg-amber-950 flex items-center justify-center text-amber-700 font-black text-sm shadow-[0_0_15px_rgba(180,83,9,0.3)] relative">
                        JJ
                        <div className="absolute -bottom-2 bg-amber-800 text-amber-200 text-[8px] font-bold px-1.5 py-0.5 rounded-full">#3</div>
                    </div>
                    <div className="w-20 h-16 bg-gradient-to-t from-amber-900/40 to-amber-800/10 rounded-t-2xl border-x border-t border-white/5 flex items-end justify-center pb-2">
                        <span className="text-xs font-black text-amber-700">{formatISK(850000)}</span>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {leaders.map((l, i) => (
                    <div key={l.id} className={`glass p-4 rounded-2xl flex items-center justify-between border transition-all hover:scale-[1.02] ${l.name.includes('(You)') ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5 bg-white/5'}`}>
                        <div className="flex items-center gap-4">
                            <span className={`font-black w-6 text-center ${i < 3 ? 'text-amber-400 text-lg' : 'text-slate-500 text-sm'}`}>{l.rank}</span>
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">{l.avatar}</div>
                            <div>
                                <p className={`text-sm font-bold ${l.name.includes('(You)') ? 'text-amber-400' : 'text-white'}`}>{l.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sala mánaðarins</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-white">{formatISK(l.sales)}</p>
                            {l.name.includes('(You)') && <p className="text-[9px] text-emerald-400 font-bold flex items-center justify-end gap-1"><TrendingUp size={8} /> +12%</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaderboardView;
