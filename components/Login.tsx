
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
// Fix: Import auth services from our own centralized firebase.ts instead of directly from the package
// to resolve "no exported member" errors caused by environment specific modular resolution issues.
import { db, auth, signInAnonymously } from '../firebase.ts';
import { LOGO_URL } from '../constants.ts';
import { User } from '../types.ts';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [val, setVal] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const attemptLogin = async (inputStr: string) => {
    const cleanInput = inputStr.trim();
    if (cleanInput.length !== 3) return;

    setLoading(true);
    try {
      // Establish an authenticated session so firestore.rules isAuthenticated() passes
      // Fix: Use the signInAnonymously method exported from our centralized firebase config
      await signInAnonymously(auth);

      const q = query(collection(db, "users"), where("staffId", "==", cleanInput));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        onLogin({ ...userDoc.data(), id: userDoc.id } as User);
      } else {
        // Fallback for hardcoded admin
        if (cleanInput === '570') {
           onLogin({ id: 'admin-fallback', name: 'Addi', staffId: '570', role: 'manager', team: 'Other' });
        } else {
          setError(true);
          setTimeout(() => {
            setVal('');
            setError(false);
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 3);
    setVal(input);
    
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
      <div className="w-full max-sm flex flex-col items-center">
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
              disabled={loading}
              value={val}
              onChange={handleChange}
              placeholder="000"
              className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-center text-5xl font-black tracking-[0.4em] text-white outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all placeholder:text-slate-900 shadow-inner disabled:opacity-50"
            />
          </div>

          {val.length === 3 && !error && (
            <button 
              onClick={() => attemptLogin(val)}
              disabled={loading}
              className="w-full py-4 gradient-bg rounded-2xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200 shadow-xl"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <>Innskrá <ArrowRight size={14} /></>}
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
          WageTrack Pro v1.4 • Firebase Powered
        </p>
      </div>
    </div>
  );
};

export default Login;
