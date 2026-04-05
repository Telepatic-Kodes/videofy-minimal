"use client";
import type { processedManuscriptSchema } from "@videofy/types";
import { processManuscript } from "@/utils/processManuscript";
import type { PlayerRef } from "@remotion/player";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useReactive } from "ahooks";
import type { z } from "zod";
import { Player } from "@videofy/player";
import ErrorCard from "./ErrorCard";
import LoadingCard from "./LoadingCard";
import { Tab, useGlobalState } from "@/state/globalState";
import DownloadModal from "./DownloadModal";

type Result = z.infer<typeof processedManuscriptSchema>;

// Icon: mobile portrait
const IconMobile = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <circle cx="12" cy="18" r="1" />
  </svg>
);

// Icon: desktop landscape
const IconDesktop = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

const PreviewOutput = ({ tabs }: { tabs: Tab[] }) => {
  const state = useReactive({
    loading: true,
    updating: false,
    error: null as string | null,
    previewType: "Vertical" as "Vertical" | "Horizontal",
    downloadOpen: false,
  });
  const abortController = useRef(new AbortController());
  const initialized = useRef(false);

  const {
    config: { config },
    processedManuscripts,
    setProcessedManuscripts,
    generationId,
  } = useGlobalState();

  const playerRef = useRef<PlayerRef>(null);

  const handleError = useCallback(
    (error: unknown) => {
      console.error(error);
      setProcessedManuscripts([]);
      if (typeof error === "string") {
        state.error = error || "Unknown reason.";
      } else if (error instanceof Error) {
        state.error = error?.message || "Unknown reason.";
      } else {
        state.error = "Unknown reason.";
      }
    },
    [setProcessedManuscripts, state]
  );

  const fetchData = useCallback(
    async (updating = false) => {
      if (!(tabs && config)) return;
      try {
        initialized.current = true;
        if (updating) {
          state.updating = true;
        } else {
          state.loading = true;
        }
        const results = await Promise.all(
          tabs.map((tab) =>
            processManuscript({
              abortController: abortController.current,
              manuscript: tab.manuscript,
              config: config,
              uniqueId: tab.manuscript.meta.uniqueId!,
              projectId: tab.projectId || generationId || tab.articleUrl,
              backendGenerationId: tab.backendGenerationId,
            })
          )
        );
        state.error = null;
        setProcessedManuscripts(
          results.filter((result) => result !== null) as Array<Result>
        );
        if (playerRef.current) playerRef.current.seekTo(0);
      } catch (error) {
        handleError(error);
      } finally {
        if (updating) {
          state.updating = false;
        } else {
          state.loading = false;
        }
        initialized.current = false;
      }
    },
    [config, handleError, setProcessedManuscripts, state, tabs]
  );

  const updatePreview = async () => {
    if (playerRef.current) playerRef.current.pause();
    await fetchData(true);
    await fetch("/api/generations", {
      method: "PUT",
      body: JSON.stringify({
        id: generationId || tabs[0]?.projectId || tabs[0]?.articleUrl,
        data: tabs,
      }),
    });
  };

  useEffect(() => {
    if (initialized.current) return;
    if (playerRef.current) playerRef.current.pause();
    fetchData();
  }, []);

  const playerConfig = useMemo(
    () => ({
      ...config.player!,
      assetBaseUrl:
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_CMS_BASE_URL || "http://127.0.0.1:3000",
    }),
    [config.player]
  );

  const busy = state.loading || state.updating;

  return (
    <div className="top-0 sticky flex flex-col w-full gap-3">
      {state.error && !busy ? (
        <ErrorCard errorMessage={state.error} />
      ) : !processedManuscripts.length && busy ? (
        <LoadingCard />
      ) : (
        <div className="relative">
          <Player
            ref={playerRef}
            height={state.previewType === "Vertical" ? 1920 : 1080}
            width={state.previewType === "Vertical" ? 1080 : 1920}
            manuscripts={processedManuscripts}
            playerConfig={playerConfig}
            style={{
              maxHeight:
                state.previewType === "Vertical" ? "80dvh" : undefined,
              width: "100%",
              aspectRatio:
                state.previewType === "Vertical" ? "9/16" : "16/9",
            }}
          />
          {busy && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center
                justify-center gap-3"
              style={{ background: "rgba(0,0,0,0.6)", borderRadius: "var(--radius)" }}
            >
              <div className="vf-spinner" />
              <span
                style={{ color: "var(--text)", fontSize: 13, fontWeight: 500 }}
              >
                Preview is generating...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* Layout toggle */}
        <div
          className="flex"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 3,
            gap: 2,
          }}
        >
          {(["Vertical", "Horizontal"] as const).map((type) => {
            const active = state.previewType === type;
            return (
              <button
                key={type}
                type="button"
                title={type}
                onClick={() => (state.previewType = type)}
                className="vf-btn vf-btn-icon"
                style={
                  active
                    ? {
                        background: "var(--accent)",
                        color: "#fff",
                        border: "none",
                      }
                    : { border: "none", color: "var(--text-muted)" }
                }
              >
                {type === "Vertical" ? <IconMobile /> : <IconDesktop />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="vf-btn vf-btn-primary"
          disabled={busy}
          onClick={updatePreview}
        >
          {state.updating ? (
            <>
              <div className="vf-spinner" style={{ width: 14, height: 14 }} />
              Updating...
            </>
          ) : (
            "Update"
          )}
        </button>

        {!state.error && processedManuscripts.length > 0 && (
          <button
            type="button"
            className="vf-btn vf-btn-ghost"
            disabled={busy}
            onClick={() => {
              updatePreview();
              state.downloadOpen = true;
            }}
          >
            Download
          </button>
        )}
      </div>

      <DownloadModal
        open={state.downloadOpen}
        setOpen={(open) => (state.downloadOpen = open)}
      />
    </div>
  );
};

export default memo(PreviewOutput);
