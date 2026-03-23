# FrameRoom

> **Arrange. Visualize. Hang.**

A browser-based gallery wall planner — upload photos of your art, remove backgrounds, visualize layouts on a virtual wall, and drag-drop until it's perfect. No account, no install, no server.

---

## Features

| Feature | Details |
|---------|---------|
| 🖼 **Multi-format upload** | JPG, PNG, WebP, GIF, BMP, **HEIC** (iPhone photos) |
| ✂️ **Auto background removal** | Built-in canvas algorithm; AI-powered option available |
| 🎨 **5 frame styles** | Minimal, Modern, Baroque, White Modern, Wood — CSS-rendered, no assets |
| 🖌 **Custom frame & wall colors** | Color picker + hex field + EyeDropper API; pick from a real wall photo |
| 📐 **Reference photo overlay** | Upload your real wall; fit/fill/scale overlay with corner handles |
| 🗂 **12 layout templates** | Salon, Pyramid, Grids, Triptych, Asymmetric, Staircase, and more |
| 🖱 **Drag & drop canvas** | Move, resize (Shift = lock aspect ratio), rotate each frame |
| 🔄 **Drag frame back to shelf** | Drag a placed frame over the shelf to return it |
| ⌨️ **Keyboard support** | Arrow keys to nudge, Del to remove, ⌘Z/⌘⇧Z undo/redo |
| 🏠 **Wall color presets** | White, Off-white, Linen, Sage, Dark + custom color wheel |
| 📤 **PNG export** | Downloads a 2× retina-quality render |
| 🚀 **GitHub Pages ready** | Static HTML/CSS/JS — no server, no build step |

---

## Quick Start

### For admins (no coding needed)

1. **Edit text content** → open `CONTENT.md` and update any labels, names, or descriptions
2. **Change colors/fonts** → open `css/variables.css` and update the CSS custom properties
3. **Add/remove layouts** → open `js/layouts.js` and edit the `LAYOUTS` array
4. **Commit & push to `main`** → GitHub Actions auto-deploys to GitHub Pages

### For developers

```bash
# Clone the repo
git clone https://github.com/jumeyermattosarruda/Gallery-Wall-Builder.git
cd Gallery-Wall-Builder

# No build step — serve with any static server:
npx serve .
# or:
python3 -m http.server 8080
```

> **Note:** ES modules require a server (not `file://`). Use any local server for development.

---

## File Structure

```
Gallery-Wall-Builder/
├── index.html              # App entry point — HTML structure & meta
├── CONTENT.md              # Editable copy — all UI text & admin guide
├── README.md               # This file
│
├── css/
│   ├── variables.css       # Design tokens — colors, spacing, fonts
│   ├── base.css            # Reset + typography
│   ├── layout.css          # App shell, topbar, sidebar, panels
│   ├── components.css      # Buttons, cards, inputs, upload zones, etc.
│   ├── wall.css            # Wall canvas + frame elements
│   └── animations.css      # Keyframes + motion preferences
│
├── js/
│   ├── app.js              # App init + global utilities
│   ├── state.js            # Shared app state
│   ├── upload.js           # File loading, HEIC conversion
│   ├── imageProcess.js     # Background removal
│   ├── library.js          # Sidebar frame list rendering
│   ├── layouts.js          # 12 layout templates
│   ├── wall.js             # Drag/drop canvas, keyboard
│   ├── properties.js       # Right panel controls
│   ├── refPhoto.js         # Reference photo overlay controls
│   ├── tour.js             # Onboarding welcome modal + guided tour
│   └── export.js           # PNG export
│
├── assets/
│   └── fonts/              # Place TAN Kindred font files here (optional)
│
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Pages auto-deploy
```

---

## How to Use

### Step 1 — Upload your frames
- Drag images into the upload zone or click to browse
- HEIC (iPhone) photos are supported automatically
- Background removal runs in the background after each upload

### Step 2 — Reference photo (optional)
- Upload a photo of your real wall or frames laid together
- Fit/scale the overlay to the wall using the quick-fit buttons or corner drag handles
- Adjust opacity to see both the overlay and your layout simultaneously

### Step 3 — Arrange
- Click a layout template to populate the wall
- Drag frames to reposition; drag back over the shelf to un-place
- Use the properties panel: frame style, custom color, mat thickness, rotation, image pan/zoom
- Export as PNG when done

---

## Customization

### Adding a layout

In `js/layouts.js`, add to the `LAYOUTS` array:

```js
{
  id: 'my-layout',
  name: 'My Layout',
  tag: 'Custom',
  slots: [
    // {x, y, w, h} as fractions (0–1) of wall width/height
    { x: 0.1, y: 0.1, w: 0.35, h: 0.8 },
    { x: 0.55, y: 0.1, w: 0.35, h: 0.8 },
  ],
},
```

### Enabling AI background removal

1. Open `index.html`
2. Find the commented `<script>` block at the bottom of `<head>`
3. Uncomment it — loads `@imgly/background-removal` (~40MB model, cached after first use)

### GitHub Pages deployment

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** → **GitHub Actions**
3. Push any commit to `main` → deploys automatically

---

## Tech Stack

- Vanilla HTML/CSS/JS — no framework, no build step
- ES Modules (`type="module"`) — native browser modules
- `heic2any` — client-side HEIC→JPEG conversion (CDN)
- `@imgly/background-removal` — optional ML background removal (CDN)
- GitHub Actions — auto-deploy to Pages

---

## License

MIT — free to use, modify, and distribute.
