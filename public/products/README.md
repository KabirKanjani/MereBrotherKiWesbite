# Product photos

Every photo in this folder came from `@kiviakurtis` via `tools/harvest.mjs`, so it is real work the
shop has already published. Files are named after the Instagram post code rather than a style name,
because the shop has not named these styles yet.

| File | Post | What the caption says |
| --- | --- | --- |
| `Dd8JKRdBWPy.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/Dd8JKRdBWPy/) | Classic festive look, Diwali |
| `DceOCJGPz8E.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DceOCJGPz8E/) | Embroidery co-ord set, L-3XL |
| `DceNsIpiwBp.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DceNsIpiwBp/) | Embroidery co-ord set, L-3XL |
| `DceNeW6hC9X.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DceNeW6hC9X/) | Embroidery co-ord set, L-3XL |
| `DaAP6CICUGH.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DaAP6CICUGH/) | Comfort co-ord set |
| `DZcCxxHI2fh.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DZcCxxHI2fh/) | Krisha 6, regular wear co-ord |
| `DZN1NL1DyVx.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DZN1NL1DyVx/) | Kimoni plus, heavy rayon tunic, M-XXL |
| `DZN027HIB_s.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DZN027HIB_s/) | Kornetto Pro, printed, M-5XL |
| `DZF8WrFiDo4.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DZF8WrFiDo4/) | Pastel cotton co-ord set, L-3XL |
| `DZDBcoXgSrc.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DZDBcoXgSrc/) | Comfort co-ord set |
| `DYwGPdThYXy.jpg` | [reel](https://www.instagram.com/kiviakurtis/reel/DYwGPdThYXy/) | KITTY series co-ord set, L-3XL |

## Adding a style name

`src/lib/catalog.ts` has one entry per photo, and every `name` is currently an empty string on
purpose. A guessed name would put the wrong label on a real garment. When you tell me what a style
is called, fill in that entry's `name`, and change `slug` to match if you want a readable URL.

Fabric, sizes and category came from the caption text. Colours, garment length and care are empty
because Instagram does not state them, and they are better left blank than invented.

## Fetching more photos

```
node tools/harvest.mjs --mode full
```

That opens a browser and waits for you to sign in yourself. It appends to
`tools/harvest-data/posts.json` without deleting what is already there, so it is safe to run again.
Instagram only loaded 12 posts in the last run even though the account lists 545, so the grid needs
work if you want the full history.