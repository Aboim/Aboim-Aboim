import { GoogleGenAI, Type } from "@google/genai";
import { PredefinedCategory } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const parseAndCategorizeItem = async (input: string): Promise<{ name: string; category: string }[]> => {
  if (!apiKey) {
    console.warn("API Key not found, returning default");
    return [{ name: input, category: PredefinedCategory.Other }];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following shopping list input: "${input}". 
      Split it into individual items if there are multiple (comma or space separated).
      Assign the most appropriate category to each item from this list: 
      [${Object.values(PredefinedCategory).join(", ")}].
      If unclear, use "Other".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["name", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [{ name: input, category: PredefinedCategory.Other }];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback if API fails
    return [{ name: input, category: PredefinedCategory.Other }];
  }
};

export const reCategorizeItems = async (itemNames: string[]): Promise<Record<string, string>> => {
  if (!apiKey || itemNames.length === 0) return {};

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a helpful shopping assistant.
      I have a list of shopping items that need to be categorized correctly.
      
      The allowed categories are: ${Object.values(PredefinedCategory).join(", ")}.
      
      Here are the items to categorize:
      ${JSON.stringify(itemNames)}
      
      Please return a JSON array of objects, where each object has a "name" (from the input list) and a "category" (selected from the allowed list).
      If a category is ambiguous, choose the best fit or "Other".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["name", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return {};

    const resultArr = JSON.parse(text) as {name: string, category: string}[];
    
    // Create a lookup map: normalized item name -> category
    const lookup: Record<string, string> = {};
    resultArr.forEach(item => {
      if (item.name && item.category) {
        lookup[item.name.toLowerCase()] = item.category;
      }
    });
    
    return lookup;
  } catch (error) {
    console.error("Gemini Re-categorization error:", error);
    return {};
  }
};