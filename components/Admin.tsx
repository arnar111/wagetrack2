
import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { User } from '../types.ts';
import { UserPlus, Users, Trash2, ShieldAlert, Briefcase, Users2, X, Edit3, User as UserIcon } from 'lucide-react';

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
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
      alert("Villa við að vista notanda.");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (u: User) => {
    setEditingUser({
      ...u,
      role: u.role || 'agent',
      team: u.team || 'Other'
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", editingUser.id);
      const updateData: any = {
        name: editingUser.name || '',
        role: editingUser.role || 'agent',
        team: editingUser.team || 'Other'
      };
      
      await updateDoc(userRef, updateData);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert("Villa við að uppfæra starfsmann.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, staffId: string) => {
    if (staffId === '570') {
      alert("Ekki hægt að eyða kerfisstjóra!");
      return;
    }
    if (confirm(`Viltu eyða starfsmanni?`)) {
      try {
        await deleteDoc(doc(db, "users", id));
      } catch (err) {
        alert("Villa við að eyða.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {editingUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass p-10 rounded-[40px] w-full max-w-md border-[#d4af37]/40 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Breyta Starfsmanni</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Nafn</label>
                <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-bold outline-none focus:ring-2 focus:ring-[#d4af37]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Hlutverk</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black uppercase outline-none focus:ring-2 focus:ring-[#d4af37]">
                  <option value="agent">Sales Agent</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Teymi</label>
                <select value={editingUser.team} onChange={e => setEditingUser({...editingUser, team: e.target.value as any})} className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black uppercase outline-none focus:ring-2 focus:ring-[#d4af37]">
                  <option value="Other">Annað</option>
                  <option value="Hringurinn">Hringurinn</option>
                  <option value="Verið">Verið</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-[#d4af37] text-slate-900 font-black uppercase text-xs tracking-widest rounded-[28px] shadow-xl">Vista Breytingar</button>
            </form>
          </div>
        </div>
      )}

      <div className="glass rounded-[40px] p-8 md:p-10 border-indigo-500/20 shadow-2xl">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3"><UserPlus className="text-indigo-400" /> Nýr Starfsmaður</h3>
        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Fullt nafn" className="bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-bold outline-none" required />
            <input type="text" maxLength={3} value={staffId} onChange={e => setStaffId(e.target.value.replace(/\D/g, ''))} placeholder="ID (3 stafir)" className="bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-center outline-none" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select value={role} onChange={e => setRole(e.target.value as any)} className="bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black uppercase outline-none"><option value="agent">Sales Agent</option><option value="manager">Manager</option></select>
            <select value={team} onChange={e => setTeam(e.target.value as any)} className="bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black uppercase outline-none"><option value="Other">Annað</option><option value="Hringurinn">Hringurinn</option><option value="Verið">Verið</option></select>
          </div>
          <button type="submit" className="w-full gradient-bg py-6 rounded-[32px] text-white font-black uppercase text-sm tracking-widest shadow-xl">Stofna Aðgang</button>
        </form>
      </div>

      <div className="glass rounded-[40px] p-8 md:p-10 border-white/5">
        <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-3"><Users className="text-slate-400" /> Starfsmannalisti</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u.id} onClick={() => startEditing(u)} className="flex items-center justify-between p-5 bg-white/2 rounded-3xl border border-white/5 hover:border-[#d4af37]/40 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xs text-white ${u.role === 'manager' ? 'bg-[#d4af37] text-slate-900' : 'gradient-bg'}`}>{u.name.charAt(0)}</div>
                <div><p className="font-black text-white text-sm group-hover:text-[#d4af37] transition-colors">{u.name}</p><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">ID: {u.staffId} • {u.team}</p></div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.staffId); }} className="text-slate-600 hover:text-rose-500 p-2"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
