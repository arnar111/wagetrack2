export interface User {
  id: string;
  name: string;
  staffId: string;
  role: 'agent' | 'manager';
  team: 'Hringurinn' | 'Verið' | 'Other';
  uid?: string;
  email?: string;
}

export interface Shift {
  id: string;
  date: string;
  dayHours: number;
  eveningHours: number;
  totalSales: number;
  notes: string;
  managerNotes?: string;
  projectName: string;
  userId: string;
}

export interface Sale {
  id: string;
  date: string;
  timestamp: string;
  amount: number;
  project: string;
  userId: string;
  saleType?: 'new' | 'upgrade'; 
}

export interface WageSummary {
  grossPay: number;
  pensionFund: number;
  unionFee: number;
  tax: number;
  netPay: number;
  totalHours: number;
  totalSales: number;
}

export interface WageSettings {
  dayRate: number;
  eveningRate: number;
  pensionRate: number;
  unionRate: number;
  taxRate: number;
  personalAllowance: number;
  allowanceUsage: number;
}

export interface Goals {
  daily: number;
  monthly: number;
}

// --- GAMIFICATION TYPES ---
export interface Level {
  id: number;
  min: number;
  max: number;
  title: string;
  color: string;
}
