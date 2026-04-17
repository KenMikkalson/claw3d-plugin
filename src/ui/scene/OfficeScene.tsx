/**
 * Minimal 3D-office placeholder. The real Three.js / React-Three-Fiber scene
 * will replace this file without changing its public props surface.
 *
 * The current implementation is a CSS isometric projection: it communicates
 * "desks with agent avatars" without pulling in Three.js at bundle time, so
 * the plugin boots instantly. When the renderer lands, import R3F here and
 * keep the same export.
 */

import { useMemo, type CSSProperties } from "react";

export interface OfficeSceneProps {
  agents: ReadonlyArray<{
    id: string;
    name: string;
    status: string;
  }>;
  deskIds: ReadonlyArray<string>;
  deskMap: Record<string, { deskId: string }>;
  floorColor: string;
  accentColor: string;
  /** When true, the scene is allowed to use the full available viewport. */
  fullBleed?: boolean;
}

interface DeskPlacement {
  deskId: string;
  agentId: string | null;
  agentName: string | null;
  status: string | null;
}

/**
 * Normalise an agent's display name into a desk suffix candidate so we can
 * match "Týr" → "tyr", "MIM-1 · Odin" → "odin", etc. against desk IDs of the
 * form `desk-<name>`. Strips combining marks and non-alphanumeric characters.
 */
function nameSuffixes(name: string): string[] {
  const folded = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining marks (ý → y)
    .toLowerCase();
  // Split on anything that isn't [a-z0-9] and keep the pieces that are non-empty.
  const parts = folded.split(/[^a-z0-9]+/).filter(Boolean);
  // Return most-specific-first so "dev-odin" doesn't match a desk-dev first.
  return [parts.join("-"), ...parts.reverse()];
}

function layoutAgents(
  agents: OfficeSceneProps["agents"],
  deskIds: OfficeSceneProps["deskIds"],
  deskMap: OfficeSceneProps["deskMap"],
): DeskPlacement[] {
  const placements = new Map<string, DeskPlacement>();
  for (const deskId of deskIds) {
    placements.set(deskId, { deskId, agentId: null, agentName: null, status: null });
  }
  const seated = new Set<string>();

  const seat = (slot: DeskPlacement, agent: OfficeSceneProps["agents"][number]) => {
    slot.agentId = agent.id;
    slot.agentName = agent.name;
    slot.status = agent.status;
    seated.add(agent.id);
  };

  // 1. Explicit operator-configured assignments win.
  for (const agent of agents) {
    const assignment = deskMap[agent.id];
    if (!assignment) continue;
    const slot = placements.get(assignment.deskId);
    if (!slot || slot.agentId) continue;
    seat(slot, agent);
  }

  // 2. Fall back to a name match: agent "Odin" prefers `desk-odin`. This keeps
  //    the default Norse layout sensible without requiring operator config.
  for (const agent of agents) {
    if (seated.has(agent.id)) continue;
    for (const suffix of nameSuffixes(agent.name)) {
      if (!suffix) continue;
      const deskId = `desk-${suffix}`;
      const slot = placements.get(deskId);
      if (!slot || slot.agentId) continue;
      seat(slot, agent);
      break;
    }
  }

  // 3. Finally fill remaining desks in order with any still-unseated agents.
  const remaining = agents.filter((a) => !seated.has(a.id));
  let cursor = 0;
  for (const slot of placements.values()) {
    if (slot.agentId) continue;
    const next = remaining[cursor++];
    if (!next) break;
    seat(slot, next);
  }

  return [...placements.values()];
}

function statusHue(status: string | null): string {
  switch (status) {
    case "idle":
      return "#64748b";
    case "running":
    case "working":
      return "#22c55e";
    case "pending_approval":
      return "#eab308";
    case "error":
    case "terminated":
      return "#ef4444";
    case "paused":
      return "#a855f7";
    default:
      return "#94a3b8";
  }
}

export function OfficeScene(props: OfficeSceneProps) {
  const placements = useMemo(
    () => layoutAgents(props.agents, props.deskIds, props.deskMap),
    [props.agents, props.deskIds, props.deskMap],
  );

  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: props.fullBleed ? "100%" : "320px",
    minHeight: "240px",
    background: `linear-gradient(160deg, ${props.floorColor} 0%, #020617 100%)`,
    borderRadius: 8,
    overflow: "hidden",
    perspective: 900,
    perspectiveOrigin: "50% 30%",
  };

  const floorStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    transform: "rotateX(58deg) translateY(20%)",
    transformOrigin: "50% 50%",
    background:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 48px)," +
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 48px)",
  };

  // Arrange desks in a 4×2 grid in screen space for the placeholder.
  const columns = 4;

  return (
    <div style={containerStyle} aria-label="Claw3D office scene">
      <div style={floorStyle} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: "1fr",
          gap: 12,
          padding: 24,
        }}
      >
        {placements.map((slot) => (
          <div
            key={slot.deskId}
            title={slot.deskId}
            style={{
              position: "relative",
              background: "rgba(15, 23, 42, 0.55)",
              border: `1px solid ${props.accentColor}33`,
              borderRadius: 6,
              boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
              color: "#e2e8f0",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: slot.agentId
                  ? props.accentColor
                  : "rgba(148, 163, 184, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f172a",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {slot.agentName ? slot.agentName.slice(0, 1).toUpperCase() : "·"}
            </div>
            <div style={{ fontWeight: 600 }}>
              {slot.agentName ?? <em style={{ opacity: 0.6 }}>empty</em>}
            </div>
            <div style={{ fontSize: 10, opacity: 0.75 }}>{slot.deskId}</div>
            {slot.status && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  color: statusHue(slot.status),
                }}
              >
                ● {slot.status}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
