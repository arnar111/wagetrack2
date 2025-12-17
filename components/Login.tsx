
import React, { useState } from 'react';
import { USERS, LOGO_URL } from '../constants';
import { User } from '../types';
import { Lock, Delete } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePress = (num: string) => {
    if (pin.length < 3) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 3) {
        const user = USERS.find(u => u.staffId === newPin);
        if (user) {
          onLogin(user);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src={LOGO_URL} alt="TAKK" className="h-32 mb-12 invert brightness-0" />
        
        <div className={`glass w-full rounded-[40px] p-10 flex flex-col items-center transition-all ${error ? 'border-rose-500 animate-shake' : ''}`}>
          <div className="flex gap-4 mb-10">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  pin.length > i ? 'bg-indigo-500 border-indigo-500 scale-125' : 'border-slate-700'
                }`} 
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handlePress(num.toString())}
                className="w-16 h-16 rounded-full glass flex items-center justify-center text-2xl font-bold hover:bg-white/10 active:scale-90 transition-all"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePress('0')}
              className="w-16 h-16 rounded-full glass flex items-center justify-center text-2xl font-bold hover:bg-white/10 active:scale-90 transition-all"
            >
              0
            </button>
            <button
              onClick={() => setPin(pin.slice(0, -1))}
              className="w-16 h-16 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <Delete />
            </button>
          </div>
          
          <p className="mt-8 text-slate-500 text-sm font-medium flex items-center gap-2">
            <Lock size={14} /> Sláðu inn 3 stafa starfsmannaauðkenni
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
