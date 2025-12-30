import React, { useMemo, useState } from 'react';
import { WageSummary, WageSettings, Shift, Sale } from '../types';
import { Wallet, TrendingDown, Percent, AlertCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { calculateSalesBonus } from '../utils/calculations.ts';

interface PayslipProps {
  shifts: Shift[];
  sales?: Sale[];
  summary: WageSummary; // This is the "global" summary, but we will calculate local summary for history
  settings: WageSettings;
  userName: string;
  onUpdateSettings: (s: WageSettings) => void;
}

const Payslip: React.FC<PayslipProps> = ({ shifts, sales = [], settings, userName, onUpdateSettings }) => {
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);

  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { 
      style: 'currency', 
      currency: 'ISK', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  // --- 1. Generate Last 10 Pay Periods ---
  const periods = useMemo(() => {
    const list = [];
    const now = new Date();
    
    // Determine current period end date (25th of this or next month)
    let currentEnd = new Date(now);
    if (now.getDate() >= 26) {
        currentEnd.setMonth(currentEnd.getMonth() + 1);
    }
    currentEnd.setDate(25);
    currentEnd.setHours(23, 59, 59, 999);

    for (let i = 0; i < 10; i++) {
        const end = new Date(currentEnd);
        end.setMonth(end.getMonth() - i);
        
        const start = new Date(end);
        start.setMonth(start.getMonth() - 1);
        start.setDate(26);
        start.setHours(0, 0, 0, 0);

        list.push({
            id: i,
            start,
            end,
            label: `${start.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' })}`,
            yearLabel: end.getFullYear() // Use end year for label
        });
    }
    return list;
  }, []);

  const activePeriod = periods[selectedPeriodIndex];

  // --- 2. Calculate Payroll for Selected Period ---
  const payroll = useMemo(() => {
    if (!activePeriod) return null;

    // Filter Shifts
    const periodShifts = shifts.filter(s => {
        const d = new Date(s.date);
        return d >= activePeriod.start && d <= activePeriod.end;
    });

    // Filter Sales
    const periodSalesList = sales.filter(s => {
        const d = new Date(s.date || s.timestamp);
        return d >= activePeriod.start && d <= activePeriod.end;
    });

    const periodTotalSales = periodSalesList.reduce((acc, s) => acc + s.amount, 0);

    const dayRate = settings.dayRate || 2724.88;
    const eveningRate = settings.eveningRate || 3768.47;
    const orlofRate = 0.1017;
    const pensionRate = 0.04;
    const unionRate = 0.007;

    const totalDayHours = periodShifts.reduce((acc, s) => acc + s.dayHours, 0);
    const totalEveningHours = periodShifts.reduce((acc, s) => acc + s.eveningHours, 0);
    const totalHours = totalDayHours + totalEveningHours;

    const dayEarnings = totalDayHours * dayRate;
    const eveningEarnings = totalEveningHours * eveningRate;
    
    const bonus = calculateSalesBonus(periodTotalSales, totalHours);
    
    const subtotalForOrlof = dayEarnings + eveningEarnings + bonus;
    const orlof = subtotalForOrlof * orlofRate;
    const totalGross = subtotalForOrlof + orlof;
    const pensionFund = totalGross * pensionRate;
    const unionFee = totalGross * unionRate;
    const taxableIncome = totalGross - pensionFund;

    let calculatedTax = 0;
    let remainingIncome = taxableIncome;
    const step1Max = 472005;
    const step1Income = Math.min(remainingIncome, step1Max);
    calculatedTax += step1Income * 0.3145;
    remainingIncome -= step1Income;

    if (remainingIncome > 0) {
      const step2Max = 1273190 - step1Max; 
      const step2Income = Math.min(remainingIncome, step2Max);
      calculatedTax += step2Income * 0.3795;
      remainingIncome -= step2Income;
    }
    if (remainingIncome > 0) calculatedTax += remainingIncome * 0.4625;

    const personalAllowance = settings.personalAllowance * (settings.allowanceUsage || 0);
    const finalTax = Math.max(0, calculatedTax - personalAllowance);
    const totalDeductions = pensionFund + unionFee + finalTax;
    const netPay = totalGross - totalDeductions;

    return {
      dayHours: totalDayHours,
      eveningHours: totalEveningHours,
      dayEarnings,
      eveningEarnings,
      bonus,
      orlof,
      totalGross,
      pensionFund,
      unionFee,
      finalTax,
      totalDeductions,
      netPay,
      allowanceUsed: personalAllowance,
      totalHours,
      periodTotalSales
    };
  }, [shifts, sales, activePeriod, settings]);

  if (!payroll) return <div className="text-center p-20 text-slate-500">Hleð gögnum...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      
      {/* PERIOD SELECTOR HEADER */}
      <div className="flex justify-between items-center px-4">
         <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Launaseðill</h2>
         
         <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-2 border border-white/10">
            <button 
                onClick={() => setSelectedPeriodIndex(prev => Math.min(prev + 1, periods.length - 1))}
                disabled={selectedPeriodIndex >= periods.length - 1}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft size={20} />
            </button>
            
            <div className="text-center min-w-[140px]">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">
                    {selectedPeriodIndex === 0 ? 'Núverandi' : `${activePeriod.yearLabel}`}
                </p>
                <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
                    <Calendar size={14} className="text-slate-500" />
                    {activePeriod.label}
                </p>
            </div>

            <button 
                onClick={() => setSelectedPeriodIndex(prev => Math.max(prev - 1, 0))}
                disabled={selectedPeriodIndex === 0}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight size={20} />
            </button>
         </div>
      </div>
      
      <div className="glass rounded-[48px] border-white/10 overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />
        <div className="p-8 md:p-14 space-y-12">
            
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white italic tracking-tighter">TAKK ehf.</h2>
              <p className="text-slate-400 text-sm font-medium">Laugavegur 123, 101 Reykjavík</p>
            </div>
            <div className="bg-white/2 border border-white/5 rounded-[32px] p-8 min-w-[280px]">
               <div className="text-right space-y-4">
                  <div>
                      <p className="text-slate-500 font-black uppercase text-[8px] tracking-widest mb-1">Starfsmaður</p>
                      <p className="text-white font-bold">{userName}</p>
                  </div>
                  <div>
                      <p className="text-slate-500 font-black uppercase text-[8px] tracking-widest mb-1">Tímabil</p>
                      <p className="text-indigo-400 font-black capitalize">{activePeriod.label}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             <section className="space-y-6">
               <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                 <Wallet className="text-indigo-400" size={18} />
                 <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Laun & Greiðslur</h4>
               </div>
               <div className="space-y-4">
                 {/* Standard Earnings */}
                 <div className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-200">101 Dagvinna</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{payroll.dayHours.toFixed(2)} klst @ {settings.dayRate}</p>
                    </div>
                    <span className="text-white font-black">{formatISK(payroll.dayEarnings)}</span>
                 </div>
                 <div className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-200">1026 Eftirvinna</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{payroll.eveningHours.toFixed(2)} klst @ {settings.eveningRate}</p>
                    </div>
                    <span className="text-white font-black">{formatISK(payroll.eveningEarnings)}</span>
                 </div>

                 {/* BONUS ROW */}
                 <div className="flex justify-between items-center group pt-2 relative">
                    <div className="space-y-0.5">
                       <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-emerald-400">1604 Bónus</p>
                          <div className="group/tip relative">
                             <AlertCircle size={12} className="text-slate-600 cursor-help" />
                             <div className="absolute bottom-full left-0 mb-2 w-64 p-3 glass border-white/10 rounded-xl text-[9px] text-slate-300 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50">
                                <p className="font-black text-indigo-400 uppercase mb-1">Formúla</p>
                                Sala: {formatISK(payroll.periodTotalSales)}<br/>
                                Þröskuldur: (636 * {payroll.totalHours.toFixed(1)}) - (79.5 * {payroll.totalHours.toFixed(1)})<br/>
                                = {formatISK(636 * payroll.totalHours - 79.5 * payroll.totalHours)}
                             </div>
                          </div>
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Af sölu umfram viðmið</p>
                    </div>
                    <span className="text-emerald-400 font-black">{formatISK(payroll.bonus)}</span>
                 </div>
                 
                 <div className="flex justify-between items-center group pt-2 border-t border-white/5">
                    <div className="space-y-0.5">
                       <p className="text-sm font-bold text-indigo-400">901 Orlof</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">10,17% af heildarlaunum</p>
                    </div>
                    <span className="text-indigo-400 font-black">{formatISK(payroll.orlof)}</span>
                 </div>
               </div>
             </section>

             <section className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                  <TrendingDown className="text-rose-400" size={18} />
                  <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Frádráttur</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-200">10 Iðgjald</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lífeyrissjóður 4%</p>
                    </div>
                    <span className="text-rose-400 font-black">-{formatISK(payroll.pensionFund)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-200">50 Félagsgjald</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stéttarfélag 0,7%</p>
                    </div>
                    <span className="text-rose-400 font-black">-{formatISK(payroll.unionFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-200">Staðgreiðsla</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Eftir persónuafslátt</p>
                    </div>
                    <span className="text-rose-400 font-black">-{formatISK(payroll.finalTax)}</span>
                  </div>
                </div>
             </section>
          </div>
          
          <div className="mt-16 pt-12 border-t-2 border-dashed border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
              <div className="w-full md:w-1/2 space-y-6">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Heildarlaun (Brúttó)</span>
                  <span className="text-white">{formatISK(payroll.totalGross)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                   <span>Samtals frádráttur</span>
                   <span className="text-rose-500">{formatISK(payroll.totalDeductions)}</span>
                </div>
                {/* Slider */}
                <div className="p-6 bg-indigo-500/5 rounded-[32px] border border-indigo-500/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Percent size={14} className="text-indigo-400" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nýting persónuafsláttar</p>
                    </div>
                    <span className="text-xs font-black text-indigo-400">{Math.round((settings.allowanceUsage || 0) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={settings.allowanceUsage || 0} onChange={(e) => onUpdateSettings({...settings, allowanceUsage: parseFloat(e.target.value)})} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
              </div>

              <div className="w-full md:w-auto text-right">
                <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.4em] mb-2 italic">Laun til Útgreiðslu</p>
                <div className="inline-block p-1 rounded-[32px] bg-gradient-to-r from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-600/30">
                  <div className="bg-[#020617] rounded-[28px] px-10 py-6">
                    <h4 className="text-5xl font-black text-white tracking-tighter italic">{formatISK(payroll.netPay)}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
