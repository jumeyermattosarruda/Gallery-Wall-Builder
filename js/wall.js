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
  document.addEventListener('mouseup',   e => onMouseUp(e));

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
    imgPanX: 50, imgPanY: 50, imgZoom: 1,
    label:  frame.name,
  };

  saveHistory();
  state.wItems.push(item);
  mountWFrame(item);
  updateDropHint();
  refreshLibrary();
  selectItem(item.id);
}

/* Add with explicit position & size (used by layout engine).
   Optional savedSettings preserves color/border/rot/pan/zoom from previous placement. */
export function addToWallAt(fid, x, y, w, h, savedSettings) {
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

  const saved = savedSettings || {};
  const item = {
    id:      nextId('wi'),
    fid,
    x:       fx,
    y:       fy,
    w:       fw,
    h:       fh,
    color:   saved.color   ?? DEFAULT_FRAME_COLOR,
    border:  saved.border  ?? DEFAULT_BORDER_WIDTH,
    rot:     saved.rot     ?? 0,
    imgPanX: saved.imgPanX ?? 50,
    imgPanY: saved.imgPanY ?? 50,
    imgZoom: saved.imgZoom ?? 1,
    label:   frame.name,
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

  // Border must come FIRST in DOM so mat (image) renders on top of it
  const border = document.createElement('div');
  border.className = 'wframe__border';

  const mat = document.createElement('div');
  mat.className = 'wframe__mat';

  if (frame && frame.src) {
    const img = document.createElement('img');
    img.src = frame.src;
    img.alt = frame.name || '';
    img.draggable = false;
    mat.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'wframe__ph';
    ph.textContent = frame ? frame.name : '';
    mat.appendChild(ph);
  }

  const label = document.createElement('div');
  label.className = 'wframe__label';
  label.textContent = item.label || '';

  el.appendChild(border);
  el.appendChild(mat);
  // Four corner resize handles
  ['nw', 'ne', 'sw', 'se'].forEach(corner => {
    const rh = document.createElement('div');
    rh.className = 'wframe__rh wframe__rh--' + corner;
    rh.dataset.corner = corner;
    el.appendChild(rh);
  });
  el.appendChild(label);

  return el;
}

function applyItemStyle(el, item) {
  el.style.cssText =
    `left:${item.x}px;top:${item.y}px;width:${item.w}px;height:${item.h}px;` +
    `transform:rotate(${item.rot || 0}deg);position:absolute;`;

  const isSelected = state.selId === item.id;
  el.classList.toggle('selected', isSelected);

  const mat = el.querySelector('.wframe__mat');
  if (mat) {
    mat.style.cssText = `position:absolute;inset:${item.border}px;overflow:hidden;pointer-events:${isSelected ? 'auto' : 'none'};cursor:${isSelected ? 'move' : 'inherit'};`;
    const img = mat.querySelector('img');
    if (img) {
      // Use translate + scale so both X and Y pan always work regardless of
      // the natural image aspect vs container aspect.
      const panX = (item.imgPanX ?? 50) - 50; // -50..+50
      const panY = (item.imgPanY ?? 50) - 50;
      const zoom = item.imgZoom ?? 1;
      img.style.objectPosition = '';
      img.style.transform = `scale(${zoom}) translate(${panX}%, ${panY}%)`;
      img.style.transformOrigin = 'center center';
    }
  }

  const border = el.querySelector('.wframe__border');
  if (border) {
    if (item.color === 'none' || item.color === 'transparent') {
      border.style.background = 'transparent';
    } else {
      border.style.background = item.color;
    }
    border.style.boxShadow = isSelected
      ? `0 0 0 2.5px var(--color-crimson), 2px 8px 32px rgba(0,0,0,0.22)`
      : `2px 6px 28px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.1)`;
  }
}

function attachFrameEvents(el, item) {
  // Frame-level mousedown — but NOT on the mat (handled separately below)
  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('wframe__rh')) return;
    const mat = el.querySelector('.wframe__mat');
    if (mat && (e.target === mat || mat.contains(e.target))) return;
    e.preventDefault();
    startDrag(e, item.id);
  });

  // Image drag: mousedown directly on mat / img element
  const mat = el.querySelector('.wframe__mat');
  if (mat) {
    mat.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      if (state.selId === item.id) {
        // Already selected → start panning the image
        startImgDrag(e, item.id);
      } else {
        // Not yet selected → select and start frame drag
        startDrag(e, item.id);
      }
    });
  }

  el.querySelectorAll('.wframe__rh').forEach(rh => {
    rh.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      startResize(e, item.id, rh.dataset.corner);
    });
  });

  el.addEventListener('click', e => {
    e.stopPropagation();
    selectItem(item.id);
  });
}

/* ──────────────────────────────────────────
   FRAME SHELF — unused frames from layout
   ────────────────────────────────────────── */
export function showFrameShelf(unusedFrames, savedSettings) {
  const shelf = document.getElementById('frameShelf');
  if (!shelf) return;
  shelf.innerHTML = '';
  if (!unusedFrames.length) {
    shelf.style.display = 'none';
    return;
  }

  unusedFrames.forEach(frame => addThumbToShelf(frame));
}

export function addThumbToShelf(frame) {
  const shelf = document.getElementById('frameShelf');
  if (!shelf) return;
  // Ensure label exists
  if (!shelf.querySelector('.shelf-label')) {
    const label = document.createElement('span');
    label.className = 'label shelf-label';
    label.style.cssText = 'font-size:11px;opacity:0.7;white-space:nowrap;flex-shrink:0';
    label.textContent = 'Unused — drag to wall or back to place:';
    shelf.insertBefore(label, shelf.firstChild);
  }
  shelf.style.display = '';

  const thumb = document.createElement('div');
  thumb.className = 'shelf-thumb';
  thumb.draggable = true;
  thumb.title = frame.name;
  thumb.dataset.fid = frame.id;

  if (frame.src) {
    const img = document.createElement('img');
    img.src = frame.src;
    img.alt = frame.name;
    img.draggable = false;
    thumb.appendChild(img);
  } else {
    thumb.textContent = frame.name.slice(0, 2).toUpperCase();
  }

  thumb.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', frame.id);
  });
  shelf.appendChild(thumb);
}

/* Public refresh (called by properties panel) */
export function refreshWFrame(id) {
  const item = getWItem(id);
  const el   = document.getElementById(id);
  if (item && el) applyItemStyle(el, item);
}

/* Update image src in wall elements after background removal completes */
export function refreshWallFramesForFid(fid) {
  const frame = getFrame(fid);
  if (!frame?.src) return;
  state.wItems.filter(w => w.fid === fid).forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;
    const mat = el.querySelector('.wframe__mat');
    if (!mat) return;
    let img = mat.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = frame.name || '';
      img.draggable = false;
      mat.innerHTML = '';
      mat.appendChild(img);
    }
    img.src = frame.src;
    // Re-apply transform/pan — img element may have been recreated above
    applyItemStyle(el, item);
  });
}

/* ──────────────────────────────────────────
   DRAG
   ────────────────────────────────────────── */
function startDrag(e, id) {
  const item = getWItem(id);
  if (!item) return;
  saveHistory();
  state.drag = { id, ox: item.x, oy: item.y, mx: e.clientX, my: e.clientY };
  const el = document.getElementById(id);
  if (el) el.classList.add('dragging');
  selectItem(id);
}

/* ──────────────────────────────────────────
   IMAGE PAN DRAG (move image within frame)
   ────────────────────────────────────────── */
function startImgDrag(e, id) {
  const item = getWItem(id);
  if (!item) return;
  saveHistory();
  state.imgDrag = {
    id,
    ox: item.imgPanX ?? 50,
    oy: item.imgPanY ?? 50,
    mx: e.clientX,
    my: e.clientY,
  };
}

/* ──────────────────────────────────────────
   RESIZE
   ────────────────────────────────────────── */
function startResize(e, id, corner) {
  const item = getWItem(id);
  if (!item) return;
  state.resize = {
    id,
    corner: corner || 'se',
    ox: e.clientX, oy: e.clientY,
    ow: item.w,    oh: item.h,
    ix: item.x,    iy: item.y,
    aspect: item.w / item.h,
  };
}

/* ──────────────────────────────────────────
   MOUSE EVENTS
   ────────────────────────────────────────── */
function onMouseMove(e) {
  if (state.imgDrag) {
    const item = getWItem(state.imgDrag.id);
    if (!item) return;
    const el = document.getElementById(state.imgDrag.id);
    const mat = el?.querySelector('.wframe__mat');
    const mw = mat ? mat.offsetWidth  : item.w;
    const mh = mat ? mat.offsetHeight : item.h;
    // Convert pixel delta to 0-100 range (50 = center).
    // Factor 60 makes a drag across ~80% of the frame traverse the full range.
    const dx = (e.clientX - state.imgDrag.mx) / mw * 60;
    const dy = (e.clientY - state.imgDrag.my) / mh * 60;
    item.imgPanX = Math.max(0, Math.min(100, state.imgDrag.ox + dx));
    item.imgPanY = Math.max(0, Math.min(100, state.imgDrag.oy + dy));
    refreshWFrame(state.imgDrag.id);
    updateRightPanel();
    return;
  }

  if (state.drag) {
    const item = getWItem(state.drag.id);
    if (!item) return;
    let nx = state.drag.ox + (e.clientX - state.drag.mx);
    let ny = state.drag.oy + (e.clientY - state.drag.my);
    const s = snapValue();
    if (s) { nx = Math.round(nx / s) * s; ny = Math.round(ny / s) * s; }
    item.x = nx; item.y = ny;
    refreshWFrame(state.drag.id);

    // Highlight shelf if dragging over it
    const shelf = document.getElementById('frameShelf');
    if (shelf && shelf.style.display !== 'none') {
      const sr = shelf.getBoundingClientRect();
      const over = e.clientX >= sr.left && e.clientX <= sr.right &&
                   e.clientY >= sr.top  && e.clientY <= sr.bottom;
      shelf.classList.toggle('shelf--drop-active', over);
    }
  }

  if (state.resize) {
    const item = getWItem(state.resize.id);
    if (!item) return;
    const { corner, ow, oh, ix, iy, aspect, ox, oy } = state.resize;
    const dx = e.clientX - ox;
    const dy = e.clientY - oy;

    let nw = ow, nh = oh, nx = ix, ny = iy;

    switch (corner) {
      case 'se': nw = ow + dx; nh = oh + dy; break;
      case 'sw': nw = ow - dx; nh = oh + dy; nx = ix + dx; break;
      case 'ne': nw = ow + dx; nh = oh - dy; ny = iy + dy; break;
      case 'nw': nw = ow - dx; nh = oh - dy; nx = ix + dx; ny = iy + dy; break;
    }

    if (e.shiftKey) nh = nw / aspect;

    nw = Math.max(50, nw);
    nh = Math.max(50, nh);

    const s = snapValue();
    if (s) { nw = Math.round(nw / s) * s; nh = Math.round(nh / s) * s; }

    item.w = nw; item.h = nh; item.x = nx; item.y = ny;
    refreshWFrame(state.resize.id);
    updateRightPanel();
  }
}

function onMouseUp(e) {
  if (state.imgDrag) { state.imgDrag = null; return; }
  if (state.drag) {
    const dragId = state.drag.id;
    const el = document.getElementById(dragId);
    if (el) el.classList.remove('dragging');

    // Check if released over the frame shelf → return frame to shelf
    const shelf = document.getElementById('frameShelf');
    if (shelf && shelf.style.display !== 'none' && e) {
      const sr = shelf.getBoundingClientRect();
      if (e.clientX >= sr.left && e.clientX <= sr.right &&
          e.clientY >= sr.top  && e.clientY <= sr.bottom) {
        const item = getWItem(dragId);
        if (item) {
          saveHistory();
          const frame = getFrame(item.fid);
          removeWItem(dragId);
          state.selId = null;
          updateRightPanel();
          updateDropHint();
          refreshLibrary();
          if (frame) addThumbToShelf(frame);
        }
        state.drag = null;
        state.resize = null;
        shelf.classList.remove('shelf--drop-active');
        return;
      }
    }
    if (shelf) shelf.classList.remove('shelf--drop-active');
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
  import('./app.js').then(m => m.ensureRpanelOpen?.());

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
  saveHistory();
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
  if (state.wItems.length) saveHistory();
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
   UNDO HISTORY
   ────────────────────────────────────────── */
export function saveHistory() {
  state.history.push(state.wItems.map(item => ({ ...item })));
  if (state.history.length > 50) state.history.shift();
  state.future = []; // new action clears redo stack
}

function restoreSnapshot(snapshot) {
  state.wItems.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) el.remove();
  });
  state.wItems = snapshot;
  state.selId  = null;
  snapshot.forEach(item => mountWFrame(item));
  updateRightPanel();
  updateDropHint();
  refreshLibrary();
}

export function undo() {
  if (!state.history.length) {
    import('./app.js').then(m => m.toast('Nothing to undo', 'info'));
    return;
  }
  state.future.push(state.wItems.map(item => ({ ...item })));
  restoreSnapshot(state.history.pop());
  import('./app.js').then(m => m.toast('Undone', 'info'));
}

export function redo() {
  if (!state.future.length) {
    import('./app.js').then(m => m.toast('Nothing to redo', 'info'));
    return;
  }
  state.history.push(state.wItems.map(item => ({ ...item })));
  restoreSnapshot(state.future.pop());
  import('./app.js').then(m => m.toast('Redone', 'info'));
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
