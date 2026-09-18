import { GoogleGenAI } from "@google/genai";

export function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("伺服器未設定 GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

export function isOverloadedError(err) {
  return err.status === 503 || /UNAVAILABLE|overloaded|high demand/i.test(err.message || "");
}

export async function generateWithRetry(ai, params, maxAttempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastErr = err;
      if (!isOverloadedError(err) || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastErr;
}
