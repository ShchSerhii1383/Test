/**
 * atlasArt
 * --------
 * Small SVG-snippet building blocks used to compose the Explorer's Atlas
 * puzzle illustrations (js/data/atlasPuzzles.js). Kept as plain string
 * generators, same pattern as components/icons.js, so every puzzle's
 * picture is built from a few consistent, simple shapes rather than 20
 * one-off bespoke drawings — the whole point is that a puzzle's answer
 * should be readable straight off the image, and simple schematic shapes
 * (dots, labels, a compass rose, a river line) read faster than an
 * attempt at a detailed realistic map ever would.
 */

/** A labeled dot — the basic unit of every route/sequence diagram. */
export function dot(x, y, label, opts = {}) {
  const { filled = true, dashed = false } = opts;
  const fill = filled ? 'var(--color-sun)' : 'none';
  return `
    <circle cx="${x}" cy="${y}" r="7" fill="${fill}" stroke="#8A5A3B" stroke-width="2" ${dashed ? 'stroke-dasharray="3 2"' : ''} />
    <text x="${x}" y="${y - 12}" text-anchor="middle" font-size="11" font-family="var(--font-display)" fill="#4A3218">${label}</text>
  `;
}

/** A dashed connector between two dots, with an arrowhead showing direction. */
export function connector(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#B0894C" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#atlas-arrow)" />`;
}

/** Shared <defs> for the arrowhead marker — include once per illustration. */
export function arrowDefs() {
  return `
    <defs>
      <marker id="atlas-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10Z" fill="#B0894C" />
      </marker>
    </defs>
  `;
}

/** A small flag on a pole, tilted if `wrong` (upside down) for the error-finding puzzles. */
export function flag(x, y, color, wrong = false) {
  const flagShape = wrong
    ? `<path d="M${x} ${y}L${x + 18} ${y}L${x + 9} ${y + 10}Z" fill="${color}" />` // upside-down triangle pennant
    : `<path d="M${x} ${y}L${x + 18} ${y + 5}L${x} ${y + 10}Z" fill="${color}" />`;
  return `<line x1="${x}" y1="${y - 2}" x2="${x}" y2="${y + 26}" stroke="#8A5A3B" stroke-width="2" />${flagShape}`;
}

/** A simple country blob, optionally labeled. */
export function blob(x, y, w, h, label, fill = '#B8D9C7') {
  return `
    <ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${fill}" stroke="#6E9A80" stroke-width="1.5" opacity="0.85" />
    ${label ? `<text x="${x}" y="${y + h + 14}" text-anchor="middle" font-size="10" fill="#4A3218">${label}</text>` : ''}
  `;
}

/** A compass rose; needleAngle in degrees, 0 = pointing up (correctly north). */
export function compassRose(x, y, r, needleAngle = 0) {
  return `
    <circle cx="${x}" cy="${y}" r="${r}" fill="#EBD5A6" stroke="#8A5A3B" stroke-width="2" />
    <text x="${x}" y="${y - r - 4}" text-anchor="middle" font-size="9" fill="#4A3218">N</text>
    <text x="${x}" y="${y + r + 12}" text-anchor="middle" font-size="9" fill="#4A3218">S</text>
    <text x="${x - r - 8}" y="${y + 3}" text-anchor="middle" font-size="9" fill="#4A3218">W</text>
    <text x="${x + r + 8}" y="${y + 3}" text-anchor="middle" font-size="9" fill="#4A3218">E</text>
    <g transform="rotate(${needleAngle} ${x} ${y})">
      <path d="M${x} ${y - r + 4}L${x - 4} ${y}L${x} ${y + r - 4}L${x + 4} ${y}Z" fill="#E8734A" />
    </g>
  `;
}

/** A little mountain range cluster, one peak optionally marked as the odd one via a different fill. */
export function mountains(x, y, peakColors) {
  return peakColors
    .map((color, i) => `<path d="M${x + i * 22} ${y + 20}L${x + i * 22 + 11} ${y}L${x + i * 22 + 22} ${y + 20}Z" fill="${color}" stroke="#6E665B" stroke-width="1.5" />`)
    .join('');
}

/** A wavy river line with direction arrows; reversed=true flips the arrow direction. */
export function river(x, y, length, reversed = false) {
  const path = `M${x} ${y} Q ${x + length * 0.25} ${y - 10} ${x + length * 0.5} ${y} T ${x + length} ${y}`;
  const markerId = reversed ? 'atlas-arrow-rev' : 'atlas-arrow';
  return `
    ${reversed ? `<defs><marker id="atlas-arrow-rev" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M10 0L0 5L10 10Z" fill="#4FAFC4" /></marker></defs>` : ''}
    <path d="${path}" fill="none" stroke="#4FAFC4" stroke-width="3" marker-end="url(#${markerId})" />
  `;
}

/** Wraps any inner markup in a standard illustration frame. */
export function frame(innerSvg, viewBox = '0 0 220 200') {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" class="atlas-illustration">${innerSvg}</svg>`;
}
