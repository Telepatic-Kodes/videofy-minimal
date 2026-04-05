import { MediaAssetType } from "@videofy/types";
import MediaAsset from "./MediaAsset";
import { useReactive } from "ahooks";

interface ReplaceMediaProps {
  alternativeMedia?: MediaAssetType[];
  onSelectMedia: (asset: MediaAssetType) => void;
}

const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ReplaceMedia = ({
  alternativeMedia,
  onSelectMedia,
}: ReplaceMediaProps) => {
  const state = useReactive({ openPanel: undefined as string | undefined });

  if (!alternativeMedia || alternativeMedia.length === 0) return null;

  const toggle = (key: string) => {
    state.openPanel = state.openPanel === key ? undefined : key;
  };

  const panels = [
    {
      key: "1",
      label: "Other media from article",
      content: (
        <div className="gap-4 grid grid-cols-2">
          {alternativeMedia.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <MediaAsset editable={false} value={item} />
              <button
                type="button"
                className="vf-btn vf-btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  onSelectMedia(item);
                  state.openPanel = undefined;
                }}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "2",
      label: "External library",
      content: (
        <div className="vf-alert vf-alert-warning">
          External media library integrations are disabled in minimal mode.
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
      }}
    >
      {panels.map((panel, idx) => (
        <div
          key={panel.key}
          style={{
            borderTop: idx > 0 ? "1px solid var(--border)" : undefined,
          }}
        >
          <button
            type="button"
            onClick={() => toggle(panel.key)}
            className="w-full flex items-center justify-between"
            style={{
              padding: "10px 14px",
              background: "var(--surface-2)",
              border: "none",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {panel.label}
            <IconChevron open={state.openPanel === panel.key} />
          </button>
          {state.openPanel === panel.key && (
            <div style={{ padding: 14, background: "var(--surface)" }}>
              {panel.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReplaceMedia;
