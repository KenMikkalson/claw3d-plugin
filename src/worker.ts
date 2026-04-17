/**
 * Claw3D — plugin worker.
 *
 * The plugin is a thin launcher that opens the deployed Claw3D app in a new
 * tab. All 3D rendering, agent visualisation, and live data lives in Claw3D
 * itself; this worker only exposes the operator-editable config (office URL
 * and new-tab behaviour) so the UI can read it.
 */

import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { DATA_KEYS, DEFAULT_CONFIG } from "./constants.js";

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("claw3d launcher plugin starting", {
      version: ctx.manifest.version,
    });

    ctx.data.register(DATA_KEYS.config, async () => {
      const raw = (await ctx.config.get()) ?? {};
      return { ...DEFAULT_CONFIG, ...(raw as Record<string, unknown>) };
    });
  },

  async onHealth() {
    return { status: "ok", message: "claw3d launcher ready" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
