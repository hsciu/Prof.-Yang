import { SYSTEM_INSTRUCTIONS, USER_PROMPTS, RESPONSE_SCHEMA } from "@/lib/prompts";
import { getClient, generateWithRetry, isOverloadedError } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { file, mimeType, mode, text } = await request.json();

    if (!file && !text) {
      return Response.json({ error: "請上傳檔案或輸入題目文字" }, { status: 400 });
    }

    const selectedMode = SYSTEM_INSTRUCTIONS[mode] ? mode : "solve";
    const ai = getClient();

    const initialPrompt = file
      ? USER_PROMPTS[selectedMode]
      : `${USER_PROMPTS[selectedMode]}\n\n題目內容：\n${text}`;

    const userParts = file
      ? [{ text: initialPrompt }, { inlineData: { mimeType, data: file } }]
      : [{ text: initialPrompt }];

    const response = await generateWithRetry(ai, {
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: userParts }],
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
      initialPrompt,
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
