# Fonts

The game uses three fonts, all of which support Cyrillic. They are loaded
locally (see `css/fonts.css`) so the game works with no internet connection.

**The font files are not included here — you need to add them once.**

If they're missing nothing breaks: the browser falls back to the system
stack defined in `css/variables.css` and everything stays readable.

## What to download

| File to create here      | Font     | Weight |
|--------------------------|----------|--------|
| `comfortaa-500.woff2`    | Comfortaa | 500   |
| `comfortaa-700.woff2`    | Comfortaa | 700   |
| `nunito-400.woff2`       | Nunito    | 400   |
| `nunito-700.woff2`       | Nunito    | 700   |
| `caveat-600.woff2`       | Caveat    | 600   |

## Easiest way to get them

1. Open <https://gwfh.mranftl.com/fonts> (google-webfonts-helper).
2. Search for the font, pick **cyrillic** and **latin** under charsets.
3. Select the weight from the table above.
4. Download and copy the `.woff2` file here, renaming it to match.

Repeat for all three fonts. All three are licensed under the SIL Open Font
License, so they're fine to bundle and redistribute.

## Checking it worked

Open the game and look at Mickey's speech signs. With the fonts in place the
lettering is rounded and slightly wide; without them it falls back to
Trebuchet MS or the system sans-serif.
