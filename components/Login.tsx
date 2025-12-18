
import React, { useState, useEffect, useRef } from 'react';
import { LOGO_URL } from '../constants.ts';
import { User } from '../types.ts';
import { Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [val, setVal] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fjarlægjum allt nema tölustafi og takmörkum við 3
    const input = e.target.value.replace(/\D/g, '').slice(0, 3);
    setVal(input);
    
    if (input.length === 3) {
      // Öruggur samanburður: Breytum báðum í strengi og hreinsum stafabil
      const foundUser = users.find(u => 
        String(u.staffId).trim() === String(input).trim()
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError(true);
        // Hristum og hreinsum eftir smá bið
        setTimeout(() => {
          setVal('');
          setError(false);
        }, 800);
      }
    }
  };

  useEffect(() => {
    // Reynum að setja focus, en forðumst að trufla lyklaborð á símum ef það veldur veseni
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center">
          <img 
            src={LOGO_URL} 
            alt="TAKK" 
            className="h-32 invert brightness-[2] mb-4" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent && !parent.querySelector('.logo-fallback')) {
                const span = document.createElement('span');
                span.className = 'logo-fallback text-6xl font-black italic tracking-tighter text-white';
                span.innerText = 'TAKK';
                parent.appendChild(span);
              }
            }}
          />
        </div>
        
        <div className={`glass w-full rounded-[40px] p-10 md:p-12 flex flex-col items-center transition-all duration-300 ${error ? 'border-rose-500 shadow-lg shadow-rose-500/20 translate-x-1' : 'border-white/10'}`}>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 text-center">
            Sláðu inn starfsmannanúmer
          </label>
          
          <div className="relative w-full">
            <input 
              ref={inputRef}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              autoComplete="off"
              value={val}
              onChange={handleChange}
              placeholder="000"
              className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-center text-5xl font-black tracking-[0.4em] text-white outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all placeholder:text-slate-900"
            />
          </div>
          
          <div className="mt-10 flex flex-col items-center gap-2">
            <p className="text-slate-500 text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <Lock size={12} /> Örugg innskráning
            </p>
            {error && <p className="text-rose-400 text-[9px] font-black uppercase tracking-widest animate-pulse">Rangt númer</p>}
          </div>
        </div>
        
        <p className="mt-8 text-slate-700 text-[9px] font-bold uppercase tracking-[0.3em]">
          WageTrack Pro v1.2
        </p>
      </div>
    </div>
  );
};

export default Login;
