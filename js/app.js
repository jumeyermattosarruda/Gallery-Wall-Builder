/* ============================================================
   APP — Initialization, orchestration, global utilities
   ============================================================ */

import { loadFiles, setupUploadZone, ACCEPTED, loadRefPhoto } from './upload.js';
import { initWall, applyWallSize, redrawGrid, clearWall, setWallTheme, updateDropHint, undo, redo } from './wall.js';
import { initProperties } from './properties.js';
import { buildLayoutPanel, applyLayout, LAYOUTS } from './layouts.js';
import { exportWallPng } from './export.js';
import { initRefPhoto, setRefPhoto } from './refPhoto.js';
import { refreshLibrary } from './library.js';
import { state } from './state.js';

/* ──────────────────────────────────────────
   INIT
   ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initWall();
  initProperties();
  buildLayoutPanel();
  initRefPhoto();
  setupAllUploadZones();
  setupToolbar();
  setupTopbarActions();
  setupWallThemes();
  setupSidebarTabs();
  setupSidebarCollapse();
  setupRpanelCollapse();
  setupRefWallBg();

  // Initial state
  updateDropHint();
  applyWallSize();
  redrawGrid();
});

/* ──────────────────────────────────────────
   KEYBOARD SHORTCUTS
   ────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
    e.preventDefault();
    redo();
  }
  // Windows-style redo: Ctrl+Y
  if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
    e.preventDefault();
    redo();
  }
});

/* ──────────────────────────────────────────
   UPLOAD ZONES
   ────────────────────────────────────────── */
function setupAllUploadZones() {
  // Individual frames upload zone
  const frameZone = document.getElementById('uploadZone');
  if (frameZone) {
    setupUploadZone(frameZone, files => loadFiles(files));
    const fileInput = frameZone.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.accept = ACCEPTED;
      fileInput.addEventListener('change', e => {
        if (e.target.files?.length) loadFiles(e.target.files);
        e.target.value = '';
      });
    }
  }

  // Reference photo zone
  const refZone = document.getElementById('refUploadZone');
  if (refZone) {
    setupUploadZone(refZone, async files => {
      if (!files[0]) return;
      const data = await loadRefPhoto(files[0]);
      if (data) {
        await setRefPhoto(data);
        openRefPhotoModal();
      }
    });
    const refInput = refZone.querySelector('input[type="file"]');
    if (refInput) {
      refInput.accept = ACCEPTED;
      refInput.addEventListener('change', async e => {
        if (!e.target.files?.[0]) return;
        const data = await loadRefPhoto(e.target.files[0]);
        if (data) {
          await setRefPhoto(data);
          openRefPhotoModal();
        }
        e.target.value = '';
      });
    }
  }
}

/* ──────────────────────────────────────────
   TOOLBAR
   ────────────────────────────────────────── */
function setupToolbar() {
  const wallSz = document.getElementById('wallSz');
  if (wallSz) wallSz.addEventListener('change', applyWallSize);

  const gridSz = document.getElementById('gridSz');
  if (gridSz) gridSz.addEventListener('change', redrawGrid);

  const guidesBtn = document.getElementById('guidesBtn');
  if (guidesBtn) {
    guidesBtn.addEventListener('click', () => {
      const wall = document.getElementById('wall');
      wall?.classList.toggle('show-guides');
      guidesBtn.classList.toggle('btn--accent');
    });
  }
}

/* ──────────────────────────────────────────
   TOPBAR ACTIONS
   ────────────────────────────────────────── */
function setupTopbarActions() {
  document.getElementById('clearWallBtn')?.addEventListener('click', () => {
    if (state.wItems.length === 0) return;
    if (confirm('Clear all frames from the wall?')) clearWall();
  });

  document.getElementById('exportBtn')?.addEventListener('click', exportWallPng);

  document.getElementById('openRefModalBtn')?.addEventListener('click', openRefPhotoModal);
}

/* ──────────────────────────────────────────
   WALL THEMES
   ────────────────────────────────────────── */
function setupWallThemes() {
  document.querySelectorAll('.wall-theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      setWallTheme(theme);
      document.querySelectorAll('.wall-theme-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  // Default: white
  const firstBtn = document.querySelector('.wall-theme-btn[data-theme="white"]');
  if (firstBtn) firstBtn.classList.add('active');
}

/* ──────────────────────────────────────────
   SIDEBAR TABS
   ────────────────────────────────────────── */
function setupSidebarTabs() {
  const tabs = document.querySelectorAll('.sidebar__tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.sidebar__tab-panel').forEach(p => {
        p.classList.toggle('active', p.id === target);
      });
    });
  });

  // Activate first tab
  if (tabs[0]) tabs[0].click();
}

/* ──────────────────────────────────────────
   REF PHOTO MODAL
   ────────────────────────────────────────── */
function openRefPhotoModal() {
  const modal = document.getElementById('refPhotoModal');
  if (modal) modal.classList.remove('hidden');
}

document.addEventListener('click', e => {
  const modal = document.getElementById('refPhotoModal');
  if (modal && e.target === modal) modal.classList.add('hidden');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('refPhotoModal')?.classList.add('hidden');
  }
});

/* ──────────────────────────────────────────
   GLOBAL UTILITIES (exported for other modules)
   ────────────────────────────────────────── */

/** Show a toast notification */
export function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const duration = type === 'success' ? 4500 : 3000;

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity 0.4s';
    el.style.opacity    = '0';
    setTimeout(() => el.remove(), 400);
  }, duration);
}

/** Update the progress bar (0–1) */
export function setProcessingProgress(value) {
  const fill = document.getElementById('processingFill');
  if (!fill) return;
  fill.style.width = (value * 100) + '%';
  const bar = document.getElementById('processingBar');
  if (bar) bar.style.display = value > 0 && value < 1 ? '' : 'none';
}

/* Expose quick-apply for layout buttons in HTML */
window.applyLayoutById = id => {
  const layout = LAYOUTS.find(l => l.id === id);
  if (layout) applyLayout(layout);
};

window.appExport  = exportWallPng;
window.appClear   = () => { if (state.wItems.length === 0 || confirm('Clear wall?')) clearWall(); };

/* ──────────────────────────────────────────
   SIDEBAR COLLAPSE
   ────────────────────────────────────────── */
function setupSidebarCollapse() {
  const sidebar    = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  const expandBtn  = document.getElementById('sidebarExpandBtn');
  if (!sidebar || !collapseBtn || !expandBtn) return;

  collapseBtn.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
    expandBtn.style.display = '';
  });
  expandBtn.addEventListener('click', () => {
    sidebar.classList.remove('collapsed');
    expandBtn.style.display = 'none';
  });
}

/* ──────────────────────────────────────────
   RIGHT PANEL COLLAPSE
   ────────────────────────────────────────── */
function setupRpanelCollapse() {
  const rpanel    = document.getElementById('rpanel');
  const closeBtn  = document.getElementById('rpanelCloseBtn');
  const showBtn   = document.getElementById('showRpanelBtn');
  if (!rpanel || !closeBtn || !showBtn) return;

  closeBtn.addEventListener('click', () => {
    rpanel.classList.add('collapsed');
    showBtn.style.display = '';
  });
  showBtn.addEventListener('click', () => {
    rpanel.classList.remove('collapsed');
    showBtn.style.display = 'none';
  });
}

/* Auto-open rpanel when a frame is selected */
export function ensureRpanelOpen() {
  const rpanel  = document.getElementById('rpanel');
  const showBtn = document.getElementById('showRpanelBtn');
  if (!rpanel) return;
  rpanel.classList.remove('collapsed');
  if (showBtn) showBtn.style.display = 'none';
}

/* ──────────────────────────────────────────
   WALL REFERENCE PHOTO BACKGROUND
   ────────────────────────────────────────── */
let _refBgRot     = 0;   // rotation in degrees (multiples of 90)
let _refBgVisible = true;

function setRefBgTransform() {
  const img = document.getElementById('wallRefBgImg');
  if (!img) return;
  // Translate-center + rotate.  When rotated 90/270 deg we also need to swap
  // dimensions so the image still fills the wall — scale compensates.
  const rot = _refBgRot;
  const needsSwap = rot === 90 || rot === 270;
  const bg = document.getElementById('wallRefBg');
  const scaleX = needsSwap && bg ? bg.offsetHeight / Math.max(bg.offsetWidth, 1) : 1;
  const scaleY = needsSwap && bg ? bg.offsetWidth  / Math.max(bg.offsetHeight, 1) : 1;
  const scale  = Math.max(scaleX, scaleY);
  img.style.transform = `translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`;
}

function updateRefBgIcon(visible) {
  const open   = document.getElementById('iconEyeOpen');
  const closed = document.getElementById('iconEyeClosed');
  const btn    = document.getElementById('refBgToggleBtn');
  if (open)   open.style.display   = visible ? '' : 'none';
  if (closed) closed.style.display = visible ? 'none' : '';
  if (btn) {
    btn.setAttribute('aria-pressed', String(visible));
    btn.classList.toggle('ref-bg-toggle--off', !visible);
  }
}

function setupRefWallBg() {
  const toggleBtn  = document.getElementById('refBgToggleBtn');
  const rotCCWBtn  = document.getElementById('refBgRotCCWBtn');
  const rotCWBtn   = document.getElementById('refBgRotCWBtn');
  const opSlider   = document.getElementById('refBgOpacity');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const bg = document.getElementById('wallRefBg');
    if (!bg) return;
    _refBgVisible = !_refBgVisible;
    bg.style.display = _refBgVisible ? '' : 'none';
    updateRefBgIcon(_refBgVisible);
  });

  rotCCWBtn?.addEventListener('click', () => {
    _refBgRot = (_refBgRot - 90 + 360) % 360;
    setRefBgTransform();
  });

  rotCWBtn?.addEventListener('click', () => {
    _refBgRot = (_refBgRot + 90) % 360;
    setRefBgTransform();
  });

  opSlider?.addEventListener('input', () => {
    const bg = document.getElementById('wallRefBg');
    if (bg) bg.style.opacity = opSlider.value / 100;
  });
}

export function updateRefWallBg(src) {
  const controls  = document.getElementById('refOverlayControls');
  const bg        = document.getElementById('wallRefBg');
  const img       = document.getElementById('wallRefBgImg');
  if (!bg) return;
  if (src) {
    if (img) img.src = src;
    _refBgRot     = 0;
    _refBgVisible = true;
    setRefBgTransform();
    bg.style.display = '';
    bg.style.opacity = '0.3';
    if (controls) controls.style.display = '';
    updateRefBgIcon(true);
  } else {
    bg.style.display = 'none';
    if (controls) controls.style.display = 'none';
  }
}

/* ──────────────────────────────────────────
   SIDEBAR REFERENCE PHOTO DISPLAY
   ────────────────────────────────────────── */
export function updateSidebarRefPhoto(src) {
  const zone    = document.getElementById('refUploadZone');
  const preview = document.getElementById('refSidebarPreview');
  if (!preview) return;
  if (src) {
    preview.src = src;
    preview.style.display = '';
    if (zone) zone.classList.add('has-photo');
  } else {
    preview.style.display = 'none';
    if (zone) zone.classList.remove('has-photo');
  }
}

/* Legacy — kept for compatibility, no-op now */
export function updateRefPhotoPane() {}
