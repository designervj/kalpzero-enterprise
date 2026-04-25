import type { ReactNode } from "react";

import { DocsShell } from "@/components/docs/DocsShell";

export const metadata = {
  title: "Kalp Platform Docs",
  description: "Product and platform documentation for KalpZero Enterprise."
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
