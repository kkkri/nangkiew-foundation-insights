# Nangkiew Foundation Insights

A lightweight static publication website for Nangkiew Foundation.

## What is included

- Responsive homepage and article archive
- Featured article area
- Search and category filtering
- Individual article pages
- Reading progress bar, copy-link and print controls
- SEO metadata, sitemap, robots.txt and RSS feed
- Foundation social/contact links
- Netlify configuration
- No database and no paid CMS required

## Fastest way to test locally

You need Node.js installed.

```bash
cd nangkiew-foundation-insights
npm run build
npx serve dist
```

`npm run build` has no third-party package dependencies. The build script uses Node's built-in modules only.

You can also open `dist/index.html` directly for a quick visual check, although a small local server is better for testing links.

## Add a new article

1. Open `src/posts/_ARTICLE_TEMPLATE.md`.
2. Make a copy.
3. Rename it using this pattern:

   `2026-07-29-your-article-title.md`

4. Edit the front matter at the top:
   - title
   - description
   - date
   - author
   - category
   - featured
   - readTime
5. Write the article below the second `---`.
6. Run:

```bash
npm run build
```

7. Commit and push to GitHub. If GitHub is connected to Netlify, the updated site deploys automatically.

### Supported article formatting

```md
## Heading

Normal paragraph with **bold**, *italics* and [a link](https://example.com).

- Bullet item
- Another item

> Highlighted quote or takeaway

## References

1. [Report title](https://example.com)
2. [Research paper](https://example.com)
```

## Deploy free on Netlify

### Option A — recommended: GitHub + Netlify

1. Create a GitHub repository, for example `nangkiew-foundation-insights`.
2. Upload all files in this folder to the repository.
3. In Netlify choose **Add new project / Import an existing project**.
4. Connect GitHub and select the repository.
5. Netlify should read `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Deploy.
7. In Netlify, set the environment variable `SITE_URL` to the final blog URL, for example:
   `https://nangkiewfoundationblog.netlify.app`
8. Redeploy once so canonical links, sitemap and social metadata use the final URL.

After that, publishing is simple: add a Markdown file, commit, push.

### Option B — quickest first launch: drag and drop

The included `dist/` folder is already built.

1. Open Netlify's manual deploy area.
2. Drag the **dist** folder into Netlify.
3. Netlify gives you a free `.netlify.app` address.

For future articles, rebuild the site and drag the updated `dist/` folder again.

## Suggested public structure

- Linktree: your existing social hub
- Blog: `nangkiewfoundationblog.netlify.app`
- Later, with a custom domain:
  - `nangkiewfoundation.org`
  - `insights.nangkiewfoundation.org`

Add a **Blog / Insights** button to the existing Linktree when the blog is live.

## Important before launch

Replace the sample welcome article if you prefer not to publish it.
Review the contact/social links in `site.config.mjs`.
After Netlify assigns the final URL, set `SITE_URL`.
