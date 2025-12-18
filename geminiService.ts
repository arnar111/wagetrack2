
import { GoogleGenAI } from "@google/genai";
import { Shift, WageSummary } from "./types.ts";

export const getWageInsights = async (shifts: Shift[], summary: WageSummary) => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const prompt = `Greindu eftirfarandi gögn fyrir starfsmann hjá TAKK: Vaktir: ${JSON.stringify(shifts)}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna (engin * eða #), max 3 stuttar línur. Vertu hvetjandi.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });
    
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk að svo stöddu.";
  } catch (e) { 
    console.error("Wage insights error details:", e);
    return "Villa við að sækja greiningu. Athugaðu tengingu."; 
  }
};

export interface SpeechResult {
  text: string;
  sources?: { title: string; uri: string }[];
}

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string, context?: string): Promise<SpeechResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const hasTools = mode === 'search';
    
    const systemInstruction = `Þú ert sölusérfræðingur fyrir TAKK (sölufyrirtæki).
    
    Í hamnum CREATE: Búðu til nákvæmlega 5 stutta og kröftuga sölubúta (50-70 orð hver). 
    Hver bútur á að vera tilfinningaþrunginn og hvetja fólk til að styrkja ${project} NÚNA.
    
    Í hamnum SEARCH: Notaðu leit til að finna helstu sölupunkta fyrir ${project} á Íslandi.
    
    SKILYRÐI: 
    1. Svaraðu eingöngu á íslensku.
    2. Notaðu HREINAN texta. ALGERLEGA BANNNAÐ að nota markdown tákn (*, #, -, _, >).
    3. Notaðu bara venjulegar tölur (1., 2. osfrv) fyrir lista.
    4. Ekki nota neinar formatteringar.`;

    const userPrompt = mode === 'create' 
      ? `Búðu til 5 urgency sölubúta fyrir ${project}. ${context ? `Samhengi: ${context}` : ''}`
      : `Finndu og draslaðu saman helstu sölupunktum og upplýsingum um ${project} verkefnið.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: userPrompt }] }],
      config: { 
        systemInstruction,
        ...(hasTools ? { tools: [{ googleSearch: {} }] } : {})
      }
    });
    
    const text = response.text || "Ekkert svar barst frá gervigreindinni.";
    const cleanText = text.replace(/[*#\-_>]/g, '').trim();
    
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { text: cleanText, sources };
  } catch (e) { 
    console.error("Speech assistant error details:", e);
    throw new Error("Tenging rofnaði eða villa kom upp í API kalli.");
  }
};
