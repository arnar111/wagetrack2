
export interface User {
  id: string;
  name: string;
  staffId: string;
  role: 'agent' | 'manager';
  team: 'Hringurinn' | 'Verið' | 'Other';
}

export interface Shift {
  id: string;
  date: string;
  dayHours: number;     // 08:00 - 17:00
  eveningHours: number; // 17:00 - 00:00
  totalSales: number;
  notes: string;
  managerNotes?: string; // Team-wide observations
  projectName: string;
  userId: string;
}

export interface Sale {
  id: string;
  date: string;
  timestamp: string; // ISO string with time
  amount: number;
  project: string;
  userId: string;
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
  dayRate: number;      // 2724.88
  eveningRate: number;  // 3768.47
  pensionRate: number;
  unionRate: number;
  taxRate: number;
  personalAllowance: number;
  allowanceUsage: number; // 0 to 1 (0% to 100%)
}

export interface Goals {
  daily: number;
  monthly: number;
}
