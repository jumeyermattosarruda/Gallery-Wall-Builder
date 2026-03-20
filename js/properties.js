/* ============================================================
   PROPERTIES — Right panel: frame editing controls
   ============================================================ */

import { state, getWItem, getFrame } from './state.js';
import { refreshWFrame, deleteSelected } from './wall.js';

/* Frame border color options */
export const FRAME_COLORS = [
  { name: 'White',       value: '#f7f4f0' },
  { name: 'Cream',       value: '#ede8dc' },
  { name: 'Black',       value: '#1c1a18' },
  { name: 'Graphite',    value: '#4a4845' },
  { name: 'Walnut',      value: '#7a5230' },
  { name: 'Gold',        value: '#c9a84c' },
  { name: 'Silver',      value: '#b0b0b0' },
  { name: 'Dark Green',  value: '#3a5a40' },
  { name: 'Navy',        value: '#003049' },
  { name: 'Terracotta',  value: '#b85c38' },
];

export function initProperties() {
  // Wire up input listeners
  ['pw', 'ph', 'pBorder'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', applySelProps);
  });

  // Slider value display
  const border = document.getElementById('pBorder');
  const borderVal = document.getElementById('borderVal');
  if (border && borderVal) {
    border.addEventListener('input', () => { borderVal.textContent = border.value; });
  }

  // Delete button
  const delBtn = document.getElementById('delFrameBtn');
  if (delBtn) delBtn.addEventListener('click', deleteSelected);

  // Build color swatches
  buildColorPicker();

  updateRightPanel();
}

export function updateRightPanel() {
  const item  = state.selId ? getWItem(state.selId) : null;
  const noSel = document.getElementById('noSel');
  const props = document.getElementById('selProps');

  if (noSel) noSel.style.display = item ? 'none' : '';
  if (props) props.style.display = item ? '' : 'none';

  if (item) {
    fillInputs(item);
    refreshColorPicker(item);
    updateImagePreview(item);
  }
}

function fillInputs(item) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('pw', Math.round(item.w));
  set('ph', Math.round(item.h));
  set('pBorder', item.border);
  setText('borderVal', item.border);
}

function applySelProps() {
  if (!state.selId) return;
  const item = getWItem(state.selId);
  if (!item) return;

  const getNum = id => {
    const el = document.getElementById(id);
    return el ? parseFloat(el.value) : null;
  };

  const w = getNum('pw');
  const h = getNum('ph');
  if (w && w >= 40) item.w = w;
  if (h && h >= 40) item.h = h;
  item.border = getNum('pBorder') ?? item.border;

  refreshWFrame(state.selId);
}

/* Color swatches */
function buildColorPicker() {
  const cp = document.getElementById('colorPicker');
  if (!cp) return;
  cp.innerHTML = '';

  FRAME_COLORS.forEach(c => {
    const s = document.createElement('button');
    s.className = 'swatch';
    s.style.background = c.value;
    s.title = c.name;
    s.setAttribute('aria-label', `Frame color: ${c.name}`);
    s.dataset.color = c.value;
    s.addEventListener('click', () => {
      if (!state.selId) return;
      const item = getWItem(state.selId);
      if (!item) return;
      item.color = c.value;
      refreshWFrame(state.selId);
      refreshColorPicker(item);
    });
    cp.appendChild(s);
  });
}

function refreshColorPicker(item) {
  document.querySelectorAll('#colorPicker .swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === item.color);
  });
}

function updateImagePreview(item) {
  const frame = getFrame(item.fid);
  const prev  = document.getElementById('framePreviewImg');
  const name  = document.getElementById('framePreviewName');
  if (prev) {
    if (frame?.src) {
      prev.src   = frame.src;
      prev.style.display = '';
    } else {
      prev.style.display = 'none';
    }
  }
  if (name) name.textContent = frame?.name || item.label || '';
}
