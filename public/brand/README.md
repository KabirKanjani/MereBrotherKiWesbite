# Brand assets

Put your logo here as `logo.png`, `logo.svg`, `logo.webp` or `logo.jpg`.

The site picks it up automatically: `src/lib/logo.ts` looks for a file named `logo.<ext>` in this
folder and every logo placement on the site uses it. The header, footer and Open Graph preview all
read from the same place, so replacing the file updates the whole site at once.

If no file is here, the site falls back to a text wordmark, so nothing ever appears broken.

To fetch the current Instagram profile picture instead:

```
node tools/fetch-logo.mjs
```

That opens a browser, waits for you to sign in yourself, and saves the avatar here. Note it only
accepts a square avatar: Instagram also puts a wide "cover photo" placeholder on the profile, and
that stock image is larger than the logo, so grabbing the biggest image on the page gives you the
wrong picture.

Recommended: a square PNG with a transparent background, at least 512 x 512.