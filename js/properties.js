/* ============================================================
   PROPERTIES — Right panel: frame editing controls
   ============================================================ */

import { state, getWItem, getFrame } from './state.js';
import { refreshWFrame, deleteSelected } from './wall.js';

export const FRAME_STYLES = [
  { id: 'flat',    name: 'Minimal',      desc: 'Flat, solid colour',      preview: 'flat' },
  { id: 'bevel',   name: 'Modern',       desc: 'Bevelled chamfer profile', preview: 'bevel' },
  { id: 'baroque', name: 'Baroque',      desc: 'Carved ornate detail',     preview: 'baroque' },
  { id: 'raised',  name: 'White Modern', desc: 'Raised stepped moulding',  preview: 'raised' },
  { id: 'wood',    name: 'Wood',         desc: 'Oak grain texture',        preview: 'wood' },
];

/* Frame border color options */
export const FRAME_COLORS = [
  { name: 'None (transparent)', value: 'none' },
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
  ['pw', 'ph', 'pBorder', 'pRot', 'pImgPanX', 'pImgPanY', 'pImgZoom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', applySelProps);
  });

  // Slider value display
  const border = document.getElementById('pBorder');
  const borderVal = document.getElementById('borderVal');
  if (border && borderVal) {
    border.addEventListener('input', () => { borderVal.textContent = border.value; });
  }

  const rot = document.getElementById('pRot');
  const rotVal = document.getElementById('rotVal');
  if (rot && rotVal) {
    rot.addEventListener('input', () => { rotVal.textContent = rot.value; });
  }

  // 90° rotation buttons
  document.getElementById('rotCCWBtn')?.addEventListener('click', () => rotateBy(-90));
  document.getElementById('rotCWBtn')?.addEventListener('click',  () => rotateBy(90));

  const imgZoom = document.getElementById('pImgZoom');
  const imgZoomVal = document.getElementById('imgZoomVal');
  if (imgZoom && imgZoomVal) {
    imgZoom.addEventListener('input', () => { imgZoomVal.textContent = imgZoom.value + '%'; });
  }

  document.getElementById('imgResetBtn')?.addEventListener('click', () => {
    if (!state.selId) return;
    const item = getWItem(state.selId);
    if (!item) return;
    item.imgPanX = 50; item.imgPanY = 50; item.imgZoom = 1;
    refreshWFrame(state.selId);
    updateRightPanel();
  });

  // Delete button
  const delBtn = document.getElementById('delFrameBtn');
  if (delBtn) delBtn.addEventListener('click', deleteSelected);

  // Build style picker
  buildStylePicker();
  // Build color swatches
  buildColorPicker();
  // Custom frame color inputs
  setupFrameColorInputs();

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
    refreshStylePicker(item);
    updateImagePreview(item);
    // Sync custom color inputs
    const picker = document.getElementById('frameColorInput');
    const hexIn  = document.getElementById('frameColorHex');
    const c = item.color;
    if (picker && c && c !== 'none' && /^#[0-9a-fA-F]{6}$/.test(c)) picker.value = c;
    if (hexIn)  hexIn.value = (c && c !== 'none') ? c : '';
  }
}

function fillInputs(item) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('pw', Math.round(item.w));
  set('ph', Math.round(item.h));
  set('pBorder', item.border);
  set('pRot', item.rot || 0);
  set('pImgPanX', item.imgPanX ?? 50);
  set('pImgPanY', item.imgPanY ?? 50);
  set('pImgZoom', Math.round((item.imgZoom ?? 1) * 100));
  setText('borderVal', item.border);
  setText('rotVal',    item.rot || 0);
  setText('imgZoomVal', Math.round((item.imgZoom ?? 1) * 100) + '%');
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
  item.border   = getNum('pBorder')   ?? item.border;
  item.rot      = getNum('pRot')      ?? (item.rot || 0);
  item.imgPanX  = getNum('pImgPanX')  ?? (item.imgPanX ?? 50);
  item.imgPanY  = getNum('pImgPanY')  ?? (item.imgPanY ?? 50);
  const rawZoom = getNum('pImgZoom');
  if (rawZoom != null) item.imgZoom = rawZoom / 100;

  refreshWFrame(state.selId);
}

/* Frame style picker */
function buildStylePicker() {
  const container = document.getElementById('frameStylePicker');
  if (!container) return;
  container.innerHTML = '';
  FRAME_STYLES.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'frame-style-btn';
    btn.dataset.style = s.id;
    btn.title = s.desc;
    btn.setAttribute('aria-label', `Frame style: ${s.name}`);

    const preview = document.createElement('div');
    preview.className = `frame-style-preview frame-style-preview--${s.id}`;

    const label = document.createElement('span');
    label.textContent = s.name;

    btn.appendChild(preview);
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      if (!state.selId) return;
      const item = getWItem(state.selId);
      if (!item) return;
      item.frameStyle = s.id;
      refreshWFrame(state.selId);
      refreshStylePicker(item);
    });
    container.appendChild(btn);
  });
}

function refreshStylePicker(item) {
  document.querySelectorAll('#frameStylePicker .frame-style-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.style === (item.frameStyle || 'flat'));
  });
}

/* Custom frame color inputs */
function setupFrameColorInputs() {
  const picker = document.getElementById('frameColorInput');
  const hexIn  = document.getElementById('frameColorHex');

  picker?.addEventListener('input', () => applyCustomFrameColor(picker.value));
  hexIn?.addEventListener('change', () => {
    let v = hexIn.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    applyCustomFrameColor(v);
  });
  hexIn?.addEventListener('keydown', e => {
    if (e.key === 'Enter') hexIn.dispatchEvent(new Event('change'));
  });
}

function applyCustomFrameColor(hex) {
  if (!state.selId) return;
  const item = getWItem(state.selId);
  if (!item) return;
  item.color = hex;
  refreshWFrame(state.selId);
  refreshColorPicker(item);
  // Sync native picker
  const picker = document.getElementById('frameColorInput');
  const hexIn  = document.getElementById('frameColorHex');
  if (picker && /^#[0-9a-fA-F]{6}$/.test(hex)) picker.value = hex;
  if (hexIn)  hexIn.value = hex;
}

/* Color swatches */
function buildColorPicker() {
  const cp = document.getElementById('colorPicker');
  if (!cp) return;
  cp.innerHTML = '';

  FRAME_COLORS.forEach(c => {
    const s = document.createElement('button');
    s.className = 'swatch' + (c.value === 'none' ? ' swatch--none' : '');
    s.style.background = c.value === 'none' ? 'transparent' : c.value;
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

function rotateBy(deg) {
  if (!state.selId) return;
  const item = getWItem(state.selId);
  if (!item) return;
  item.rot = ((item.rot || 0) + deg + 360) % 360;
  refreshWFrame(state.selId);
  updateRightPanel();
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
