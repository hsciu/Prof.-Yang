"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import styles from "./page.module.css";

export default function Home() {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult("");
    setError("");
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      setImageData(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!imageData) {
      setError("請先上傳一張題目圖片");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "解題失敗");
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
          <p>上傳一張題目圖片，AI會給你詳細的解題過程</p>
        </div>

        <div className={styles.card}>
          <label
            className={styles.uploadZone}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.uploadIcon}>📷</span>
            <p>
              <strong>點擊上傳</strong>題目照片
            </p>
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          {preview && (
            <div className={styles.previewWrap}>
              <img src={preview} alt="題目預覽" className={styles.preview} />
            </div>
          )}

          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={loading || !imageData}
          >
            {loading && <span className={styles.spinner} />}
            {loading ? "解題中..." : "開始解題"}
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
