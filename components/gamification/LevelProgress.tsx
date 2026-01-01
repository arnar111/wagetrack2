import React from 'react';
import { Level } from '../../types';

interface LevelProgressProps {
    currentLevel: Level;
    nextLevel?: Level;
    currentAmount: number;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ currentLevel, nextLevel, currentAmount }) => {
    const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));
    const distToNextLevel = nextLevel ? nextLevel.min - currentAmount : 0;

    // Calculate percentage
    let width = 100;
    if (nextLevel) {
        width = ((currentAmount - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100;
    }

    return (
        <div className="glass p-6 rounded-[32px] border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Núverandi Level</p>
                    <h3 className={`text-2xl font-black text-white ${currentLevel.color.replace('bg-', 'text-')}`}>{currentLevel.title}</h3>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Næsta Level</p>
                    <p className="text-sm font-bold text-white">{nextLevel ? nextLevel.title : "MAX"}</p>
                </div>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full ${currentLevel.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${width}%` }}
                />
            </div>
            {nextLevel && <p className="text-[10px] text-center mt-3 text-slate-400 font-bold">Vantar {formatISK(distToNextLevel)} í næsta level</p>}
        </div>
    );
};

export default LevelProgress;
