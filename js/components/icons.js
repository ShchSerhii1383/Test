/**
 * icons.js
 * --------
 * Hand-drawn icons for gifts, market goods and the secret bonus.
 *
 * These replace the emoji the game used to show. Emoji are drawn by whatever
 * device you're on, so they never match the island's artwork — the brief is
 * explicit that everything should look like one artist drew it. All of these
 * use the same flat shapes and the same palette as Mickey and the chest.
 *
 * Every icon is a 48x48 viewBox, so they're interchangeable anywhere.
 */

const ICONS = {
  /* ---- gifts ---- */

  coffee: `<path d="M10 18h22v14a8 8 0 01-8 8h-6a8 8 0 01-8-8z" fill="#FFF8ED" stroke="#8A5A3B" stroke-width="2.5"/>
    <path d="M32 22h4a5 5 0 010 10h-4" fill="none" stroke="#8A5A3B" stroke-width="2.5"/>
    <path d="M14 24h14v8a4 4 0 01-4 4h-6a4 4 0 01-4-4z" fill="#8A5A3B"/>
    <path d="M17 12c0-3 3-3 3-6M24 12c0-3 3-3 3-6" fill="none" stroke="#C09A5E" stroke-width="2.5" stroke-linecap="round"/>`,

  movie: `<rect x="7" y="18" width="34" height="22" rx="3" fill="#4A3F6B"/>
    <path d="M7 12l32-4 2 8-32 4z" fill="#6B5A94"/>
    <path d="M13 9l4 8M21 8l4 8M29 6l4 8" stroke="#FFF8ED" stroke-width="2.5"/>
    <circle cx="24" cy="29" r="6" fill="#FFB25E"/>`,

  dishes: `<ellipse cx="24" cy="28" rx="16" ry="11" fill="#FFF8ED" stroke="#6FD0D6" stroke-width="2.5"/>
    <ellipse cx="24" cy="27" rx="9" ry="6" fill="none" stroke="#6FD0D6" stroke-width="2"/>
    <path d="M36 10l1.6 4.4L42 16l-4.4 1.6L36 22l-1.6-4.4L30 16l4.4-1.6z" fill="#FFB25E"/>`,

  sleep: `<path d="M30 8a16 16 0 100 32 13 13 0 010-32z" fill="#FFE3B0" stroke="#E3A97E" stroke-width="2"/>
    <path d="M12 12h8l-8 8h8" fill="none" stroke="#6FD0D6" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M6 24h5l-5 5h5" fill="none" stroke="#6FD0D6" stroke-width="2" stroke-linecap="round"/>`,

  letter: `<rect x="7" y="13" width="34" height="24" rx="3" fill="#FFF8ED" stroke="#C09A5E" stroke-width="2.5"/>
    <path d="M7 15l17 13 17-13" fill="none" stroke="#C09A5E" stroke-width="2.5"/>
    <path d="M24 34c-5-4-8-6-8-9a4 4 0 018-1 4 4 0 018 1c0 3-3 5-8 9z" fill="#E8734A"/>`,

  walk: `<circle cx="34" cy="12" r="6" fill="#FFB25E"/>
    <path d="M4 40q10-10 20-4t20-8" fill="none" stroke="#E3C083" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="15" cy="32" rx="4" ry="5" fill="#8A5A3B" transform="rotate(-20 15 32)"/>
    <ellipse cx="25" cy="36" rx="4" ry="5" fill="#8A5A3B" transform="rotate(10 25 36)"/>`,

  dessert: `<path d="M10 22h28l-3 16a3 3 0 01-3 3H16a3 3 0 01-3-3z" fill="#FFE3B0" stroke="#C09A5E" stroke-width="2.5"/>
    <path d="M10 22c0-6 6-9 14-9s14 3 14 9z" fill="#FF9F8A"/>
    <circle cx="24" cy="9" r="3.5" fill="#E8734A"/>
    <path d="M13 30h22" stroke="#C09A5E" stroke-width="2"/>`,

  music: `<path d="M10 30V16a14 14 0 0128 0v14" fill="none" stroke="#4A3F6B" stroke-width="2.5"/>
    <rect x="5" y="27" width="10" height="15" rx="5" fill="#6FD0D6" stroke="#2FA0AE" stroke-width="2"/>
    <rect x="33" y="27" width="10" height="15" rx="5" fill="#6FD0D6" stroke="#2FA0AE" stroke-width="2"/>`,

  hug: `<path d="M17 38C9 31 4 27 4 21a7 7 0 0113-4 7 7 0 0113 4c0 6-5 10-13 17z" fill="#E8734A"/>
    <path d="M33 26c-5-4-8-7-8-11a5 5 0 018-3 5 5 0 018 3c0 4-3 7-8 11z" fill="#FF9F8A"/>`,

  /* ---- market goods ---- */

  mango: `<path d="M31 10c8 3 11 12 7 20s-14 12-20 8-6-15 0-22c4-5 9-7 13-6z" fill="#FFB25E" stroke="#E08A3C" stroke-width="2"/>
    <path d="M27 13c4-4 8-5 11-4-2 3-5 5-8 6z" fill="#3A8067"/>`,

  pineapple: `<ellipse cx="24" cy="30" rx="12" ry="14" fill="#FFC94D" stroke="#D9A02C" stroke-width="2"/>
    <path d="M16 22l16 16M32 22L16 38" stroke="#D9A02C" stroke-width="2"/>
    <path d="M24 16c-2-6-6-8-9-9 2 4 3 7 3 9zM24 16c2-6 6-8 9-9-2 4-3 7-3 9zM24 16c0-7 0-9-1-11 3 3 4 7 4 11z" fill="#3A8067"/>`,

  shell: `<path d="M24 8c11 0 18 12 18 21 0 7-8 11-18 11S6 36 6 29C6 20 13 8 24 8z" fill="#FFE3C7" stroke="#E3A97E" stroke-width="2.5"/>
    <path d="M24 11v28M16 14l2 25M32 14l-2 25M10 21l4 18M38 21l-4 18" stroke="#E3A97E" stroke-width="2"/>`,

  hat: `<ellipse cx="24" cy="32" rx="20" ry="7" fill="#E8C67A" stroke="#C9A24E" stroke-width="2"/>
    <path d="M11 31c0-11 6-19 13-19s13 8 13 19z" fill="#F2D79A" stroke="#C9A24E" stroke-width="2"/>
    <path d="M11 29q13 5 26 0v4q-13 5-26 0z" fill="#2FA0AE"/>`,

  /* ---- secret bonus ---- */

  turtle: `<ellipse cx="24" cy="26" rx="15" ry="12" fill="#3A8067" stroke="#245B4F" stroke-width="2.5"/>
    <path d="M24 14v24M11 22h26M12 31h24" stroke="#245B4F" stroke-width="2"/>
    <circle cx="40" cy="22" r="5.5" fill="#5FA383"/>
    <circle cx="42" cy="21" r="1.5" fill="#2A2A2A"/>
    <ellipse cx="13" cy="37" rx="5" ry="3" fill="#5FA383"/>
    <ellipse cx="34" cy="37" rx="5" ry="3" fill="#5FA383"/>`,

  /* ---- Lagoon: the three pieces the player is searching for ---- */

  compassNeedle: `<circle cx="24" cy="24" r="17" fill="#FFF8ED" stroke="#B8894F" stroke-width="2.5"/>
    <path d="M24 10L29 24L24 38L19 24Z" fill="#E8734A" stroke="#B0502A" stroke-width="2"/>
    <path d="M24 10L29 24L24 24Z" fill="#FFB25E"/>
    <circle cx="24" cy="24" r="3" fill="#B8894F"/>`,

  compassBody: `<circle cx="24" cy="24" r="18" fill="#D9A24B" stroke="#8A5A3B" stroke-width="2.5"/>
    <circle cx="24" cy="24" r="12" fill="#FFF8ED" stroke="#B8894F" stroke-width="2"/>
    <path d="M24 14v4M24 30v4M14 24h4M30 24h4" stroke="#8A5A3B" stroke-width="2" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="2.5" fill="#8A5A3B"/>`,

  goldenKey: `<circle cx="14" cy="16" r="8" fill="none" stroke="#FFD766" stroke-width="2.5"/>
    <path d="M20 22L38 40" stroke="#FFD766" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M31 33l5-5M35 37l5-5" stroke="#FFD766" stroke-width="2.5" stroke-linecap="round"/>`,

  /* ---- Lagoon: decorative clutter the search items hide among ---- */

  starfish: `<path d="M24 4l5 12 13 2-10 9 3 13-11-7-11 7 3-13-10-9 13-2z" fill="#FF9F6B" stroke="#D9743E" stroke-width="2"/>`,

  coconut: `<circle cx="24" cy="24" r="16" fill="#6B4429" stroke="#4A2E1A" stroke-width="2"/>
    <circle cx="24" cy="24" r="10" fill="#8A5A3B"/>
    <circle cx="19" cy="20" r="1.8" fill="#3A2818"/><circle cx="29" cy="19" r="1.8" fill="#3A2818"/><circle cx="24" cy="27" r="1.8" fill="#3A2818"/>`,

  bottle: `<path d="M20 6h8v6l4 4v24a2 2 0 01-2 2H18a2 2 0 01-2-2V16l4-4z" fill="#8FD6C4" stroke="#4FA98F" stroke-width="2" opacity="0.85"/>
    <rect x="19" y="4" width="10" height="4" rx="1" fill="#4FA98F"/>
    <path d="M17 26h14" stroke="#EAF6EF" stroke-width="2" opacity="0.7"/>`,

  rope: `<path d="M8 24a16 8 0 1132 0 16 8 0 11-32 0z" fill="none" stroke="#D9A24B" stroke-width="2.5"/>
    <path d="M8 24a16 8 0 1132 0" fill="none" stroke="#B8894F" stroke-width="2" stroke-dasharray="3 3"/>`,

  oar: `<rect x="21" y="4" width="6" height="24" rx="3" fill="#B8894F"/>
    <ellipse cx="24" cy="36" rx="9" ry="14" fill="#C98A4B" stroke="#8A5A3B" stroke-width="2"/>`,

  pebble: `<ellipse cx="24" cy="27" rx="16" ry="11" fill="#9B9184" stroke="#6E665B" stroke-width="2"/>
    <ellipse cx="19" cy="23" rx="5" ry="3" fill="#B0A79A" opacity="0.7"/>`,

  lifeRingMini: `<circle cx="24" cy="24" r="16" fill="none" stroke="#FFF8ED" stroke-width="2.5"/>
    <circle cx="24" cy="24" r="16" fill="none" stroke="#E8734A" stroke-width="2.5" stroke-dasharray="12 12"/>`,

  miniMap: `<path d="M8 10l12-4 8 4 12-4v28l-12 4-8-4-12 4z" fill="#EBD5A6" stroke="#8A5A3B" stroke-width="2"/>
    <path d="M20 6v28M28 10v28" stroke="#8A5A3B" stroke-width="2" opacity="0.6"/>
    <path d="M14 20l6 4 8-6" stroke="#E8734A" stroke-width="2" fill="none" stroke-dasharray="2 2"/>`,

  plank: `<rect x="4" y="18" width="40" height="10" rx="2" fill="#C98A4B" stroke="#8A5A3B" stroke-width="2"/>
    <circle cx="10" cy="23" r="1.4" fill="#6B4429"/><circle cx="38" cy="23" r="1.4" fill="#6B4429"/>`,

  /* ---- Bazaar: more market goods for the memory game ---- */

  banana: `<path d="M14 8c-4 10-4 22 6 30 8-2 14-9 16-18-8 4-16 2-20-4-2-3-2-6-2-8z" fill="#FFD766" stroke="#D9A227" stroke-width="2"/>
    <path d="M14 8c2 0 3 1 3 3" fill="none" stroke="#8A5A3B" stroke-width="2" stroke-linecap="round"/>`,

  fishItem: `<ellipse cx="20" cy="24" rx="16" ry="10" fill="#6FD0D6" stroke="#2FA0AE" stroke-width="2"/>
    <path d="M34 24l10-7v14z" fill="#2FA0AE"/>
    <circle cx="12" cy="21" r="2" fill="#2A2A2A"/>
    <path d="M8 28q6 4 12 0" stroke="#2FA0AE" stroke-width="2" fill="none"/>`,

  emerald: `<path d="M24 6l14 9-5 15H15l-5-15z" fill="#5FA383" stroke="#2E6B58" stroke-width="2"/>
    <path d="M24 6l7 9-7 15-7-15z" fill="#7BC49A" opacity="0.8"/>`,

  lanternItem: `<path d="M15 12h18l-3 20H18z" fill="#FFE9A8" stroke="#B8894F" stroke-width="2" opacity="0.9"/>
    <path d="M12 12h24l-2-5H14z" fill="#8A5A3B"/>
    <rect x="21" y="34" width="6" height="6" fill="#8A5A3B"/>
    <circle cx="24" cy="4" r="2" fill="#8A5A3B"/>`,

  scroll: `<rect x="10" y="14" width="28" height="20" rx="2" fill="#EBD5A6" stroke="#8A5A3B" stroke-width="2"/>
    <rect x="6" y="12" width="6" height="24" rx="3" fill="#B8894F"/>
    <rect x="36" y="12" width="6" height="24" rx="3" fill="#B8894F"/>
    <path d="M15 20h18M15 26h14" stroke="#8A5A3B" stroke-width="2" opacity="0.6"/>`,

  /* ---- Lagoon: expedition collection items not already covered above ---- */

  crabIcon: `<ellipse cx="24" cy="26" rx="14" ry="9" fill="#E8734A" stroke="#C85A32" stroke-width="2"/>
    <circle cx="17" cy="18" r="4" fill="#E8734A" stroke="#C85A32" stroke-width="2"/><circle cx="17" cy="17" r="1.5" fill="#2A2A2A"/>
    <circle cx="31" cy="18" r="4" fill="#E8734A" stroke="#C85A32" stroke-width="2"/><circle cx="31" cy="17" r="1.5" fill="#2A2A2A"/>
    <path d="M8 22L2 16M10 28L2 28M40 22L46 16M38 28L46 28" stroke="#C85A32" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M14 33L10 38M18 34L16 39M30 34L32 39M34 33L38 38" stroke="#C85A32" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  featherIcon: `<path d="M36 6C20 10 10 24 8 40c10-2 16-8 20-16 3 6 2 12-2 16 10-2 16-12 16-24 0-4-2-8-6-10z" fill="#EAF6EF" stroke="#8A5A3B" stroke-width="2"/>
    <path d="M28 16q4 8 0 18M22 26q3 6 0 12" stroke="#B0A79A" stroke-width="2" fill="none"/>`,

  /* ---- Bazaar: riddle-answer icons not already covered above ---- */

  palmIcon: `<path d="M22 44V22" stroke="#8A5A3B" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M22 22Q10 16 4 22M22 22Q12 10 8 4M22 22Q34 16 40 22M22 22Q32 10 36 4M22 22Q22 8 18 2"
      fill="none" stroke="#3A8067" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="17" cy="26" r="3" fill="#6B4429"/><circle cx="25" cy="28" r="3" fill="#8A5A3B"/>`,

  anchorIcon: `<circle cx="24" cy="10" r="5" fill="none" stroke="#9B9184" stroke-width="2.5"/>
    <line x1="24" y1="14" x2="24" y2="38" stroke="#9B9184" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M8 26q16 14 32 0" fill="none" stroke="#9B9184" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="8" y1="18" x2="40" y2="18" stroke="#9B9184" stroke-width="2.5" stroke-linecap="round"/>`,
};

/**
 * Returns the SVG markup for an icon, ready to drop into innerHTML.
 * Falls back to an empty string for an unknown id rather than throwing —
 * a missing picture shouldn't take the gift moment down with it.
 * @param {string} id
 * @param {string} extraClass
 */
export function icon(id, extraClass = '') {
  const body = ICONS[id];
  if (!body) {
    console.warn(`icons: no icon called "${id}"`);
    return '';
  }
  // A single shared highlight, not a per-icon detail: a soft translucent
  // white ellipse in the same top-left spot on every icon, standing in
  // for one consistent light source across the whole set. This is what
  // turns a flat silhouette into something that reads as lightly
  // dimensional, without hand-tuning highlights on 105 separate shapes.
  const highlight = '<ellipse cx="16" cy="14" rx="9" ry="6" fill="#FFFFFF" opacity="0.28" />';
  return `<svg class="icon ${extraClass}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}${highlight}</svg>`;
}
