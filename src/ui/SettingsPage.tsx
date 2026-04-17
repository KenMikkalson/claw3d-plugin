/**
 * SettingsPage — operator-facing form for Claw3D instance config.
 *
 * Overrides the host's auto-generated JSON Schema form declared by
 * `manifest.ts:instanceConfigSchema`. The host still validates the submitted
 * config against that schema server-side, so the form here only needs to
 * surface the fields in a usable way.
 *
 * Reads via `usePluginData("plugin-config")` (handler registered in the
 * worker). Writes via POST to the host's plugin config endpoint, matching
 * the kitchen-sink reference — `ctx.config` is read-only from the worker so
 * there is no "update-config" action round-trip.
 */

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  usePluginData,
  type PluginSettingsPageProps,
} from "@paperclipai/plugin-sdk/ui";
import { DATA_KEYS, DEFAULT_CONFIG, PLUGIN_ID } from "../constants.js";

type ConfigShape = {
  cameraYawDeg: number;
  cameraPitchDeg: number;
  floorColor: string;
  accentColor: string;
  pollIntervalSeconds: number;
  agentDeskMap: Record<string, { deskId: string }>;
};

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 24,
  maxWidth: 640,
  color: "var(--foreground, #0f172a)",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
};

const inputStyle: CSSProperties = {
  padding: "6px 8px",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  borderRadius: 6,
  background: "var(--input, #fff)",
  color: "inherit",
  fontSize: 13,
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  minHeight: 120,
};

const primaryButtonStyle: CSSProperties = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 6,
  background: "#38bdf8",
  color: "#0f172a",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
};

function mergeDefaults(raw: Record<string, unknown> | null | undefined): ConfigShape {
  const r = raw ?? {};
  return {
    cameraYawDeg:
      typeof r.cameraYawDeg === "number"
        ? r.cameraYawDeg
        : DEFAULT_CONFIG.cameraYawDeg,
    cameraPitchDeg:
      typeof r.cameraPitchDeg === "number"
        ? r.cameraPitchDeg
        : DEFAULT_CONFIG.cameraPitchDeg,
    floorColor:
      typeof r.floorColor === "string" ? r.floorColor : DEFAULT_CONFIG.floorColor,
    accentColor:
      typeof r.accentColor === "string" ? r.accentColor : DEFAULT_CONFIG.accentColor,
    pollIntervalSeconds:
      typeof r.pollIntervalSeconds === "number"
        ? r.pollIntervalSeconds
        : DEFAULT_CONFIG.pollIntervalSeconds,
    agentDeskMap:
      r.agentDeskMap && typeof r.agentDeskMap === "object"
        ? (r.agentDeskMap as ConfigShape["agentDeskMap"])
        : { ...DEFAULT_CONFIG.agentDeskMap },
  };
}

export function SettingsPage(_props: PluginSettingsPageProps) {
  const configQuery = usePluginData<Record<string, unknown>>(DATA_KEYS.config);
  const initial = useMemo(() => mergeDefaults(configQuery.data), [configQuery.data]);

  const [form, setForm] = useState<ConfigShape>(() => mergeDefaults(null));
  const [deskMapText, setDeskMapText] = useState<string>(() =>
    JSON.stringify(DEFAULT_CONFIG.agentDeskMap, null, 2),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Hydrate the form once config arrives (and on subsequent refreshes if the
  // user hasn't edited yet — we key off configQuery.data identity).
  useEffect(() => {
    if (!configQuery.data) return;
    setForm(initial);
    setDeskMapText(JSON.stringify(initial.agentDeskMap, null, 2));
  }, [configQuery.data, initial]);

  function setField<K extends keyof ConfigShape>(key: K, value: ConfigShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    let deskMap: ConfigShape["agentDeskMap"];
    try {
      const parsed = JSON.parse(deskMapText || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("agentDeskMap must be a JSON object");
      }
      deskMap = parsed;
    } catch (err) {
      setError(`Desk map JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    const next: ConfigShape = { ...form, agentDeskMap: deskMap };
    setSaving(true);
    try {
      const response = await fetch(`/api/plugins/${PLUGIN_ID}/config`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ configJson: next }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Save failed: ${response.status}`);
      }
      setStatus("Saved");
      configQuery.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (configQuery.loading && !configQuery.data) {
    return <div style={pageStyle}>Loading Claw3D settings…</div>;
  }

  return (
    <form style={pageStyle} onSubmit={onSubmit}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18 }}>Claw3D Settings</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.7 }}>
          Camera defaults, theme colours, and which agents sit at which desks.
        </p>
      </div>

      <label style={fieldStyle}>
        <span>Camera yaw (degrees, −180 to 180)</span>
        <input
          style={inputStyle}
          type="number"
          min={-180}
          max={180}
          value={form.cameraYawDeg}
          onChange={(e) => setField("cameraYawDeg", Number(e.target.value))}
        />
      </label>

      <label style={fieldStyle}>
        <span>Camera pitch (degrees, 10 to 89)</span>
        <input
          style={inputStyle}
          type="number"
          min={10}
          max={89}
          value={form.cameraPitchDeg}
          onChange={(e) => setField("cameraPitchDeg", Number(e.target.value))}
        />
      </label>

      <label style={fieldStyle}>
        <span>Floor colour (hex)</span>
        <input
          style={inputStyle}
          type="text"
          value={form.floorColor}
          onChange={(e) => setField("floorColor", e.target.value)}
        />
      </label>

      <label style={fieldStyle}>
        <span>Accent colour (hex)</span>
        <input
          style={inputStyle}
          type="text"
          value={form.accentColor}
          onChange={(e) => setField("accentColor", e.target.value)}
        />
      </label>

      <label style={fieldStyle}>
        <span>Agent poll interval (seconds, 2 to 600)</span>
        <input
          style={inputStyle}
          type="number"
          min={2}
          max={600}
          value={form.pollIntervalSeconds}
          onChange={(e) =>
            setField("pollIntervalSeconds", Number(e.target.value))
          }
        />
      </label>

      <label style={fieldStyle}>
        <span>Agent → desk mapping (JSON)</span>
        <textarea
          style={textareaStyle}
          value={deskMapText}
          onChange={(e) => setDeskMapText(e.target.value)}
          spellCheck={false}
        />
        <small style={{ opacity: 0.7, fontSize: 11 }}>
          Keys are agent UUIDs. Values are {"{ deskId: string }"}. Desk IDs are
          defined by the active 3D scene version.
        </small>
      </label>

      {error && (
        <div style={{ color: "#b91c1c", fontSize: 12 }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button type="submit" style={primaryButtonStyle} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {status && (
          <span style={{ fontSize: 12, opacity: 0.75 }}>{status}</span>
        )}
      </div>
    </form>
  );
}
