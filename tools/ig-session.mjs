/**
 * Shared Instagram session handling for harvest.mjs and fetch-logo.mjs.
 *
 * Instagram issues its login cookie without a Max-Age, so Chromium keeps it in
 * memory only and it is gone once the browser closes. Persisting the profile
 * folder therefore does not preserve a login. Saving the cookies to JSON
 * instead does, which means you sign in once rather than once per script run.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const BROWSER_CANDIDATES = {
  brave: ["C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"],
  edge: ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"],
};

const SESSION = path.join(process.env.LOCALAPPDATA || process.env.TEMP, "kivia-ig-session");
const COOKIES = path.join(HERE, ".ig-cookies.json");

export function getArg(args, flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

export function pickBrowser(args = process.argv.slice(2)) {
  const requested = String(getArg(args, "--browser", process.env.KIVIA_BROWSER || "brave")).toLowerCase();
  const candidates = BROWSER_CANDIDATES[requested];
  if (!candidates) throw new Error(`Unknown browser "${requested}". Use brave or edge.`);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(`${requested} not found. Looked for:\n  ${candidates.join("\n  ")}`);
  }
  return { name: requested, path: found };
}

/**
 * Open a browser on the profile, restoring a saved cookie when there is one,
 * and wait until someone is signed in.
 */
export async function openLoggedIn(args, handle) {
  const browser = pickBrowser(args);
  fs.mkdirSync(SESSION, { recursive: true });

  const ctx = await chromium.launchPersistentContext(SESSION, {
    executablePath: browser.path,
    headless: false,
    viewport: { width: 1400, height: 1000 },
  });

  // Restore the saved session before Instagram renders anything.
  if (fs.existsSync(COOKIES)) {
    try {
      const saved = JSON.parse(fs.readFileSync(COOKIES, "utf8"));
      if (Array.isArray(saved) && saved.length) {
        await ctx.addCookies(saved);
        console.log(`Restored ${saved.length} saved cookies.`);
      }
    } catch (e) {
      console.log(`Could not restore saved cookies (${e.message}), starting logged out.`);
    }
  }

  const page = await ctx.newPage();
  page.setDefaultTimeout(45000);

  await page.goto(`https://www.instagram.com/${handle}/`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(3500);

  if (await isLoggedOut(page)) {
    console.log("");
    console.log(`Instagram needs a sign-in. A ${browser.name} window is open on the login page.`);
console.log("Please log in there yourself. This script never sees or stores your password.");
    console.log(`Session folder: ${SESSION}`);
    console.log("Leave that window open. The script watches it and continues on its own.");
    console.log("");

    const deadline = Date.now() + 15 * 60 * 1000;
    let signedIn = false;

    // A successful sign-in is only real once Instagram has issued the session
    // cookie. The page looks signed in a moment earlier while it is still
    // redirecting, and saving cookies at that point captures no session at all,
    // so the next run starts logged out again.
    while (Date.now() < deadline) {
      try {
        await page.waitForTimeout(3000);
        if (await hasSessionCookie(ctx)) {
          console.log("Login confirmed, carrying on.\n");
          signedIn = true;
          break;
        }
      } catch {
        // The window can be closed mid-poll; keep the error for the report.
        if (await isClosed(ctx)) break;
        continue;
      }
    }

    if (!signedIn) {
      console.log("\nNo completed login after 15 minutes, so nothing was read and nothing was written.");
      console.log("If you did sign in, leave the browser window open until this script exits.");
      await closeQuietly(ctx);
      return { ok: false };
    }

    // Persist the cookies so the next script run does not need another sign-in.
    try {
      const cookies = await ctx.cookies();
      fs.writeFileSync(COOKIES, JSON.stringify(cookies, null, 2));
      console.log(`Saved ${cookies.length} cookies for reuse, including your session.`);
    } catch (e) {
      console.log(`Could not save cookies for reuse: ${e.message}`);
    }

    // Re-read the profile now that the session is real. The page Instagram
    // showed during login is the login flow, not the profile.
    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(4000);
  } else {
    console.log("Already signed in from the saved session.");
  }

  // A saved cookie set with no session cookie cannot sign anyone in, so do not
  // let it skip the sign-in prompt.
  if (await isClosed(ctx)) return { ok: false };
  if (await isLoggedOut(page)) {
    console.log("The saved session is no longer valid.");
    return { ok: false };
  }

  return { ok: true, ctx, page, browser };
}

/** True once Instagram has issued a real login session cookie. */
async function hasSessionCookie(ctx) {
  const cookies = await ctx.cookies();
  return cookies.some((c) => c.name === "sessionid" && c.value);
}

async function isClosed(ctx) {
  try {
    await ctx.cookies();
    return false;
  } catch {
    return true;
  }
}

/** Closing after the user already closed the window should not crash the run. */
async function closeQuietly(ctx) {
  try {
    await ctx.close();
  } catch {
    // already gone
  }
}

async function isLoggedOut(page) {
  return page.evaluate(() => {
    const t = document.body ? document.body.innerText.slice(0, 400) : "";
    if (/Log In\s*Sign Up|Never miss a post from/i.test(t)) return true;
    if (document.querySelector('a[href*="/accounts/login/"]')) return true;
    if (document.querySelector('input[name="password"]')) return true;
    if (/^\s*$/.test(t) && !document.querySelector("input")) return true;
    return false;
  });
}

export { SESSION, COOKIES };