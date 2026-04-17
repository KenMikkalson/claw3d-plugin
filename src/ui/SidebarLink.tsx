/**
 * Sidebar entry — a single link under the global Paperclip sidebar that
 * triggers the full-screen office launcher. Purely presentational: data
 * fetching happens inside the modal, not here.
 */

import type { CSSProperties } from "react";
import {
  useHostContext,
  type PluginSidebarProps,
} from "@paperclipai/plugin-sdk/ui";
import { LAUNCHER_IDS } from "../constants.js";

const linkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px",
  borderRadius: 6,
  color: "inherit",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  background: "transparent",
  border: "none",
  width: "100%",
  textAlign: "left",
};

function openLauncher() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("paperclip:plugin-launcher:open", {
      detail: { launcherId: LAUNCHER_IDS.office },
    }),
  );
}

export function SidebarLink(_props: PluginSidebarProps) {
  // Reading context is a no-op here, but surfaces the host context for
  // future per-company theming without a prop-shape change.
  useHostContext();
  return (
    <button
      type="button"
      onClick={openLauncher}
      style={linkStyle}
      aria-label="Open Claw3D office view"
    >
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="10" width="18" height="10" rx="1.5" />
        <path d="M3 10l9-6 9 6" />
        <path d="M9 20v-5h6v5" />
      </svg>
      <span>Office</span>
    </button>
  );
}
