
import React from 'react';
import { WageSummary, WageSettings } from '../types';
import { FileText, Printer, Download, Percent } from 'lucide-react';

interface PayslipProps {
  summary: WageSummary;
  settings: WageSettings;
  userName: string;
  onUpdateSettings: (s: WageSettings) => void;
}

const Payslip: React.FC<PayslipProps> = ({ summary, settings, userName, onUpdateSettings }) => {
  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', maximumFractionDigits: 0 }).format(val);
  };

  const currentMonth = new Date().toLocaleDateString('is-IS', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
          <FileText className="text-indigo-400" /> Launaseðill
        </h3>
        <div className="flex gap-2">
          <button className="p-2 glass rounded-lg text-slate-400 hover:text-white transition-all"><Printer size={18} /></button>
          <button className="p-2 glass rounded-lg text-slate-400 hover:text-white transition-all"><Download size={18} /></button>
        </div>
      </div>

      <div className="glass rounded-[40px] p-10 space-y-8 border-white/10 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-2 gradient-bg" />
        
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter">TAKK</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">WageTrack Pro System</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mb-1">Tímabil</p>
            <p className="text-white font-black capitalize text-lg">{currentMonth}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-y border-white/5 py-8">
          <div>
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-2">Starfsmaður</p>
            <p className="text-xl font-black text-white">{userName}</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">ID: {Math.random().toString(10).slice(2,7)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-2">Heildarvinnustundir</p>
            <p className="text-2xl font-black text-white tracking-tighter">{summary.totalHours.toFixed(1)} <span className="text-xs">klst</span></p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-slate-400 uppercase text-[10px] tracking-widest">Heildarlaun (Brúttó)</span>
            <span className="text-white">{formatISK(summary.grossPay)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-slate-400 uppercase text-[10px] tracking-widest">Lífeyrissjóður (4%)</span>
            <span className="text-rose-400">-{formatISK(summary.pensionFund)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-slate-400 uppercase text-[10px] tracking-widest">Stéttarfélagsgjald (0.7%)</span>
            <span className="text-rose-400">-{formatISK(summary.unionFee)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold items-center">
            <span className="text-slate-400 uppercase text-[10px] tracking-widest">
              Skattur ({Math.round((settings.allowanceUsage || 0) * 100)}% afsláttur)
            </span>
            <span className="text-rose-400">-{formatISK(summary.tax)}</span>
          </div>
          
          <div className="pt-6 mt-6 border-t border-white/5 flex justify-between items-end">
            <div>
              <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mb-1">Útgreitt</p>
              <h4 className="text-3xl font-black text-white uppercase tracking-tighter">Nettó Laun</h4>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-indigo-400 tracking-tighter">
                {formatISK(summary.netPay)}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Allowance usage adjustment */}
        <div className="mt-10 p-6 bg-white/2 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Percent size={14} className="text-indigo-400" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nýting persónuafsláttar</p>
            </div>
            <span className="text-xs font-black text-white">{Math.round((settings.allowanceUsage || 0) * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={settings.allowanceUsage || 0} 
            onChange={(e) => onUpdateSettings({...settings, allowanceUsage: parseFloat(e.target.value)})}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider text-center">Dragðu til að breyta skattanýtingu fyrir þetta tímabil</p>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
