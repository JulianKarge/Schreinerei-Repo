import fs from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";

const startUrl = "https://schreinerei-rosch.de/";
const outDir = path.join(process.cwd(), "docs", "current-site");
await fs.mkdir(outDir, { recursive: true });

function cleanText(text) {
  return text
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function slugFromUrl(url) {
  const u = new URL(url);
  let slug = u.pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-");
  if (!slug) slug = "startseite";
  return slug;
}

async function getHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return await res.text();
}

const homeHtml = await getHtml(startUrl);
const $home = cheerio.load(homeHtml);

const links = $home("a[href]")
  .map((_, el) => $home(el).attr("href"))
  .get()
  .filter(Boolean)
  .map((href) => new URL(href, startUrl).href)
  .filter((url) => url.startsWith(startUrl))
  .filter((url) => !url.includes("#"));

const pages = [...new Set([startUrl, ...links])];

console.log("Found pages:");
pages.forEach((p) => console.log("-", p));

for (const url of pages) {
  try {
    const html = await getHtml(url);
    const $ = cheerio.load(html);

    $("script, style, noscript").remove();

    const title = $("title").first().text().trim();
    const headings = $("h1, h2, h3, h4, h5, h6")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    const paragraphs = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    const listItems = $("li")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    const bodyText = cleanText($("body").text());

    const md = `# ${title}

## URL
${url}

## Headings
${headings.map((h) => `- ${h}`).join("\n")}

## Paragraphs
${paragraphs.map((p) => `- ${p}`).join("\n\n")}

## List items
${listItems.map((li) => `- ${li}`).join("\n")}

## Full cleaned body text
${bodyText}
`;

    const filename = `${slugFromUrl(url)}.md`;
    await fs.writeFile(path.join(outDir, filename), md, "utf8");
    console.log(`Saved ${filename}`);
  } catch (err) {
    console.log(`Skipped ${url}: ${err.message}`);
  }
}