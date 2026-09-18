"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import styles from "./page.module.css";

const MODES = [
  { id: "translate", label: "翻譯題目" },
  { id: "explain", label: "解釋題目含意" },
  { id: "solve", label: "解題並給出答案" },
  { id: "answer_only", label: "僅給出正確答案" },
];

export default function Home() {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState("solve");
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setError("只支援圖片或PDF檔案");
      return;
    }

    setResult("");
    setError("");
    setMimeType(file.type);
    setFileName(file.name);
    setImagePreview(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (isImage) {
        setImagePreview(dataUrl);
      }
      setFileData(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!fileData) {
      setError("請先上傳題目圖片或PDF");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: fileData, mimeType, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "處理失敗");
      }
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>數學／力學家教</h1>
          <p>上傳題目圖片或PDF，選擇你需要的回覆方式</p>
        </div>

        <div className={styles.card}>
          <div className={styles.modeGroup}>
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`${styles.modeButton} ${
                  mode === m.id ? styles.modeButtonActive : ""
                }`}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <label
            className={styles.uploadZone}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.uploadIcon}>📄</span>
            <p>
              <strong>點擊上傳</strong>題目圖片或PDF
            </p>
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
          </label>

          {imagePreview && (
            <div className={styles.previewWrap}>
              <img src={imagePreview} alt="題目預覽" className={styles.preview} />
            </div>
          )}

          {!imagePreview && fileName && (
            <div className={styles.fileCard}>
              <span className={styles.fileIcon}>📎</span>
              <span>{fileName}</span>
            </div>
          )}

          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={loading || !fileData}
          >
            {loading && <span className={styles.spinner} />}
            {loading ? "處理中..." : "送出"}
          </button>

          {error && <div className={styles.errorBox}>{error}</div>}
        </div>

        {result && (
          <div className={styles.card}>
            <div className={styles.resultCard}>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {result}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
