
import React, { useState } from 'react';
import { Sparkles, Search, PlusCircle, BookOpen, Mic2, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react';
import { getSpeechAssistantResponse, SpeechResult } from '../geminiService.ts';
import { PROJECTS } from '../constants.ts';
import { WageSummary } from '../types.ts';

export default function SpeechAssistant({ summary }: { summary: WageSummary }) {
  const [project, setProject] = useState(PROJECTS[0]);
  const [mode, setMode] = useState<'create' | 'search'>('create');
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const context = `Núverandi sala dagsins: ${summary.totalSales} ISK.`;
      const res = await getSpeechAssistantResponse(mode, project, context);
      setResult(res);
    } catch (e: any) {
      console.error(e);
      setError('Villa kom upp við að sækja ræðu. Gakktu úr skugga um að tenging sé virk.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 pb-20">
      <div className="space-y-6">
        <div className="glass p-6 rounded-[32px] border-white/10">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Mic2 size={18} className="text-indigo-400" /> Stillingar
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Veldu Verkefni</label>
              <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {PROJECTS.map(p => (
                  <button 
                    key={p} 
                    onClick={() => setProject(p)} 
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${project === p ? 'gradient-bg border-white/20 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Hvað viltu gera?</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setMode('create')} 
                  className={`flex-1 p-3 rounded-xl border text-center transition-all ${mode === 'create' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-transparent text-slate-600'}`}
                >
                  <PlusCircle size={18} className="mx-auto mb-1" />
                  <span className="text-[9px] font-black uppercase">5 Brot</span>
                </button>
                <button 
                  onClick={() => setMode('search')} 
                  className={`flex-1 p-3 rounded-xl border text-center transition-all ${mode === 'search' ? 'bg-violet-500/20 border-violet-500 text-violet-400' : 'bg-white/5 border-transparent text-slate-600'}`}
                >
                  <BookOpen size={18} className="mx-auto mb-1" />
                  <span className="text-[9px] font-black uppercase">Original</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleAction} 
              disabled={loading} 
              className="w-full py-4 gradient-bg rounded-2xl text-white font-black text-xs shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Sæki gögn..." : (mode === 'create' ? "Búa til 5 brot" : "Sækja original ræðu")}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="glass h-full rounded-[32px] border-white/10 p-8 flex flex-col min-h-[550px] relative">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${mode === 'create' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-violet-500/20 text-violet-400'}`}>
                {mode === 'create' ? <Sparkles size={20} /> : <Search size={20} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{mode === 'create' ? 'Urgencý Brot' : 'Original Handrit'}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{project}</p>
              </div>
            </div>
            {result && (
              <button 
                onClick={handleCopy} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 transition-all border border-white/5"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} 
                {copied ? "Afritað!" : "Afrita"}
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {error && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold text-center">
                {error}
              </div>
            )}
            
            {result ? (
              <div className="space-y-6">
                <div className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap font-medium">
                  {result.text.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} className="h-4" />;
                    const isNum = /^[0-9]\./.test(trimmed);
                    return (
                      <div key={i} className={`mb-4 ${isNum ? 'p-5 bg-indigo-500/5 rounded-2xl border border-white/5 shadow-sm' : ''}`}>
                        {line}
                      </div>
                    );
                  })}
                </div>

                {result.sources && result.sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Heimildir (Leitarniðurstöður)</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.sources.map((src, idx) => (
                        <a 
                          key={idx} 
                          href={src.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-indigo-400 hover:bg-white/10 transition-all"
                        >
                          <ExternalLink size={12} />
                          {src.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                <BookOpen size={64} className="mb-6" />
                <h4 className="text-lg font-bold text-white uppercase tracking-widest">Bíð eftir skipun</h4>
                <p className="text-xs mt-2 max-w-xs">Veldu verkefni og aðgerð vinstra megin til að sækja upplýsingar.</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest animate-pulse">AI að skrifa...</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
               Gögn sótt í rauntíma • Gemini AI Engine
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
