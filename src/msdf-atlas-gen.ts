import { APIv2 as GoogleFonts } from "google-font-metadata";
import { Command, Option } from "commander";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFile } from "node:fs/promises";

import { AtlasFormats, msdfAtlasGen } from "./index";
import { version } from "../package.json";

const program = new Command();

const fontFormats = Object.values(AtlasFormats).filter(
  (str) => String(str).length > 2,
) as string[];

async function downloadFont(name: string, weight: number = 400) {
  const fontFamilyName = name.toLocaleLowerCase();
  const font = join(tmpdir(), `${fontFamilyName}-${weight}.ttf`);

  if (existsSync(font)) {
    return font;
  }

  if (!GoogleFonts[fontFamilyName]) {
    console.error("Font does not exist in Google Fonts");
    process.exit(1);
  }

  const fontUrl =
    GoogleFonts[fontFamilyName]?.variants[String(weight)]?.normal["latin"]?.url
      ?.truetype;
  if (!fontUrl) {
    console.error(`${name} doesn't have a TTF URL`);
    process.exit(1);
  }

  const response = await fetch(fontUrl);
  const arrayBuffer = await response.arrayBuffer();

  await writeFile(font, new Uint8Array(arrayBuffer));

  return font;
}

program
  .version(version)
  .description("Utility for generating compact font atlases using msdfgen")
  .argument("<font>", "ttf/otf file")
  .addOption(
    new Option("-f, --format <format>", "image format").choices(fontFormats),
  )
  .option("-i, --image <image>", "Output image file")
  .option("-j, --json <json>", "Output JSON file")
  .option("-t, --js <js>", "Output JavaScript file")
  .option("-w, --weight <weight>", "Font weight", parseInt, 400);

program.parse(process.argv);

const { format, image, json, js, weight } = program.opts();
let [font] = program.args;

if (!existsSync(font)) {
  font = await downloadFont(font, weight);
}

await msdfAtlasGen({
  font,
  format,
  image,
  json,
  js,
});
