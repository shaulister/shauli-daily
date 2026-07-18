const feed = document.querySelector("#feed");
const flashes = document.querySelector("#flashes");
const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function storyCard(story) {
  const image = story.image ? `<img src="${escapeHtml(story.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<div class="visual-grid"></div>`;
  return `<article class="story"><a class="visual" href="${escapeHtml(story.url)}" target="_blank" rel="noopener noreferrer">${image}<span class="tag">${escapeHtml(story.category)}</span></a><div class="story-body"><p class="section-label">${escapeHtml(story.source)}</p><h2><a href="${escapeHtml(story.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(story.title)}</a></h2>${story.summary ? `<p>${escapeHtml(story.summary)}</p>` : ""}<div class="source"><span>${escapeHtml(story.source)}</span><a href="${escapeHtml(story.url)}" target="_blank" rel="noopener noreferrer">לכתבה המלאה</a></div></div></article>`;
}

function render(data) {
  const stories = Array.isArray(data.stories) ? data.stories : [];
  const breaking = Array.isArray(data.flashes) ? data.flashes : [];
  feed.innerHTML = stories.length ? stories.map(storyCard).join("") : `<p class="empty-state">הכתבות מתעדכנות כעת. כדאי לרענן בעוד כמה דקות.</p>`;
  flashes.innerHTML = breaking.length ? breaking.map(item => `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a><span>${escapeHtml(item.source)}</span></li>`).join("") : `<li class="empty-state">אין מבזקים זמינים כרגע.</li>`;
  if (data.updatedAt) document.querySelector("#updatedAt").textContent = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit" }).format(new Date(data.updatedAt));
}

fetch(`./data/briefing.json?v=${Date.now()}`, { cache: "no-store" }).then(response => { if (!response.ok) throw new Error("briefing unavailable"); return response.json(); }).then(render).catch(() => render({ stories: [], flashes: [] }));
document.querySelector("#today").textContent = new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
const root = document.documentElement, themeButton = document.querySelector("#themeButton");
if (localStorage.getItem("shauli-theme") === "dark") { root.classList.add("dark"); themeButton.textContent = "☀"; }
themeButton.addEventListener("click", () => { root.classList.toggle("dark"); const dark = root.classList.contains("dark"); themeButton.textContent = dark ? "☀" : "☾"; localStorage.setItem("shauli-theme", dark ? "dark" : "light"); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
