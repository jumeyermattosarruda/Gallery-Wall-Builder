/* ============================================================
   STATE — Single source of truth for app data
   ============================================================ */

export const state = {
  /* Uploaded frames (library) */
  frames: [],
  /*
    Frame object shape:
    {
      id: string,
      name: string,
      originalSrc: string,   // blob URL of raw upload
      src: string | null,    // blob URL of processed (bg-removed) image
      aspect: number,        // width / height
      pw: number,            // natural pixel width
      ph: number,            // natural pixel height
      processed: boolean,    // background removed?
      relSize: number,       // relative area weight from group photo (default 1)
    }
  */

  /* Items placed on the wall */
  wItems: [],
  /*
    WItem shape:
    {
      id: string,
      fid: string | null,   // frame id (null = placeholder slot)
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,         // frame border color
      border: number,        // frame border thickness (px)
      rot: number,           // rotation in degrees
      label: string,         // display label
    }
  */

  /* Selection */
  selId: null,

  /* Reference group photo */
  refPhoto: null,   // { src, w, h, canvas }
  refBoxes: [],     // [{x,y,w,h,fid}]  tagged regions

  /* ID counter */
  _idc: 0,

  /* Active layout id */
  activeLayoutId: null,

  /* Drag/resize state (ephemeral) */
  drag: null,
  resize: null,

  /* Undo history — array of wItems snapshots */
  history: [],

  /* Redo stack — array of wItems snapshots */
  future: [],

  /* Image drag within frame (ephemeral) */
  imgDrag: null,

  /* Wall CSS-transform scale factor (1 on desktop, <1 when wall is scaled to fit mobile viewport) */
  wallScale: 1,
};

export function nextId(prefix = 'id') {
  return `${prefix}_${++state._idc}_${Date.now()}`;
}

export function getFrame(fid) {
  return state.frames.find(f => f.id === fid) || null;
}

export function getWItem(wid) {
  return state.wItems.find(i => i.id === wid) || null;
}

export function getSelected() {
  return state.selId ? getWItem(state.selId) : null;
}
