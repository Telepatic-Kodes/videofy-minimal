import type { FC } from "react";

const LoadingCard: FC = () => (
  <div
    className="flex flex-col items-center justify-center gap-3 w-full"
    style={{
      minHeight: 320,
      border: "1px dashed var(--border-2)",
      borderRadius: "var(--radius)",
      background: "var(--surface)",
    }}
  >
    <div className="vf-spinner" />
    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
      Loading preview...
    </span>
  </div>
);

export default LoadingCard;
