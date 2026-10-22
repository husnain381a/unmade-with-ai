import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { buildJsonLd, safeJsonLd, buildNoscriptHtml } from './src/content/site';

/**
 * Injects structured data (JSON-LD) and a no-JavaScript content fallback
 * directly into the static HTML.
 *
 * This matters for SEO/AEO: many crawlers (and most AI answer engines) fetch
 * the raw HTML without executing JavaScript, so schema and copy must exist in
 * the served markup — not only in the React tree.
 */
function seoStructuredData(): Plugin {
  return {
    name: 'seo-structured-data',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const schema = `    <script type="application/ld+json">${safeJsonLd(buildJsonLd())}</script>`;
        const noscript = buildNoscriptHtml();

        return html
          .replace('<!--@SEO_SCHEMA-->', schema)
          .replace('<!--@SEO_NOSCRIPT-->', noscript);
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), seoStructuredData()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Search engines and answer engines increasingly render JS, but a stable
    // hashed entry keeps caching predictable across deploys.
    assetsDir: 'assets',
  },
});
