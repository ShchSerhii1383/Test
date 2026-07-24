/**
 * Confetti.js
 * -----------
 * A small confetti burst, drawn on a canvas.
 *
 * The blueprint originally called for the canvas-confetti library, but it
 * had to come from a CDN — which meant the finale quietly lost its confetti
 * on a weak connection. This does the same job in a page of code the next
 * developer can actually read, and the game works with no network at all.
 *
 * Deliberately simple: rectangles with gravity, drift and spin. No physics
 * engine, no dependencies.
 */

const COLORS = ['#FFD9A0', '#FF9F6B', '#6FD0D6', '#FFF8ED', '#FFB25E', '#3A8067'];

export class Confetti {
  /** @param {HTMLCanvasElement} canvasEl */
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.pieces = [];
    this.isRunning = false;

    this._onResize = () => this._fitCanvas();
    window.addEventListener('resize', this._onResize);
  }

  /** Match the canvas to its display size, allowing for retina screens. */
  _fitCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2); // cap for weaker phones
    const { width, height } = this.canvas.getBoundingClientRect();

    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    this.viewWidth = width;
    this.viewHeight = height;
  }

  /**
   * Throw a burst of confetti.
   * @param {number} count - how many pieces
   * @param {number} originY - 0 is the top of the canvas, 1 the bottom
   */
  burst(count = 90, originY = 0.55) {
    this._fitCanvas();

    for (let i = 0; i < count; i++) {
      const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 1.6; // mostly upward
      const speed = 6 + Math.random() * 7;

      this.pieces.push({
        x: this.viewWidth * (0.5 + (Math.random() - 0.5) * 0.35),
        y: this.viewHeight * originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        width: 6 + Math.random() * 6,
        height: 8 + Math.random() * 8,
        spin: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(() => this._tick());
    }
  }

  _tick() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

    this.pieces.forEach((piece) => {
      piece.vy += 0.22;        // gravity
      piece.vx *= 0.99;        // air drag, so pieces fan out then settle
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.spin;

      // fade out once it's on its way down
      if (piece.vy > 0) piece.life -= 0.006;

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.globalAlpha = Math.max(piece.life, 0);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      ctx.restore();
    });

    // drop anything that's finished, so the loop can stop when it's empty
    this.pieces = this.pieces.filter(
      (piece) => piece.life > 0 && piece.y < this.viewHeight + 40
    );

    if (this.pieces.length > 0) {
      requestAnimationFrame(() => this._tick());
    } else {
      ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);
      this.isRunning = false;
    }
  }

  /** Stop and clean up — call if the scene is ever torn down. */
  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.pieces = [];
  }
}
