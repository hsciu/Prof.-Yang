import { SYSTEM_INSTRUCTIONS } from "@/lib/prompts";
import { getClient, generateWithRetry, isOverloadedError } from "@/lib/gemini";

function buildContents({ messages, mimeType, fileData }) {
  return messages.map((msg, idx) => {
    if (idx === 0) {
      return {
        role: "user",
        parts: [
          { text: msg.text },
          { inlineData: { mimeType, data: fileData } },
        ],
      };
    }
    return { role: msg.role, parts: [{ text: msg.text }] };
  });
}

export async function POST(request) {
  try {
    const { mode, mimeType, fileData, messages, message } = await request.json();

    if (!mimeType || !fileData || !Array.isArray(messages) || !message) {
      return Response.json({ error: "缺少必要參數" }, { status: 400 });
    }

    const contents = buildContents({ messages, mimeType, fileData });
    contents.push({ role: "user", parts: [{ text: message }] });

    const ai = getClient();
    const response = await generateWithRetry(ai, {
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS[mode] || SYSTEM_INSTRUCTIONS.solve,
        temperature: 0.2,
      },
    });

    return Response.json({ content: response.text });
  } catch (err) {
    console.error(err);
    return Response.json(
      {
        error: isOverloadedError(err)
          ? "Gemini伺服器目前忙碌中，請稍後再試一次。"
          : err.message || "發生未知錯誤",
      },
      { status: isOverloadedError(err) ? 503 : 500 }
    );
  }
}
