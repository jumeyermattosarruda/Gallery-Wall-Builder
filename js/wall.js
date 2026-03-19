/* ============================================================
   WALL — Canvas, frame mounting, drag/drop, resize, keyboard
   ============================================================ */

import { state, nextId, getFrame, getWItem } from './state.js';
import { updateRightPanel } from './properties.js';
import { refreshLibrary } from './library.js';

/* ──────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────── */
const DEFAULT_FRAME_COLOR  = '#f7f4f0';
const DEFAULT_BORDER_WIDTH = 12;

/* ──────────────────────────────────────────
   INIT
   ────────────────────────────────────────── */
export function initWall() {
  const wallEl = document.getElementById('wall');
  if (!wallEl) return;

  // Deselect on wall background click
  wallEl.addEventListener('click', e => {
    if (e.target === wallEl || e.target.id === 'gridCanvas') deselect();
  });

  // Drop from library sidebar
  const viewport = document.getElementById('wallViewport');
  viewport.addEventListener('dragover', e => {
    e.preventDefault();
    wallEl.classList.add('drop-active');
  });
  viewport.addEventListener('dragleave', e => {
    if (!viewport.contains(e.relatedTarget)) wallEl.classList.remove('drop-active');
  });
  viewport.addEventListener('drop', e => {
    e.preventDefault();
    wallEl.classList.remove('drop-active');

    const fid = e.dataTransfer.getData('text/plain');
    if (fid && state.frames.find(f => f.id === fid)) {
      const wallRect = wallEl.getBoundingClientRect();
      const x = e.clientX - wallRect.left;
      const y = e.clientY - wallRect.top;
      addToWall(fid, x, y);
    } else if (e.dataTransfer.files.length) {
      // Dropped image files directly onto wall
      import('./upload.js').then(m => m.loadFiles(e.dataTransfer.files));
    }
  });

  // Global mouse events for drag/resize
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);

  // Keyboard
  document.addEventListener('keydown', onKeyDown);

  redrawGrid();
}

/* ──────────────────────────────────────────
   WALL SIZE & GRID
   ────────────────────────────────────────── */
export function applyWallSize() {
  const sel = document.getElementById('wallSz');
  if (!sel) return;
  const [w, h] = sel.value.split(',').map(Number);
  const wallEl = document.getElementById('wall');
  wallEl.style.width  = w + 'px';
  wallEl.style.height = h + 'px';

  const labelEl = document.querySelector('.wall-size-label');
  if (labelEl) {
    const opt = sel.options[sel.selectedIndex];
    labelEl.textContent = opt ? opt.text.split('·')[1]?.trim() || '' : '';
  }
  redrawGrid();
}

export function redrawGrid() {
  const wallEl = document.getElementById('wall');
  const cvs    = document.getElementById('gridCanvas');
  if (!wallEl || !cvs) return;

  const W = wallEl.offsetWidth;
  const H = wallEl.offsetHeight;
  cvs.width  = W;
  cvs.height = H;
  cvs.style.width  = W + 'px';
  cvs.style.height = H + 'px';

  const gSel = document.getElementById('gridSz');
  const g    = gSel ? parseInt(gSel.value) : 0;
  const ctx  = cvs.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  if (!g) return;

  ctx.strokeStyle = 'rgba(0,48,73,0.05)';
  ctx.lineWidth   = 1;
  for (let x = 0; x <= W; x += g) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += g) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Center guides
  const wallEl2 = document.getElementById('wall');
  let guideH = wallEl2.querySelector('.guide-h');
  let guideV = wallEl2.querySelector('.guide-v');
  if (!guideH) { guideH = document.createElement('div'); guideH.className = 'guide-h'; wallEl2.appendChild(guideH); }
  if (!guideV) { guideV = document.createElement('div'); guideV.className = 'guide-v'; wallEl2.appendChild(guideV); }
  guideH.style.top  = (H / 2) + 'px';
  guideV.style.left = (W / 2) + 'px';
}

export function setWallTheme(theme) {
  const wallEl = document.getElementById('wall');
  if (!wallEl) return;
  wallEl.dataset.wallTheme = theme;

  const colors = { white: '#fff', linen: '#f2ede5', sage: '#d4ddd0', dark: '#1a1a1a', 'off-white': '#f8f6f1' };
  wallEl.style.background = colors[theme] || '#fff';
}

/* ──────────────────────────────────────────
   ADD FRAME TO WALL
   ────────────────────────────────────────── */
export function addToWall(fid, atX, atY) {
  const frame  = getFrame(fid);
  if (!frame) return;

  const wallEl = document.getElementById('wall');
  const ww = wallEl.offsetWidth;
  const wh = wallEl.offsetHeight;

  const defaultW = Math.round(Math.min(220, ww * 0.28));
  const defaultH = Math.round(defaultW / frame.aspect);

  const jitter = state.wItems.length % 6;
  const x = atX !== undefined
    ? Math.max(0, Math.min(atX - defaultW / 2, ww - defaultW))
    : Math.round(ww / 2 - defaultW / 2 + jitter * 20);
  const y = atY !== undefined
    ? Math.max(0, Math.min(atY - defaultH / 2, wh - defaultH))
    : Math.round(wh / 2 - defaultH / 2 + jitter * 20);

  const item = {
    id:     nextId('wi'),
    fid,
    x, y,
    w:      defaultW,
    h:      defaultH,
    color:  DEFAULT_FRAME_COLOR,
    border: DEFAULT_BORDER_WIDTH,
    rot:    0,
    label:  frame.name,
  };

  state.wItems.push(item);
  mountWFrame(item);
  updateDropHint();
  refreshLibrary();
  selectItem(item.id);
}

/* Add with explicit position & size (used by layout engine) */
export function addToWallAt(fid, x, y, w, h) {
  const frame = getFrame(fid);
  if (!frame) return;

  // Preserve aspect ratio: fit within slot, centered
  const slotAspect  = w / h;
  const frameAspect = frame.aspect;
  let fw = w, fh = h;
  if (frameAspect > slotAspect) {
    fh = Math.round(fw / frameAspect);
  } else {
    fw = Math.round(fh * frameAspect);
  }
  const fx = x + Math.round((w - fw) / 2);
  const fy = y + Math.round((h - fh) / 2);

  const item = {
    id:     nextId('wi'),
    fid,
    x:      fx,
    y:      fy,
    w:      fw,
    h:      fh,
    color:  DEFAULT_FRAME_COLOR,
    border: DEFAULT_BORDER_WIDTH,
    rot:    0,
    label:  frame.name,
  };

  state.wItems.push(item);
  mountWFrame(item);
}

export function mountPlaceholder(x, y, w, h, num) {
  const item = {
    id:     nextId('ph'),
    fid:    null,
    x, y, w, h,
    color:  '#e8e4dc',
    border: 0,
    rot:    0,
    label:  `Frame ${num}`,
  };
  state.wItems.push(item);

  const el = createFrameEl(item, null);
  el.classList.add('slot-placeholder');
  const ph = el.querySelector('.wframe__ph');
  if (ph) ph.textContent = `Slot ${num}`;
  document.getElementById('wall').appendChild(el);
  applyItemStyle(el, item);
  attachFrameEvents(el, item);
}

/* ──────────────────────────────────────────
   MOUNT / UPDATE DOM ELEMENT
   ────────────────────────────────────────── */
function mountWFrame(item) {
  const frame = getFrame(item.fid);
  const existing = document.getElementById(item.id);
  if (existing) { applyItemStyle(existing, item); return; }

  const el = createFrameEl(item, frame);
  el.classList.add('just-added');
  setTimeout(() => el.classList.remove('just-added'), 300);

  document.getElementById('wall').appendChild(el);
  applyItemStyle(el, item);
  attachFrameEvents(el, item);
}

function createFrameEl(item, frame) {
  const el = document.createElement('div');
  el.className = 'wframe';
  el.id = item.id;

  const mat = document.createElement('div');
  mat.className = 'wframe__mat';

  if (frame && frame.src) {
    const img = document.createElement('img');
    img.src = frame.src;
    img.alt = frame.name || '';
    img.draggable = false;
    img.style.background = 'transparent';
    mat.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'wframe__ph';
    ph.textContent = frame ? frame.name : '';
    mat.appendChild(ph);
  }

  const border = document.createElement('div');
  border.className = 'wframe__border';

  const rh = document.createElement('div');
  rh.className = 'wframe__rh';
  rh.title = 'Drag to resize';

  const label = document.createElement('div');
  label.className = 'wframe__label';
  label.textContent = item.label || '';

  el.appendChild(mat);
  el.appendChild(border);
  el.appendChild(rh);
  el.appendChild(label);

  return el;
}

function applyItemStyle(el, item) {
  el.style.cssText =
    `left:${item.x}px;top:${item.y}px;width:${item.w}px;height:${item.h}px;` +
    `transform:rotate(${item.rot}deg);position:absolute;`;

  const isSelected = state.selId === item.id;

  const mat = el.querySelector('.wframe__mat');
  if (mat) mat.style.cssText = `position:absolute;inset:${item.border}px;overflow:hidden;`;

  const border = el.querySelector('.wframe__border');
  if (border) {
    border.style.background  = item.color;
    border.style.boxShadow   = isSelected
      ? `0 0 0 2.5px var(--color-crimson), 2px 8px 32px rgba(0,0,0,0.22)`
      : `2px 6px 28px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.1)`;
  }
}

function attachFrameEvents(el, item) {
  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('wframe__rh')) return;
    e.preventDefault();
    startDrag(e, item.id);
  });

  const rh = el.querySelector('.wframe__rh');
  if (rh) {
    rh.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      startResize(e, item.id);
    });
  }

  el.addEventListener('click', e => {
    e.stopPropagation();
    selectItem(item.id);
  });
}

/* Public refresh (called by properties panel) */
export function refreshWFrame(id) {
  const item = getWItem(id);
  const el   = document.getElementById(id);
  if (item && el) applyItemStyle(el, item);
}

/* ──────────────────────────────────────────
   DRAG
   ────────────────────────────────────────── */
function startDrag(e, id) {
  const item = getWItem(id);
  if (!item) return;
  state.drag = { id, ox: item.x, oy: item.y, mx: e.clientX, my: e.clientY };
  const el = document.getElementById(id);
  if (el) el.classList.add('dragging');
  selectItem(id);
}

/* ──────────────────────────────────────────
   RESIZE
   ────────────────────────────────────────── */
function startResize(e, id) {
  const item = getWItem(id);
  if (!item) return;
  state.resize = { id, ox: e.clientX, oy: e.clientY, ow: item.w, oh: item.h, aspect: item.w / item.h };
}

/* ──────────────────────────────────────────
   MOUSE EVENTS
   ────────────────────────────────────────── */
function onMouseMove(e) {
  if (state.drag) {
    const item = getWItem(state.drag.id);
    if (!item) return;
    let nx = state.drag.ox + (e.clientX - state.drag.mx);
    let ny = state.drag.oy + (e.clientY - state.drag.my);
    const s = snapValue();
    if (s) { nx = Math.round(nx / s) * s; ny = Math.round(ny / s) * s; }
    item.x = nx; item.y = ny;
    refreshWFrame(state.drag.id);
  }

  if (state.resize) {
    const item = getWItem(state.resize.id);
    if (!item) return;
    let nw = Math.max(50, state.resize.ow + (e.clientX - state.resize.ox));
    let nh = e.shiftKey
      ? Math.round(nw / state.resize.aspect)
      : Math.max(50, state.resize.oh + (e.clientY - state.resize.oy));
    const s = snapValue();
    if (s) { nw = Math.round(nw / s) * s; nh = Math.round(nh / s) * s; }
    item.w = nw; item.h = nh;
    refreshWFrame(state.resize.id);
    updateRightPanel();
  }
}

function onMouseUp() {
  if (state.drag) {
    const el = document.getElementById(state.drag.id);
    if (el) el.classList.remove('dragging');
    state.drag = null;
  }
  state.resize = null;
}

function snapValue() {
  const cb = document.getElementById('snapCb');
  const gs = document.getElementById('gridSz');
  if (!cb || !cb.checked || !gs) return 0;
  return parseInt(gs.value) || 0;
}

/* ──────────────────────────────────────────
   SELECTION
   ────────────────────────────────────────── */
export function selectItem(id) {
  const prev = state.selId;
  state.selId = id;
  if (prev && prev !== id) refreshWFrame(prev);
  refreshWFrame(id);
  updateRightPanel();

  const item  = getWItem(id);
  const frame = item ? getFrame(item.fid) : null;
  const badge = document.getElementById('selBadge');
  if (badge) {
    badge.textContent = frame?.name || item?.label || '';
    badge.style.display = '';
  }
}

export function deselect() {
  const prev = state.selId;
  state.selId = null;
  if (prev) refreshWFrame(prev);
  const badge = document.getElementById('selBadge');
  if (badge) badge.style.display = 'none';
  updateRightPanel();
}

/* ──────────────────────────────────────────
   DELETE / CLEAR
   ────────────────────────────────────────── */
export function deleteSelected() {
  if (!state.selId) return;
  removeWItem(state.selId);
  state.selId = null;
  updateRightPanel();
  updateDropHint();
  refreshLibrary();
}

function removeWItem(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
  state.wItems = state.wItems.filter(i => i.id !== id);
}

export function clearWall() {
  state.wItems.forEach(i => {
    const el = document.getElementById(i.id);
    if (el) el.remove();
  });
  state.wItems = [];
  state.selId  = null;
  updateRightPanel();
  updateDropHint();
  refreshLibrary();
}

/* ──────────────────────────────────────────
   UTILITIES
   ────────────────────────────────────────── */
export function updateDropHint() {
  const el = document.getElementById('dropHint');
  if (el) el.style.display = state.wItems.length === 0 ? '' : 'none';
}

export function refreshList() {
  refreshLibrary();
}

/* ──────────────────────────────────────────
   KEYBOARD
   ────────────────────────────────────────── */
function onKeyDown(e) {
  // Don't intercept when typing in inputs
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  if (!state.selId) return;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteSelected();
    return;
  }

  if (e.key === 'Escape') { deselect(); return; }

  const item = getWItem(state.selId);
  if (!item) return;

  const step = e.shiftKey ? 10 : 2;

  if (e.key === 'ArrowLeft')  { item.x -= step; e.preventDefault(); }
  if (e.key === 'ArrowRight') { item.x += step; e.preventDefault(); }
  if (e.key === 'ArrowUp')    { item.y -= step; e.preventDefault(); }
  if (e.key === 'ArrowDown')  { item.y += step; e.preventDefault(); }

  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
    refreshWFrame(state.selId);
  }
}
