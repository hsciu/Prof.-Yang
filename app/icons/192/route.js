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
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "white",
          fontSize: 110,
          fontWeight: 700,
        }}
      >
        ∫
      </div>
    ),
    { width: 192, height: 192 }
  );
}
