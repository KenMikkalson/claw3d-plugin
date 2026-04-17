/**
 * Claw3D plugin UI bundle — re-exports every slot component under the name
 * declared in `constants.ts`. The host loads this file as a single ES module
 * from `/_plugins/<id>/ui/index.js` at runtime.
 *
 * `DashboardWidget` is intentionally not exported in 0.3.0 — Kenny wanted
 * the center-of-dashboard tile removed, keeping only the sidebar entry. The
 * source file is preserved and can be re-exported + re-added to the manifest
 * slots list if we ever want the tile back.
 */

export { SidebarLink } from "./SidebarLink.js";
export { SettingsPage } from "./SettingsPage.js";
