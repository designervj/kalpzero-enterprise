import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ReduxProvider } from "@/components/providers/redux-provider";

import { ChunkErrorListener } from "@/components/providers/ChunkErrorListener";

import "./globals.css";

const headingFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading"
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "KalpZero Enterprise",
  description: "Canonical rebuild workspace for the KalpZero enterprise platform.",
  icons: {
    icon: '/img/favicon-img.svg',
  }
};

import { ThemeProvider } from "@/components/providers/theme-provider";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('kalp-front-mode');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (!mode && supportDarkMode) mode = 'dark';
                  if (!mode) mode = 'dark';
                  document.documentElement.setAttribute('data-theme-mode', mode);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${headingFont.variable} ${bodyFont.variable} font-body antialiased`}>
        <ChunkErrorListener />
        <ThemeProvider storageKey="kalp-front-mode">
          <ReduxProvider>
            <AuthProvider>{children}</AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
