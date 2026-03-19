/* ============================================================
   LIBRARY — Sidebar frame list rendering & interactions
   ============================================================ */

import { state } from './state.js';
import { addToWall } from './wall.js';

const listEl = () => document.getElementById('framesList');
const emptyEl = () => document.getElementById('framesEmpty');

/**
 * Re-render the entire frame library list.
 * Called after any frame is added, processed, or removed.
 */
export function refreshLibrary() {
  const list  = listEl();
  const empty = emptyEl();
  if (!list) return;

  // Clear frame items (preserve empty state el)
  list.querySelectorAll('.frame-item').forEach(el => el.remove());

  const hasFrames = state.frames.length > 0;
  if (empty) empty.style.display = hasFrames ? 'none' : '';

  state.frames.forEach(frame => {
    const onWall = state.wItems.some(w => w.fid === frame.id);
    const el = buildFrameItem(frame, onWall);
    list.appendChild(el);
  });
}

function buildFrameItem(frame, onWall) {
  const div = document.createElement('div');
  div.className = 'frame-item' + (frame.processed ? '' : ' processing');
  div.id = 'li-' + frame.id;
  div.setAttribute('draggable', true);

  // Thumb
  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'frame-thumb-wrap';

  if (frame.src) {
    const img = document.createElement('img');
    img.className = 'frame-thumb';
    img.src = frame.src;
    img.alt = frame.name;
    img.draggable = false;
    // Checkerboard behind transparent images
    img.style.background = 'repeating-conic-gradient(#e8e4de 0% 25%, white 0% 50%) 0 0 / 10px 10px';
    thumbWrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'frame-thumb--placeholder';
    ph.textContent = '🖼';
    thumbWrap.appendChild(ph);
  }

  // Spinner while processing
  if (!frame.processed) {
    const spin = document.createElement('div');
    spin.className = 'frame-thumb__spinner';
    spin.innerHTML = '<div class="spinner"></div>';
    thumbWrap.appendChild(spin);
  }

  // Meta
  const meta = document.createElement('div');
  meta.className = 'frame-meta';
  meta.innerHTML = `
    <div class="frame-name truncate" title="${escHtml(frame.name)}">${escHtml(frame.name)}</div>
    <div class="frame-dims caption">${frame.pw ? frame.pw + '×' + frame.ph : '…'}</div>
    ${!frame.processed ? '<div class="frame-status">Removing background…</div>' : ''}
  `;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'frame-actions';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--circle';
  addBtn.title = 'Add to wall';
  addBtn.innerHTML = '+';
  addBtn.setAttribute('aria-label', `Add ${frame.name} to wall`);
  addBtn.addEventListener('click', e => {
    e.stopPropagation();
    addToWall(frame.id);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'btn btn--icon btn--sm';
  delBtn.title = 'Remove from library';
  delBtn.setAttribute('aria-label', `Remove ${frame.name} from library`);
  delBtn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  delBtn.addEventListener('click', e => {
    e.stopPropagation();
    removeFrame(frame.id);
  });

  actions.appendChild(addBtn);
  actions.appendChild(delBtn);

  div.appendChild(thumbWrap);
  div.appendChild(meta);
  div.appendChild(actions);

  // Drag from library to wall
  div.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', frame.id);
    e.dataTransfer.effectAllowed = 'copy';
  });

  return div;
}

function removeFrame(fid) {
  // Remove from library
  const idx = state.frames.findIndex(f => f.id === fid);
  if (idx === -1) return;
  const frame = state.frames[idx];
  URL.revokeObjectURL(frame.originalSrc);
  if (frame.src !== frame.originalSrc) URL.revokeObjectURL(frame.src);
  state.frames.splice(idx, 1);

  // Remove from wall too
  const toRemove = state.wItems.filter(w => w.fid === fid);
  toRemove.forEach(w => {
    const el = document.getElementById(w.id);
    if (el) el.remove();
  });
  state.wItems = state.wItems.filter(w => w.fid !== fid);

  if (state.selId && toRemove.some(w => w.id === state.selId)) {
    state.selId = null;
    import('./properties.js').then(m => m.updateRightPanel());
  }

  refreshLibrary();
  import('./wall.js').then(m => { m.updateDropHint(); m.refreshList(); });
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
