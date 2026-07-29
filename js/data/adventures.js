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

    /**
     * Everything that can wash up on this beach. Rounds no longer name
     * their own targets: they say how many to find, and the scene draws
     * that many at random from here, never reusing one already found in
     * an earlier round. Two playthroughs are therefore never the same
     * hunt — and the coconut can't turn up twice the way it used to.
     */
    findableItems: [
      { id: 'coconut', icon: 'coconut', label: 'Кокос' },
      { id: 'shell', icon: 'shell', label: 'Мушля' },
      { id: 'map', icon: 'miniMap', label: 'Карта' },
      { id: 'crab', icon: 'crabIcon', label: 'Краб' },
      { id: 'anchor', icon: 'anchorIcon', label: 'Якір' },
      { id: 'compass', icon: 'compassBody', label: 'Компас' },
      { id: 'fish', icon: 'fishItem', label: 'Рибка' },
      { id: 'feather', icon: 'featherIcon', label: 'Перо' },
      { id: 'scroll', icon: 'scroll', label: 'Сувій' },
      { id: 'crystal', icon: 'emerald', label: 'Кристал' },
      { id: 'golden-key', icon: 'goldenKey', label: 'Золотий ключ' },
      { id: 'starfish', icon: 'starfish', label: 'Морська зірка' },
      { id: 'bottle', icon: 'bottle', label: 'Пляшка' },
      { id: 'lantern', icon: 'lanternItem', label: 'Ліхтар' },
      { id: 'turtle', icon: 'turtle', label: 'Черепаха' },
      { id: 'pineapple', icon: 'pineapple', label: 'Ананас' },
      { id: 'mango', icon: 'mango', label: 'Манго' },
      { id: 'banana', icon: 'banana', label: 'Банан' },
      { id: 'hat', icon: 'hat', label: 'Капелюх' },
      { id: 'oar', icon: 'oar', label: 'Весло' },
      { id: 'rope', icon: 'rope', label: 'Мотузка' },
      { id: 'plank', icon: 'plank', label: 'Дошка' },
      { id: 'pebble', icon: 'pebble', label: 'Камінець' },
      { id: 'life-ring', icon: 'lifeRingMini', label: 'Рятівне коло' },
    ],

    // Decorative clutter the targets hide among — same pool every round.
    clutterTypes: ['shell', 'starfish', 'bottle', 'rope', 'oar', 'pebble', 'lifeRingMini', 'plank'],

    // Three rounds: more to find each time, and more clutter to hide it in.
    rounds: [
      { targetCount: 3, clutterCount: 16 },
      { targetCount: 4, clutterCount: 20 },
      { targetCount: 5, clutterCount: 24 },
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
      '"Лише той, хто уважно читає, зможе знайти останній ключ."',
      'На кожній сторінці — запис дослідника й питання до нього.',
    ],

    // The old line told the player to study a drawing. There is no
    // drawing in this scene and never was one: each page is a written
    // note plus a question with four answers. Sending someone looking
    // for a picture that doesn't exist is worse than saying nothing.
    rulesLine: 'Прочитай запис у журналі й обери одну з чотирьох відповідей.',
    winLine: 'Останній ключ у нас!',
  },
};
