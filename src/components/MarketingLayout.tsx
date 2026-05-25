import type { ReactNode } from "react";
import { MarketingNav } from "./MarketingNav";
import { MarketingFooter } from "./MarketingFooter";

const lightModeVars = {
  "--background": "#f0f0e8",
  "--background-alt": "#1a1a1a",
  "--surface": "#ffffff",
  "--surface-alt": "#e8e8e0",
  "--surface-strong": "#1a1a1a",
  "--surface-muted": "#d8d8d0",
  "--foreground": "#1a1a1a",
  "--foreground-muted": "#888888",
  "--foreground-subtle": "#aaaaaa",
  "--foreground-inverse": "#f0f0e8",
  "--border": "#1a1a1a",
  "--border-subtle": "#cccccc",
  "--accent": "#0c3953",
  "--accent-hover": "#14516e",
  "--accent-light": "#8bb6c8",
  "--accent-text": "#0c3953",
  "--shadow-color": "#1a1a1a",
  "--shadow-accent": "rgba(12,57,83,1)",
} as React.CSSProperties;

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen font-mono selection:bg-[#2d5a2d] selection:text-[#f0f0e8]"
      style={{
        ...lightModeVars,
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <MarketingNav />
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
