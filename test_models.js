const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const envPath = 'c:\\Users\\karti\\Desktop\\New folder\\jee-prep-app\\.env.local';
let key = '';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/GEMINI_API_KEY=(.+)/);
  if (match) key = match[1].trim();
}

const ai = new GoogleGenAI({ apiKey: key });

async function run() {
  try {
    // New SDK list models
    const response = await ai.models.list();
    // Usually it returns an iterable or an object with a models array
    for await (const model of response) {
       console.log(model.name);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
