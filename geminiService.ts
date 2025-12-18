
import { GoogleGenAI, Type } from "@google/genai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

/**
 * Robust helper to initialize the Google GenAI client.
 * Looks for the key in process.env.API_KEY (Vite define) or window-level fallback.
 */
const getAiClient = () => {
  // Try multiple sources for the API key
  const apiKey = process.env.API_KEY || (window as any)._GEMINI_KEY;
  
  if (apiKey && apiKey !== 'undefined' && apiKey !== '' && !apiKey.includes('%VITE')) {
    try {
      // Re-initialize for every call if needed to avoid stale instances
      return new GoogleGenAI({ apiKey });
    } catch (error) {
      console.error("❌ Error initializing GoogleGenAI client:", error);
      return null;
    }
  } else {
    console.error("❌ Gemini API Key is missing or invalid in the environment.");
    return null;
  }
};

export interface SpeechResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const getWageInsights = async (shifts: Shift[], summary: WageSummary): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Vantar API lykil fyrir innsýn.";

  try {
    const prompt = `Greindu eftirfarandi gögn fyrir starfsmann hjá TAKK: Vaktir: ${JSON.stringify(shifts)}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna (engin * eða #), max 3 stuttar línur. Vertu hvetjandi.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk að svo stöddu.";
  } catch (e) {
    console.error("Gemini Error (getWageInsights):", e);
    return "Villa við að sækja greiningu.";
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  const fallback = {
    projectedEarnings: 0,
    trend: "stable",
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
    console.error("Gemini Error (getSmartDashboardAnalysis):", e);
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
    console.error("Gemini Error (getAIProjectComparison):", e);
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
    console.error("Gemini Error (chatWithAddi):", e);
    return "Tengingarvilla! Ég kemst ekki í sambandi við heilann minn í bili.";
  }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string, context?: string): Promise<SpeechResult> => {
  const fallback = { text: "Vantar lykil.", sources: [] };
  const ai = getAiClient();
  if (!ai) return fallback;

  try {
    const systemInstruction = `Þú ert reyndur sölusérfræðingur og ræðuhönnuður fyrir TAKK. 
    Þegar þú býrð til ræðubúta (ræðubútar), skaltu tryggja að þeir séu hvetjandi, sannfærandi og innihaldi mikilvægar upplýsingar um verkefnið ${project}. 
    MIKILVÆGT: Þú mátt ALDREI nota tölur um persónulegan sölumarkmið eða árangur starfsmannsins sjálfs í ræðunni. Einbeittu þér eingöngu að málefninu sjálfu.
    Svaraðu alltaf á ÍSLENSKU. Notaðu eingöngu hreinan texta án sérstakra tákna (ekkert * eða #).`;

    const userPrompt = mode === 'create' 
      ? `Skrifaðu ítarlegan og sannfærandi ræðubút fyrir verkefnið ${project}. 
         Ræðubúturinn verður að vera að minnsta kosti 70 orð að lengd. 
         Notaðu þekkingu þína á verkefninu sem grunn. 
         Ekki nota neina tölfræði um sölu eða árangur starfsmannsins.
         Auka samhengi (valfrjálst): ${context || ''}`
      : `Finndu helstu sölupunkta og mikilvægustu staðreyndirnar um verkefnið ${project}.`;

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
      if (chunk.web?.uri) {
        sources.push({ 
          title: chunk.web.title || "Vefheimild", 
          uri: chunk.web.uri 
        });
      }
    });

    return { 
      text: text.replace(/[*#\-_>]/g, '').trim() || fallback.text, 
      sources 
    };
  } catch (e) {
    console.error("Gemini Error (getSpeechAssistantResponse):", e);
    return fallback;
  }
};
