# Unmade with AI

Small web app to remove C2PA provenance metadata from images entirely in the browser.

Features
- Strips APP11 JUMBF, XMP provenance and C2PA chunks from JPEG/PNG/WebP
- 100% local processing (no uploads)
- Simple drag & drop or file picker
- Lightweight single-page app (Vite + React + TypeScript + Tailwind)

Quick start
1. Install dependencies

```bash
npm install
```

2. Run development server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

## SEO / AEO

The site is a single-page app, but every SEO-critical artifact is emitted as **static
HTML at build time** — most crawlers and AI answer engines fetch the raw markup without
executing JavaScript.

| Concern | Where |
| --- | --- |
| Titles, descriptions, canonical, Open Graph, Twitter cards | `index.html` |
| Google Search Console verification (meta + HTML file) | `index.html`, `public/google38bdc06669cee5fe.html` |
| JSON-LD (`WebSite`, `Organization`, `Person`, `WebApplication`, `HowTo`, `FAQPage`, `BreadcrumbList`) | `src/content/site.ts` → injected by `vite.config.ts` |
| No-JavaScript content fallback | `src/content/site.ts` → injected by `vite.config.ts` |
| Copy for headings, FAQ, formats and tools | `src/content/site.ts` (single source of truth) |
| `robots.txt` (incl. explicit allow-list for AI crawlers) | `public/robots.txt` |
| `sitemap.xml` | `public/sitemap.xml` |
| Web app manifest + icon | `public/site.webmanifest`, `public/favicon.png` |
| Favicon reused as `og:image` / `twitter:image` | `public/favicon.png` |
| Social share image (1200×630) | `public/og-image.png` |
| Cache / security headers | `vercel.json` |

`src/content/site.ts` holds the metadata, FAQ copy and structured-data builder. Both the
React UI (`src/App.tsx`) and the Vite HTML transform read from it, so the visible copy and
the JSON-LD can never drift apart. Editing a question in one place updates the rendered
page, the `FAQPage` schema and the `<noscript>` fallback together.

After changing copy, rebuild and re-submit `public/sitemap.xml` in Search Console.

Files you may want to edit
- Header, tool UI and content sections: `src/App.tsx`
- SEO / meta tags and favicon links: `index.html`
- Site metadata, FAQ and structured data: `src/content/site.ts`
- Structured-data + no-JS injection: `vite.config.ts`
- Robots: `public/robots.txt`
- Core logic for stripping metadata: `src/utils/c2pa-remover.ts`

Credits
- UI and development: Husnain Mazhar — https://husnainmazhar.com

Notes
- Everything runs in-browser; make sure to test with representative images.
- `public/` is the only directory Vite copies verbatim into `dist/`. Root-level files
  are **not** deployed, so `robots.txt`, `sitemap.xml` and icons must live in `public/`.
