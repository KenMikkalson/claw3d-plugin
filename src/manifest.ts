import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import {
  DEFAULT_CONFIG,
  EXPORT_NAMES,
  LAUNCHER_IDS,
  PLUGIN_ID,
  PLUGIN_VERSION,
  SLOT_IDS,
} from "./constants.js";

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Claw3D — Office View",
  description:
    "A 3D office visualisation of the MIMR Labs agent roster. " +
    "Ships a dashboard widget, a global sidebar link, an office settings page, " +
    "and a full-screen launcher modal for the expanded view.",
  author: "MIMR Labs",
  categories: ["ui"],
  capabilities: [
    // Data the widget reads.
    "companies.read",
    "agents.read",
    // For the ambient "agent moved between desks" animation loop.
    "events.subscribe",
    "plugin.state.read",
    "plugin.state.write",
    // Slot registrations declared below.
    "ui.dashboardWidget.register",
    "ui.sidebar.register",
    "ui.page.register",
    "ui.action.register",
    "instance.settings.register",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      cameraYawDeg: {
        type: "number",
        title: "Camera yaw (degrees)",
        description: "0 = facing north, 90 = east.",
        default: DEFAULT_CONFIG.cameraYawDeg,
        minimum: -180,
        maximum: 180,
      },
      cameraPitchDeg: {
        type: "number",
        title: "Camera pitch (degrees)",
        default: DEFAULT_CONFIG.cameraPitchDeg,
        minimum: 10,
        maximum: 89,
      },
      floorColor: {
        type: "string",
        title: "Floor colour",
        default: DEFAULT_CONFIG.floorColor,
      },
      accentColor: {
        type: "string",
        title: "Accent colour",
        default: DEFAULT_CONFIG.accentColor,
      },
      pollIntervalSeconds: {
        type: "integer",
        title: "Agent poll interval (seconds)",
        default: DEFAULT_CONFIG.pollIntervalSeconds,
        minimum: 2,
        maximum: 600,
      },
      agentDeskMap: {
        type: "object",
        title: "Agent → desk mapping",
        description:
          "JSON object keyed by agent UUID. Each value is { deskId: string }. " +
          "Desk IDs are defined by the active 3D scene version.",
        default: DEFAULT_CONFIG.agentDeskMap,
        additionalProperties: {
          type: "object",
          properties: {
            deskId: { type: "string" },
          },
          required: ["deskId"],
        },
      },
    },
  },
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: SLOT_IDS.dashboardWidget,
        displayName: "Claw3D — Office",
        exportName: EXPORT_NAMES.dashboardWidget,
      },
      {
        type: "sidebar",
        id: SLOT_IDS.sidebar,
        displayName: "Office",
        exportName: EXPORT_NAMES.sidebar,
      },
      {
        type: "settingsPage",
        id: SLOT_IDS.settingsPage,
        displayName: "Claw3D Settings",
        exportName: EXPORT_NAMES.settingsPage,
      },
    ],
    launchers: [
      {
        id: LAUNCHER_IDS.office,
        displayName: "Open Office",
        description: "Full-screen 3D office view.",
        placementZone: "toolbarButton",
        action: {
          type: "openModal",
          target: EXPORT_NAMES.officeLauncher,
        },
        render: {
          environment: "hostOverlay",
          bounds: "wide",
        },
      },
    ],
  },
};

export default manifest;
