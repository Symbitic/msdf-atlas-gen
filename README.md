# msdf-atlas-gen

Utility for generating mtsdf fonts. Based off `https://github.com/Butterwell/mtsdf-fonts`

Written mainly for my upcoming project: XR-Tag.

## Usage

```
Usage: msdf-atlas-gen [options] <font>

Utility for generating compact font atlases using msdfgen

Arguments:
  font                   ttf/otf file or Google Font family

Options:
  -V, --version          output the version number
  -f, --format <format>  image format (choices: "bin", "binfloat", "bmp", "text", "textfloat", "tiff", "png" (default))
  -i, --image <image>    Output image file
  -j, --json <json>      Output JSON file
  -t, --js <js>          Output JavaScript file
  -w, --weight <weight>  Font weight (default: 400)
  -h, --help             display help for command
```

`font` can be a font file or the name of a font family available on Google Fonts.
