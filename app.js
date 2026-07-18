const feed = document.querySelector("#feed");
const flashes = document.querySelector("#flashes");
const flashesSection = document.querySelector("#flashes-section");
const flashesCard = document.querySelector(".flashes-card");
const feedSection = document.querySelector("#feed-section");
const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
let briefing = { stories: [], flashes: [] };

function storyCard(story) {
  const image = story.image && !/\.mp4(?:$|\?)/i.test(story.image) ? `<img src="${escapeHtml(story.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<div class="visual-grid"></div>`;
  return `<article class="story" data-category="${escapeHtml(story.category)}"><div class="visual">${image}<span class="tag">${escapeHtml(story.category)}</span></div><div class="story-body"><p class="section-label">${escapeHtml(story.source)}</p><h2>${escapeHtml(story.title)}</h2>${story.summary ? `<p>${escapeHtml(story.summary)}</p>` : `<p>הידיעה נבחרה לעדכון הבוקר. פרטים נוספים יתווספו בעדכון הבא.</p>`}<div class="source"><span>מקור: ${escapeHtml(story.source)}</span></div></div></article>`;
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
