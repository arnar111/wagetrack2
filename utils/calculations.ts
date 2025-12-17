
import { Shift, WageSummary, WageSettings, Sale } from '../types';

export const calculateShiftDuration = (shift: Shift): number => {
  const start = new Date(`2000-01-01T${shift.startTime}`);
  const end = new Date(`2000-01-01T${shift.endTime}`);
  let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (diff < 0) diff += 24;
  const breakHours = shift.breakMinutes / 60;
  return Math.max(0, diff - breakHours);
};

export const calculateWageSummary = (shifts: Shift[], sales: Sale[], settings: WageSettings): WageSummary => {
  let totalHours = 0;
  let grossPay = 0;
  const totalSales = sales.reduce((acc, s) => acc + s.amount, 0);

  shifts.forEach(shift => {
    const hours = calculateShiftDuration(shift);
    totalHours += hours;
    
    let multiplier = 1;
    if (shift.isHoliday) multiplier = 1.8;
    else if (shift.type === 'Næturvinna') multiplier = 1.45;
    else if (shift.type === 'Eftirvinna') multiplier = 1.33;
    else if (shift.type === 'Helgarvinna') multiplier = 1.4;

    grossPay += hours * shift.hourlyRate * multiplier;
  });

  const pensionFund = grossPay * settings.pensionRate;
  const taxableIncome = grossPay - pensionFund;
  const unionFee = grossPay * settings.unionRate;
  
  let tax = (taxableIncome * settings.taxRate) - settings.personalAllowance;
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
