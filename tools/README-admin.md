# Running the admin panel

Open `http://localhost:3000/admin`.

The first time, it asks you to create an account. After that, sign in with the
email and password you set.

Everything the site shows is editable from here, and nothing needs a code change
or a redeploy.

## Where things live

| What you want to change | Where in the admin |
| --- | --- |
| Add, edit or remove a style | **Catalogue → Products** |
| Upload new photographs | **Media** |
| Change phone, WhatsApp, address, opening hours | **Administration → Settings** |
| Change the wording on a page | **Pages** |
| Decide what appears on the homepage | Tick **Featured** on a product |

## Editing a product

Most fields can be left alone. The ones worth knowing:

- **Name** — the style name. Leave it blank if you have not decided yet and the
  card will show its category instead. Nothing is invented for you.
- **Image** — the photograph shown in the grid. Portrait photos crop best.
- **Featured** — puts the style in the homepage "This season's picks" row. Keep
  four to six ticked, or the row looks sparse.
- **Rate card price** — your own wholesale figure. It is stored for your
  reference and is never shown on the website. Nothing on the site displays a
  price.

## Saving, and why nothing changes yet

Each product has a **status**:

- **Draft** — only staff can see it. Use this while writing something up.
- **Published** — visible on the website.

Saving a draft does not change the live site. Click **Publish** when you are
ready. Autosave keeps a draft as you type, so a dropped connection does not lose
your work.

There is also a **Preview** button, which opens the live site so you can check
the change before publishing it.

## Photographs

Drag a file onto the upload area, or click to browse. The important field is
**Alt**, the description read aloud by screen readers and shown if the photo
fails to load. Describe the garment, for example "Cotton kurti with hand
embroidery along the neck". Avoid starting it with "image of".

Three sizes are made automatically: a small thumbnail, a card size for the grid,
and a large size. You never need to resize anything yourself.

## If something looks wrong

The admin has a **Live Preview** tab in the sidebar showing the site at mobile,
tablet and desktop widths. Use it rather than guessing at how a change will look.