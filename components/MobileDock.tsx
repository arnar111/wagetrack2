
import React from 'react';
import { LayoutDashboard, Sparkle, PieChart, Mic2, Menu } from 'lucide-react';

interface MobileDockProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onMenuClick: () => void;
}

const MobileDock: React.FC<MobileDockProps> = ({ activeTab, onTabChange, onMenuClick }) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={24} />, label: 'Heim' },
    { id: 'register', icon: <Sparkle size={24} />, label: 'Skrá' },
    { id: 'insights', icon: <PieChart size={24} />, label: 'Greining' },
    { id: 'speech', icon: <Mic2 size={24} />, label: 'Ræða' },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
      <div className="glass bg-slate-900/90 border border-white/10 rounded-[32px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex justify-between items-center px-4 pointer-events-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`p-3 rounded-full transition-all duration-300 relative ${
              activeTab === item.id 
                ? 'text-white bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] -translate-y-2' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {item.icon}
            {activeTab === item.id && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-indigo-300 animate-in fade-in slide-in-from-bottom-2">
                {item.label}
              </span>
            )}
          </button>
        ))}
        <button 
          onClick={onMenuClick}
          className="p-3 rounded-full text-slate-500 hover:text-slate-300 transition-all"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
};

export default MobileDock;
