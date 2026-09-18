import { SYSTEM_INSTRUCTIONS, USER_PROMPTS, RESPONSE_SCHEMA } from "@/lib/prompts";
import { getClient, generateWithRetry, isOverloadedError } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { file, mimeType, mode } = await request.json();

    if (!file || !mimeType) {
      return Response.json({ error: "缺少檔案資料" }, { status: 400 });
    }

    const selectedMode = SYSTEM_INSTRUCTIONS[mode] ? mode : "solve";
    const ai = getClient();

    const response = await generateWithRetry(ai, {
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: USER_PROMPTS[selectedMode] },
            { inlineData: { mimeType, data: file } },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS[selectedMode],
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text);

    return Response.json({
      category: parsed.category,
      title: parsed.title,
      content: parsed.content,
    });
  } catch (err) {
    console.error(err);
    return Response.json(
      {
        error: isOverloadedError(err)
          ? "Gemini伺服器目前忙碌中，已自動重試多次仍失敗，請稍後再試一次。"
          : err.message || "發生未知錯誤",
      },
      { status: isOverloadedError(err) ? 503 : 500 }
    );
  }
}
