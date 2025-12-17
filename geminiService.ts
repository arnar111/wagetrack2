
import { GoogleGenAI } from "@google/genai";
import { Shift, WageSummary } from "./types";

// Initialize using the environment variable directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getWageInsights = async (shifts: Shift[], summary: WageSummary) => {
  // Assume process.env.API_KEY is available as per requirements
  const prompt = `
    Analyze the following shift data and wage summary:
    Shifts: ${JSON.stringify(shifts)}
    Total Hours: ${summary.totalHours}
    Gross Pay: ${summary.grossPay}
    Net Pay: ${summary.netPay}

    Please provide:
    1. A short summary of the earning trends.
    2. Recommendations for optimizing shifts (e.g., if nights/weekends are more profitable).
    3. A motivational tip based on the progress.
    Keep it professional, encouraging, and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    // Access .text property directly (not as a function)
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to generate AI insights at this time.";
  }
};
