
import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { User } from '../types.ts';
import { UserPlus, Users, Trash2, ShieldAlert, Briefcase, Users2 } from 'lucide-react';

interface AdminProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const Admin: React.FC<AdminProps> = ({ users }) => {
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [role, setRole] = useState<'agent' | 'manager'>('agent');
  const [team, setTeam] = useState<'Hringurinn' | 'Verið' | 'Other'>('Other');
  const [loading, setLoading] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = staffId.trim();
    if (!name || cleanId.length !== 3) {
      alert("Nafn verður að vera til staðar og ID nákvæmlega 3 tölustafir!");
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("staffId", "==", cleanId));
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        alert("Þetta númer er þegar í notkun!");
        return;
      }

      await addDoc(collection(db, "users"), {
        name: name.trim(),
        staffId: cleanId,
        role,
        team
      });

      setName('');
      setStaffId('');
      setRole('agent');
      setTeam('Other');
    } catch (err) {
      console.error(err);
      alert("Villa við að vista notanda.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, staffId: string) => {
    if (String(staffId).trim() === '570') {
      alert("Ekki hægt að eyða aðal admin!");
      return;
    }
    if (confirm(`Ertu viss um að þú viljir eyða þessum starfsmanni?`)) {
      try {
        await deleteDoc(doc(db, "users", id));
      } catch (err) {
        alert("Villa við að eyða notanda.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="glass rounded-[40px] p-8 md:p-10 border-indigo-500/20 shadow-2xl">
        <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
          <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <UserPlus size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">User Management</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure Team Roles & Sorting</p>
          </div>
        </div>

        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                value={name} 
                disabled={loading}
                onChange={e => setName(e.target.value)}
                placeholder="Nafn starfsmanns"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff ID (3 digits)</label>
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={3}
                disabled={loading}
                value={staffId} 
                onChange={e => setStaffId(e.target.value.replace(/\D/g, ''))}
                placeholder="000"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-2xl tracking-[0.4em] text-center outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} className="text-indigo-400" /> Account Role
              </label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-sm uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="agent">Sales Agent</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Users2 size={12} className="text-violet-400" /> Team Assignment
              </label>
              <select 
                value={team} 
                onChange={(e) => setTeam(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-sm uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Other">Other / Unsorted</option>
                <option value="Hringurinn">Hringurinn</option>
                <option value="Verið">Verið</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full gradient-bg py-6 rounded-[32px] text-white font-black uppercase text-sm tracking-widest shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Vistar..." : "Create Account & Sort"}
          </button>
        </form>
      </div>

      <div className="glass rounded-[40px] p-8 md:p-10 border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-white/5 text-slate-400">
            <Users size={24} />
          </div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Active Directory</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-5 bg-white/2 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-lg ${u.role === 'manager' ? 'bg-amber-500' : 'gradient-bg'}`}>
                  {u.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-white text-sm">{u.name}</p>
                    {u.role === 'manager' && <span className="text-[8px] font-black bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full uppercase">MGR</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">ID: {u.staffId}</p>
                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                    <p className="text-[9px] font-bold text-slate-500 uppercase">{u.team}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteUser(u.id, u.staffId)}
                className={`p-3 rounded-xl transition-all ${String(u.staffId).trim() === '570' ? 'opacity-20 cursor-not-allowed text-slate-500' : 'text-slate-600 hover:bg-rose-500/10 hover:text-rose-500'}`}
                disabled={String(u.staffId).trim() === '570'}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-start gap-4">
        <ShieldAlert className="text-indigo-500 shrink-0" size={20} />
        <p className="text-[10px] font-bold text-indigo-500/80 uppercase leading-relaxed tracking-wider">
          Warning: Deleting a manager account will restrict their dashboard access immediately. Admin (570) is immutable.
        </p>
      </div>
    </div>
  );
};

export default Admin;
