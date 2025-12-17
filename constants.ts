
import { WageSettings, User } from './types';

export const DEFAULT_WAGE_SETTINGS: WageSettings = {
  dayRate: 2724.88,
  eveningRate: 3768.47,
  pensionRate: 0.04,
  unionRate: 0.007,
  taxRate: 0.3145,
  personalAllowance: 64171,
};

// More reliable logo URL or fallback logic
export const LOGO_URL = "https://images.squarespace-cdn.com/content/v1/5f8d9753c153b478d3885141/1612450543666-88F9X9F9C0N7E6X6Y0M6/TAKK_LOGO_BLACK.png";

export const USERS: User[] = [
  { id: '1', name: 'Addi', staffId: '570' }
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
  "Hjálparstarfið"
];
