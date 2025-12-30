import React, { useState } from 'react';
import { collection, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { PROJECTS } from '../constants.ts';
import { Database, Check, Loader2, Trash2 } from 'lucide-react';

const GhostSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState("");

  const generateData = async () => {
    if (!confirm("Þetta eyðir ÖLLUM eldri gögnum fyrir notanda 123 og býr til ný. Halda áfram?")) return;
    
    setLoading(true);
    const STAFF_ID = "123";

    try {
        // --- STEP 1: WIPE EXISTING DATA ---
        setStatus("Eyði eldri gögnum...");
        const deleteBatch = writeBatch(db);
        
        const shiftsQ = query(collection(db, "shifts"), where("userId", "==", STAFF_ID));
        const salesQ = query(collection(db, "sales"), where("userId", "==", STAFF_ID));

        const [shiftSnap, saleSnap] = await Promise.all([getDocs(shiftsQ), getDocs(salesQ)]);

        shiftSnap.forEach((doc) => deleteBatch.delete(doc.ref));
        saleSnap.forEach((doc) => deleteBatch.delete(doc.ref));

        if (!shiftSnap.empty || !saleSnap.empty) {
            await deleteBatch.commit();
        }

        // --- STEP 2: GENERATE NEW DATA ---
        setStatus("Bý til ný gögn (Desember)...");
        const createBatch = writeBatch(db);
        
        const startDate = new Date(2025, 11, 1); // Dec 1, 2025
        const endDate = new Date(2025, 11, 30);  // Dec 30, 2025
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            // Skip Sundays
            if (d.getDay() === 0) continue; 
            
            // 5% chance to skip a day (sick/off)
            if (Math.random() < 0.05) continue;

            // --- TARGET CALCULATION ---
            const rand = Math.random();
            let rawTarget = 0;

            if (rand < 0.1) {
                // BAD DAY: 13.000 - 22.000
                rawTarget = 13000 + Math.random() * 9000;
            } else if (rand > 0.9) {
                // GOOD DAY: 30.000 - 45.000
                rawTarget = 30000 + Math.random() * 15000;
            } else {
                // AVERAGE DAY: 22.000 - 30.000 (Targeting ~28k avg)
                rawTarget = 22000 + Math.random() * 8000;
            }

            // Round Target to nearest 500
            const targetTotal = Math.round(rawTarget / 500) * 500;

            // --- INDIVIDUAL SALES GENERATION ---
            let currentSum = 0;
            const shiftDateStr = d.toISOString().split('T')[0];

            while (currentSum < targetTotal) {
                // Sales sizes: 1500, 2000, 2500 ... 5500
                let amount = (Math.floor(Math.random() * 9) + 3) * 500; 
                
                // Cap last sale to match total exactly
                if (currentSum + amount > targetTotal) {
                    amount = targetTotal - currentSum;
                }
                
                if (amount === 0) break;

                currentSum += amount;

                // Create Sale Doc
                const saleRef = doc(collection(db, "sales"));
                createBatch.set(saleRef, {
                    id: saleRef.id,
                    date: shiftDateStr,
                    timestamp: new Date(d.setHours(17 + Math.random() * 4, Math.random() * 59)).toISOString(),
                    amount: amount,
                    project: PROJECTS[Math.floor(Math.random() * PROJECTS.length)],
                    userId: STAFF_ID,
                    saleType: Math.random() > 0.7 ? 'upgrade' : 'new'
                });
            }

            // --- SHIFT SUMMARY ---
            const shiftRef = doc(collection(db, "shifts"));
            const eveningHours = 3.5 + (Math.random() * 0.5); // 3.5 - 4.0h

            createBatch.set(shiftRef, {
                id: shiftRef.id,
                date: shiftDateStr,
                dayHours: 0,
                eveningHours: parseFloat(eveningHours.toFixed(2)),
                totalSales: currentSum,
                notes: "Gervigögn",
                projectName: "Mixed",
                userId: STAFF_ID
            });
        }

        await createBatch.commit();
        setDone(true);

    } catch (err) {
        console.error(err);
        alert("Villa kom upp við að búa til gögn.");
    } finally {
        setLoading(false);
    }
  };

  if (done) return (
    <div className="fixed bottom-4 right-4 bg-emerald-500 text-slate-900 p-4 rounded-xl font-black shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-10 z-50 cursor-pointer" onClick={() => setDone(false)}>
        <Check size={20} /> Gögn uppfærð!
    </div>
  );

  return (
    <button 
        onClick={generateData}
        disabled={loading}
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl font-bold shadow-2xl z-50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
    >
        {loading ? <Loader2 className="animate-spin" /> : <Database size={20} />}
        <span className="text-xs uppercase tracking-widest">
            {loading ? status : "Endurræsa Gögn (123)"}
        </span>
    </button>
  );
};

export default GhostSeeder;
