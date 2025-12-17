
import React, { useState } from 'react';
import { USERS, LOGO_URL } from '../constants';
import { User } from '../types';
import { Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [val, setVal] = useState('');
  const [error, setError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 3);
    setVal(input);
    
    if (input.length === 3) {
      const user = USERS.find(u => u.staffId === input);
      if (user) {
        onLogin(user);
      } else {
        setError(true);
        setTimeout(() => {
          setVal('');
          setError(false);
        }, 800);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center">
          <img 
            src={LOGO_URL} 
            alt="TAKK" 
            className="h-28 invert brightness-0 mb-4" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML += '<span class="text-6xl font-black italic tracking-tighter text-white">TAKK</span>';
            }}
          />
        </div>
        
        <div className={`glass w-full rounded-[40px] p-12 flex flex-col items-center transition-all ${error ? 'border-rose-500 animate-shake' : ''}`}>
          <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Sláðu inn starfsmannanúmer</label>
          
          <input 
            type="password"
            autoFocus
            value={val}
            onChange={handleChange}
            placeholder="•••"
            className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-center text-4xl font-black tracking-[1em] text-white outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all placeholder:text-slate-800"
          />
          
          <p className="mt-8 text-slate-500 text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <Lock size={12} /> Örugg innskráning
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
