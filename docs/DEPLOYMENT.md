# Deploying Unmade with AI

Unmade with AI is a static React/Vite application. Image processing runs in the browser, so deployment does not require an application server, database, account service, environment variables or API keys.

## Build the site

Use Node.js 22 or later and npm:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
```

Deploy the generated `dist/` directory. Do not deploy the source tree or use the Vite development server as a production server.

Check the production bundle locally with `npm run preview` before publishing.

## Vercel

1. Import the GitHub repository into a Vercel project.
2. Select the **Vite** framework preset.
3. Use `npm ci` as the install command, `npm run build` as the build command, and `dist` as the output directory.
4. Add a custom domain if needed. No application environment variables are required.

The repository's `vercel.json` supplies cache and browser-security headers. An existing Vercel project connected to this repository may deploy pushes to its configured production branch automatically.

## Other static hosts

Any host that serves the contents of `dist/` over HTTPS can serve the app. Preserve the generated directory structure and serve JavaScript, CSS, JSON, SVG and PNG files with their appropriate content types.

The app uses a single `/` route and section anchors rather than client-side page routes. No application-route rewrite is required.

Hashed assets under `/assets/` can be cached for a long period. Revalidate the HTML so new deployments can reference their updated asset filenames.

## Set your public URL and identity

When deploying a fork to a different domain, update:

| File | Values to review |
| --- | --- |
| `src/content/site.ts` | Site URL, name, author, image dimensions and shared copy. |
| `index.html` | Canonical URL, alternate URLs, Open Graph and Twitter metadata, icon links, and search verification. |
| `public/sitemap.xml` | Public page URL. |
| `public/robots.txt` | Sitemap location. |
| `public/site.webmanifest` | Name, icons, theme colors and application scope. |

Replace or remove the original site's search-verification token and HTML verification file when hosting your own instance.

`vite.config.ts` injects structured data and readable no-JavaScript reference content during the build. Rebuild after changing shared copy or metadata. JavaScript remains necessary for image processing.

## Fonts and offline behavior

Switzer is loaded from Fontshare's hosted CDN, with system sans-serif fallbacks if it is unavailable. The project does not redistribute the font binaries. A restricted network or content-security policy must permit the configured Fontshare font URLs if the custom face is desired.

Once the page and application code have loaded, local image processing can continue without an active connection. The app does not register a service worker, so a fresh offline visit or reload is not guaranteed to work.

## Verify a deployment

- Open the public URL on desktop and mobile, and check the logo and browser icon.
- Select a non-sensitive JPEG, PNG and WebP sample. Check the preview, result status, metadata disclosure, and download.
- Try an already-clean image and an unsupported file.
- Confirm image selection and processing do not send image data to a server.
- Check the served HTML for the canonical URL, JSON-LD and no-JavaScript reference content.
- Open `/robots.txt`, `/sitemap.xml`, `/site.webmanifest` and `/favicon.svg`.
