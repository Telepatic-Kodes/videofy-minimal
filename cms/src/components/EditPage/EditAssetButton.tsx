import { Tooltip } from "antd";
import { FC } from "react";

interface Props {
  onClick: () => void;
  tooltipText: string;
}

// pencil icon
const IconEdit = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const EditAssetButton: FC<Props> = ({ onClick, tooltipText }) => (
  <Tooltip title={tooltipText}>
    <button
      type="button"
      className="vf-btn vf-btn-icon"
      style={{
        position: "absolute",
        top: 4,
        right: 4,
        background: "rgba(0,0,0,0.6)",
        border: "1px solid var(--border-2)",
        color: "var(--text)",
        width: 26,
        height: 26,
        borderRadius: "var(--radius-sm)",
      }}
      onClick={onClick}
    >
      <IconEdit />
    </button>
  </Tooltip>
);

export default EditAssetButton;
