
import { Shift, WageSummary, WageSettings, Sale } from '../types';

/**
 * Calculates the sales bonus based on the Takk ehf formula:
 * 1. Calculate effective hours (Total hours - 0.125 hours break for every 1 hour worked)
 * 2. Threshold = Effective Hours * 636 ISK
 * 3. Bonus = Sales - Threshold (if sales > threshold)
 */
export const calculateSalesBonus = (totalSales: number, totalHours: number): number => {
  const breakDeduction = totalHours * 0.125;
  const effectiveHours = Math.max(0, totalHours - breakDeduction);
  const threshold = effectiveHours * 636;
  
  const bonus = totalSales - threshold;
  return Math.max(0, bonus);
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

  // 101 Dagvinna
  const dayEarnings = dayHours * settings.dayRate;
  // 1026 Eftirvinna
  const eveningEarnings = eveningHours * settings.eveningRate;
  // 1604 Bónus
  const bonus = calculateSalesBonus(totalSales, totalHours);
  
  // Base for Orlof
  const subtotalForOrlof = dayEarnings + eveningEarnings + bonus;
  // 901 Orlof (10.17%)
  const orlof = subtotalForOrlof * 0.1017;
  
  const grossPay = subtotalForOrlof + orlof;

  // Deductions
  const pensionFund = grossPay * 0.04;
  const taxableIncome = grossPay - pensionFund;
  const unionFee = grossPay * 0.007;
  
  // Tax Steps 2025
  let calculatedTax = 0;
  let remainingIncome = taxableIncome;

  // Step 1: 0 - 472,005 at 31.45%
  const step1Max = 472005;
  const step1Income = Math.min(remainingIncome, step1Max);
  calculatedTax += step1Income * 0.3145;
  remainingIncome -= step1Income;

  // Step 2: 472,006 - 1,273,190 at 37.95%
  if (remainingIncome > 0) {
    const step2Max = 1273190 - step1Max;
    const step2Income = Math.min(remainingIncome, step2Max);
    calculatedTax += step2Income * 0.3795;
    remainingIncome -= step2Income;
  }

  // Step 3: Over 1,273,190 at 46.25%
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
