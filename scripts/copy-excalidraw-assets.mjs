// Copies the drawing studio's fonts into public/ so they're served from this
// site instead of a third-party CDN. Runs before `dev` and `build`.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules/@excalidraw/excalidraw/dist/prod/fonts");
const to = join(root, "public/excalidraw-assets/fonts");
if (!existsSync(from)) {
  console.warn("Excalidraw fonts not found; skipping.");
  process.exit(0);
}
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log("Copied drawing studio fonts to public/excalidraw-assets");
