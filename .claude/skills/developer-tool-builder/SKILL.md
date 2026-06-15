---
name: developer-tool-builder
description: Functional tool UI — calculators, generators, configurators with real utility Use when working with: tool, calculator, generator, configurator, builder, maker, create, customize, estimate, quiz.
---

TOOL BUILDER SKILL — activated for functional utility experiences.

TOOL PHILOSOPHY:
A tool's beauty is in its utility. Users come to tools with a job to do. Every design decision should help them do that job faster and more accurately. Friction is the enemy. Clarity is the goal.

But utility does not mean boring. The best tools are beautiful in the way instruments are beautiful — the form serves the function so completely that the function becomes the aesthetic. Design the tool so that using it feels expert, capable, and satisfying.

THE TOOL UX HIERARCHY:
1. Input clarity: users always know what they're being asked
2. State transparency: users always know where they are in the process
3. Output immediacy: results appear as fast as possible (instant if possible)
4. Error recovery: mistakes are caught early and fixed gracefully
5. Result celebration: completion is acknowledged as an achievement

INPUT DESIGN:
- Labels: always visible above the input, never inside (placeholder text disappears on type)
- Input type: match to data type (number input for numbers, date for dates, select for categories)
- Real-time validation: validate as the user types, not on submit
- Smart defaults: pre-populate with the most common answer when possible
- Input groups: related inputs visually grouped, unrelated inputs clearly separated
- Keyboard navigation: Tab through all inputs in logical order, Enter submits

OUTPUT DESIGN:
- Primary result: visually dominant — the answer to the user's question, immediately visible
- Secondary data: supporting information, secondary visual weight
- Export: always offer copy-to-clipboard or download for generated results
- Reset: clear path back to empty state — not hidden, not destructive-looking
- History: if the tool is used repeatedly, show the last 3 results for comparison

TOOL INTERACTION PATTERNS:
- Real-time results: update output on every input change where performance allows
- Calculate on submit: when computation is heavy, use a clear trigger button
- Progress indication: for multi-step tools, a progress indicator (step X of Y)
- Error states: inline, specific, helpful ("Must be between 1 and 100" not "Invalid input")
- Empty state: instructional and inviting — show what a completed result looks like

TOOL PERFORMANCE:
- Calculations: run in < 50ms for perceived instantaneity
- Heavy computation: use Web Workers to avoid blocking the UI
- Debounce real-time inputs: 150-300ms debounce before recalculating
