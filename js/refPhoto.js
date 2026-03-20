/* ============================================================
   REF PHOTO — Group photo upload, frame tagging, size analysis
   ============================================================ */

import { state } from './state.js';
import { computeRelativeSizes } from './imageProcess.js';
import { toast } from './app.js';

let drawing    = false;
let startPt    = null;
let currentBox = null;
let dragBox    = null; // { index, startPt, origBox }

/**
 * Initialize the reference photo panel.
 * Binds upload + canvas interaction.
 */
export function initRefPhoto() {
  const canvas  = document.getElementById('refCanvas');
  const overlay = document.getElementById('refPhotoOverlay');
  if (!canvas) return;

  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  canvas.addEventListener('mouseup',   onCanvasMouseUp);

  const clearBtn = document.getElementById('refClearBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearBoxes);

  const applyBtn = document.getElementById('refApplyBtn');
  if (applyBtn) applyBtn.addEventListener('click', applySizes);

  renderBoxOverlay();
}

/**
 * Load a reference photo into the canvas.
 */
export async function setRefPhoto(photoData) {
  state.refPhoto = photoData;
  state.refBoxes = [];
  renderRefCanvas();
  import('./app.js').then(m => m.updateRefPhotoPane?.(photoData?.src));
}

/* ── Canvas render ── */
function renderRefCanvas() {
  const canvas = document.getElementById('refCanvas');
  if (!canvas || !state.refPhoto) return;

  const maxW = canvas.parentElement?.offsetWidth || 400;
  const ratio = maxW / state.refPhoto.w;
  canvas.width  = Math.round(state.refPhoto.w * ratio);
  canvas.height = Math.round(state.refPhoto.h * ratio);
  canvas._scale = ratio;

  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawBoxes(ctx, canvas._scale);
  };
  img.src = state.refPhoto.src;

  // Hide the hint to avoid overlapping the drawing area
  const hint = document.getElementById('refPhotoHint');
  if (hint) hint.style.display = 'none';
}

function drawBoxes(ctx, scale) {
  state.refBoxes.forEach((box, i) => {
    const x = box.x * scale;
    const y = box.y * scale;
    const w = box.w * scale;
    const h = box.h * scale;

    ctx.strokeStyle = '#F77F00';
    ctx.lineWidth   = 2;
    ctx.strokeRect(x, y, w, h);

    // Number badge
    ctx.fillStyle = '#F77F00';
    ctx.fillRect(x, y, 20, 18);
    ctx.fillStyle = 'white';
    ctx.font      = 'bold 11px Inter, sans-serif';
    ctx.fillText(i + 1, x + 4, y + 13);
  });

  if (currentBox) {
    ctx.strokeStyle = 'rgba(214,40,40,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(currentBox.x * scale, currentBox.y * scale, currentBox.w * scale, currentBox.h * scale);
    ctx.setLineDash([]);
  }
}

function redrawCanvas() {
  const canvas = document.getElementById('refCanvas');
  if (!canvas || !state.refPhoto) return;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawBoxes(ctx, canvas._scale || 1);
    renderBoxOverlay();
  };
  img.src = state.refPhoto.src;
}

/* ── Canvas mouse interactions ── */
function getCanvasPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  // Account for CSS scaling (max-width/max-height may shrink the canvas display size)
  const cssScaleX = canvas.width  / (rect.width  || canvas.width);
  const cssScaleY = canvas.height / (rect.height || canvas.height);
  const logicalScale = canvas._scale || 1;
  return {
    x: (e.clientX - rect.left) * cssScaleX / logicalScale,
    y: (e.clientY - rect.top)  * cssScaleY / logicalScale,
  };
}

function hitTestBox(pt) {
  for (let i = state.refBoxes.length - 1; i >= 0; i--) {
    const b = state.refBoxes[i];
    if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return i;
  }
  return -1;
}

function onCanvasMouseDown(e) {
  if (!state.refPhoto) return;
  const pt  = getCanvasPos(this, e);
  const hit = hitTestBox(pt);

  if (hit >= 0) {
    // Start dragging an existing box
    dragBox = { index: hit, startPt: pt, origBox: { ...state.refBoxes[hit] } };
    this.style.cursor = 'move';
  } else {
    // Start drawing a new box
    drawing  = true;
    startPt  = pt;
    currentBox = { x: pt.x, y: pt.y, w: 0, h: 0, fid: null };
  }
}

function onCanvasMouseMove(e) {
  if (!state.refPhoto) return;
  const pt = getCanvasPos(this, e);

  if (dragBox) {
    const dx = pt.x - dragBox.startPt.x;
    const dy = pt.y - dragBox.startPt.y;
    state.refBoxes[dragBox.index].x = dragBox.origBox.x + dx;
    state.refBoxes[dragBox.index].y = dragBox.origBox.y + dy;
    redrawCanvas();
    return;
  }

  if (!drawing || !startPt) return;
  currentBox = {
    x:   Math.min(startPt.x, pt.x),
    y:   Math.min(startPt.y, pt.y),
    w:   Math.abs(pt.x - startPt.x),
    h:   Math.abs(pt.y - startPt.y),
    fid: null,
  };
  redrawCanvas();
}

function onCanvasMouseUp(e) {
  if (dragBox) {
    dragBox = null;
    this.style.cursor = 'crosshair';
    redrawCanvas();
    return;
  }
  if (!drawing || !currentBox) return;
  drawing = false;
  if (currentBox.w > 10 && currentBox.h > 10) {
    state.refBoxes.push({ ...currentBox });
    assignBoxToFrame(state.refBoxes.length - 1);
  }
  currentBox = null;
  redrawCanvas();
}

/* ── Box overlay (sidebar list) ── */
function renderBoxOverlay() {
  const list = document.getElementById('refBoxList');
  if (!list) return;
  list.innerHTML = '';

  if (!state.refBoxes.length) {
    list.innerHTML = '<p class="caption" style="color:var(--color-text-caption);padding:8px 0">Draw boxes around each frame in the photo above.</p>';
    return;
  }

  state.refBoxes.forEach((box, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px';

    const num = document.createElement('span');
    num.style.cssText = 'min-width:20px;height:20px;border-radius:50%;background:var(--color-orange);color:white;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0';
    num.textContent = i + 1;

    const sel = document.createElement('select');
    sel.style.cssText = 'flex:1;font-size:12px;padding:4px 8px';
    sel.innerHTML = '<option value="">— match frame —</option>' +
      state.frames.map(f => `<option value="${f.id}" ${box.fid === f.id ? 'selected' : ''}>${escHtml(f.name)}</option>`).join('');
    sel.addEventListener('change', () => {
      state.refBoxes[i].fid = sel.value || null;
    });

    const del = document.createElement('button');
    del.className = 'btn btn--icon btn--sm';
    del.innerHTML = '×';
    del.title = 'Remove box';
    del.addEventListener('click', () => {
      state.refBoxes.splice(i, 1);
      redrawCanvas();
    });

    row.appendChild(num);
    row.appendChild(sel);
    row.appendChild(del);
    list.appendChild(row);
  });
}

function assignBoxToFrame(idx) {
  // Auto-assign to unassigned frames in order
  const assignedFids = state.refBoxes.map(b => b.fid).filter(Boolean);
  const available = state.frames.find(f => !assignedFids.includes(f.id));
  if (available) state.refBoxes[idx].fid = available.id;
  renderBoxOverlay();
}

function clearBoxes() {
  state.refBoxes = [];
  redrawCanvas();
}

function applySizes() {
  const sizes = computeRelativeSizes(state.refBoxes.filter(b => b.fid));
  Object.entries(sizes).forEach(([fid, relSize]) => {
    const frame = state.frames.find(f => f.id === fid);
    if (frame) frame.relSize = relSize;
  });
  toast('Relative sizes applied! Now choose a layout.', 'success');

  // Close modal
  const modal = document.getElementById('refPhotoModal');
  if (modal) modal.classList.add('hidden');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
