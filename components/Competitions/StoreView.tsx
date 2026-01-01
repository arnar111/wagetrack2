import React, { useState } from 'react';
import { ShoppingBag, Coins, Check, Lock } from 'lucide-react';
import { STORE_ITEMS } from '../../constants';
import { User, StoreItem } from '../../types';

interface StoreViewProps {
    coins: number;
    onBuy: (item: StoreItem) => void;
    inventory: string[]; // List of item IDs owned
}

const StoreView: React.FC<StoreViewProps> = ({ coins, onBuy, inventory }) => {
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const handleBuy = (item: StoreItem) => {
        if (coins < item.price) return;
        setPurchasing(item.id);
        setTimeout(() => {
            onBuy(item);
            setPurchasing(null);
        }, 800);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Balance Card */}
            <div className="glass p-8 rounded-[32px] border-amber-500/20 relative overflow-hidden text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="p-4 bg-amber-500/20 rounded-full text-amber-400 mb-2 animate-bounce">
                        <Coins size={32} />
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-xl">{coins.toLocaleString()}</h2>
                    <p className="text-sm font-bold text-amber-500 uppercase tracking-widest">Takk Coins</p>
                </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STORE_ITEMS.map((item) => {
                    const canAfford = coins >= item.price;
                    const isOwned = inventory.includes(item.id);
                    const isBuying = purchasing === item.id;

                    return (
                        <div key={item.id} className={`glass p-6 rounded-[32px] border-white/5 relative group transition-all duration-300 ${canAfford ? 'hover:scale-[1.02] hover:bg-white/5' : 'opacity-70'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-4xl filter drop-shadow-md">{item.icon}</div>
                                <div className={`px-3 py-1 rounded-full text-xs font-black ${canAfford ? 'bg-amber-500 text-slate-900' : 'bg-white/10 text-slate-500'}`}>
                                    {item.price} 🪙
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-white italic mb-1">{item.title}</h3>
                            <p className="text-xs text-slate-400 font-bold mb-6 h-10">{item.description}</p>

                            <button
                                disabled={!canAfford || isOwned || isBuying}
                                onClick={() => handleBuy(item)}
                                className={`w-full py-3 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${isOwned
                                        ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                        : canAfford
                                            ? 'bg-white text-slate-900 shadow-lg hover:shadow-xl'
                                            : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                    }`}
                            >
                                {isBuying ? (
                                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                ) : isOwned ? (
                                    <>Eign <Check size={14} /></>
                                ) : (
                                    <>Kaupa <ShoppingBag size={14} /></>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StoreView;
