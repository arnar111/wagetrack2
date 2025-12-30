import React, { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { PROJECTS } from '../constants.ts';
import { Database, Check, Loader2 } from 'lucide-react';

const GhostSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const generateData = async () => {
    if (!confirm("Þetta mun búa til ný gervigögn fyrir notanda 123 í Firestore. Halda áfram?")) return;
    
    setLoading(true);
    const batch = writeBatch(db);
    const STAFF_ID = "123";
    
    // Config
    const startDate = new Date(2025, 11, 1); // Dec 1, 2025
    const endDate = new Date(2025, 11, 30); // Dec 30, 2025
    
    // Loop through days
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Skip Sundays (no work)
      if (d.getDay() === 0) continue; 
      
      // 10% chance to skip a random day (sick/day off)
      if (Math.random() < 0.1) continue;

      // --- 1. DETERMINE DAILY TOTAL GOAL ---
      const rand = Math.random();
      let targetTotal = 0;

      if (rand < 0.1) {
        // BAD DAY (13k - 22k)
        targetTotal = 13000 + Math.random() * 9000;
      } else if (rand > 0.9) {
        // GOOD DAY (30k - 45k)
        targetTotal = 30000 + Math.random() * 15000;
      } else {
        // NORMAL DAY (22k - 30k) - Weighted towards 28k avg
        targetTotal = 22000 + Math.random() * 8000;
      }

      // Round to nearest 500
      targetTotal = Math.round(targetTotal / 500) * 500;

      // --- 2. GENERATE INDIVIDUAL SALES TO MATCH TOTAL ---
      let currentSum = 0;
      const daysSales = [];
      const shiftDateStr = d.toISOString().split('T')[0];

      while (currentSum < targetTotal) {
        // Generate a sale amount (multiples of 500, between 1500 and 5000)
        let amount = (Math.floor(Math.random() * 8) + 3) * 500; // 1500, 2000... 5000
        
        // Don't overshoot
        if (currentSum + amount > targetTotal) {
            amount = targetTotal - currentSum;
        }
        
        // If remaining is too small (e.g. 500), just add it to previous or skip logic for simplicity in ghost data
        if (amount === 0) break;

        currentSum += amount;

        const saleRef = doc(collection(db, "sales"));
        const saleDoc = {
            id: saleRef.id,
            date: shiftDateStr,
            timestamp: new Date(d.setHours(17 + Math.random() * 4, Math.random() * 59)).toISOString(),
            amount: amount,
            project: PROJECTS[Math.floor(Math.random() * PROJECTS.length)],
            userId: STAFF_ID,
            saleType: Math.random() > 0.7 ? 'upgrade' : 'new' // 30% upgrades
        };
        daysSales.push(saleDoc);
        batch.set(saleRef, saleDoc);
      }

      // --- 3. CREATE SHIFT SUMMARY ---
      const shiftRef = doc(collection(db, "shifts"));
      const dayHours = 0;
      const eveningHours = 3.5 + (Math.random() * 0.5); // 3.5 - 4.0 hours

      batch.set(shiftRef, {
        id: shiftRef.id,
        date: shiftDateStr,
        dayHours: dayHours,
        eveningHours: parseFloat(eveningHours.toFixed(2)),
        totalSales: currentSum,
        notes: "Gervigögn (Ghost Data)",
        projectName: "Mixed",
        userId: STAFF_ID
      });
    }

    await batch.commit();
    setLoading(false);
    setDone(true);
  };

  if (done) return (
    <div className="fixed bottom-4 right-4 bg-emerald-500 text-slate-900 p-4 rounded-xl font-black shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-10 z-50">
        <Check size={20} /> Gögn vistuð fyrir ID 123!
    </div>
  );

  return (
    <button 
        onClick={generateData}
        disabled={loading}
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl font-bold shadow-2xl z-50 flex items-center gap-2 transition-all hover:scale-105"
    >
        {loading ? <Loader2 className="animate-spin" /> : <Database size={20} />}
        {loading ? "Bý til gögn..." : "Búa til gervigögn (123)"}
    </button>
  );
};

export default GhostSeeder;
