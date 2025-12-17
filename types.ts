
export interface User {
  id: string;
  name: string;
  staffId: string;
}

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  breakMinutes: number;
  notes: string;
  isHoliday: boolean;
  type: 'Dagur' | 'Eftirvinna' | 'Næturvinna' | 'Helgarvinna';
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  description: string;
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
  pensionRate: number;
  unionRate: number;
  taxRate: number;
  personalAllowance: number;
}
