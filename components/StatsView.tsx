import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
    PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, TrendingDown, Calendar, Clock, Trophy, Target,
    Flame, Swords, Award, BarChart3
} from 'lucide-react';
import { Sale, Shift, Battle, User } from '../types';

interface StatsViewProps {
    sales: Sale[];
    shifts: Shift[];
    battles: Battle[];
    user: User;
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const StatsView: React.FC<StatsViewProps> = ({ sales, shifts, battles, user }) => {
    // Calculate stats
    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentSales = sales.filter(s =>
            s.userId === user.staffId &&
            new Date(s.timestamp) >= thirtyDaysAgo
        );

        const totalSales = recentSales.reduce((sum, s) => sum + s.amount, 0);
        const avgPerSale = recentSales.length > 0 ? totalSales / recentSales.length : 0;

        // Best/worst days
        const salesByDay: { [day: string]: number } = {};
        recentSales.forEach(s => {
            const day = new Date(s.timestamp).toLocaleDateString('is-IS', { weekday: 'long' });
            salesByDay[day] = (salesByDay[day] || 0) + s.amount;
        });
        const dayEntries = Object.entries(salesByDay).sort((a, b) => b[1] - a[1]);
        const bestDay = dayEntries[0]?.[0] || '-';
        const worstDay = dayEntries[dayEntries.length - 1]?.[0] || '-';

        // Best hours
        const salesByHour: { [hour: number]: number } = {};
        recentSales.forEach(s => {
            const hour = new Date(s.timestamp).getHours();
            salesByHour[hour] = (salesByHour[hour] || 0) + s.amount;
        });
        const hourEntries = Object.entries(salesByHour).sort((a, b) => b[1] - a[1]);
        const bestHour = hourEntries[0] ? parseInt(hourEntries[0][0]) : 0;

        // Battle stats
        const userBattles = battles.filter(b =>
            b.status === 'completed' &&
            b.participants.some(p => p.userId === user.staffId)
        );
        const wins = userBattles.filter(b => {
            const sorted = [...b.participants].sort((a, b) => b.currentSales - a.currentSales);
            return sorted[0]?.userId === user.staffId;
        }).length;
        const losses = userBattles.length - wins;

        return {
            totalSales,
            avgPerSale,
            salesCount: recentSales.length,
            bestDay,
            worstDay,
            bestHour,
            wins,
            losses,
            winRate: userBattles.length > 0 ? (wins / userBattles.length) * 100 : 0
        };
    }, [sales, battles, user]);

    // Daily sales chart data
    const dailyChartData = useMemo(() => {
        const data: { date: string; amount: number }[] = [];
        const now = new Date();

        for (let i = 13; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const daySales = sales.filter(s =>
                s.userId === user.staffId &&
                s.timestamp.startsWith(dateStr)
            ).reduce((sum, s) => sum + s.amount, 0);

            data.push({
                date: date.toLocaleDateString('is-IS', { weekday: 'short', day: 'numeric' }),
                amount: daySales
            });
        }

        return data;
    }, [sales, user]);

    // Hourly performance data
    const hourlyData = useMemo(() => {
        const hours: { hour: string; amount: number }[] = [];
        for (let h = 8; h <= 22; h++) {
            const hourSales = sales.filter(s => {
                const saleHour = new Date(s.timestamp).getHours();
                return s.userId === user.staffId && saleHour === h;
            }).reduce((sum, s) => sum + s.amount, 0);

            hours.push({
                hour: `${h}:00`,
                amount: hourSales
            });
        }
        return hours;
    }, [sales, user]);

    // Project breakdown
    const projectData = useMemo(() => {
        const projects: { [p: string]: number } = {};
        sales.filter(s => s.userId === user.staffId).forEach(s => {
            projects[s.project] = (projects[s.project] || 0) + s.amount;
        });
        return Object.entries(projects).map(([name, value]) => ({ name, value }));
    }, [sales, user]);

    const formatISK = (val: number) => val.toLocaleString('is-IS') + ' kr';

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-7 h-7 text-indigo-400" />
                    Tölfræði - {user.name}
                </h2>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-slate-400">Heildarsala (30d)</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatISK(stats.totalSales)}</p>
                </div>

                <div className="glass rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-slate-400">Meðaltal/sala</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatISK(Math.round(stats.avgPerSale))}</p>
                </div>

                <div className="glass rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span className="text-sm text-slate-400">Bardagasigrar</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {stats.wins}/{stats.wins + stats.losses}
                        <span className="text-sm text-slate-500 ml-2">({Math.round(stats.winRate)}%)</span>
                    </p>
                </div>

                <div className="glass rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-slate-400">Besta klukkustund</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.bestHour}:00</p>
                </div>
            </div>

            {/* Best/Worst Days */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-slate-400">Besti dagur</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-400">{stats.bestDay}</p>
                </div>
                <div className="glass rounded-2xl p-4 border border-rose-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                        <span className="text-sm text-slate-400">Versti dagur</span>
                    </div>
                    <p className="text-xl font-bold text-rose-400">{stats.worstDay}</p>
                </div>
            </div>

            {/* Sales Trend Chart */}
            <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Sala síðustu 14 daga
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyChartData}>
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip
                            formatter={(value: number) => [formatISK(value), 'Sala']}
                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }}
                        />
                        <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Hourly Performance */}
            <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    Afköst eftir klukkustund
                </h3>
                <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={hourlyData}>
                        <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} hide />
                        <Tooltip
                            formatter={(value: number) => [formatISK(value), 'Sala']}
                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }}
                        />
                        <Line type="monotone" dataKey="amount" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Project Breakdown */}
            <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    Verkefnaskipting
                </h3>
                <div className="flex items-center gap-8">
                    <ResponsiveContainer width={150} height={150}>
                        <PieChart>
                            <Pie
                                data={projectData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                            >
                                {projectData.map((_, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                        {projectData.slice(0, 5).map((p, i) => (
                            <div key={p.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-sm text-slate-400">{p.name}</span>
                                </div>
                                <span className="text-sm font-bold text-white">{formatISK(p.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsView;
