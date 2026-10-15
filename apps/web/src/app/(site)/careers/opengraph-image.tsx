import { ImageResponse } from "next/og";

/** Link preview for /careers when it's shared on WhatsApp and elsewhere. */
export const alt = "Calecutech is hiring a Coordinator, work from home";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background:
            "radial-gradient(circle at 15% 10%, #4f46e5 0%, transparent 45%), radial-gradient(circle at 90% 15%, #b45309 0%, transparent 40%), radial-gradient(circle at 50% 110%, #a83a5e 0%, transparent 50%), #07070c",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 600, opacity: 0.85 }}>Calecutech · Careers</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 40, color: "#f2c46d", fontWeight: 600 }}>We&apos;re hiring</div>
          <div style={{ display: "flex", fontSize: 116, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
            Coordinator
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 38, opacity: 0.75 }}>
            Work from home · Kerala · Commission + shares
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 32, opacity: 0.7 }}>calecutech.com/careers</div>
      </div>
    ),
    size,
  );
}
