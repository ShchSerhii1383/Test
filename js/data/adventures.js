/**
 * adventures.js
 * -------------
 * Config for each adventure/mini-game. A mini-game's *rules* live in code
 * (systems/ or the scene itself), but anything a designer might want to
 * tweak without touching JS — counts, timing, text — lives here.
 */

export const ADVENTURE_CONFIG = {
  lagoon: {
    title: 'Колекція дослідника',

    story: [
      'Коли я вперше досліджував цей острів, я склав список найцінніших знахідок...',
      'Але сильний вітер розкидав їх по всій лагуні!',
      'Допоможіть мені знову зібрати колекцію.',
    ],

    rulesLine: 'Знаходь предмети з експедиційної дошки — решта просто прикраса.',

    // Two-stage hint: a spoken nudge first, then (if still stuck) a soft
    // shimmer on one of the still-missing items.
    hintLines: [
      'Мені здається, я бачив щось біля великого каменя.',
      'Подивись ближче до пальми.',
      'Здається, там щось виблискує в піску.',
    ],
    hintTalkDelayMs: 25000,
    hintShimmerDelayMs: 45000,

    roundWinLines: ['Чудовий початок!', 'Залишився останній список!'],
    winLine: 'Колекція зібрана!',

    // Decorative clutter the targets hide among — same pool for every round.
    clutterTypes: ['shell', 'starfish', 'bottle', 'rope', 'oar', 'pebble', 'lifeRingMini', 'plank'],

    // Three rounds, each pulling its own set of target items and adding
    // more decoy clutter, so the beach gets a little busier (and the
    // items sit a little closer together) each time.
    rounds: [
      {
        targets: [
          { id: 'coconut', icon: 'coconut', label: 'Кокос' },
          { id: 'shell-find', icon: 'shell', label: 'Мушля' },
          { id: 'map', icon: 'miniMap', label: 'Карта' },
        ],
        clutterCount: 16,
      },
      {
        targets: [
          { id: 'crab', icon: 'crabIcon', label: 'Краб' },
          { id: 'anchor', icon: 'anchorIcon', label: 'Якір' },
          { id: 'compass', icon: 'compassBody', label: 'Компас' },
          { id: 'coconut-2', icon: 'coconut', label: 'Кокос' },
        ],
        clutterCount: 20,
      },
      {
        targets: [
          { id: 'fish', icon: 'fishItem', label: 'Рибка' },
          { id: 'feather', icon: 'featherIcon', label: 'Перо' },
          { id: 'scroll', icon: 'scroll', label: 'Сувій' },
          { id: 'crystal', icon: 'emerald', label: 'Кристал' },
          { id: 'golden-key', icon: 'goldenKey', label: 'Золотий ключ' },
        ],
        clutterCount: 24,
      },
    ],
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
