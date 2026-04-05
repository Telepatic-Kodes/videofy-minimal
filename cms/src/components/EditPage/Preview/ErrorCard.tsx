import type { FC } from "react";

interface Props {
  errorMessage: string;
}

const ErrorCard: FC<Props> = ({ errorMessage }) => (
  <div
    className="flex flex-col items-center justify-center gap-2 w-full p-8"
    style={{
      minHeight: 320,
      border: "1px dashed var(--border-2)",
      borderRadius: "var(--radius)",
      background: "var(--surface)",
    }}
  >
    <div className="vf-alert vf-alert-error" style={{ maxWidth: 480 }}>
      <strong style={{ display: "block", marginBottom: 4 }}>
        Preview failed
      </strong>
      {errorMessage}
    </div>
  </div>
);

export default ErrorCard;
