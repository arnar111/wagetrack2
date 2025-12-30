import React, { useState } from 'react';
import { Sparkles, Search, PlusCircle, BookOpen, Mic2, ArrowRight, Copy, Check, ExternalLink, AlertCircle, BrainCircuit, Frown, Zap } from 'lucide-react';
import { getSpeechAssistantResponse, getSalesCoachAdvice, SpeechResult } from '../geminiService.ts'; // Import new function
import { PROJECTS } from '../constants.ts';
import { WageSummary } from '../types.ts';

// Common sales hurdles for quick selection
const COMMON_HURDLES = [
  "Enginn tími",
  "Enginn peningur",
  "Bara ekki áhuga",
  "Er þegar að styrkja",
  "Hringdu aftur seinna",
  "Treysti ekki í síma",
  "Veit ekki nóg um félagið"
];

export default function SpeechAssistant({ summary }: { summary: WageSummary }) {
  const [project, setProject] = useState(PROJECTS[0]);
  const [mode, setMode] = useState<'create' | 'search'>('create');
  
  // State for Sales Coach
  const [selectedHurdles, setSelectedHurdles] = useState<string[]>([]);
  
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Handle Script Generation
  const handleScriptAction = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const res = await getSpeechAssistantResponse(mode, project);
      setResult(res);
    } catch (e: any) {
      console.error(e);
      setError('Villa við gagnaflutning. Vinsamlegast reyndu aftur.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Coach Advice
  const handleCoachAction = async () => {
    if (selectedHurdles.length === 0) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const text = await getSalesCoachAdvice(selectedHurdles);
      setResult({ text, sources: [] }); // Format as SpeechResult for easy display
    } catch (e: any) {
      console.error(e);
      setError('MorriAI náði ekki sambandi. Reyndu aftur.');
    } finally {
      setLoading(false);
    }
  };

  const toggleHurdle = (hurdle: string) => {
    if (selectedHurdles.includes(hurdle)) {
        setSelectedHurdles(selectedHurdles.filter(h => h !== hurdle));
    } else {
        setSelectedHurdles([...selectedHurdles, hurdle]);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 pb-24">
      
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* CARD 1: Script Generator */}
        <div className="glass p-8 rounded-[40px] border-white/10 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Mic2 size={20} />
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">MorriAI Ræðuhjálp</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">1. Veldu Verkefni</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {PROJECTS.map(p => (
                  <button 
                    key={p} 
                    onClick={() => setProject(p)} 
                    className={`p-3 rounded-2xl border text-[11px] font-black text-left transition-all ${project === p ? 'gradient-bg border-white/20 text-white shadow-lg' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
                <button onClick={() => setMode('create')} className={`flex-1 p-3 rounded-2xl border text-xs font-bold text-center transition-all ${mode === 'create' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-600'}`}>Söluræða</button>
                <button onClick={() => setMode('search')} className={`flex-1 p-3 rounded-2xl border text-xs font-bold text-center transition-all ${mode === 'search' ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'bg-white/5 border-white/5 text-slate-600'}`}>Upplýsingar</button>
            </div>

            <button 
              onClick={handleScriptAction} 
              disabled={loading} 
              className="w-full py-4 gradient-bg rounded-[24px] text-white font-black text-sm shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Vinn..." : "Búa til ræðu"} <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* CARD 2: Daily Hurdles Coach */}
        <div className="glass p-8 rounded-[40px] border-amber-500/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-20 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                    <BrainCircuit size={20} />
                </div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">MorriAI Þjálfari</h3>
            </div>

            <div className="space-y-4 relative z-10">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                    Hvað var erfitt í dag? Veldu hindranir og Morri greinir daginn.
                </p>
                
                <div className="flex flex-wrap gap-2">
                    {COMMON_HURDLES.map(hurdle => (
                        <button
                            key={hurdle}
                            onClick={() => toggleHurdle(hurdle)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${selectedHurdles.includes(hurdle) ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'}`}
                        >
                            {hurdle}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={handleCoachAction}
                    disabled={loading || selectedHurdles.length === 0}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-[24px] font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                >
                    <Zap size={16} fill="currentColor" /> Fá Ráðleggingar
                </button>
            </div>
        </div>

      </div>

      {/* Results Area */}
      <div className="lg:col-span-8">
        <div className="glass h-full min-h-[600px] rounded-[48px] border-white/10 p-8 md:p-12 flex flex-col relative overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 pb-6 border-b border-white/5 gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-[24px] shadow-lg ${selectedHurdles.length > 0 && result && !result.sources ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                {selectedHurdles.length > 0 && result && !result.sources ? <BrainCircuit size={28} /> : <Sparkles size={28} />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                  {result && !result.sources && selectedHurdles.length > 0 ? "Greining Þjálfara" : "MorriAI Svarar"}
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">
                    {result && !result.sources && selectedHurdles.length > 0 ? "Endurgjöf dagsins" : project}
                </p>
              </div>
            </div>
            {result && (
              <button 
                onClick={handleCopy} 
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[11px] font-black text-white transition-all border border-white/10 group active:scale-95"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="group-hover:text-indigo-400" />} 
                {copied ? "AFRITAÐ!" : "AFRITA"}
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {error && (
              <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[32px] text-rose-400 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
                <AlertCircle size={40} className="opacity-50" />
                <p className="text-sm font-black uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}
            
            {result ? (
              <div className="space-y-8 pb-10">
                <div className="space-y-4">
                  {result.text.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    return (
                      <div 
                        key={i} 
                        className={`text-slate-200 text-base leading-relaxed font-medium transition-all hover:text-white p-6 md:p-8 rounded-[32px] border border-white/5 shadow-sm ${selectedHurdles.length > 0 && !result.sources ? 'bg-amber-500/5 border-amber-500/10' : 'bg-indigo-500/5 border-indigo-500/10'}`}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>

                {/* Sources only show for Project Info searches */}
                {result.sources && result.sources.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 ml-2">Staðfestar Heimildir</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.sources.map((src, idx) => (
                        <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-white/2 border border-white/5 text-[11px] font-bold text-slate-400 hover:bg-white/5 hover:text-indigo-400 hover:border-indigo-500/20 transition-all group">
                          <span className="truncate">{src.title}</span>
                          <ExternalLink size={14} className="shrink-0 opacity-40 group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20 grayscale">
                <BookOpen size={80} className="mb-8" />
                <h4 className="text-xl font-black text-white uppercase tracking-[0.4em] italic">Bíð eftir skipun</h4>
                <p className="text-xs mt-4 max-w-xs font-bold uppercase tracking-widest leading-relaxed">Veldu verkefni til vinstri eða notaðu þjálfarann til að fá ráð.</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center py-24 space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                  <BrainCircuit size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse italic">MorriAI að hugsa...</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center flex items-center justify-center gap-4">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5" />
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] italic">
                Powered by Gemini 3 • MorriAI
              </p>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
