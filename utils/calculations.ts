
import { Shift, WageSummary, WageSettings, Sale } from '../types';

export const calculateWageSummary = (shifts: Shift[], sales: Sale[], settings: WageSettings): WageSummary => {
  let totalHours = 0;
  let grossPay = 0;
  const totalSales = sales.reduce((acc, s) => acc + s.amount, 0);

  shifts.forEach(shift => {
    totalHours += (shift.dayHours + shift.eveningHours);
    grossPay += (shift.dayHours * settings.dayRate) + (shift.eveningHours * settings.eveningRate);
  });

  const pensionFund = grossPay * settings.pensionRate;
  const taxableIncome = grossPay - pensionFund;
  const unionFee = grossPay * settings.unionRate;
  
  // Apply personal allowance based on usage percentage (0-100%)
  const effectiveAllowance = settings.personalAllowance * (settings.allowanceUsage || 0);
  let tax = (taxableIncome * settings.taxRate) - effectiveAllowance;
  if (tax < 0) tax = 0;

  const netPay = grossPay - pensionFund - unionFee - tax;

  return {
    grossPay,
    pensionFund,
    unionFee,
    tax,
    netPay,
    totalHours,
    totalSales
  };
};
