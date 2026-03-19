/* ============================================================
   APP — Initialization, orchestration, global utilities
   ============================================================ */

import { loadFiles, setupUploadZone, ACCEPTED, loadRefPhoto } from './upload.js';
import { initWall, applyWallSize, redrawGrid, clearWall, setWallTheme, updateDropHint } from './wall.js';
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

  // Initial state
  updateDropHint();
  applyWallSize();
  redrawGrid();
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

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity    = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
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
