
import React from 'react';
import { Shift } from '../types';
import { Trash2, Calendar, Clock, ShoppingBag } from 'lucide-react';

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
        <h3 className="text-2xl font-black text-white mb-3">Engar vaktir skráðar</h3>
      </div>
    );
  }

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));

  return (
    <div className="space-y-6">
      {shifts.map((shift) => (
        <div key={shift.id} className="glass p-6 rounded-[32px] border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-300">
              <span className="text-[10px] font-black uppercase opacity-50">{new Date(shift.date).toLocaleDateString('is-IS', { month: 'short' })}</span>
              <span className="text-2xl font-black">{new Date(shift.date).getDate()}</span>
            </div>
            
            <div>
              <h4 className="font-black text-white tracking-tight capitalize mb-1">
                {new Date(shift.date).toLocaleDateString('is-IS', { weekday: 'long' })}
              </h4>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="text-indigo-400">Dagv: {shift.dayHours}h</span>
                <span className="text-violet-400">Eftirv: {shift.eveningHours}h</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShoppingBag size={12} /> {formatISK(shift.totalSales)}
                </span>
              </div>
            </div>
          </div>

          <button onClick={() => onDelete(shift.id)} className="p-3 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl transition-all">
            <Trash2 size={20} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ShiftList;
