
import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { User } from '../types.ts';
import { UserPlus, Users, Trash2, ShieldAlert } from 'lucide-react';

interface AdminProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const Admin: React.FC<AdminProps> = ({ users }) => {
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
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
      // Check if ID already exists
      const q = query(collection(db, "users"), where("staffId", "==", cleanId));
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        alert("Þetta númer er þegar í notkun!");
        return;
      }

      await addDoc(collection(db, "users"), {
        name: name.trim(),
        staffId: cleanId
      });

      setName('');
      setStaffId('');
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="glass rounded-[40px] p-8 md:p-10 border-indigo-500/20 shadow-2xl">
        <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
          <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <UserPlus size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Bæta við Notanda</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Stjórnborð starfsmanna</p>
          </div>
        </div>

        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fullt nafn</label>
            <input 
              type="text" 
              value={name} 
              disabled={loading}
              onChange={e => setName(e.target.value)}
              placeholder="Nafn starfsmanns"
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff ID (3 tölur)</label>
            <input 
              type="text" 
              inputMode="numeric"
              maxLength={3}
              disabled={loading}
              value={staffId} 
              onChange={e => setStaffId(e.target.value.replace(/\D/g, ''))}
              placeholder="000"
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-black text-xl tracking-widest text-center outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="gradient-bg py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Vistar..." : "Skrá notanda"}
          </button>
        </form>
      </div>

      <div className="glass rounded-[40px] p-8 md:p-10 border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-white/5 text-slate-400">
            <Users size={24} />
          </div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Skráðir Notendur</h3>
        </div>

        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center font-black text-xs text-white shadow-lg">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-white text-sm">{u.name}</p>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">ID: {u.staffId}</p>
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
          Allar breytingar hér verða sýnilegar öllum tækjum í rauntíma gegnum Cloud Firestore.
        </p>
      </div>
    </div>
  );
};

export default Admin;
