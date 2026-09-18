export default function manifest() {
  return {
    name: "Prof. Yang",
    short_name: "Prof. Yang",
    description: "上傳題目圖片，取得AI詳細解題過程",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2b2b2b",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
