
import { GoogleGenAI, Type } from "@google/genai";
import { Shift, WageSummary, Goals, Sale, User } from "./types.ts";

/**
 * Initializes the GoogleGenAI client exclusively using the API_KEY from the environment.
 */
const getAiClient = () => {
  if (process.env.API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return null;
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
    console.error("Gemini Error:", e);
    return "Villa við að sækja greiningu.";
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  const fallback = { projectedEarnings: 0, trend: "stable", smartAdvice: "Skráðu vaktir til að sjá greiningu.", motivationalQuote: "Gangi þér vel!" };
  const ai = getAiClient();
  if (!ai) return fallback;
  try {
    const prompt = `Analyze sales trends for a TAKK employee. Current Sales: ${summary.totalSales}. Goal: ${goals.monthly}. Predict trajectory. advice in ICELANDIC. motivational quote in ICELANDIC. JSON only.`;
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

export const getManagerAIGuidance = async (teamStats: any) => {
  const ai = getAiClient();
  if (!ai) return { topOpportunity: "Vantar API lykil.", agentToWatch: "Vantar API lykil." };
  try {
    const prompt = `Analyze team sales data: ${JSON.stringify(teamStats)}. Identify the top project opportunity and one agent who is trending up (agent to watch). Svaraðu á ÍSLENSKU, hreinn texti, stutt og hnitmiðað. JSON only.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topOpportunity: { type: Type.STRING },
            agentToWatch: { type: Type.STRING }
          },
          required: ["topOpportunity", "agentToWatch"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { topOpportunity: "Gagna vantar.", agentToWatch: "Gagna vantar." };
  }
};

export const getAIProjectComparison = async (sales: Sale[]) => {
  const ai = getAiClient();
  if (!ai) return "Vantar API lykil fyrir samanburð.";
  try {
    const prompt = `Compare projects based on sales: ${JSON.stringify(sales)}. ICELANDIC, clean text.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk.";
  } catch (e) {
    return "Villa við greiningu.";
  }
};

export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  const ai = getAiClient();
  if (!ai) return "Ég er ekki með tengingu (vantar API lykil).";
  try {
    const systemInstruction = `Þú ert Addi, aðstoðarmaður fyrir TAKK. Svaraðu á ÍSLENSKU. Notaðu hreinan texta.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: { systemInstruction }
    });
    return response.text?.replace(/[*#]/g, '') || "Fyrirgefðu, ég átti erfitt með að svara þessu.";
  } catch (e) {
    return "Tengingarvilla!";
  }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string, context?: string): Promise<SpeechResult> => {
  const fallback = { text: "Vantar lykil.", sources: [] };
  const ai = getAiClient();
  if (!ai) return fallback;
  try {
    const systemInstruction = `Sölusérfræðingur fyrir TAKK. Ekki nota tölur um árangur starfsmanns. Svaraðu á ÍSLENSKU. Hreinn texti.`;
    const userPrompt = mode === 'create' ? `Skrifaðu ræðu fyrir ${project}. 70 orð minnst.` : `Upplýsingar um ${project}.`;
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
    
    // Extracted URLs from groundingChunks as per Google Search grounding rules.
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({ title: chunk.web.title || "Vefheimild", uri: chunk.web.uri });
      }
    });
    
    return { text: text.replace(/[*#\-_>]/g, '').trim() || fallback.text, sources };
  } catch (e) {
    return fallback;
  }
};
