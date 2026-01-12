import { GoogleGenerativeAI } from "@google/generative-ai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

// --- CONFIGURATION ---
const FAST_MODEL = "gemini-3-flash-preview";
const SMART_MODEL = "gemini-3-flash-preview";

// --- FALLBACK DATA (Offline/Blocked Mode) ---
const FALLBACK_WINGMAN = [
  "Hringdu í næsta, hann bíður!",
  "Ekki hugsa, bara hringja!",
  "Næsti er JÁ, ég finn það.",
  "Þú ert einu símtali frá sölunni.",
  "Haltu áfram, þetta kemur.",
  "Skerptu á ræðunni, næsti tekur þetta.",
  "Brostu í gegnum símann!",
  "Engin pása núna, keyrum þetta í gang.",
  "Þögnin selur, mundu það.",
  "Ertu búinn að bjóða hækkun?"
];

const FALLBACK_COACH = [
  "Hlustaðu betur á viðskiptavininn.",
  "Notaðu þögnina, hún er vinur þinn.",
  "Spurðu opinna spurninga."
];

const getApiKey = (): string => {
  // Read from environment variable (Vite uses import.meta.env)
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

const getModel = (modelName: string) => {
  const apiKey = getApiKey();
  console.log('Gemini API Key status:', apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : 'NOT LOADED');
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

const stripMarkdown = (text: string) => {
  return text.replace(/```json|```|json/g, '').trim();
};

export interface SpeechResult {
  text: string;
  sources: { title: string; uri: string }[];
}

// --- CONVERSATIONAL AI ---
export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  const model = getModel(FAST_MODEL);
  if (!model) return "Addi er utan þjónustusvæðis (Netvilla).";

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
    return "Samband rofnaði við Adda (Blocked/Offline).";
  }
};

// --- SALES COACH ---
export const getSalesCoachAdvice = async (hurdles: string[]): Promise<string> => {
  const model = getModel(FAST_MODEL);

  if (!model) return FALLBACK_COACH.join("\\n");

  try {
    const prompt = `
      Ég er sölumaður (fjáröflun). Hindranir í dag: ${hurdles.join(', ')}.
      Gefðu mér 3 stutt, öflug ráð (bullet points). Svaraðu á ÍSLENSKU.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/[*#]/g, '') || FALLBACK_COACH.join("\\n");
  } catch (e) {
    return FALLBACK_COACH.sort(() => 0.5 - Math.random()).slice(0, 3).join("\\n");
  }
};

// --- MANAGER STRATEGY ---
export const getManagerCommandAnalysis = async (charityData: any) => {
  const model = getModel(SMART_MODEL);
  if (!model) return { strategicAdvice: "Gagna vantar (Offline)", topProject: "Óvíst" };

  try {
    const prompt = `Berðu saman árangur: ${JSON.stringify(charityData)}. 
    Return JSON only. Format: {"topProject": "Nafn", "strategicAdvice": "Ráð"}`;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    return JSON.parse(stripMarkdown(result.response.text()));
  } catch (e) {
    return { strategicAdvice: "Ekki náðist samband við gervigreind.", topProject: "Gagna vantar" };
  }
};

// --- SCRIPT GENERATOR ---
export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string): Promise<SpeechResult> => {
  const model = getModel(FAST_MODEL);
  const fallback = { text: `Engin tenging. \\n\\nMundu að kynna ${project} af innlifun og svara spurningum heiðarlega.`, sources: [] };
  if (!model) return fallback;

  try {
    const systemInstruction = `Þú ert reyndur sölumaður. Skrifaðu sannfærandi texta.`;
    const userPrompt = mode === 'create'
      ? `Skrifaðu söluræðu fyrir ${project}. 70-100 orð. Íslenska.`
      : `Hvað gerir ${project}? Stutt yfirlit á íslensku.`;

    const result = await model.generateContent([systemInstruction, userPrompt]);
    return { text: result.response.text().replace(/[*#\\-_>]/g, '').trim(), sources: [] };
  } catch (e) {
    return fallback;
  }
};

// --- SMART DASHBOARD ANALYSIS ---
export const getSmartDashboardAnalysis = async (salesToday: number, totalPeriodSales: number, goals: Goals, personality: string = 'standard') => {
  const model = getModel(FAST_MODEL);

  const fallbackAdvice = salesToday > goals.daily ? "Frábær árangur, haltu dampi!" : "Gefðu í, þú getur þetta!";
  const fallbackTrend = salesToday > (goals.daily / 2) ? "up" : "stable";

  if (!model) return { smartAdvice: fallbackAdvice, trend: fallbackTrend, motivationalQuote: "Áfram gakk!", projectedEarnings: totalPeriodSales };

  try {
    const prompt = `
      Act as a Sales Coach with personality: "${personality}".
      TODAY: Sales ${salesToday} ISK (Goal ${goals.daily} ISK).
      MONTH: Sales ${totalPeriodSales} ISK (Goal ${goals.monthly} ISK).
      Respond in JSON in ICELANDIC.
      Format: {"smartAdvice": "short advice (max 6 words)", "trend": "up/down/stable", "motivationalQuote": "quote", "projectedEarnings": ${totalPeriodSales}}
    `;

    const result = await model.generateContent(prompt);
    const text = stripMarkdown((await result.response).text());
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      smartAdvice: fallbackAdvice,
      trend: fallbackTrend,
      motivationalQuote: "Haltu áfram!",
      projectedEarnings: totalPeriodSales
    };
  }
};

// --- LIVE WINGMAN (SMART PERFORMANCE-BASED SYSTEM) ---
interface SalesStats {
  salesToday: number;
  salesCount: number;
  hoursWorked: number;
  historicalAvg: number;
  goalToday: number;
  timeInShift: number;
}

export const getWingmanMessage = async (
  minutesSinceSale: number,
  personality: string,
  salesStats?: SalesStats
) => {
  const model = getModel(FAST_MODEL);

  // Random Fallback
  const randomFallback = FALLBACK_WINGMAN[Math.floor(Math.random() * FALLBACK_WINGMAN.length)];

  if (!model) return randomFallback;

  // If no stats provided, use basic version
  if (!salesStats) {
    try {
      const prompt = `
        Act as Sales Coach (${personality} personality).
        User has not made a sale in ${minutesSinceSale} minutes.
        Give a short, punchy sales tactic or motivation (Max 10 words). Icelandic.
        Focus on action, not time.
      `;
      const result = await model.generateContent(prompt);
      return (await result.response).text().replace(/["\\n]/g, '').trim();
    } catch (e) {
      return randomFallback;
    }
  }

  // SMART SYSTEM: Analyze performance
  const { salesToday, salesCount, hoursWorked, historicalAvg, goalToday, timeInShift } = salesStats;

  const currentRate = hoursWorked > 0 ? salesToday / hoursWorked : 0;
  const performanceVsAvg = historicalAvg > 0 ? (currentRate / historicalAvg) * 100 : 100;
  const goalProgress = goalToday > 0 ? (salesToday / goalToday) * 100 : 0;
  const hoursRemaining = Math.max(0, 8 - timeInShift); // Assume 8hr shift
  const projectedFinal = salesToday + (currentRate * hoursRemaining);
  const onPaceForGoal = projectedFinal >= goalToday;

  try {
    const prompt = `
      You are an elite Sales Coach with "${personality}" personality.
      
      PERFORMANCE DATA:
      - Today's sales: ${salesToday} ISK (${salesCount} sales)
      - Hours worked so far: ${hoursWorked.toFixed(1)}h
      - Current rate: ${currentRate.toFixed(0)} ISK/hour
      - Historical average rate: ${historicalAvg.toFixed(0)} ISK/hour
      - Performance vs average: ${performanceVsAvg.toFixed(0)}%
      - Goal today: ${goalToday} ISK
      - Goal progress: ${goalProgress.toFixed(0)}%
      - Minutes since last sale: ${minutesSinceSale}
      - Projected end-of-day: ${projectedFinal.toFixed(0)} ISK
      - On pace for goal: ${onPaceForGoal ? 'YES' : 'NO'}
      
      TASK: Analyze the performance and give ONE specific, actionable piece of advice.
      
      RULES - SMART SYSTEM:
      1. If performance is ABOVE average (>100%): Give praise and encouragement to maintain pace
      2. If performance is BELOW average (<100%): Give specific tactical coaching to improve
      3. If time since last sale is high (>30 min): Add urgency and activity suggestions
      4. If approaching goal: Motivate to push through
      5. Language: Icelandic (conversational)
      6. Max length: 15 words
      7. Be specific, not generic
      8. DO NOT mention exact numbers or percentages in your response
      
      Examples of GOOD responses:
      - "Þú ert að sigla yfir markmiðið, haltu svona áfram!" (above average)
      - "Prófaðu að hringja oftar, þú ert að taka of langan tíma á milli" (below average, long gap)
      - "Bjóddu hækkun oftar, það eykur meðalsöluna" (below average)
      - "Eitt símtal í viðbót og þú ert komin í markmið!" (close to goal)
    `;

    const result = await model.generateContent(prompt);
    return (await result.response).text().replace(/["\\n]/g, '').trim();
  } catch (e) {
    return randomFallback;
  }
};

// --- PRE-SHIFT BRIEFING ---
export const getPreShiftBriefing = async (yesterdaySales: number, personality: string) => {
  const model = getModel(FAST_MODEL);
  if (!model) return { title: "Góðan dag!", body: "Gangi þér vel í dag." };

  try {
    const prompt = `
            Act as Sales Coach (${personality}).
            Yesterday's sales: ${yesterdaySales} ISK.
            Write pre-shift briefing. Format JSON: { "title": "Short Title", "body": "2 sentences advice" }. Icelandic.
        `;
    const result = await model.generateContent(prompt);
    return JSON.parse(stripMarkdown((await result.response).text()));
  } catch (e) {
    return { title: "Nýr dagur!", body: "Gleymdu gærdeginum, rústaðu deginum í dag." };
  }
};

// --- PROJECT INSIGHTS ---
export const getAIProjectComparison = async (sales: Sale[]) => {
  const model = getModel(FAST_MODEL);
  if (!model) return { headline: "Greining ófáanleg", tip: "Skráðu fleiri sölur." };

  const summary: Record<string, number> = {};
  sales.forEach(s => summary[s.project] = (summary[s.project] || 0) + s.amount);

  try {
    const prompt = `
      Analyze sales: ${JSON.stringify(summary)}.
      1. Headline (max 6 words).
      2. Tip (max 10 words).
      JSON Format: {"headline": "...", "tip": "..."}. Icelandic.
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
