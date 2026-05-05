/* ============================================================
   EXPORT — PNG export of the wall composition
   ============================================================ */

import { state, getFrame } from './state.js';
import { capture } from './analytics.js';

/**
 * Renders the wall to a high-resolution PNG and triggers download.
 * Scale factor: 2× for retina quality.
 */
export async function exportWallPng() {
  const wallEl = document.getElementById('wall');
  if (!wallEl) return;

  const W = wallEl.offsetWidth;
  const H = wallEl.offsetHeight;
  const SCALE = 2;

  const canvas = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // Wall background
  const wallBg = getComputedStyle(wallEl).backgroundColor || '#ffffff';
  ctx.fillStyle = wallBg;
  ctx.fillRect(0, 0, W, H);

  // Draw each frame
  await Promise.all(state.wItems.map(item => drawItem(ctx, item)));

  capture('wall_exported', {
    frame_count:  state.wItems.length,
    wall_width:   W,
    wall_height:  H,
    active_layout: state.activeLayoutId,
  });

  // Download
  canvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'gallery-wall.png';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 1000);
  }, 'image/png');
}

async function drawItem(ctx, item) {
  const frame = getFrame(item.fid);

  ctx.save();
  ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
  ctx.rotate((item.rot * Math.PI) / 180);

  // Shadow
  ctx.shadowColor   = 'rgba(0,0,0,0.20)';
  ctx.shadowBlur    = 18;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 6;

  // Frame border
  ctx.fillStyle = item.color;
  ctx.fillRect(-item.w / 2, -item.h / 2, item.w, item.h);

  // Clear shadow for inner content
  ctx.shadowColor = 'transparent';

  // Image content
  if (frame && frame.src) {
    try {
      const img = await loadCrossOriginImage(frame.src);
      const iw = item.w - item.border * 2;
      const ih = item.h - item.border * 2;
      ctx.drawImage(img, -item.w / 2 + item.border, -item.h / 2 + item.border, iw, ih);
    } catch {
      drawPlaceholder(ctx, item);
    }
  } else {
    drawPlaceholder(ctx, item);
  }

  ctx.restore();
}

function drawPlaceholder(ctx, item) {
  const iw = item.w - item.border * 2;
  const ih = item.h - item.border * 2;
  ctx.fillStyle = '#e8e4de';
  ctx.fillRect(-item.w / 2 + item.border, -item.h / 2 + item.border, iw, ih);
}

function loadCrossOriginImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
