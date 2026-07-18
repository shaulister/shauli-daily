const feed = document.querySelector("#feed");
const flashes = document.querySelector("#flashes");
const flashesSection = document.querySelector("#flashes-section");
const flashesCard = document.querySelector(".flashes-card");
const feedSection = document.querySelector("#feed-section");
const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
let briefing = { stories: [], flashes: [] };

function fallbackImage(category) {
  const palettes = { "טכנולוגיה": ["#0b315d", "#13a0a0"], "אפל": ["#20242c", "#8c96a8"], "רכב חשמלי": ["#123b2c", "#54b985"], "ישראל": ["#164e88", "#79b8ee"], "ספורט": ["#4f1c6d", "#d15f91"], "רונאלדיניו": ["#07563d", "#e8b83e"], "מסי": ["#1c5d91", "#8ed0e9"], "דני אבדיה": ["#16325c", "#d9485f"] };
  const [from, to] = palettes[category] || ["#153b62", "#d7765e"];
  const label = escapeHtml(category);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600"><defs><linearGradient id="g"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/><circle cx="190" cy="120" r="170" fill="#fff" opacity=".12"/><circle cx="970" cy="520" r="230" fill="#fff" opacity=".1"/><text x="600" y="310" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="700">${label}</text></svg>`)}`;
}

function safeSummary(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|quot|lt|gt);/gi, " ").replace(/https?:\/\/\S+/g, " ").replace(/The post[\s\S]*?appeared first on[\s\S]*$/i, " ").replace(/(?:target=|_blank|font color|&nbsp;|a>)/gi, " ").replace(/\s+/g, " ").trim().slice(0, 420);
}

function safeTitle(value = "") {
  return String(value).replace(/\s+-\s+(?:ynet\.co\.il|וואלה!?|מעריב|ישראל היום|חדשות 12|ערוץ הספורט)\s*$/i, "").trim();
}

function safeUrl(value = "") {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ""; } catch { return ""; }
}

function storyCard(story) {
  const summary = safeSummary(story.summary);
  const fallback = fallbackImage(story.category);
  const sourceImage = story.image && !/\.mp4(?:$|\?)/i.test(story.image) ? story.image : fallback;
  const compact = summary.length < 100;
  const articleUrl = safeUrl(story.url);
  const image = `<img src="${escapeHtml(sourceImage)}" data-fallback="${escapeHtml(fallback)}" alt="תמונה עבור ${escapeHtml(story.category)}" loading="lazy" referrerpolicy="no-referrer">`;
  const articleLink = articleUrl ? `<a href="${escapeHtml(articleUrl)}" target="_blank" rel="noopener noreferrer">לכתבה המקורית ↗</a>` : "";
  return `<article class="story ${compact ? "compact" : "detailed"}" data-category="${escapeHtml(story.category)}" dir="rtl"><div class="visual">${image}<span class="tag">${escapeHtml(story.category)}</span></div><div class="story-body"><p class="section-label">${escapeHtml(story.source)}</p><h2>${escapeHtml(safeTitle(story.title))}</h2>${summary ? `<p>${escapeHtml(summary)}</p>` : ""}<div class="source"><span>מקור: ${escapeHtml(story.source)}</span>${articleLink}</div></div></article>`;
}

function render(filter = "הכול") {
  const stories = Array.isArray(briefing.stories) ? briefing.stories : [];
  const breaking = Array.isArray(briefing.flashes) ? briefing.flashes : [];
  const showFlashes = filter === "הכול" || filter === "מבזקים";
  const showStories = filter !== "מבזקים";
  flashesSection.hidden = !showFlashes; flashesCard.hidden = !showFlashes;
  feedSection.hidden = !showStories; feed.hidden = !showStories;
  const visibleStories = filter === "הכול" ? stories : stories.filter(story => story.category === filter);
  feed.innerHTML = visibleStories.length ? visibleStories.map(storyCard).join("") : `<p class="empty-state">אין כרגע ידיעות חדשות בקטגוריה הזאת. החיפוש יתבצע שוב בעדכון הבא.</p>`;
  feed.querySelectorAll("img[data-fallback]").forEach(image => {
    const applyFallback = () => { if (!image.src.startsWith("data:image/svg+xml")) image.src = image.dataset.fallback; };
    image.addEventListener("error", applyFallback, { once: true });
    if (image.complete && image.naturalWidth === 0) applyFallback();
    window.setTimeout(() => { if (!image.complete || image.naturalWidth === 0) applyFallback(); }, 1200);
  });
  flashes.innerHTML = breaking.length ? breaking.map(item => `<li><strong>${escapeHtml(item.title)}</strong><span>מקור: ${escapeHtml(item.source)}</span></li>`).join("") : `<li class="empty-state">אין מבזקים זמינים כרגע.</li>`;
}

document.querySelectorAll(".topic").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".topic").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  render(button.dataset.filter);
  document.querySelector(button.dataset.filter === "מבזקים" ? "#flashes-section" : "#feed-section").scrollIntoView({ behavior: "smooth", block: "start" });
}));

fetch(`./data/briefing.json?v=${Date.now()}`, { cache: "no-store" }).then(response => { if (!response.ok) throw new Error("briefing unavailable"); return response.json(); }).then(data => {
  briefing = data; render();
  if (data.updatedAt) document.querySelector("#updatedAt").textContent = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit" }).format(new Date(data.updatedAt));
}).catch(() => render());

document.querySelector("#today").textContent = new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
const root = document.documentElement, themeButton = document.querySelector("#themeButton");
if (localStorage.getItem("shauli-theme") === "dark") { root.classList.add("dark"); themeButton.textContent = "☀"; }
themeButton.addEventListener("click", () => { root.classList.toggle("dark"); const dark = root.classList.contains("dark"); themeButton.textContent = dark ? "☀" : "☾"; localStorage.setItem("shauli-theme", dark ? "dark" : "light"); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
