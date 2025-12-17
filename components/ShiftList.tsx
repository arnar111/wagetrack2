
import React from 'react';
import { Shift } from '../types';
import { Trash2, Calendar, Clock } from 'lucide-react';
import { calculateShiftDuration } from '../utils/calculations';

interface ShiftListProps {
  shifts: Shift[];
  onDelete: (id: string) => void;
}

const ShiftList: React.FC<ShiftListProps> = ({ shifts, onDelete }) => {
  if (shifts.length === 0) {
    return (
      <div className="glass rounded-[40px] p-24 text-center border-2 border-dashed border-white/5">
        <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mb-8">
          <Calendar size={48} />
        </div>
        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Engar vaktir skráðar</h3>
        <p className="text-slate-500 font-medium">Byrjaðu á því að skrá þína fyrstu vakt til að sjá tölfræði.</p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Næturvinna': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Eftirvinna': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Helgarvinna': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const formatISK = (val: number) => {
    return new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-6">
        <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Yfirlit Vakta</span>
        <span className="bg-white/5 text-[10px] font-bold text-slate-400 px-3 py-1 rounded-full">{shifts.length} skráningar</span>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {shifts.map((shift) => (
          <div key={shift.id} className="glass p-6 rounded-[32px] border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-300">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">
                  {new Date(shift.date).toLocaleDateString('is-IS', { month: 'short' })}
                </span>
                <span className="text-2xl font-black">{new Date(shift.date).getDate()}</span>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-black text-white tracking-tight capitalize">
                    {new Date(shift.date).toLocaleDateString('is-IS', { weekday: 'long' })}
                  </h4>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${getTypeColor(shift.type)}`}>
                    {shift.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-indigo-400" />
                    {shift.startTime} - {shift.endTime}
                  </span>
                  <span className="text-indigo-500">
                    ({calculateShiftDuration(shift).toFixed(1)} klst)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Verðmæti vaktar</p>
                <p className="text-xl font-black text-white tracking-tighter">
                  {formatISK(calculateShiftDuration(shift) * shift.hourlyRate)} <span className="text-xs text-indigo-400">ISK</span>
                </p>
              </div>
              <button 
                onClick={() => onDelete(shift.id)}
                className="p-3 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftList;
