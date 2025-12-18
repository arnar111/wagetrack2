import { Shift, WageSummary, WageSettings, Sale } from '../types';

/**
 * Reiknar virka vinnustundir með því að draga frá 0.125 hlutfall (1 klst á hverjar 8).
 * Margfaldari: 0.875
 */
export const calculateEffectiveHours = (totalHours: number): number => {
  return Math.max(0, totalHours * 0.875);
};

/**
 * Reiknar bónus (1604) samkvæmt formúlu Takk ehf fyrir LAUNASEÐIL.
 * Threshold (636) á eingöngu við um laun starfsmanna.
 */
export const calculateSalesBonus = (totalSales: number, totalHours: number): number => {
  const effectiveHours = calculateEffectiveHours(totalHours);
  const threshold = effectiveHours * 636;
  const bonus = totalSales - threshold;
  return Math.max(0, bonus);
};

/**
 * Reiknar framvindu og hraða liðsins miðað við markmið.
 */
export const calculateVelocity = (currentSales: number, goal: number): { projected: number; pacePercent: number } => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const dailyPace = currentSales / Math.max(1, dayOfMonth);
  const projected = dailyPace * daysInMonth;
  const pacePercent = goal > 0 ? (projected / goal) * 100 : 0;

  return { projected, pacePercent };
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