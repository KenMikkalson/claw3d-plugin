import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import {
  DEFAULT_CONFIG,
  EXPORT_NAMES,
  PLUGIN_ID,
  PLUGIN_VERSION,
  SLOT_IDS,
} from "./constants.js";

/**
 * Claw3D is deployed as a separate Next.js app (see docker-compose "claw3d"
 * service). This plugin's job is to surface a dashboard tile and a sidebar
 * entry inside Paperclip that link straight to it.
 *
 * No in-dashboard modal launcher, no 3D scene in the widget — the office
 * renders in its own tab where the real product was designed to run.
 */
const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Claw3D — Office Launcher",
  description:
    "Dashboard + sidebar launcher for the Claw3D 3D office. Opens the " +
    "deployed Claw3D app (default: office.mimrlabs.cloud) in a new tab.",
  author: "MIMR Labs",
  categories: ["ui"],
  capabilities: [
    "ui.dashboardWidget.register",
    "ui.sidebar.register",
    "ui.page.register",
    "plugin.state.read",
    "plugin.state.write",
    "instance.settings.register",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      officeUrl: {
        type: "string",
        title: "Claw3D office URL",
        description:
          "Absolute URL (including scheme) of the deployed Claw3D app. " +
          "The launcher tile and sidebar link both point here.",
        default: DEFAULT_CONFIG.officeUrl,
        format: "uri",
      },
      openInNewTab: {
        type: "boolean",
        title: "Open in new tab",
        description:
          "When on, clicking the launcher opens Claw3D in a new tab " +
          "(recommended). When off, it replaces the current tab.",
        default: DEFAULT_CONFIG.openInNewTab,
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
  },
};

export default manifest;
