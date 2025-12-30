import { GoogleGenerativeAI } from "@google/generative-ai";
import { Shift, WageSummary, Goals, Sale } from "./types.ts";

/**
 * Safely retrieves the API key without crashing the app.
 */
const getApiKey = (): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn("Could not read environment variables safely.");
  }
  return "";
};

const getModel = (modelName: string = "gemini-3-flash-preview") => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ Gemini API Key is missing.");
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

const stripMarkdown = (text: string) => {
  return text.replace(/```json\n?|```/g, '').trim();
};

export interface SpeechResult {
  text: string;
  sources: { title: string; uri: string }[];
}

// --- NEW FUNCTION FOR MORRI AI ---
export const getSalesCoachAdvice = async (hurdles: string[]): Promise<string> => {
  const model = getModel("gemini-3-flash-preview");
  if (!model) return "Bíður eftir lykli...";

  try {
    const prompt = `
      Ég er sölumaður í síma (fjáröflun). Í dag lenti ég í þessum hindrunum: ${hurdles.join(', ')}.
      
      Greindu daginn minn stuttlega og gefðu mér 3 hnitmiðuð, öflug ráð (bullet points) um hvernig ég tækla þetta betur á morgun.
      
      Reglur:
      1. Vertu stuttorður og hvetjandi (eins og reyndur sölustjóri sem heitir Morri).
      2. Svaraðu á ÍSLENSKU.
      3. Engin inngangur, bara ráðin.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().replace(/[*#]/g, '') || "Gat ekki greint gögnin.";
  } catch (e) {
    return "Villa við tengingu við MorriAI.";
  }
};

export const getWageInsights = async (shifts: Shift[], summary: WageSummary): Promise<string> => {
  const model = getModel("gemini-3-flash-preview");
  if (!model) return "Bíður eftir lykli...";
  
  try {
    const prompt = `Greindu eftirfarandi gögn fyrir starfsmann hjá TAKK: Vaktir: ${shifts.length}, Samtals klukkustundir: ${summary.totalHours}, Samtals sala: ${summary.totalSales}. Svaraðu á ÍSLENSKU, notaðu hreinan texta án allra tákna, max 3 stuttar línur. Vertu hvetjandi.`;
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/[*#]/g, '') || "Greining fannst ekki.";
  } catch (e) {
    return "Villa við tengingu.";
  }
};

export const getManagerCommandAnalysis = async (charityData: any) => {
  const model = getModel("gemini-3-pro-preview");
  if (!model) return { strategicAdvice: "Bíður eftir lykli...", topProject: "Óvíst" };

  try {
    const prompt = `Berðu saman árangur þessara góðgerðarfélaga: ${JSON.stringify(charityData)}. 
    Skoðaðu Árangur (Heildarsöfnun), Skilvirkni (isk_per_hour) og Hagnaður (profit).
    Segðu stjórnanda hvaða félag gefur besta arðinn og hvar er hægt að nýta mannskapinn betur. 
    Svaraðu á ÍSLENSKU. Return JSON only. Format: {"topProject": "Nafn", "strategicAdvice": "Ráð"}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const text = stripMarkdown(result.response.text() || "{}");
    return JSON.parse(text);
  } catch (e) {
    return { strategicAdvice: "AI greining tókst ekki.", topProject: "Gagna vantar" };
  }
};

export const getSpeechAssistantResponse = async (mode: 'create' | 'search', project: string): Promise<SpeechResult> => {
  const model = getModel("gemini-3-flash-preview");
  const fallback = { text: "AI lykill vantar.", sources: [] };
  if (!model) return fallback;

  try {
    const systemInstruction = `Þú ert reyndur sölumaður fyrir góðgerðarfélög. Þitt verkefni er að skrifa sannfærandi texta til að selja mánaðarlegar styrktarveitingar.`;
    
    let userPrompt = "";
    if (mode === 'create') {
        userPrompt = `Verkefni: Skrifaðu söluræðu fyrir: ${project}.
        REGLUR:
        1. Lengd: Nákvæmlega 70-100 orð.
        2. Innihald: Talaðu eingöngu um mikilvægi ${project} og hvernig peningarnir hjálpa.
        3. BANNAÐ: Ekki minnast á "Takk ehf".
        4. Tónn: Hvetjandi, tilfinningaríkur en faglegur.
        5. Tungumál: Íslenska.
        Textinn á að vera tilbúinn til lesturs í síma.`;
    } else {
        userPrompt = `Hvað gerir ${project}? Gefðu mér stutt yfirlit (bullet points) fyrir sölumann sem þarf að þekkja starfsemina. Svaraðu á íslensku.`;
    }
    
    const result = await model.generateContent([systemInstruction, userPrompt]);
    return { text: result.response.text().replace(/[*#\-_>]/g, '').trim(), sources: [] };
  } catch (e) {
    return fallback;
  }
};

export const getSmartDashboardAnalysis = async (shifts: Shift[], goals: Goals, summary: WageSummary) => {
  const model = getModel("gemini-3-flash-preview");
  if (!model) return { smartAdvice: "Bíður eftir lykli...", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: summary.totalSales };

  try {
    const prompt = `Greindu árangur: Markmið: ${JSON.stringify(goals)}, Sala: ${summary.totalSales}. 
    Svaraðu í JSON formi á ÍSLENSKU. Format: {"smartAdvice": "ráð", "trend": "up/down", "motivationalQuote": "tilvitnun", "projectedEarnings": 1000}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const text = stripMarkdown(result.response.text() || "{}");
    return JSON.parse(text);
  } catch (e) {
    return { smartAdvice: "Gat ekki greint gögn.", trend: 'stable', motivationalQuote: "Haltu áfram!", projectedEarnings: summary.totalSales };
  }
};

export const getAIProjectComparison = async (sales: Sale[]): Promise<string> => {
  const model = getModel("gemini-3-flash-preview");
  if (!model) return "Bíður eftir lykli...";

  const summary: Record<string, { total: number, count: number }> = {};
  
  sales.forEach(sale => {
    if (!summary[sale.project]) {
        summary[sale.project] = { total: 0, count: 0 };
    }
    summary[sale.project].total += sale.amount;
    summary[sale.project].count += 1;
  });

  try {
    const prompt = `Hér eru mínar rauntölur fyrir söfnun (Góðgerðarfélög): ${JSON.stringify(summary)}.
    Greindu þessar tölur beint. Svaraðu á ÍSLENSKU. Max 150 orð.`;

    const result = await model.generateContent(prompt);
    return result.response.text().replace(/[*#]/g, '') || "Engin greining.";
  } catch (e) {
    return "Villa við AI samanburð.";
  }
};
