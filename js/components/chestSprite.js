/**
 * chestSprite.js
 * --------------
 * Chest artwork, in ONE place — same idea as mickeySprite.js. Three themed
 * variants (one per adventure) share the same structural class names
 * (chest__body, chest__lid, chest__lock), so every existing CSS animation —
 * the invite breathing, the lid swinging open, the grow-out-of-the-sand
 * effect — keeps working untouched no matter which theme is drawn.
 *
 * The brief's own words: boxes shouldn't be buttons, they should be
 * artifacts you'd recognise without reading a label.
 *
 *   lagoon   — sea-blue wood, rope wrap, a shell and a starfish
 *   mountain — dark timber, iron bands, a moss patch, a crystal
 *   bazaar   — warm gold wood, gilded corners, coins, a ribbon bow
 *
 * Named parts used by components.css / scenes.css:
 *   .chest__lid    swings open
 *   .chest__lock   sits on the seam between lid and body
 */

const SHARED_STRUCTURE = (theme) => `
  <!-- contact shadow on the ground -->
  <ellipse cx="50" cy="86" rx="38" ry="5" fill="#00000022" />

  <!-- body -->
  <g class="chest__body">
    <rect x="7" y="46" width="86" height="36" rx="5" fill="${theme.wood}" stroke="${theme.woodDark}" stroke-width="3" />
    <line x1="9" y1="58" x2="91" y2="58" stroke="${theme.woodDark}" stroke-width="2" opacity="0.7" />
    <line x1="9" y1="70" x2="91" y2="70" stroke="${theme.woodDark}" stroke-width="2" opacity="0.7" />
    <rect x="22" y="46" width="8" height="36" fill="${theme.woodDark}" />
    <rect x="70" y="46" width="8" height="36" fill="${theme.woodDark}" />
    ${theme.bodyDecor}
  </g>

  <!-- lid: hinged at the back, swings up when the chest opens -->
  <g class="chest__lid">
    <path d="M 7 48 Q 7 16, 50 16 Q 93 16, 93 48 Z" fill="${theme.wood}" stroke="${theme.woodDark}" stroke-width="3" />
    <path d="M 12 44 Q 12 22, 50 22 Q 88 22, 88 44 Z" fill="${theme.woodLight}" opacity="0.5" />
    <rect x="22" y="20" width="8" height="28" fill="${theme.woodDark}" />
    <rect x="70" y="20" width="8" height="28" fill="${theme.woodDark}" />
    <rect x="5" y="44" width="90" height="7" rx="3" fill="${theme.woodDark}" />
    ${theme.lidDecor}
  </g>

  <!-- lock, straddling lid and body -->
  <g class="chest__lock">
    <rect x="42" y="42" width="16" height="18" rx="3" fill="${theme.lock}" stroke="${theme.lockDark}" stroke-width="2" />
    <circle cx="50" cy="49" r="3" fill="${theme.woodDark}" />
    <rect x="49" y="49" width="2" height="6" fill="${theme.woodDark}" />
  </g>
`;

const THEMES = {
  /** Lagoon: sea-blue wood, a rope wrapped around it, a shell and starfish resting on the lid. */
  lagoon: {
    wood: '#2FA0AE',
    woodLight: '#6FD0D6',
    woodDark: '#1D7885',
    lock: '#FFE9A8',
    lockDark: '#D9B77C',
    bodyDecor: `
      <path d="M 7 64 Q 50 70, 93 64" fill="none" stroke="#EAFBFA" stroke-width="2.5" opacity="0.8" />
      <path d="M 7 64 Q 50 58, 93 64" fill="none" stroke="#EAFBFA" stroke-width="2.5" opacity="0.5" />`,
    lidDecor: `
      <!-- shell -->
      <path d="M32 40c5 0 8-4 8-8s-3-8-8-8-8 4-8 8 3 8 8 8z" fill="#FFE3C7" stroke="#B8894F" stroke-width="1.2" />
      <path d="M32 25v14M28 27l1 12M36 27l-1 12" stroke="#B8894F" stroke-width="0.8" />
      <!-- starfish -->
      <path d="M66 24l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="#FF9F6B" stroke="#D9743E" stroke-width="1" />`,
  },

  /** Mountain: dark timber, riveted iron bands, moss, one embedded crystal. */
  mountain: {
    wood: '#6B5138',
    woodLight: '#8A6A4A',
    woodDark: '#4A3826',
    lock: '#B8BEC4',
    lockDark: '#8B929A',
    bodyDecor: `
      <rect x="7" y="60" width="86" height="6" fill="#8B929A" opacity="0.9" />
      <circle cx="16" cy="63" r="1.6" fill="#5A6167" /><circle cx="84" cy="63" r="1.6" fill="#5A6167" />
      <ellipse cx="20" cy="76" rx="9" ry="5" fill="#5E9B6E" opacity="0.85" />
      <ellipse cx="78" cy="72" rx="7" ry="4" fill="#5E9B6E" opacity="0.7" />`,
    lidDecor: `
      <rect x="7" y="30" width="86" height="6" fill="#8B929A" opacity="0.9" />
      <circle cx="16" cy="33" r="1.6" fill="#5A6167" /><circle cx="84" cy="33" r="1.6" fill="#5A6167" />
      <!-- crystal -->
      <path d="M64 24l5 4-2 8h-6l-2-8z" fill="#8FD6E8" stroke="#4FAFC4" stroke-width="1" opacity="0.9" />`,
  },

  /** Bazaar: warm gilded wood, gold corner brackets, a couple of coins, a ribbon bow. */
  bazaar: {
    wood: '#D9A24B',
    woodLight: '#F2C878',
    woodDark: '#A86A2F',
    lock: '#FFD766',
    lockDark: '#D9A227',
    bodyDecor: `
      <path d="M9 48 L9 60 L21 48 Z" fill="#FFD766" opacity="0.9" />
      <path d="M91 48 L91 60 L79 48 Z" fill="#FFD766" opacity="0.9" />
      <circle cx="18" cy="74" r="5" fill="#FFD766" stroke="#B8891F" stroke-width="1" />
      <circle cx="30" cy="76" r="4" fill="#FFD766" stroke="#B8891F" stroke-width="1" opacity="0.9" />`,
    lidDecor: `
      <path d="M9 18 L9 30 L21 18 Z" fill="#FFD766" opacity="0.9" />
      <path d="M91 18 L91 30 L79 18 Z" fill="#FFD766" opacity="0.9" />
      <!-- ribbon bow -->
      <path d="M60 26 Q50 20 50 28 Q50 20 40 26 L50 32 Z" fill="#E8734A" stroke="#B8502A" stroke-width="1" />`,
  },
};

/**
 * Build the SVG markup for a themed chest.
 * @param {'lagoon'|'mountain'|'bazaar'} themeName
 */
export function chestMarkup(themeName) {
  const theme = THEMES[themeName];
  if (!theme) {
    console.warn(`chestSprite: no theme called "${themeName}", falling back to lagoon`);
    return chestMarkup('lagoon');
  }

  return `
<svg class="chest__svg" viewBox="0 0 100 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  ${SHARED_STRUCTURE(theme)}
</svg>
`;
}

/** Draw a themed chest into one element. */
export function renderChest(el, themeName) {
  if (!el) return;
  el.innerHTML = chestMarkup(themeName);
}

/**
 * Draw the right themed chest into every island box, reading the theme
 * straight off each box's existing data-adventure attribute — the same
 * value LagoonScene/MountainScene/BazaarScene already use, so there's
 * nothing new to keep in sync.
 */
export function renderIslandChests() {
  document.querySelectorAll('.box').forEach((boxEl) => {
    renderChest(boxEl.querySelector('.box__art'), boxEl.dataset.adventure);
  });
}
