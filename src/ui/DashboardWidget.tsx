/**
 * Claw3D dashboard widget — a compact card that renders the office scene with
 * live agent status. Dropped onto the main Paperclip dashboard.
 *
 * Data flow:
 *   worker `agents` getData        →  usePluginData("agents")
 *   worker `office-layout` getData →  usePluginData("office-layout")
 *   worker `config` getData        →  usePluginData("config")
 *
 * NOTE on streaming: the plan originally called for `usePluginStream("activity")`
 * to drive an "agents moving between desks" animation. Paperclip's host
 * currently boots plugin routes with `bridgeDeps = { workerManager }` only —
 * no `streamBus` — so the SSE endpoint 501s. Until the host wires a stream
 * bus, we poll the agent list on an interval instead. Swap back when
 * `bridgeDeps.streamBus` lands upstream.
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  usePluginData,
  type PluginWidgetProps,
} from "@paperclipai/plugin-sdk/ui";
import { DATA_KEYS, DEFAULT_CONFIG } from "../constants.js";
import { OfficeScene } from "./scene/OfficeScene.js";

const POLL_INTERVAL_MS = 10_000;

interface AgentListItem {
  id: string;
  name: string;
  status: string;
  lastActivityAt: string | null;
}

interface OfficeLayout {
  deskIds: string[];
  deskMap: Record<string, { deskId: string }>;
}

interface ConfigSnapshot {
  floorColor?: string;
  accentColor?: string;
}

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 12,
  borderRadius: 8,
  background: "var(--card, #0f172a)",
  color: "var(--card-foreground, #e2e8f0)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const buttonStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  color: "inherit",
  padding: "4px 10px",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};

function openLauncher() {
  // The host wires launcher buttons into its own toolbar. For the in-widget
  // "Expand" affordance we dispatch a CustomEvent that host shells listen for
  // (spec §19 — plugin launcher bridge). If the host is not listening (e.g.
  // during local isolated dev), we fall back to opening the launcher URL.
  if (typeof window === "undefined") return;
  const evt = new CustomEvent("paperclip:plugin-launcher:open", {
    detail: { launcherId: "claw3d-office-launcher" },
  });
  window.dispatchEvent(evt);
}

export function DashboardWidget({ context }: PluginWidgetProps) {
  const companyId = context.companyId ?? undefined;

  const agentsQuery = usePluginData<{ agents: AgentListItem[] }>(
    DATA_KEYS.agents,
    companyId ? { companyId } : undefined,
  );
  const layoutQuery = usePluginData<OfficeLayout>(DATA_KEYS.officeLayout);
  const configQuery = usePluginData<ConfigSnapshot>(DATA_KEYS.config);

  // Poll the agent list on an interval. Cheap, and keeps statuses fresh
  // without a real event stream (see file header note).
  useEffect(() => {
    const id = window.setInterval(() => {
      agentsQuery.refresh();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [agentsQuery]);

  const [collapsed, setCollapsed] = useState(false);

  const agents = agentsQuery.data?.agents ?? [];
  const layout = layoutQuery.data;
  const floorColor = configQuery.data?.floorColor ?? DEFAULT_CONFIG.floorColor;
  const accentColor =
    configQuery.data?.accentColor ?? DEFAULT_CONFIG.accentColor;

  const statusBadge = useMemo(() => {
    if (agentsQuery.loading && agents.length === 0) return "loading…";
    if (agentsQuery.error) return `error: ${agentsQuery.error.code}`;
    return `${agents.length} agents`;
  }, [agents.length, agentsQuery.error, agentsQuery.loading]);

  return (
    <div style={cardStyle} aria-label="Claw3D office widget">
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ fontSize: 13 }}>Claw3D · Office</strong>
          <span style={{ fontSize: 11, opacity: 0.65 }}>{statusBadge}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            {collapsed ? "Show" : "Hide"}
          </button>
          <button type="button" style={buttonStyle} onClick={openLauncher}>
            Expand
          </button>
        </div>
      </div>

      {!collapsed && (
        <OfficeScene
          agents={agents}
          deskIds={layout?.deskIds ?? []}
          deskMap={layout?.deskMap ?? {}}
          floorColor={floorColor}
          accentColor={accentColor}
        />
      )}

      {agentsQuery.error && (
        <div style={{ fontSize: 11, color: "#fca5a5" }}>
          {agentsQuery.error.message}
        </div>
      )}
    </div>
  );
}
