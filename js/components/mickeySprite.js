/**
 * mickeySprite.js
 * ---------------
 * Mickey's artwork, in ONE place. He appears on the island, in the intro and
 * in the finale, so the drawing lives here rather than being copy-pasted.
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
 *
 * He's an original explorer character, not a version of anyone else's mouse.
 *
 * Named parts used by components.css:
 *   .mickey__arm--left / --right    wave, point, scratch, walk swing
 *   .mickey__leg--left / --right    walk cycle
 *   .mickey__eyes                   blinking
 *   .mickey__head                   tilt when thinking
 *   .mickey__ear                    perk up on surprise
 *   .mickey__tail                   idle sway
 */

const OUTLINE = '#5A3A22';
const FUR = '#C9985F';
const FUR_DARK = '#B8894F';
const SKIN = '#F6C9A0';

export const MICKEY_SVG = `
<svg class="mickey__svg" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g stroke="${OUTLINE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">

    <!-- tail, behind everything -->
    <path class="mickey__tail" d="M 68 104 Q 88 106, 85 90 Q 83 82, 76 85" fill="none" stroke-width="4.5" />

    <!-- ears, above the hat so the silhouette stays readable -->
    <circle class="mickey__ear mickey__ear--left"  cx="21" cy="20" r="14" fill="${FUR}" />
    <circle class="mickey__ear mickey__ear--right" cx="79" cy="20" r="14" fill="${FUR}" />
    <circle cx="21" cy="21" r="7.5" fill="#F0B49A" stroke-width="1.8" />
    <circle cx="79" cy="21" r="7.5" fill="#F0B49A" stroke-width="1.8" />

    <!-- legs: separate groups so they can swing when he walks -->
    <g class="mickey__leg mickey__leg--left">
      <rect x="33" y="106" width="11" height="16" rx="5.5" fill="${FUR}" />
      <ellipse cx="37" cy="126" rx="12" ry="7" fill="#8A5A3B" />
    </g>
    <g class="mickey__leg mickey__leg--right">
      <rect x="56" y="106" width="11" height="16" rx="5.5" fill="${FUR}" />
      <ellipse cx="63" cy="126" rx="12" ry="7" fill="#8A5A3B" />
    </g>

    <!-- shorts -->
    <path d="M 30 96 L 70 96 L 68 112 L 55 112 L 50 103 L 45 112 L 32 112 Z" fill="#3A8067" />

    <!-- shirt -->
    <path class="mickey__body-shape"
          d="M 50 70 C 68 70, 74 80, 74 90 C 74 99, 66 102, 50 102 C 34 102, 26 99, 26 90 C 26 80, 32 70, 50 70 Z"
          fill="#FFF8ED" />
    <path d="M 41 71 Q 50 79, 59 71 L 59 77 Q 50 85, 41 77 Z" fill="#6FD0D6" stroke-width="1.8" />

    <!-- strap across the chest, with the compass hanging off it -->
    <path d="M 37 74 Q 46 88, 56 94" fill="none" stroke="#8A5A3B" stroke-width="3.2" />
    <circle cx="57" cy="94" r="6.5" fill="#FFB25E" stroke-width="2" />
    <circle cx="57" cy="94" r="3.2" fill="#FFF8ED" stroke="none" />
    <path d="M 57 91.5 L 58.4 94.2 L 57 96.5 L 55.6 94.2 Z" fill="#E8734A" stroke="none" />

    <!-- arms -->
    <g class="mickey__arm mickey__arm--left">
      <rect x="18" y="76" width="12" height="24" rx="6" fill="${FUR}" transform="rotate(-14 24 76)" />
      <circle cx="19" cy="99" r="7" fill="${SKIN}" />
    </g>
    <g class="mickey__arm mickey__arm--right">
      <rect x="70" y="76" width="12" height="24" rx="6" fill="${FUR}" transform="rotate(14 76 76)" />
      <circle cx="81" cy="99" r="7" fill="${SKIN}" />
    </g>

    <!-- head -->
    <g class="mickey__head">
      <circle cx="50" cy="48" r="32" fill="${FUR}" />

      <!-- muzzle -->
      <ellipse cx="50" cy="61" rx="17" ry="11.5" fill="${SKIN}" />
      <ellipse cx="50" cy="53" rx="5.5" ry="4.2" fill="#4A2E1A" stroke="none" />
      <path class="mickey__smile" d="M 41 63 Q 50 71, 59 63" fill="none" stroke-width="2.6" />

      <!-- eyes -->
      <g class="mickey__eyes">
        <circle cx="38" cy="43" r="6.5" fill="#3A2818" stroke="none" />
        <circle cx="62" cy="43" r="6.5" fill="#3A2818" stroke="none" />
        <circle cx="40.5" cy="40.5" r="2.2" fill="#FFFFFF" stroke="none" />
        <circle cx="64.5" cy="40.5" r="2.2" fill="#FFFFFF" stroke="none" />
      </g>

      <ellipse cx="25" cy="56" rx="6.5" ry="4.2" fill="#FF9F8A" opacity="0.55" stroke="none" />
      <ellipse cx="75" cy="56" rx="6.5" ry="4.2" fill="#FF9F8A" opacity="0.55" stroke="none" />

      <!-- straw hat: brim narrower than the head, so the ears stay visible -->
      <path d="M 27 30 Q 50 6, 73 30 Z" fill="#F2D79A" />
      <path d="M 28 29 Q 50 20, 72 29 L 72 33 Q 50 24, 28 33 Z" fill="#2FA0AE" stroke-width="1.6" />
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
