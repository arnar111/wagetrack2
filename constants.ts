
import { WageSettings, User } from './types';

export const DEFAULT_WAGE_SETTINGS: WageSettings = {
  dayRate: 2724.88,
  eveningRate: 3768.47,
  pensionRate: 0.04,
  unionRate: 0.007,
  taxRate: 0.3145,
  personalAllowance: 64171,
  allowanceUsage: 1.0, // Default 100%
};

// Notum myndina sem notandinn hlóð upp
export const LOGO_URL = "./image.png";

export const USERS: User[] = [
  { id: '1', name: 'Addi', staffId: '570' }
  { id: '1', name: 'Pétur', staffId: '101' }
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
