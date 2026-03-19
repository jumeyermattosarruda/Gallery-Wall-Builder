# Gallery Wall Builder — Editable Copy

> **Admin guide:** This file controls all the text in the app.
> Edit the values below and redeploy to update the interface — no coding needed.
> After editing, commit and push to GitHub. GitHub Actions will auto-deploy.

---

## App Identity

```
app.title      = Gallery Wall Builder: from image to IRL
app.tagline    = Arrange. Visualize. Hang.
```

---

## Topbar

```
topbar.step1   = Upload
topbar.step2   = Reference
topbar.step3   = Arrange
topbar.clear   = Clear wall
topbar.export  = Export PNG
```

---

## Sidebar — Frames Tab

```
frames.section_label  = Your frames
frames.upload_title   = Drop images here
frames.upload_sub     = or click to browse
frames.upload_formats = JPG · PNG · HEIC · WebP
frames.empty_hint     = Upload your frame photos above to get started.

ref.section_label     = Reference photo
ref.upload_title      = Photo of frames together
ref.upload_sub        = Helps size them proportionally
```

---

## Sidebar — Layouts Tab

```
layouts.section_label = Gallery templates
layouts.hint          = Click a layout to apply it to the wall.
```

### Layout Names (displayed as thumbnails in sidebar)

| ID            | Display Name          | Style Tag   |
|---------------|-----------------------|-------------|
| salon         | Salon Classique       | Classic     |
| pyramid       | Pyramid Stack         | Balanced    |
| grid22        | Square Grid           | Minimal     |
| grid32        | Six-Pack Grid         | Modern      |
| triptych      | Triptych              | Classic     |
| hline         | Horizontal Line       | Minimal     |
| asymmetric    | Asymmetric Mix        | Editorial   |
| cluster       | Organic Cluster       | Eclectic    |
| lshape        | L-Shape               | Structural  |
| staircase     | Staircase             | Dynamic     |
| panorama      | Panorama Strip        | Linear      |
| feature       | Feature + Satellites  | Anchored    |

> To rename a layout, edit `js/layouts.js` → find the layout object → update the `name` or `tag` field.

---

## Wall Canvas

```
wall.drop_hint_line1  = Drop frames here
wall.drop_hint_line2  = or click + in the library
wall.drop_hint_line3  = Or pick a layout →

wall.size_medium      = Medium · 2.6×1.7m
wall.size_wide        = Wide · 3.2×1.7m
wall.size_small       = Small · 2.0×1.5m
wall.size_large       = Large · 3.5×1.9m
wall.size_square      = Square · 2.0×2.0m
```

---

## Right Panel

```
props.label             = Properties
props.no_selection      = Click a frame on the wall to edit it.
props.section_size      = Size (px)
props.section_color     = Frame color
props.section_border    = Border
props.section_rotation  = Rotation
props.delete_btn        = Remove from wall
```

### Frame Colors (displayed as color swatches)

> To add/remove colors, edit `js/properties.js` → `FRAME_COLORS` array.

| Name        | Hex       |
|-------------|-----------|
| White       | #f7f4f0   |
| Cream       | #ede8dc   |
| Black       | #1c1a18   |
| Graphite    | #4a4845   |
| Walnut      | #7a5230   |
| Gold        | #c9a84c   |
| Silver      | #b0b0b0   |
| Dark Green  | #3a5a40   |
| Navy        | #003049   |
| Terracotta  | #b85c38   |

---

## Reference Photo Modal

```
ref.modal_title     = Tag frames in reference photo
ref.modal_desc      = Draw a box around each frame to measure relative sizes. Then assign each box to a frame in your library.
ref.canvas_hint     = Draw a box around each frame
ref.boxes_section   = Identified frames
ref.boxes_empty     = Draw boxes around each frame in the photo above.
ref.clear_btn       = Clear boxes
ref.apply_btn       = Apply sizes & close
```

---

## Toast / Notification Messages

```
toast.loading_images    = Loading {n} images…
toast.bg_removed        = Background removed.
toast.sizes_applied     = Relative sizes applied! Now choose a layout.
toast.cannot_load       = Could not load {filename}
toast.ref_cannot_load   = Could not load reference photo
```

---

## Keyboard Shortcuts Reference

| Key              | Action                         |
|------------------|--------------------------------|
| Click frame      | Select frame                   |
| Drag frame       | Move frame                     |
| Drag corner      | Resize frame                   |
| Shift + resize   | Lock aspect ratio              |
| Arrow keys       | Nudge selected frame (2px)     |
| Shift + arrows   | Nudge selected frame (10px)    |
| Delete / Backspace | Remove selected frame        |
| Escape           | Deselect                       |

---

## Theming / Design Tokens

> Edit `css/variables.css` to change colors, spacing, and typography globally.
> The brand colors are:

| Token              | Value     | Usage                        |
|--------------------|-----------|------------------------------|
| `--color-navy`     | #003049   | Text, headers, key UI        |
| `--color-crimson`  | #D62828   | CTA buttons, active states   |
| `--color-orange`   | #F77F00   | Hover, icons, accents        |
| `--color-cream`    | #F7EDE2   | Panel backgrounds            |
| `--color-sand`     | #F6BD60   | Tags, highlights             |
| `--color-white`    | #FFFFFF   | Primary background           |

---

## Fonts

- **Display (app title):** TAN Kindred — place font files in `assets/fonts/`
  - `TANKindred.woff2` and `TANKindred.woff` (commercial license required)
  - Falls back to Georgia if font files are missing
- **Primary:** Poppins (Google Fonts — loaded automatically)
- **Secondary:** Inter (Google Fonts — loaded automatically)

---

## GitHub Pages Deployment

1. Push to `main` branch
2. In GitHub: Settings → Pages → Source: GitHub Actions
3. The workflow in `.github/workflows/deploy.yml` deploys automatically
4. Your app will be live at: `https://yourusername.github.io/Gallery-Wall-Builder/`

---

## Background Removal

By default the app uses a built-in canvas-based algorithm (no internet needed, works offline).

**To enable AI-powered background removal** (much better quality, ~40MB model download on first use):

1. Open `index.html`
2. Find the commented-out `<script>` block near the bottom of `<head>`
3. Uncomment it to enable the `@imgly/background-removal` library

---

*Last updated: March 2026*
