import { Shift, WageSummary, WageSettings, Sale } from '../types';

/**
 * Reiknar bónus (1604) samkvæmt nýrri formúlu:
 * Total Sales - ((636 * hours) - (79.5 * hours))
 */
export const calculateSalesBonus = (totalSales: number, totalHours: number): number => {
  // Formula: (636kr * hours) - (79.5kr * hours) = Threshold
  const baseThreshold = 636 * totalHours;
  const deduction = 79.5 * totalHours;
  const finalThreshold = baseThreshold - deduction;

  const bonus = totalSales - finalThreshold;
  return Math.max(0, bonus);
};

export const calculateWageSummary = (shifts: Shift[], sales: Sale[], settings: WageSettings): WageSummary => {
  let totalHours = 0;
  
  shifts.forEach(shift => {
    totalHours += (shift.dayHours + shift.eveningHours);
  });

  const totalSales = sales.reduce((acc, s) => acc + s.amount, 0);

  const dayEarnings = shifts.reduce((acc, s) => acc + (s.dayHours * settings.dayRate), 0);
  const eveningEarnings = shifts.reduce((acc, s) => acc + (s.eveningHours * settings.eveningRate), 0);
  
  // Use the new formula
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
