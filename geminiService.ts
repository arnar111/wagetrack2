
import { GoogleGenAI, Type } from "@google/genai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

/**
 * Sækir AI client. 
 * Samkvæmt kerfisreglum er lykillinn sóttur EXCLUSIVELY úr process.env.API_KEY.
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
  if (!ai) return "Bíður eftir AI tengingu...";
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

/**
 * Greining fyrir stjórnendur á árangri góðgerðarfélaga.
 * Gemini ber saman hagnað (sala - launakostnaður) og skilvirkni.
 */
export const getManagerCommandAnalysis = async (charityData: any) => {
  const ai = getAiClient();
  if (!ai) return { strategicAdvice: "Bíður eftir AI lykli...", topProject: "Óvíst" };
  try {
    const prompt = `Berðu saman árangur þessara góðgerðarfélaga: ${JSON.stringify(charityData)}. 
    Skoðaðu hagnað (profit), meðalgjöf og skilvirkni (isk_per_hour).
    Segðu stjórnanda hvaða félag er með hæsta hagnaðinn eftir launakostnað (2724.88 ISK/klst) og hvar er hægt að nýta mannskapinn betur. 
    Svaraðu á ÍSLENSKU. JSON only. Keys: topProject (Nafn félags), strategicAdvice (Greining og ráðlegging).`;

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
    return { strategicAdvice: "AI greining tókst ekki í augnablikinu.", topProject: "Gagna vantar" };
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

// Fix: Added missing export for Dashboard smart analysis
export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  const ai = getAiClient();
  if (!ai) return { smartAdvice: "Bíður eftir AI...", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: summary.totalSales };
  try {
    const prompt = `Greindu árangur starfsmanns hjá TAKK: Vaktir: ${JSON.stringify(shifts)}, Markmið: ${JSON.stringify(goals)}, Heildarsala: ${summary.totalSales}. Svaraðu í JSON formi á ÍSLENSKU. Keys: smartAdvice (stutt ráð), trend ('up' eða 'down'), motivationalQuote (stutt tilvitnun), projectedEarnings (tala).`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            smartAdvice: { type: Type.STRING },
            trend: { type: Type.STRING },
            motivationalQuote: { type: Type.STRING },
            projectedEarnings: { type: Type.NUMBER }
          },
          required: ["smartAdvice", "trend", "motivationalQuote", "projectedEarnings"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { smartAdvice: "Gat ekki greint gögn.", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: summary.totalSales };
  }
};

// Fix: Added missing export for ProjectInsights AI comparison
export const getAIProjectComparison = async (sales: Sale[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Bíður eftir AI...";
  try {
    const prompt = `Berðu saman sölu á mismunandi verkefnum: ${JSON.stringify(sales)}. Svaraðu á ÍSLENSKU með stuttri greiningu (max 3 línur). Slepptu öllum sérstökum táknum eins og * eða #.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk.";
  } catch (e) {
    return "Villa við að sækja AI samanburð.";
  }
};
