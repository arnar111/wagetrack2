export const getRoundedTime = (date: Date) => {
    const coeff = 1000 * 60 * 15; // 15 minutes
    return new Date(Math.round(date.getTime() / coeff) * coeff);
};

export const calculateShiftSplit = (start: Date, end: Date) => {
    const isWeekend = start.getDay() === 0 || start.getDay() === 6;
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 0) return { day: 0, evening: 0 };
    if (isWeekend) return { day: 0, evening: diffHours };

    const hourOfDay = end.getHours();

    // Simple logic: Evening starts at 5 PM (17:00)
    // If the shift ends after 17:00, calculate overlap
    // Note: This logic assumes day shift starts before 17:00. 
    // If shift is entirely after 17:00, it's all evening.
    // If shift is entirely before 17:00, it's all day.

    // We need to calculate the actual overlap relative to wall clock time
    // But for now, we will reuse the logic from the component which was:

    if (hourOfDay >= 17) {
        // This logic in the original component was slightly approximate but we will keep it consistent
        const eveningPart = Math.max(0, hourOfDay - 17 + (end.getMinutes() / 60));
        // Clamp evening part to not exceed total duration (e.g. if started at 16:30 and ended at 17:15)
        const realEvening = Math.min(diffHours, eveningPart);
        const dayPart = Math.max(0, diffHours - realEvening);
        return { day: dayPart, evening: realEvening };
    }
    return { day: diffHours, evening: 0 };
};
