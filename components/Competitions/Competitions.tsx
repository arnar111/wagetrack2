import React, { useState, useMemo } from 'react';
import { Trophy, Swords, Crown, ShoppingBag, Medal } from 'lucide-react';
import LeaderboardView from './LeaderboardView.tsx';
import TrophyRoomView from './TrophyRoomView.tsx';
import DuelArenaView from './DuelArenaView.tsx';
import StoreView from './StoreView.tsx';
import { Sale, Shift, User, StoreItem } from '../../types';
import { isWeekend, calculateMaxStreak } from '../../utils/dateUtils.ts';

interface CompetitionsProps {
    sales: Sale[];
    shifts: Shift[];
    user: User;
}

const Competitions: React.FC<CompetitionsProps> = ({ sales, shifts, user }) => {
    const [subTab, setSubTab] = useState<'leaderboard' | 'trophy' | 'duel' | 'store'>('leaderboard');
    const [duelOpponent, setDuelOpponent] = useState("Ghost");

    // --- LEADERBOARD LOGIC ---
    const leaderboardData = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const monthSales = sales.filter(s => new Date(s.date).getMonth() === currentMonth);
        const myTotal = monthSales.reduce((acc, s) => acc + s.amount, 0);

        // Generate Bots around user score
        const bots = [
            { id: 1, name: "Arnór Smárason", sales: Math.round(myTotal * 1.25), avatar: "AS", rank: 1, trend: 'up' as const },
            { id: 2, name: "Sigga Dögg", sales: Math.round(myTotal * 1.1), avatar: "SD", rank: 2, trend: 'stable' as const },
            { id: 3, name: "Jón Jónsson", sales: Math.round(myTotal * 0.9), avatar: "JJ", rank: 3, trend: 'down' as const },
            { id: 4, name: "Þú (You)", sales: myTotal, avatar: user?.name?.substring(0, 2).toUpperCase() || "ME", rank: 4, trend: 'up' as const },
            { id: 5, name: "Gunnar", sales: Math.round(myTotal * 0.75), avatar: "GU", rank: 5, trend: 'down' as const },
        ];

        return bots.sort((a, b) => b.sales - a.sales).map((b, i) => ({ ...b, rank: i + 1 }));
    }, [sales, user]);

    // --- BADGE & COIN LOGIC ---
    const { badges, badgeCoins } = useMemo(() => {
        const totalSalesLifetime = sales.reduce((acc, s) => acc + s.amount, 0);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(s => s.date === todayStr);
        const todayTotal = todaySales.reduce((acc, s) => acc + s.amount, 0);

        // Helper: Sales per day map
        const salesByDay: { [key: string]: number } = {};
        sales.forEach(s => {
            salesByDay[s.date] = (salesByDay[s.date] || 0) + s.amount;
        });
        const maxDailySales = Math.max(0, ...Object.values(salesByDay));
        const salesDates = Object.keys(salesByDay);

        const streak = calculateMaxStreak(salesDates);

        // Badge Definitions
        const badgeList = [
            // --- SALES MILESTONES ---
            { id: 1, name: 'Fyrsta Salan', desc: 'Skráðu eina sölu', icon: '🌟', reward: 10, earned: sales.length > 0 },
            { id: 2, name: '100k Klúbburinn', desc: '100.000 kr heildarsala', icon: '🥉', reward: 50, earned: totalSalesLifetime >= 100000 },
            { id: 3, name: 'Hálf Milljón', desc: '500.000 kr heildarsala', icon: '🥈', reward: 100, earned: totalSalesLifetime >= 500000 },
            { id: 4, name: 'Milljón', desc: '1.000.000 kr heildarsala', icon: '🥇', reward: 200, earned: totalSalesLifetime >= 1000000 },
            { id: 5, name: 'Multi-Milljón', desc: '5.000.000 kr heildarsala', icon: '👑', reward: 500, earned: totalSalesLifetime >= 5000000 },
            { id: 6, name: 'Auðjöfur', desc: '10.000.000 kr heildarsala', icon: '💎', reward: 1000, earned: totalSalesLifetime >= 10000000 },

            // --- SHIFT MILESTONES ---
            { id: 10, name: 'Nýliði', desc: 'Skráðu fyrstu vaktina', icon: '🌱', reward: 10, earned: shifts.length >= 1 },
            { id: 11, name: 'Fastagestur', desc: '10 vaktir búnar', icon: '🏠', reward: 50, earned: shifts.length >= 10 },
            { id: 12, name: 'Reyndur', desc: '50 vaktir búnar', icon: '⭐', reward: 200, earned: shifts.length >= 50 },
            { id: 13, name: 'Goðsögn', desc: '100 vaktir búnar', icon: '🧙‍♂️', reward: 500, earned: shifts.length >= 100 },

            // --- PERFORMANCE ---
            { id: 20, name: 'High Roller', desc: 'Sala yfir 30.000 kr á dag', icon: '💸', reward: 100, earned: maxDailySales >= 30000 },
            { id: 21, name: 'Hvalaveiðari', desc: 'Sala yfir 50.000 kr á dag', icon: '🐋', reward: 200, earned: maxDailySales >= 50000 },
            { id: 22, name: 'Sölumaskína', desc: '5 sölur á einum degi', icon: '🤖', reward: 50, earned: Object.values(sales.reduce((acc: any, s) => { acc[s.date] = (acc[s.date] || 0) + 1; return acc; }, {})).some((count: any) => count >= 5) },

            // --- STREAKS ---
            { id: 30, name: 'Á Eldi', desc: '3 daga streak (helgar telja ekki)', icon: '🔥', reward: 50, earned: streak >= 3 },
            { id: 31, name: 'Óstöðvandi', desc: '10 daga streak (helgar telja ekki)', icon: '🚀', reward: 200, earned: streak >= 10 },

            // --- SPECIAL ---
            { id: 40, name: 'Nátthrafn', desc: 'Vakt til 22:00 eða seinna', icon: '🦉', reward: 30, earned: shifts.some(s => s.eveningHours > 0) }, // Simplified check
            { id: 41, name: 'Morgunhani', desc: 'Vakt byrjar fyrir 09:00', icon: '🐔', reward: 30, earned: shifts.some(s => s.dayHours > 0) }, // Simplified check
            { id: 42, name: 'Helgarstríðsmaður', desc: 'Vannst um helgi (auka)', icon: '⚔️', reward: 100, earned: shifts.some(s => isWeekend(s.date)) },
        ];

        const totalBadgeCoins = badgeList.filter(b => b.earned).reduce((acc, b) => acc + b.reward, 0);

        return { badges: badgeList, badgeCoins: totalBadgeCoins };
    }, [sales, shifts]);

    // --- STORE LOGIC ---
    // 500 ISK = 1 Coin based on sales + Badge Rewards + Wheel Rewards
    const [spentCoins, setSpentCoins] = useState(0);
    const [wheelCoins, setWheelCoins] = useState(0);
    const [inventory, setInventory] = useState<string[]>([]);

    const totalLifeTimeSales = React.useMemo(() => shifts.reduce((acc, s) => acc + s.totalSales, 0), [shifts]);
    const salesCoins = Math.floor(totalLifeTimeSales / 500);
    const totalCoinsEarned = salesCoins + badgeCoins + wheelCoins;
    const currentCoins = Math.max(0, totalCoinsEarned - spentCoins);

    const handleBuy = (item: StoreItem) => {
        setSpentCoins(prev => prev + item.price);
        // Only add to inventory if NOT consumable (wheel is consumable)
        if (item.id !== 'wheel') {
            setInventory(prev => [...prev, item.id]);
        }
    };

    const handleWheelWin = (amount: number) => {
        setWheelCoins(prev => prev + amount);
    };

    // --- DUEL LOGIC ---
    const duelData = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTotal = sales.filter(s => s.date === todayStr).reduce((acc, s) => acc + s.amount, 0);

        // Ghost Logic: Calculates target based on time of day (Mock linear progression)
        const now = new Date();
        const startOfDay = new Date(); startOfDay.setHours(10, 0, 0, 0);
        const hoursPassed = Math.max(0, (now.getTime() - startOfDay.getTime()) / (1000 * 60 * 60));

        // Ghost sells approx 25k per 8 hour shift
        const ghostRatePerHour = 25000 / 8;
        const ghostTotal = Math.round(ghostRatePerHour * hoursPassed);

        return {
            mySales: todayTotal,
            opponentName: duelOpponent,
            opponentSales: ghostTotal,
            target: 25000,
            timeLeft: "04:30" // Mock time left
        };
    }, [sales, duelOpponent]);


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
                <button
                    onClick={() => setSubTab('store')}
                    className={`flex-1 py-3 rounded-[20px] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${subTab === 'store' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <ShoppingBag size={16} /> Búðin
                </button>
            </div>

            {/* Content Area */}
            <div className="px-4 md:px-0 min-h-[500px]">
                {subTab === 'leaderboard' && <LeaderboardView leaders={leaderboardData} />}
                {subTab === 'trophy' && <TrophyRoomView badges={badges} />}
                {subTab === 'duel' && (
                    <DuelArenaView
                        mySales={duelData.mySales}
                        opponentName={duelData.opponentName}
                        opponentSales={duelData.opponentSales}
                        target={duelData.target}
                        timeLeft={duelData.timeLeft}
                        onChallenge={setDuelOpponent}
                    />
                )}
                {subTab === 'store' && <StoreView coins={currentCoins} onBuy={handleBuy} inventory={inventory} onWheelWin={handleWheelWin} />}
            </div>
        </div>
    );
};

export default Competitions;
