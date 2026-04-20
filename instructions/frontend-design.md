# Frontend Design Execution

- For landing pages, dashboards, app shells, visual redesigns, motion polish, typography work, theming, or component beautification, load and follow the `frontend-design` skill before coding.
- Use `frontend_brief` first to lock purpose, audience, tone, visual direction, memorable idea, and implementation constraints.
- Set the design frame first: purpose, audience, emotional tone, visual direction, and the one thing users should remember.
- Commit to one coherent aesthetic direction; do not mix multiple styles casually.
- Build a clear visual system using shared tokens or CSS variables for typography, color, spacing, surfaces, and motion.
- Prefer deliberate hierarchy, spacing, and composition over default card-grid layouts.
- Preserve the existing product design system when working inside an established app.
- Keep accessibility and responsiveness intact on desktop and mobile.
- Reject generic AI-looking UI, random accents, and decorative motion that does not support hierarchy or usability.

## SEO Requirements (mandatory on every frontend task)
- Load the `seo-optimizer` skill for any task creating or modifying public-facing pages.
- Every page must have: unique `<title>` (≤60 chars), `<meta name="description">` (150-160 chars), single `<h1>` with primary keyword.
- Heading hierarchy must be logical: `h1` → `h2` → `h3`, never skip levels.
- All `<img>` tags must have descriptive `alt` text — never empty or generic (`alt="image"`).
- Implement schema markup (Organization, LocalBusiness, or Article) where applicable.
- Set `width` and `height` on images to prevent CLS (Cumulative Layout Shift).
- Use `loading="lazy"` on below-fold images, `loading="eager"` on hero/LCP images.
- Include Open Graph tags (`og:title`, `og:description`, `og:image`) on all public pages.
- Verify canonical tag is present on pages that may have duplicate URL variants.

## SEO Verification with Playwright (for dynamic/JS-rendered pages)
- Use `playwright` MCP to open the page in a real browser and verify SEO tags are present in the **rendered DOM** (not just source HTML).
- Check: `document.title`, `meta[name=description]`, `h1` count, `img` without `alt`, `link[rel=canonical]`.
- This is critical for Jinja/template engines where tags may be conditionally rendered or overridden.
- Run verification after implementation, before marking frontend task as done.
