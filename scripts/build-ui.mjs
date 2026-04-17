/**
 * Claw3D — UI bundle builder.
 *
 * Bundles `src/ui/index.tsx` into `dist/ui/index.js` as an ES module. React,
 * react-dom, and the plugin SDK's `/ui` subpath are externalised: the host
 * app provides them at load time via import maps (spec §19.0.2), so shipping
 * our own copies would double-load React and break hook identity.
 *
 * Usage:
 *   node scripts/build-ui.mjs            # one-shot build
 *   node scripts/build-ui.mjs --watch    # rebuild on change (for dev)
 */

import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");

const watch = process.argv.includes("--watch");

/** @type {import("esbuild").BuildOptions} */
const buildOptions = {
  entryPoints: [path.join(packageRoot, "src/ui/index.tsx")],
  outfile: path.join(packageRoot, "dist/ui/index.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  sourcemap: true,
  jsx: "automatic",
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@paperclipai/plugin-sdk/ui",
  ],
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("[claw3d] UI bundle watching…");
} else {
  await esbuild.build(buildOptions);
}
