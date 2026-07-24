/**
 * typewriter.js
 * -------------
 * Types text into an element one character at a time.
 *
 * Used for Mickey's opening lines: seeing the words appear makes it feel
 * like someone is talking to you, where a block of text that just pops in
 * feels like a webpage.
 */

/**
 * @param {HTMLElement} el - element whose textContent gets typed into
 * @param {string} text
 * @param {number} charDelayMs - pause between characters
 * @returns {Promise<void>} resolves when the whole string is on screen
 */
export function typeText(el, text, charDelayMs = 45) {
  el.textContent = '';

  return new Promise((resolve) => {
    let index = 0;

    const timer = setInterval(() => {
      el.textContent += text[index];
      index += 1;

      if (index >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, charDelayMs);
  });
}

/** Simple promise-based pause, so sequences can read top-to-bottom. */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
