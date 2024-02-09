/* eslint-disable */
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";

if (process.env.GITHUB_ACTIONS !== "true") {
  console.warn("Not running in GitHub Actions");
  process.exit(0);
}

const binPath = resolve("bin");

const windowsInput = resolve(
  "msdf-atlas-gen-windows-latest",
  "Release",
  "msdf-atlas-gen.exe",
);
const windowsOutput = resolve("bin", "msdf-atlas-gen-win32.exe");

const macosInput = resolve("msdf-atlas-gen-macos-latest", "msdf-atlas-gen");
const macosOutput = resolve("bin", "msdf-atlas-gen-darwin");

const ubuntuInput = resolve("msdf-atlas-gen-ubuntu-latest", "msdf-atlas-gen");
const ubuntuOutput = resolve("bin", "msdf-atlas-gen-linux");

if (!existsSync(binPath)) {
  mkdirSync(binPath, { recursive: true });
}

renameSync(windowsInput, windowsOutput);
renameSync(macosInput, macosOutput);
renameSync(ubuntuInput, ubuntuOutput);
