
export interface User {
  id: string;
  name: string;
  staffId: string;
}

export interface Shift {
  id: string;
  date: string;
  dayHours: number;     // 08:00 - 17:00
  eveningHours: number; // 17:00 - 00:00
  totalSales: number;
  notes: string;
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  project: string;
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
}

export interface Goals {
  daily: number;
  monthly: number;
}
