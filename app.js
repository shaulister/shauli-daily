const stories=[
 {id:"israel",tag:"ישראל",title:"היום בישראל: הנושאים שישפיעו על סדר היום",text:"התדריך מרכז את ההתפתחויות המדיניות, הביטחוניות והכלכליות החשובות ומפריד בין עובדות מאומתות לבין דיווחים שעדיין מתפתחים.",why:"כך אפשר להבין במהירות מה השתנה מאז אתמול ומה עדיין דורש מעקב."},
 {id:"tech",tag:"טכנולוגיה",title:"השקות המוצרים שכדאי להכיר",text:"עדכוני חומרה, תוכנה ושירותים חדשים מוצגים בתקציר קצר, עם דגש על שימושיות ולא רק על מפרטים.",why:"לא כל הכרזה משנה את חיי היום־יום; כאן נבליט רק את אלו שכן."},
 {id:"sport",tag:"ספורט",title:"האירועים המרכזיים על המגרש",text:"תוצאות, משחקים קרובים והסיפורים הגדולים של היום במקום אחד, בלי להציף בפרטים שוליים.",why:"מקבלים תמונת מצב ברורה לפני המשחק או האירוע הבא."},
 {id:"culture",tag:"תרבות ובידור",title:"מה חדש במסכים ובבמות",text:"הסדרות, הסרטים, האלבומים והאירועים הבולטים של השבוע, לצד המלצה ממוקדת למה באמת שווה להקדיש זמן.",why:"פחות חיפוש בין שירותים, יותר בחירה מהירה ומדויקת."}
];
const feed=document.querySelector("#feed");
feed.innerHTML=stories.map((s,i)=>`<article class="story" id="${s.id}"><div class="visual" role="img" aria-label="רקע חזותי עבור ${s.tag}"><span class="tag">${s.tag}</span><div class="visual-grid"></div></div><div class="story-body"><p class="section-label">${s.tag}</p><h2>${s.title}</h2><p>${s.text}</p><aside><strong>למה זה חשוב?</strong>${s.why}</aside><div class="source"><span>תוכן הדגמה</span><span>${"★".repeat(5-i%2)}</span></div></div></article>`).join("");
document.querySelector("#today").textContent=new Intl.DateTimeFormat("he-IL",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date());
const root=document.documentElement;const themeButton=document.querySelector("#themeButton");
const saved=localStorage.getItem("shauli-theme");if(saved==="dark"){root.classList.add("dark");themeButton.textContent="☀"}
themeButton.addEventListener("click",()=>{root.classList.toggle("dark");const dark=root.classList.contains("dark");themeButton.textContent=dark?"☀":"☾";localStorage.setItem("shauli-theme",dark?"dark":"light")});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"))}
