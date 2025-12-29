import { GoogleGenerativeAI } from "@google/generative-ai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

/**
 * Safely retrieves the API key without crashing the app.
 * Checks both import.meta.env (Vite) and handles missing keys gracefully.
 */
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

/**
 * Helper to get the model safely.
 * DOES NOT RUN until called, preventing app-start crashes.
 * UPDATED: Uses gemini-2.0-flash-exp (The latest available developer preview).
 * NOTE: "gemini-3.0" does not exist yet and will cause crashes.
 */
const getModel = (modelName: string = "gemini-2.0-flash-exp") => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ Gemini API Key is missing. Make sure VITE_GEMINI_API_KEY is set in Netlify.");
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Strips markdown code blocks from a string to ensure valid JSON parsing.
 */
const stripMarkdown = (text: string) => {
  return text.replace(/```json\n?|```/g, '').trim();
};

export interface SpeechResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const getWageInsights = async (shifts: Shift[], summary: WageSummary): Promise<string> => {
  // Using the latest 2.0 Flash model
  const model = getModel("gemini-2.0-flash-exp"); 
  if (!model) return "Bíður eftir lykli... (Vantar VITE_GEMINI_API_KEY)";
  
  try {
    const prompt = `Greindu eftirfarandi gögn fyrir starfsmann hjá TAKK: Vaktir: ${shifts.length}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna (engin * eða #), max 3 stuttar línur. Vertu hvetjandi.`;
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/[*#]/g, '') || "Greining fannst ekki.";
  } catch (e) {
    console.error("AI Error:", e);
    return "Villa við tengingu (AI).";
  }
};

export const getManagerCommandAnalysis = async (charityData: any) => {
  // Switched to 2.0 Flash Exp for latest capabilities
  const model = getModel("gemini-2.0-flash-exp");
  if (!model) return { strategicAdvice: "Bíður eftir lykli...", topProject: "Óvíst" };

  try {
    const prompt = `Berðu saman árangur þessara góðgerðarfélaga: ${JSON.stringify(charityData)}. 
    Skoðaðu Árangur (Heildarsöfnun), Skilvirkni (isk_per_hour) og Hagnaður (profit).
    Segðu stjórnanda hvaða félag gefur besta arðinn og hvar er hægt að nýta mannskapinn betur. 
    Svaraðu á ÍSLENSKU. Return JSON only. Format: {"topProject": "Nafn", "strategicAdvice": "Ráð"}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const text = stripMarkdown(result.response.text() || "{}");
    return JSON.parse(text);
  } catch (e) {
    console.error(e);
    return { strategicAdvice: "AI greining tókst ekki.", topProject: "Gagna vantar" };
  }
};

export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  const model = getModel("gemini-2.0-flash-exp");
  if (!model) return "Bíður eftir lykli...";

  try {
    const chat = model.startChat({
      history: history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: h.parts })),
    });
    // Dummy response since we aren't sending a new message here in this simplified flow
    return "Hæ! (Kerfið er klárt, en þarf input).";
  } catch (e) {
    return "Tengingarvilla hjá Adda.";
  }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string): Promise<SpeechResult> => {
  const model = getModel("gemini-2.0-flash-exp");
  const fallback = { text: "AI lykill vantar.", sources: [] };
  if (!model) return fallback;

  try {
    const systemInstruction = `Sölusérfræðingur hjá TAKK. Svaraðu á ÍSLENSKU.`;
    const userPrompt = mode === 'create' ? `Skrifaðu söluræðu fyrir ${project}.` : `Hvað gerir ${project}?`;
    
    const result = await model.generateContent([systemInstruction, userPrompt]);
    return { text: result.response.text().replace(/[*#\-_>]/g, '').trim(), sources: [] };
  } catch (e) {
    return fallback;
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  const model = getModel("gemini-2.0-flash-exp");
  if (!model) return { smartAdvice: "Bíður eftir lykli...", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: summary.totalSales };

  try {
    const prompt = `Greindu árangur: Markmið: ${JSON.stringify(goals)}, Sala: ${summary.totalSales}. 
    Svaraðu í JSON formi á ÍSLENSKU. Format: {"smartAdvice": "ráð", "trend": "up/down", "motivationalQuote": "tilvitnun", "projectedEarnings": 1000}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const text = stripMarkdown(result.response.text() || "{}");
    return JSON.parse(text);
  } catch (e) {
    return { smartAdvice: "Gat ekki greint gögn.", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: summary.totalSales };
  }
};

export const getAIProjectComparison = async (sales: Sale[]): Promise<string> => {
  const model = getModel("gemini-2.0-flash-exp");
  if (!model) return "Bíður eftir lykli...";

  try {
    const prompt = `Berðu saman söluverkefni. Svaraðu á ÍSLENSKU.`;
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/[*#]/g, '') || "Engin greining.";
  } catch (e) {
    return "Villa við AI samanburð.";
  }
};
