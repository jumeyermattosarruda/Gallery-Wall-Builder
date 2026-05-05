/* ============================================================
   UPLOAD — File handling, HEIC conversion, image loading
   ============================================================ */

import { state, nextId } from './state.js';
import { removeBackground } from './imageProcess.js';
import { refreshLibrary } from './library.js';
import { toast, setProcessingProgress } from './app.js';
import { capture } from './analytics.js';

/* Accepted formats (the file input accept string) */
export const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp';

/**
 * Entry point: called with a FileList or File array.
 * Handles HEIC conversion, decoding, and adds to state.frames.
 */
export async function loadFiles(files) {
  const arr = Array.from(files).filter(isImageFile);
  if (!arr.length) return;

  toast(`Loading ${arr.length} image${arr.length > 1 ? 's' : ''}…`, 'info');
  let done = 0;

  for (const file of arr) {
    try {
      const blob = await decodeFile(file);
      const dims = await getImageDimensions(blob);
      const url  = URL.createObjectURL(blob);

      const frame = {
        id:          nextId('frame'),
        name:        stripExtension(file.name),
        originalSrc: url,
        src:         url,          // will be replaced after bg removal
        aspect:      dims.w / dims.h,
        pw:          dims.w,
        ph:          dims.h,
        processed:   false,
        relSize:     1,
      };

      state.frames.push(frame);
      refreshLibrary();

      // Kick off background removal asynchronously
      processFrame(frame);
    } catch (err) {
      console.error('Could not load', file.name, err);
      toast(`Could not load ${file.name}`, 'error');
    }

    done++;
    setProcessingProgress(done / arr.length);
  }

  setProcessingProgress(1);
  setTimeout(() => setProcessingProgress(0), 800);

  capture('photos_uploaded', { count: arr.length });
}

/**
 * Load a single group reference photo.
 */
export async function loadRefPhoto(file) {
  if (!isImageFile(file)) return;
  try {
    const blob = await decodeFile(file);
    const dims = await getImageDimensions(blob);
    const url  = URL.createObjectURL(blob);
    capture('reference_photo_uploaded');
    return { src: url, w: dims.w, h: dims.h };
  } catch (err) {
    console.error('Could not load reference photo', err);
    toast('Could not load reference photo', 'error');
    return null;
  }
}

/* ── Helpers ── */

function isImageFile(file) {
  if (file.type && file.type.startsWith('image/')) return true;
  // Fallback: check extension for HEIC which may have no/wrong MIME
  return /\.(heic|heif|jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name);
}

async function decodeFile(file) {
  const isHeicByExt = /\.(heic|heif)$/i.test(file.name) ||
                      file.type === 'image/heic' ||
                      file.type === 'image/heif';
  const isHeic = isHeicByExt || await isHeicByMagicBytes(file);

  if (isHeic) {
    if (window.heic2any) {
      try {
        const converted = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
        return Array.isArray(converted) ? converted[0] : converted;
      } catch (e) {
        console.warn('heic2any failed, trying native decode:', e);
        // Fall through — Safari natively supports HEIC; other browsers will error at createImageBitmap
      }
    }
    // Return raw file; createImageBitmap will attempt native decode
    return file;
  }

  return file;
}

async function isHeicByMagicBytes(file) {
  try {
    const buf = await file.slice(0, 12).arrayBuffer();
    const b   = new Uint8Array(buf);
    // HEIC/HEIF files have 'ftyp' box at byte offset 4–7
    if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
      const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
      return /heic|heix|hevc|hevx|mif1|msf1|avif/i.test(brand);
    }
  } catch {}
  return false;
}

async function getImageDimensions(blobOrUrl) {
  // Prefer createImageBitmap for Blob/File — avoids blob-URL loading issues
  // in deployed environments where img.src=blobUrl can be blocked.
  if (blobOrUrl instanceof Blob) {
    const bitmap = await createImageBitmap(blobOrUrl);
    const result = { w: bitmap.width, h: bitmap.height };
    bitmap.close();
    return result;
  }
  // URL fallback
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = blobOrUrl;
  });
}

function stripExtension(name) {
  return name.replace(/\.[^.]+$/, '');
}

async function processFrame(frame) {
  try {
    const processedUrl = await removeBackground(frame.originalSrc);
    frame.src       = processedUrl;
    frame.processed = true;
    refreshLibrary();
    const { refreshWallFramesForFid } = await import('./wall.js');
    refreshWallFramesForFid(frame.id);
  } catch (err) {
    // bg removal failed — keep original, mark as processed to stop spinner
    frame.processed = true;
    refreshLibrary();
    console.warn('Background removal failed for', frame.name, err);
  }
}

/* ── Setup drag-and-drop on upload zones ── */
export function setupUploadZone(zoneEl, onFiles) {
  zoneEl.addEventListener('dragover', e => {
    e.preventDefault();
    zoneEl.classList.add('dragging');
  });
  zoneEl.addEventListener('dragleave', e => {
    if (!zoneEl.contains(e.relatedTarget)) {
      zoneEl.classList.remove('dragging');
    }
  });
  zoneEl.addEventListener('drop', e => {
    e.preventDefault();
    zoneEl.classList.remove('dragging');
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  });
}
