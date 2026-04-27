/**
 * deploy.mjs — Auto-copy plugin files to the Obsidian vault after build.
 *
 * Reads VAULT_PATH from .env (or from the VAULT_PATH env var directly).
 * Copies: main.js, manifest.json, styles.css
 *
 * Usage: called automatically by `npm run build` and `npm run dev` via esbuild.config.mjs
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

function loadEnv(envPath) {
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return env;
}

const env = loadEnv(resolve(process.cwd(), ".env"));
const vaultPath = process.env.VAULT_PATH ?? env.VAULT_PATH;

if (!vaultPath) {
  console.warn("[deploy] ⚠️  VAULT_PATH not set — skipping auto-deploy.");
  console.warn("         Copy .env.example to .env and set your vault path.");
  process.exit(0);
}

const pluginsDir = join(vaultPath, ".obsidian", "plugins", "ebrain-gardener");

if (!existsSync(pluginsDir)) {
  mkdirSync(pluginsDir, { recursive: true });
  console.log(`[deploy] Created plugins dir: ${pluginsDir}`);
}

const files = ["main.js", "manifest.json", "styles.css"];
for (const file of files) {
  const src = resolve(process.cwd(), file);
  const dest = join(pluginsDir, file);
  if (!existsSync(src)) {
    console.warn(`[deploy] ⚠️  ${file} not found — skipping`);
    continue;
  }
  copyFileSync(src, dest);
}
console.log(`[deploy] ✅ Deployed to ${pluginsDir}`);
