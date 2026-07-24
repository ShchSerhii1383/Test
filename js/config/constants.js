/**
 * constants.js
 * Fixed values that never change at runtime (scene names, Mickey states).
 * Keeping these as constants avoids typo bugs from repeated string literals.
 */

export const SCENES = {
  ISLAND: 'island',
  LAGOON: 'lagoon',
  MOUNTAIN: 'mountain',
  BAZAAR: 'bazaar',
  REWARD: 'reward',
  ALBUM: 'album',
  FINALE: 'finale',
};

/**
 * Mickey's visual states. Each one maps to a `.mickey--<value>` class
 * handled in components.css. He's an explorer on foot — hence RUN, not FLY.
 */
export const MICKEY_STATES = {
  IDLE: 'idle',
  WAVE: 'wave',
  TALK: 'talk',
  THINK: 'think',
  HAPPY: 'happy',
  RUN: 'run',
  POINT: 'point',
  SURPRISE: 'surprise',
  CELEBRATE: 'celebrate',
};

