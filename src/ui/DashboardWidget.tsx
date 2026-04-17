/**
 * Claw3D dashboard widget — a compact card that renders the office scene with
 * live agent status. Dropped onto the main Paperclip dashboard.
 *
 * Data flow:
 *   worker `agents` getData        →  usePluginData("agents")
 *   worker `office-layout` getData →  usePluginData("office-layout")
 *   worker `activity` SSE stream   →  usePluginStream("activity")  (bumps a
 *                                      "recently active" highlight, so the
 *                                      placeholder scene visibly reacts to
 *                                      host events even before R3F lands)
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  usePluginData,
  usePluginStream,
  type PluginWidgetProps,
} from "@paperclipai/plugin-sdk/ui";
import { DATA_KEYS, DEFAULT_CONFIG, STREAM_CHANNELS } from "../constants.js";
import { OfficeScene } from "./scene/OfficeScene.js";

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

interface ActivityEvent {
  eventId: string;
  eventType: string;
  actorId: string | null;
  actorType: string | null;
  entityId: string | null;
  entityType: string | null;
  occurredAt: string;
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
  const stream = usePluginStream<ActivityEvent>(
    STREAM_CHANNELS.activity,
    companyId ? { companyId } : undefined,
  );

  // Re-poll the agent list whenever the stream tells us something changed —
  // cheap, and keeps the placeholder feeling alive without Three.js yet.
  const lastEventId = stream.lastEvent?.eventId ?? null;
  useEffect(() => {
    if (!lastEventId) return;
    agentsQuery.refresh();
  }, [lastEventId, agentsQuery]);

  const [collapsed, setCollapsed] = useState(false);

  const agents = agentsQuery.data?.agents ?? [];
  const layout = layoutQuery.data;
  const floorColor = configQuery.data?.floorColor ?? DEFAULT_CONFIG.floorColor;
  const accentColor =
    configQuery.data?.accentColor ?? DEFAULT_CONFIG.accentColor;

  const statusBadge = useMemo(() => {
    if (agentsQuery.loading) return "loading…";
    if (agentsQuery.error) return `error: ${agentsQuery.error.code}`;
    const live = stream.connected ? "● live" : stream.connecting ? "● …" : "○";
    return `${agents.length} agents · ${live}`;
  }, [
    agents.length,
    agentsQuery.error,
    agentsQuery.loading,
    stream.connected,
    stream.connecting,
  ]);

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
