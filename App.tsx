
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  BrainCircuit,
  ShoppingBag,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Shift, WageSummary, User, Sale } from './types';
import { DEFAULT_WAGE_SETTINGS, LOGO_URL } from './constants';
import { calculateWageSummary } from './utils/calculations';
import { getWageInsights } from './geminiService';
import Dashboard from './components/Dashboard';
import ShiftForm from './components/ShiftForm';
import ShiftList from './components/ShiftList';
import SaleForm from './components/SaleForm';
import Payslip from './components/Payslip';
import Login from './components/Login';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'sale' | 'history' | 'payslip' | 'settings'>('dashboard');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [wageSettings, setWageSettings] = useState(DEFAULT_WAGE_SETTINGS);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load user data on login
  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`takk_data_${user.staffId}`);
      if (savedData) {
        const { shifts: savedShifts, sales: savedSales } = JSON.parse(savedData);
        setShifts(savedShifts || []);
        setSales(savedSales || []);
      } else {
        setShifts([]);
        setSales([]);
      }
    }
  }, [user]);

  // Save user data
  useEffect(() => {
    if (user) {
      const data = JSON.stringify({ shifts, sales });
      localStorage.setItem(`takk_data_${user.staffId}`, data);
    }
  }, [shifts, sales, user]);

  const summary = useMemo(() => calculateWageSummary(shifts, sales, wageSettings), [shifts, sales, wageSettings]);

  const handleAddShift = (newShift: Shift) => {
    setShifts(prev => [newShift, ...prev]);
    setActiveTab('dashboard');
  };

  const handleAddSale = (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
    setActiveTab('dashboard');
  };

  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const triggerAiInsights = async () => {
    if (shifts.length === 0) return;
    setIsLoadingInsights(true);
    const insights = await getWageInsights(shifts, summary);
    setAiInsights(insights);
    setIsLoadingInsights(false);
  };

  if (!user) return <Login onLogin={setUser} />;

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Mælaborð' },
    { id: 'add', icon: <PlusCircle size={20} />, label: 'Skrá Vakt' },
    { id: 'sale', icon: <ShoppingBag size={20} />, label: 'Skrá Sölu' },
    { id: 'history', icon: <History size={20} />, label: 'Vaktasaga' },
    { id: 'payslip', icon: <FileText size={20} />, label: 'Launaseðill' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Stillingar' },
  ];

  return (
    <div className="min-h-screen flex bg-[#020617] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-24'
        } glass border-r border-white/5 transition-all duration-500 ease-out flex flex-col z-50`}
      >
        <div className="p-8 flex flex-col items-center border-b border-white/5">
          <div className="relative mb-6">
            <img 
              src={LOGO_URL} 
              alt="TAKK" 
              className={`transition-all duration-500 invert brightness-0 ${isSidebarOpen ? 'h-20' : 'h-10'}`} 
            />
          </div>
          {isSidebarOpen && (
            <div className="text-center">
              <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">WageTrack Pro</h1>
              <p className="text-[10px] text-indigo-400 font-bold tracking-[0.3em] mt-1 uppercase">Halló {user.name}!</p>
            </div>
          )}
        </div>

        <nav className="flex-1 mt-8 px-4 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'gradient-bg text-white shadow-xl shadow-indigo-500/20' 
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-2">
          <button 
            onClick={() => setUser(null)}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold text-sm">Skrá út</span>}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-3 rounded-xl text-slate-600 hover:bg-white/5 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">
              {activeTab === 'dashboard' && "Mælaborð"}
              {activeTab === 'add' && "Ný Vakt"}
              {activeTab === 'sale' && "Ný Sala"}
              {activeTab === 'history' && "Sagan þín"}
              {activeTab === 'payslip' && "Yfirlit launa"}
              {activeTab === 'settings' && "Stillingar kerfis"}
            </h2>
            <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
              Kerfið er uppfært: {new Date().toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}
              <span className="h-1 w-1 rounded-full bg-indigo-500 animate-ping" />
            </p>
          </div>

          <div className="flex items-center gap-4">
             <button 
               onClick={triggerAiInsights}
               disabled={isLoadingInsights || shifts.length === 0}
               className="flex items-center gap-2 px-6 py-3 glass border-white/10 rounded-full text-sm font-bold text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all disabled:opacity-30"
             >
               <BrainCircuit size={18} />
               {isLoadingInsights ? "Greini..." : "AI Innsýn"}
             </button>
             <div className="h-12 w-12 rounded-full gradient-bg flex items-center justify-center text-white font-black text-lg shadow-xl shadow-indigo-500/40">
               {user.name.charAt(0)}
             </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {activeTab === 'dashboard' && (
            <Dashboard 
              summary={summary} 
              shifts={shifts} 
              aiInsights={aiInsights}
              onAddClick={() => setActiveTab('add')}
            />
          )}
          
          {activeTab === 'add' && <ShiftForm onSave={handleAddShift} />}
          {activeTab === 'sale' && <SaleForm onSave={handleAddSale} />}
          {activeTab === 'history' && <ShiftList shifts={shifts} onDelete={handleDeleteShift} />}
          {activeTab === 'payslip' && <Payslip summary={summary} settings={wageSettings} userName={user.name} />}

          {activeTab === 'settings' && (
            <div className="glass rounded-[40px] p-10 max-w-2xl border-white/10">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                <Settings size={28} className="text-indigo-400" />
                Launastillingar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Lífeyrissjóður (%)</label>
                  <input 
                    type="number" 
                    value={wageSettings.pensionRate * 100} 
                    onChange={e => setWageSettings({...wageSettings, pensionRate: parseFloat(e.target.value)/100})}
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Stéttarfélag (%)</label>
                  <input 
                    type="number" 
                    value={wageSettings.unionRate * 100} 
                    onChange={e => setWageSettings({...wageSettings, unionRate: parseFloat(e.target.value)/100})}
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Skatthlutfall (%)</label>
                  <input 
                    type="number" 
                    value={wageSettings.taxRate * 100} 
                    onChange={e => setWageSettings({...wageSettings, taxRate: parseFloat(e.target.value)/100})}
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Persónuafsláttur</label>
                  <input 
                    type="number" 
                    value={wageSettings.personalAllowance} 
                    onChange={e => setWageSettings({...wageSettings, personalAllowance: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-10 p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-sm text-indigo-300 font-medium leading-relaxed">
                Stillingar þessar eru notaðar til að reikna út launaseðil og nettó tekjur. Kerfið miðar sjálfgefið við íslenska skattastaðla ársins 2024.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
