
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc
} from 'firebase/firestore';
import { db } from '../firebase.ts';

/**
 * Force seeds data for test user 123.
 * 1. Clears existing shifts/sales for 123.
 * 2. Generates new data from 1st of month to yesterday.
 */
export const forceSeedUser123 = async () => {
  const staffId = '123';
  console.log("🚀 Starting Force Seed for User 123...");

  try {
    const batch = writeBatch(db);

    // STEP 1: CLEANUP
    console.log("🔍 Finding existing data to clear...");
    const shiftsQ = query(collection(db, "shifts"), where("userId", "==", staffId));
    const salesQ = query(collection(db, "sales"), where("userId", "==", staffId));

    const [shiftsSnap, salesSnap] = await Promise.all([
      getDocs(shiftsQ),
      getDocs(salesQ)
    ]);

    console.log(`🗑️ Deleting ${shiftsSnap.size} shifts and ${salesSnap.size} sales...`);
    
    // We use a separate batch if the list is long, 
    // but for a single month, one batch handles 500 ops.
    shiftsSnap.forEach((d) => batch.delete(d.ref));
    salesSnap.forEach((d) => batch.delete(d.ref));

    // STEP 2: GENERATION
    console.log("📅 Generating new data...");
    const projects = ["Samhjálp", "SKB", "Hjálparstarfið", "Stígamót"];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    let generatedCount = 0;

    for (let day = 1; day <= yesterday.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay();

      // Skip Weekends (Sat=6, Sun=0)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = date.toISOString().split('T')[0];
      
      // Range: 15,000 - 55,000 ISK (500 increments)
      const minSteps = 15000 / 500;
      const maxSteps = 55000 / 500;
      const steps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
      const totalSales = steps * 500;

      // Create Shift
      const shiftRef = doc(collection(db, "shifts"));
      batch.set(shiftRef, {
        userId: staffId,
        date: dateStr,
        dayHours: 8,
        eveningHours: 0,
        totalSales: totalSales,
        notes: "Sjálfvirk tilraunagögn (Force Seeded)"
      });

      // Create 2 Sales
      let remaining = totalSales;
      for (let i = 0; i < 2; i++) {
        const saleAmount = i === 1 ? remaining : Math.floor((totalSales * 0.6) / 500) * 500;
        remaining -= saleAmount;

        const saleRef = doc(collection(db, "sales"));
        const saleTime = new Date(date);
        saleTime.setHours(10 + (i * 3), Math.floor(Math.random() * 60));
        
        batch.set(saleRef, {
          userId: staffId,
          date: dateStr,
          timestamp: saleTime.toISOString(),
          amount: saleAmount,
          project: projects[Math.floor(Math.random() * projects.length)]
        });
      }
      generatedCount++;
    }

    // STEP 3: FINISH
    console.log(`📦 Committing ${generatedCount} days of data to Firestore...`);
    await batch.commit();
    
    console.log("✅ Force Seed Successful!");
    alert("Data seeded! Check your dashboard.");
    // Removed window.location.reload() to prevent preview crash. 
    // Firestore onSnapshot will update the UI automatically.

  } catch (error) {
    console.error("❌ Force Seeding Failed:", error);
    alert("Villa kom upp við að skrá gögn: " + (error instanceof Error ? error.message : "Óþekkt villa"));
  }
};

/**
 * Original seeder function kept for compatibility
 */
export const seedTestUser = async (staffId: string) => {
  if (staffId === '123') {
    console.log("Test user 123 detected. Use the UI button to force seed if needed.");
  }
};
