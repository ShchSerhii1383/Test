/**
 * gifts.js
 * --------
 * The pool of possible gifts. RewardScene shows three of these face-down
 * and the player picks one. Keep the text short — it's a wink, not a novel.
 *
 * `icon` refers to a drawing in components/icons.js, so every gift matches
 * the island's artwork instead of relying on the device's emoji font.
 */

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
