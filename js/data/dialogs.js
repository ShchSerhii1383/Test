/**
 * dialogs.js
 * ----------
 * All narrative text lives here, so it can be reworded without touching
 * any logic. Mickey's lines stay short on purpose — he's a friend who
 * says a few warm words, not a narrator.
 */

/* ---- Opening sequence ---- */

/** Shown one after another while the world fades in. Not a progress bar. */
export const LOADING_CAPTIONS = [
  'Готуємо острів...',
  'Прикрашаємо пляж...',
  'Шукаємо Mickey...',
  'Ховаємо сюрпризи...',
  'Все готово!',
];

/** Typed out one line at a time, with a pause between each. */
export const INTRO_GREETING = [
  'Ой! Гості!',
  'Я вас чекав!',
  'Ласкаво просимо на Secret Island!',
];

export const INTRO_EXPLANATION = [
  'Мені казали, що цей острів приховує стародавню таємницю.',
  'Три знаки розкидані по трьох місцях — і лише разом вони вкажуть шлях.',
  'Але спочатку — станьте командою дослідників!',
];

/**
 * The thread that ties the three adventures together. Each one yields a
 * symbol; the final constellation is what they were pointing at all
 * along. Keyed by adventure id so the Reward scene can look one up
 * without knowing anything about the story.
 */
export const ANCIENT_SYMBOLS = {
  lagoon: {
    name: 'Знак Води',
    line: 'Перший знак! Хвиля... вона вказує кудись угору.',
    // A wave glyph
    path: 'M4 15 Q9 9 14 15 T24 15',
  },
  mountain: {
    name: 'Знак Каменю',
    line: 'Другий знак! Гора — і над нею та сама крапка.',
    // A peak glyph
    path: 'M4 20 L14 6 L24 20 M11 14 L17 14',
  },
  bazaar: {
    name: 'Знак Пам\'яті',
    line: 'Третій знак! Тепер їх усі видно... вони складаються в одне.',
    // An open-book glyph
    path: 'M14 8 Q9 5 4 7 L4 19 Q9 17 14 20 Q19 17 24 19 L24 7 Q19 5 14 8 M14 8 L14 20',
  },
};

export const REGISTRATION = {
  title: 'Реєстрація дослідників',
  placeholder: 'Назва вашої команди...',
  button: 'Почати пригоду',
  stamp: 'ЗАТВЕРДЖЕНО',
  registered: 'Команду зареєстровано',
};

/** Mickey reads the team name back, so it feels like he actually saw it. */
export const TEAM_NAME_REACTIONS = [
  'Звучить чудово!',
  'Яка гарна назва!',
  'Мені подобається!',
  'Оце команда!',
];

export const INTRO_FINISH = 'Ось ваші пригоди!';

/**
 * Mickey's reactive lines. These fire repeatedly across one playthrough
 * — the cheer three times, the locked/completed nudges however often a
 * curious player taps around — so each is a set to pick from rather
 * than one string. Hearing the exact same words the third time is what
 * makes a character read as a script instead of a companion.
 */
export const MICKEY_CHEERS = [
  'Молодці!',
  'Оце так робота!',
  'Я знав, що вам вдасться!',
  'Чудово впоралися!',
];

export const MICKEY_LOCKED_HINTS = [
  'Спочатку інші пригоди!',
  'Ще не час — попереду інший шлях.',
  'Ця зачекає. Почнімо з іншої!',
];

export const MICKEY_DONE_HINTS = [
  'Цю пригоду вже пройдено!',
  'Тут ми вже все знайшли.',
  'Цю скриню ми вже відкрили — гляньмо далі!',
];

/** Picks one at random. Kept here so every caller varies the same way. */
export function pickLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

/* ---- Album & Finale ---- */

/**
 * The closing journal page. Kept here with the rest of the copy so the
 * wording can be changed without touching the scene's logic — this is
 * the most personal text in the whole game, and the most likely to be
 * rewritten for whoever it's being given to.
 */
export const JOURNEY_COMPLETE = {
  title: 'SECRET ISLAND',
  subtitle: 'Подорож завершено',
  tagline: 'Кожна велика пригода стає теплим спогадом.',
  letter: [
    'Дякую, що стала частиною цієї подорожі.',
    'Кожен острів ховає свої секрети, але найбільшим скарбом завжди були спогади, які ми створюємо разом.',
    'Хай кожна нова дорога дарує тобі усмішки, відкриття й незабутні пригоди.',
    'До зустрічі в наступній подорожі.',
  ],
  buttonLabel: 'Наша подорож триває →',
};

/** The little scene after everything has faded — the last line of all. */
export const AFTER_CREDITS_LINE = 'Кожна подорож закінчується... але кожен спогад стає початком нової.';

export const SECRET_BONUS = {
  icon: 'turtle',
  title: 'Черепаха-мандрівниця',
  message: 'Ти знайшла секрет! Вона давно чекала саме на тебе.',
};

