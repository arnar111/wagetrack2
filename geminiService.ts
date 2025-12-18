
import { GoogleGenAI } from "@google/genai";
import { Shift, WageSummary } from "./types.ts";

export const getWageInsights = async (shifts: Shift[], summary: WageSummary) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Greindu eftirfarandi gögn fyrir starfsmann: Vaktir: ${JSON.stringify(shifts)}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna (engin * eða #), max 3 stuttar línur.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk að svo stöddu.";
  } catch (e) { 
    console.error("Wage insights error:", e);
    return "Villa við að sækja greiningu."; 
  }
};

export interface SpeechResult {
  text: string;
  sources?: { title: string; uri: string }[];
}

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string, context?: string): Promise<SpeechResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const hasTools = mode === 'search';
  
  const systemInstruction = `Þú ert sölusérfræðingur fyrir TAKK. 
  Í hamnum CREATE: Búðu til 5 stutta og hvetjandi sölubúta (50-70 orð hver) sem leggja áherslu á af hverju fólk ætti að styrkja ${project} NÚNA. 
  Í hamnum SEARCH: Finndu upplýsingar um helstu áherslur og sölupunkta fyrir ${project}. 
  SKILYRÐI: Svaraðu á hreinum texta á íslensku. EKKI nota markdown tákn eins og *, #, -, _ eða >. Notaðu bara tölustafi fyrir lista.`;

  const userPrompt = mode === 'create' 
    ? `Búðu til 5 kröftuga sölubúta fyrir ${project}. ${context ? `Hafðu þetta samhengi í huga: ${context}` : ''}`
    : `Finndu sölupunkta og bakgrunn fyrir verkefnið ${project}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: { 
        systemInstruction,
        ...(hasTools ? { tools: [{ googleSearch: {} }] } : {})
      }
    });
    
    const text = response.text || "Ekkert svar fannst.";
    const cleanText = text.replace(/[*#\-_>]/g, '').trim();
    
    // Extract sources if available (Google Search Grounding)
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
    console.error("Speech assistant error:", e);
    throw e;
  }
};
