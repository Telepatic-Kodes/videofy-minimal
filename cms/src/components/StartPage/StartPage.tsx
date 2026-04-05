"use client";
import { useEffect, useMemo, useRef } from "react";
import { useReactive } from "ahooks";
import { generateManuscript } from "@/utils/generateManuscript";
import { useGlobalState } from "@/state/globalState";
import { Config } from "@videofy/types";
import Cookies from "universal-cookie";
import { App, Form, Input, Select } from "antd";
import { useRouter } from "next/navigation";
import {
  getBrands,
  getConfigs,
  getProjects,
  runFetcherPlugin,
  setProjectBrand,
  useBrands,
  useFetchers,
} from "@/api";

const cookies = new Cookies();

type FormType = {
  fetcherId: string;
  brandId: string;
  prompt: string;
  inputs: Record<string, string>;
};

const StartPage = () => {
  const { data: fetchers, isLoading: loadingFetchers } = useFetchers();
  const { data: brands, isLoading: loadingBrands } = useBrands();
  const hasFetchers = Boolean(fetchers && fetchers.length > 0);
  const hasBrands = Boolean(brands && brands.length > 0);

  const state = useReactive({
    loading: false,
    loadingMessage: "Generating video...",
  });
  const { notification } = App.useApp();
  const {
    setConfig,
    setCustomPrompt,
    setTabs,
    setCurrentTabIndex,
    setGenerationId,
    setSelectedProject,
  } = useGlobalState();

  const [form] = Form.useForm<FormType>();
  const selectedFetcherId = Form.useWatch("fetcherId", form);
  const selectedBrandId = Form.useWatch("brandId", form);
  const selectedFetcher = useMemo(
    () => fetchers?.find((fetcher) => fetcher.id === selectedFetcherId),
    [fetchers, selectedFetcherId]
  );
  const selectedFetcherFields = useMemo(
    () =>
      (selectedFetcher?.fields || []).filter(
        (field) => field.name !== "project_id"
      ),
    [selectedFetcher]
  );
  const selectedBrand = useMemo(
    () => brands?.find((brand) => brand.id === selectedBrandId),
    [brands, selectedBrandId]
  );
  const lastSyncedBrandId = useRef<string | undefined>(undefined);

  const router = useRouter();

  useEffect(() => {
    if (!fetchers || fetchers.length === 0) return;
    const currentFetcherId = form.getFieldValue("fetcherId");
    if (currentFetcherId) return;
    form.setFieldsValue({ fetcherId: fetchers[0].id, inputs: {} });
  }, [fetchers, form]);

  useEffect(() => {
    if (!brands || brands.length === 0) return;
    const currentBrandId = form.getFieldValue("brandId");
    if (currentBrandId) return;
    const initialBrand = brands[0];
    form.setFieldsValue({
      brandId: initialBrand.id,
      prompt: initialBrand.scriptPrompt || "",
    });
  }, [brands, form]);

  useEffect(() => {
    if (!brands || brands.length === 0 || !selectedBrandId) return;
    if (lastSyncedBrandId.current === selectedBrandId) return;
    const brand = brands.find((b) => b.id === selectedBrandId);
    if (!brand) return;
    const nextPrompt = brand.scriptPrompt || "";
    const currentPrompt = form.getFieldValue("prompt") || "";
    if (nextPrompt !== currentPrompt) {
      form.setFields([{ name: "prompt", value: nextPrompt }]);
    }
    lastSyncedBrandId.current = selectedBrandId;
  }, [brands, form, selectedBrandId]);

  useEffect(() => {
    if (!selectedFetcherId) return;
    form.setFieldValue("inputs", {});
  }, [selectedFetcherId, form]);

  const loadManuscript = async (values: FormType) => {
    const { prompt, fetcherId, brandId } = values;
    const customPrompt = (prompt || "").trim();
    const selected = fetchers?.find((fetcher) => fetcher.id === fetcherId);
    if (!selected) {
      notification.error({ title: "Fetcher not found." });
      return;
    }
    const brand =
      brands?.find((item) => item.id === brandId) ||
      (await getBrands()).find((item) => item.id === brandId);
    if (!brand) {
      notification.error({ title: "Brand not found." });
      return;
    }
    state.loading = true;
    state.loadingMessage = "Fetching article...";
    try {
      const fetchResult = await runFetcherPlugin({
        fetcherId,
        inputs: values.inputs || {},
      });

      state.loadingMessage = "Applying brand settings...";
      await setProjectBrand(fetchResult.projectId, brand.id);

      state.loadingMessage = "Loading project configuration...";
      const [projects, configs] = await Promise.all([
        getProjects(),
        getConfigs(),
      ]);
      const project = projects.find((p) => p.id === fetchResult.projectId) || {
        id: fetchResult.projectId,
        name: fetchResult.projectId,
      };
      setSelectedProject(project);

      const configRow = configs.find(
        (c) => c.projectId === fetchResult.projectId
      );
      const config = configRow?.config;
      if (!configRow || !config) {
        throw new Error(
          `Config not found for project '${fetchResult.projectId}'`
        );
      }

      const customizedConfig: Config = {
        ...config,
        manuscript: {
          ...config.manuscript,
          script_prompt: customPrompt || config.manuscript.script_prompt,
        },
      };

      setConfig({ ...configRow, config: customizedConfig });

      state.loadingMessage = "Generating manuscript...";
      const manuscript = await generateManuscript(
        fetchResult.projectId,
        customizedConfig
      );

      if (!manuscript) {
        throw new Error("Backend did not return a manuscript");
      }

      const cleanedManuscript = {
        ...manuscript,
        meta: {
          ...manuscript.meta,
          articleUrl: fetchResult.projectId,
          uniqueId: crypto.randomUUID(),
        },
      };

      const tabsData = [
        {
          articleUrl: fetchResult.projectId,
          projectId: fetchResult.projectId,
          manuscript: cleanedManuscript,
        },
      ];
      setTabs(tabsData);
      setCustomPrompt(customPrompt);
      setCurrentTabIndex(0);

      const response = await fetch("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          projectId: fetchResult.projectId,
          brandId: brand.id,
          config: customizedConfig,
          project,
          data: tabsData,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create generation");
      }
      const { id: generationId } = await response.json();

      setGenerationId(generationId);
      cookies.set("projectId", fetchResult.projectId);

      router.push(`/${encodeURIComponent(generationId)}`);
    } catch (error) {
      if (error instanceof Error) {
        notification.error({ title: error.message, duration: 0 });
      } else {
        notification.error({ title: "Failed to fetch article", duration: 0 });
      }
    } finally {
      state.loading = false;
      state.loadingMessage = "Generating video...";
    }
  };

  if (loadingFetchers || loadingBrands) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="vf-spinner" />
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Loading fetchers and brands...
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center px-4 py-16"
      style={{ minHeight: "100vh" }}
    >
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="vf-logo" style={{ fontSize: 52, marginBottom: 8 }}>
          Video<span>fy</span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 15, margin: 0 }}>
          Select a fetcher, provide inputs, and generate a video.
        </p>
      </div>

      {/* Card */}
      <div className="vf-card w-full" style={{ maxWidth: "80ch" }}>
        {!hasFetchers && (
          <div className="vf-alert vf-alert-warning mb-4">
            <strong>No fetchers found</strong>
            <p style={{ margin: "4px 0 0" }}>
              Add fetchers under minimal/fetchers/&lt;fetcherId&gt;/fetcher.json,
              then refresh.
            </p>
          </div>
        )}
        {!hasBrands && (
          <div className="vf-alert vf-alert-warning mb-4">
            <strong>No brands found</strong>
            <p style={{ margin: "4px 0 0" }}>
              Add brand json files under minimal/brands/, then refresh.
            </p>
          </div>
        )}

        <Form form={form} onFinish={loadManuscript} layout="vertical">
          <Form.Item
            name="fetcherId"
            label="Fetcher"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              disabled={!hasFetchers}
              options={fetchers?.map((fetcher) => ({
                value: fetcher.id,
                label: fetcher.title,
              }))}
            />
          </Form.Item>

          {selectedFetcher?.description && (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: -8,
                marginBottom: 16,
              }}
            >
              {selectedFetcher.description}
            </p>
          )}

          {selectedFetcherFields.map((field) => (
            <Form.Item
              key={field.name}
              name={["inputs", field.name]}
              label={field.label}
              preserve={false}
              rules={
                field.required
                  ? [{ required: true, message: `${field.label} is required` }]
                  : undefined
              }
            >
              <Input placeholder={field.placeholder} />
            </Form.Item>
          ))}

          <Form.Item
            name="brandId"
            label="Brand"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              disabled={!hasBrands}
              options={brands?.map((brand) => ({
                value: brand.id,
                label: brand.brandName,
              }))}
            />
          </Form.Item>

          <Form.Item noStyle>
            <Form.Item
              label="Custom prompt"
              name="prompt"
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea rows={10} />
            </Form.Item>
          </Form.Item>

          {selectedBrand && (
            <p
              style={{
                color: "var(--text-faint)",
                fontSize: 12,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              Prompt source: {selectedBrand.brandName}
            </p>
          )}

          <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
            <button
              type="submit"
              className="vf-btn vf-btn-primary"
              disabled={state.loading || !hasFetchers || !hasBrands}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {state.loading ? (
                <>
                  <div className="vf-spinner" />
                  {state.loadingMessage}
                </>
              ) : (
                "Generate video"
              )}
            </button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default StartPage;
