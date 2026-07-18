import { readFile, writeFile } from "node:fs/promises";

const DROPBOX_APP_KEY = "ow3ruzr864iaa3c";
const briefingPath = new URL("../data/briefing.json", import.meta.url);

function israelDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function getDropboxAccessToken() {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appSecret = process.env.DROPBOX_APP_SECRET;

  if (!refreshToken || !appSecret) return null;

  const credentials = Buffer.from(`${DROPBOX_APP_KEY}:${appSecret}`).toString("base64");
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Dropbox token refresh failed (${response.status})`);
  }

  const result = await response.json();
  return result.access_token;
}

async function uploadToDropbox(accessToken, dropboxPath, contents) {
  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: dropboxPath,
        mode: "overwrite",
        autorename: false,
        mute: true,
      }),
    },
    body: contents,
  });

  if (!response.ok) {
    throw new Error(`Dropbox upload failed for ${dropboxPath} (${response.status})`);
  }
}

const current = JSON.parse(await readFile(briefingPath, "utf8"));
current.date = israelDate();
current.updatedAt = new Date().toISOString();
current.backup = "pending";

const accessToken = await getDropboxAccessToken();
current.backup = accessToken ? "dropbox" : "not-configured";
current.note = accessToken
  ? "התדריך נשמר באתר ובארכיון Dropbox."
  : "התדריך נשמר באתר; חיבור Dropbox עדיין אינו פעיל.";

const contents = `${JSON.stringify(current, null, 2)}\n`;
await writeFile(briefingPath, contents);

if (accessToken) {
  await uploadToDropbox(accessToken, `/archive/${current.date}.json`, contents);
  await uploadToDropbox(accessToken, "/latest.json", contents);
}
