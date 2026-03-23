/* ============================================================
   REF PHOTO — Upload + overlay adjustment (scale / opacity)
   Box-drawing workflow removed in favour of direct wall overlay.
   ============================================================ */

import { state } from './state.js';

let _scale = 1.0; // user-controlled overlay scale (1 = fill wall)

export function initRefPhoto() {
  // Scale slider in modal
  const scaleSlider  = document.getElementById('refScaleSlider');
  const scaleVal     = document.getElementById('refScaleVal');
  const opSlider     = document.getElementById('refOpacitySlider');
  const opVal        = document.getElementById('refOpacityVal');

  scaleSlider?.addEventListener('input', () => {
    _scale = scaleSlider.value / 100;
    if (scaleVal) scaleVal.textContent = scaleSlider.value + '%';
    import('./app.js').then(m => m.applyRefBgScale?.(_scale));
  });

  opSlider?.addEventListener('input', () => {
    const v = opSlider.value;
    if (opVal) opVal.textContent = v + '%';
    // Mirror to toolbar slider + apply
    const toolbarSlider = document.getElementById('refBgOpacity');
    if (toolbarSlider) toolbarSlider.value = v;
    const bg = document.getElementById('wallRefBg');
    if (bg) bg.style.opacity = v / 100;
  });

  // Quick-fit buttons
  document.getElementById('refFitWidthBtn')?.addEventListener('click',  () => fitOverlay('width'));
  document.getElementById('refFitHeightBtn')?.addEventListener('click', () => fitOverlay('height'));
  document.getElementById('refFillBtn')?.addEventListener('click',      () => fitOverlay('fill'));
}

function fitOverlay(mode) {
  if (!state.refPhoto) return;
  const wallEl = document.getElementById('wall');
  if (!wallEl) return;
  const ww = wallEl.offsetWidth;
  const wh = wallEl.offsetHeight;
  const iw = state.refPhoto.w;
  const ih = state.refPhoto.h;
  // Account for current rotation (swap dims at 90/270)
  import('./app.js').then(m => {
    const rot = m.getRefBgRot?.() ?? 0;
    const [ew, eh] = (rot === 90 || rot === 270) ? [ih, iw] : [iw, ih];
    let s;
    if (mode === 'width')  s = ww / ew;
    else if (mode === 'height') s = wh / eh;
    else s = Math.max(ww / ew, wh / eh); // fill

    // Normalise: fill=1, others relative to fill
    const fillScale = Math.max(ww / ew, wh / eh);
    _scale = s / fillScale;

    const pct = Math.round(_scale * 100);
    const slider = document.getElementById('refScaleSlider');
    const val    = document.getElementById('refScaleVal');
    if (slider) slider.value = Math.max(20, Math.min(250, pct));
    if (val)    val.textContent = pct + '%';
    m.applyRefBgScale?.(_scale);
  });
}

export async function setRefPhoto(photoData) {
  state.refPhoto = photoData;
  _scale = 1.0;
  // Reset modal UI
  const slider = document.getElementById('refScaleSlider');
  const val    = document.getElementById('refScaleVal');
  if (slider) slider.value = 100;
  if (val)    val.textContent = '100%';

  // Show photo thumbnail in modal
  const preview = document.getElementById('refModalPreview');
  const img     = document.getElementById('refModalImg');
  if (preview && img && photoData?.src) {
    img.src = photoData.src;
    preview.style.display = '';
  }

  import('./app.js').then(m => {
    m.updateRefWallBg?.(photoData?.src);
    m.updateSidebarRefPhoto?.(photoData?.src);
  });
}
