/* ============================================================
   TOUR — Welcome modal + guided product tour
   ============================================================ */

import { TOUR_STEPS } from './tourSteps.js';

const STORAGE_KEY = 'frameroom_tour_done';

let _currentStep = 0;
let _active      = false;

/* ──────────────────────────────────────────
   INIT — called from app.js DOMContentLoaded
   ────────────────────────────────────────── */
export function initTour() {
  _buildDOM();
  _wireWelcomeModal();
  _wireTourButtons();
  _wireTakeTourBtn();

  // Show welcome modal on first visit
  if (!localStorage.getItem(STORAGE_KEY)) {
    _showWelcomeModal();
  }
}

/* ──────────────────────────────────────────
   WELCOME MODAL
   ────────────────────────────────────────── */
function _showWelcomeModal() {
  const modal = document.getElementById('welcomeModal');
  if (modal) modal.classList.add('visible');
}

function _hideWelcomeModal(startTour = true) {
  const modal = document.getElementById('welcomeModal');
  if (modal) modal.classList.remove('visible');
  if (startTour) startTourNow();
}

function _wireWelcomeModal() {
  const modal    = document.getElementById('welcomeModal');
  const tourBtn  = document.getElementById('welcomeTourBtn');
  const closeBtn = document.getElementById('welcomeCloseBtn');

  tourBtn?.addEventListener('click',  () => _hideWelcomeModal(true));
  closeBtn?.addEventListener('click', () => _hideWelcomeModal(false));

  // Click outside closes
  modal?.addEventListener('click', e => {
    if (e.target === modal) _hideWelcomeModal(false);
  });
}

/* ──────────────────────────────────────────
   TOUR ENGINE
   ────────────────────────────────────────── */
export function startTourNow() {
  _currentStep = 0;
  _active      = true;
  _showOverlay();
  _renderStep(_currentStep);
}

function _endTour() {
  _active = false;
  _hideOverlay();
  _hideTooltip();
  _clearHighlight();
  localStorage.setItem(STORAGE_KEY, '1');
}

function _nextStep() {
  _clearHighlight();
  _currentStep++;
  if (_currentStep >= TOUR_STEPS.length) {
    _endTour();
    return;
  }
  _renderStep(_currentStep);
}

function _renderStep(idx) {
  const step    = TOUR_STEPS[idx];
  const target  = document.querySelector(step.target);
  _highlightTarget(target);
  _positionTooltip(step, target);
}

/* ──────────────────────────────────────────
   HIGHLIGHT — body-level spotlight div
   Works through overflow:hidden and transforms.
   ────────────────────────────────────────── */
let _spotlight = null;
let _highlightedEl = null;

function _highlightTarget(el) {
  _clearHighlight();
  if (!el) return;
  _highlightedEl = el;

  const rect = el.getBoundingClientRect();
  const PAD  = 6;

  _spotlight = document.createElement('div');
  _spotlight.className = 'tour-spotlight';
  _spotlight.style.cssText = [
    'position:fixed',
    `top:${rect.top - PAD}px`,
    `left:${rect.left - PAD}px`,
    `width:${rect.width + PAD * 2}px`,
    `height:${rect.height + PAD * 2}px`,
    'z-index:1101',
    'box-shadow:0 0 0 9999px rgba(0,48,73,0.55)',
    'border-radius:10px',
    'outline:2.5px solid rgba(247,127,0,0.9)',
    'outline-offset:2px',
    'pointer-events:none',
    'transition:top 0.3s ease,left 0.3s ease,width 0.3s ease,height 0.3s ease',
  ].join(';');
  document.body.appendChild(_spotlight);

  // Clicking the target element advances the tour
  el.addEventListener('click', _onHighlightClick, { once: true });
}

function _clearHighlight() {
  if (_spotlight) { _spotlight.remove(); _spotlight = null; }
  if (_highlightedEl) {
    _highlightedEl.removeEventListener('click', _onHighlightClick);
    _highlightedEl = null;
  }
}

function _onHighlightClick() {
  if (_active) _nextStep();
}

/* ──────────────────────────────────────────
   TOOLTIP
   ────────────────────────────────────────── */
function _positionTooltip(step, target) {
  const tt = document.getElementById('tourTooltip');
  if (!tt) return;

  // Update content
  const titleEl   = tt.querySelector('.tour-tooltip__title');
  const bodyEl    = tt.querySelector('.tour-tooltip__body');
  const nextBtn   = tt.querySelector('.tour-tooltip__next');
  const closeBtn2 = tt.querySelector('.tour-tooltip__close');
  const progress  = tt.querySelector('.tour-tooltip__progress');

  if (titleEl)   titleEl.textContent   = step.title   || '';
  if (bodyEl)    bodyEl.textContent    = step.content  || '';
  if (nextBtn)   nextBtn.textContent   = step.final ? 'Get started' : 'Next →';
  if (progress)  progress.textContent  = `${_currentStep + 1} / ${TOUR_STEPS.length}`;

  tt.style.display = '';
  tt.classList.remove('tour-tooltip--visible');

  // On mobile, CSS pins the tooltip to the bottom — no JS positioning needed
  if (window.innerWidth <= 768) {
    tt.style.top    = '';
    tt.style.left   = '';
    tt.style.right  = '';
    tt.style.transform = '';
  } else if (!target) {
    _centerTooltip(tt);
  } else {
    _autoPosition(tt, target, step.position || 'bottom');
  }

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => tt.classList.add('tour-tooltip--visible'));
  });
}

function _centerTooltip(tt) {
  tt.style.top    = '50%';
  tt.style.left   = '50%';
  tt.style.transform = 'translate(-50%, -50%)';
}

function _autoPosition(tt, target, preferred) {
  const tr   = target.getBoundingClientRect();
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;
  const TW   = 280; // approx tooltip width
  const TH   = 160; // approx tooltip height
  const GAP  = 12;

  // Determine best side
  const spaceTop    = tr.top;
  const spaceBottom = vh - tr.bottom;
  const spaceLeft   = tr.left;
  const spaceRight  = vw - tr.right;

  let side = preferred;
  if (side === 'top'    && spaceTop    < TH  + GAP) side = 'bottom';
  if (side === 'bottom' && spaceBottom < TH  + GAP) side = 'top';
  if (side === 'left'   && spaceLeft   < TW  + GAP) side = 'right';
  if (side === 'right'  && spaceRight  < TW  + GAP) side = 'left';

  tt.style.transform = '';

  if (side === 'top') {
    tt.style.top  = (tr.top  - TH  - GAP + window.scrollY) + 'px';
    tt.style.left = Math.max(8, Math.min(vw - TW - 8, tr.left + tr.width / 2 - TW / 2)) + 'px';
  } else if (side === 'bottom') {
    tt.style.top  = (tr.bottom + GAP + window.scrollY) + 'px';
    tt.style.left = Math.max(8, Math.min(vw - TW - 8, tr.left + tr.width / 2 - TW / 2)) + 'px';
  } else if (side === 'left') {
    tt.style.top  = Math.max(8, tr.top + tr.height / 2 - TH / 2 + window.scrollY) + 'px';
    tt.style.left = Math.max(8, tr.left - TW - GAP) + 'px';
  } else { // right
    tt.style.top  = Math.max(8, tr.top + tr.height / 2 - TH / 2 + window.scrollY) + 'px';
    tt.style.left = Math.min(vw - TW - 8, tr.right + GAP) + 'px';
  }
}

function _hideTooltip() {
  const tt = document.getElementById('tourTooltip');
  if (tt) {
    tt.classList.remove('tour-tooltip--visible');
    setTimeout(() => { tt.style.display = 'none'; }, 200);
  }
}

/* ──────────────────────────────────────────
   OVERLAY
   ────────────────────────────────────────── */
function _showOverlay() {
  // Overlay is now just a pointer-events blocker; dimming done by spotlight
  const ov = document.getElementById('tourOverlay');
  if (ov) { ov.classList.add('visible'); ov.style.background = 'transparent'; }
}

function _hideOverlay() {
  const ov = document.getElementById('tourOverlay');
  if (ov) ov.classList.remove('visible');
}

/* ──────────────────────────────────────────
   BUTTON WIRING
   ────────────────────────────────────────── */
function _wireTourButtons() {
  document.addEventListener('click', e => {
    if (!_active) return;
    if (e.target.closest('.tour-tooltip__next'))  { e.stopPropagation(); _nextStep();  }
    if (e.target.closest('.tour-tooltip__close')) { e.stopPropagation(); _endTour();   }
  });
}

function _wireTakeTourBtn() {
  document.getElementById('takeTourBtn')?.addEventListener('click', () => {
    _hideWelcomeModal(false); // don't auto-start from modal
    startTourNow();
  });
}

/* ──────────────────────────────────────────
   DOM INJECTION (tooltip + overlay)
   ────────────────────────────────────────── */
function _buildDOM() {
  if (document.getElementById('tourOverlay')) return; // already built

  // Overlay
  const ov = document.createElement('div');
  ov.id        = 'tourOverlay';
  ov.className = 'tour-overlay';
  ov.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ov);

  // Tooltip
  const tt = document.createElement('div');
  tt.id        = 'tourTooltip';
  tt.className = 'tour-tooltip';
  tt.style.display = 'none';
  tt.setAttribute('role', 'dialog');
  tt.setAttribute('aria-label', 'Tour step');
  tt.innerHTML = `
    <div class="tour-tooltip__header">
      <span class="tour-tooltip__title"></span>
      <span class="tour-tooltip__progress"></span>
    </div>
    <p class="tour-tooltip__body"></p>
    <div class="tour-tooltip__actions">
      <button class="tour-tooltip__close btn btn--ghost btn--sm">Close</button>
      <button class="tour-tooltip__next btn btn--primary btn--sm">Next →</button>
    </div>
  `;
  document.body.appendChild(tt);
}
