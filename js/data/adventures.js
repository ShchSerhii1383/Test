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
    title: 'Mountain of Crystals',

    story: [
      'Перед нами стародавній кам\'яний механізм.',
      'Кажуть, що він реагує лише на тих, хто здатний запам\'ятати шлях світла.',
      'Дивіться уважно — гора сама покаже правильний порядок.',
    ],

    rulesLine: 'Запам\'ятай порядок, у якому світяться кристали — і повтори точно той самий порядок.',

    hintLine: 'Здається, наступний крок ще чекає на дотик.',
    hintDelayMs: 11000,
    missLine: 'Не той — дивись послідовність ще раз.',
    roundWinLines: ['Так тримати!', 'Правильно!', 'Ще один крок...', 'Майже готово!'],
    winLine: 'Гора прокинулась!',

    // Every round uses the same 3x3 stone plate — the scale never
    // changes between rounds, only the sequence length. No sequence is
    // ever pre-made: a fresh random order (no repeats) is drawn each
    // time a round starts, and again each time the player gets it wrong
    // and the round restarts.
    rounds: [
      { grid: 3, sequenceLength: 3 },
      { grid: 3, sequenceLength: 5 },
      { grid: 3, sequenceLength: 7 },
    ],
  },
  bazaar: {
    title: 'Атлас Мандрівників',

    story: [
      'Дивись, що я знайшов — стародавній Атлас Мандрівників!',
      '"Лише той, хто уважно дивиться на світ, зможе знайти останній ключ."',
      'Спробуємо пройти п\'ять випробувань?',
    ],

    rulesLine: 'Уважно роздивись малюнок — відповідь завжди на ньому.',
    winLine: 'Останній ключ у нас!',
  },
};
