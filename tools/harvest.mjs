#!/usr/bin/env node
/**
 * Reads posts from an Instagram profile using a browser you log into yourself.
 *
 * Opens a real Brave or Edge window with its own throwaway profile. It never
 * sees or stores your password: you type it, the cookie lands in the profile,
 * and the script just watches for the login to land. Nothing here posts, likes,
 * follows or writes anything to Instagram.
 * stores your password: you type it, the cookie lands in the profile, and the
 * script just watches for the login to land. Nothing here posts, likes, follows
 * or writes anything to Instagram.
 *
 * Usage:
 *   node tools/harvest.mjs                      # grid URLs + full-size photos
 *   node tools/harvest.mjs --mode full          # also read dates and captions
 *   node tools/harvest.mjs --mode full --limit 90
 *   node tools/harvest.mjs --mode test --test-code DdBhxHNjBKd
 *
 * Flags:
 *   --handle   profile to read           default kiviakurtis
 *   --limit    stop after this many posts, 0 means no limit
 *   --gap      delay between post reads in ms, default 1500
 *   --path     read the reels tab instead of the main grid
 *   --only     comma separated shortcodes, to fill gaps without redoing all
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

// Brave and Edge are both Chromium, and Playwright drives either. Pick with
// --browser brave, or set it in the KIVIA_BROWSER environment variable.
const BROWSER_CANDIDATES = {
  brave: ["C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"],
  edge: ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"],
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

function pickBrowser() {
  const requested = String(getArg("--browser", process.env.KIVIA_BROWSER || "brave")).toLowerCase();
  const candidates = BROWSER_CANDIDATES[requested];
  if (!candidates) {
    throw new Error(`Unknown browser "${requested}". Use brave or edge.`);
  }
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      `${requested} not found. Looked for:\n  ${candidates.join("\n  ")}\n` +
        `Edit BROWSER_CANDIDATES at the top of this file to match your install.`,
    );
  }
  return { name: requested, path: found };
}

const MODE = getArg("--mode", "images");
const HANDLE = getArg("--handle", "kiviakurtis");
const LIMIT = Number(getArg("--limit", "0"));
const GAP = Number(getArg("--gap", "1500"));
const TEST_CODE = getArg("--test-code", "");
const SUBPATH = getArg("--path", "").replace(/^\/+|\/+$/g, "");
const ONLY = new Set(
  getArg("--only", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

// A profile of its own, separate from your daily browser profile and from any
// other project's session, so this never inherits another account's login.
const SESSION = path.join(process.env.LOCALAPPDATA || process.env.TEMP, "kivia-ig-session");
const OUT = path.join(ROOT, "tools", "harvest-data");
const STORE = path.join(OUT, "posts.json");
const PHOTOS = path.join(OUT, "photos");

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(headless) {
  const browser = pickBrowser();
  if (!fs.existsSync(browser.path)) {
    throw new Error(`${browser.name} not found at ${browser.path}`);
  }
  // A profile of its own, so this never inherits your daily browsing login.
  fs.mkdirSync(SESSION, { recursive: true });
  return chromium.launchPersistentContext(SESSION, {
    executablePath: browser.path,
    headless,
    viewport: { width: 1400, height: 1000 },
    args: ["--start-maximized"],
  });
}

/*
 * Instagram hands back some captions with UTF-8 bytes decoded as Windows-1252,
 * so an emoji arrives as three odd-looking Latin characters such as "ðŸŒ¸".
 * Turn those characters back into the bytes they came from and read them as
 * UTF-8 again. cp1252 and latin1 only differ across 0x80-0x9F, so that block
 * needs its own table. Anything that does not survive the round trip is
 * returned untouched, which keeps genuine accents and real emoji safe.
 */
/**
 * Instagram wraps the caption in a div that begins with the handle on its own
 * line and ends in UI chrome, so cleanCaption strips both ends to keep only the
 * owner's words.
 */
const CP1252_REVERSE = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86,
  0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
  0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95,
  0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
  0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

function undoCp1252(s) {
  if (!s || !/[^\x00-\x7F]/.test(s)) return s;

  const bytes = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80 || cp <= 0xff) bytes.push(cp);
    else if (CP1252_REVERSE[cp] !== undefined) bytes.push(CP1252_REVERSE[cp]);
    else return s;
  }

  const fixed = Buffer.from(bytes).toString("utf8");
  // A real repair contains no replacement character. If one appears, the guess
  // was wrong and the original text was already correct.
  return fixed.includes("\uFFFD") ? s : fixed;
}

function cleanCaption(raw) {
  if (!raw) return "";
  const escaped = HANDLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let t = undoCp1252(raw)
    .replace(/\s+/g, " ")
    .trim();

  t = t.replace(new RegExp("^@" + escaped + "\\b", "i"), "").trim();
  t = t.replace(/^Log in to like, comment and follow\.?\s*/i, "").trim();
  t = t.replace(/^View all comments\s*/i, "").trim();
  t = t.replace(/\s*·\s*(View|Reply)\s*\d*\s*comments?\.?\s*$/i, "").trim();
  t = t.replace(/^on\s+\w+\s+\d{1,2},?\s*\d{4}\s*·?\s*/i, "").trim();
  t = t.replace(/^Sign up for Instagram to stay in the loop\.?\s*/i, "").trim();
  t = t.replace(new RegExp("^" + escaped + "\\s+", "i"), "").trim();
  t = t.replace(/^View more on Instagram\s*$/i, "").trim();
  t = t.replace(/\s*View all \d+ comments?\.?\s*$/gi, "").trim();
  t = t.replace(/\s*View all comments\.?\s*$/gi, "").trim();
  t = t.replace(/\s*·\s*Reply\s*$/gi, "").trim();
  t = t.replace(/^\s*(Photo|Video)\s+by\s+\S+.*$/i, "").trim();

  const parts = t.split("\n").map((l) => l.trim()).filter(Boolean);
  while (parts.length && /^(Like|Comment|Share|Save|Log in|Sign up|View profile|View more)/i.test(parts[0])) parts.shift();
  while (parts.length && /^(Like|Comment|Share|Save|View all comments|View more on Instagram)\.?$/i.test(parts[parts.length - 1])) parts.pop();

  return parts.join("\n").trim();
}



// Instagram serves /p/CODE/ and /HANDLE/reel/CODE/. Anchoring straight after
// the domain misses every reel, so allow an optional leading segment.
const shortcodeOf = (href) => {
  const m = href.match(/instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
};

/** Read a post through the embed route, which is the one that yields captions. */
async function readEmbed(page, code) {
  try {
    await page.goto(`https://www.instagram.com/p/${code}/embed/captioned/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  } catch {
    return { ok: false };
  }
  await page.waitForTimeout(1800);

  const d = await page.evaluate(() => {
    const img = document.querySelector("img.EmbeddedMediaImage");
    const body = document.body.innerText;
    const likeMatch = body.match(/([\d.,]+[KMB]?)\s+likes?/i);
    const statMatch = body.match(/([\d.,]+[KMB]?)\s+posts?\s*[^\w\s]?\s*([\d.,]+[KMB]?)\s+followers?/i);
    return {
      caption: document.querySelector("div.Caption")?.innerText || null,
      thumb: img ? img.currentSrc || img.src : null,
      isVideo: !!document.querySelector("video"),
      likes: likeMatch ? likeMatch[1] : null,
      authorPosts: statMatch ? statMatch[1] : null,
      authorFollowers: statMatch ? statMatch[2] : null,
    };
  });

  return {
    ok: true,
    caption: cleanCaption(d.caption) || null,
    thumb: d.thumb || null,
    isVideo: d.isVideo,
    likes: d.likes,
    authorPosts: d.authorPosts,
    authorFollowers: d.authorFollowers,
  };
}

async function readPost(page, code) {
  const out = { ok: false, date: null, caption: null, photo: null, likes: null, isVideo: false };

  try {
    await page.goto(`https://www.instagram.com/p/${code}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(2000);

    // The caption can arrive after the first paint, and the date lives in a
    // time element that is only in the DOM once the post body has hydrated.
    // Poll briefly rather than trusting a single read at 2s.
    let d = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      d = await page.evaluate(() => {
        const times = [...document.querySelectorAll("time[datetime]")]
          .map((t) => t.getAttribute("datetime"))
          .filter((v) => v && /^\d{4}-\d{2}-\d{2}T/.test(v))
          .sort();
      const body = document.body.innerText;
      // Only count media that belongs to the post itself. Sidebar avatars and
      // suggested accounts also match a bare "img", and their presence would
      // make every post look like it had a video.
      const imgs = [...document.querySelectorAll("article img, main img, img")].filter(
        (i) => (i.naturalWidth || 0) > 200
      );
      // The reel play overlay and the /video/ CDN folder are the only reliable
      // signals. A bare <video> is not, because Instagram keeps a hidden video
      // element in the DOM for photo posts too.
      const overlays = document.querySelectorAll(
        'svg[aria-label*="clip" i], i[title*="clip" i], [class*="Reel" i] video, div[class*="x1qjc9v5"] video',
      ).length;
      const videoCdn = /\bvideo\/[0-9]+\//.test(
        imgs.map((i) => i.currentSrc || i.src).join(" "),
      );
      const isReelRoute = /\/reels?\/[A-Za-z0-9_-]+/.test(location.pathname);
      return {
        walled: /Log In\s*Sign Up|Never miss a post from/i.test(body.slice(0, 300)),
        date: times[0] || null,
        isVideo: videoCdn || isReelRoute || overlays > 0,
        videoCdn,
        overlays,
        caption: document.querySelector("div.Caption")?.innerText || document.querySelector("h1")?.innerText || null,
        imgs: imgs.map((i) => ({
          currentSrc: i.currentSrc || i.src || null,
          src: i.src || null,
          naturalWidth: i.naturalWidth || 0,
          naturalHeight: i.naturalHeight || 0,
          srcset: i.getAttribute("srcset"),
        })),
        likes: (body.match(/([\d.,]+[KMB]?)\s+likes?/i) || [])[1] || null,
      };
      });

      // Stop early once we have everything worth waiting for.
      if (d.date && d.caption && d.imgs.length) break;
      await page.waitForTimeout(1500);
    }

    if (d && !d.walled) {
      let best = null;
      let bestPixels = 0;
      for (const img of d.imgs) {
        const pixels = (img.naturalWidth || 0) * (img.naturalHeight || 0);
        if (pixels <= bestPixels || !img.currentSrc) continue;
        let url = img.currentSrc;
        let width = img.naturalWidth;
        if (img.srcset) {
          for (const part of img.srcset.split(",")) {
            const [candidate, desc] = part.trim().split(/\s+/);
            const declared = Number((desc || "").replace(/[wx]/i, "")) || 0;
            if (candidate && declared > width) {
              width = declared;
              url = candidate;
            }
          }
        }
        best = { url, width, height: img.naturalHeight };
        bestPixels = pixels;
      }

      out.ok = true;
      out.date = d.date;
      out.caption = cleanCaption(d.caption) || null;
      out.photo = best ? best.url : null;
      out.photoWidth = best ? best.width : null;
      out.likes = d.likes;
      out.isVideo = d.isVideo;
    }
  } catch {}

  if (out.ok) return out;

  const emb = await readEmbed(page, code);
  return {
    ok: emb.ok,
    date: null,
    caption: emb.caption,
    photo: emb.thumb,
    photoWidth: null,
    likes: emb.likes,
    isVideo: emb.isVideo,
    noDate: true,
  };
}

/** Scroll the profile grid and collect every post link that belongs to HANDLE. */
async function harvestGrid(page, limit) {
  await page.goto(`https://www.instagram.com/${HANDLE}/${SUBPATH ? SUBPATH + "/" : ""}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // The grid renders client side and lazy loads, so wait for real anchors.
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]').length > 6,
      null,
      { timeout: 45000 },
    );
  } catch {
    log("  note: post anchors were slow to appear, carrying on anyway");
  }
  await page.waitForTimeout(2500);

  const text = await page.evaluate(() => document.body.innerText.slice(0, 600));
  if (/This Account is Private/i.test(text)) {
    throw new Error("This account is private, so its posts cannot be read by anyone but its followers.");
  }

  const found = new Map();
  let stagnant = 0;
  let lastScroll = null;

  for (let pass = 1; pass <= 900; pass++) {
    const items = await page.evaluate(
      ([handle]) =>
        [...document.querySelectorAll("a[href]")]
          .filter((a) => {
            try {
              const u = new URL(a.href);
              if (!/(^|\.)instagram\.com$/.test(u.hostname)) return false;
              const seg = u.pathname.split("/").filter(Boolean);
              const i = seg.findIndex((s) => s === "p" || s === "reel" || s === "reels");
              if (i === -1 || !seg[i + 1]) return false;
              // Require our handle in the path. The reels tab offers other
              // accounts' reels, and those are not ours.
              return i > 0 && seg[i - 1].toLowerCase() === handle.toLowerCase();
            } catch {
              return false;
            }
          })
          .map((a) => {
            const img = a.querySelector("img");
            return {
              href: a.href,
              src: img ? img.currentSrc || img.src : null,
              w: img ? img.naturalWidth || 0 : 0,
              h: img ? img.naturalHeight || 0 : 0,
            };
          }),
      [HANDLE],
    );

    let added = 0;
    for (const it of items) {
      const code = shortcodeOf(it.href);
      if (!code || found.has(code)) continue;
      found.set(code, {
        code,
        url: it.href,
        isReelLink: /\/reel\//.test(it.href),
        tile: it.src && it.w >= 200 ? it.src : null,
      });
      added++;
    }

    process.stdout.write(`\r  scrolling: ${found.size} posts (+${added})   `);
    if (limit && found.size >= limit) break;
    stagnant = added === 0 ? stagnant + 1 : 0;
    if (stagnant >= 8) break;

    // Instagram renders the grid inside its own scrolling element and only
    // appends rows as that element nears its bottom. Nudging the window does
    // nothing, so find the element that actually has room to scroll, drive it
    // to its end, and confirm it moved. When it refuses to move we are at the
    // true bottom of the feed and further passes cannot add anything.
    const scrollInfo = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll("div")].filter((d) => {
        const style = getComputedStyle(d);
        return (
          d.scrollHeight > d.clientHeight + 200 &&
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          d.clientHeight > 400
        );
      });

      candidates.sort((a, b) => b.scrollHeight - a.scrollHeight);
      const el = candidates[0];
      window.scrollBy(0, 2500);

      if (!el) {
        return { moved: 0, atBottom: window.innerHeight + window.scrollY >= document.body.scrollHeight - 50, where: "window" };
      }

      const before = el.scrollTop;
      el.scrollTop = el.scrollTop + 1200;
      el.scrollBy(0, 1200);
      const after = el.scrollTop;

      return {
        moved: Math.round(after - before),
        top: Math.round(after),
        max: Math.round(el.scrollHeight - el.clientHeight),
        atBottom: after >= el.scrollHeight - el.clientHeight - 50,
        where: "div",
      };
    });

    if (scrollInfo.where === "div") {
      lastScroll = scrollInfo;
      if (scrollInfo.moved <= 0 && stagnant >= 3) {
        log(`\n  the grid stopped scrolling at post ${scrollInfo.top} of ${scrollInfo.max}. Stopping.`);
        break;
      }
    }

    await page.waitForTimeout(1500);
  }

  if (lastScroll && lastScroll.where === "div") {
    log(`  grid scrolled to ${lastScroll.top} of ${lastScroll.max}.`);
  }

  process.stdout.write("\r" + " ".repeat(50) + "\r");
  return [...found.values()];
}

/** Download a photo, refusing files too small to be a real product shot. */
async function savePhoto(request, url, code) {
  if (!url) return null;
  try {
    const res = await request.get(url, { timeout: 60000 });
    if (!res.ok()) return null;
    const buf = await res.body();
    if (buf.length < 12000) return null;

    const type = (res.headers()["content-type"] || "").toLowerCase();
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const file = `${code}.${ext}`;
    fs.writeFileSync(path.join(PHOTOS, file), buf);
    return `photos/${file}`;
  } catch {
    return null;
  }
}

async function waitForLogin(page) {
  log("");
  log(`A ${pickBrowser().name} window is open with an empty profile, on the Instagram login page.`);
  log("Please log in there yourself. The password is never seen or stored by this script.");
  log(`Your session is kept in ${SESSION}`);
  log("Nothing to click here. This script watches the window and starts on its own.");
  log("");

  // Open the login page rather than sitting on a blank tab, otherwise there is
  // nothing to type into and the wait below never resolves.
  try {
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  } catch {
    log("Could not reach the Instagram login page, retrying shortly.");
  }

  await page.waitForTimeout(3000);

  const deadline = Date.now() + 15 * 60 * 1000;
  let last = null;

  while (Date.now() < deadline) {
    await sleep(3000);
    let state;
    try {
      state = await page.evaluate(() => {
        const t = document.body ? document.body.innerText.slice(0, 400) : "";
        // Logged out: Instagram shows this wording on every login surface.
        if (/Log In\s*Sign Up|Never miss a post from/i.test(t)) return "waiting";
        if (document.querySelector('a[href*="/accounts/login/"]')) return "waiting";
        // A password box still on screen means the form never went through.
        if (document.querySelector('input[name="password"]')) return "waiting";
        // Blank or error page with nothing to type into. Treat as not ready
        // rather than assuming a login happened.
        if (/^\s*$/.test(t) && !document.querySelector("input")) return "waiting";
        if (/^(Something went wrong|Page not found|Access Denied)/i.test(t)) return "waiting";
        return "in";
      });
    } catch {
      continue;
    }

    if (state !== last) {
      last = state;
      if (state === "in") {
        log("Login seen, carrying on.\n");
        return true;
      }
    }
  }

  log("\nNo login after 15 minutes, so nothing was read and nothing was written.");
  return false;
}

/* data/posts.json is the store. Merge into it so an interrupted run can never
   shrink the record, and only the fields a run actually read get touched. */
function readStore() {
  if (!fs.existsSync(STORE)) return { handle: HANDLE, posts: [] };
  try {
    const prev = JSON.parse(fs.readFileSync(STORE, "utf8"));
    if (Array.isArray(prev.posts)) return prev;
  } catch {}
  return { handle: HANDLE, posts: [] };
}

function writeStore(base, fresh) {
  const byCode = new Map(base.posts.map((r) => [r.code, r]));
  const before = byCode.size;
  let added = 0;

  for (const p of fresh) {
    const old = byCode.get(p.code);
    byCode.set(p.code, {
      ...old,
      ...p,
      date: p.date || (old && old.date) || null,
      caption: p.caption || (old && old.caption) || null,
      likes: p.likes != null ? p.likes : old && old.likes != null ? old.likes : null,
      photo: p.photo || (old && old.photo) || null,
      kind: p.kind || (old && old.kind) || null,
    });
    if (!old) added++;
  }

  const posts = [...byCode.values()];
  posts.sort((a, b) => ((a.date || "9999") < (b.date || "9999") ? -1 : 1));

  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(
    STORE,
    JSON.stringify(
      {
        handle: base.handle || HANDLE,
        source: "instagram",
        capturedAt: new Date().toISOString(),
        counts: {
          total: posts.length,
          dated: posts.filter((p) => p.date).length,
          captioned: posts.filter((p) => p.caption && p.caption.trim().length > 3).length,
          liked: posts.filter((p) => p.likes != null).length,
          photo: posts.filter((p) => p.photo).length,
          reels: posts.filter((p) => p.kind === "reel").length,
        },
        posts,
      },
      null,
      2,
    ),
    "utf8",
  );

  return { total: posts.length, before, added };
}

function checkout(fresh) {
  return writeStore(readStore(), fresh);
}

(async function main() {
  if (MODE === "test") {
    const ctx = await launch(true);
    const page = await ctx.newPage();
    log(`Checking extraction on one public post: ${TEST_CODE || "(none given, using the first code found on the grid)"}\n`);

    let r;
    if (TEST_CODE) {
      r = await readPost(page, TEST_CODE);
    } else {
      const ok = await waitForLogin(page);
      if (!ok) { await ctx.close(); process.exit(1); }
      const posts = await harvestGrid(page, 1);
      r = posts.length ? await readPost(page, posts[0].code) : { ok: false };
    }

    log(JSON.stringify(r, null, 2));
    const core = !!(r.caption && r.photo);
    log(`\n  caption : ${r.caption ? "working" : "missing"}`);
    log(`  photo   : ${r.photo ? `working (${r.photoWidth || "?"}px wide)` : "missing"}`);
    log(`  date    : ${r.date ? "working" : "absent"}`);
    log(`\n  verdict : ${core ? "extraction works" : "BROKEN, do not trust a run"}`);
    await ctx.close();
    process.exit(core ? 0 : 1);
  }

  const ctx = await launch(false);
  const page = await ctx.newPage();
  page.setDefaultTimeout(45000);

  const ready = await waitForLogin(page);
  if (!ready) {
    log("Stopped before reading anything.");
    await ctx.close();
    process.exit(1);
  }

  fs.mkdirSync(PHOTOS, { recursive: true });

  let posts;
  try {
    posts = await harvestGrid(page, LIMIT);
  } catch (e) {
    log("\nStopped: " + e.message);
    await ctx.close();
    process.exit(1);
  }
  log(`The grid gave ${posts.length} post URLs.`);

  if (ONLY.size) {
    posts = posts.filter((p) => ONLY.has(p.code));
    log(`--only was given, so reading ${posts.length} of them.`);
    if (!posts.length) {
      log("None of those codes were on the grid.");
      await ctx.close();
      process.exit(2);
    }
  }

  if (!posts.length) {
    log("\nThe grid rendered no post links. Common causes:");
    log("  - Instagram showed a checkpoint or a blank feed instead of the profile");
    log("  - the page had not finished loading when it was read");
    log("Nothing was written.");
    await ctx.close();
    process.exit(2);
  }

  const mins = Math.round((posts.length * (GAP * 2 + 3600)) / 60000);
  log(`\nReading ${posts.length} posts for photos, captions and dates.`);
  log(`Roughly ${mins} minutes at a ${GAP}ms gap. Leave this machine alone meanwhile.`);
  log(`Progress saves every 10 posts, so an interrupted run keeps its progress.\n`);

  let dates = 0, caps = 0, likes = 0, photos = 0, noDate = 0, errors = 0;

  for (let i = 0; i < posts.length; i++) {
    const r = await readPost(page, posts[i].code);

    if (r.ok) {
      if (r.date) { posts[i].date = r.date; dates++; } else { noDate++; }
      if (r.likes) { posts[i].likes = r.likes; likes++; }
      if (r.isVideo || posts[i].isReelLink) posts[i].kind = "reel";

      // The post page often returns no caption, only a date. The caption lives
      // on the embed route, so ask for it only when it is actually missing.
      if (!posts[i].caption && r.caption) {
        posts[i].caption = r.caption;
        caps++;
      } else if (posts[i].caption) {
        caps++;
      } else {
        const e = await readEmbed(page, posts[i].code);
        if (e.ok && e.caption) {
          posts[i].caption = e.caption;
          caps++;
          if (!posts[i].photo && e.thumb) {
            const m = await savePhoto(page.request, e.thumb, posts[i].code);
            if (m) { posts[i].photo = m; photos++; }
          }
        }
      }

      if (!posts[i].photo && r.photo) {
        const m = await savePhoto(page.request, r.photo, posts[i].code);
        if (m) { posts[i].photo = m; photos++; posts[i].photoWidth = r.photoWidth || null; }
      }
    } else {
      posts[i].error = "unreadable";
      errors++;
    }

    process.stdout.write(
      `\r  ${i + 1}/${posts.length}   photos ${photos}   captions ${caps}   dates ${dates}   likes ${likes}   `,
    );

    if ((i + 1) % 10 === 0) {
      try {
        checkout(posts.slice(0, i + 1));
      } catch (e) {
        log(`\nWARNING: checkpoint failed at ${i + 1}, continuing anyway. ${e.message}`);
      }
    }
    await sleep(GAP);
  }

  process.stdout.write("\r" + " ".repeat(70) + "\r");
  log(`  photos saved     ${photos}/${posts.length}  into tools/harvest-data/photos/`);
  log(`  captions read    ${caps}/${posts.length}`);
  log(`  dates read       ${dates}/${posts.length}${noDate ? `  (${noDate} had none)` : ""}`);
  log(`  like counts      ${likes}/${posts.length}`);
  if (errors) log(`  unreadable       ${errors}`);

  const existing = readStore();
  const before = existing.posts.length;
  const result = checkout(posts);
  fs.copyFileSync(STORE, STORE + ".bak");

  log(`\nWrote tools/harvest-data/posts.json`);
  log(`  read this run   ${posts.length}`);
  log(`  new posts       ${result.added}`);
  log(`  total now       ${result.total}${before ? `  (was ${before})` : ""}`);
  log(`  backup          posts.json.bak`);
  log(`\nNext:  node tools/build-catalog.mjs`);

  await ctx.close();
})().catch(async (e) => {
  console.error("\n" + (e && e.stack ? e.stack : e));
  process.exit(1);
});