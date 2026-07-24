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
  'Тут заховано три пригоди.',
  'У кожній чекає сюрприз.',
  'Але спочатку — станьте командою дослідників!',
];

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

/* ---- Album & Finale ---- */

export const ALBUM_INTRO = 'Ось твоя пригода на Secret Island';

export const SECRET_BONUS = {
  icon: 'turtle',
  title: 'Черепаха-мандрівниця',
  message: 'Ти знайшла секрет! Вона давно чекала саме на тебе.',
};

export const FINALE_WISH = {
  title: 'Дорога подруго!',
  message: 'Ти пройшла весь острів разом з Mickey. Хай кожен день буде таким же теплим, як цей захід сонця. З любов\'ю, твоя команда Secret Island',
};
