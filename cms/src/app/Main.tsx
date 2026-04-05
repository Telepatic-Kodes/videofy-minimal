"use client";
import { StyleProvider } from "@ant-design/cssinjs";
import { App, ConfigProvider, Layout, theme } from "antd";
import type { ReactNode } from "react";

export default function Main({
  children,
  fontVars,
}: {
  children: ReactNode;
  fontVars?: string;
}) {
  return (
    <StyleProvider layer>
      <ConfigProvider
        wave={{ disabled: true }}
        theme={{
          hashed: false,
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#E11D48",
            fontSize: 16,
            fontFamily: "var(--font-body), system-ui, sans-serif",
            colorBgBase: "#0F0F23",
            colorBgContainer: "#121212",
            colorBgElevated: "#1a1a2e",
          },
          components: {
            TreeSelect: {
              indentSize: 12,
              controlItemBgHover: "rgba(0,0,0,0.09)",
            },
            Tabs: {
              colorPrimary: "#E11D48",
              itemActiveColor: "white",
            },
          },
        }}
      >
        <html lang="en" className={fontVars} style={{ height: "100%" }}>
          <body style={{ height: "100%", margin: 0 }}>
            <Layout style={{ minHeight: "100vh" }}>
              <App message={{ duration: 10 }}>{children}</App>
            </Layout>
          </body>
        </html>
      </ConfigProvider>
    </StyleProvider>
  );
}
