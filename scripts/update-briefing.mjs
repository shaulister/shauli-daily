import { readFile, writeFile } from "node:fs/promises";

const briefingPath = new URL("../data/briefing.json", import.meta.url);
const DROPBOX_APP_KEY = "ow3ruzr864iaa3c";
const UA = "ShauliDaily/1.0 (+https://shaulister.github.io/shauli-daily/)";
const sources = [
  { name: "The Verifier", category: "טכנולוגיה", feeds: ["https://theverifier.co.il/feed/", "https://theverifier.co.il/"] },
  { name: "AppleInsider", category: "אפל", feeds: ["https://appleinsider.com/rss", "https://appleinsider.com/"] },
  { name: "i24NEWS", category: "ישראל", feeds: ["https://www.i24news.tv/he/news/news", "https://www.i24news.tv/he"] },
  { name: "גיקטיים", category: "טכנולוגיה", feeds: ["https://www.geektime.co.il/feed/", "https://www.geektime.co.il/"] },
  { name: "מגזין רכב חשמלי", category: "רכב חשמלי", feeds: ["https://www.evm.co.il/israel/feed/", "https://www.evm.co.il/feed/", "https://www.evm.co.il/israel/"] },
  { name: "ערוץ הספורט", category: "ספורט", feeds: ["https://www.sport5.co.il/world.aspx?FolderID=4453"] },
];
const rotter = { name: "רוטר", category: "מבזקים", feeds: ["https://rotter.net/mobile/news.php", "https://rotter.net/news/news.php"] };

const clean = (value = "") => String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, " ").trim();
const absolute = (value, base) => { try { return new URL(clean(value), base).href; } catch { return ""; } };
const tag = (block, names) => { for (const name of names) { const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i")); if (match) return clean(match[1]); } return ""; };
const israelDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/html;q=0.9, */*;q=0.8" }, signal: AbortSignal.timeout(18000) });
  if (!response.ok) throw new Error(`${response.status}`);
  const bytes = await response.arrayBuffer();
  const charset = /charset=([^;]+)/i.exec(response.headers.get("content-type") || "")?.[1]?.trim() || "utf-8";
  try { return new TextDecoder(charset).decode(bytes); } catch { return new TextDecoder().decode(bytes); }
}

function parseRss(body, source, base) {
  return [...body.matchAll(/<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi)].slice(0, 8).map(([, block]) => ({
    category: source.category, source: source.name, title: tag(block, ["title"]),
    summary: tag(block, ["description", "summary", "content:encoded"]).slice(0, 300),
    url: absolute(block.match(/<link[^>]+href=["']([^"']+)/i)?.[1] || tag(block, ["link"]), base),
    image: absolute(block.match(/<(?:media:content|media:thumbnail|enclosure)[^>]+url=["']([^"']+)/i)?.[1], base),
    publishedAt: tag(block, ["pubDate", "published", "updated"]),
  })).filter(item => item.title && item.url);
}

function parseHtml(body, source, base) {
  const items = [];
  for (const match of body.matchAll(/<a\b([^>]*href=["'][^"']+["'][^>]*)>([\s\S]*?)<\/a>/gi)) {
    const title = clean(match[2]);
    const href = /href=["']([^"']+)/i.exec(match[1])?.[1];
    const url = absolute(href, base);
    if (title.length < 28 || title.length > 190 || !url.startsWith(new URL(base).origin)) continue;
    items.push({ category: source.category, source: source.name, title, summary: "", url, image: "", publishedAt: "" });
  }
  return items.slice(0, 8);
}

function parseRotter(body, base) {
  const seen = new Set();
  return [...body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(match => {
    const title = clean(match[2]).replace(/^\d{1,2}:\d{2}\s*/, "");
    const url = absolute(match[1], base);
    if (title.length < 22 || title.length > 220 || !/rotter\.net/.test(url) || seen.has(title)) return null;
    seen.add(title); return { category: "מבזקים", source: "רוטר", title, summary: "", url, image: "", publishedAt: "" };
  }).filter(Boolean).slice(0, 20);
}

async function readSource(source, isRotter = false) {
  for (const url of source.feeds) {
    try {
      const body = await fetchText(url);
      const items = isRotter ? parseRotter(body, url) : /<(rss|feed)\b/i.test(body) ? parseRss(body, source, url) : parseHtml(body, source, url);
      if (items.length) return items;
    } catch (error) { console.warn(`${source.name}: ${url} (${error.message})`); }
  }
  return [];
}

function unique(items) { const seen = new Set(); return items.filter(item => { const key = item.url.replace(/[?#].*$/, "") || item.title; if (seen.has(key)) return false; seen.add(key); return true; }); }

async function dropboxToken() {
  const refresh = process.env.DROPBOX_REFRESH_TOKEN, secret = process.env.DROPBOX_APP_SECRET;
  if (!refresh || !secret) return null;
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${DROPBOX_APP_KEY}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }) });
  if (!response.ok) throw new Error(`Dropbox token refresh failed (${response.status})`);
  return (await response.json()).access_token;
}
async function upload(token, path, body) {
  const response = await fetch("https://content.dropboxapi.com/2/files/upload", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream", "Dropbox-API-Arg": JSON.stringify({ path, mode: "overwrite", autorename: false, mute: true }) }, body });
  if (!response.ok) throw new Error(`Dropbox upload failed (${response.status})`);
}

const previous = JSON.parse(await readFile(briefingPath, "utf8"));
const results = await Promise.all(sources.map(source => readSource(source)));
const newFlashes = unique(await readSource(rotter, true));
const newStories = unique(results.flat()).slice(0, 30);
const stories = newStories.length ? newStories : (previous.stories || []);
const flashes = newFlashes.length ? newFlashes : (previous.flashes || []);
const token = await dropboxToken();
const data = {
  date: israelDate(), updatedAt: new Date().toISOString(), stories, flashes,
  sources: sources.map((source, index) => ({ name: source.name, category: source.category, url: source.feeds.at(-1), status: results[index].length ? "ok" : "unavailable" })),
  breakingSource: { name: "רוטר", url: "https://rotter.net/news/news.php", status: flashes.length ? "ok" : "unavailable" },
  backup: token ? "dropbox" : "not-configured",
};
const contents = `${JSON.stringify(data, null, 2)}\n`;
await writeFile(briefingPath, contents);
if (token) { await upload(token, `/archive/${data.date}.json`, contents); await upload(token, "/latest.json", contents); }
console.log(`Shauli Daily: ${stories.length} כתבות, ${flashes.length} מבזקים`);
