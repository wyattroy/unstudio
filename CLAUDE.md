# Unstudio Website — Claude Context

## What this is

A static website for the **unstudio** — a pilot collaborative desk space at Harvard GSD that ran April 11–21, 2026. The site has three purposes:

- **Advocate** (`index.html`) — stats, petition wall, usage data, action cards (email dean, sign petition)
- **Archive** (`archive.html`) — origin story, 5 events, photo gallery, credits/thanks
- **Empower** (`toolkit.html`) — how to start your own unstudio, norms, workshop activities, signage downloads

## Tech stack

- Vanilla HTML/CSS/JS — no frameworks, no build step
- **Supabase** (PostgreSQL + Auth) for the petition form and admin panel
- Hosted on **GitHub Pages** at `wyattroy.github.io/unstudio`
- Fonts: GSD Gothic (loaded from `fonts/` folder)

## File map

| File | Purpose |
|------|---------|
| `index.html` | Advocate/homepage |
| `archive.html` | Archive page |
| `toolkit.html` | Empower/toolkit page |
| `admin.html` | Admin moderation panel (login required) |
| `css/style.css` | All styles, single file |
| `js/config.js` | Supabase URL + anon key + site config |
| `js/main.js` | Shared utilities: countdown timer, lightbox, nav |
| `js/petition.js` | Petition form + supporter wall (hybrid: JSON seed + Supabase) |
| `js/admin.js` | Admin login + approve/delete panel |
| `data/supporters.json` | 10 pre-seeded supporter testimonials |
| `images/Album/` | 36 event photos (used in archive gallery) |
| `images/` | Signage/poster images (used in toolkit) |

## Supabase

- **Project URL:** `https://avuedfyaqlupjwvvgmch.supabase.co`
- **Anon key:** in `js/config.js`
- **Table:** `supporters` (id, name, gsd_email, comment, approved, created_at)
- **RLS:** Public can read approved entries; anyone can insert; only authenticated admin can update/delete
- **Admin account:** `wyatty@gmail.com` / `4535warmUNO!`
- Petition requires `@gsd.harvard.edu` or `@harvard.edu` email — not displayed publicly

## Push workflow

SSH is set up. To push after any change:

```bash
git add . && git commit -m "your message" && git push
```

Site updates on GitHub Pages within ~60 seconds.

## Design conventions

- **No italics** anywhere — all fonts upright
- The word "unstudio" standing alone (in titles, nav, footer) uses GSD Gothic weight 800 via `.unstudio-word` class or the CSS rule targeting `.nav-logo`, `.hero-title`, `.footer-logo`
- Hero background image: `images/hero-bg.jpg` (orange/pink/blue marbled) — used on all three pages
- Color palette: hot pink (`#FF2D8C`), black, white, psychedelic gradients

## Key numbers (as of launch)

- 10 seeded petition supporters (in `data/supporters.json`); live signatures accumulate in Supabase
- 5 events hosted
- Attendance tracked via `images/unstudio usage.xlsx` (sampled every 4 hours)

## Known decisions

- Petition wall shows seeded JSON entries first, then live Supabase entries — `SEEDED_COUNT = 10` in config.js controls the offset for the displayed total count
- Site works in read-only mode if Supabase is not configured (form disables gracefully)
- Archive gallery uses `images/Album/` (36 photos); toolkit uses the root `images/` signage photos — don't swap these
