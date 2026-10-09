import { chromium } from "playwright-core";

const BRAVE = "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";

const browser = await chromium.launch({ executablePath: BRAVE, headless: true });
const page = await browser.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 90000 });

const report = await page.evaluate(async () => {
  const imgs = [...document.querySelectorAll("img")].filter((i) =>
    (i.currentSrc || i.src).includes("logo"),
  );
  if (!imgs.length) return { error: "no logo img found" };

  const out = [];
  for (const img of imgs) {
    await img.decode().catch(() => {});
    const r = await new Promise((resolve) => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || 64;
      c.height = img.naturalHeight || 64;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;

      let trans = 0;
      let opq = 0;
      for (let i = 3; i < d.length; i += 4) {
        if (d[i] === 0) trans++;
        else if (d[i] === 255) opq++;
      }
      const total = d.length / 4;
      const px = (x, y) => {
        const i = (y * c.width + x) * 4;
        return `rgba(${d[i]},${d[i + 1]},${d[i + 2]},${d[i + 3]})`;
      };
      resolve({
        src: img.currentSrc.slice(0, 110),
        natural: `${img.naturalWidth}x${img.naturalHeight}`,
        transparentPct: +((trans / total) * 100).toFixed(1),
        opaquePct: +((opq / total) * 100).toFixed(1),
        cornerTL: px(1, 1),
        cornerBR: px(c.width - 2, c.height - 2),
        inFooter: !!img.closest("footer"),
        parentBg: img.parentElement
          ? getComputedStyle(img.parentElement).backgroundColor
          : "none",
      });
    });
    out.push(r);
  }
  return out;
});

console.log(JSON.stringify(report, null, 2));
await browser.close();