Here’s your content **fully structured in clean, scannable Markdown**, preserving hierarchy and making it easy to drop into GitHub or docs:

---

# Building a Browser-Based Creative Tool with Claude: A Blueprint

*From "hang some posters" to a production-ready web app — what worked, what didn't, and how to do it faster next time.*

---

## The Origin Story

My bestie had just moved to a new place, and we wanted to hang his posters on a big white wall in the dining room.

We laid out all posters on the floor and experimented with layouts before committing. I had to leave early, so I took photos of each frame to mock something up later.

That turned into a thought:

> *"Maybe I could ask Claude to crop out the images for me..."*

Then quickly:

> *"Actually, I want control over the creative process. What if this is a web app?"*

That impulse became the core product principle:

> **Keep the human in the loop on creative decisions.**

---

## What We Built

**FrameRoom** is a static, browser-based gallery wall planner:

* No server
* No framework
* No build step

### Core Features

* Upload artwork images
* Automatic background removal
* Drag-and-drop layout on a virtual wall
* Export as **2× PNG**

### Evolution

After ~7 QA rounds:

* Frame styles
* Reference photo overlay
* Custom color pickers
* Onboarding tour
* Full mobile experience

---

## Part 1: The Right Foundation

### Start with a Constraint, Not a Feature List

The most important early decision:

```txt
Static HTML/CSS/JS — no server, no build step
```

This shaped everything:

* ES Modules over bundlers
* CDN-only libraries
* GitHub Pages deployment

> **Constraints prevent scope creep and force elegant solutions.**

---

### Define the Tech Stack with Intention

| Layer     | Choice            | Why                     |
| --------- | ----------------- | ----------------------- |
| Structure | Vanilla HTML      | No virtual DOM overhead |
| Modules   | ES Modules        | Native, no bundler      |
| State     | `state.js` object | Simple + undo-friendly  |
| Styling   | CSS variables     | Designer-editable       |
| Assets    | CDN only          | No pipeline             |

**Prompt this upfront:**

```txt
Vanilla HTML/CSS/JS SPA. ES modules. No build tools. Deployable to GitHub Pages as-is.
```

---

## Part 2: Prompting for Quality

### Name Your Product Early

Early name: *Gallery Wall Builder*
Final name: **FrameRoom**

Changing mid-project caused inconsistencies.

> **Define name, tagline, and voice in your first prompt.**

---

### Specific + Opinionated Prompts Win

❌ Vague:

```txt
Add some frame customization options
```

✅ Strong:

```txt
Simulate real-life frames: Minimal, Baroque, Modern, White Modern, Wood...
[5 reference images]
```

> **Clarity → better outputs → fewer iterations**

---

### Attach Visual References Early

For visual work:

* Always include images **in the same message**
* Avoid back-and-forth loops

---

### The “Low Stakes” Signal

```txt
This is a personal project with very low stakes. Be mindful of credit usage.
```

Impact:

* Faster iteration
* Less over-engineering
* Better batching

---

## Part 3: Branding and Design

### Build Brand Before Code

Prompt:

```txt
Minimal, but fun/creative capturing the mix and power of a white wall and creative posters
```

### Color Palette

```txt
#003049 — Navy
#d62828 — Crimson
#f77f00 — Orange
#f7ede2 — Cream
#f6bd60 — Sand
#ffffff — White
```

---

### Why It Worked

1. **Named tension** → “minimal but creative”
2. **Functional metaphor** → wall (canvas) + posters (energy)
3. **Defined palette upfront**

---

### Turn Brand into Code

```css
:root {
  --color-navy: #003049;
  --color-crimson: #d62828;
  --color-orange: #f77f00;
  --color-cream: #f7ede2;
}
```

> **Design tokens = consistency + speed**

---

### Key Design Insight

> **Fonts define product feel more than almost anything.**

---

## Part 4: Architecture Decisions Worth Repeating

### Single State Object = Free Undo

```js
export const state = {
  wItems: [],
  history: [],
  future: [],
};
```

> **Serializable state → easy undo/redo**

---

### CSS Variables as Design System

Benefits:

* Centralized styling
* Easy theming
* No magic numbers

---

### Use Pointer Events

```js
el.addEventListener('pointerdown', startDrag);
```

Handles:

* Mouse
* Touch
* Stylus

> **One system > three duplicated ones**

---

## Part 5: Mobile — Do It Earlier

### The Mistake

> Desktop-first → mobile patch

Result:

* Rework
* Bugs
* Layout issues

---

### Better Approach

* Define breakpoints early
* Use pointer events from day one
* Add safe-area support immediately

---

### iOS Gotcha

```txt
position: fixed + overflow: hidden = broken behavior
```

Fix:

* Move elements to `<body>`

---

## Part 6: Onboarding — Two-AI Pipeline

### Workflow

**Step 1 — ChatGPT**

* Refine copy
* Create spec

**Step 2 — Claude**

* Implement

---

### Why It Works

* Copy = exploratory
* Code = precise

> **Don’t mix both in one prompt**

---

### Strong UX Pattern

Reference real products:

```txt
Intercom-style product tour
```

---

### Example Copy Improvement

| Before        | After                   |
| ------------- | ----------------------- |
| Upload images | Bring in your pieces... |
| Pick layouts  | Set the vibe ✨          |

---

### Key Fixes

* Define spotlight behavior clearly
* Plan mobile experience upfront

---

### Spotlight Pattern

```js
const spotlight = document.createElement('div');
spotlight.style.cssText = `
  position: fixed;
  box-shadow: 0 0 0 9999px rgba(0,48,73,0.55);
`;
```

> **Reliable, reusable pattern**

---

## Part 7: PR and Documentation

### “What’s New” Table

```md
| # | Feature | Details |
|---|--------|--------|
| 1 | Name | What it does |
```

---

### README Rule

> **If it’s not in the README, it’s not done.**

---

## Part 8: Prompts Worth Reusing

### QA Rounds

```txt
Next round of iterations: [list]. Open a PR.
```

### Tone

```txt
Low stakes project. Optimize for efficiency.
```

### Visual Work

```txt
[Request] + attach references
```

---

## Quick-Reference Blueprint

### 1. Brand

* Palette + tokens
* Fonts
* Personality

### 2. Setup

* Name product
* Define constraints
* State system

### 3. Features

* Pointer events
* Config-driven UI
* Visual references

### 4. Onboarding

* Two-AI pipeline
* Spec > vague ideas

### 5. Mobile

* Plan early
* Test on real device

### 6. Process

* PR discipline
* README as source of truth

---

## Final Takeaway

What started as:

> *“Maybe Claude can crop images…”*

Became:

> **A fully-featured, mobile-ready creative tool**

### Biggest Wins

* Brand before code
* Specific prompts
* Two-AI workflow
* Structured iteration

> **The leverage wasn’t technical — it was how the work was directed.**
