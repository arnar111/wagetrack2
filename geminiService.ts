import { GoogleGenAI, Type } from "@google/genai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

// Helper to safely initialize the AI client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.warn("Gemini API key is missing. AI features will use fallback data.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export interface SpeechResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const getWageInsights = async (shifts: Shift[], summary: WageSummary) => {
  const ai = getAiClient();
  if (!ai) return "Vantar API lykil.";

  try {
    const prompt = `Greindu eftirfarandi gögn fyrir starfsmann hjá TAKK: Vaktir: ${JSON.stringify(shifts)}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna (engin * eða #), max 3 stuttar línur. Vertu hvetjandi.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk að svo stöddu.";
  } catch (e) {
    console.error("Gemini Error:", e);
    return "Villa við að sækja greiningu.";
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  const fallback = {
    projectedEarnings: summary.totalSales * 1.1,
    trend: 'stable',
    smartAdvice: "Skráðu vaktir til að sjá greiningu.",
    motivationalQuote: "Gangi þér vel!"
  };

  const ai = getAiClient();
  if (!ai) return fallback;

  try {
    const prompt = `Analyze sales trends for a TAKK employee. 
    Current Sales: ${summary.totalSales} ISK. Goal: ${goals.monthly} ISK.
    Recent Shifts: ${JSON.stringify(shifts.slice(0, 10))}.
    Predict the end-of-month total based on trajectory.
    Identify if the trend is 'up', 'down', or 'stable'.
    Provide 1 strategic advice sentence in ICELANDIC.
    Provide 1 short motivational sales quote in ICELANDIC.
    Respond ONLY in JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectedEarnings: { type: Type.NUMBER },
            trend: { type: Type.STRING },
            smartAdvice: { type: Type.STRING },
            motivationalQuote: { type: Type.STRING }
          },
          required: ["projectedEarnings", "trend", "smartAdvice", "motivationalQuote"]
        }
      }
    });
    return JSON.parse(response.text || JSON.stringify(fallback));
  } catch (e) {
    console.error("Gemini Error:", e);
    return fallback;
  }
};

export const getAIProjectComparison = async (sales: Sale[]) => {
  const ai = getAiClient();
  if (!ai) return "Vantar API lykil fyrir samanburð.";

  try {
    const prompt = `Berðu saman árangur mismunandi verkefna (Samhjálp, SKB, Hjálparstarfið, Stígamót) byggt á þessum sölum: ${JSON.stringify(sales)}. 
    Hvaða verkefni virkar best í sölunni núna? Hvar eru tækifærin?
    Svaraðu á ÍSLENSKU, hreinn texti, max 100 orð.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk.";
  } catch (e) {
    console.error("Gemini Error:", e);
    return "Villa við greiningu.";
  }
};

export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  const ai = getAiClient();
  if (!ai) return "Ég er því miður ekki með tengingu við gervigreindina í augnablikinu (vantar API lykil).";

  try {
    const systemInstruction = `Þú ert Addi, vinalegur og klár gervigreindar-aðstoðarmaður fyrir starfsmenn TAKK. Svaraðu ALLTAF á ÍSLENSKU. Notaðu hreinan texta.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: { systemInstruction }
    });
    return response.text?.replace(/[*#]/g, '') || "Fyrirgefðu, ég átti erfitt með að svara þessu.";
  } catch (e) {
    console.error("Gemini Error:", e);
    return "Tengingarvilla! Ég kemst ekki í sambandi við heilann minn í bili.";
  }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string, context?: string): Promise<SpeechResult> => {
  const fallback = { text: "Vantar lykil.", sources: [] };
  const ai = getAiClient();
  if (!ai) return fallback;

  try {
    const systemInstruction = `Þú ert sölusérfræðingur fyrir TAKK. Svaraðu á íslensku. Hreinn texti.`;
    const userPrompt = mode === 'create' 
      ? `Búðu til 5 urgency sölubúta fyrir ${project}. ${context || ''}`
      : `Finndu helstu sölupunkta fyrir ${project}.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: userPrompt }] }],
      config: { 
        systemInstruction,
        ...(mode === 'search' ? { tools: [{ googleSearch: {} }] } : {})
      }
    });
    const text = response.text || "";
    const sources: { title: string; uri: string }[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web?.uri) sources.push({ title: chunk.web.title || "Vefheimild", uri: chunk.web.uri });
    });
    return { text: text.replace(/[*#\-_>]/g, '').trim() || fallback.text, sources };
  } catch (e) {
    console.error("Gemini Error:", e);
    return fallback;
  }
};