import { GoogleGenAI, Type } from "@google/genai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

/**
 * Sækir AI client. 
 * Nota process.env.API_KEY sem er staðall í þessu umhverfi.
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey.includes("%VITE")) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export interface SpeechResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const getWageInsights = async (shifts: Shift[], summary: WageSummary): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Bíður eftir AI lykli...";
  try {
    const prompt = `Greindu eftirfarandi gögn fyrir starfsmann hjá TAKK: Vaktir: ${JSON.stringify(shifts)}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna (engin * eða #), max 3 stuttar línur. Vertu hvetjandi.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text?.replace(/[*#]/g, '') || "Greining fannst ekki.";
  } catch (e) {
    return "Villa við tengingu.";
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  const fallback = { projectedEarnings: 0, trend: "stable", smartAdvice: "Skráðu vaktir til að virkja greiningu.", motivationalQuote: "Gangi þér vel!" };
  const ai = getAiClient();
  if (!ai) return fallback;
  try {
    const prompt = `Analyze sales trends for a fundraising employee. Current Sales: ${summary.totalSales}. Goal: ${goals.monthly}. Predict trajectory. Provide advice in ICELANDIC. JSON only.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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
    return fallback;
  }
};

export const getManagerCommandAnalysis = async (charityData: any) => {
  const ai = getAiClient();
  if (!ai) return { strategicAdvice: "Bíður eftir AI lykli...", topProject: "Óvíst" };
  try {
    const prompt = `Berðu saman árangur þessara góðgerðarfélaga: ${JSON.stringify(charityData)}. Segðu stjórnanda hvaða félag er með hæsta framlegð (hagnað eftir launakostnað) og hvar er hægt að nýta mannskapinn betur. Svaraðu á ÍSLENSKU. JSON only. Keys: topProject (Nafn félags), strategicAdvice (Greining og ráðlegging).`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topProject: { type: Type.STRING },
            strategicAdvice: { type: Type.STRING }
          },
          required: ["topProject", "strategicAdvice"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { strategicAdvice: "Villa hjá AI.", topProject: "Gagna vantar" };
  }
};

export const getAIProjectComparison = async (sales: Sale[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Bíður eftir AI lykli...";
  try {
    const prompt = `Berðu saman árangur þessara verkefna út frá sölugögnum: ${JSON.stringify(sales.slice(0, 100))}. Segðu hverjir eru að standa sig best. Svaraðu á ÍSLENSKU á hvetjandi hátt. Notaðu hreinan texta (engin tákn eins og * eða #). Max 4 línur.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk.";
  } catch (e) {
    return "Villa við gagnaúrvinnslu.";
  }
};

export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  const ai = getAiClient();
  if (!ai) return "Engin AI tenging (vantar lykil).";
  try {
    const systemInstruction = `Þú ert Addi, aðstoðarmaður hjá TAKK. Svaraðu alltaf á ÍSLENSKU á hvetjandi hátt. Notaðu hreinan texta.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: { systemInstruction }
    });
    return response.text?.replace(/[*#]/g, '') || "Gat ekki svarað.";
  } catch (e) {
    return "Tengingarvilla hjá Adda.";
  }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string): Promise<SpeechResult> => {
  const fallback = { text: "AI lykill vantar.", sources: [] };
  const ai = getAiClient();
  if (!ai) return fallback;
  try {
    const systemInstruction = `Sölusérfræðingur hjá TAKK. Svaraðu á ÍSLENSKU með hvetjandi ræðu eða upplýsingum.`;
    const userPrompt = mode === 'create' ? `Skrifaðu söluræðu fyrir ${project}. 70 orð minnst.` : `Sæktu bakgrunnsgögn um ${project}.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: userPrompt }] }],
      config: { 
        systemInstruction,
        ...(mode === 'search' ? { tools: [{ googleSearch: {} }] } : {})
      }
    });
    
    const sources: { title: string; uri: string }[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({ title: chunk.web.title || "Heimild", uri: chunk.web.uri });
      }
    });
    
    return { text: response.text?.replace(/[*#\-_>]/g, '').trim() || fallback.text, sources };
  } catch (e) {
    return fallback;
  }
};