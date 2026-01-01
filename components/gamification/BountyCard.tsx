import React from 'react';
import { Target, Crown, CheckCircle2 } from 'lucide-react';

interface Bounty {
    task: string;
    reward: string;
}

interface BountyCardProps {
    bounties: Bounty[];
    completedIndices: number[];
}

const BountyCard: React.FC<BountyCardProps> = ({ bounties, completedIndices }) => {
    if (!bounties || bounties.length === 0) return null;

    return (
        <div className="glass p-6 rounded-[32px] border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={16} /> Dagsverkefni
            </h3>

            <div className="space-y-3">
                {bounties.map((bounty, index) => {
                    const isComplete = completedIndices.includes(index);
                    return (
                        <div key={index} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${isComplete ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex-1">
                                <p className={`text-xs font-bold ${isComplete ? 'text-white line-through opacity-50' : 'text-white'}`}>
                                    {bounty.task}
                                </p>
                                <p className="text-[10px] font-black text-slate-500 uppercase mt-1">
                                    {bounty.reward}
                                </p>
                            </div>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isComplete ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-500'}`}>
                                {isComplete ? <CheckCircle2 size={16} /> : <Crown size={16} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BountyCard;
