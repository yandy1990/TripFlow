import { GoogleGenAI } from "@google/genai";
import { ActivityType } from '../types';

declare var process: any;

// The API key must be obtained from process.env.API_KEY
// In this browser-only setup, this comes from the window.process shim in index.html
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `
You are a world-class travel agent. 
Generate a detailed itinerary in JSON format based on the user's request. 
The output must be an array of itinerary items.
Infer specific times if not provided.
Map activities to one of these types: FLIGHT, HOTEL, ACTIVITY, FOOD, TRANSIT, NOTE.
`;

export const geminiService = {
  async generateItinerary(tripId: string, prompt: string, startDate: string) {
    if (!process.env.API_KEY) {
      console.warn("No API Key found for Gemini");
      return [];
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Plan a trip starting ${startDate}. Request: ${prompt}`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
        }
      });

      const rawItems = JSON.parse(response.text || '[]');
      
      const start = new Date(startDate);
      
      return rawItems.map((item: any) => {
        const itemDate = new Date(start);
        itemDate.setDate(start.getDate() + (item.dayOffset || 0));
        
        return {
          trip_id: tripId,
          date: itemDate.toISOString().split('T')[0],
          time: item.time,
          type: item.type as ActivityType,
          title: item.title,
          location: item.location,
          notes: item.notes,
        };
      });

    } catch (error) {
      console.error("Gemini generation failed", error);
      throw error;
    }
  }
};
