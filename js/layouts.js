/* ============================================================
   LAYOUTS — Gallery wall template definitions + rendering
   ============================================================ */

import { state } from './state.js';
import { clearWall, addToWallAt, mountPlaceholder } from './wall.js';

/* ──────────────────────────────────────────
   LAYOUT DEFINITIONS
   All slot positions are 0–1 fractions of wall width/height.
   Slots: { x, y, w, h, label? }
   ────────────────────────────────────────── */
export const LAYOUTS = [
  {
    id: 'salon',
    name: 'Salon Classique',
    tag: 'Classic',
    slots: [
      { x:.29, y:.06, w:.42, h:.56 },
      { x:.04, y:.06, w:.22, h:.36 }, { x:.74, y:.06, w:.22, h:.36 },
      { x:.04, y:.48, w:.22, h:.38 }, { x:.74, y:.48, w:.22, h:.38 },
    ],
  },
  {
    id: 'pyramid',
    name: 'Pyramid Stack',
    tag: 'Balanced',
    slots: [
      { x:.32, y:.05, w:.36, h:.50 },
      { x:.07, y:.10, w:.22, h:.36 }, { x:.71, y:.10, w:.22, h:.36 },
      { x:.07, y:.58, w:.18, h:.30 }, { x:.28, y:.60, w:.18, h:.28 },
      { x:.54, y:.60, w:.18, h:.28 }, { x:.75, y:.58, w:.18, h:.30 },
    ],
  },
  {
    id: 'grid22',
    name: 'Square Grid',
    tag: 'Minimal',
    slots: [
      { x:.18, y:.09, w:.29, h:.42 }, { x:.53, y:.09, w:.29, h:.42 },
      { x:.18, y:.54, w:.29, h:.38 }, { x:.53, y:.54, w:.29, h:.38 },
    ],
  },
  {
    id: 'grid32',
    name: 'Six-Pack Grid',
    tag: 'Modern',
    slots: [
      { x:.05, y:.08, w:.27, h:.38 }, { x:.36, y:.08, w:.27, h:.38 }, { x:.67, y:.08, w:.27, h:.38 },
      { x:.05, y:.52, w:.27, h:.38 }, { x:.36, y:.52, w:.27, h:.38 }, { x:.67, y:.52, w:.27, h:.38 },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    tag: 'Classic',
    slots: [
      { x:.08, y:.12, w:.25, h:.74 },
      { x:.37, y:.12, w:.25, h:.74 },
      { x:.66, y:.12, w:.25, h:.74 },
    ],
  },
  {
    id: 'hline',
    name: 'Horizontal Line',
    tag: 'Minimal',
    slots: [
      { x:.03, y:.22, w:.20, h:.55 },
      { x:.26, y:.18, w:.22, h:.62 },
      { x:.51, y:.22, w:.20, h:.55 },
      { x:.74, y:.26, w:.20, h:.48 },
    ],
  },
  {
    id: 'asymmetric',
    name: 'Asymmetric Mix',
    tag: 'Editorial',
    slots: [
      { x:.02, y:.04, w:.22, h:.55 },
      { x:.27, y:.03, w:.32, h:.58 },
      { x:.62, y:.03, w:.20, h:.30 }, { x:.84, y:.03, w:.14, h:.44 },
      { x:.62, y:.37, w:.20, h:.30 },
      { x:.03, y:.64, w:.22, h:.28 }, { x:.28, y:.66, w:.32, h:.28 },
    ],
  },
  {
    id: 'cluster',
    name: 'Organic Cluster',
    tag: 'Eclectic',
    slots: [
      { x:.30, y:.04, w:.38, h:.50 },
      { x:.03, y:.04, w:.24, h:.42 }, { x:.71, y:.04, w:.24, h:.34 },
      { x:.71, y:.42, w:.24, h:.32 },
      { x:.30, y:.58, w:.38, h:.35 }, { x:.03, y:.50, w:.24, h:.40 },
    ],
  },
  {
    id: 'lshape',
    name: 'L-Shape',
    tag: 'Structural',
    slots: [
      { x:.04, y:.05, w:.32, h:.55 },
      { x:.04, y:.64, w:.18, h:.28 }, { x:.25, y:.64, w:.18, h:.28 },
      { x:.40, y:.05, w:.18, h:.28 }, { x:.61, y:.05, w:.18, h:.28 },
      { x:.82, y:.05, w:.16, h:.28 },
      { x:.40, y:.38, w:.57, h:.52 },
    ],
  },
  {
    id: 'staircase',
    name: 'Staircase',
    tag: 'Dynamic',
    slots: [
      { x:.04, y:.55, w:.22, h:.38 },
      { x:.28, y:.32, w:.22, h:.58 },
      { x:.54, y:.14, w:.22, h:.72 },
      { x:.78, y:.04, w:.18, h:.52 },
    ],
  },
  {
    id: 'panorama',
    name: 'Panorama Strip',
    tag: 'Linear',
    slots: [
      { x:.03, y:.28, w:.92, h:.44 },
      { x:.03, y:.06, w:.27, h:.19 },
      { x:.34, y:.06, w:.27, h:.19 },
      { x:.65, y:.06, w:.30, h:.19 },
    ],
  },
  {
    id: 'feature',
    name: 'Feature + Satellites',
    tag: 'Anchored',
    slots: [
      { x:.22, y:.08, w:.55, h:.80 },
      { x:.02, y:.08, w:.17, h:.28 }, { x:.02, y:.40, w:.17, h:.28 },
      { x:.02, y:.72, w:.17, h:.18 },
      { x:.80, y:.08, w:.17, h:.28 }, { x:.80, y:.40, w:.17, h:.28 },
      { x:.80, y:.72, w:.17, h:.18 },
    ],
  },
];

/* ──────────────────────────────────────────
   BUILD LAYOUT PANEL (sidebar thumbnails)
   ────────────────────────────────────────── */
export function buildLayoutPanel() {
  const panel = document.getElementById('layoutsPanel');
  if (!panel) return;
  panel.innerHTML = '';

  LAYOUTS.forEach(layout => {
    const card = document.createElement('div');
    card.className = 'layout-card';
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Apply layout: ${layout.name}`);
    card.setAttribute('tabindex', '0');
    card.dataset.layoutId = layout.id;

    const cvs = document.createElement('canvas');
    cvs.width  = 200;
    cvs.height = 120;
    renderLayoutPreview(cvs, layout);

    const tagEl = document.createElement('span');
    tagEl.className = 'tag tag--style';
    tagEl.textContent = layout.tag;
    tagEl.style.cssText = 'position:absolute;top:6px;right:6px;font-size:9px;padding:2px 7px';

    const nameEl = document.createElement('div');
    nameEl.className = 'layout-card__name';
    nameEl.textContent = layout.name;

    const inner = document.createElement('div');
    inner.style.position = 'relative';
    inner.appendChild(cvs);
    inner.appendChild(tagEl);

    card.appendChild(inner);
    card.appendChild(nameEl);

    const apply = () => applyLayout(layout);
    card.addEventListener('click', apply);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') apply(); });

    panel.appendChild(card);
  });
}

/* Draw a small preview thumbnail of the layout */
function renderLayoutPreview(cvs, layout) {
  const ctx = cvs.getContext('2d');
  const W = cvs.width, H = cvs.height;

  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, W, H);

  const palette = ['#d6cfc4', '#c8c0b2', '#bfb8a8', '#d0cabb', '#c4bcad', '#b8b0a0', '#cac2b4'];

  layout.slots.forEach((s, i) => {
    const x = s.x * W + 1.5;
    const y = s.y * H + 1.5;
    const w = s.w * W - 3;
    const h = s.h * H - 3;

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur  = 4;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = palette[i % palette.length];
    roundRect(ctx, x, y, w, h, 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;

    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth   = 0.8;
    roundRect(ctx, x, y, w, h, 2);
    ctx.stroke();
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/* ──────────────────────────────────────────
   APPLY LAYOUT
   Clears the wall and places frames in slots,
   sorted by real-world relative size.
   ────────────────────────────────────────── */
export function applyLayout(layout) {
  clearWall();

  // Mark active layout card
  document.querySelectorAll('.layout-card').forEach(c => {
    c.classList.toggle('active', c.dataset.layoutId === layout.id);
  });
  state.activeLayoutId = layout.id;

  const wallEl = document.getElementById('wall');
  const ww = wallEl.offsetWidth;
  const wh = wallEl.offsetHeight;

  // Sort frames by relSize descending (largest first)
  const sorted = [...state.frames].sort((a, b) => (b.relSize || 1) - (a.relSize || 1));

  layout.slots.forEach((slot, i) => {
    const x = Math.round(slot.x * ww);
    const y = Math.round(slot.y * wh);
    const w = Math.round(slot.w * ww);
    const h = Math.round(slot.h * wh);

    if (sorted[i]) {
      addToWallAt(sorted[i].id, x, y, w, h);
    } else {
      mountPlaceholder(x, y, w, h, i + 1);
    }
  });

  import('./wall.js').then(m => m.updateDropHint());
}
