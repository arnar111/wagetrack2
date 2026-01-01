import React from 'react';
import { Target, Crown } from 'lucide-react';

interface BountyCardProps {
    bounty: { task: string; reward: string } | null;
    isComplete: boolean;
}

const BountyCard: React.FC<BountyCardProps> = ({ bounty, isComplete }) => {
    if (!bounty) return null;

    return (
        <div className={`glass p-6 rounded-[32px] border transition-all relative overflow-hidden ${isComplete ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50' : 'border-indigo-500/30 bg-indigo-500/10'}`}>
            <div className="flex items-center gap-4 mb-3">
                <div className={`p-3 rounded-2xl ${isComplete ? 'bg-amber-500 text-slate-900' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {isComplete ? <Crown size={24} /> : <Target size={24} />}
                </div>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isComplete ? 'text-amber-400' : 'text-indigo-400'}`}>
                        {isComplete ? "BOUNTY COMPLETED!" : "Dagsverkefni"}
                    </p>
                    <p className="text-sm font-bold text-white">{bounty.task}</p>
                </div>
            </div>
            <div className="flex justify-end">
                <span className={`text-[10px] font-black text-white px-3 py-1.5 rounded-xl ${isComplete ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-white/10'}`}>
                    Verðlaun: {bounty.reward}
                </span>
            </div>
        </div>
    );
};

export default BountyCard;
