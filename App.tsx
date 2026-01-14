import React, { useState, useEffect, useMemo, useCallback } from 'react';
import NotificationBell from './components/NotificationBell.tsx';
import MessagesButton from './components/MessagesButton.tsx';
import MessagesPage from './components/MessagesPage.tsx';
import { useMessages } from './hooks/useMessages';
import { useAuth } from './hooks/useAuth';
import { useBattles } from './hooks/useBattles';
import { useUserConfig } from './hooks/useUserConfig';
import { useShiftClock } from './hooks/useShiftClock';
import { usePresence } from './hooks/usePresence';
import { useSalesData } from './hooks/useSalesData';
import { useToast } from './components/Toast';
import { useAdminCheck } from './hooks/useAdminCheck';
import { useStreaks } from './hooks/useStreaks';
import { useSounds } from './hooks/useSounds';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import {
  LayoutDashboard,
  History,
  Settings,
  Mic2,
  FileText,
  Menu,
  LogOut,
  Sparkle,
  PieChart,
  ShieldCheck,
  BarChart4,
  Trophy,
  MessageSquare,
  Users
} from 'lucide-react';
import { doc, setDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { calculateWageSummary } from './utils/calculations.ts';

// Components
import Dashboard from './components/Dashboard.tsx';
import Registration from './components/Registration.tsx';
import ShiftList from './components/ShiftList.tsx';
import Payslip from './components/Payslip.tsx';
import Login from './components/Login.tsx';
import SpeechAssistant from './components/SpeechAssistant.tsx';
import ProjectInsights from './components/ProjectInsights.tsx';
import Admin from './components/Admin.tsx';
import Chatbot from './components/Chatbot.tsx';
import MobileDock from './components/MobileDock.tsx';
import ManagerDashboard from './components/ManagerDashboard.tsx';
import DailyStats from './components/DailyStats.tsx';
import GhostSeeder from './components/GhostSeeder.tsx';
import CompetitionsPage from './components/Competitions/CompetitionsPage.tsx';
import UserSwitcher from './components/UserSwitcher.tsx';
import StatsView from './components/StatsView.tsx';
import ChallengesPanel from './components/ChallengesPanel.tsx';
import ManagerCoachingView from './components/ManagerCoachingView.tsx';
import SpectatorView from './components/Competitions/SpectatorView.tsx';

const App: React.FC = () => {
  console.log("📦 App Component Rendering...");

  // --- HOOKS ---
  const { user, realUser, impersonatedUser, loading, isImpersonating, logout, switchUser } = useAuth();
  const { showToast } = useToast();

  // Battle callbacks for toast notifications
  const battleCallbacks = useMemo(() => ({
    onError: (msg: string) => showToast(msg, 'error'),
    onSuccess: (msg: string) => showToast(msg, 'success'),
  }), [showToast]);

  const {
    battles,
    invites,
    createBattle,
    cancelBattle,
    acceptInvite,
    declineInvite,
    getActiveBattleWithLiveScores
  } = useBattles(user?.staffId, battleCallbacks);

  const { isAdmin, isManager } = useAdminCheck(user);

  const {
    goals,
    wageSettings,
    requireOFCheck,
    autoPausesEnabled,
    coachPersonality,
    updateGoals,
    updateRequireOFCheck,
    updateAutoPausesEnabled,
    updateCoachPersonality
  } = useUserConfig(user?.staffId);

  const { isShiftActive, clockInTime, handleClockIn, handleClockOut } = useShiftClock();

  const {
    sales,
    allSales,
    shifts,
    allUsers,
    periodData
  } = useSalesData(user?.staffId);

  const { userStatuses } = usePresence(user?.staffId, allUsers);

  const messaging = useMessages(
    user?.staffId || '',
    user?.name || 'User',
    user?.name?.substring(0, 2).toUpperCase() || 'ME'
  );

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [logoError, setLogoError] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [dailyBounties, setDailyBounties] = useState<{ task: string, reward: string }[]>([]);
  const [spectatingBattle, setSpectatingBattle] = useState<any>(null);

  // --- PERSISTED REGISTRATION STATE (survives tab switching) ---
  const [persistedSaleType, setPersistedSaleType] = useState<'new' | 'upgrade'>('new');
  const [persistedSaleData, setPersistedSaleData] = useState({ amount: 0, project: 'Einstaklingur' });
  const [persistedBreakMinutes, setPersistedBreakMinutes] = useState(0);
  const [persistedBreakEndTime, setPersistedBreakEndTime] = useState<Date | null>(null);
  const [persistedOfChecked, setPersistedOfChecked] = useState(false);

  // New feature hooks
  const { currentStreak, isActive: streakIsActive } = useStreaks(user?.staffId, sales);
  const { playSound } = useSounds();
  const { isOnline, pendingCount, queueSale, syncQueue } = useOfflineQueue();

  // Initialize daily bounties
  useEffect(() => {
    const bounties = [
      { task: "Safnaðu 5.000 kr þennan klukkutímann", reward: "⚡ Power Hour" },
      { task: "Tvær sölur á næstu 60 mínútum", reward: "🔥 Hot Streak" },
      { task: "Náðu 25.000 kr fyrir lok vaktar", reward: "🏆 Daily Goal Hero" },
      { task: "Seldu fyrir yfir 30.000 kr í dag", reward: "💎 High Roller" },
      { task: "3 'Nýir' sölur í röð", reward: "🎲 Hat Trick" },
      { task: "Fylltu hringinn fyrir pásu", reward: "⭕ Circle K" }
    ];
    const shuffled = bounties.sort(() => 0.5 - Math.random());
    setDailyBounties(shuffled.slice(0, 3));
  }, []);

  // Handle sidebar resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- AUTO-LOGOUT BY LOCATION ---
  useEffect(() => {
    if (!user || !isShiftActive || !clockInTime) return;

    const closingHours: { [key: string]: number } = {
      'Hringurinn': 19, // 7pm
      'Verið': 21,      // 9pm
      'Götuteymið': 23  // 11pm (default late)
    };

    const checkAutoLogout = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const closingHour = closingHours[user.team] || 23;

      if (currentHour >= closingHour) {
        console.log(`⏰ Auto-logout triggered for ${user.team} at ${currentHour}:00 (closes at ${closingHour}:00)`);
        showToast(`Sjálfvirk útskráning - ${user.team} lokar kl. ${closingHour}:00`, 'info');

        // Trigger clock out with proper shift data
        const startTime = new Date(clockInTime);
        const shiftDateStr = startTime.toISOString().split('T')[0];
        const shiftSales = sales.filter(s => s.date === shiftDateStr);
        const totalShiftSales = shiftSales.reduce((acc, s) => acc + s.amount, 0);

        await handleClockOut({
          id: Math.random().toString(36).substr(2, 9),
          date: shiftDateStr,
          dayHours: 0, // Will be calculated by hook
          eveningHours: 0,
          totalSales: totalShiftSales,
          notes: 'Sjálfvirk útskráning',
          projectName: 'Other',
          userId: ''
        }, user.staffId);
      }
    };

    // Check immediately and then every minute
    checkAutoLogout();
    const interval = setInterval(checkAutoLogout, 60000);
    return () => clearInterval(interval);
  }, [user, isShiftActive, clockInTime, sales, handleClockOut, showToast]);

  // --- DEMO BATTLE FOR USER 123 ---
  const [demoBattleState, setDemoBattleState] = useState<'winning' | 'tied' | 'losing'>('winning');
  const [demoBotScore, setDemoBotScore] = useState(15000);

  useEffect(() => {
    if (user?.staffId !== '123') return;

    // Cycle through states every 10 seconds
    const interval = setInterval(() => {
      setDemoBattleState(prev => {
        if (prev === 'winning') return 'tied';
        if (prev === 'tied') return 'losing';
        return 'winning';
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.staffId]);

  // Update bot score based on state
  useEffect(() => {
    if (user?.staffId !== '123') return;

    const todayStr = new Date().toISOString().split('T')[0];
    const userSalesToday = sales.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.amount, 0);

    if (demoBattleState === 'winning') {
      setDemoBotScore(Math.max(0, userSalesToday - 5000 - Math.floor(Math.random() * 3000)));
    } else if (demoBattleState === 'tied') {
      setDemoBotScore(userSalesToday + Math.floor(Math.random() * 500) - 250);
    } else {
      setDemoBotScore(userSalesToday + 3000 + Math.floor(Math.random() * 5000));
    }
  }, [demoBattleState, sales, user?.staffId]);

  // Create demo battle object for user 123
  const demoBattle = useMemo(() => {
    if (user?.staffId !== '123') return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const userSalesToday = sales.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.amount, 0);

    const now = new Date();
    const endTime = new Date(now.getTime() + 45 * 60 * 1000); // 45 min from now

    return {
      id: 'demo-battle-123',
      type: 'standard' as const,
      participants: [
        {
          userId: '123',
          name: user?.name || 'Demo User',
          avatar: 'DU',
          currentSales: userSalesToday,
          salesCount: sales.filter(s => s.date === todayStr).length
        },
        {
          userId: 'bot-rival',
          name: 'Keppandi Karl',
          avatar: 'KK',
          currentSales: demoBotScore,
          salesCount: Math.floor(demoBotScore / 1500)
        }
      ],
      format: { duration: 'standard' as const, durationMinutes: 120 },
      startTime: new Date(now.getTime() - 75 * 60 * 1000).toISOString(),
      endTime: endTime.toISOString(),
      targetType: 'highest_total' as const,
      targetValue: 50000,
      handicaps: {},
      status: 'active' as const,
      createdBy: '123',
      createdAt: new Date(now.getTime() - 75 * 60 * 1000).toISOString()
    };
  }, [user, sales, demoBotScore]);

  // --- COMPUTED VALUES ---
  const summary = useMemo(() =>
    calculateWageSummary(periodData.filteredShifts, periodData.filteredSales, wageSettings),
    [periodData, wageSettings]
  );

  const realActiveBattle = useMemo(() =>
    getActiveBattleWithLiveScores(allSales),
    [allSales, getActiveBattleWithLiveScores]
  );

  // Use demo battle for user 123 if no real battle exists
  const activeBattleWithScores = user?.staffId === '123' && !realActiveBattle ? demoBattle : realActiveBattle;

  // --- HANDLERS ---
  const onClockIn = (goal: number) => {
    handleClockIn(goal, (g) => {
      if (user) {
        setDoc(doc(db, "user_configs", user.staffId), { goals: { ...goals, daily: g } }, { merge: true });
        updateGoals({ ...goals, daily: g });
      }
    });
  };

  const onClockOut = async (shiftData: any) => {
    if (!user) return;
    await handleClockOut(shiftData, user.staffId);
  };

  // --- LOADING & AUTH ---
  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-[#01040f] text-white font-black">LOADING...</div>;
  }

  if (!user) {
    return <Login onLogin={() => { }} />;
  }

  const navItems = [
    ...(isManager ? [{ id: 'manager_dash', icon: <BarChart4 size={20} />, label: 'Command Center' }] : []),
    ...(isManager ? [{ id: 'coaching', icon: <Users size={20} />, label: 'Þjálfun' }] : []),
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Mælaborð' },
    { id: 'register', icon: <Sparkle size={20} />, label: 'Skráning' },
    { id: 'insights', icon: <PieChart size={20} />, label: 'Greining' },
    { id: 'stats', icon: <BarChart4 size={20} />, label: 'Tölfræði' },
    { id: 'competitions', icon: <Trophy size={20} />, label: 'The Arena' },
    { id: 'messages', icon: <MessageSquare size={20} />, label: 'Skilaboð' },
    { id: 'speech', icon: <Mic2 size={20} />, label: 'MorriAI' },
    { id: 'history', icon: <History size={20} />, label: 'Vaktasaga' },
    { id: 'payslip', icon: <FileText size={20} />, label: 'Launaseðill' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Stillingar' },
    { id: 'admin', icon: <ShieldCheck size={20} />, label: 'Admin' },
  ];

  return (
    <div className="flex h-screen bg-[#01040f] text-slate-100 font-sans overflow-hidden">

      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-[40] glass border-b border-white/5 h-16 flex items-center justify-between px-6 lg:pl-72">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-all lg:hidden"><Menu size={20} /></button>
          <h1 className="text-sm font-black text-white tracking-wider hidden md:block">Takk Arena</h1>
        </div>
        <div className="flex items-center gap-4">
          {isImpersonating && (
            <span className="text-xs text-amber-400 font-medium hidden md:block">👁 Viewing as: {user?.name}</span>
          )}
          <span className="text-sm text-slate-400 hidden md:block">{isImpersonating ? realUser?.name : user?.name || 'User'}</span>
          {realUser && (
            <UserSwitcher
              currentUser={realUser}
              allUsers={allUsers}
              impersonatedUser={impersonatedUser}
              onSwitchUser={switchUser}
            />
          )}
          <MessagesButton
            messages={messaging.messages}
            currentUserId={user?.staffId || ''}
            onSendMessage={messaging.sendMessage}
            allUsers={allUsers.map(u => ({
              id: u.staffId,
              staffId: u.staffId,
              name: u.name,
              avatar: u.name.substring(0, 2).toUpperCase()
            }))}
            userStatuses={userStatuses}
            sales={sales}
            shifts={shifts}
          />
          <NotificationBell
            feedNotifications={[]}
            invites={invites}
            onAcceptInvite={acceptInvite}
            onDeclineInvite={declineInvite}
          />
        </div>
      </header>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-[50] glass border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 lg:relative lg:translate-x-0`}>
        <div className="p-8 flex flex-col items-center border-b border-white/5 bg-white/2 min-h-[160px] justify-center">
          <img src="/logo_final.svg" alt="TAKK" className="h-24 w-full mb-3" onError={() => setLogoError(true)} />
          <h1 className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase italic">Takk Arena</h1>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); if (window.innerWidth <= 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${activeTab === item.id ? 'gradient-bg text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
              {item.icon}
              <span className="font-bold text-xs uppercase tracking-wider truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <div className="px-4 py-2 bg-indigo-500/10 rounded-xl mb-2">
            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400">{user.role}</p>
            <p className="text-[10px] font-bold text-white truncate">{user.name}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 hover:text-rose-400 transition-all">
            <LogOut size={20} />
            <span className="font-bold text-xs uppercase tracking-wider">Skrá út</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#01040f] relative overflow-hidden pt-16">
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'manager_dash' && isManager && <ManagerDashboard allShifts={[]} allSales={allSales} allUsers={allUsers} currentUser={user} personalSummary={summary} />}
            {(activeTab === 'dashboard' || (!isManager && activeTab === 'manager_dash')) && (
              <Dashboard
                isShiftActive={isShiftActive}
                clockInTime={clockInTime}
                onClockIn={onClockIn}
                onClockOut={onClockOut}
                summary={summary}
                shifts={shifts}
                periodShifts={periodData.filteredShifts}
                aiInsights={aiInsights}
                onAddClick={() => setActiveTab('register')}
                goals={goals}
                onUpdateGoals={updateGoals}
                sales={sales}
                staffId={user.staffId}
                coachPersonality={coachPersonality}
              />
            )}

            {activeTab === 'daily' && <DailyStats sales={sales} goals={goals} />}

            {activeTab === 'register' && (
              <Registration
                isShiftActive={isShiftActive}
                clockInTime={clockInTime}
                onClockIn={onClockIn}
                onClockOut={onClockOut}
                onSaveShift={async (s) => await addDoc(collection(db, "shifts"), { ...s, userId: user.staffId })}
                onSaveSale={async (s) => await addDoc(collection(db, "sales"), { ...s, userId: user.staffId })}
                onDeleteSale={async (id) => await deleteDoc(doc(db, "sales", id))}
                onUpdateSale={async (s) => await setDoc(doc(db, "sales", s.id), s, { merge: true })}
                onUpdateShift={async (s) => { await setDoc(doc(db, "shifts", s.id), s, { merge: true }); }}
                onClearEditingShift={() => setEditingShift(null)}
                currentSales={sales}
                shifts={shifts}
                editingShift={editingShift}
                goals={goals}
                onUpdateGoals={updateGoals}
                userRole={user.role}
                userId={user.staffId}
                dailyBounties={dailyBounties}
                coachPersonality={coachPersonality}
                onTabChange={setActiveTab}
                requireOFCheck={requireOFCheck}
                autoPausesEnabled={autoPausesEnabled}
                user={user}
                activeBattle={activeBattleWithScores}
                // Persisted state props
                persistedSaleType={persistedSaleType}
                onSaleTypeChange={setPersistedSaleType}
                persistedSaleData={persistedSaleData}
                onSaleDataChange={setPersistedSaleData}
                persistedBreakMinutes={persistedBreakMinutes}
                onBreakMinutesChange={setPersistedBreakMinutes}
                persistedBreakEndTime={persistedBreakEndTime}
                onBreakEndTimeChange={setPersistedBreakEndTime}
                persistedOfChecked={persistedOfChecked}
                onOfCheckedChange={setPersistedOfChecked}
              />
            )}
            {activeTab === 'insights' && <ProjectInsights sales={sales} shifts={shifts} />}

            {activeTab === 'stats' && (
              <StatsView
                sales={sales}
                shifts={shifts}
                battles={battles}
                user={user}
              />
            )}

            {activeTab === 'coaching' && isManager && (
              <ManagerCoachingView
                currentUser={user}
                allUsers={allUsers}
                sales={allSales}
                shifts={shifts}
              />
            )}

            {activeTab === 'competitions' && (
              <CompetitionsPage
                sales={allSales}
                shifts={shifts}
                user={user}
                allUsers={allUsers}
                battles={battles}
                onCreateBattle={createBattle}
                onCancelBattle={cancelBattle}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesPage
                messages={messaging.messages}
                currentUserId={user?.staffId || ''}
                currentUserName={user?.name || 'User'}
                currentUserAvatar={user?.name?.substring(0, 2).toUpperCase() || 'ME'}
                allUsers={allUsers}
                userStatuses={userStatuses}
                onSendMessage={messaging.sendMessage}
                sales={sales}
                shifts={shifts}
              />
            )}
            {activeTab === 'speech' && <SpeechAssistant summary={summary} />}
            {activeTab === 'history' && (
              <ShiftList shifts={shifts} onDelete={async (id) => await deleteDoc(doc(db, "shifts", id))} onEdit={(s) => { setEditingShift(s); setActiveTab('register'); }} onAddShift={async (s) => await addDoc(collection(db, "shifts"), { ...s, userId: user.staffId })} />
            )}
            {activeTab === 'payslip' && <Payslip shifts={shifts} sales={sales} summary={summary} settings={wageSettings} userName={user.name} onUpdateSettings={(s) => setDoc(doc(db, "user_configs", user.staffId), { wageSettings: s }, { merge: true })} />}
            {activeTab === 'admin' && isAdmin && <Admin users={allUsers} onUpdateUsers={() => { }} />}
            {activeTab === 'settings' && (
              <div className="glass rounded-[40px] p-8 max-w-4xl border-white/10 mx-auto shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-indigo-500/20">
                    <Settings size={28} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Stillingar</h2>
                    <p className="text-sm text-slate-500 font-bold">Sérsniðnar stillingar</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* OF Check Toggle */}
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1">Krefjast OF skráningar</h3>
                      <p className="text-xs text-slate-500">Þegar kveikt, þarftu að haka við OF reitinn áður en þú getur vistað sölu</p>
                    </div>
                    <button
                      onClick={() => updateRequireOFCheck(!requireOFCheck)}
                      className={`w-14 h-8 rounded-full transition-all relative ${requireOFCheck ? 'bg-emerald-500' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${requireOFCheck ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Auto Pauses Toggle */}
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1">Sjálfvirkar pásum</h3>
                      <p className="text-xs text-slate-500">Sýna hnappa til að skrá 15 eða 30 mínútna pásum í skráningarflipa</p>
                    </div>
                    <button
                      onClick={() => updateAutoPausesEnabled(!autoPausesEnabled)}
                      className={`w-14 h-8 rounded-full transition-all relative ${autoPausesEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${autoPausesEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Coach Personality Selector */}
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1">MorriAI Þjálfari</h3>
                    <p className="text-xs text-slate-500 mb-4">Veldu persónuleika fyrir þjálfarann þinn</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'standard', name: 'Venjulegur', emoji: '🎯', desc: 'Jákvæður og hvetjandi' },
                        { id: 'drill_sergeant', name: 'Herforingi', emoji: '🎖️', desc: 'Harður og beinskeyttur' },
                        { id: 'zen_master', name: 'Zen Meistari', emoji: '🧘', desc: 'Rólegt og íhugt' },
                        { id: 'wolf', name: 'Úlfurinn', emoji: '🐺', desc: 'Samkeppnishvattur' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => updateCoachPersonality(p.id)}
                          className={`p-4 rounded-2xl text-left transition-all ${coachPersonality === p.id
                            ? 'bg-indigo-500/30 border-2 border-indigo-500'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                            }`}
                        >
                          <span className="text-2xl mb-2 block">{p.emoji}</span>
                          <p className="font-black text-white text-sm">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Goals Display */}
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mb-4">Núverandi markmið</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-2xl bg-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Daglegt</p>
                        <p className="text-xl font-black text-emerald-400">{(goals?.daily ?? 0).toLocaleString('is-IS')}</p>
                      </div>
                      <div className="text-center p-4 rounded-2xl bg-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Vikulegt</p>
                        <p className="text-xl font-black text-amber-400">{(goals?.weekly ?? 0).toLocaleString('is-IS')}</p>
                      </div>
                      <div className="text-center p-4 rounded-2xl bg-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Mánaðarlegt</p>
                        <p className="text-xl font-black text-violet-400">{(goals?.monthly ?? 0).toLocaleString('is-IS')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <MobileDock activeTab={activeTab} onTabChange={setActiveTab} onMenuClick={() => setIsSidebarOpen(true)} />
      </div>

      <div className="hidden md:block">
        <Chatbot />
      </div>

      <GhostSeeder user={user} />

      {/* Spectator View Overlay */}
      {spectatingBattle && (
        <SpectatorView
          battle={spectatingBattle}
          allSales={allSales}
          allUsers={allUsers}
          onClose={() => setSpectatingBattle(null)}
        />
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-amber-500/90 text-black px-4 py-2 rounded-xl flex items-center gap-2 z-50 shadow-lg">
          <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
          <span className="text-sm font-bold">Utan nets - {pendingCount} í biðröð</span>
        </div>
      )}
    </div >
  );
};

export default App;
