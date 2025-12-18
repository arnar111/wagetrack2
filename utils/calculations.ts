import { Shift, WageSummary, WageSettings, Sale } from '../types';

/**
 * Reiknar virka vinnustundir með því að draga frá 0.125 klst (7.5 mín) 
 * fyrir hverja 1 klst unna. Þetta jafngildir 1 klst hvíld á 8 klst vakt.
 * Margfaldari: 0.875
 */
export const calculateEffectiveHours = (totalHours: number): number => {
  return Math.max(0, totalHours * 0.875);
};

/**
 * Reiknar bónus (1604) samkvæmt formúlu Takk ehf:
 * 1. Virkar stundir = Samtals stundir * 0.875
 * 2. Viðmið (Threshold) = Virkar stundir * 636 ISK
 * 3. Bónus = Sala - Viðmið (ef sala > viðmið)
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
  
  const dailyPace = currentSales / dayOfMonth;
  const projected = dailyPace * daysInMonth;
  const pacePercent = goal > 0 ? (projected / goal) * 100 : 0;

  return { projected, pacePercent };
};

/**
 * Hópar sölu og vinnustundir eftir góðgerðarfélögum (projects).
 */
export const getProjectMetrics = (sales: Sale[], shifts: Shift[]) => {
  const metrics: Record<string, { sales: number; hours: number; effHours: number; cost: number; count: number }> = {};

  sales.forEach(s => {
    const p = s.project || 'Annað';
    if (!metrics[p]) metrics[p] = { sales: 0, hours: 0, effHours: 0, cost: 0, count: 0 };
    metrics[p].sales += s.amount;
    metrics[p].count += 1;
  });

  // Ath: Shifts hafa oftast 'projectName' sem vísar í teymi (Hringurinn/Verið), 
  // en fyrir samanburð félaga notum við hlutfall af stundum miðað við sölu ef vantar.
  // Hér gerum við ráð fyrir að projectName geti líka verið félagið eða vísun í hvar unnið var.
  shifts.forEach(s => {
    const p = s.projectName || 'Annað';
    if (!metrics[p]) metrics[p] = { sales: 0, hours: 0, effHours: 0, cost: 0, count: 0 };
    const h = (s.dayHours || 0) + (s.eveningHours || 0);
    metrics[p].hours += h;
    metrics[p].effHours += calculateEffectiveHours(h);
    // Áætlaður launakostnaður (Dagvinna: 2724.88)
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