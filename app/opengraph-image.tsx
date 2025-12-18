import { ImageResponse } from "next/og";

import { SITE_CONFIG } from "@/lib/site-config";

export const alt = SITE_CONFIG.TITLE;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        gap: 24,
        padding: 60,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 72,
          color: "white",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {SITE_CONFIG.TITLE}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          maxWidth: "80%",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        A modern full-stack Next.js boilerplate
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 20,
          marginTop: 40,
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        {`by ${SITE_CONFIG.MAKER}`}
      </div>
    </div>,
    { ...size },
  );
}
