import React, { useState, useEffect, useMemo } from 'react';
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
  BarChart4
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
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { Shift, User, Sale, Goals } from './types.ts';
import { DEFAULT_WAGE_SETTINGS, LOGO_URL } from './constants.ts';
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

const App: React.FC = () => {
  console.log("📦 App Component Rendering...");
   
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [goals, setGoals] = useState<Goals>({ daily: 25000, monthly: 800000 });
  const [wageSettings, setWageSettings] = useState(DEFAULT_WAGE_SETTINGS);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Auth Logic & Role Fetching
  useEffect(() => {
    console.log("🔍 Initializing Auth Listener...");
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("🔑 Auth State Changed:", firebaseUser ? `Firebase UID: ${firebaseUser.uid}` : "No Firebase Session");
       
      if (firebaseUser) {
        try {
          const storedStaffId = localStorage.getItem('takk_last_staff_id');
          console.log("📡 Attempting to fetch role for user...");
           
          let profileQuery;
          if (storedStaffId) {
            profileQuery = query(collection(db, "users"), where("staffId", "==", storedStaffId));
          } else {
            profileQuery = query(collection(db, "users"), where("uid", "==", firebaseUser.uid));
          }

          const snap = await getDocs(profileQuery);
          if (!snap.empty) {
            // FIX: Force 'any' type to avoid TS2698 spread error
            const rawData = snap.docs[0].data() as any;
            const userData = { ...rawData, id: snap.docs[0].id } as User;
             
            console.log("✅ User Profile Loaded:", userData.name, `(Role: ${userData.role})`);
            setUser(userData);
            localStorage.setItem('takk_last_staff_id', userData.staffId);
          } else if (storedStaffId === '570') {
            setUser({ id: 'admin-manual', name: 'Addi', staffId: '570', role: 'manager', team: 'Other' });
          } else {
            console.warn("⚠️ No user profile found in Firestore for this session.");
            setUser(null);
          }
        } catch (err) {
          console.error("❌ Firestore Profile Fetch Error:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;
     
    console.log(`📈 Starting Real-time Listeners for ${user.staffId}...`);
     
    const shiftsQ = query(collection(db, "shifts"), where("userId", "==", user.staffId), orderBy("date", "desc"));
    const unsubShifts = onSnapshot(shiftsQ, (snapshot) => {
      setShifts(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Shift)));
    });
     
    const salesQ = query(collection(db, "sales"), where("userId", "==", user.staffId), orderBy("timestamp", "desc"));
    const unsubSales = onSnapshot(salesQ, (snapshot) => {
      setSales(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Sale)));
    });
     
    const configRef = doc(db, "user_configs", user.staffId);
    const unsubConfig = onSnapshot(configRef, (d) => {
      if (d.exists()) {
        const data = d.data();
        if (data.goals) setGoals(data.goals);
        if (data.wageSettings) setWageSettings(data.wageSettings);
      }
    });

    let unsubAllShifts = () => {};
    let unsubAllSales = () => {};
    let unsubAllUsers = () => {};

    if (user.role === 'manager') {
      unsubAllShifts = onSnapshot(collection(db, "shifts"), (snap) => setAllShifts(snap.docs.map(d => ({ ...d.data(), id: d.id } as Shift))));
      unsubAllSales = onSnapshot(collection(db, "sales"), (snap) => setAllSales(snap.docs.map(d => ({ ...d.data(), id: d.id } as Sale))));
      unsubAllUsers = onSnapshot(collection(db, "users"), (snap) => setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User))));
    }

    return () => { 
      unsubShifts(); unsubSales(); unsubConfig(); 
      unsubAllShifts(); unsubAllSales(); unsubAllUsers();
    };
  }, [user]);

  // --- NEW: Pay Period Calculation Logic (26th to 25th) ---
  const periodData = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate();
    
    // Determine start/end based on current day
    let start = new Date(now);
    let end = new Date(now);

    if (currentDay >= 26) {
        // If today is 26th+, period is 26th of THIS month to 25th of NEXT month
        start.setDate(26);
        end.setMonth(end.getMonth() + 1);
        end.setDate(25);
    } else {
        // If today is < 26th, period is 26th of PREVIOUS month to 25th of THIS month
        start.setMonth(start.getMonth() - 1);
        start.setDate(26);
        end.setDate(25);
    }

    // Set time boundaries to ensure full day coverage
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filterByDate = (item: any) => {
        // Handle YYYY-MM-DD string or ISO timestamp
        const itemDate = new Date(item.date || item.timestamp); 
        return itemDate >= start && itemDate <= end;
    };

    return {
        filteredShifts: shifts.filter(filterByDate),
        filteredSales: sales.filter(filterByDate)
    };
  }, [shifts, sales]);

  // Calculate summary ONLY using the filtered period data
  const summary = useMemo(() => calculateWageSummary(periodData.filteredShifts, periodData.filteredSales, wageSettings), [periodData, wageSettings]);

  if (loading) {
    return (
      <div style={{
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#01040f', 
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '50px', 
          height: '50px', 
          border: '5px solid rgba(255,255,255,0.1)', 
          borderTopColor: '#4f46e5', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite'
        }} />
        <h1 style={{ marginTop: '20px', fontWeight: '900', letterSpacing: '-0.05em' }}>CONNECTING TO FIREBASE...</h1>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const isManager = user.role === 'manager';
  const isAdmin = String(user.staffId) === '570';

  const navItems = [
    ...(isManager ? [{ id: 'manager_dash', icon: <BarChart4 size={20} />, label: 'Command Center' }] : []),
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Mælaborð' },
    { id: 'register', icon: <Sparkle size={20} />, label: 'Skráning' },
    { id: 'insights', icon: <PieChart size={20} />, label: 'Greining' },
    { id: 'speech', icon: <Mic2 size={20} />, label: 'Ræðuhjálp' },
    { id: 'history', icon: <History size={20} />, label: 'Vaktasaga' },
    { id: 'payslip', icon: <FileText size={20} />, label: 'Launaseðill' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Stillingar' },
    { id: 'admin', icon: <ShieldCheck size={20} />, label: 'Admin' },
  ];

  return (
    <div className="flex h-screen bg-[#01040f] text-slate-100 font-sans overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-[100] glass border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="p-8 flex flex-col items-center border-b border-white/5 bg-white/2 min-h-[160px] justify-center">
          <div className="flex flex-col items-center">
            {!logoError ? (
              <img src={LOGO_URL} alt="TAKK" className="h-24 w-auto invert brightness-[2] mb-3" onError={() => setLogoError(true)} />
            ) : (
              <span className="text-3xl font-black italic tracking-tighter text-white mb-2">TAKK</span>
            )}
            <h1 className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase italic">WageTrack Pro</h1>
          </div>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); if(window.innerWidth <= 1024) setIsSidebarOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${activeTab === item.id ? (item.id === 'manager_dash' ? 'bg-[#d4af37] text-slate-900 shadow-lg' : 'gradient-bg text-white shadow-lg') : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
            >
              {item.icon}
              <span className="font-bold text-xs uppercase tracking-wider truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <div className="px-4 py-2 bg-indigo-500/10 rounded-xl mb-2">
             <p className={`text-[8px] font-black uppercase tracking-widest ${user.role === 'manager' ? 'text-[#d4af37]' : 'text-indigo-400'}`}>{user.role}</p>
             <p className="text-[10px] font-bold text-white truncate">{user.name}</p>
          </div>
          <button onClick={() => { auth.signOut(); localStorage.removeItem('takk_last_staff_id'); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 hover:text-rose-400 transition-all">
            <LogOut size={20} />
            <span className="font-bold text-xs uppercase tracking-wider">Skrá út</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#01040f] relative overflow-hidden">
        <header className="sticky top-0 z-40 glass border-b border-white/5 px-6 py-5 flex justify-between items-center backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 glass rounded-xl border border-white/10 hover:bg-white/5 transition-all"><Menu size={20} /></button>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight uppercase italic truncate">{navItems.find(n => n.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-xl border border-white/20 ${user.role === 'manager' ? 'bg-[#d4af37] text-slate-900' : 'gradient-bg'}`}>{user.name.charAt(0)}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'manager_dash' && isManager && (
              <ManagerDashboard allShifts={allShifts} allSales={allSales} allUsers={allUsers} currentUser={user} personalSummary={summary} />
            )}
            {(activeTab === 'dashboard' || (!isManager && activeTab === 'manager_dash')) && (
              <Dashboard summary={summary} shifts={shifts} aiInsights={aiInsights} onAddClick={() => setActiveTab('register')} goals={goals} onUpdateGoals={(g) => setDoc(doc(db, "user_configs", user.staffId), { goals: g }, { merge: true })} sales={sales} staffId={user.staffId} />
            )}
            {activeTab === 'register' && (
              <Registration onSaveShift={async (s) => await addDoc(collection(db, "shifts"), { ...s, userId: user.staffId })} onSaveSale={async (s) => await addDoc(collection(db, "sales"), { ...s, userId: user.staffId })} currentSales={sales} shifts={shifts} editingShift={editingShift} goals={goals} onUpdateGoals={(g) => setDoc(doc(db, "user_configs", user.staffId), { goals: g }, { merge: true })} userRole={user.role} />
            )}
            {activeTab === 'insights' && <ProjectInsights sales={sales} shifts={shifts} />}
            {activeTab === 'speech' && <SpeechAssistant summary={summary} />}
            {activeTab === 'history' && <ShiftList shifts={shifts} onDelete={async (id) => await deleteDoc(doc(db, "shifts", id))} onEdit={(s) => { setEditingShift(s); setActiveTab('register'); }} />}
            {activeTab === 'payslip' && <Payslip shifts={shifts} summary={summary} settings={wageSettings} userName={user.name} onUpdateSettings={(s) => setDoc(doc(db, "user_configs", user.staffId), { wageSettings: s }, { merge: true })} />}
            {activeTab === 'admin' && isAdmin && <Admin users={allUsers} onUpdateUsers={setAllUsers} />}
            {activeTab === 'settings' && (
              <div className="glass rounded-[40px] p-8 max-w-2xl border-white/10 mx-auto shadow-2xl">
                <h3 className="text-xl font-black mb-8 text-indigo-400 italic uppercase tracking-tighter text-center">Kerfisstillingar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">Dagvinna (ISK/klst)</label>
                    <input type="number" value={wageSettings.dayRate} onChange={e => setWageSettings({...wageSettings, dayRate: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-black text-2xl outline-none text-center" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">Eftirvinna (ISK/klst)</label>
                    <input type="number" value={wageSettings.eveningRate} onChange={e => setWageSettings({...wageSettings, eveningRate: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-black text-2xl outline-none text-center" />
                  </div>
                </div>
              </div>
            )}
             
            {/* SAFE FALLBACK - This prevents the crash */}
            {activeTab !== 'manager_dash' && activeTab !== 'dashboard' && activeTab !== 'register' && activeTab !== 'insights' && activeTab !== 'speech' && activeTab !== 'history' && activeTab !== 'payslip' && activeTab !== 'admin' && activeTab !== 'settings' && (
              <div className="text-center py-20 text-slate-500">
                <p className="mb-4">Óþekkt síða.</p>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-indigo-600 rounded-lg text-white font-bold hover:bg-indigo-500 transition-all"
                >
                  Fara á mælaborð
                </button>
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
