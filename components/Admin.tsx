
import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { User } from '../types.ts';
import { UserPlus, Users, Trash2, ShieldAlert, Briefcase, Users2, X, Check, Edit3, User as UserIcon } from 'lucide-react';

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
      console.error(err);
      alert("Villa við að vista notanda.");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (u: User) => {
    // Crucial: Default missing fields to prevent Firebase "undefined" errors
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
      // Explicitly define update object to avoid passing 'undefined' values
      const updateData: any = {
        name: editingUser.name || '',
        role: editingUser.role || 'agent',
        team: editingUser.team || 'Other'
      };
      
      await updateDoc(userRef, updateData);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert("Villa við að uppfæra notanda.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, staffId: string) => {
    if (String(staffId).trim() === '570' || String(staffId).trim() === '123') {
      alert("Ekki hægt að eyða kerfisnotanda!");
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {/* Edit User Card Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass p-10 rounded-[40px] w-full max-w-md border-[#d4af37]/40 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                  <UserIcon size={20} />
                </div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Uppfæra Starfsmann</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white transition-colors"><X /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fullt Nafn</label>
                <input 
                  type="text" 
                  value={editingUser.name} 
                  onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-bold outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={10} /> Hlutverk
                  </label>
                  <select 
                    value={editingUser.role} 
                    onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black uppercase outline-none focus:ring-2 focus:ring-[#d4af37]"
                  >
                    <option value="agent">Sales Agent</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Users2 size={10} /> Teymi
                  </label>
                  <select 
                    value={editingUser.team} 
                    onChange={e => setEditingUser({...editingUser, team: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black uppercase outline-none focus:ring-2 focus:ring-[#d4af37]"
                  >
                    <option value="Other">Annað</option>
                    <option value="Hringurinn">Hringurinn</option>
                    <option value="Verið">Verið</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-[#d4af37] text-slate-900 font-black uppercase text-xs tracking-widest rounded-[28px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
              >
                {loading ? "Uppfærir..." : "Vista Breytingar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New User Form */}
      <div className="glass rounded-[40px] p-8 md:p-10 border-indigo-500/20 shadow-2xl">
        <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
          <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <UserPlus size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nýr Starfsmaður</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Skráðu nýjan liðsmann í kerfið</p>
          </div>
        </div>

        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nafn</label>
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Starfsmannanúmer (3 stafir)</label>
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
                <Briefcase size={12} className="text-indigo-400" /> Hlutverk
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
                <Users2 size={12} className="text-violet-400" /> Teymi
              </label>
              <select 
                value={team} 
                onChange={(e) => setTeam(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-sm uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Other">Annað</option>
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
            {loading ? "Vistar..." : "Búa til Aðgang"}
          </button>
        </form>
      </div>

      {/* User Directory */}
      <div className="glass rounded-[40px] p-8 md:p-10 border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-white/5 text-slate-400">
            <Users size={24} />
          </div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Starfsmannalisti</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div 
              key={u.id} 
              onClick={() => startEditing(u)}
              className="flex items-center justify-between p-5 bg-white/2 rounded-3xl border border-white/5 hover:border-[#d4af37]/40 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-lg ${u.role === 'manager' ? 'bg-[#d4af37] text-slate-900' : 'gradient-bg'}`}>
                  {u.name ? u.name.charAt(0) : '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-white text-sm group-hover:text-[#d4af37] transition-colors">{u.name || 'Nafnlaus'}</p>
                    {u.role === 'manager' && <span className="text-[8px] font-black bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-full uppercase">MGR</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">ID: {u.staffId}</p>
                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                    <p className="text-[9px] font-bold text-slate-500 uppercase">{u.team || 'Bíður flokkunar'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <Edit3 size={14} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.staffId); }}
                  className={`p-3 rounded-xl transition-all ${ (String(u.staffId).trim() === '570' || String(u.staffId).trim() === '123') ? 'opacity-20 cursor-not-allowed text-slate-500' : 'text-slate-600 hover:bg-rose-500/10 hover:text-rose-500'}`}
                  disabled={String(u.staffId).trim() === '570' || String(u.staffId).trim() === '123'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {/* Subtle hover indicator */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-start gap-4">
        <ShieldAlert className="text-indigo-500 shrink-0" size={20} />
        <p className="text-[10px] font-bold text-indigo-500/80 uppercase leading-relaxed tracking-wider">
          ATH: Smeltu á starfsmann til að breyta flokkun eða hlutverki. Ekki er hægt að eyða kerfisstjórum.
        </p>
      </div>
    </div>
  );
};

export default Admin;
