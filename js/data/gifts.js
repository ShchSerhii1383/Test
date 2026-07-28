/**
 * gifts.js
 * --------
 * The pool of possible gifts. RewardScene shows three of these face-down
 * and the player picks one.
 *
 * Each gift IS its animation now — the name comes from the Lottie file,
 * so the two can't drift apart. `animation` is therefore the source of
 * truth and every gift has exactly one, permanently.
 *
 * `icon` is the drawn fallback used whenever the animation can't load
 * (offline, blocked CDN), so a reward never arrives blank.
 *
 * `message` is intentionally still a placeholder — the real wording is
 * coming from the person this is a gift for.
 */

export const GIFTS = [
  { id: 'secret',       animation: 'Secret',       icon: 'letter',  title: 'Secret',       message: '' },
  { id: 'fire-opal',    animation: 'Fire_Opal',    icon: 'emerald', title: 'Fire Opal',    message: '' },
  { id: 'burger-queen', animation: 'Burger_Queen', icon: 'dessert', title: 'Burger Queen', message: '' },
  { id: 'justice',      animation: 'Justice',      icon: 'compassBody', title: 'Justice',      message: '' },
  { id: 'amethyst',     animation: 'Amethyst',     icon: 'emerald', title: 'Amethyst',     message: '' },
  { id: 'ice-queen',    animation: 'Ice_Queen',    icon: 'shell',   title: 'Ice Queen',    message: '' },
  { id: 'plushie',      animation: 'Plushie',      icon: 'hug',     title: 'Plushie',      message: '' },
  { id: 'rebellion',    animation: 'Rebellion',    icon: 'goldenKey', title: 'Rebellion',    message: '' },
  { id: 'miss-usa',     animation: 'Miss_USA',     icon: 'starfish', title: 'Miss USA',     message: '' },
];
