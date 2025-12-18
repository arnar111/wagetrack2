
import { GoogleGenAI, Type } from "@google/genai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define and export SpeechResult interface for use in SpeechAssistant component
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
    
    // Accessing .text as a property as per @google/genai guidelines
    return response.text?.replace(/[*#]/g, '') || "Engin greining tiltæk að svo stöddu.";
  } catch (e) { 
    return "Villa við að sækja greiningu."; 
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  try {
    const prompt = `Analyze these sales shifts and goals for a worker at TAKK. 
    Shifts: ${JSON.stringify(shifts.slice(0, 15))}
    Current Monthly Sales: ${summary.totalSales}
    Monthly Goal: ${goals.monthly}
    
    Task: Provide a smart trajectory analysis. 
    1. Predict end-of-month earnings based on trend (not just average).
    2. Determine trend (up/down/stable).
    3. Give 1 sentence of strategic advice in ICELANDIC.
    4. Give a short motivational quote in ICELANDIC.
    
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
            trend: { type: Type.STRING, description: "'up', 'down', or 'stable'" },
            smartAdvice: { type: Type.STRING },
            motivationalQuote: { type: Type.STRING }
          },
          required: ["projectedEarnings", "trend", "smartAdvice", "motivationalQuote"]
        }
      }
    });

    // Safely parse JSON from response.text property
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Smart Analysis Error:", e);
    return {
      projectedEarnings: summary.totalSales * 1.2,
      trend: 'stable',
      smartAdvice: "Haltu áfram að skrá gögn til að fá nákvæmari AI greiningu.",
      motivationalQuote: "Allur árangur byrjar á ákvörðun um að reyna."
    };
  }
};

export const getAIProjectComparison = async (sales: Sale[]) => {
  try {
    const prompt = `Analyze these sales by project: ${JSON.stringify(sales)}. 
    Compare which charities/projects are performing best and why.
    Identify the "Hero Project" (best performer) and the "Opportunity Project" (most potential).
    Respond in ICELANDIC, clean text, max 150 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    // Accessing .text as a property and cleaning it
    return response.text?.replace(/[*#]/g, '') || "Engin samanburðargreining tiltæk.";
  } catch (e) {
    return "Villa við að bera saman verkefni.";
  }
};

export const chatWithAddi = async (history: { role: string, parts: { text: string }[] }[]) => {
  try {
    const systemInstruction = `Þú ert Addi, vinalegur og klár gervigreindar-aðstoðarmaður fyrir starfsmenn TAKK. 
    Appið heitir WageTrack Pro. 
    Verkefni þitt er að hjálpa notendum að skilja hvernig appið virkar, útskýra launaútreikninga og hvetja þá í sölunni.
    ALLTAF svara á ÍSLENSKU. Notaðu hreinan texta.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: history,
      config: { systemInstruction }
    });

    // Accessing .text as a property
    return response.text?.replace(/[*#]/g, '') || "Fyrirgefðu, ég átti erfitt með að svara þessu.";
  } catch (e) {
    return "Tengingarvilla! Ég kemst ekki í sambandi við heilann minn í bili.";
  }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string, context?: string): Promise<SpeechResult> => {
  try {
    const hasTools = mode === 'search';
    const systemInstruction = `Þú ert sölusérfræðingur fyrir TAKK. Svaraðu á íslensku. Hreinn texti. Engin markdown.`;
    const userPrompt = mode === 'create' 
      ? `Búðu til 5 urgency sölubúta fyrir ${project}. ${context || ''}`
      : `Finndu helstu sölupunkta fyrir ${project}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: userPrompt }] }],
      config: { 
        systemInstruction,
        ...(hasTools ? { tools: [{ googleSearch: {} }] } : {})
      }
    });
    
    // Accessing .text property as recommended
    const text = response.text || "";
    const cleanText = text.replace(/[*#\-_>]/g, '').trim();
    const sources: { title: string; uri: string }[] = [];
    
    // Extracting grounding information for Google Search results
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({ 
          title: chunk.web.title || "Vefheimild", 
          uri: chunk.web.uri 
        });
      }
    });

    return { text: cleanText, sources };
  } catch (e) { throw e; }
};
