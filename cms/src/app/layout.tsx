import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import { type ReactNode } from "react";
import "./globals.css";
import Main from "./Main";
import { AntdRegistry } from "@ant-design/nextjs-registry";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Videofy",
  description: "Generate videos from articles using AI with videofy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AntdRegistry>
      <Main fontVars={`${firaCode.variable} ${firaSans.variable}`}>
        {children}
      </Main>
    </AntdRegistry>
  );
}
