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

Files you may want to edit
- Header and UI: `src/App.tsx`
- SEO / meta tags and favicon link: `index.html`
- Favicon (SVG used by the app): `favicon.svg`
- Robots: `robots.txt`
- Core logic for stripping metadata: `src/utils/c2pa-remover.ts`

Credits
- UI and development: Husnain Mazhar — https://husnainmazhar.com

Notes
- Everything runs in-browser; make sure to test with representative images.
- If you want PNG favicon fallbacks or a webmanifest, I can add those next.
