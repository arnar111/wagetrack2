
import React, { useState, useEffect, useRef } from 'react';
import { LOGO_URL } from '../constants.ts';
import { User } from '../types.ts';
import { Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [val, setVal] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const attemptLogin = (inputStr: string) => {
    const cleanInput = inputStr.trim();
    if (cleanInput.length !== 3) return;

    // Leitum að notanda - Normalíserum báðar hliðar sem trimmaða strengi
    const foundUser = users.find(u => {
      const storedId = String(u.staffId).trim();
      return storedId === cleanInput;
    });

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError(true);
      // Hristum og hreinsum
      setTimeout(() => {
        setVal('');
        setError(false);
      }, 1000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 3);
    setVal(input);
    
    // Auto-login ef 3 stafir eru slegnir inn
    if (input.length === 3) {
      attemptLogin(input);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
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
        
        <div className={`glass w-full rounded-[40px] p-8 md:p-12 flex flex-col items-center transition-all duration-300 ${error ? 'border-rose-500 shadow-2xl shadow-rose-500/20 translate-x-1' : 'border-white/10'}`}>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 text-center">
            Sláðu inn starfsmannanúmer
          </label>
          
          <div className="relative w-full mb-6">
            <input 
              ref={inputRef}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              autoComplete="off"
              value={val}
              onChange={handleChange}
              placeholder="000"
              className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-center text-5xl font-black tracking-[0.4em] text-white outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all placeholder:text-slate-900 shadow-inner"
            />
          </div>

          {val.length === 3 && !error && (
            <button 
              onClick={() => attemptLogin(val)}
              className="w-full py-4 gradient-bg rounded-2xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200 shadow-xl"
            >
              Innskrá <ArrowRight size={14} />
            </button>
          )}
          
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-slate-500 text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
              <Lock size={12} /> Örugg innskráning
            </p>
            {error && (
              <p className="text-rose-400 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">
                Starfsmaður fannst ekki
              </p>
            )}
          </div>
        </div>
        
        <p className="mt-10 text-slate-800 text-[9px] font-black uppercase tracking-[0.4em] italic">
          WageTrack Pro v1.3 • Takk Digital
        </p>
      </div>
    </div>
  );
};

export default Login;
