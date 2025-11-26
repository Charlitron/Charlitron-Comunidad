
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AnalysisReport, Answers, Candidate } from "../types";

const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// ... (Schema definition remains the same, it's robust enough for both) ...
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        aptitude: { type: Type.NUMBER },
        integrity: { type: Type.NUMBER },
        performancePotential: { type: Type.NUMBER },
        culturalFit: { type: Type.NUMBER },
        flightRisk: { type: Type.NUMBER },
      },
      required: ["aptitude", "integrity", "performancePotential", "culturalFit", "flightRisk"]
    },
    psychology: {
      type: Type.OBJECT,
      properties: {
        mbti: { type: Type.STRING },
        bigFive: {
          type: Type.OBJECT,
          properties: {
            openness: { type: Type.NUMBER },
            conscientiousness: { type: Type.NUMBER },
            extraversion: { type: Type.NUMBER },
            agreeableness: { type: Type.NUMBER },
            neuroticism: { type: Type.NUMBER },
          },
           required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
        },
        enneagram: { type: Type.STRING },
      },
      required: ["mbti", "bigFive"]
    },
    emotionalIntelligence: {
      type: Type.OBJECT,
      properties: {
        selfAwareness: { type: Type.NUMBER },
        selfRegulation: { type: Type.NUMBER },
        empathy: { type: Type.NUMBER },
        motivation: { type: Type.NUMBER },
        socialSkills: { type: Type.NUMBER },
      },
      required: ["selfAwareness", "selfRegulation", "empathy", "motivation", "socialSkills"]
    },
    coherence: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        narrativeAnalysis: { type: Type.STRING },
        honestyScore: { type: Type.NUMBER },
        honestyAnalysis: { type: Type.STRING },
        inconsistencies: { type: Type.ARRAY, items: { type: Type.STRING } },
        locusOfControl: { type: Type.STRING, enum: ["Internal", "External"] },
      },
      required: ["score", "narrativeAnalysis", "honestyScore", "honestyAnalysis", "inconsistencies", "locusOfControl"]
    },
    leadership: {
      type: Type.OBJECT,
      properties: {
        primaryStyle: { type: Type.STRING },
        secondaryStyle: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        developmentPlan: { type: Type.STRING },
      },
      required: ["primaryStyle", "strengths", "weaknesses", "developmentPlan"]
    },
    flags: {
      type: Type.OBJECT,
      properties: {
        redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
        greenFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["redFlags", "greenFlags"]
    },
    motivation: {
      type: Type.OBJECT,
      properties: {
        surfaceLevel: { type: Type.STRING },
        deepLevel: { type: Type.STRING },
        roleAlignment: { type: Type.BOOLEAN },
        retentionRiskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
      },
      required: ["surfaceLevel", "deepLevel", "roleAlignment", "retentionRiskLevel"]
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        decision: { type: Type.STRING, enum: ["HIRE", "VALIDATE", "REJECT"] },
        reason: { type: Type.STRING },
        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["decision", "reason", "nextSteps"]
    },
  },
};

const FALLBACK_REPORT: AnalysisReport = {
  scores: { aptitude: 50, integrity: 50, performancePotential: 50, culturalFit: 50, flightRisk: 50 },
  psychology: { 
    mbti: "N/A", 
    bigFive: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
    enneagram: "N/A"
  },
  emotionalIntelligence: { selfAwareness: 5, selfRegulation: 5, empathy: 5, motivation: 5, socialSkills: 5 },
  coherence: { 
    score: 50, narrativeAnalysis: "Análisis no disponible", honestyScore: 50, honestyAnalysis: "Info insuficiente", 
    inconsistencies: [], locusOfControl: "External" 
  },
  leadership: { primaryStyle: "N/A", strengths: [], weaknesses: [], developmentPlan: "N/A" },
  flags: { redFlags: [], greenFlags: [] },
  motivation: { surfaceLevel: "N/A", deepLevel: "N/A", roleAlignment: false, retentionRiskLevel: "Medium" },
  recommendation: { decision: "VALIDATE", reason: "Error de análisis técnico.", nextSteps: [] }
};

const urlToBase64 = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Extract only the base64 string (remove "data:audio/webm;base64,")
        resolve(base64data.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error converting audio to base64", e);
    return null;
  }
};

export const analyzeCandidate = async (
  candidate: Candidate,
  answers: Answers
): Promise<AnalysisReport> => {
  
  const analysisId = Date.now();
  const isOperative = candidate.type === 'OPERATIVE';

  const locationInfo = candidate.location 
    ? `UBICACIÓN CANDIDATO: Lat ${candidate.location.lat}, Lng ${candidate.location.lng}` 
    : "UBICACIÓN: No proporcionada";

  // Build Prompt with Multimodal Support
  const parts: any[] = [];
  
  const contextText = `
    ID ANÁLISIS: ${analysisId}
    TIPO DE PERFIL: ${isOperative ? "OPERATIVO (Guardia, Obrero, Limpieza)" : "ADMINISTRATIVO (Gerente, Jefe)"}
    CANDIDATO: ${candidate.name}
    PUESTO: ${candidate.role}
    ${locationInfo}

    ${isOperative ? 
      `INSTRUCCIONES MODO OPERATIVO:
       - Analiza TEXTO y AUDIO.
       - En AUDIOS: Detecta tono de voz (seguridad, duda, agresividad, honestidad).
       - Busca: Honestidad, Ganas de trabajar.
       - Riesgo de Fuga: Si menciona que vive lejos o tarda mucho en transporte, súbelo.
      ` 
      : 
      `INSTRUCCIONES MODO ADMINISTRATIVO:
       - Evalúa liderazgo estratégico, comunicación y coherencia narrativa.
      `
    }

    INSTRUCCIÓN GENERAL:
    - SALIDA JSON ESTRICTA EN ESPAÑOL (MÉXICO).
    - INFIERE PERSONALIDAD BASADO EN CONTENIDO Y TONO DE VOZ.
  `;
  
  parts.push({ text: contextText });

  for (const [key, value] of Object.entries(answers)) {
      parts.push({ text: `\nPREGUNTA: ${key}\n` });
      
      // Check if answer is an audio URL from Supabase
      if (typeof value === 'string' && value.includes('/storage/v1/object/public/audios/')) {
          const base64Audio = await urlToBase64(value);
          if (base64Audio) {
              parts.push({ text: "RESPUESTA (AUDIO - ANALIZAR TONO Y CONTENIDO):" });
              parts.push({ 
                  inlineData: { 
                      mimeType: "audio/webm", // Web browsers typically record in webm
                      data: base64Audio 
                  } 
              });
          } else {
              parts.push({ text: `RESPUESTA (Error cargando audio): ${value}` });
          }
      } else {
          const safeValue = value.replace(/"/g, "'");
          parts.push({ text: `RESPUESTA: "${safeValue}"` });
      }
  }

  try {
    if (!apiKey) throw new Error("API Key Missing");

    // Use Gemini 2.5 Flash for Multimodal (Audio) capabilities
    // or Gemini 3 Pro for complex text logic. 
    // Since Operative is likely to use audio, default to Flash for speed and multimodal.
    const modelName = isOperative ? "gemini-2.5-flash" : "gemini-3-pro-preview";

    const response = await ai.models.generateContent({
      model: modelName, 
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text || "{}";
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    let cleanJson = "{}";
    if (startIndex !== -1 && endIndex !== -1) {
        cleanJson = jsonText.substring(startIndex, endIndex + 1);
    }
    
    let result: AnalysisReport;
    try {
        result = JSON.parse(cleanJson);
    } catch (e) {
        return FALLBACK_REPORT;
    }

    return { ...FALLBACK_REPORT, ...result };

  } catch (error) {
    console.error("Gemini Failure:", error);
    return FALLBACK_REPORT;
  }
};
