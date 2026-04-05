"use client";
import { Bars3Icon } from "@heroicons/react/20/solid";
import { Form, Input, Select, Tooltip } from "antd";
import { cameraMovements, moods, textPlacements } from "@/utils/constants";
import { FC } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MediaAsset from "./MediaAsset";
import AudioRecorder from "../AudioRecorder/AudioRecorder";

interface SegmentProps {
  id: string;
  position: number;
  onDuplicate: () => void;
  onRemove: () => void;
  onAdd: () => void;
  manuscriptIndex: number;
}

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const Segment: FC<SegmentProps> = ({
  id,
  manuscriptIndex,
  position,
  onAdd,
  onDuplicate,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    width: "100%",
  };

  const form = Form.useFormInstance();
  const allMedia = form.getFieldValue([
    "tabs",
    manuscriptIndex,
    "manuscript",
    "media",
  ]);

  return (
    <div ref={setNodeRef} style={style}>
      <div className="vf-segment">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: "4px 2px",
              color: "var(--text-faint)",
              cursor: "move",
              marginTop: 2,
            }}
            {...attributes}
            {...listeners}
          >
            <Bars3Icon className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Media thumbnail */}
          <div className="shrink-0">
            <Form.Item name={[position, "mainMedia"]} noStyle>
              <MediaAsset allMedia={allMedia} />
            </Form.Item>
          </div>

          {/* Text + selects */}
          <div className="flex flex-col flex-1 min-w-0 gap-3">
            {/* Script text */}
            <div>
              <Form.Item name={[position, "text"]} noStyle>
                <Input.TextArea style={{ width: "100%" }} rows={5} />
              </Form.Item>
              <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "4px 0 0" }}>
                Add pronunciation hints in [brackets] after words
              </p>
            </div>

            {/* Mood / Camera / Placement */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="vf-label">Mood</label>
                <Form.Item name={[position, "mood"]} noStyle>
                  <Select
                    options={moods.map((m) => ({ value: m.id, label: m.name }))}
                    popupMatchSelectWidth={false}
                  />
                </Form.Item>
              </div>
              <div>
                <label className="vf-label">Camera</label>
                <Form.Item name={[position, "cameraMovement"]} noStyle>
                  <Select
                    options={cameraMovements.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    popupMatchSelectWidth={false}
                  />
                </Form.Item>
              </div>
              <div>
                <label className="vf-label">Placement</label>
                <Form.Item name={[position, "style"]} noStyle>
                  <Select
                    options={textPlacements.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    popupMatchSelectWidth={false}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Custom audio */}
            <div>
              <label className="vf-label">Custom audio</label>
              <Form.Item name={[position, "customAudio"]} noStyle>
                <AudioRecorder />
              </Form.Item>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1 shrink-0">
            <Tooltip title="Add segment below">
              <button
                type="button"
                className="vf-btn vf-btn-icon vf-btn-primary"
                onClick={onAdd}
              >
                <IconPlus />
              </button>
            </Tooltip>
            <Tooltip title="Duplicate segment">
              <button
                type="button"
                className="vf-btn vf-btn-icon vf-btn-ghost"
                onClick={onDuplicate}
              >
                <IconCopy />
              </button>
            </Tooltip>
            <Tooltip title="Delete segment">
              <button
                type="button"
                className="vf-btn vf-btn-icon"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
                onClick={onRemove}
              >
                <IconTrash />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Segment;
