/**
 * adventures.js
 * -------------
 * Config for each adventure/mini-game. A mini-game's *rules* live in code
 * (systems/ or the scene itself), but anything a designer might want to
 * tweak without touching JS — counts, timing, text — lives here.
 */

export const ADVENTURE_CONFIG = {
  lagoon: {
    title: 'Лагуна',
    intro: 'Десь тут заховано скарб. Знайди його!',
    // Number of spots to show; exactly one is the real treasure.
    spotCount: 6,
    // Short encouraging lines shown if the player taps a wrong spot.
    missLines: ['Тепліше!', 'Майже!', 'Не тут!', 'Спробуй ще!'],
    winLine: 'Знайшла!',
  },
  mountain: {
    title: 'Гора',
    intro: 'Запам\'ятай стежку, якою йде Mickey!',
    // Number of stones in the path the player must repeat, in order.
    stoneCount: 4,
    // How many stones light up in the sequence to remember.
    sequenceLength: 3,
    missLine: 'Ой, спробуй ще раз!',
    winLine: 'Дійшли!',
  },
  bazaar: {
    title: 'Базар',
    intro: 'Знайди найвигіднішу знижку!',
    // Each stall shows an item with an original and a discounted price.
    // Exactly one has the biggest discount — that's the correct tap.
    stalls: [
      { icon: 'mango', name: 'Манго', original: 40, discounted: 32 },
      { icon: 'pineapple', name: 'Ананас', original: 60, discounted: 54 },
      { icon: 'shell', name: 'Мушля', original: 25, discounted: 10 },
      { icon: 'hat', name: 'Капелюх', original: 50, discounted: 45 },
    ],
    missLine: 'Це не найвигідніше!',
    winLine: 'Оце вигода!',
  },
};
