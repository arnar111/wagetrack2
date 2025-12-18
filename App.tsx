
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Settings, 
  BrainCircuit,
  FileText,
  Menu,
  X,
  LogOut,
  Sparkle,
  Mic2,
  PieChart,
  ShieldCheck
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.ts';
import { Shift, WageSummary, User, Sale, Goals } from './types.ts';
import { DEFAULT_WAGE_SETTINGS, LOGO_URL } from './constants.ts';
import { calculateWageSummary } from './utils/calculations.ts';
import { getWageInsights } from './geminiService.ts';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'history' | 'payslip' | 'speech' | 'settings' | 'insights' | 'admin'>('dashboard');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [goals, setGoals] = useState<Goals>({ daily: 25000, monthly: 800000 });
  const [wageSettings, setWageSettings] = useState(DEFAULT_WAGE_SETTINGS);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const q = query(collection(db, "users"));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
      setAllUsers(users);
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    const shiftsQ = query(collection(db, "shifts"), where("userId", "==", user.staffId), orderBy("date", "desc"));
    const unsubShifts = onSnapshot(shiftsQ, (snapshot) => setShifts(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Shift))));
    const salesQ = query(collection(db, "sales"), where("userId", "==", user.staffId), orderBy("timestamp", "desc"));
    const unsubSales = onSnapshot(salesQ, (snapshot) => setSales(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Sale))));
    const configRef = doc(db, "user_configs", user.staffId);
    const unsubConfig = onSnapshot(configRef, (d) => {
      if (d.exists()) {
        const data = d.data();
        if (data.goals) setGoals(data.goals);
        if (data.wageSettings) setWageSettings(data.wageSettings);
      }
    });
    return () => { unsubShifts(); unsubSales(); unsubConfig(); };
  }, [user]);

  const summary = useMemo(() => calculateWageSummary(shifts, sales, wageSettings), [shifts, sales, wageSettings]);

  const handleSaveShift = async (newShift: Shift) => {
    if (!user) return;
    const { id, ...data } = newShift;
    const shiftData = { ...data, userId: user.staffId };
    if (editingShift) {
      await updateDoc(doc(db, "shifts", id), shiftData);
      setEditingShift(null);
    } else {
      const existing = shifts.find(s => s.date === newShift.date);
      if (existing) await updateDoc(doc(db, "shifts", existing.id), shiftData);
      else await addDoc(collection(db, "shifts"), shiftData);
    }
    setActiveTab('dashboard');
  };

  const handleSaveSale = async (newSale: Sale) => {
    if (!user) return;
    const { id, ...data } = newSale;
    await addDoc(collection(db, "sales"), { ...data, userId: user.staffId });
  };

  const handleDeleteShift = async (id: string) => await deleteDoc(doc(db, "shifts", id));
  const handleUpdateGoals = async (newGoals: Goals) => {
    if (!user) return;
    setGoals(newGoals);
    await setDoc(doc(db, "user_configs", user.staffId), { goals: newGoals }, { merge: true });
  };
  const handleUpdateSettings = async (newSettings: any) => {
    if (!user) return;
    setWageSettings(newSettings);
    await setDoc(doc(db, "user_configs", user.staffId), { wageSettings: newSettings }, { merge: true });
  };

  const triggerAiInsights = async () => {
    if (shifts.length === 0) return;
    setIsLoadingInsights(true);
    const insights = await getWageInsights(shifts, summary);
    setAiInsights(insights);
    setIsLoadingInsights(false);
  };

  if (!user) return <Login onLogin={setUser} />;
  const isAdmin = String(user.staffId) === '570';
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Mælaborð' },
    { id: 'register', icon: <Sparkle size={20} />, label: 'Skráning' },
    { id: 'insights', icon: <PieChart size={20} />, label: 'Greining' },
    { id: 'speech', icon: <Mic2 size={20} />, label: 'Ræðuhjálp' },
    { id: 'history', icon: <History size={20} />, label: 'Vaktasaga' },
    { id: 'payslip', icon: <FileText size={20} />, label: 'Launaseðill' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Stillingar' },
    ...(isAdmin ? [{ id: 'admin', icon: <ShieldCheck size={20} />, label: 'Admin' }] : []),
  ];

  return (
    <div className="flex h-screen bg-[#01040f] text-slate-100 font-sans overflow-hidden">
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-[100] glass border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'} ${window.innerWidth > 1024 ? 'relative translate-x-0' : 'fixed'} ${!isSidebarOpen && window.innerWidth > 1024 ? '!hidden' : 'flex'}`}>
        <div className="p-8 flex flex-col items-center border-b border-white/5 bg-white/2 min-h-[160px] justify-center overflow-hidden">
          <div className="flex flex-col items-center">
            {!logoError ? (
              <img src={LOGO_URL} alt="TAKK" className="h-24 w-auto invert brightness-[2] mb-3" onError={() => setLogoError(true)} />
            ) : (
              <span className="text-3xl font-black italic tracking-tighter text-white mb-2">TAKK</span>
            )}
            <h1 className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase italic">LaunaApp Takk</h1>
          </div>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); if(item.id !== 'register') setEditingShift(null); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${activeTab === item.id ? 'gradient-bg text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
              <span className="shrink-0">{item.icon}</span>
              <span className="font-bold text-xs uppercase tracking-wider truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <button onClick={() => setUser(null)} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 hover:text-rose-400 transition-all">
            <LogOut size={20} className="shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wider">Skrá út</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 bg-[#01040f] relative overflow-hidden">
        <header className="sticky top-0 z-40 glass border-b border-white/5 px-6 py-5 flex justify-between items-center backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 glass rounded-xl border border-white/10 hover:bg-white/5 transition-all group"><Menu size={20} /></button>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight uppercase italic truncate">{navItems.find(n => n.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={triggerAiInsights} disabled={isLoadingInsights || shifts.length === 0} className="hidden sm:flex items-center gap-2 px-4 py-2 glass border-indigo-500/30 rounded-full text-[10px] font-black text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-30">
               <BrainCircuit size={14} /> {isLoadingInsights ? "Sæki..." : "AI Innsýn"}
             </button>
             <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-black text-sm shadow-xl border border-white/20">{user.name.charAt(0)}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-10 pb-32 md:pb-10">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === 'dashboard' && (
              <Dashboard 
                summary={summary} 
                shifts={shifts} 
                aiInsights={aiInsights} 
                onAddClick={() => setActiveTab('register')} 
                goals={goals} 
                onUpdateGoals={handleUpdateGoals} 
                sales={sales} 
                staffId={user.staffId} 
              />
            )}
            {activeTab === 'register' && <Registration onSaveShift={handleSaveShift} onSaveSale={handleSaveSale} currentSales={sales} shifts={shifts} editingShift={editingShift} goals={goals} onUpdateGoals={handleUpdateGoals} />}
            {activeTab === 'insights' && <ProjectInsights sales={sales} shifts={shifts} />}
            {activeTab === 'speech' && <SpeechAssistant summary={summary} />}
            {activeTab === 'history' && <ShiftList shifts={shifts} onDelete={handleDeleteShift} onEdit={(s) => { setEditingShift(s); setActiveTab('register'); }} />}
            {activeTab === 'payslip' && <Payslip summary={summary} settings={wageSettings} userName={user.name} onUpdateSettings={handleUpdateSettings} />}
            {activeTab === 'admin' && isAdmin && <Admin users={allUsers} onUpdateUsers={setAllUsers} />}
            {activeTab === 'settings' && (
              <div className="glass rounded-[40px] p-8 max-w-2xl border-white/10 mx-auto shadow-2xl">
                <h3 className="text-xl font-black mb-8 text-indigo-400 italic uppercase tracking-tighter text-center">Kerfisstillingar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest text-center">Dagvinna (ISK/klst)</label>
                    <input type="number" value={wageSettings.dayRate} onChange={e => handleUpdateSettings({...wageSettings, dayRate: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-black text-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-center" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest text-center">Eftirvinna (ISK/klst)</label>
                    <input type="number" value={wageSettings.eveningRate} onChange={e => handleUpdateSettings({...wageSettings, eveningRate: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-black text-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-center" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <MobileDock activeTab={activeTab} onTabChange={setActiveTab} onMenuClick={() => setIsSidebarOpen(true)} />
      </div>
      <Chatbot />
    </div>
  );
};

export default App;
