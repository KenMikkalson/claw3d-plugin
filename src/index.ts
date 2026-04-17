/**
 * Top-level module index.
 *
 * Re-exports the manifest as `default` so tooling that imports
 * `@mimrlabs/plugin-claw3d` gets the manifest directly. The worker and UI
 * entries are loaded by the Paperclip host via the `paperclipPlugin` keys in
 * `package.json`, not via this file.
 */
export { default } from "./manifest.js";
