import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * This container image ships without the X/GTK/font shared libraries Chromium needs. When a
 * local dependency prefix exists under ~/.local/chromium-deps, expose it to the browser
 * process; on a machine with the normal system libraries this block does nothing.
 */
const localLibs = path.join(os.homedir(), ".local", "chromium-deps", "usr", "lib");
if (fs.existsSync(localLibs)) {
  process.env.LD_LIBRARY_PATH = [localLibs, process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(":");
  const fontConfig = path.join(os.homedir(), ".config", "fontconfig", "fonts.conf");
  if (fs.existsSync(fontConfig)) {
    process.env.FONTCONFIG_FILE = fontConfig;
  }
}

const port = 3104;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: ".orbi/playwright-results",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    screenshot: "only-on-failure",
    trace: "off",
  },
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: `http://127.0.0.1:${port}/laptops`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: { NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}` },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
