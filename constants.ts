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
  { id: 'wheel', title: 'Lukkuhjólið', description: 'Snýr lukkuhjóli fyrir auka tækifæri á vinning.', price: 100, icon: '🎰', effect: 'gamble' },
  { id: 'boss_call', title: 'Símtal frá Bjarna', description: 'Fáðu símtal frá "forstjóranum" með hrósi.', price: 500, icon: '📞', effect: 'notification' },
  { id: 'vacation', title: 'Draumur um Tene', description: 'Breytir bakgrunni í sólarströnd í smá stund.', price: 1000, icon: '🏖️', effect: 'theme_beach' },
  { id: 'compliment', title: 'Sjálfstraust Boozt', description: 'MorriAI sendir þér ofurstyrkjandi hrós.', price: 75, icon: '💪', effect: 'message' },
  { id: 'mystery_box', title: 'Dularfullur Kassi', description: 'Allt getur gerst... eða ekki neitt.', price: 150, icon: '📦', effect: 'gamble' },
  { id: 'vip_pass', title: 'VIP Aðgangur', description: 'Nafnið þitt fær sérstaka áferð á vaktalistanum.', price: 2500, icon: '🎫', effect: 'visual' },
  { id: 'cat_mode', title: 'Kattastilling', description: 'Breytir öllum ikonum í ketti í eina vakt.', price: 300, icon: '🐱', effect: 'visual' },
  { id: 'ticket', title: 'Lottó Miði', description: 'Gerir ekkert, en það er gaman að eiga hann.', price: 10, icon: '🎟️', effect: 'none' },
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
