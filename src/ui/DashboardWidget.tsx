/**
 * Claw3D dashboard widget — launcher tile.
 *
 * A compact card that advertises the 3D office and sends the operator there
 * in a new tab. The full 3D experience lives in the deployed Claw3D app
 * (default: office.mimrlabs.cloud); we don't reimplement it here.
 */

import type { CSSProperties } from "react";
import {
  usePluginData,
  type PluginWidgetProps,
} from "@paperclipai/plugin-sdk/ui";
import { DATA_KEYS, DEFAULT_CONFIG } from "../constants.js";

interface ConfigSnapshot {
  officeUrl?: string;
  openInNewTab?: boolean;
}

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 14,
  borderRadius: 8,
  background: "var(--card, #0f172a)",
  color: "var(--card-foreground, #e2e8f0)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};

const heroStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  borderRadius: 6,
  overflow: "hidden",
  // Subtle isometric backdrop — purely decorative. The real thing lives at
  // the office URL; we're just hinting that there's a 3D view behind the
  // button without trying to render one here.
  background:
    "radial-gradient(120% 80% at 50% 0%, rgba(56,189,248,0.25) 0%, rgba(15,23,42,0) 55%)," +
    "linear-gradient(160deg, #0b1220 0%, #020617 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(56,189,248,0.18)",
};

const heroTextStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.65,
};

const titleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 8,
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 12px",
  background: "#38bdf8",
  color: "#0f172a",
  fontWeight: 600,
  fontSize: 13,
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
};

export function DashboardWidget({ context: _context }: PluginWidgetProps) {
  const configQuery = usePluginData<ConfigSnapshot>(DATA_KEYS.config);
  const officeUrl = configQuery.data?.officeUrl ?? DEFAULT_CONFIG.officeUrl;
  const openInNewTab =
    configQuery.data?.openInNewTab ?? DEFAULT_CONFIG.openInNewTab;

  return (
    <div style={cardStyle} aria-label="Claw3D office launcher">
      <div style={titleRowStyle}>
        <strong style={{ fontSize: 14 }}>Claw3D · Office</strong>
        <span style={{ fontSize: 11, opacity: 0.65 }}>{hostLabel(officeUrl)}</span>
      </div>

      <a
        href={officeUrl}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noreferrer noopener" : undefined}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div style={heroStyle} role="img" aria-label="Claw3D office preview">
          <span style={heroTextStyle}>3D Virtual Office</span>
        </div>
      </a>

      <p style={{ margin: 0, fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>
        Watch Odin and the team in the shared workspace. Runs in its own
        window — click below to open.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <a
          href={officeUrl}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noreferrer noopener" : undefined}
          style={primaryButtonStyle}
        >
          Open Office
          {openInNewTab ? <ExternalIcon /> : null}
        </a>
        {configQuery.error && (
          <span style={{ fontSize: 11, color: "#fca5a5" }}>
            config load failed
          </span>
        )}
      </div>
    </div>
  );
}

function hostLabel(raw: string): string {
  try {
    return new URL(raw).host;
  } catch {
    return raw;
  }
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3h7v7" />
      <path d="M10 14L21 3" />
      <path d="M21 14v7h-7" />
      <path d="M3 10v11h11" />
    </svg>
  );
}
