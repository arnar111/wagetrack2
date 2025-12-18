
import React from 'react';
import { Shift } from '../types';
import { Trash2, Calendar, ShoppingBag, Edit2 } from 'lucide-react';

interface ShiftListProps {
  shifts: Shift[];
  onDelete: (id: string) => void;
  onEdit: (shift: Shift) => void;
}

const ShiftList: React.FC<ShiftListProps> = ({ shifts, onDelete, onEdit }) => {
  if (shifts.length === 0) {
    return (
      <div className="glass rounded-[40px] p-24 text-center border-2 border-dashed border-white/5">
        <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mb-8">
          <Calendar size={48} />
        </div>
        <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">Engar vaktir skráðar</h3>
      </div>
    );
  }

  const formatISK = (val: number) => new Intl.NumberFormat('is-IS').format(Math.round(val));

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-20">
      {shifts.map((shift) => (
        <div key={shift.id} className="glass p-5 rounded-[32px] border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/30 transition-all group">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-300">
              <span className="text-[9px] font-black uppercase opacity-50">{new Date(shift.date).toLocaleDateString('is-IS', { month: 'short' })}</span>
              <span className="text-xl font-black">{new Date(shift.date).getDate()}</span>
            </div>
            
            <div>
              <h4 className="font-black text-white tracking-tight capitalize text-sm mb-1">
                {new Date(shift.date).toLocaleDateString('is-IS', { weekday: 'long' })}
              </h4>
              <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <span className="text-indigo-400">Dagv: {shift.dayHours}h</span>
                <span className="text-violet-400">Eftirv: {shift.eveningHours}h</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShoppingBag size={10} /> {formatISK(shift.totalSales)} ISK
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onEdit(shift)} 
              className="p-3 bg-white/5 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 rounded-2xl transition-all"
              title="Breyta vakt"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={() => onDelete(shift.id)} 
              className="p-3 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl transition-all"
              title="Eyða vakt"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShiftList;
