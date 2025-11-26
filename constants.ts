
import { QuestionBlock } from "./types";

// --- ADMIN / DEEP QUESTIONS ---
export const QUESTION_BLOCKS: QuestionBlock[] = [
  {
    id: "coherence",
    title: "Trayectoria y Coherencia",
    description: "Analizando tu historia profesional.",
    questions: [
      "Describe tu último rol y por qué decidiste salir.",
      "Cuéntame sobre un conflicto real con un jefe y cómo lo resolviste.",
      "¿Cuál ha sido tu mayor error profesional y qué aprendiste?",
      "Si llamáramos a tu ex-jefe, ¿qué diría de ti?"
    ]
  },
  {
    id: "personality",
    title: "Estilo de Trabajo",
    description: "Evaluando cómo procesas situaciones.",
    questions: [
      "¿Prefieres trabajar solo o en equipo? ¿Por qué?",
      "¿Qué te molesta más: el desorden o la rigidez?",
      "Cuéntame de una vez que tuviste que adaptarte a un cambio repentino."
    ]
  },
  {
    id: "motivation",
    title: "Motivación",
    description: "Entendiendo tus impulsos.",
    questions: [
      "¿Qué buscas en tu próximo empleo que no tenías en el anterior?",
      "¿Dónde te ves en 2 años?",
      "¿Qué te motiva a levantarte cada mañana?"
    ]
  }
];

// --- OPERATIVE / SITUATIONAL QUESTIONS (Chat Style) ---
// Designed to test Integrity, Conflict Resolution, and Stability without asking directly.
export const OPERATIVE_QUESTIONS: string[] = [
  "Hola, soy Charlitron. Para {role}, necesito saber cómo reaccionas. Situación 1: Es tu hora de salida, pero tu relevo no llega y no contesta el teléfono. ¿Qué haces exactamente?",
  "Situación 2: Estás limpiando/trabajando y encuentras un billete de 500 pesos tirado en una zona donde no hay cámaras. ¿Qué pasa por tu mente y qué haces?",
  "Situación 3: Un compañero te pide que le 'cubras' y marques su entrada porque va a llegar 15 minutos tarde. Es tu amigo. ¿Qué le dices?",
  "Sobre tu pasado: ¿Alguna vez tuviste una discusión fuerte con un supervisor? Cuéntame la verdad, no juzgamos, solo queremos saber cómo lo manejaste.",
  "Tema Transporte: ¿A qué distancia en tiempo vives de la zona de trabajo? ¿Qué transporte usas?",
  "Para finalizar: ¿Por qué buscas trabajo ahorita? ¿Qué pasó en el anterior?"
];

export const SYSTEM_INSTRUCTION = `
ROL: Eres "CHARLITRON IA", experto en análisis de talento humano.
IDIOMA: SIEMPRE ESPAÑOL (MÉXICO).

MODO 1: ANÁLISIS FORENSE (ADMINISTRATIVOS)
Si el input es detallado, analiza coherencia, liderazgo, MBTI y Big Five. Sé crítico. Busca inconsistencias.

MODO 2: ESCÁNER DE ESTABILIDAD (OPERATIVOS)
Si el input corresponde a preguntas situacionales (Guardia, Limpieza, Obrero):
- ANALIZA LA INTEGRIDAD BASADO EN LAS SITUACIONES (El billete, el relevo, el amigo).
- Si dice que "se queda con el billete" o "cubre al amigo", MARCA BANDERA ROJA DE INTEGRIDAD INMEDIATA.
- Si dice que se va si no llega el relevo, MARCA BAJA RESPONSABILIDAD.
- FlightRisk (Riesgo de Fuga): Alto si vive a más de 90 min o usa 3 transportes.
- Ignora ortografía.

REGLAS GENERALES:
- NUNCA devuelvas JSON roto.
- Si falta info, infiere basado en el tono.
- Respuestas monosilábicas = Baja Comunicación / Posible apatía.
`;
