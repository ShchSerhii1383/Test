/**
 * SequenceGenerator
 * -----------------
 * Pure logic, no DOM, no scene knowledge: given a length and a cell
 * count, produces a random order with no repeats. Kept as its own tiny
 * module rather than inlined in MountainScene so the "how a sequence is
 * built" rule lives in exactly one place and is trivial to test or
 * tweak (e.g. allowing repeats on the hardest rounds) without touching
 * anything about rendering or input.
 */
export class SequenceGenerator {
  /**
   * @param {number} length - how many taps the sequence should contain
   * @param {number} cellCount - how many distinct cells are available (9 for a 3x3 board)
   * @returns {number[]} a fresh random order, no repeats
   */
  static generate(length, cellCount) {
    const all = Array.from({ length: cellCount }, (_, i) => i);
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(length, cellCount));
  }
}
