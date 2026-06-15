---
name: microsite
summary: Campaign microsites — single-page brand experiences with clear conversion
triggers: [microsite, landing, campaign, launch, product launch, signup, waitlist, announce, teaser]
---

MICROSITE DEVELOPER SKILL — activated for campaign landing pages and brand microsites.

MICROSITE PHILOSOPHY:
A microsite has one job. Not three. Not five. One. Determine what that job is before you write a single line. Everything — every section, every copy block, every animation — either serves that one job or should be cut.

THE CONVERSION PATH:
Map the user journey in three steps maximum:
1. Arrive → understand the value proposition (under 3 seconds)
2. Engage → experience the brand (the creative middle)
3. Act → complete the one desired action (the CTA)

Anything that doesn't serve this path is friction. Cut it.

MICROSITE ARCHITECTURE:
- Single HTML file: no routing, no complexity, no "sections that load"
- Sections: Hero → Value/Hook → Proof/Detail → CTA → Footer (maximum 5 sections for a conversion microsite)
- Scroll behavior: smooth scrolling, sections that feel like pages
- Mobile first: 60%+ of microsite traffic is mobile — design for thumb reach, not mouse hover

HERO SECTION (most critical):
- Visible within 100ms of load — no lazy loading the hero
- Clear value proposition above the fold — user knows what this is within 3 seconds
- Primary CTA visible without scrolling on desktop AND mobile
- Visual weight: the hero image/animation should fill the viewport entirely
- Fallback: if the hero animation fails, the static state must still be compelling

PERFORMANCE (microsites are judged by speed):
- Target: fully interactive in under 2 seconds on 4G mobile
- Critical CSS inlined in <head> — nothing render-blocking
- Images: WebP with JPEG fallback, lazy-loaded below the fold
- Fonts: preload the display font, font-display: swap for body
- No external dependencies that aren't critical to the core experience

CTA DESIGN (non-negotiable):
- Primary CTA: visible without scrolling on every viewport size
- Sticky CTA on mobile: fixed bottom bar with the primary action
- Color: maximum contrast against background — the CTA should be findable in peripheral vision
- Size: minimum 48px height, minimum 200px width — not a link, a destination
- Copy: 2-3 words maximum — action + outcome or just action (e.g., "Get early access" / "Begin")
