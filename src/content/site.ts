/**
 * Single source of truth for site metadata, FAQ copy and structured data.
 *
 * This file is imported by BOTH the React UI (src/App.tsx) and the Vite HTML
 * transform (vite.config.ts) so the visible copy and the JSON-LD / no-JS
 * fallback can never drift apart.
 */

export const SITE = {
  name: 'Unmade with AI',
  shortName: 'Unmade',
  url: 'https://unmadeai.husnain.website',
  locale: 'en_US',
  lang: 'en',
  themeColor: '#0c0c0e',
  ogImage: '/favicon.png',
  ogImageWidth: 167,
  ogImageHeight: 180,
  /** Google Search Console HTML-file verification token. */
  gscVerification: 'google38bdc06669cee5fe.html',
  author: {
    name: 'Husain Mazhar',
    url: 'https://husnainmazhar.com',
  },
  /** One-sentence answer used as the answer-engine summary block. */
  answer:
    'Unmade with AI removes C2PA provenance metadata (Content Credentials) from JPEG, PNG and WebP images entirely in your browser — your files are never uploaded.',
  description:
    'Remove C2PA metadata from AI images fast. Strips Content Credentials, JUMBF and XMP provenance from JPEG, PNG and WebP. 100% private — runs in your browser.',
  longDescription:
    'Unmade with AI is a free, private C2PA metadata remover. It strips AI provenance manifests (Content Credentials, APP11/JUMBF, XMP, caBX and c2pa chunks) from JPEG, PNG and WebP files without re-encoding the image, so pixels stay identical. Everything runs client-side in your browser — no uploads, no server, no logs.',
} as const;

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'What is C2PA metadata?',
    a: 'C2PA (Coalition for Content Provenance and Authenticity) is an open technical standard that embeds a signed, machine-readable manifest inside a media file. The manifest records who created or edited the content, which tools were used, and an edit history. In practice it lives in APP11 JUMBF segments inside JPEG, in caBX or c2pa chunks inside PNG, and in XMP chunks inside WebP. Platforms such as Instagram, X and TikTok read this manifest to decide whether to show an "AI-generated" or "Made with AI" label.',
  },
  {
    q: 'Does removing C2PA metadata change my image?',
    a: 'No. Unmade with AI removes only the metadata containers (APP11/JUMBF segments, C2PA-bearing XMP segments, caBX and c2pa chunks) and then fixes up the container length fields. The encoded pixel data is never touched, so the downloaded file is visually identical to the original — only the provenance trail is gone.',
  },
  {
    q: 'Is my image uploaded to a server?',
    a: 'No. All processing happens entirely inside your browser using the File, Blob and ArrayBuffer APIs. Your images never leave your device, no server receives them, and nothing is logged or stored. You can even go offline after the page has loaded and the tool keeps working.',
  },
  {
    q: 'Which AI tools add C2PA metadata?',
    a: 'Google Gemini and Imagen, Adobe Firefly and Photoshop, OpenAI image generation in ChatGPT and the DALL-E family, Meta AI features in Instagram, WhatsApp and Messenger, and many other generative systems now attach C2PA Content Credentials to exported images. If a generator supports the standard, its downloads usually carry the manifest.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'JPEG, PNG and WebP. For JPEG the tool removes APP11 JUMBF segments plus XMP segments that reference C2PA. For PNG it removes caBX and c2pa chunks along with C2PA-bearing text chunks. For WebP it removes C2PA chunks and C2PA-referencing XMP chunks. GIF, HEIC and AVIF are not supported yet.',
  },
  {
    q: 'Is removing C2PA metadata legal?',
    a: 'In most jurisdictions, yes. A C2PA manifest is optional, additive metadata — the pixels remain yours, and removing the manifest does not violate the C2PA specification itself. That said, deliberately stripping provenance in order to misrepresent authorship can break the rules of the platform you publish to, may breach professional or journalism ethics codes, and may be unlawful in places with mandatory AI-disclosure laws. You are responsible for how you use the output.',
  },
  {
    q: 'Will platforms still know the image was made with AI?',
    a: 'Sometimes. This tool removes the provenance manifest embedded in the file itself. Platforms that label AI content usually combine that embedded manifest with server-side signals such as generation logs, upload metadata and account flags. With the manifest gone, most platforms simply stop showing the "Made with AI" badge, but no client-side tool can guarantee what a platform decides on its own.',
  },
  {
    q: 'Does removing metadata reduce image quality or file size?',
    a: 'Quality is unchanged because the pixels are never re-encoded. The file usually becomes slightly smaller, since the manifest and related XMP blocks are dropped. The app shows the exact before and after byte size for every file you process.',
  },
  {
    q: 'Does it work offline and on mobile?',
    a: 'Yes. It is a static site, so once the page has loaded it works offline. It runs in any modern browser on desktop and mobile, including Chrome, Edge, Firefox and Safari on iOS and Android, and you can process several images at once.',
  },
];

export interface HowToStep {
  name: string;
  text: string;
}
export const HOWTO_STEPS: HowToStep[] = [
  {
    name: 'Select your image',
    text: 'Drag and drop a JPEG, PNG or WebP file onto the drop zone, or click it to browse. You can add several files at once.',
  },
  {
    name: 'Let your browser strip the manifest',
    text: 'The app parses the file container in memory and removes the C2PA manifest, JUMBF and XMP provenance segments. The image never leaves your device.',
  },
  {
    name: 'Download the clean file',
    text: 'Save the pixel-identical result with the prefix unmade-. The removed items and the size difference are listed for every file.',
  },
];

export interface FormatRow {
  format: string;
  container: string;
  removed: string;
}

export const FORMATS: FormatRow[] = [
  {
    format: 'JPEG',
    container: 'APP11 (0xFFEB) and APP1 (0xFFE1) segments',
    removed: 'JUMBF manifest containers, XMP and extended XMP segments that reference C2PA.',
  },
  {
    format: 'PNG',
    container: 'caBX, c2pa and iTXt / tEXt / zTXt chunks',
    removed: 'Binary C2PA manifests and text chunks whose keywords point at C2PA provenance.',
  },
  {
    format: 'WebP',
    container: 'C2PA and XMP RIFF chunks',
    removed: 'Direct C2PA manifest chunks and XMP chunks that reference C2PA provenance.',
  },
];

export interface Tool {
  name: string;
  detail: string;
}

export const TOOLS: Tool[] = [
  { name: 'Google Gemini', detail: 'Imagen and Whisk exports carry C2PA Content Credentials.' },
  { name: 'Adobe Firefly', detail: 'Firefly and Photoshop save a signed provenance manifest.' },
  { name: 'OpenAI ChatGPT', detail: 'Generated image downloads can include C2PA provenance.' },
  { name: 'Meta AI', detail: 'Instagram, WhatsApp and Messenger AI features attach C2PA.' },
  { name: 'Midjourney & others', detail: 'Many generators now ship provenance manifests by default.' },
];

/** Explainer copy for the "What is C2PA metadata?" section. */
export const WHAT_IS_C2PA: string[] = [
  'C2PA (Coalition for Content Provenance and Authenticity) is an open technical standard that embeds a signed, machine-readable manifest inside a media file. The manifest records who created or edited the content, which tools were used, and an edit history.',
  'In practice the manifest lives in APP11 JUMBF segments inside JPEG, in caBX or c2pa chunks inside PNG, and in XMP chunks inside WebP. Platforms such as Instagram, X and TikTok read that manifest to decide whether to show an "AI-generated" or "Made with AI" label.',
  'Removing it strips the provenance trail without touching a single pixel — the encoded image data is copied byte for byte and only the metadata containers are dropped.',
];

/** The single on-page h1, shared by the React UI and the no-JS fallback. */
export const H1 = 'Remove C2PA metadata from AI images';
export const H1_ACCENT = 'in your browser, instantly';

/** Builds the JSON-LD @graph injected into the static HTML at build time. */
export function buildJsonLd(): Record<string, unknown> {
  const url = SITE.url;

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${url}/#website`,
      url: `${url}/`,
      name: SITE.name,
      description: SITE.description,
      inLanguage: 'en',
      publisher: { '@id': `${url}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${url}/#organization`,
      name: SITE.name,
      url: `${url}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${url}/favicon.png`,
        width: 167,
        height: 180,
      },
      founder: { '@id': `${url}/#founder` },
    },
    {
      '@type': 'Person',
      '@id': `${url}/#founder`,
      name: SITE.author.name,
      url: SITE.author.url,
    },
    {
      '@type': 'WebApplication',
      '@id': `${url}/#webapp`,
      name: SITE.name,
      url: `${url}/`,
      description: SITE.longDescription,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript. Works in Chrome, Edge, Firefox and Safari on desktop and mobile.',
      inLanguage: 'en',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Removes C2PA / Content Credentials provenance manifests',
        'Supports JPEG, PNG and WebP',
        'Runs fully in the browser — no uploads',
        'Preserves the original pixel data',
        'Batch processing with instant download',
      ],
      screenshot: {
        '@type': 'ImageObject',
        url: `${url}/favicon.png`,
        width: SITE.ogImageWidth,
        height: SITE.ogImageHeight,
      },
      publisher: { '@id': `${url}/#organization` },
      author: { '@id': `${url}/#founder` },
    },
    {
      '@type': 'HowTo',
      '@id': `${url}/#howto`,
      name: 'How to remove C2PA metadata from an AI image',
      description: 'Strip C2PA provenance metadata from a JPEG, PNG or WebP file without uploading it anywhere.',
      totalTime: 'PT1M',
      inLanguage: 'en',
      step: HOWTO_STEPS.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.name,
        text: s.text,
        url: `${url}/#step-${i + 1}`,
      })),
    },
    {
      '@type': 'FAQPage',
      '@id': `${url}/#faq`,
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}/#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${url}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'C2PA Metadata Remover',
          item: `${url}/#tool`,
        },
      ],
    },
  ];

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Escapes a string for safe embedding inside a JSON-LD <script> block. */
export function safeJsonLd(json: Record<string, unknown>): string {
  return JSON.stringify(json)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/** Escapes text for safe embedding in HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Builds the <noscript> fallback so crawlers without JS still see real content. */
export function buildNoscriptHtml(): string {
  const faqItems = FAQS.map(
    (f) =>
      `          <div><dt><h3>${escapeHtml(f.q)}</h3></dt><dd>${escapeHtml(f.a)}</dd></div>`,
  ).join('\n');

  const steps = HOWTO_STEPS.map(
    (s) =>
      `          <li><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.text)}</p></li>`,
  ).join('\n');

  const formats = FORMATS.map(
    (f) =>
      `            <tr><th scope="row">${escapeHtml(f.format)}</th><td>${escapeHtml(
        f.container,
      )}</td><td>${escapeHtml(f.removed)}</td></tr>`,
  ).join('\n');

  const tools = TOOLS.map(
    (t) => `          <li><h3>${escapeHtml(t.name)}</h3><p>${escapeHtml(t.detail)}</p></li>`,
  ).join('\n');

  const whatIs = WHAT_IS_C2PA.map((p) => `        <p>${escapeHtml(p)}</p>`).join('\n');

  return `    <noscript>
      <div class="noscript-fallback">
        <h1>${escapeHtml(H1)} — ${escapeHtml(H1_ACCENT)}</h1>
        <p><strong>${escapeHtml(SITE.answer)}</strong></p>
        <p>${escapeHtml(SITE.longDescription)}</p>

        <h2>What is C2PA metadata?</h2>
${whatIs}

        <h2>How to remove C2PA metadata</h2>
        <ol>
${steps}
        </ol>

        <h2>Supported formats</h2>
        <table>
          <thead><tr><th scope="col">Format</th><th scope="col">Container</th><th scope="col">What is removed</th></tr></thead>
          <tbody>
${formats}
          </tbody>
        </table>

        <h2>Which AI tools add C2PA metadata?</h2>
        <ul>
${tools}
        </ul>

        <h2>Frequently asked questions</h2>
        <dl>
${faqItems}
        </dl>

        <p>Enable JavaScript to use the tool. Everything runs locally in your browser — no image is ever uploaded.</p>
      </div>
    </noscript>`;
}
