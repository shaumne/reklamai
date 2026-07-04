import type { ReactNode } from "react";

// Root layout is a passthrough; the [locale] layout owns <html> so the
// lang attribute matches the active locale.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
