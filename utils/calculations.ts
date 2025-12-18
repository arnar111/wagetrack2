import { Shift, WageSummary, WageSettings, Sale } from '../types';

/**
 * Calculates effective hours by deducting 0.125 hours (7.5 mins) 
 * for every 1 hour worked, effectively 1 hour break per 8 hours.
 * Multiplier: 0.875
 */
export const calculateEffectiveHours = (totalHours: number): number => {
  return Math.max(0, totalHours * 0.875);
};

/**
 * Calculates the sales bonus based on the Takk ehf formula:
 * 1. Calculate effective hours (Total hours * 0.875)
 * 2. Threshold = Effective Hours * 636 ISK
 * 3. Bonus = Sales - Threshold (if sales > threshold)
 */
export const calculateSalesBonus = (totalSales: number, totalHours: number): number => {
  const effectiveHours = calculateEffectiveHours(totalHours);
  const threshold = effectiveHours * 636;
  
  const bonus = totalSales - threshold;
  return Math.max(0, bonus);
};

/**
 * Calculates the team's weekly and monthly velocity.
 * Projected = (Total Sales / Days Elapsed) * Total Days in Period
 */
export const calculateVelocity = (currentSales: number, goal: number, period: 'weekly' | 'monthly'): { projected: number; velocityPercent: number } => {
  const now = new Date();
  let elapsed: number;
  let total: number;

  if (period === 'weekly') {
    elapsed = now.getDay() || 7; // Sunday as 7
    total = 7;
  } else {
    elapsed = now.getDate();
    total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  const projected = (currentSales / elapsed) * total;
  const velocityPercent = goal > 0 ? (projected / goal) * 100 : 0;

  return { projected, velocityPercent };
};

/**
 * Groups sales and hours by project for deep-dive analytics.
 */
export const getProjectMetrics = (sales: Sale[], shifts: Shift[]) => {
  const metrics: Record<string, { sales: number; hours: number; effHours: number; cost: number; count: number; prevWeekSales: number }> = {};

  const getProjName = (p: string) => (p === 'Hringurinn' || p === 'Verið') ? p : 'Other';
  
  const now = new Date();
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  sales.forEach(s => {
    const p = getProjName(s.project);
    if (!metrics[p]) metrics[p] = { sales: 0, hours: 0, effHours: 0, cost: 0, count: 0, prevWeekSales: 0 };
    
    const saleDate = new Date(s.date);
    if (saleDate >= lastWeekStart && saleDate < lastWeekEnd) {
      metrics[p].prevWeekSales += s.amount;
    }
    
    metrics[p].sales += s.amount;
    metrics[p].count += 1;
  });

  shifts.forEach(s => {
    const p = getProjName(s.projectName || 'Other');
    if (!metrics[p]) metrics[p] = { sales: 0, hours: 0, effHours: 0, cost: 0, count: 0, prevWeekSales: 0 };
    const h = (s.dayHours || 0) + (s.eveningHours || 0);
    metrics[p].hours += h;
    metrics[p].effHours += calculateEffectiveHours(h);
    // Cost calculation based on fixed wage estimation (2724.88)
    metrics[p].cost += h * 2724.88; 
  });

  return metrics;
};

export const calculateWageSummary = (shifts: Shift[], sales: Sale[], settings: WageSettings): WageSummary => {
  let totalHours = 0;
  let dayHours = 0;
  let eveningHours = 0;
  
  shifts.forEach(shift => {
    dayHours += shift.dayHours;
    eveningHours += shift.eveningHours;
    totalHours += (shift.dayHours + shift.eveningHours);
  });

  const totalSales = sales.reduce((acc, s) => acc + s.amount, 0);

  const dayEarnings = dayHours * settings.dayRate;
  const eveningEarnings = eveningHours * settings.eveningRate;
  const bonus = calculateSalesBonus(totalSales, totalHours);
  
  const subtotalForOrlof = dayEarnings + eveningEarnings + bonus;
  const orlof = subtotalForOrlof * 0.1017;
  const grossPay = subtotalForOrlof + orlof;

  const pensionFund = grossPay * 0.04;
  const taxableIncome = grossPay - pensionFund;
  const unionFee = grossPay * 0.007;
  
  let calculatedTax = 0;
  let remainingIncome = taxableIncome;

  const step1Max = 472005;
  const step1Income = Math.min(remainingIncome, step1Max);
  calculatedTax += step1Income * 0.3145;
  remainingIncome -= step1Income;

  if (remainingIncome > 0) {
    const step2Max = 1273190 - step1Max;
    const step2Income = Math.min(remainingIncome, step2Max);
    calculatedTax += step2Income * 0.3795;
    remainingIncome -= step2Income;
  }

  if (remainingIncome > 0) {
    calculatedTax += remainingIncome * 0.4625;
  }

  const personalAllowance = settings.personalAllowance * (settings.allowanceUsage || 0);
  const finalTax = Math.max(0, calculatedTax - personalAllowance);

  const netPay = grossPay - pensionFund - unionFee - finalTax;

  return {
    grossPay,
    pensionFund,
    unionFee,
    tax: finalTax,
    netPay,
    totalHours,
    totalSales
  };
};