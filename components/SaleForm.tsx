
import React, { useState } from 'react';
import { Sale } from '../types';
import { PROJECTS } from '../constants';
import { ShoppingBag, Save, Calendar, FileText } from 'lucide-react';

interface SaleFormProps {
  onSave: (sale: Sale) => void;
}

const SaleForm: React.FC<SaleFormProps> = ({ onSave }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    project: PROJECTS[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fix: Providing all required properties for the Sale interface, including 'project'
    onSave({
      ...formData,
      id: Math.random().toString(36).substr(2, 9)
    });
    setFormData({ ...formData, amount: 0 });
  };

  return (
    <div className="glass rounded-[32px] p-8 max-w-xl mx-auto border border-white/10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
          <ShoppingBag size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Skrá Sölu</h3>
          <p className="text-sm text-slate-400">Færðu inn söluupphæð dagsins</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={14} /> Dagsetning
          </label>
          <input 
            type="date"
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Söluupphæð (ISK)</label>
          <input 
            type="number"
            required
            value={formData.amount || ''}
            onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})}
            placeholder="0"
            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white text-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} /> Verkefni
          </label>
          <select 
            value={formData.project}
            onChange={e => setFormData({...formData, project: e.target.value})}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none cursor-pointer"
          >
            {PROJECTS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button 
          type="submit"
          className="w-full py-4 gradient-bg rounded-2xl text-white font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Save size={20} /> Vista Sölu
        </button>
      </form>
    </div>
  );
};

export default SaleForm;
