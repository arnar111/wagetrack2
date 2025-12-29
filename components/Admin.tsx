import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { User } from '../types.ts';
import { UserPlus, Users, Trash2, ShieldAlert, Briefcase, Users2, X, Edit3, User as UserIcon, Mail, Shield, BadgeCheck, Ghost } from 'lucide-react';

interface AdminProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const Admin: React.FC<AdminProps> = ({ users }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
        email: email.trim().toLowerCase(),
        staffId: cleanId,
        role,
        team
      });

      setName('');
      setEmail('');
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
      email: u.email || '',
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
        email: (editingUser.email || '').trim().toLowerCase(),
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

  // Helper to extract username from email (e.g. "jon.doe" from "jon.doe@takk.co")
  const getUsername = (emailStr?: string) => {
    if (!emailStr) return '';
    return emailStr.split('@')[0];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">
      
      {/* EDIT USER MODAL */}
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
                <label className="text-[10px] font-black text-slate-500 uppercase">Microsoft Netfang</label>
                <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-bold outline-none focus:ring-2 focus:ring-[#d4af37]" />
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

      {/* CREATE USER CARD */}
      <div className="glass rounded-[40px] p-8 md:p-10 border-indigo-500/20 shadow-2xl">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3"><UserPlus className="text-indigo-400" /> Nýr Starfsmaður</h3>
        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Fullt nafn" className="bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-bold outline-none" required />
            <input type="text" maxLength={3} value={staffId} onChange={e => setStaffId(e.target.value.replace(/\D/g, ''))} placeholder="ID (3 stafir)" className="bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black text-center outline-none" required />
          </div>
          
          <div className="relative">
             <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Microsoft Netfang (fyrir innskráningu)" className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-3xl text-white font-bold outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select value={role} onChange={e => setRole(e.target.value as any)} className="bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black uppercase outline-none"><option value="agent">Sales Agent</option><option value="manager">Manager</option></select>
            <select value={team} onChange={e => setTeam(e.target.value as any)} className="bg-white/5 border border-white/10 p-5 rounded-3xl text-white font-black uppercase outline-none"><option value="Other">Annað</option><option value="Hringurinn">Hringurinn</option><option value="Verið">Verið</option></select>
          </div>
          <button type="submit" className="w-full gradient-bg py-6 rounded-[32px] text-white font-black uppercase text-sm tracking-widest shadow-xl">Stofna Aðgang</button>
        </form>
      </div>

      {/* USER LIST (REDESIGNED) */}
      <div className="glass rounded-[40px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <Users className="text-slate-400" />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Starfsmannalisti</h3>
        </div>
        
        <div className="p-4 space-y-2">
          {users.length === 0 ? (
             <div className="py-20 text-center flex flex-col items-center opacity-50">
                <Ghost size={48} className="mb-4 text-slate-600" />
                <p className="text-slate-500 font-bold">Engir starfsmenn fundust.</p>
             </div>
          ) : (
             users.map(u => (
                <div key={u.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/2 hover:bg-white/5 rounded-3xl border border-white/5 transition-all gap-4">
                   
                   {/* Left Side: Avatar & Info */}
                   <div className="flex items-center gap-5">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg ${u.role === 'manager' ? 'bg-[#d4af37] text-slate-900' : 'gradient-bg'}`}>
                         {u.name.charAt(0)}
                      </div>
                      
                      <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                            <span className="font-black text-white text-base">{u.name}</span>
                            {u.role === 'manager' && <Shield size={12} className="text-[#d4af37]" fill="currentColor" />}
                         </div>
                         
                         <div className="flex items-center gap-3 text-xs">
                            {u.email ? (
                                <span className="text-slate-400 font-medium">@{getUsername(u.email)}</span>
                            ) : (
                                <span className="text-slate-600 italic">Vantar netfang</span>
                            )}
                            <div className="h-1 w-1 rounded-full bg-slate-700" />
                            <span className="text-indigo-400 font-black tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">ID: {u.staffId}</span>
                         </div>
                      </div>
                   </div>

                   {/* Right Side: Badges & Actions */}
                   <div className="flex items-center justify-between md:justify-end gap-4 pl-19 md:pl-0">
                      <div className="flex gap-2">
                         <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${u.team === 'Hringurinn' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : u.team === 'Verið' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                            {u.team}
                         </span>
                         {u.role === 'manager' && (
                            <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37]">
                               Stjórnandi
                            </span>
                         )}
                      </div>

                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => startEditing(u)} 
                            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            title="Breyta"
                         >
                            <Edit3 size={16} />
                         </button>
                         <button 
                            onClick={() => handleDeleteUser(u.id, u.staffId)} 
                            className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-all"
                            title="Eyða"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>

                </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
