"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import styles from "./page.module.css";

export default function Home() {
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
        <h1>數學／力學家教</h1>
        <p>上傳一張題目圖片，AI會給你詳細的解題過程。</p>

        <input type="file" accept="image/*" onChange={handleFileChange} />

        {preview && (
          <img
            src={preview}
            alt="題目預覽"
            style={{ maxWidth: "100%", marginTop: "1rem" }}
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !imageData}
          style={{ marginTop: "1rem" }}
        >
          {loading ? "解題中..." : "開始解題"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {result && (
          <div style={{ marginTop: "2rem", textAlign: "left" }}>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {result}
            </ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
}
