"use client";

const NotFoundPage = () => (
  <div
    className="flex flex-col items-center justify-center gap-4"
    style={{ minHeight: "100vh" }}
  >
    <div
      className="vf-logo"
      style={{ fontSize: 48, marginBottom: 0 }}
    >
      Video<span>fy</span>
    </div>
    <p
      style={{
        color: "var(--text-muted)",
        fontSize: 15,
        margin: 0,
      }}
    >
      Page not found.
    </p>
    <a href="/" className="vf-btn vf-btn-ghost" style={{ marginTop: 8 }}>
      Back to start
    </a>
  </div>
);

export default NotFoundPage;
