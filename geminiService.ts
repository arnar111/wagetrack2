
import { GoogleGenAI, Type } from "@google/genai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

/**
 * Sækir AI client með áherslu á forgangsröðun lykla.
 * Fylgir ströngum leiðbeiningum um að nota process.env.API_KEY eingöngu.
 */
const getAiClient = () => {
  // Fix: Strictly follow guidelines to obtain API key from process.env.API_KEY exclusively.
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    console.warn("DEBUG: No valid API key found in process.env.API_KEY");
    return null;
  }
  
  // Fix: Initialize GoogleGenAI with a named parameter object and process.env.API_KEY directly.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = getAiClient();
  if (!ai) return "Bíður eftir lykli... (Gakktu úr skugga um að lykillinn sé rétt settur í Netlify eða Secrets)";
  try {
    const prompt = `Greindu eftirfarandi gögn fyrir starfsmann hjá TAKK: Vaktir: ${JSON.stringify(shifts)}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna (engin * eða #), max 3 stuttar línur. Vertu hvetjandi.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    // Fix: Use .text property directly (not a method).
    return response.text?.replace(/[*#]/g, '') || "Greining fannst ekki.";
  } catch (e) {
    return "Villa við tengingu.";
  }
};

/**
 * Greining fyrir stjórnendur á árangri góðgerðarfélaga.
 * Ber saman söfnun vs. launakostnað (2724.88 ISK/klst).
 */
export const getManagerCommandAnalysis = async (charityData: any) => {
  const ai = getAiClient();
  if (!ai) return { strategicAdvice: "Bíður eftir lykli... (Gakktu úr skugga um að lykillinn sé rétt settur í Netlify eða Secrets)", topProject: "Óvíst" };
  try {
    const prompt = `Berðu saman árangur þessara góðgerðarfélaga: ${JSON.stringify(charityData)}. 
    Skoðaðu Árangur (Heildarsöfnun), Skilvirkni (isk_per_hour) og Hagnaður (profit).
    Hagnaður er reiknaður: (Söfnun - (Virkir Tímar * 2724.88)).
    Segðu stjórnanda hvaða félag gefur besta arðinn og hvar er hægt að nýta mannskapinn betur. 
    Svaraðu á ÍSLENSKU. JSON only. Keys: topProject (Nafn félags), strategicAdvice (Greining og ráðlegging).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
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
    // Fix: Access .text property directly and strip markdown for safe JSON parsing.
    const text = stripMarkdown(response.text || "{}");
    return JSON.parse(text);
  } catch (e) {
    return { strategicAdvice: "AI greining tókst ekki í augnablikinu.", topProject: "Gagna vantar" };
  }
};

export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  const ai = getAiClient();
  if (!ai) return "Bíður eftir lykli... (Gakktu úr skugga um að lykillinn sé rétt settur í Netlify eða Secrets)";
  try {
    const systemInstruction = `Þú ert Addi, aðstoðarmaður hjá TAKK. Svaraðu alltaf á ÍSLENSKU á hvetjandi hátt. Notaðu hreinan texta.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: { systemInstruction }
    });
    // Fix: Use .text property directly.
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
      contents: userPrompt,
      config: { 
        systemInstruction,
        ...(mode === 'search' ? { tools: [{ googleSearch: {} }] } : {})
      }
    });
    
    const sources: { title: string; uri: string }[] = [];
    // Fix: Properly access grounding metadata following the schema returned by the API
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({ title: chunk.web.title || "Heimild", uri: chunk.web.uri });
      }
    });
    
    // Fix: Access .text property directly.
    return { text: response.text?.replace(/[*#\-_>]/g, '').trim() || fallback.text, sources };
  } catch (e) {
    return fallback;
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  const ai = getAiClient();
  if (!ai) return { smartAdvice: "Bíður efter lykli...", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: summary.totalSales };
  try {
    const prompt = `Greindu árangur starfsmanns hjá TAKK: Markmið: ${JSON.stringify(goals)}, Heildarsala: ${summary.totalSales}. Svaraðu í JSON formi á ÍSLENSKU. Keys: smartAdvice (stutt ráð), trend ('up' eða 'down'), motivationalQuote (stutt tilvitnun), projectedEarnings (tala).`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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
    // Fix: Use .text property and ensure safe JSON parsing by stripping markdown.
    const text = stripMarkdown(response.text || "{}");
    return JSON.parse(text);
  } catch (e) {
    return { smartAdvice: "Gat ekki greint gögn.", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: summary.totalSales };
  }
};

export const getAIProjectComparison = async (sales: Sale[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Bíður eftir lykli...";
  try {
    const prompt = `Berðu saman sölu á mismunandi verkefnum: ${JSON.stringify(sales.slice(0, 50))}. Svaraðu á ÍSLENSKU með stuttri greiningu (max 3 línur).`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    // Fix: Use .text property directly.
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk.";
  } catch (e) {
    return "Villa við AI samanburð.";
  }
};