# HUB — ai-forge.co marketing site (new small project, separate from every app)
One pass, no stops. New repo/folder: ai-forge-hub (Next.js App Router, TypeScript, Tailwind), deployed as its own Vercel project at ai-forge.co (apex; www redirects to apex).
No database. No user accounts on the hub. Never print secrets. Neo supplies logos/thumbnails/copy later; build with clearly marked placeholders that fail a build-time check if any placeholder text remains in production.

## Pages
1. / Home: short headline + large selectable thumbnail tiles (responsive grid, keyboard focusable, whole tile clickable) for: Cinematic Forge, Forge Studio, Forge Marketing (was Growth Engine), AEROFORM, Loophole Detective.
   Each tile: image, name, one-line description, status badge (Live / Beta / Coming soon) from one config file. Footer: About, Contact, Donate, Investors, Privacy, Terms.
2. /products/[slug] one description page per product (what it does, who it's for, screenshots slot, status, a primary button to the product's own address, a "Get updates" link to Contact). Slugs: cinematic-forge, forge-studio,
   forge-marketing, aeroform, loophole-detective. Product config (name, slug, tagline, status, external URL, thumbnail) lives in ONE file src/config/products.ts; adding a product = one entry.
3. /about, /contact, /donate, /investors, /privacy, /terms.
4. /contact: form (name, email, topic [General, Support, Press, Moderator application, Developer/partner], message). Server action sends email to contact@ai-forge.co via the configured email provider (env: EMAIL_*), with
   honeypot field, rate limit per IP, size limits, and server-side validation; no message content stored; success/failure state shown honestly (INV-4). Moderator application is a topic with extra fields (experience, availability, links).
5. /donate: plain page explaining donations support development, with a Stripe-hosted donation link (env DONATE_URL; hide the button when unset). Wording: voluntary support, NOT tax-deductible, not a registered charity.
   Add a TODO banner in the report: Neo's accountant must approve the wording and GST/income treatment.
6. /investors: short statement + enquiry form (name, email, organisation, message) to the same email path under topic "Investor enquiry". No offers, return claims, or financial figures on the page. TODO: lawyer review of wording before launch.
7. Community link: nav item "Community" shown only when COMMUNITY_URL is set (future community.ai-forge.co).

## Rules
- Each product opens on its own subdomain: cinema.ai-forge.co, studio.ai-forge.co, marketing.ai-forge.co, aeroform.ai-forge.co, loophole.ai-forge.co (URLs from products.ts, not hard-coded in components).
- Accessibility: AA contrast, alt text, focus states, reduced-motion. Mobile first. Lighthouse >= 90 performance/accessibility/SEO.
- SEO: per-page metadata, Open Graph images, sitemap.xml, robots.txt, canonical host ai-forge.co. Analytics only if Neo asks; no third-party trackers; no cookie banner needed if none are set.
- Security headers: CSP (self + Stripe link only), HSTS max-age only (no includeSubDomains/preload yet), X-Content-Type-Options, Referrer-Policy, frame-ancestors none. Cookies: none set.
- Legal pages: generate clearly marked DRAFT privacy/terms from standard Australian-style structure; Neo's lawyers approve before launch. Do not claim compliance.
- Honest content (INV-4): status badges must match reality; no fake user counts, testimonials or "trusted by" claims.
- Brand: neutral wording; keep trademark-neutral naming consistent with BUILD-FIX-SMALL-2.

## Tests/gates
tsc 0, lint 0, build ok, unit tests (contact validation, honeypot, rate limit, products config shape), build-time check that no placeholder remains when NODE_ENV=production, Playwright smoke (home loads, tile click goes to the product URL, contact validation errors, donate hidden when DONATE_URL unset).
Final report: PASS/NOT DONE per page, env vars to set (EMAIL_*, DONATE_URL, COMMUNITY_URL), DNS/Vercel steps for Neo (apex + www redirect, subdomains handled by each app's project), and the lawyer/accountant TODO list.
