/* eslint-disable */
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const binName = `msdf-atlas-gen${process.platform === "win32" ? ".exe" : ""}`;
const osPath = join("bin", process.platform);
const binPath = join("bin", process.platform, binName);
const buildPath = join("build", "bin", binName);

if (existsSync(binPath)) {
  process.exit(0);
}

if (!existsSync(buildPath)) {
  console.warn("msdf-atlas-gen not built yet!");
  process.exit(0);
}

if (!existsSync(osPath)) {
  mkdirSync(osPath, { recursive: true });
}

renameSync(buildPath, binPath);
