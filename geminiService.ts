
import { GoogleGenAI } from "@google/genai";
import { Shift, WageSummary } from "./types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const getWageInsights = async (shifts: Shift[], summary: WageSummary) => {
  const prompt = `Greindu: Vaktir: ${JSON.stringify(shifts)}, Klst: ${summary.totalHours}, Sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, hreinum texta, max 3 stuttar línur. Engin tákn eins og * eða #.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[*#]/g, '') || "Engin greining.";
  } catch (e) { return "Villa við greiningu."; }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string, context?: string) => {
  const tools = mode === 'search' ? [{ googleSearch: {} }] : [];
  
  const systemInstruction = `
    Þú ert Speech Architect fyrir LaunaApp Takk.
    
    HAMUR: CREATE (Urgency)
    - Búðu til nákvæmlega 5 kröftuga sölubúta (ræðubúta) sem leggja áherslu á mikilvægi þess að styrkja NÚNA.
    - Hver bútur á að vera um 50-75 orð að lengd.
    - Þeir eiga að vera innilegir, sannfærandi og tilfinningaþrungnir.
    - EKKI búa til inngang, kveðju eða útskýringar. Bara 5 tölusettir punktar.
    
    HAMUR: SEARCH (Original)
    - Finndu raunverulegt söluhitrit eða handrit fyrir ${project}.
    - Birtu það í sinni hreinu mynd (Hook, Story, Ask).
    
    REGLUR:
    1. ALGERLEGA BANNNAÐ að nota Markdown tákn (*, #, -, _, >).
    2. Svaraðu á hreinum texta á Íslensku.
    3. Spyrðu alltaf "Viltu bæta launamarkmiðum við?" í lokin.
  `;

  const prompt = mode === 'create' 
    ? `Búðu til 5 urgency sölubúta (50-75 orð hver) fyrir ${project}. Bara bútanir.` 
    : `Finndu original söluræðu fyrir ${project} á Íslandi.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${context ? `Samhengi: ${context}\n` : ''}${prompt}`,
      config: { systemInstruction, tools, thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text?.replace(/[*#\-_>]/g, '').trim() || "Fann ekki svar.";
  } catch (e) { return "Villa kom upp."; }
};
