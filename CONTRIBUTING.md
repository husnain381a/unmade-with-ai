# Contributing

Thanks for helping improve Unmade with AI. Focused bug reports, accessibility improvements, clearer documentation, and well-tested format handling are welcome.

## Get started

Use Node.js 22 and npm, then run:

```sh
git clone https://github.com/husnain381a/unmade-with-ai.git
cd unmade-with-ai
npm ci
npm run dev
```

For a substantial change, open an issue first so the approach can be discussed. For a small fix, a focused pull request is enough.

## Project principles

- Keep image processing on the user's device. Do not add image uploads, tracking, or storage without an explicit product decision.
- Preserve encoded image data. Metadata removal should not re-encode pixels.
- Keep controls accessible by keyboard, respect reduced motion, and verify small-screen layouts.
- Use the existing color, typography and spacing tokens in `src/tokens.css`.
- Keep shared copy and structured data synchronized through `src/content/site.ts`.

## Check your change

```sh
npm run lint
npm run typecheck
npm run build
```

For interface changes, check desktop and mobile widths and include a screenshot in the pull request. For parser changes, use non-sensitive JPEG, PNG and WebP fixtures, verify removed segments, and compare the encoded image data before and after. Include clean files, unsupported input, and malformed files where relevant.

Do not attach private images or credentials to issues or pull requests. Small synthetic fixtures are preferable for reproducible bugs.

## Pull requests

Explain the problem, the resulting behavior, and how you verified it. Keep unrelated cleanup out of the change. Use a descriptive commit title such as `fix: keep file actions reachable on mobile` or `docs: clarify supported image formats`.

## Font assets

Switzer is served through Fontshare. Do not commit downloaded font binaries; see `public/fonts/README.md` and the included third-party license.
