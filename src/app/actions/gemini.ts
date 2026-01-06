"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "@/lib/ai-context";

const API_KEY = process.env.GEMINI_API_KEY;

export async function generateContent(prompt: string) {
  if (!API_KEY) {
    return { error: "API Key not configured" };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Usamos gemini-flash-latest que ha demostrado ser estable y compatible
    // Inyectamos el system instruction para definir el comportamiento
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return { text };
  } catch (error) {
    console.error("Error generating content:", error);
    return { error: error instanceof Error ? error.message : "Failed to generate content" };
  }
}
