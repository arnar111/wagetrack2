import React from 'react';
import { Swords, User, Ghost, Clock } from 'lucide-react';

interface DuelProps {
    mySales: number;
    opponentName: string;
    opponentSales: number;
    timeLeft?: string;
    target: number;
    onChallenge: (name: string) => void;
}

const DuelArenaView: React.FC<DuelProps> = ({ mySales, opponentName, opponentSales, timeLeft = "00:00", target, onChallenge }) => {

    // Calculate percentages for progress bars
    const myPercent = Math.min(100, Math.max(5, (mySales / target) * 100));
    const opPercent = Math.min(100, Math.max(5, (opponentSales / target) * 100));

    const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(val);

    return (
        <div className="space-y-8 animate-in fly-in-bottom duration-700">
            {/* Active Duel Card */}
            <div className="glass p-1 rounded-[40px] border-rose-500/30 bg-gradient-to-b from-rose-900/10 to-transparent relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />

                <div className="p-6 pb-2 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 rounded-full text-rose-400 text-[10px] font-black uppercase tracking-widest mb-4">
                        <Swords size={12} /> Live Einvígi
                    </div>

                    <div className="flex justify-between items-center px-4">
                        {/* Player 1 (You) */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-16 w-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-indigo-400 relative">
                                <User size={32} />
                                <div className="absolute -bottom-3 bg-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-black border border-indigo-400">Þú</div>
                            </div>
                            <p className="text-2xl font-black text-white mt-2">{formatISK(mySales)}</p>
                        </div>

                        {/* VS Visual */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-4xl font-black text-rose-500 italic relative z-10" style={{ textShadow: '0 0 20px rgba(244,63,94,0.5)' }}>VS</span>
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Clock size={10} /> {timeLeft} eftir</div>
                        </div>

                        {/* Player 2 (Ghost) */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-16 w-16 rounded-2xl bg-slate-700 flex items-center justify-center text-slate-400 border-2 border-slate-600 relative">
                                <Ghost size={32} />
                                <div className="absolute -bottom-3 bg-slate-800 px-2 py-0.5 rounded-lg text-[10px] font-black border border-slate-600">{opponentName}</div>
                            </div>
                            <p className="text-2xl font-black text-slate-400 mt-2">{formatISK(opponentSales)}</p>
                        </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="mt-8 flex gap-1 h-3 rounded-full overflow-hidden bg-white/5 relative">
                        <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${myPercent}%` }} />
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2" />
                        <div className="bg-rose-500 h-full absolute right-0 transition-all duration-1000" style={{ width: `${opPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-3">Markmið: Fyrstur í {formatISK(target)} kr</p>
                </div>
            </div>

            {/* Challenge Others */}
            <div>
                <h3 className="text-lg font-black text-white italic uppercase tracking-tight mb-4 flex items-center gap-2">
                    <Swords size={18} className="text-slate-500" /> Skora á félaga
                </h3>
                <div className="space-y-3">
                    {['Jón Jónsson', 'Sigga Dögg', 'Gunnar', 'Anna'].map((name) => (
                        <div key={name} className="glass p-4 rounded-2xl flex items-center justify-between border-white/5 hover:bg-white/5 transition-all group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">{name.charAt(0)}</div>
                                <div>
                                    <p className="font-bold text-white text-sm">{name}</p>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">Online</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Skora á
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DuelArenaView;
