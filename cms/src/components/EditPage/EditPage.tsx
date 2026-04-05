"use client";

import { type FC, useEffect } from "react";
import { useReactive } from "ahooks";
import { useParams } from "next/navigation";
import { Tab, useGlobalState } from "@/state/globalState";
import { useRouter } from "next/navigation";
import { App, Form, Tooltip } from "antd";
import PreviewOutput from "./Preview/PreviewOutput";
import SortableTabs from "../SortableTabs";
import SegmentList from "./SegmentList";
import EditConfig from "./EditConfig";
import AddFetchedArticle from "./AddFetchedArticle";

const EditPage: FC = () => {
  const {
    config,
    tabs,
    setConfig,
    setTabs,
    setSelectedProject,
    setGenerationId,
    generationId,
  } = useGlobalState();
  const router = useRouter();
  const params = useParams();
  const { message, notification } = App.useApp();
  const state = useReactive({
    editTheme: false,
    selectedTab: tabs[0]?.manuscript.meta.uniqueId,
    manuscript: tabs,
    loadingGeneration: true,
    loadError: null as string | null,
    openArticleModal: false,
    brandId: "default",
  });

  useEffect(() => {
    const generationParam = params.generation;
    const generationId = Array.isArray(generationParam)
      ? generationParam[0]
      : generationParam;
    if (!generationId) {
      state.loadingGeneration = false;
      router.replace("/");
      return;
    }
    const fetchGeneration = async () => {
      state.loadingGeneration = true;
      state.loadError = null;
      try {
        const response = await fetch(
          `/api/generations?id=${encodeURIComponent(String(generationId))}`
        );
        if (response.status === 404) {
          notification.warning({
            title: "Project no longer exists",
            description:
              "The generation was removed or the project folder was deleted.",
          });
          router.replace("/");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch generation");
        }
        const generation = await response.json();
        if (!generation.config || !generation.projectId) {
          throw new Error(
            "Generation payload is missing config or projectId"
          );
        }
        setConfig({
          projectId: generation.projectId,
          config: generation.config,
        });
        setTabs(generation.data);
        setSelectedProject(
          generation.project || {
            id: generation.projectId,
            name: generation.projectId,
          }
        );
        setGenerationId(generation.id);
        state.brandId = generation.brandId || "default";
        state.selectedTab =
          generation.data?.[0]?.manuscript?.meta?.uniqueId;
      } catch (error) {
        console.error(error);
        state.loadError =
          error instanceof Error
            ? error.message
            : "Failed to load generation";
      } finally {
        state.loadingGeneration = false;
      }
    };
    void fetchGeneration();
  }, [
    params,
    router,
    setConfig,
    setTabs,
    setSelectedProject,
    setGenerationId,
    notification,
    state,
  ]);

  useEffect(() => {
    if (!state.selectedTab && tabs.length > 0) {
      state.selectedTab = tabs[0]?.manuscript.meta.uniqueId;
    }
  }, [state, tabs]);

  const [form] = Form.useForm();

  const handleAddArticle = async (tab: Tab) => {
    const currentTabs = (form.getFieldValue("tabs") || []) as Tab[];
    const nextTabs = [...currentTabs, tab];
    form.setFieldValue("tabs", nextTabs);
    setTabs(nextTabs);
    state.selectedTab = tab.manuscript.meta.uniqueId;

    const idFromParams = Array.isArray(params.generation)
      ? params.generation[0]
      : params.generation;
    const persistId = generationId || String(idFromParams || "");
    if (!persistId) return;
    const response = await fetch("/api/generations", {
      method: "PUT",
      body: JSON.stringify({ id: persistId, data: nextTabs }),
    });
    if (!response.ok) {
      throw new Error("Failed to persist generation after adding article");
    }
  };

  if (state.loadingGeneration || !config) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4"
        style={{ minHeight: "100vh" }}
      >
        {state.loadError ? (
          <div
            className="vf-alert vf-alert-error flex flex-col gap-3"
            style={{ maxWidth: 480 }}
          >
            <strong>Failed to load project</strong>
            <p style={{ margin: 0 }}>{state.loadError}</p>
            <button
              type="button"
              className="vf-btn vf-btn-primary"
              style={{ alignSelf: "flex-start" }}
              onClick={() => router.replace("/")}
            >
              Back to start
            </button>
          </div>
        ) : (
          <>
            <div className="vf-spinner" />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Loading project...
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <Form preserve initialValues={{ tabs, config }} layout="vertical" form={form}>
      {/* Sticky header */}
      <header className="vf-header">
        <button
          type="button"
          className="vf-logo"
          onClick={() => router.push("/")}
        >
          Video<span>fy</span>
        </button>

        <div className="flex items-center gap-2">
          <Tooltip title="Copy URL to clipboard">
            <button
              type="button"
              className="vf-btn vf-btn-ghost"
              style={{ gap: 6 }}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                message.success("Video URL copied to clipboard.", 5);
              }}
            >
              {/* share icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          </Tooltip>

          <Tooltip title="Edit theme">
            <button
              type="button"
              className={`vf-btn vf-btn-icon ${
                state.editTheme ? "vf-btn-primary" : "vf-btn-ghost"
              }`}
              onClick={() => (state.editTheme = !state.editTheme)}
            >
              {/* settings gear */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1
                  -2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0
                  0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9
                  19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65
                  1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1
                  0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2
                  2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0
                  0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65
                  1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65
                  1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65
                  1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </header>

      {/* 2-column layout */}
      <div
        className="flex gap-4 p-4"
        style={{ minHeight: "calc(100vh - 52px)" }}
      >
        {/* Preview — left / top on mobile */}
        <div className="flex-1 min-w-0">
          <Form.Item noStyle shouldUpdate>
            {({ getFieldsValue }) => {
              const manuscripts = getFieldsValue(true).tabs;
              return <PreviewOutput tabs={manuscripts} />;
            }}
          </Form.Item>
        </div>

        {/* Editor — right */}
        <div className="w-full xl:max-w-[800px] xl:grow shrink-0">
          {!state.editTheme ? (
            <Form.List name={["tabs"]}>
              {(tabItems, { move }) => (
                <SortableTabs
                  allowAdd
                  onAdd={() => {
                    state.openArticleModal = true;
                  }}
                  activeKey={state.selectedTab}
                  onChange={(value) => {
                    state.selectedTab = value;
                  }}
                  onReorder={(from, to) => {
                    move(from, to);
                  }}
                  items={tabItems.map((t) => {
                    const tab = form.getFieldValue(["tabs", t.name]);
                    return {
                      key: tab.manuscript.meta.uniqueId!,
                      label: (
                        <span
                          title={tab.manuscript.meta.title}
                          style={{
                            maxWidth: 250,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                            userSelect: "none",
                          }}
                        >
                          {tab.manuscript.meta.title}
                        </span>
                      ),
                      children: (
                        <SegmentList
                          index={t.name}
                          manuscript={tab.manuscript}
                        />
                      ),
                      forceRender: true,
                    };
                  })}
                />
              )}
            </Form.List>
          ) : (
            <Form.Item name="config" noStyle>
              <EditConfig />
            </Form.Item>
          )}
        </div>
      </div>

      <AddFetchedArticle
        open={state.openArticleModal}
        setOpen={(open) => {
          state.openArticleModal = open;
        }}
        brandId={state.brandId}
        onChange={handleAddArticle}
      />
    </Form>
  );
};

export default EditPage;
