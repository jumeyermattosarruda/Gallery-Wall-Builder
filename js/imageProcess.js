/* ============================================================
   IMAGE PROCESS — Background removal + size analysis
   ============================================================ */

/**
 * Remove background from an image URL.
 * Strategy:
 *   1. Try the @imgly/background-removal library if available (ML-based, best quality).
 *   2. Fall back to canvas flood-fill algorithm (corner-sample approach).
 * Returns a blob URL of the processed PNG.
 */
export async function removeBackground(srcUrl) {
  // Try ML-based removal first (loaded via CDN in index.html)
  if (window.bgRemoval) {
    try {
      const blob = await window.bgRemoval.removeBackground(srcUrl, {
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
        model: 'small',
      });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn('ML bg removal failed, falling back', e);
    }
  }

  // Canvas flood-fill fallback
  return canvasRemoveBackground(srcUrl);
}

/**
 * Canvas-based background removal.
 * Samples background color from image corners, flood-fills from edges,
 * removes matched pixels (sets alpha to 0).
 */
async function canvasRemoveBackground(srcUrl) {
  const img = await loadImage(srcUrl);
  const canvas = document.createElement('canvas');
  canvas.width  = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data      = imageData.data;
  const W = canvas.width, H = canvas.height;

  // Sample background color from the 4 corners (pick most common)
  const bgColor = sampleBackgroundColor(data, W, H);

  // Flood fill from all 4 edges
  const visited = new Uint8Array(W * H);
  const queue   = [];

  // Seed: top and bottom rows
  for (let x = 0; x < W; x++) {
    queue.push(x, 0);
    queue.push(x, H - 1);
  }
  // Seed: left and right columns
  for (let y = 0; y < H; y++) {
    queue.push(0, y);
    queue.push(W - 1, y);
  }

  const tolerance = 42;

  let qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++];
    const y = queue[qi++];
    const idx = (y * W + x);
    if (visited[idx]) continue;
    visited[idx] = 1;

    const pi = idx * 4;
    if (colorMatch(data, pi, bgColor, tolerance)) {
      // Remove this pixel
      data[pi + 3] = 0;
      // Push neighbors
      if (x > 0)     { queue.push(x - 1, y); }
      if (x < W - 1) { queue.push(x + 1, y); }
      if (y > 0)     { queue.push(x, y - 1); }
      if (y < H - 1) { queue.push(x, y + 1); }
    }
  }

  // Feather edges slightly (optional 1-pixel alpha blur along mask boundary)
  featherEdges(data, W, H);

  ctx.putImageData(imageData, 0, 0);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/png');
  });
}

function sampleBackgroundColor(data, W, H) {
  const corners = [
    [0, 0],
    [W - 1, 0],
    [0, H - 1],
    [W - 1, H - 1],
    [Math.floor(W / 2), 0],       // top center
    [0, Math.floor(H / 2)],       // left center
    [W - 1, Math.floor(H / 2)],   // right center
    [Math.floor(W / 2), H - 1],   // bottom center
  ];

  let r = 0, g = 0, b = 0;
  for (const [x, y] of corners) {
    const i = (y * W + x) * 4;
    r += data[i]; g += data[i+1]; b += data[i+2];
  }
  return [r / corners.length, g / corners.length, b / corners.length];
}

function colorMatch(data, pi, [br, bg, bb], tolerance) {
  return (
    Math.abs(data[pi]   - br) < tolerance &&
    Math.abs(data[pi+1] - bg) < tolerance &&
    Math.abs(data[pi+2] - bb) < tolerance
  );
}

function featherEdges(data, W, H) {
  // For each pixel that was removed (alpha=0), soften neighbors
  // This is a lightweight 1-pass approach
  const alphaSnapshot = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) alphaSnapshot[i] = data[i * 4 + 3];

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const idx = y * W + x;
      if (alphaSnapshot[idx] === 255) {
        // Check if any neighbor was removed
        const neighbors = [
          alphaSnapshot[(y-1)*W+x],
          alphaSnapshot[(y+1)*W+x],
          alphaSnapshot[y*W+x-1],
          alphaSnapshot[y*W+x+1],
        ];
        const removedNeighbors = neighbors.filter(a => a === 0).length;
        if (removedNeighbors > 0) {
          data[idx * 4 + 3] = Math.max(0, 255 - removedNeighbors * 60);
        }
      }
    }
  }
}

/* ── Reference photo: compute relative sizes from tagged boxes ── */
/**
 * Given an array of bounding boxes [{x,y,w,h,fid}],
 * calculate the relative area of each frame compared to the largest one.
 * Returns {fid: relativeSize} where 1.0 = largest frame.
 */
export function computeRelativeSizes(boxes) {
  if (!boxes.length) return {};
  const areas = boxes.map(b => b.w * b.h);
  const maxArea = Math.max(...areas);
  const result = {};
  boxes.forEach((b, i) => {
    if (b.fid) result[b.fid] = areas[i] / maxArea;
  });
  return result;
}

/* ── Helpers ── */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
