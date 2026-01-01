import { GoogleGenerativeAI } from "@google/generative-ai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

// --- CONFIGURATION (DEC 2025 STANDARDS) ---
const FAST_MODEL = "gemini-3-flash-preview";
const SMART_MODEL = "gemini-3-pro-preview";

const getApiKey = (): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn("Could not read environment variables safely.");
  }
  return "";
};

const getModel = (modelName: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ Gemini API Key is missing.");
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

const stripMarkdown = (text: string) => {
  return text.replace(/```json\n?|```/g, '').trim();
};

export interface SpeechResult {
  text: string;
  sources: { title: string; uri: string }[];
}

// --- CONVERSATIONAL AI ---
export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  const model = getModel(FAST_MODEL);
  if (!model) return "Bíður eftir lykli...";

  try {
    const lastMsg = history[history.length - 1];
    const previousHistory = history.slice(0, -1).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: h.parts
    }));

    const chat = model.startChat({ history: previousHistory });
    const result = await chat.sendMessage(lastMsg.parts[0].text);
    return result.response.text();
  } catch (e) {
    console.error("Chat Error:", e);
    return "Tengingarvilla hjá Adda.";
  }
};

// --- SALES COACH ---
export const getSalesCoachAdvice = async (hurdles: string[]): Promise<string> => {
  const model = getModel(FAST_MODEL);
  if (!model) return "Bíður eftir lykli...";

  try {
    const prompt = `
      Ég er sölumaður (fjáröflun). Hindranir í dag: ${hurdles.join(', ')}.
      Gefðu mér 3 stutt, öflug ráð (bullet points). Svaraðu á ÍSLENSKU.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/[*#]/g, '') || "Engin ráð fundust.";
  } catch (e) {
    return "Villa við MorriAI.";
  }
};

// --- MANAGER STRATEGY ---
export const getManagerCommandAnalysis = async (charityData: any) => {
  const model = getModel(SMART_MODEL);
  if (!model) return { strategicAdvice: "Bíður eftir lykli...", topProject: "Óvíst" };

  try {
    const prompt = `Berðu saman árangur: ${JSON.stringify(charityData)}. 
    Return JSON only. Format: {"topProject": "Nafn", "strategicAdvice": "Ráð"}`;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    return JSON.parse(stripMarkdown(result.response.text()));
  } catch (e) {
    return { strategicAdvice: "AI villa.", topProject: "Gagna vantar" };
  }
};

// --- SCRIPT GENERATOR ---
export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string): Promise<SpeechResult> => {
  const model = getModel(FAST_MODEL);
  if (!model) return { text: "AI lykill vantar.", sources: [] };

  try {
    const systemInstruction = `Þú ert reyndur sölumaður. Skrifaðu sannfærandi texta.`;
    const userPrompt = mode === 'create'
      ? `Skrifaðu söluræðu fyrir ${project}. 70-100 orð. Íslenska.`
      : `Hvað gerir ${project}? Stutt yfirlit á íslensku.`;

    const result = await model.generateContent([systemInstruction, userPrompt]);
    return { text: result.response.text().replace(/[*#\-_>]/g, '').trim(), sources: [] };
  } catch (e) {
    return { text: "Villa við að sækja ræðu.", sources: [] };
  }
};

// --- 1. SMART DASHBOARD ANALYSIS (Sales Coach) ---
export const getSmartDashboardAnalysis = async (salesToday: number, totalPeriodSales: number, goals: Goals, personality: string = 'standard') => {
  const model = getModel(FAST_MODEL);
  if (!model) return { smartAdvice: "Bíður eftir lykli...", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: totalPeriodSales };

  try {
    const prompt = `
      Act as a Sales Coach with the personality: "${personality}".
      
      Personality Traits:
      - standard: Encouraging, professional, balanced.
      - drill_sergeant: Strict, loud, demanding, focuses on speed and discipline.
      - zen_master: Calm, philosophical, focuses on focus and flow.
      - wolf: Aggressive, money-orientated, "Greed is good".

      Analyze the status:
      TODAY: Sales ${salesToday} ISK (Goal ${goals.daily} ISK).
      MONTH: Sales ${totalPeriodSales} ISK (Goal ${goals.monthly} ISK).
      
      Respond in JSON in ICELANDIC.
      Format: {"smartAdvice": "very short advice (max 6 words) matching personality", "trend": "up/down/stable", "motivationalQuote": "quote matching personality", "projectedEarnings": ${totalPeriodSales}}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text(); // Get raw text
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim(); // Clean markdown
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      smartAdvice: "Greini gögn...",
      trend: 'stable',
      motivationalQuote: "Áfram gakk!",
      projectedEarnings: totalPeriodSales
    };
  }
};

// --- NEW: LIVE WINGMAN ---
export const getWingmanMessage = async (minutesSinceSale: number, personality: string) => {
  const model = getModel(FAST_MODEL);
  if (!model) return "Enginn API lykill...";

  try {
    const prompt = `
            Act as a Sales Coach (${personality}).
            The user hasn't made a sale in ${minutesSinceSale} minutes.
            Give a SHORT, punchy notification text (max 8 words) to wake them up.
            Language: Icelandic.
        `;
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  } catch (e) {
    return "Hringdu í næsta!";
  }
};

// --- NEW: PRE-SHIFT BRIEFING ---
export const getPreShiftBriefing = async (yesterdaySales: number, personality: string) => {
  const model = getModel(FAST_MODEL);
  if (!model) return { title: "Góðan dag!", body: "Gangi þér vel í dag." };

  try {
    const prompt = `
            Act as a Sales Coach (${personality}).
            Yesterday's sales were: ${yesterdaySales} ISK.
            and Write a pre-shift briefing for today.
            Format JSON: { "title": "Short Title", "body": "2 sentences advice" }
            Language: Icelandic.
        `;
    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return { title: "Góðan dag!", body: "Gangi þér vel í dag." };
  }
};

// --- PROJECT INSIGHTS (NEW JSON FORMAT) ---
export const getAIProjectComparison = async (sales: Sale[]) => {
  const model = getModel(FAST_MODEL);
  if (!model) return { headline: "Bíður eftir lykli...", tip: "Skráðu fleiri sölur." };

  const summary: Record<string, number> = {};
  sales.forEach(s => summary[s.project] = (summary[s.project] || 0) + s.amount);

  try {
    const prompt = `
      Greindu þessa sölu eftir verkefnum: ${JSON.stringify(summary)}.
      1. Hvað stendur upp úr? (Headline - max 6 orð).
      2. Hvað má betur fara? (Tip - max 10 orð).
      Svaraðu í JSON. Format: {"headline": "...", "tip": "..."}
    `;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    return JSON.parse(stripMarkdown(result.response.text()));
  } catch (e) {
    return { headline: "Engin greining.", tip: "Haltu áfram að selja." };
  }
};
