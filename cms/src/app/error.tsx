"use client";

import { type FC, useEffect, useState } from "react";

interface Props {
  error: Error & { digest?: string; cause?: unknown };
  reset: () => void;
}

const ErrorComponent: FC<Props> = ({ error, reset }) => {
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    console.error("=== CLIENT ERROR BOUNDARY ===");
    console.error("Error:", error);
    console.error("Message:", error.message);
    console.error("Digest:", error.digest);
    console.error("Cause:", error.cause);
    console.error("Stack:", error.stack);
    console.error("=============================");
  }, [error]);

  const errorMessage = error?.message || "Unknown error";
  const errorDigest = error?.digest || "No digest available";
  const errorStack = error?.stack || "";
  const errorCause = error?.cause ? JSON.stringify(error.cause, null, 2) : null;

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{ background: "var(--bg)" }}
    >
      <div style={{ maxWidth: 800, width: "100%" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 24,
            fontWeight: 700,
            color: "#fca5a5",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          An error occurred
        </h1>

        <div className="flex justify-center gap-3 mb-6">
          <button type="button" className="vf-btn vf-btn-primary" onClick={reset}>
            Try Again
          </button>
          <button
            type="button"
            className="vf-btn vf-btn-ghost"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide" : "Show"} Details
          </button>
        </div>

        {showDetails && (
          <div
            className="vf-card"
            style={{ fontFamily: "var(--font-heading)", fontSize: 13 }}
          >
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: "var(--text-faint)" }}>Digest: </span>
              <code style={{ color: "#86efac" }}>{errorDigest}</code>
            </div>

            <div style={{ marginBottom: 12 }}>
              <span style={{ color: "var(--text-faint)" }}>Message: </span>
              <code style={{ color: "#fca5a5" }}>{errorMessage}</code>
            </div>

            {errorCause && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "var(--text-faint)" }}>Cause:</span>
                <pre
                  style={{
                    marginTop: 6,
                    padding: 10,
                    background: "var(--bg)",
                    borderRadius: "var(--radius-sm)",
                    color: "#fdba74",
                    fontSize: 11,
                    overflowX: "auto",
                  }}
                >
                  {errorCause}
                </pre>
              </div>
            )}

            {errorStack && (
              <div>
                <span style={{ color: "var(--text-faint)" }}>Stack trace:</span>
                <pre
                  style={{
                    marginTop: 6,
                    padding: 10,
                    background: "var(--bg)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    overflowX: "auto",
                    maxHeight: 256,
                    overflowY: "auto",
                  }}
                >
                  {errorStack}
                </pre>
              </div>
            )}

            <p
              style={{
                color: "var(--text-faint)",
                fontSize: 11,
                marginTop: 16,
                marginBottom: 0,
              }}
            >
              Check server logs for full details (digest: {errorDigest})
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default ErrorComponent;
