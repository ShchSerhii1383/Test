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
    title: 'Книга загадок',

    story: [
      'Дивись, що я знайшов — стародавню книгу загадок!',
      'Кажуть, той, хто розгадає всі п\'ять, отримає останній ключ.',
    ],

    rulesLine: 'Обери правильну відповідь на кожній сторінці.',
    missLine: 'Не та відповідь — спробуй ще раз.',
    pageWinLines: ['Правильно!', 'Так, саме так!', 'Сторінка гортається...', 'Ще одна розгадана!'],
    winLine: 'Останній ключ у нас!',

    // Five riddles, easiest first. Each has exactly one correct option;
    // order of the three options is shuffled at render time.
    riddles: [
      {
        question: 'Я завжди показую шлях, але сам нікуди не йду. Що я?',
        options: [
          { icon: 'compassBody', label: 'Компас', correct: true },
          { icon: 'coconut', label: 'Кокос' },
          { icon: 'fishItem', label: 'Риба' },
        ],
      },
      {
        question: 'Мене можна знайти на пляжі, але я не камінь. Хто я?',
        options: [
          { icon: 'shell', label: 'Мушля', correct: true },
          { icon: 'palmIcon', label: 'Пальма' },
          { icon: 'anchorIcon', label: 'Якір' },
        ],
      },
      {
        question: 'Я росту високо, даю тінь і кокоси, але не вмію ходити. Що я?',
        options: [
          { icon: 'lanternItem', label: 'Ліхтар' },
          { icon: 'palmIcon', label: 'Пальма', correct: true },
          { icon: 'scroll', label: 'Сувій' },
        ],
      },
      {
        question: 'Я тримаюсь на дні моря, щоб корабель не поплив геть. Хто я?',
        options: [
          { icon: 'anchorIcon', label: 'Якір', correct: true },
          { icon: 'emerald', label: 'Смарагд' },
          { icon: 'banana', label: 'Банан' },
        ],
      },
      {
        question: 'Я світлю вночі, а вдень мовчу і чекаю темряви. Що я?',
        options: [
          { icon: 'scroll', label: 'Сувій' },
          { icon: 'banana', label: 'Банан' },
          { icon: 'lanternItem', label: 'Ліхтар', correct: true },
        ],
      },
    ],
  },
};
