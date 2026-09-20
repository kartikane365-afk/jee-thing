import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { fileBase64, mimeType } = await req.json();

    if (!fileBase64 || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Missing file or API key' }, { status: 400 });
    }

    // Giving the AI complete freedom to organically analyze and partition the document
    const prompt = `
      You are an expert JEE (Joint Entrance Examination) document analyzer.
      Read the provided study module thoroughly. 
      Your task is to understand the structure of the document and break it down into logical partitions exactly as the author intended (e.g., "Exercise 1", "Exercise 2 - Section A", "Previous Year Questions", "Numerical Value Questions", etc.).
      For every partition you identify, provide the EXACT list of all question numbers found within that specific section. (e.g., if a section has questions 10, 11, and 12, list them out).
      
      Return the output STRICTLY as a JSON object matching this schema:
      {
        "exercises": [
          {
            "name": "Name of the Partition (e.g. Exercise 2 - Comprehension)",
            "questions": ["10", "11", "12", "13"]
          }
        ]
      }
      Do not include any other text, markdown formatting, or explanation. Only output valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: fileBase64.split(',')[1] || fileBase64,
                mimeType: mimeType || 'image/jpeg', 
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const data = JSON.parse(cleanText);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error parsing structure:', error);
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 });
  }
}
