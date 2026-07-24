/**
 * adventures.js
 * -------------
 * Config for each adventure/mini-game. A mini-game's *rules* live in code
 * (systems/ or the scene itself), but anything a designer might want to
 * tweak without touching JS — counts, timing, text — lives here.
 */

export const ADVENTURE_CONFIG = {
  lagoon: {
    title: 'Секретна лагуна',

    // Mickey's opening story, typed one line at a time before the game starts.
    story: [
      'Ми майже знайшли шлях до скарбів...',
      'Але хвиля розкидала деталі чарівного компаса по всій лагуні!',
      'Допоможіть мені зібрати його знову.',
    ],

    // Shown once, briefly, during the animated rules demo.
    rulesLine: 'Знаходь предмети, що світяться — решта просто прикраса.',

    // The three pieces the player must find among the clutter, in any order.
    // Each has its own icon (drawn in components/icons.js) and a label used
    // for the aria description only — nothing about them is shown as text
    // during play, so finding them is genuinely a search.
    targets: [
      { id: 'compass-needle', icon: 'compassNeedle', label: 'Стрілка компаса' },
      { id: 'compass-body', icon: 'compassBody', label: 'Корпус компаса' },
      { id: 'golden-key', icon: 'goldenKey', label: 'Золотий ключ' },
    ],

    // Decoy clutter: purely visual "noise" the targets hide among. Reusing
    // a modest set of types scattered many times (with random rotation/
    // scale) reads as "30-something items" without needing 30 unique
    // drawings — same trick real point-and-click games use.
    clutterTypes: ['shell', 'starfish', 'coconut', 'bottle', 'rope', 'oar', 'pebble', 'lifeRingMini', 'miniMap', 'plank'],
    clutterCount: 28,

    // Gentle nudges if the player hasn't found a target in a while —
    // never a penalty, just Mickey noticing something.
    hintLines: [
      'Мені здається, хвиля щось залишила біля каміння.',
      'Подивіться ближче до пальми.',
      'Здається, щось виблискує в піску.',
    ],
    hintDelayMs: 17000,

    winLine: 'Компас зібрано!',
  },
  mountain: {
    title: 'Гора кристалів',

    story: [
      'Колись ця гора світилася всю ніч...',
      'Але після бурі кристали переплуталися, і магія заснула.',
      'Спробуємо її розбудити?',
    ],

    rulesLine: 'Запам\'ятай, які кристали світяться — і торкнись саме їх.',

    hintLine: 'Здається, один кристал досі чекає на дотик.',
    hintDelayMs: 11000,
    missLine: 'Не той — спробуй ще.',
    roundWinLines: ['Так тримати!', 'Правильно!', 'Ще один крок...'],
    winLine: 'Гора прокинулась!',

    // Three rounds, each a bit bigger. `pattern` is fixed (a real shape,
    // used for round 3's "island symbol"); when `pattern` is omitted the
    // scene picks that many random cells itself.
    rounds: [
      { grid: 3, revealCount: 4 },
      { grid: 4, revealCount: 6 },
      { grid: 4, pattern: [1, 2, 5, 6, 8, 9, 10, 11] }, // a simple mountain-peak silhouette
    ],
  },
  bazaar: {
    title: 'Базар див',

    story: [
      'Цей торговець дуже любить загадки.',
      'Якщо впораємося з його випробуваннями — віддасть останній ключ.',
    ],

    rulesLine: 'Запам\'ятай, що засвітилося на прилавку — і знайди ті самі речі.',

    hintLine: 'Продавець підморгує — одна річ досі чекає.',
    hintDelayMs: 11000,
    missLine: 'Не той товар — придивись ще раз.',
    roundWinLines: ['Продавець посміхається!', 'Уважно!', 'Ще трохи...', 'Майже все розпізнали!'],
    winLine: 'Ключ у нас!',

    // All the goods that can appear on the counter — memorized targets and
    // decoys are drawn from the same pool, so nothing LOOKS more "special".
    goods: ['banana', 'coconut', 'compassBody', 'miniMap', 'fishItem', 'pineapple', 'shell', 'emerald', 'lanternItem', 'scroll'],

    // Five rounds: more items each time. Round 4 reshuffles positions right
    // after the memorize flash (same items, new spots — tests whether you
    // remembered the goods, not just where they sat). Round 5 adds a
    // gentle time hint via a visible little dial, no penalty if it runs out.
    rounds: [
      { itemCount: 10, targetCount: 3 },
      { itemCount: 12, targetCount: 4 },
      { itemCount: 14, targetCount: 5 },
      { itemCount: 14, targetCount: 5, reshuffleAfterMemorize: true },
      { itemCount: 16, targetCount: 5, reshuffleAfterMemorize: true, timedHint: true },
    ],
  },
};
