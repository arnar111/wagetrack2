import React, { useState } from 'react';
import { Trophy, Swords, Medal, Target } from 'lucide-react';
import LeaderboardView from './LeaderboardView';
import TrophyRoomView from './TrophyRoomView';
import DuelArenaView from './DuelArenaView';

const Competitions = () => {
    const [subTab, setSubTab] = useState<'leaderboard' | 'trophy' | 'duel'>('leaderboard');

    return (
        <div className="max-w-4xl mx-auto pb-24 space-y-8 animate-in fade-in duration-500">

            {/* Header / Hero */}
            <div className="relative text-center space-y-2 py-8">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase relative z-10">Keppni & Afrek</h2>
                <p className="text-slate-400 font-bold text-sm tracking-wide relative z-10">Sannaðu þig á vellinum</p>
            </div>

            {/* Custom Tab Switcher */}
            <div className="glass p-1.5 rounded-[24px] flex relative mx-4 md:mx-auto max-w-md border border-white/10 bg-black/40 backdrop-blur-xl">
                <button
                    onClick={() => setSubTab('leaderboard')}
                    className={`flex-1 py-3 rounded-[20px] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${subTab === 'leaderboard' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Medal size={16} /> Topplistinn
                </button>
                <button
                    onClick={() => setSubTab('trophy')}
                    className={`flex-1 py-3 rounded-[20px] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${subTab === 'trophy' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Trophy size={16} /> Afrek
                </button>
                <button
                    onClick={() => setSubTab('duel')}
                    className={`flex-1 py-3 rounded-[20px] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${subTab === 'duel' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Swords size={16} /> Einvígi
                </button>
            </div>

            {/* Content Area */}
            <div className="px-4 md:px-0 min-h-[500px]">
                {subTab === 'leaderboard' && <LeaderboardView />}
                {subTab === 'trophy' && <TrophyRoomView />}
                {subTab === 'duel' && <DuelArenaView />}
            </div>
        </div>
    );
};

export default Competitions;
