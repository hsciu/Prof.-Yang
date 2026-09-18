import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `你是一位大學數學與力學的家教。使用者會上傳一張題目圖片，請你：
1. 先讀懂題目內容。
2. 用清楚的步驟解題，每一步先用一句話說明在做什麼，再列出對應的算式。
3. 所有數學式一律使用 LaTeX 語法：行內公式用 $...$，需要獨立成行的公式用 $$...$$。
4. 不要使用 \\( \\) 或 \\[ \\] 這種語法，也不要用純文字符號表示指數、根號、分數（例如不要寫 x^2 或 sqrt(x)），一律使用正確的 LaTeX 指令（^{}、\\sqrt{}、\\frac{}{} 等）。
5. 最後用一個獨立段落給出最終答案，並在前面加上「**最終答案：**」。`;

export async function POST(request) {
  try {
    const { image, mimeType } = await request.json();

    if (!image || !mimeType) {
      return Response.json({ error: "缺少圖片資料" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "伺服器未設定 GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const request_params = {
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "請解出這張圖片中的數學／力學題目，並給出詳細解題過程。" },
            { inlineData: { mimeType, data: image } },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    };

    const maxAttempts = 3;
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent(request_params);
        return Response.json({ result: response.text });
      } catch (err) {
        lastErr = err;
        const isOverloaded =
          err.status === 503 || /UNAVAILABLE|overloaded|high demand/i.test(err.message || "");
        if (!isOverloaded || attempt === maxAttempts) break;
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
    throw lastErr;
  } catch (err) {
    console.error(err);
    const isOverloaded =
      err.status === 503 || /UNAVAILABLE|overloaded|high demand/i.test(err.message || "");
    return Response.json(
      {
        error: isOverloaded
          ? "Gemini伺服器目前忙碌中，已自動重試多次仍失敗，請稍後再試一次。"
          : err.message || "發生未知錯誤",
      },
      { status: isOverloaded ? 503 : 500 }
    );
  }
}
