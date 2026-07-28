/**
 * gifts.js
 * --------
 * The pool of possible gifts. RewardScene shows three of these face-down
 * and the player picks one. Keep the text short — it's a wink, not a novel.
 *
 * `icon` refers to a drawing in components/icons.js. It's still the
 * fallback whenever the Lottie animation can't load, so every gift keeps
 * artwork that matches the island.
 */

/**
 * The nine Lottie animations that play inside a card once it's flipped.
 * They are deliberately NOT hard-wired to a particular gift: the list is
 * shuffled once per page load and dealt out, so the same gift text can
 * arrive with a different animation on a different playthrough. That's
 * what keeps the reward from feeling like a fixed lookup table.
 *
 * To pin an animation to a specific gift instead, drop its filename into
 * that gift's `animation` field below and it will be used verbatim.
 */
export const GIFT_ANIMATIONS = [
  'Secret',
  'Fire_Opal',
  'Burger_Queen',
  'Justice',
  'Amethyst',
  'Ice_Queen',
  'Plushie',
  'Rebellion',
  'Miss_USA',
];

export const GIFTS = [
  { id: 'coffee', icon: 'coffee', title: 'Кава без черги', message: 'Хтось інший стоїть у черзі за тебе — сьогодні.' },
  { id: 'movie-night', icon: 'movie', title: 'Вечір кіно', message: 'Обираєш фільм ти. Без заперечень.' },
  { id: 'no-dishes', icon: 'dishes', title: 'Вихідний від посуду', message: 'Сьогодні миє хтось інший.' },
  { id: 'sleep-in', icon: 'sleep', title: 'Ранок без будильника', message: 'Спи, скільки хочеш.' },
  { id: 'compliment', icon: 'letter', title: 'Чесний комплімент', message: 'Хтось скаже тобі щось дуже приємне.' },
  { id: 'walk', icon: 'walk', title: 'Прогулянка вдвох', message: 'Просто прогулянка. Без поспіху.' },
  { id: 'dessert', icon: 'dessert', title: 'Десерт на вибір', message: 'Той самий, який давно хотілось.' },
  { id: 'playlist', icon: 'music', title: 'Плейлист під настрій', message: 'Хтось збере його спеціально для тебе.' },
  { id: 'hug', icon: 'hug', title: 'Обійми без причини', message: 'Іноді саме цього і бракує.' },
];
