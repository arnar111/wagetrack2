import React, { useState } from 'react';
import { 
  LogIn, 
  ShieldCheck, 
  UserCircle2, 
  Building2 
} from 'lucide-react';
import { signInAnonymously, signInWithPopup, auth, microsoftProvider } from '../firebase';
import { LOGO_URL } from '../constants';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staffId, setStaffId] = useState('');
  const [logoError, setLogoError] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim()) return;

    setLoading(true);
    setError('');

    try {
      // For manual ID login, we still use anonymous auth under the hood
      // to establish a secure connection to read the database
      const result = await signInAnonymously(auth);
      
      // We store the ID the user typed so App.tsx can find their profile
      localStorage.setItem('takk_last_staff_id', staffId);
      
      console.log("Login successful, user:", result.user.uid);
      // The actual profile fetching happens in App.tsx via onAuthStateChanged
    } catch (err) {
      console.error(err);
      setError('Innskráning mistókst. Reyndu aftur.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      console.log("Microsoft User:", result.user);
      // We don't need to save staffId to localStorage here; 
      // App.tsx will find the user by their Microsoft UID automatically.
    } catch (err: any) {
      console.error("Microsoft Login Error:", err);
      setError('Microsoft innskráning mistókst.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#01040f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block relative group">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            {!logoError ? (
              <img 
                src={LOGO_URL} 
                alt="TAKK" 
                className="h-24 w-auto relative invert brightness-[2] drop-shadow-2xl"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-5xl font-black italic tracking-tighter text-white relative">TAKK</span>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Velkomin/n</h2>
            <p className="text-slate-400 font-medium">Skráðu þig inn til að halda áfram</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-[30px] border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="space-y-6">
            
            {/* Microsoft Login Button */}
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="w-full bg-[#2F2F2F] hover:bg-[#3F3F3F] text-white p-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 border border-white/10 group"
            >
              <Building2 className="w-5 h-5 text-[#00A4EF]" />
              <span>Innskráning með Microsoft</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">Eða notaðu ID</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Starfsmannanúmer</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserCircle2 className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-bold text-lg"
                    placeholder="t.d. 570"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-bg p-4 rounded-xl font-black text-white tracking-wide shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>SKRÁ INN</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
