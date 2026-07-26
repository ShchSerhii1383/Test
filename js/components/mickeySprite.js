/**
 * mickeySprite.js
 * ---------------
 * Mickey's artwork, in ONE place. He appears on the island, in the intro and
 * in the finale, so the drawing lives here rather than being copy-pasted.
 *
 * Redesigned as an original explorer mouse: bigger round ears of his own
 * shape (not a certain other mouse's silhouette), a scarf, a leather belt
 * with the compass hanging from it instead of a chest strap, a small
 * backpack with a map corner peeking out, cream gloves, brown boots — all
 * in the island's own warm palette (browns, terracotta, gold) rather than
 * the cooler teal this started with, so he actually looks like he belongs
 * on this beach.
 *
 * Design notes, in case you're wondering why it's built this way:
 *
 * - Everything has a dark outline. Flat fills alone read as "some shapes";
 *   the outline is what makes it read as a drawn character.
 * - Big head, small body. Exaggerated proportions are what make him cute.
 * - The ears sit ABOVE the hat brim, so his silhouette is recognisable even
 *   as a small figure on a beach.
 * - Legs and arms are separate groups, so he can actually walk instead of
 *   sliding across the sand with stiff legs.
 * - The map and telescope are separate groups too, hidden until their own
 *   state asks for them — see MICKEY_STATES.READING / .TELESCOPE.
 *
 * He's an original explorer character, not a version of anyone else's mouse.
 *
 * Named parts used by components.css:
 *   .mickey__arm--left / --right    wave, point, scratch, walk swing, hold
 *   .mickey__leg--left / --right    walk cycle
 *   .mickey__eyes                   blinking
 *   .mickey__head                   tilt when thinking
 *   .mickey__ear                    perk up on surprise
 *   .mickey__tail                   idle sway
 *   .mickey__map                    shown only in the "reading" state
 *   .mickey__telescope              shown only in the "telescope" state
 */

const OUTLINE = '#5A3A22';
const FUR = '#C9985F';
const FUR_DARK = '#A8794A';
const SKIN = '#F6C9A0';

export const MICKEY_SVG = `
<svg class="mickey__svg" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g stroke="${OUTLINE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">

    <!-- tail, behind everything -->
    <path class="mickey__tail" d="M 68 104 Q 88 106, 85 90 Q 83 82, 76 85" fill="none" stroke-width="4.5" />

    <!-- the backpack, peeking out behind the shoulders, map corner and all -->
    <g class="mickey__backpack">
      <path d="M 30 74 Q 24 76, 25 90 Q 26 100, 34 100 L 34 78 Z" fill="#8A5A3B" />
      <path d="M 70 74 Q 76 76, 75 90 Q 74 100, 66 100 L 66 78 Z" fill="#8A5A3B" opacity="0.95" />
      <path d="M 27 78 L 25 68 L 33 72 Z" fill="#EBD5A6" stroke-width="1.6" /> <!-- map corner peeking out -->
    </g>

    <!-- ears, above the hat so the silhouette stays readable — his own
         rounded-teardrop shape, not a perfect circle -->
    <path class="mickey__ear mickey__ear--left"
          d="M 21 8 Q 6 10, 7 24 Q 8 35, 21 33 Q 32 31, 30 18 Q 29 9, 21 8 Z"
          fill="${FUR}" />
    <path class="mickey__ear mickey__ear--right"
          d="M 79 8 Q 94 10, 93 24 Q 92 35, 79 33 Q 68 31, 70 18 Q 71 9, 79 8 Z"
          fill="${FUR}" />
    <path d="M 21 15 Q 13 16, 14 24 Q 15 30, 21 29 Q 27 28, 26 20 Q 25 15, 21 15 Z" fill="#F0B49A" stroke-width="1.6" />
    <path d="M 79 15 Q 87 16, 86 24 Q 85 30, 79 29 Q 73 28, 74 20 Q 75 15, 79 15 Z" fill="#F0B49A" stroke-width="1.6" />

    <!-- legs: separate groups so they can swing when he walks -->
    <g class="mickey__leg mickey__leg--left">
      <rect x="33" y="106" width="11" height="16" rx="5.5" fill="${FUR}" />
      <ellipse cx="37" cy="127" rx="12.5" ry="7.5" fill="#6B4A2F" />
      <path d="M 27 124 Q 37 120, 47 124" fill="none" stroke="#4A3218" stroke-width="1.6" opacity="0.6" />
    </g>
    <g class="mickey__leg mickey__leg--right">
      <rect x="56" y="106" width="11" height="16" rx="5.5" fill="${FUR}" />
      <ellipse cx="63" cy="127" rx="12.5" ry="7.5" fill="#6B4A2F" />
      <path d="M 53 124 Q 63 120, 73 124" fill="none" stroke="#4A3218" stroke-width="1.6" opacity="0.6" />
    </g>

    <!-- explorer shorts, warm khaki instead of the old green -->
    <path d="M 30 96 L 70 96 L 68 112 L 55 112 L 50 103 L 45 112 L 32 112 Z" fill="#B89A6B" />

    <!-- vest/jacket -->
    <path class="mickey__body-shape"
          d="M 50 70 C 68 70, 74 80, 74 90 C 74 99, 66 102, 50 102 C 34 102, 26 99, 26 90 C 26 80, 32 70, 50 70 Z"
          fill="#8C7A4A" />
    <!-- cream undershirt peeking out at the collar -->
    <path d="M 41 71 Q 50 79, 59 71 L 59 77 Q 50 85, 41 77 Z" fill="#FFF4DE" stroke-width="1.8" />

    <!-- scarf, tied loosely at the neck -->
    <path d="M 38 73 Q 50 82, 62 73 L 60 78 Q 50 86, 40 78 Z" fill="#C9683F" stroke-width="1.8" />
    <path d="M 56 78 Q 60 88, 56 96 Q 53 90, 55 80 Z" fill="#C9683F" stroke-width="1.6" />

    <!-- leather belt, with the golden compass hanging from it -->
    <path d="M 27 92 L 73 92 L 73 96 L 27 96 Z" fill="#6B4A2F" stroke-width="1.6" />
    <rect x="47" y="91.5" width="6" height="5" rx="1" fill="#D9A24B" stroke-width="1.4" />
    <circle cx="57" cy="100" r="6.5" fill="#FFB25E" stroke-width="2" />
    <circle cx="57" cy="100" r="3.2" fill="#FFF8ED" stroke="none" />
    <path d="M 57 97.5 L 58.4 100.2 L 57 102.5 L 55.6 100.2 Z" fill="#E8734A" stroke="none" />

    <!-- arms, with cream explorer gloves on the hands -->
    <g class="mickey__arm mickey__arm--left">
      <rect x="18" y="76" width="12" height="24" rx="6" fill="${FUR}" transform="rotate(-14 24 76)" />
      <circle cx="19" cy="99" r="7.5" fill="#F7E6C4" stroke-width="2" />
    </g>
    <g class="mickey__arm mickey__arm--right">
      <rect x="70" y="76" width="12" height="24" rx="6" fill="${FUR}" transform="rotate(14 76 76)" />
      <circle cx="81" cy="99" r="7.5" fill="#F7E6C4" stroke-width="2" />
    </g>

    <!-- the map — held up with both hands, only visible in the "reading" state -->
    <g class="mickey__map">
      <rect x="30" y="60" width="40" height="28" rx="2" fill="#EBD5A6" stroke-width="2" transform="rotate(-2 50 74)" />
      <path d="M38 68 L46 78 M50 66 L58 82 M42 84 L54 70" fill="none" stroke="#B0894C" stroke-width="1.3" opacity="0.7" transform="rotate(-2 50 74)" />
    </g>

    <!-- the telescope — held up to one eye, only visible in the "telescope" state -->
    <g class="mickey__telescope">
      <rect x="58" y="30" width="26" height="8" rx="3" fill="#D9A24B" stroke-width="1.8" transform="rotate(-18 58 34)" />
      <rect x="80" y="27" width="8" height="8" rx="2" fill="#8A5A3B" stroke-width="1.6" transform="rotate(-18 58 34)" />
    </g>

    <!-- head -->
    <g class="mickey__head">
      <circle cx="50" cy="48" r="32" fill="${FUR}" />

      <!-- muzzle -->
      <ellipse cx="50" cy="61" rx="17" ry="11.5" fill="${SKIN}" />
      <ellipse cx="50" cy="54" rx="4.2" ry="3.4" fill="#4A2E1A" stroke="none" />
      <path class="mickey__smile" d="M 41 63 Q 50 71, 59 63" fill="none" stroke-width="2.6" />

      <!-- eyes: big and expressive -->
      <g class="mickey__eyes">
        <circle cx="38" cy="43" r="7" fill="#3A2818" stroke="none" />
        <circle cx="62" cy="43" r="7" fill="#3A2818" stroke="none" />
        <circle cx="40.8" cy="40.2" r="2.5" fill="#FFFFFF" stroke="none" />
        <circle cx="64.8" cy="40.2" r="2.5" fill="#FFFFFF" stroke="none" />
      </g>

      <ellipse cx="25" cy="56" rx="6.5" ry="4.2" fill="#FF9F8A" opacity="0.55" stroke="none" />
      <ellipse cx="75" cy="56" rx="6.5" ry="4.2" fill="#FF9F8A" opacity="0.55" stroke="none" />

      <!-- explorer hat: warm straw with a brown leather band, brim narrower
           than the head so the ears stay visible -->
      <path d="M 27 30 Q 50 6, 73 30 Z" fill="#F2D79A" />
      <path d="M 28 29 Q 50 20, 72 29 L 72 33 Q 50 24, 28 33 Z" fill="#8A5A3B" stroke-width="1.6" />
      <ellipse cx="50" cy="32" rx="27" ry="7" fill="#E8C67A" />
    </g>
  </g>
</svg>
`;

/**
 * Draw Mickey into every element matching the selector.
 * Call once at startup, before constructing the Mickey component.
 * @param {string} selector
 */
export function renderMickeyInto(selector = '.mickey') {
  document.querySelectorAll(selector).forEach((el) => {
    const shadow = el.querySelector('.mickey__shadow');
    el.innerHTML = MICKEY_SVG;
    if (shadow) el.prepend(shadow);
  });
}
