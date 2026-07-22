import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "./site.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "src");
const postsDir = path.join(src, "posts");
const dist = path.join(__dirname, "dist");
const assetsDir = path.join(src, "assets");
const siteUrl = (process.env.SITE_URL || site.defaultUrl).replace(/\/$/, "");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeXml(value = "") {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

function parseFrontMatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value === "true") value = true;
    if (value === "false") value = false;
    data[key] = value;
  }
  return { data, body: match[2].trim() };
}

function inlineMarkdown(text) {
  let out = escapeHtml(text);
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let paragraph = [];
  let listType = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph(); closeList(); out.push("<hr>"); continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    if (h3 || h2 || h1) {
      flushParagraph(); closeList();
      const level = h3 ? 3 : h2 ? 2 : 1;
      const text = (h3 || h2 || h1)[1];
      out.push(`<h${level}>${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph(); closeList();
      out.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    const ul = line.match(/^[-*]\s+(.+)$/);
    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ul || ol) {
      flushParagraph();
      const desired = ul ? "ul" : "ol";
      if (listType !== desired) {
        closeList();
        listType = desired;
        out.push(`<${listType}>`);
      }
      out.push(`<li>${inlineMarkdown((ul || ol)[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  return out.join("\n");
}

function slugFromFilename(filename) {
  return filename
    .replace(/\.md$/i, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00Z`));
}

function header(prefix = "") {
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="${prefix}index.html" aria-label="Nangkiew Foundation Insights home">
        <img src="${prefix}assets/nangkiew-foundation-logo.png" alt="Nangkiew Foundation logo">
        <span class="brand-copy">
          <strong>Nangkiew Foundation</strong>
          <span>Insights</span>
        </span>
      </a>
      <nav class="nav" aria-label="Primary navigation">
        <a href="${prefix}index.html#articles">Articles</a>
        <a href="${prefix}index.html#themes">Themes</a>
        <a href="${prefix}index.html#about">About</a>
        <a class="nav-cta" href="${site.linktree}" target="_blank" rel="noopener noreferrer">All links</a>
      </nav>
    </div>
  </header>`;
}

function footer(prefix = "") {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="${prefix}assets/nangkiew-foundation-logo.png" alt="">
          <div>
            <h3>${site.publication}</h3>
            <p>${site.tagline}</p>
          </div>
        </div>
        <div class="footer-links">
          <a href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="${site.telegram}" target="_blank" rel="noopener noreferrer">Telegram</a>
          <a href="${site.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href="${site.x}" target="_blank" rel="noopener noreferrer">X</a>
          <a href="mailto:${site.email}">Email</a>
          <a href="${site.linktree}" target="_blank" rel="noopener noreferrer">Linktree</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year></span> Nangkiew Foundation.</span>
        <span>Meghalaya, India</span>
      </div>
    </div>
  </footer>`;
}

function layout({ title, description, canonical, body, prefix = "", extraHead = "", script = "main.js" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#264677">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="${prefix}assets/nangkiew-foundation-logo.png">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${siteUrl}/assets/nangkiew-foundation-logo.png">
  <meta name="twitter:card" content="summary_large_image">
  ${extraHead}
  <link rel="stylesheet" href="${prefix}assets/styles.css">
</head>
<body>
  ${header(prefix)}
  ${body}
  ${footer(prefix)}
  <script src="${prefix}assets/${script}" defer></script>
</body>
</html>`;
}

fs.rmSync(dist, { recursive: true, force: true });
ensureDir(dist);
fs.cpSync(assetsDir, path.join(dist, "assets"), { recursive: true });

const files = fs.readdirSync(postsDir)
  .filter((name) => name.endsWith(".md") && !name.startsWith("_"));

const posts = files.map((filename) => {
  const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
  const { data, body } = parseFrontMatter(raw);
  const slug = slugFromFilename(filename);
  return {
    ...data,
    slug,
    bodyHtml: markdownToHtml(body),
    url: `/articles/${slug}/`
  };
}).sort((a, b) => String(b.date).localeCompare(String(a.date)));

for (const post of posts) {
  const dir = path.join(dist, "articles", post.slug);
  ensureDir(dir);
  const canonical = `${siteUrl}${post.url}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: canonical
  };
  const body = `
    <div class="article-progress" aria-hidden="true"></div>
    <main id="main">
      <section class="article-hero">
        <div class="article-hero-inner">
          <p class="eyebrow category">${escapeHtml(post.category)}</p>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="article-deck">${escapeHtml(post.description)}</p>
          <div class="meta">
            <span>By ${escapeHtml(post.author)}</span>
            <span>${formatDate(post.date)}</span>
            <span>${escapeHtml(post.readTime || "")}</span>
          </div>
          <div class="article-actions">
            <button id="copy-link" type="button">Copy link</button>
            <button type="button" onclick="window.print()">Print</button>
            <a href="${site.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp channel</a>
          </div>
        </div>
      </section>
      <div class="article-shell">
        <aside class="article-aside" aria-label="Article details">
          <div class="aside-box"><strong>Published</strong>${formatDate(post.date)}</div>
          <div class="aside-box"><strong>Theme</strong>${escapeHtml(post.category)}</div>
          <div class="aside-box"><strong>Publication</strong>Nangkiew Foundation Insights</div>
        </aside>
        <article class="article-body">
          ${post.bodyHtml}
          <div class="article-end">
            <a href="../../index.html#articles">← Back to all articles</a>
          </div>
        </article>
      </div>
    </main>`;
  const html = layout({
    title: `${post.title} | ${site.publication}`,
    description: post.description,
    canonical,
    prefix: "../../",
    script: "article.js",
    extraHead: `<meta property="article:published_time" content="${post.date}">
    <meta property="article:section" content="${escapeHtml(post.category)}">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    body
  });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];
const featured = posts.find(p => p.featured) || posts[0];

const featuredHtml = featured ? `
  <article class="featured-card">
    <div class="featured-visual"><span>Featured article</span></div>
    <div class="featured-body">
      <div class="meta">
        <span>${escapeHtml(featured.category)}</span>
        <span>${formatDate(featured.date)}</span>
      </div>
      <h3>${escapeHtml(featured.title)}</h3>
      <p>${escapeHtml(featured.description)}</p>
      <a class="text-link" href=".${featured.url}">Read article <span>→</span></a>
    </div>
  </article>` : "";

const filterButtons = ["All", ...categories].map((category, i) =>
  `<button class="filter ${i === 0 ? "active" : ""}" type="button" data-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`
).join("");

const postCards = posts.map(post => {
  const searchText = `${post.title} ${post.description} ${post.author} ${post.category}`.toLowerCase();
  return `
    <article class="post-card" data-post-card data-category="${escapeHtml(post.category)}" data-search="${escapeHtml(searchText)}">
      <a class="cover-link" href=".${post.url}">
        <span class="category">${escapeHtml(post.category)}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.description)}</p>
      </a>
      <div class="meta">
        <span>${formatDate(post.date)}</span>
        <span>${escapeHtml(post.readTime || "")}</span>
      </div>
    </article>`;
}).join("");

const homeBody = `
<main id="main">
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">Nangkiew Foundation · Meghalaya</p>
        <h1>Ideas that can move Meghalaya forward.</h1>
        <p>${escapeHtml(site.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-light" href="#articles">Read our articles</a>
          <a class="btn btn-ghost" href="${site.linktree}" target="_blank" rel="noopener noreferrer">Connect with us</a>
        </div>
      </div>
      <div class="hero-mark">
        <img src="assets/nangkiew-foundation-logo.png" alt="Nangkiew Foundation">
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="featured-title">
    <div class="section-head">
      <div>
        <p class="eyebrow category">Editor's selection</p>
        <h2 id="featured-title">Featured insight</h2>
        <div class="rule"></div>
      </div>
    </div>
    ${featuredHtml}
  </section>

  <section class="section" id="articles" aria-labelledby="articles-title">
    <div class="section-head">
      <div>
        <p class="eyebrow category">Publication archive</p>
        <h2 id="articles-title">Latest articles</h2>
        <p>Research, commentary and explainers written for readers who want both context and practical ideas.</p>
      </div>
    </div>

    <div class="toolbar">
      <label class="search">
        <span class="skip-link">Search articles</span>
        <input id="article-search" type="search" placeholder="Search by topic, title or author">
      </label>
      <div class="filters" aria-label="Article category filters">${filterButtons}</div>
    </div>

    <div class="post-grid">
      ${postCards}
      <div class="empty-state" id="empty-state" hidden>No articles match that search yet.</div>
    </div>
  </section>

  <section class="themes" id="themes">
    <div class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow category">What we write about</p>
          <h2>Core themes</h2>
          <p>A clear editorial structure keeps the publication focused while allowing the Foundation to grow into new subjects over time.</p>
        </div>
      </div>
      <div class="theme-grid">
        <div class="theme-card"><span class="theme-no">01</span><h3>Education & Human Capital</h3><p>Institutions, scholarships, skills, careers and pathways for young people.</p></div>
        <div class="theme-card"><span class="theme-no">02</span><h3>Economy & Development</h3><p>Jobs, enterprise, public finance, investment and regional economic development.</p></div>
        <div class="theme-card"><span class="theme-no">03</span><h3>Technology & Opportunity</h3><p>Digital access, AI, data, innovation and the changing world of work.</p></div>
        <div class="theme-card"><span class="theme-no">04</span><h3>Governance & Public Policy</h3><p>Evidence-led discussion of institutions, implementation and public outcomes.</p></div>
      </div>
    </div>
  </section>

  <section class="section" id="about">
    <div class="about-panel">
      <div>
        <p class="eyebrow">About the publication</p>
        <h2>Evidence with a local purpose.</h2>
      </div>
      <div>
        <p>Nangkiew Foundation Insights is designed as a permanent home for the Foundation's articles, research notes and public-interest explainers. The editorial approach is simple: make evidence readable, keep Meghalaya's context visible, and distinguish clearly between facts, interpretation and recommendations.</p>
        <p>For collaborations, corrections or article-related enquiries, write to <a href="mailto:${site.email}">${site.email}</a>.</p>
      </div>
    </div>
  </section>
</main>`;

const home = layout({
  title: `${site.publication} | Meghalaya`,
  description: site.description,
  canonical: `${siteUrl}/`,
  body: homeBody
});
fs.writeFileSync(path.join(dist, "index.html"), home);

const notFound = layout({
  title: `Page not found | ${site.publication}`,
  description: "The requested page could not be found.",
  canonical: `${siteUrl}/404.html`,
  body: `<main id="main" class="not-found"><p class="eyebrow category">404</p><h1>Page not found</h1><p>The page may have moved or the link may be incomplete.</p><a class="btn btn-blue" href="/index.html">Return home</a></main>`
});
fs.writeFileSync(path.join(dist, "404.html"), notFound);

const sitemap = [
  `${siteUrl}/`,
  ...posts.map(p => `${siteUrl}${p.url}`)
].map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n");
fs.writeFileSync(path.join(dist, "sitemap.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap}
</urlset>`);

const rssItems = posts.map(post => `
  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${siteUrl}${post.url}</link>
    <guid>${siteUrl}${post.url}</guid>
    <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
    <description>${escapeXml(post.description)}</description>
  </item>`).join("\n");

fs.writeFileSync(path.join(dist, "feed.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(site.publication)}</title>
  <link>${siteUrl}/</link>
  <description>${escapeXml(site.description)}</description>
  ${rssItems}
</channel>
</rss>`);

fs.writeFileSync(path.join(dist, "robots.txt"),
`User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`);

console.log(`Built ${posts.length} post(s) into dist/.`);
