import React, { useEffect } from "react";
import { useReactive } from "ahooks";
import { Tabs, Input, Upload, App } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { type Config, appConfigSchema } from "@videofy/types";
import { useProjectAssets } from "@/api";
import { useGlobalState } from "../../state/globalState";
import { saveConfig as saveConfigAction } from "@/actions/configActions";

const { TextArea } = Input;

const EditConfig: React.FC = () => {
  const { config, setConfig, selectedProject } = useGlobalState();
  const { message } = App.useApp();
  const state = useReactive({
    currentConfigString: JSON.stringify(config.config, null, 2),
    validationError: null as string | null,
    savingConfig: false,
    saveSuccessMessage: null as string | null,
    uploading: false,
  });

  const {
    data: projectAssetsResponse,
    error: projectAssetsError,
    isLoading: projectAssetsLoading,
    refresh: refreshAssets,
  } = useProjectAssets(selectedProject?.id);

  const projectFiles = projectAssetsResponse?.files || [];

  useEffect(() => {
    state.currentConfigString = JSON.stringify(config.config, null, 2);
  }, [config, state]);

  if (!selectedProject) return null;

  const handleSaveConfig = async () => {
    state.validationError = null;
    state.saveSuccessMessage = null;
    state.savingConfig = true;

    let parsedConfigData: Config;
    try {
      parsedConfigData = JSON.parse(state.currentConfigString);
      const validationResult = appConfigSchema.safeParse(parsedConfigData);
      if (!validationResult.success) {
        state.validationError = `Invalid config format: ${validationResult.error.issues
          .map((issue) => `${issue.path.join(".")} - ${issue.message}`)
          .join(", ")}`;
        state.savingConfig = false;
        return;
      }
      parsedConfigData = validationResult.data;
    } catch (error) {
      state.validationError =
        error instanceof SyntaxError
          ? `Invalid JSON: ${error.message}`
          : "An unexpected error occurred during local validation.";
      state.savingConfig = false;
      return;
    }

    try {
      const result = await saveConfigAction({
        projectId: selectedProject.id,
        config: parsedConfigData,
      });
      if (result.success) {
        setConfig({ projectId: selectedProject.id, config: parsedConfigData });
        state.saveSuccessMessage = result.message || "Config saved successfully!";
      } else {
        state.validationError = result.error || "Failed to save config to server.";
      }
    } catch (serverError) {
      console.error("Error calling saveConfig action:", serverError);
      state.validationError =
        "An unexpected error occurred while saving to the server.";
    } finally {
      state.savingConfig = false;
    }
  };

  const handleUpload = async (file: UploadFile) => {
    if (!selectedProject?.id || !file.name) return "error";
    state.uploading = true;
    const formData = new FormData();
    formData.append("file", file as unknown as Blob);
    try {
      const response = await fetch(`/api/assets/${selectedProject.id}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to upload file: ${response.statusText}`
        );
      }
      await refreshAssets();
      return "success";
    } catch (error) {
      console.error("Error uploading file:", error);
      return "error";
    } finally {
      state.uploading = false;
    }
  };

  return (
    <Tabs
      defaultActiveKey="config"
      onChange={() => {
        if (state.saveSuccessMessage) message.destroy();
      }}
      items={[
        {
          key: "config",
          label: "Edit Config",
          children: (
            <div className="flex flex-col gap-3">
              <TextArea
                rows={15}
                value={state.currentConfigString}
                onChange={(e) => {
                  state.currentConfigString = e.target.value;
                  state.validationError = null;
                }}
              />

              {state.validationError && (
                <div className="vf-alert vf-alert-error">
                  {state.validationError}
                </div>
              )}

              {state.saveSuccessMessage && (
                <div
                  className="vf-alert"
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    borderColor: "rgba(34,197,94,0.3)",
                    color: "#86efac",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {state.saveSuccessMessage}
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                      padding: "0 4px",
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                    onClick={() => (state.saveSuccessMessage = null)}
                  >
                    ×
                  </button>
                </div>
              )}

              <button
                type="button"
                className="vf-btn vf-btn-primary"
                style={{ alignSelf: "flex-start" }}
                disabled={state.savingConfig}
                onClick={handleSaveConfig}
              >
                {state.savingConfig ? (
                  <>
                    <div
                      className="vf-spinner"
                      style={{ width: 14, height: 14 }}
                    />
                    Saving...
                  </>
                ) : (
                  "Save Config"
                )}
              </button>
            </div>
          ),
        },
        {
          key: "assets",
          label: "Upload Assets",
          children: (
            <div className="flex flex-col gap-3 mt-2">
              <Upload
                customRequest={({ file, onSuccess, onError }) => {
                  handleUpload(file as UploadFile)
                    .then((result) => {
                      if (result === "success" && onSuccess)
                        onSuccess({}, new XMLHttpRequest());
                      else if (result === "error" && onError)
                        onError(new Error("Upload failed"));
                    })
                    .catch((err) => {
                      if (onError) onError(err);
                    });
                }}
                showUploadList={false}
              >
                <button
                  type="button"
                  className="vf-btn vf-btn-ghost"
                  disabled={state.uploading}
                >
                  {state.uploading ? (
                    <>
                      <div
                        className="vf-spinner"
                        style={{ width: 14, height: 14 }}
                      />
                      Uploading...
                    </>
                  ) : (
                    "Upload media"
                  )}
                </button>
              </Upload>

              {projectAssetsError && (
                <div className="vf-alert vf-alert-error">
                  Failed to load project assets: {projectAssetsError.message}
                </div>
              )}

              {projectAssetsLoading ? (
                <div className="flex items-center gap-2">
                  <div className="vf-spinner" style={{ width: 14, height: 14 }} />
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Loading assets...
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                  }}
                >
                  {projectFiles.length === 0 ? (
                    <p
                      style={{
                        padding: 12,
                        color: "var(--text-faint)",
                        fontSize: 13,
                        margin: 0,
                      }}
                    >
                      No assets uploaded yet.
                    </p>
                  ) : (
                    projectFiles.map((item) => (
                      <div
                        key={item}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-heading)",
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        {item}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
};

export default EditConfig;
