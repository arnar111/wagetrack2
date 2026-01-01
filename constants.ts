import { WageSettings, StoreItem } from './types';

export const DEFAULT_WAGE_SETTINGS: WageSettings = {
  dayRate: 2724.88,
  eveningRate: 3768.47,
  pensionRate: 0.04,
  unionRate: 0.007,
  taxRate: 0.3145,
  personalAllowance: 64171,
  allowanceUsage: 1.0, // Default 100%
};

// Use a placeholder image to avoid 404 errors for local assets
export const LOGO_URL = "https://i.imgur.com/L7XXpOQ.png";

export const STORE_ITEMS: StoreItem[] = [
  { id: 'coffee', title: 'Kaffipása', description: 'Segir MorriAI að þegja í 5 mín.', price: 50, icon: '☕', effect: 'silence' },
  { id: 'wheel', title: 'Lukkuhjólið', description: 'Snýr lukkuhjóli fyrir auka tækifæri á vinning.', price: 100, icon: '🎰', effect: 'theme' },
  { id: 'ceo', title: 'Forstjórinn', description: 'MorriAI talar við þig eins og þú sért eigandinn.', price: 1000, icon: '👑', effect: 'theme' },
  { id: 'gold_name', title: 'Gullna Nafnið', description: 'Nafnið þitt verður gullitað á listanum.', price: 5000, icon: '✨', effect: 'badge' },
];

export const PROJECTS = [
  "Samhjálp",
  "Þroskahjálp",
  "Stígamót",
  "SKB",
  "Ljósið",
  "Krabbameinsfélagið",
  "Sjálfsbjörg",
  "Blindrafélagið",
  "Amnesty",
  "Hjálparstarfið",
  "Samtökin '78"
];
