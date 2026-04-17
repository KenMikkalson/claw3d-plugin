/**
 * Claw3D plugin UI bundle — re-exports every slot component under the name
 * declared in `constants.ts`. The host loads this file as a single ES module
 * from `/_plugins/<id>/ui/index.js` at runtime.
 */

export { DashboardWidget } from "./DashboardWidget.js";
export { SidebarLink } from "./SidebarLink.js";
export { SettingsPage } from "./SettingsPage.js";
