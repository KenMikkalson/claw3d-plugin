/**
 * Claw3D plugin — shared constants.
 *
 * IDs and export names are declared once here so the manifest, worker, and UI
 * stay in sync when any of them change.
 */

export const PLUGIN_ID = "mimrlabs-claw3d";
export const PLUGIN_VERSION = "0.1.0";

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
  officeLauncher: "OfficeLauncher",
} as const;

/** Launcher ID (full-screen office modal). */
export const LAUNCHER_IDS = {
  office: "claw3d-office-launcher",
} as const;

/** Keys used by `usePluginData` / `ctx.data.register`. */
export const DATA_KEYS = {
  agents: "agents",
  recentActivity: "recent-activity",
  officeLayout: "office-layout",
  /** Operator config snapshot (theme colours, camera defaults, poll interval). */
  config: "plugin-config",
} as const;

/** Worker stream channels consumed by `usePluginStream`. */
export const STREAM_CHANNELS = {
  activity: "activity",
} as const;

/**
 * Default operator-editable config. Mirrored into the manifest's
 * `instanceConfigSchema`. Central source of truth for initial values.
 */
export const DEFAULT_CONFIG = {
  /** Camera yaw in degrees. 0 = facing north, 90 = east. */
  cameraYawDeg: 35,
  /** Camera pitch in degrees (looking down from above). */
  cameraPitchDeg: 55,
  /** Base ground theme colour (hex). */
  floorColor: "#1e293b",
  /** Accent colour used for agent desks/avatars. */
  accentColor: "#38bdf8",
  /** How often, in seconds, the widget re-polls agent status. */
  pollIntervalSeconds: 10,
  /**
   * JSON object mapping `agent.id` → `{ deskId: string }`. Operators edit this
   * through the SettingsPage to pin agents to specific desks in the office.
   * Shape kept loose in the schema because desk IDs are scene-version-specific.
   */
  agentDeskMap: {} as Record<string, { deskId: string }>,
} as const;

export type Claw3dConfig = typeof DEFAULT_CONFIG;
