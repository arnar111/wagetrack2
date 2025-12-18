
import { Shift, Sale } from '../types';

export interface ProjectMomentum {
  hringurinn: number; // 0-100 score
  verid: number;      // 0-100 score
  recommendation: string;
}

/**
 * Calculates project momentum based on the last 7 days of performance.
 * Predicts which project is likely to be more profitable based on efficiency trends.
 */
export const getProjectMomentum = (shifts: Shift[], sales: Sale[]): ProjectMomentum => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));

  const getStats = (projectName: string) => {
    const projectSales = sales.filter(s => s.project === projectName && new Date(s.date) >= sevenDaysAgo);
    const projectShifts = shifts.filter(s => s.projectName === projectName && new Date(s.date) >= sevenDaysAgo);
    
    const totalSales = projectSales.reduce((acc, s) => acc + s.amount, 0);
    const totalHours = projectShifts.reduce((acc, s) => acc + (s.dayHours + s.eveningHours), 0);
    
    const efficiency = totalHours > 0 ? totalSales / totalHours : 0;
    const count = projectSales.length;
    
    return { efficiency, count, totalSales };
  };

  const hStats = getStats('Hringurinn');
  const vStats = getStats('Verið');

  // Simple weighted score: 70% efficiency, 30% volume
  const maxEff = Math.max(hStats.efficiency, vStats.efficiency, 1);
  const maxVol = Math.max(hStats.count, vStats.count, 1);

  const hScore = ((hStats.efficiency / maxEff) * 70) + ((hStats.count / maxVol) * 30);
  const vScore = ((vStats.efficiency / maxEff) * 70) + ((vStats.count / maxVol) * 30);

  let recommendation = "";
  if (hScore > vScore + 10) {
    recommendation = "Hringurinn sýnir sterka sölutækni núna. Mælt með að fókusa á það verkefni.";
  } else if (vScore > hScore + 10) {
    recommendation = "Verið er á mikilli siglingu. Gjöfult verkefni í augnablikinu.";
  } else {
    recommendation = "Jafnvægi er á milli verkefna. Bæði skila góðum árangri.";
  }

  return {
    hringurinn: Math.round(hScore),
    verid: Math.round(vScore),
    recommendation
  };
};
