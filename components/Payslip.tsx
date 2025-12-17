
import React from 'react';
import { WageSummary, WageSettings } from '../types';
import { FileText, Printer, Download } from 'lucide-react';

interface PayslipProps {
  summary: WageSummary;
  settings: WageSettings;
  userName: string;
}

const Payslip: React.FC<PayslipProps> = ({ summary, settings, userName }) => {
  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', maximumFractionDigits: 0 }).format(val);
  };

  const currentMonth = new Date().toLocaleDateString('is-IS', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="text-indigo-400" /> Launaseðill
        </h3>
        <div className="flex gap-2">
          <button className="p-2 glass rounded-lg text-slate-400 hover:text-white transition-all"><Printer size={18} /></button>
          <button className="p-2 glass rounded-lg text-slate-400 hover:text-white transition-all"><Download size={18} /></button>
        </div>
      </div>

      <div className="glass rounded-[40px] p-10 space-y-8 border-white/10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 gradient-bg" />
        
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-white">TAKK</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">WageTrack Pro System</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Tímabil</p>
            <p className="text-white font-bold capitalize">{currentMonth}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-y border-white/5 py-8">
          <div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-2">Starfsmaður</p>
            <p className="text-lg font-bold text-white">{userName}</p>
            <p className="text-slate-400 text-sm italic">Skráður sem: {userName.toLowerCase()}@takk.is</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-2">Heildarvinnustundir</p>
            <p className="text-2xl font-black text-white">{summary.totalHours.toFixed(2)} klst</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Heildarlaun (Brúttó)</span>
            <span className="text-white font-bold">{formatISK(summary.grossPay)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Lífeyrissjóður (4%)</span>
            <span className="text-rose-400 font-medium">-{formatISK(summary.pensionFund)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Stéttarfélagsgjald (0.7%)</span>
            <span className="text-rose-400 font-medium">-{formatISK(summary.unionFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Staðgreiðsla skatta (með persónuafslætti)</span>
            <span className="text-rose-400 font-medium">-{formatISK(summary.tax)}</span>
          </div>
          <div className="pt-6 mt-6 border-t border-white/5 flex justify-between items-end">
            <div>
              <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] mb-1">Útgreitt</p>
              <h4 className="text-4xl font-black text-white">Nettó Laun</h4>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-indigo-400 tracking-tighter">
                {formatISK(summary.netPay)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center">
            <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Þessi seðill er búinn til sjálfvirkt af WageTrack Pro • {new Date().toLocaleDateString('is-IS')}</p>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
