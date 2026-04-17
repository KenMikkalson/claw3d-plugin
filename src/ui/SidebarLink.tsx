/**
 * Sidebar entry — a single link under the global Paperclip sidebar that
 * opens the deployed Claw3D app (default: office.mimrlabs.cloud).
 */

import type { CSSProperties } from "react";
import {
  usePluginData,
  type PluginSidebarProps,
} from "@paperclipai/plugin-sdk/ui";
import { DATA_KEYS, DEFAULT_CONFIG } from "../constants.js";

interface ConfigSnapshot {
  officeUrl?: string;
  openInNewTab?: boolean;
}

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
  width: "100%",
};

export function SidebarLink(_props: PluginSidebarProps) {
  const configQuery = usePluginData<ConfigSnapshot>(DATA_KEYS.config);
  const officeUrl = configQuery.data?.officeUrl ?? DEFAULT_CONFIG.officeUrl;
  const openInNewTab =
    configQuery.data?.openInNewTab ?? DEFAULT_CONFIG.openInNewTab;

  return (
    <a
      href={officeUrl}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer noopener" : undefined}
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
    </a>
  );
}
