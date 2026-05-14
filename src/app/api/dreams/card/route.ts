import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dream = searchParams.get("dream") || "Before I die, I want to...";
  const name = searchParams.get("name") || "Anonymous";
  const reason = searchParams.get("reason") || "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf6f0",
          padding: "60px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(212, 149, 110, 0.15), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(100, 75, 100, 0.1), transparent 55%)",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "40px",
            opacity: 0.6,
          }}
        >
          <span style={{ fontSize: "18px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#78716c" }}>
            Before Die
          </span>
        </div>

        {/* Dream text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "900px",
          }}
        >
          <p
            style={{
              fontSize: dream.length > 80 ? "36px" : "44px",
              fontWeight: 700,
              color: "#1c1917",
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            &ldquo;{dream}&rdquo;
          </p>

          {reason && (
            <p
              style={{
                fontSize: "20px",
                color: "#78716c",
                marginTop: "24px",
                lineHeight: 1.5,
                maxWidth: "700px",
              }}
            >
              {reason.length > 120 ? reason.slice(0, 120) + "..." : reason}
            </p>
          )}
        </div>

        {/* Author */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "48px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(196, 134, 106, 0.12)",
              borderRadius: "9999px",
              padding: "6px 16px",
              fontSize: "16px",
              color: "#c4866a",
              fontWeight: 600,
            }}
          >
            {name}
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            opacity: 0.4,
          }}
        >
          <div style={{ width: "40px", height: "1px", backgroundColor: "#78716c" }} />
          <span style={{ fontSize: "12px", color: "#78716c", letterSpacing: "0.15em" }}>
            before-die-app.vercel.app
          </span>
          <div style={{ width: "40px", height: "1px", backgroundColor: "#78716c" }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
