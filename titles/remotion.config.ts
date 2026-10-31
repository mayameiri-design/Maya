/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Cloud/sandbox: use the pre-installed Chromium instead of downloading
// Chrome Headless Shell (remotion.media is blocked there). On a normal
// machine this file does not exist and Remotion uses its own browser.
import { existsSync } from "node:fs";
const SYSTEM_CHROME = "/opt/pw-browsers/chromium";
if (existsSync(SYSTEM_CHROME)) {
  Config.setBrowserExecutable(SYSTEM_CHROME);
  Config.setChromeMode("chrome-for-testing");
}
