/* ============================================================
   TOUR STEPS — edit this file to customise the onboarding tour
   Each step targets an element by CSS selector.
   ============================================================ */

export const TOUR_STEPS = [
  {
    id: 'wall',
    target: '#wall',
    title: 'This is your wall.',
    content: 'Your space to play, test, and arrange. Drag, drop, resize — find your flow.',
    position: 'top',
  },
  {
    id: 'color',
    target: '.wall-theme-list',
    title: 'Make it yours.',
    content: 'Pick a wall color, or use the eyedropper to match your real wall exactly.',
    position: 'bottom',
  },
  {
    id: 'upload',
    target: '#uploadZone',
    title: 'Bring in your pieces.',
    content: 'Upload art, posters, photos — we\'ll remove the background automatically. Tweak and refine anytime.',
    position: 'right',
  },
  {
    id: 'reference',
    target: '#refUploadZone',
    title: 'Add a reference (optional).',
    content: 'Upload a photo of your real wall or frames side-by-side. Fit it to the wall to get proportions just right.',
    position: 'right',
  },
  {
    id: 'layouts',
    target: '.sidebar__tab[data-target="tabLayouts"]',
    title: 'Set the vibe.',
    content: 'Try curated gallery layouts and watch your wall come together instantly.',
    position: 'right',
  },
  {
    id: 'refine',
    target: '#rpanel',
    title: 'Refine the details.',
    content: 'Adjust frame style, color, mat thickness, rotation, and image crop until everything feels right.',
    position: 'left',
    final: true,
  },
];
