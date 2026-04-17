/**
 * OfficeLauncher — the full-screen modal target for the
 * `claw3d-office-launcher` launcher declared in `manifest.ts`.
 *
 * The host loads this component inside its overlay container with `bounds:
 * "wide"`. We fill the bounds with the same <OfficeScene> the widget uses,
 * only with `fullBleed` so the scene expands to the available viewport
 * instead of falling back to the 320px widget height.
 */

import { useEffect, type CSSProperties } from "react";
import {
  useHostContext,
  usePluginData,
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

const shellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 480,
  gap: 12,
  padding: 16,
  color: "var(--foreground, #e2e8f0)",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
};

export function OfficeLauncher() {
  const context = useHostContext();
  const companyId = context.companyId ?? undefined;

  const agentsQuery = usePluginData<{ agents: AgentListItem[] }>(
    DATA_KEYS.agents,
    companyId ? { companyId } : undefined,
  );
  const layoutQuery = usePluginData<OfficeLayout>(DATA_KEYS.officeLayout);
  const configQuery = usePluginData<ConfigSnapshot>(DATA_KEYS.config);

  // Poll while the launcher is open. Stream endpoint would be ideal but the
  // host doesn't wire `bridgeDeps.streamBus`; see DashboardWidget header.
  useEffect(() => {
    const id = window.setInterval(() => {
      agentsQuery.refresh();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [agentsQuery]);

  // Request the widest modal bounds the host will give us while open.
  useEffect(() => {
    const env = context.renderEnvironment;
    if (!env?.requestModalBounds) return;
    void env.requestModalBounds({ bounds: "wide" });
  }, [context.renderEnvironment]);

  const agents = agentsQuery.data?.agents ?? [];
  const layout = layoutQuery.data;
  const floorColor = configQuery.data?.floorColor ?? DEFAULT_CONFIG.floorColor;
  const accentColor =
    configQuery.data?.accentColor ?? DEFAULT_CONFIG.accentColor;

  return (
    <div style={shellStyle} aria-label="Claw3D full office view">
      <div style={headerStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <strong style={{ fontSize: 16 }}>Claw3D · Office</strong>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {agents.length} agents
          </span>
        </div>
        {agentsQuery.error && (
          <span style={{ fontSize: 12, color: "#fca5a5" }}>
            {agentsQuery.error.message}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <OfficeScene
          agents={agents}
          deskIds={layout?.deskIds ?? []}
          deskMap={layout?.deskMap ?? {}}
          floorColor={floorColor}
          accentColor={accentColor}
          fullBleed
        />
      </div>
    </div>
  );
}
