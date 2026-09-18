"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import Sidebar from "./components/Sidebar";
import styles from "./page.module.css";

const STORAGE_KEY = "profYangHistory";

const MODES = [
  { id: "translate", label: "翻譯題目" },
  { id: "explain", label: "解釋題目含意" },
  { id: "solve", label: "解題並給出答案" },
  { id: "answer_only", label: "僅給出正確答案" },
];

function Markdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  );
}

export default function Home() {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState("solve");
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [problemText, setProblemText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [history, setHistory] = useState([]);
  const [activeRecord, setActiveRecord] = useState(null);
  const [followupText, setFollowupText] = useState("");
  const [followupLoading, setFollowupLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (err) {
      console.error("讀取歷史紀錄失敗", err);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
          }
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  function persistHistory(next) {
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("儲存歷史紀錄失敗", err);
    }
  }

  function processFile(file) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setError("只支援圖片或PDF檔案");
      return;
    }

    setError("");
    setProblemText("");
    setMimeType(file.type);
    setFileName(file.name || "剪貼簿圖片.png");
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

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleProblemTextChange(e) {
    const value = e.target.value;
    setProblemText(value);
    if (value.trim()) {
      setFileData(null);
      setImagePreview(null);
      setFileName(null);
      setMimeType(null);
    }
  }

  function clearUploadState() {
    setImagePreview(null);
    setFileName(null);
    setFileData(null);
    setMimeType(null);
    setProblemText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!fileData && !problemText.trim()) {
      setError("請上傳題目圖片／PDF，或輸入題目文字");
      return;
    }
    setLoading(true);
    setError("");
    setActiveRecord(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          fileData
            ? { file: fileData, mimeType, mode }
            : { text: problemText.trim(), mode }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "處理失敗");
      }

      const record = {
        id: crypto.randomUUID(),
        category: data.category,
        title: data.title,
        mode,
        mimeType: fileData ? mimeType : null,
        fileData: fileData || null,
        messages: [
          { role: "user", text: data.initialPrompt },
          { role: "model", text: data.content },
        ],
        createdAt: new Date().toISOString(),
      };

      persistHistory([record, ...history]);
      setActiveRecord(record);
      clearUploadState();
      setToast("解題完成");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectHistory(id) {
    const found = history.find((item) => item.id === id);
    if (found) {
      setError("");
      setActiveRecord(found);
    }
  }

  async function handleFollowupSubmit() {
    if (!followupText.trim() || !activeRecord) return;
    setFollowupLoading(true);
    setError("");
    const text = followupText;

    try {
      const res = await fetch("/api/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: activeRecord.mode,
          mimeType: activeRecord.mimeType,
          fileData: activeRecord.fileData,
          messages: activeRecord.messages,
          message: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "回覆失敗");
      }

      const updatedRecord = {
        ...activeRecord,
        messages: [
          ...activeRecord.messages,
          { role: "user", text },
          { role: "model", text: data.content },
        ],
      };

      setActiveRecord(updatedRecord);
      persistHistory(history.map((item) => (item.id === updatedRecord.id ? updatedRecord : item)));
      setFollowupText("");
      setToast("回覆已更新");
    } catch (err) {
      setError(err.message);
    } finally {
      setFollowupLoading(false);
    }
  }

  return (
    <div className={styles.layout}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <Sidebar items={history} activeId={activeRecord?.id} onSelect={handleSelectHistory} />

      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.header}>
            <h1>Prof. Yang</h1>
            <p>上傳題目圖片／PDF，或直接貼上圖片、輸入文字</p>
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
                <strong>點擊上傳</strong>或直接貼上（Ctrl+V）題目圖片
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

            <div className={styles.divider}>或</div>

            <textarea
              className={styles.textInput}
              placeholder="直接輸入或貼上題目文字"
              value={problemText}
              onChange={handleProblemTextChange}
            />

            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={loading || (!fileData && !problemText.trim())}
            >
              {loading && <span className={styles.spinner} />}
              {loading ? "處理中..." : "送出"}
            </button>

            {error && <div className={styles.errorBox}>{error}</div>}
          </div>

          {activeRecord && (
            <div className={styles.card}>
              <div className={styles.recordTitle}>
                {activeRecord.category} ・ {activeRecord.title}
              </div>

              {activeRecord.fileData && activeRecord.mimeType?.startsWith("image/") && (
                <div className={styles.previewWrap}>
                  <img
                    src={`data:${activeRecord.mimeType};base64,${activeRecord.fileData}`}
                    alt="題目"
                    className={styles.preview}
                  />
                </div>
              )}

              <div className={styles.resultCard}>
                <Markdown>{activeRecord.messages[1]?.text || ""}</Markdown>
              </div>

              {activeRecord.messages.slice(2).map((msg, idx) => (
                <div
                  key={idx}
                  className={msg.role === "user" ? styles.followupUser : styles.followupModel}
                >
                  <Markdown>{msg.text}</Markdown>
                </div>
              ))}

              <div className={styles.followupBox}>
                <textarea
                  className={styles.followupInput}
                  placeholder="針對這個回覆新增意見或要求修改..."
                  value={followupText}
                  onChange={(e) => setFollowupText(e.target.value)}
                />
                <button
                  className={styles.followupButton}
                  onClick={handleFollowupSubmit}
                  disabled={followupLoading || !followupText.trim()}
                >
                  {followupLoading ? "送出中..." : "新增回覆"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
