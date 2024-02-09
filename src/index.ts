// Based on https://github.com/Butterwell/mtsdf-fonts
import { execa } from "execa";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { loadSync } from "opentype.js";
import type { Font } from "opentype.js";

export enum AtlasFormats {
  bin,
  binfloat,
  bmp,
  text,
  textfloat,
  tiff,
  png,
}

export type AtlasFormat = keyof AtlasFormats;

export interface AtlasGenOptions {
  font: string;
  format?: string;
  image?: string;
  json?: string;
  js?: string;
}

const template = (
  atlas: Buffer,
  font: Record<string, any>,
) => `// ATTENTION! ALL CHANGES TO THIS FILE WILL BE OVERWRITTEN!
export const atlas = "data:image/png;base64,${atlas.toString("base64")}";

export const font = ${JSON.stringify(font, undefined, 2)};
`;

function glyphExists(glyphs: any[], unicode: number) {
  let check = glyphs.reduce(
    (prev, glyph) => prev || glyph.unicode === unicode,
    false,
  );
  return check;
}

function getSpecGlyph(glyphs: Record<string, any>[], unicode: number) {
  for (let i = 0; i < glyphs.length; i++) {
    if (glyphs[i].unicode == unicode) {
      return glyphs[i];
    }
  }
  return undefined;
}

function genKerning(font: Font, fontSpec: Record<string, any>) {
  const kerning: Record<string, Record<string, number>> = {};
  for (let i = 0; i < font.glyphs.length; i++) {
    let gatherCount = 0;
    const gather: Record<string, number> = {};
    const leftUnicode = font.glyphs.get(i).unicode!;
    if (glyphExists(fontSpec.glyphs, leftUnicode)) {
      for (let j = 0; j < font.glyphs.length; j++) {
        const rightUnicode = font.glyphs.get(j).unicode!;
        if (glyphExists(fontSpec.glyphs, rightUnicode)) {
          const kern = font.getKerningValue(i, j);
          if (kern !== 0) {
            gatherCount++;
            const rightGlyph = font.glyphs.get(j)!;
            const specGlyph = getSpecGlyph(
              fontSpec.glyphs,
              rightGlyph.unicode!,
            );
            if (specGlyph) {
              // Apply the advance ratio to 'fix' the kern values
              // (The ratio between what msdf-atlas-gen's json and the opentype.js value)
              const adjust = specGlyph.advance / rightGlyph.advanceWidth!;
              const right = String.fromCharCode(rightGlyph.unicode!);
              gather[right] = kern * adjust;
            }
          }
        }
      }
    }
    if (gatherCount !== 0) {
      const leftGlyph = font.glyphs.get(i);
      const left = String.fromCharCode(leftGlyph.unicode!);
      kerning[left] = gather;
    }
  }
  return kerning;
}

function genFontUv(glyph: Record<string, any>, atlas: Record<string, any>) {
  if (!glyph.atlasBounds) {
    return [0, 0, 0, 0];
  }
  const x = glyph.atlasBounds.left / atlas.width;
  const y = glyph.atlasBounds.bottom / atlas.height;
  const width =
    (glyph.atlasBounds.right - glyph.atlasBounds.left) / atlas.width;
  const height =
    (glyph.atlasBounds.top - glyph.atlasBounds.bottom) / atlas.height;
  return [x, y, width, height];
}

function genAtlasUvs(fontSpec: Record<string, any>) {
  const atlasUvs: Record<string, any> = {};
  fontSpec.glyphs.forEach((glyph: Record<string, any>) => {
    const char = String.fromCharCode(glyph.unicode);
    const atlasUv = genFontUv(glyph, fontSpec.atlas);
    atlasUvs[char] = atlasUv;
  });
  return atlasUvs;
}

function genChars(fontSpec: Record<string, any>) {
  const chars: Record<string, any> = {};
  fontSpec.glyphs.forEach((glyph: Record<string, any>) => {
    const char = String.fromCharCode(glyph.unicode);
    chars[char] = glyph;
  });
  return chars;
}

export function getPathToExe() {
  const binName = `msdf-atlas-gen${process.platform === "win32" ? ".exe" : ""}`;
  const buildPath = resolve(
    "build",
    "bin",
    process.platform === "win32" ? "Release" : "",
    binName,
  );

  if (existsSync(buildPath)) {
    return buildPath;
  }

  const binPath = resolve(
    "bin",
    `msdf-atlas-gen-${process.platform}${process.platform === "win32" ? ".exe" : ""}`,
  );
  if (existsSync(binPath)) {
    return binPath;
  }

  throw new Error("msdf-atlas-gen not found");
}

export async function msdfAtlasGen(options: AtlasGenOptions) {
  const fontFile = options.font;
  const exeCommand = getPathToExe();

  if (!options.image && !options.json && !options.js) {
    throw new Error("At least one of image, json, or js must be given");
  }

  const format = options.format || "png";
  const imageFile =
    options.image || join(tmpdir(), `${crypto.randomUUID()}.${format}`);
  const jsonFile =
    options.json || join(tmpdir(), `${crypto.randomUUID()}.json`);

  const args: string[] = ["-font", fontFile];

  if (options.image || options.js) {
    args.push("-imageout", imageFile);
  }

  if (options.json || options.js) {
    args.push("-json", jsonFile);
  }

  await execa(exeCommand, args);

  if (options.js) {
    const imageData = await readFile(imageFile);
    const jsonData = await readFile(jsonFile, { encoding: "utf8" });

    const fontSpec = JSON.parse(jsonData);
    const font = loadSync(fontFile);
    const kerning = genKerning(font, fontSpec);
    const atlasUvs = genAtlasUvs(fontSpec);
    const chars = genChars(fontSpec);
    const built = {
      kerning,
      atlasUvs,
      chars,
    };

    await writeFile(options.js, template(imageData, built));
  }
}
