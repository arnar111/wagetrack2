import { GoogleGenAI, Type } from "@google/genai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SpeechResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const getWageInsights = async (shifts: Shift[], summary: WageSummary) => {
  try {
    const prompt = `Greindu eftirfarandi gögn fyrir starfsmann hjá TAKK: Vaktir: ${JSON.stringify(shifts)}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna (engin * eða #), max 3 stuttar línur. Vertu hvetjandi.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk að svo stöddu.";
  } catch (e) { 
    return "Villa við að sækja greiningu."; 
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
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
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      projectedEarnings: summary.totalSales * 1.15,
      trend: 'stable',
      smartAdvice: "Haltu áfram að skrá vaktir fyrir AI greiningu.",
      motivationalQuote: "Allur árangur byrjar á ákvörðun um að reyna."
    };
  }
};

export const getAIProjectComparison = async (sales: Sale[]) => {
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
    return "Villa við greiningu.";
  }
};

export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  try {
    const systemInstruction = `Þú ert Addi, vinalegur og klár gervigreindar-aðstoðarmaður fyrir starfsmenn TAKK. Svaraðu ALLTAF á ÍSLENSKU. Notaðu hreinan texta.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: history,
      config: { systemInstruction }
    });
    return response.text?.replace(/[*#]/g, '') || "Fyrirgefðu, ég átti erfitt með að svara þessu.";
  } catch (e) {
    return "Tengingarvilla! Ég kemst ekki í sambandi við heilann minn í bili.";
  }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string, context?: string): Promise<SpeechResult> => {
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
    return { text: text.replace(/[*#\-_>]/g, '').trim(), sources };
  } catch (e) { throw e; }
};