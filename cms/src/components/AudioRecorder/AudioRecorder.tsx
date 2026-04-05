"use client";

import { Tooltip } from "antd";
import React, { useRef, useEffect } from "react";
import { useReactive } from "ahooks";
import { useGlobalState } from "@/state/globalState";

export interface AudioRecorderProps {
  value?: { src?: string; length?: number };
  onChange?: (audio: { src?: string; length?: number }) => void;
  onDelete?: () => void;
}

// Icons
const IconMic = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconStop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" />
  </svg>
);

const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconPause = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  value,
  onChange = () => {},
  onDelete = () => {},
}) => {
  const state = useReactive({
    isRecording: false,
    duration: 0,
    audioDuration: 0,
    isPlaying: false,
    isSaving: false,
  });
  const { generationId } = useGlobalState();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const uploadAudio = async (audioBlob: Blob) => {
    state.isSaving = true;
    const formData = new FormData();
    formData.append("file", audioBlob);
    try {
      if (!generationId) throw new Error("No active project selected.");
      const response = await fetch(
        `/api/uploadAudio?projectId=${encodeURIComponent(generationId)}`,
        { method: "POST", body: formData }
      );
      if (!response.ok) throw new Error("Failed to upload audio");
      const { url } = await response.json();
      onChange({ src: url, length: state.duration });
    } catch (error) {
      console.error("Failed to upload audio:", error);
    } finally {
      state.isSaving = false;
    }
  };

  const startRecording = async (event?: React.MouseEvent<HTMLElement>) => {
    if (event?.shiftKey) {
      onChange({ src: "/assets/voice-sample.wav", length: 6 });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await uploadAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.start();
      state.isRecording = true;
      state.duration = 0;
      timerRef.current = setInterval(() => {
        state.duration = state.duration + 1;
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      state.isRecording = false;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleRecordClick = (event: React.MouseEvent<HTMLElement>) => {
    if (state.isRecording) {
      stopRecording();
    } else {
      handleDelete();
      startRecording(event);
    }
  };

  const handlePlay = () => {
    if (!value?.src) return;
    if (state.isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      state.isPlaying = false;
    } else {
      const audio = new Audio(value.src);
      audioRef.current = audio;
      audio.play();
      state.isPlaying = true;
      audio.onended = () => {
        state.isPlaying = false;
        audioRef.current = null;
      };
    }
  };

  const handleDelete = () => {
    if (state.isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      state.isPlaying = false;
    }
    state.duration = 0;
    if (state.isRecording) stopRecording();
    onChange({});
    onDelete();
  };

  useEffect(() => {
    if (value?.src) {
      if (typeof value.length === "number") {
        state.audioDuration = value.length;
      } else {
        const audio = new Audio(value.src);
        audio.onloadedmetadata = () => {
          state.audioDuration = audio.duration;
        };
      }
    } else {
      state.audioDuration = 0;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="flex items-center gap-2 w-full p-2"
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-2)",
      }}
    >
      {/* Record / Stop */}
      <Tooltip title={state.isRecording ? "Stop" : "Record custom audio"}>
        <button
          type="button"
          className="vf-btn vf-btn-icon"
          style={
            state.isRecording
              ? {
                  background: "rgba(239,68,68,0.15)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239,68,68,0.3)",
                }
              : { background: "var(--surface-3)", border: "1px solid var(--border-2)", color: "var(--text)" }
          }
          onClick={handleRecordClick}
        >
          {state.isRecording ? <IconStop /> : <IconMic />}
        </button>
      </Tooltip>

      {/* Play / Pause */}
      {value?.src && !state.isRecording && (
        <Tooltip title={state.isPlaying ? "Pause" : "Play"}>
          <button
            type="button"
            className="vf-btn vf-btn-icon vf-btn-ghost"
            onClick={handlePlay}
          >
            {state.isPlaying ? <IconPause /> : <IconPlay />}
          </button>
        </Tooltip>
      )}

      {/* Status text */}
      <div
        className="flex-1 text-center"
        style={{ fontSize: 12, color: "var(--text-muted)" }}
      >
        {state.isSaving && "Saving..."}
        {!state.isSaving && value?.src && !state.isRecording &&
          state.audioDuration > 0 &&
          `${state.audioDuration.toFixed(1)}s`}
        {!state.isSaving && value?.src && !state.isRecording &&
          !state.audioDuration && "Loading audio..."}
        {state.isRecording && (
          <span style={{ color: "#fca5a5" }}>
            Recording... ({state.duration.toFixed(0)}s)
          </span>
        )}
      </div>

      {/* Delete */}
      {value?.src && !state.isRecording && (
        <Tooltip title="Delete recording">
          <button
            type="button"
            className="vf-btn vf-btn-icon"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
            onClick={handleDelete}
          >
            <IconTrash />
          </button>
        </Tooltip>
      )}
    </div>
  );
};

export default AudioRecorder;
