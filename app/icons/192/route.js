import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2b2b2b",
          color: "white",
          fontSize: 110,
          fontWeight: 600,
        }}
      >
        ∫
      </div>
    ),
    { width: 192, height: 192 }
  );
}
