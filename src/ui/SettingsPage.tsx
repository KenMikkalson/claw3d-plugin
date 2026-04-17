/**
 * SettingsPage — operator-facing form for the Claw3D launcher.
 *
 * Config is minimal: where does the deployed Claw3D app live, and should we
 * open it in a new tab. Writes go through the host's plugin config endpoint
 * (`ctx.config` is read-only from the worker, so there's no update-config
 * RPC to round-trip through).
 */

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  usePluginData,
  type PluginSettingsPageProps,
} from "@paperclipai/plugin-sdk/ui";
import { DATA_KEYS, DEFAULT_CONFIG, PLUGIN_ID } from "../constants.js";

type ConfigShape = {
  officeUrl: string;
  openInNewTab: boolean;
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
    officeUrl:
      typeof r.officeUrl === "string" && r.officeUrl.trim()
        ? r.officeUrl
        : DEFAULT_CONFIG.officeUrl,
    openInNewTab:
      typeof r.openInNewTab === "boolean"
        ? r.openInNewTab
        : DEFAULT_CONFIG.openInNewTab,
  };
}

export function SettingsPage(_props: PluginSettingsPageProps) {
  const configQuery = usePluginData<Record<string, unknown>>(DATA_KEYS.config);
  const initial = useMemo(() => mergeDefaults(configQuery.data), [configQuery.data]);

  const [form, setForm] = useState<ConfigShape>(() => mergeDefaults(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!configQuery.data) return;
    setForm(initial);
  }, [configQuery.data, initial]);

  function setField<K extends keyof ConfigShape>(key: K, value: ConfigShape[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    try {
      // Surface a clear error before the server does for the most common
      // misconfig: a bare hostname with no scheme.
      new URL(form.officeUrl);
    } catch {
      setError("Office URL must be absolute — include https:// or http://.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/plugins/${PLUGIN_ID}/config`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ configJson: form }),
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
          The dashboard tile and sidebar link point at the deployed Claw3D app.
          Change the URL here if you self-host it somewhere other than the
          default.
        </p>
      </div>

      <label style={fieldStyle}>
        <span>Office URL</span>
        <input
          style={inputStyle}
          type="url"
          value={form.officeUrl}
          placeholder={DEFAULT_CONFIG.officeUrl}
          onChange={(e) => setField("officeUrl", e.target.value)}
          required
        />
        <small style={{ opacity: 0.7, fontSize: 11 }}>
          Include the scheme. Example: https://office.mimrlabs.cloud
        </small>
      </label>

      <label style={{ ...fieldStyle, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={form.openInNewTab}
          onChange={(e) => setField("openInNewTab", e.target.checked)}
        />
        <span>Open in a new tab</span>
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
