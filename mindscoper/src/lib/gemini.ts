import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let _flash: GenerativeModel | null = null;
let _pro: GenerativeModel | null = null;

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Copy .env.example to .env.local and add your key.");
  }
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiFlash(): GenerativeModel {
  if (!_flash) {
    _flash = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
  }
  return _flash;
}

export function getGeminiPro(): GenerativeModel {
  if (!_pro) {
    _pro = getGenAI().getGenerativeModel({ model: "gemini-2.5-pro" });
  }
  return _pro;
}
