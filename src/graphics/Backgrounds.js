import { Graphics } from 'pixi.js';

/**
 * Procedural Cardboard and Craft Paper Backgrounds
 * Pure procedural vector rendering - zero external images!
 */
export class Backgrounds {
  /**
   * Draws realistic corrugated cardboard kraft paper.
   */
  static drawCardboard(g, width, height) {
    g.clear();
    // Base warm kraft brown
    g.rect(0, 0, width, height).fill(0xbf9561);

    // Subtle corrugation stripes (vertical bands)
    const stripeWidth = 32;
    for (let x = 0; x < width; x += stripeWidth) {
      // Alternating subtle highlights and shadows to give corrugated depth
      g.rect(x, 0, stripeWidth * 0.5, height)
        .fill({ color: 0xd6ae7b, alpha: 0.18 });
      g.rect(x + stripeWidth * 0.5, 0, stripeWidth * 0.5, height)
        .fill({ color: 0x9e7343, alpha: 0.15 });

      // Ridge groove line
      g.moveTo(x, 0)
        .lineTo(x, height)
        .stroke({ width: 1, color: 0x8a6236, alpha: 0.22 });
    }

    // Procedural organic speckles / paper pulp fibers (using deterministic pseudo-random)
    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const speckleCount = Math.min(200, Math.floor((width * height) / 3000));
    for (let i = 0; i < speckleCount; i++) {
      const sx = random() * width;
      const sy = random() * height;
      const size = 1 + random() * 2.5;
      const isDark = random() > 0.4;
      const col = isDark ? 0x6d4c26 : 0xf5deb3;
      const alpha = isDark ? 0.25 : 0.2;

      if (random() > 0.5) {
        // Little pulp fiber stroke
        const angle = random() * Math.PI;
        const len = 3 + random() * 6;
        g.moveTo(sx, sy)
          .lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len)
          .stroke({ width: 1, color: col, alpha });
      } else {
        // Micro dot
        g.circle(sx, sy, size).fill({ color: col, alpha });
      }
    }
  }

  /**
   * Draws rich slate blue craft/denim paper for the gameplay scene.
   */
  static drawBlueCraft(g, width, height) {
    g.clear();
    // Deep blue craft background
    g.rect(0, 0, width, height).fill(0x23374d);

    // Subtle paper grain stripes/texture
    const bandSize = 28;
    for (let y = 0; y < height; y += bandSize) {
      g.rect(0, y, width, bandSize * 0.5)
        .fill({ color: 0x2b425b, alpha: 0.22 });
    }

    // Paper fiber speckles
    let seed = 54321;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const count = Math.min(180, Math.floor((width * height) / 3500));
    for (let i = 0; i < count; i++) {
      const sx = random() * width;
      const sy = random() * height;
      const isLight = random() > 0.4;
      const col = isLight ? 0x64b5f6 : 0x102030;
      const alpha = isLight ? 0.15 : 0.3;

      if (random() > 0.5) {
        const angle = random() * Math.PI;
        const len = 4 + random() * 8;
        g.moveTo(sx, sy)
          .lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len)
          .stroke({ width: 1, color: col, alpha });
      } else {
        g.circle(sx, sy, 1.5).fill({ color: col, alpha });
      }
    }
  }

  /**
   * Draws a rich warm wooden desk surface for the storybook scene.
   */
  static drawWoodTable(g, width, height) {
    g.clear();
    // Warm rich mahogany/oak base
    g.rect(0, 0, width, height).fill(0x3e2723);

    // Horizontal wooden planks
    const plankHeight = Math.max(50, Math.floor(height / 10));
    const numPlanks = Math.ceil(height / plankHeight);

    const plankTones = [0x4e342e, 0x5d4037, 0x4a2e26, 0x553831];

    for (let i = 0; i < numPlanks; i++) {
      const y = i * plankHeight;
      const tone = plankTones[i % plankTones.length];

      // Plank body
      g.rect(0, y, width, plankHeight).fill(tone);

      // Top edge highlight
      g.rect(0, y, width, 2).fill({ color: 0x8d6e63, alpha: 0.25 });

      // Bottom edge groove shadow
      g.rect(0, y + plankHeight - 2, width, 2).fill({ color: 0x1b0000, alpha: 0.45 });

      // Wood grain lines
      for (let j = 1; j <= 3; j++) {
        const gy = y + (plankHeight / 4) * j;
        g.moveTo(0, gy)
          .bezierCurveTo(width * 0.3, gy + 3, width * 0.7, gy - 3, width, gy + 1)
          .stroke({ width: 1, color: 0x27120a, alpha: 0.25 });
      }
    }

    // Vignette / ambient desk shadow at perimeter
    const margin = 20;
    g.rect(0, 0, width, margin).fill({ color: 0x000000, alpha: 0.2 });
    g.rect(0, height - margin, width, margin).fill({ color: 0x000000, alpha: 0.3 });
  }
}
