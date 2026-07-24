/**
 * config.js
 * ---------
 * Switches that change how the game behaves. Anything a person might want
 * to flip without reading the code belongs here.
 */

export const CONFIG = {
  /**
   * Start every page load with a clean island.
   *
   * This is a gift, not a save-file game: whoever opens the link should get
   * the whole arrival — the sunrise, Mickey, the registration — and be able
   * to replay any adventure. Keeping progress would mean the second person
   * to pick up the phone finds it already finished.
   *
   * Set to false if you'd rather progress carried over between visits.
   */
  RESET_PROGRESS_ON_LOAD: true,
};
