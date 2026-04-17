/**
 * Claw3D plugin — shared constants.
 *
 * The plugin is a launcher shim for the real Claw3D app
 * (https://github.com/iamlukethedev/Claw3D), which runs as its own Next.js
 * container. We originally shipped an in-dashboard 3D scene here — the pivot
 * was driven by the realisation that Claw3D is a fully-featured product we
 * should deploy alongside Paperclip and link to, not reimplement.
 *
 * IDs and export names live here so the manifest, worker, and UI stay in
 * sync across edits.
 */

export const PLUGIN_ID = "mimrlabs-claw3d";
export const PLUGIN_VERSION = "0.2.0";

/** Slot IDs referenced from the manifest. */
export const SLOT_IDS = {
  dashboardWidget: "claw3d-dashboard-widget",
  sidebar: "claw3d-sidebar",
  settingsPage: "claw3d-settings",
} as const;

/** Named UI exports — must match the keys on the `./dist/ui/index.js` module. */
export const EXPORT_NAMES = {
  dashboardWidget: "DashboardWidget",
  sidebar: "SidebarLink",
  settingsPage: "SettingsPage",
} as const;

/** Keys used by `usePluginData` / `ctx.data.register`. */
export const DATA_KEYS = {
  /** Operator config snapshot (officeUrl, openInNewTab). */
  config: "plugin-config",
} as const;

/**
 * Default operator-editable config. Mirrored into the manifest's
 * `instanceConfigSchema`. Central source of truth for initial values.
 */
export const DEFAULT_CONFIG = {
  /** URL of the deployed Claw3D app. Overridden via SettingsPage per instance. */
  officeUrl: "https://office.mimrlabs.cloud",
  /** Whether the launcher should open in a new tab (true) or replace the current one. */
  openInNewTab: true,
} as const;

export type Claw3dConfig = typeof DEFAULT_CONFIG;
