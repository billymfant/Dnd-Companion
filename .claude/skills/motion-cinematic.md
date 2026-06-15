---
name: cinematic
summary: Cinematic motion language for premium brand experiences
triggers: [brand, launch, campaign, product, luxury, premium, cinematic, film, editorial]
---

CINEMATIC MOTION SKILL — activated for premium brand experiences.

CINEMATIC PHILOSOPHY:
Film directors control exactly where you look at every moment. You have the same power. Every animation directs the eye to the next point of narrative focus. Nothing moves without purpose. Nothing stays still without reason.

THE REVEAL PRINCIPLE:
Great cinema shows, then explains — never the reverse. Design every entrance as a reveal: what is hidden, then shown. What is incomplete, then resolved. The reveal creates desire. The resolution creates satisfaction.

CINEMATIC TIMING SIGNATURES:
- Hero entrance: 800-1200ms — long enough to feel significant, short enough to not feel slow
- Primary easing: cubic-bezier(0.16, 1, 0.3, 1) — "cinematic ease" — slow start, rapid settle
- Stagger rhythm: 80-120ms between elements — creates the cascade that feels like choreography
- Exit: always 50-60% of enter duration — quick exit = responsive; slow exit = sluggish
- Hold on key moments: a 100-200ms pause before the next animation makes the previous one land

CINEMATIC MOTION VOCABULARY:
- Entrances: elements arrive from slightly below and fade in (translateY: 30-50px → 0)
- Reveals: content masked by a growing clip or sweeping overlay — not a simple fade
- Transitions: the old state exits before the new one enters (sequenced, not simultaneous)
- Emphasis: key moments get a brief scale pulse (1.0 → 1.02 → 1.0) — barely visible, felt
- Success: a radial bloom from the point of action, expanding to acknowledge the moment

AMBIENT MOTION:
The page must feel alive even when the user is not interacting. Choose ONE ambient element: a slow drift, a gentle pulse, a subtle gradient shift. Not multiple — one. It should be noticeable only when the user is still, not competing for attention during interaction.

SOUND CONSIDERATIONS (document even if not implemented):
Note in motion_rationale what the sound design would be if this had audio — it reveals whether the motion is emotionally coherent. Motion that you can't imagine a sound for is motion without emotional specificity.
