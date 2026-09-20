import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { fileBase64, mimeType, exercise, question, type } = await req.json();

    if (!fileBase64 || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Missing data or API key' }, { status: 400 });
    }

    let instruction = "";
    if (type === "hint") {
      instruction = `Provide the FORMULA AND HINT for this question. Do NOT solve it completely. Include important properties or concepts related to the topic. Format with clear Markdown headings.`;
    } else {
      instruction = `Provide the FULL STEP-BY-STEP SOLUTION for this question. Explain the reasoning at each step. Format nicely with Markdown and LaTeX equations where appropriate.`;
    }

    const prompt = `
      You are an expert JEE (Joint Entrance Examination) tutor for Mathematics, Physics, and Chemistry.
      Look at the provided document or module.
      Locate the question under "${exercise}", specifically Question Number "${question}".
      
      Your task: ${instruction}
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
    });

    return NextResponse.json({ result: response.text });
  } catch (error) {
    console.error('Error solving question:', error);
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
  }
}
