import { dot, connector, arrowDefs, flag, blob, compassRose, mountains, river, frame } from '../components/atlasArt.js';

/**
 * Explorer's Atlas — puzzle bank
 * ------------------------------
 * 20 puzzles across 5 categories; a playthrough draws 5 at random (see
 * BazaarScene.js), so no two runs play out quite the same way.
 *
 * Every puzzle's answer is meant to be readable straight off its own
 * illustration — a small compass/direction hint sits next to each text
 * option so the *pattern* (not a memorized fact) is what solves it. That
 * was the explicit design goal, so it's worth keeping in mind before
 * changing any of these: if an option ever requires knowing real-world
 * geography to choose correctly, the puzzle has drifted from the brief.
 */

const arrow = { N: '↑', S: '↓', E: '→', W: '←', NE: '↗', NW: '↖', SE: '↘', SW: '↙' };

/** Builds a "what comes next" route illustration: 3 dots trending one
 *  direction, a 4th marked with "?". */
function routeIllustration(cities, dir) {
  const positions = [
    { x: 30, y: 150 }, { x: 85, y: 110 }, { x: 140, y: 70 }, { x: 195, y: 30 },
  ];
  // Reorient the 4 fixed slots so the trend visually matches `dir`.
  const layouts = {
    E: positions,
    SE: [{ x: 30, y: 30 }, { x: 85, y: 70 }, { x: 140, y: 110 }, { x: 195, y: 150 }],
    S: [{ x: 105, y: 20 }, { x: 90, y: 75 }, { x: 110, y: 130 }, { x: 100, y: 180 }],
    NE: [{ x: 30, y: 170 }, { x: 85, y: 125 }, { x: 140, y: 80 }, { x: 195, y: 35 }],
  };
  const pos = layouts[dir] || layouts.E;
  const dots = cities.map((c, i) => dot(pos[i].x, pos[i].y, c)).join('');
  const lines = pos.slice(0, cities.length - 1).map((p, i) => connector(p.x, p.y, pos[i + 1].x, pos[i + 1].y)).join('');
  const hint = `<text x="18" y="18" font-size="16" fill="#B0894C">${arrow[dir]}</text>`;
  return frame(arrowDefs() + lines + dots + hint);
}

function routeOptions(correctLabel, correctDir, distractors) {
  return [
    { label: `${correctLabel} (${arrow[correctDir]})`, correct: true },
    ...distractors.map(([label, dir]) => ({ label: `${label} (${arrow[dir]})` })),
  ];
}

/** The five "find the error" scenes — one fixed illustration each, with
 *  the 4 category options shuffled at render time by BazaarScene. */
const errorScenes = {
  flag: frame(blob(60, 90, 40, 30, 'Норвінд', '#B8D9C7') + blob(150, 90, 40, 30, 'Судалія', '#D9C7B8') + flag(150, 55, '#E8734A', true)),
  compass: frame(compassRose(110, 100, 45, 180)),
  city: frame(blob(60, 100, 45, 32) + dot(50, 95, '') + dot(65, 105, '') + dot(58, 100, '') + dot(190, 30, '')),
  river: frame(mountains(20, 70, ['#9B9184', '#9B9184']) + river(30, 140, 160, true)),
  mountain: frame(mountains(20, 60, ['#8B929A', '#8B929A', '#8B929A']) + mountains(140, 90, ['#B08858']) ),
};

const errorOptionLabels = {
  flag: 'Прапор', compass: 'Компас', city: 'Місто', river: 'Річка', mountain: 'Гора',
};

function errorOptions(correctKey, distractorKeys) {
  return [
    { label: errorOptionLabels[correctKey], correct: true },
    ...distractorKeys.map((k) => ({ label: errorOptionLabels[k] })),
  ];
}

/** Odd-one-out: 4 blobs, one visually different from the shared pattern. */
function coastalIllustration() {
  const sea = `<path d="M0 180 Q 55 165 110 180 T 220 180 L220 200 L0 200Z" fill="var(--color-sea-light)" opacity="0.6" />`;
  return frame(
    sea +
    blob(30, 150, 22, 18, 'A') + blob(80, 155, 22, 18, 'B') +
    blob(150, 60, 22, 18, 'C') + blob(190, 150, 22, 18, 'D')
  );
}

function borderIllustration() {
  return frame(
    blob(50, 100, 26, 20, 'A') + blob(95, 100, 26, 20, 'B') + blob(140, 100, 26, 20, 'C') +
    blob(195, 40, 20, 16, 'D') +
    `<path d="M0 160 Q110 175 220 160 L220 200 L0 200Z" fill="var(--color-sea-light)" opacity="0.4" />`
  );
}

function symbolIllustration() {
  const pine = (x, y) => `<path d="M${x} ${y + 24}L${x - 10} ${y + 24}L${x} ${y}L${x + 10} ${y + 24}Z" fill="#3A8067" />`;
  const palm = (x, y) => `<path d="M${x} ${y + 24}V${y + 6}" stroke="#8A5A3B" stroke-width="3"/><path d="M${x} ${y + 6}Q${x - 14} ${y - 2} ${x - 18} ${y + 8}M${x} ${y + 6}Q${x + 14} ${y - 2} ${x + 18} ${y + 8}M${x} ${y + 6}Q${x} ${y - 10} ${x - 6} ${y - 14}" fill="none" stroke="#3A8067" stroke-width="3" stroke-linecap="round"/>`;
  return frame(pine(40, 70) + pine(90, 70) + pine(140, 70) + palm(190, 70) +
    `<text x="40" y="115" text-anchor="middle" font-size="9" fill="#4A3218">A</text>` +
    `<text x="90" y="115" text-anchor="middle" font-size="9" fill="#4A3218">B</text>` +
    `<text x="140" y="115" text-anchor="middle" font-size="9" fill="#4A3218">C</text>` +
    `<text x="190" y="115" text-anchor="middle" font-size="9" fill="#4A3218">D</text>`);
}

/** Matching: one labeled target blob with a small colored hint dot, and
 *  four candidate icons (rendered as the answer cards themselves). */
function targetIllustration(hintColor) {
  return frame(blob(110, 100, 55, 40, 'Мета', '#EBD5A6') +
    `<circle cx="130" cy="90" r="8" fill="${hintColor}" stroke="#8A5A3B" stroke-width="1.5" />`);
}

export const ATLAS_PUZZLES = [
  // ---- 1. Logical route (5) ----
  {
    id: 1, category: 'route',
    question: 'Париж → Брюссель → Амстердам → ?',
    illustration: routeIllustration(['Париж', 'Брюссель', 'Амстердам', '?'], 'NE'),
    options: routeOptions('Копенгаген', 'NE', [['Мадрид', 'SW'], ['Рим', 'SE'], ['Афіни', 'SE']]),
  },
  {
    id: 2, category: 'route',
    question: 'Прага → Відень → Будапешт → ?',
    illustration: routeIllustration(['Прага', 'Відень', 'Будапешт', '?'], 'SE'),
    options: routeOptions('Белград', 'SE', [['Берлін', 'N'], ['Осло', 'N'], ['Дублін', 'W']]),
  },
  {
    id: 3, category: 'route',
    question: 'Стокгольм → ? → Гельсінкі',
    illustration: routeIllustration(['Стокгольм', '?', 'Гельсінкі'], 'E'),
    options: routeOptions('Турку', 'E', [['Лісабон', 'W'], ['Валенсія', 'W'], ['Дублін', 'W']]),
  },
  {
    id: 4, category: 'route',
    question: 'Мадрид → Барселона → ?',
    illustration: routeIllustration(['Мадрид', 'Барселона', '?'], 'NE'),
    options: routeOptions('Марсель', 'NE', [['Лісабон', 'SW'], ['Севілья', 'SW'], ['Порту', 'NW']]),
  },
  {
    id: 5, category: 'route',
    question: 'Берлін → Варшава → ?',
    illustration: routeIllustration(['Берлін', 'Варшава', '?'], 'E'),
    options: routeOptions('Мінськ', 'E', [['Амстердам', 'W'], ['Брюссель', 'W'], ['Париж', 'W'] ]),
  },

  // ---- 2. Find the error (5) ----
  {
    id: 6, category: 'error',
    question: 'На карті одна деталь намальована неправильно. Яка саме?',
    illustration: errorScenes.flag,
    options: errorOptions('flag', ['river', 'mountain', 'compass']),
  },
  {
    id: 7, category: 'error',
    question: 'Щось на цій сторінці переплутано. Що саме?',
    illustration: errorScenes.compass,
    options: errorOptions('compass', ['flag', 'city', 'mountain']),
  },
  {
    id: 8, category: 'error',
    question: 'Один об\'єкт стоїть не на своєму місці. Який?',
    illustration: errorScenes.city,
    options: errorOptions('city', ['river', 'flag', 'compass']),
  },
  {
    id: 9, category: 'error',
    question: 'Одна річка тече в неправильному напрямку. Що не так?',
    illustration: errorScenes.river,
    options: errorOptions('river', ['mountain', 'flag', 'city']),
  },
  {
    id: 10, category: 'error',
    question: 'Одна гора опинилась не у своєму гірському масиві. Що переплутано?',
    illustration: errorScenes.mountain,
    options: errorOptions('mountain', ['compass', 'river', 'city']),
  },

  // ---- 3. Sequence (4) ----
  {
    id: 11, category: 'sequence',
    question: 'Розташуй країни із заходу на схід — що продовжить ряд?',
    illustration: routeIllustration(['A', 'B', 'C', '?'], 'E'),
    options: routeOptions('Далі на схід', 'E', [['Назад на захід', 'W'], ['На північ', 'N'], ['На південь', 'S']]),
  },
  {
    id: 12, category: 'sequence',
    question: 'Розташуй країни з півночі на південь — що продовжить ряд?',
    illustration: routeIllustration(['A', 'B', 'C', '?'], 'S'),
    options: routeOptions('Далі на південь', 'S', [['Назад на північ', 'N'], ['На схід', 'E'], ['На захід', 'W']]),
  },
  {
    id: 13, category: 'sequence',
    question: 'Побудуй маршрут найкоротшої подорожі — куди рухатись далі?',
    illustration: routeIllustration(['A', 'B', 'C', '?'], 'NE'),
    options: routeOptions('Продовжити по прямій', 'NE', [['Різкий поворот назад', 'SW'], ['На південь', 'S'], ['На захід', 'W']]),
  },
  {
    id: 14, category: 'sequence',
    question: 'Гори розташовані за висотою — яка наступна?',
    illustration: frame(mountains(20, 100, ['#9B9184']) + mountains(70, 80, ['#9B9184']) + mountains(120, 55, ['#9B9184'])),
    options: [
      { label: 'Ще вища', correct: true },
      { label: 'Найнижча з усіх' },
      { label: 'Такої ж висоти, як перша' },
      { label: 'Нижча за другу' },
    ],
  },

  // ---- 4. Odd one out (3) ----
  {
    id: 15, category: 'odd',
    question: 'Три країни виходять до моря. Одна — ні. Яка саме?',
    illustration: coastalIllustration(),
    options: [
      { label: 'A' }, { label: 'B' }, { label: 'C', correct: true }, { label: 'D' },
    ],
  },
  {
    id: 16, category: 'odd',
    question: 'Три країни межують одна з одною. Одна — острів. Яка саме?',
    illustration: borderIllustration(),
    options: [
      { label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D', correct: true },
    ],
  },
  {
    id: 17, category: 'odd',
    question: 'Три символи належать холодному північному краю. Один — ні. Який?',
    illustration: symbolIllustration(),
    options: [
      { label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D', correct: true },
    ],
  },

  // ---- 5. Matching (3) ----
  {
    id: 18, category: 'match',
    question: 'На меті позначено колір. Який силует їй відповідає?',
    illustration: targetIllustration('#3A8067'),
    options: [
      { label: 'Зелений силует', correct: true },
      { label: 'Синій силует' },
      { label: 'Жовтий силует' },
      { label: 'Червоний силует' },
    ],
  },
  {
    id: 19, category: 'match',
    question: 'На меті позначено колір гірського масиву. Який підходить?',
    illustration: targetIllustration('#8B929A'),
    options: [
      { label: 'Сірий масив', correct: true },
      { label: 'Золотий масив' },
      { label: 'Рожевий масив' },
      { label: 'Зелений масив' },
    ],
  },
  {
    id: 20, category: 'match',
    question: 'На меті позначено колір природної риси. Яка їй відповідає?',
    illustration: targetIllustration('#4FAFC4'),
    options: [
      { label: 'Річка', correct: true },
      { label: 'Пустеля' },
      { label: 'Ліс' },
      { label: 'Печера' },
    ],
  },
];
