import { WageSettings } from './types';

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
export const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

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