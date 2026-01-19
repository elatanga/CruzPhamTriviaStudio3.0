import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedCategory } from '../types';

export const generateTriviaContent = async (
  topic: string, 
  numCategories: number, 
  numRows: number,
  difficulty: string
): Promise<GeneratedCategory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Generate a Jeopardy-style trivia board about "${topic}".
  The overall target difficulty is "${difficulty}".
  I need exactly ${numCategories} categories.
  Each category must have exactly ${numRows} questions.
  
  CRITICAL: The questions within each category MUST scale in difficulty to match their position/points.
  - The first question in a category (lowest points) must be the easiest relative to the "${difficulty}" setting.
  - The last question in a category (highest points) must be the hardest relative to the "${difficulty}" setting.
  
  Return JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Category Name" },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    q: { type: Type.STRING, description: "Question text" },
                    a: { type: Type.STRING, description: "Answer text" }
                  },
                  required: ["q", "a"]
                }
              }
            },
            required: ["name", "questions"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeneratedCategory[];

  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};