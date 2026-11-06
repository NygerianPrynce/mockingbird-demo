---
name: mockingbird-slides
description: Build the Mockingbird pitch deck (1776 Labs 24-Hour Challenge) as web slides in this repo. Use when asked to make, restyle, or extend the Mockingbird slides. Starts by researching real reference decks so the look is picked by the team, not invented.
---

# Mockingbird slides skill

Read `BRIEF.md` first. It has the product, the story, the 8-minute run of show, the verified facts, and the brand. Do not invent facts, stats, or quotes. Anything not in `BRIEF.md` section 8 (Facts) is unverified and must be flagged, not stated.

## Step 1: find references BEFORE designing anything
Do not start from your own imagination. Do this first, every time:

1. Search the web for 10 to 12 genuinely good slide references. Mix these:
   - Winning or well-known pitch decks (for example Airbnb, Uber, Sequoia-style, YC demo-day decks)
   - Clean modern product keynotes and launch decks
   - Public-sector or civic-tech and nonprofit decks with a calm, trustworthy feel
   - Editorial and report-style decks (big type, lots of white space, data-forward)
2. For each, capture: name, URL, one screenshot if you can (browser tool), and 2 to 3 words on what makes it work (type scale, grid, color restraint, chart style, photo use).
3. Build a one-page moodboard (a local HTML page or a markdown file with images) and show the team. Group by direction, for example "Editorial and quiet", "Bold and high contrast", "Data-forward".
4. Ask the team to pick 1 to 3 references and say what to take from each (type, layout, pacing, charts). Wait for the answer.
5. Only then write the deck, and say which reference each slide borrows from.

Rules for the search: reference only the look and structure. Never copy another company's logo, text, or assets.

## Step 2: build
- Stack: web slides in this repo (reveal.js or plain HTML and CSS sections, Vite is fine). Must run with `npm install` then `npm run dev`, and export to PDF as a backup (reveal.js `?print-pdf`).
- 16:9, one idea per slide, large type, high contrast, WCAG AA. Speaker notes on every slide from `BRIEF.md` section 7.
- Use the brand in `BRIEF.md` section 9 and the files in `assets/`. Title slide uses the reversed logo (navy background). Content slides are about 90 percent white.
- Product screenshots: placeholders first, labeled with the screen name from `BRIEF.md` section 6. Swap for real captures once the team records them.
- Deploy: GitHub Pages or a static host so the deck opens from a link.

## Step 3: check before saying done
- Every number on a slide appears in `BRIEF.md` section 8 with its source in the appendix slides.
- Demo slide count and timing match the 8-minute run of show.
- No emoji icons, no purple or rainbow gradients, no glassmorphism, no stock "AI sparkle" imagery, no "AI-powered" badges.
- Open it in the browser and look at every slide. Fix overflow and low contrast.
