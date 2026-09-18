import { Container, Graphics, FillGradient, Text } from 'pixi.js';

/**
 * Procedural PaperCraft Vector Graphics Library
 * Generates torn-edge polygons, layered drop shadows, masking tape,
 * origami hearts, pushpins, speech bubbles, and textured kraft paper.
 */
export class PaperCraft {
  /**
   * Generates a randomized jagged edge between two points (p1 to p2).
   */
  static getJitteredSegment(x1, y1, x2, y2, jitter = 3, step = 10) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const numSteps = Math.max(2, Math.floor(dist / step));
    const ux = dx / dist;
    const uy = dy / dist;
    const nx = -uy; // normal vector
    const ny = ux;

    const points = [];
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      // Do not jitter the exact endpoints
      const j = (i === 0 || i === numSteps) ? 0 : (Math.random() - 0.5) * 2 * jitter;
      points.push(px + nx * j, py + ny * j);
    }
    return points;
  }

  /**
   * Generates a polygon with torn/scissor edges for a rectangle.
   */
  static getTornRectPolygon(width, height, jitter = 3, step = 10) {
    const w = width;
    const h = height;
    const halfW = w / 2;
    const halfH = h / 2;

    const top = this.getJitteredSegment(-halfW, -halfH, halfW, -halfH, jitter, step);
    const right = this.getJitteredSegment(halfW, -halfH, halfW, halfH, jitter, step);
    const bottom = this.getJitteredSegment(halfW, halfH, -halfW, halfH, jitter, step);
    const left = this.getJitteredSegment(-halfW, halfH, -halfW, -halfH, jitter, step);

    // Combine into continuous ring (ignoring redundant endpoints)
    const poly = [];
    const segments = [top, right, bottom, left];
    for (const seg of segments) {
      for (let i = 0; i < seg.length; i += 2) {
        poly.push(seg[i], seg[i + 1]);
      }
    }
    return poly;
  }

  /**
   * Creates a layered torn paper rectangle container with hard drop shadow.
   */
  static createTornRect(width, height, options = {}) {
    const {
      color = 0xffffff,
      alpha = 1,
      shadow = true,
      shadowOffset = { x: 5, y: 7 },
      shadowAlpha = 0.22,
      jitter = 3,
      step = 10,
      strokeColor = null,
      strokeWidth = 1,
      strokeAlpha = 0.2
    } = options;

    const container = new Container();
    const poly = this.getTornRectPolygon(width, height, jitter, step);

    if (shadow) {
      const shadowG = new Graphics();
      shadowG.poly(poly).fill({ color: 0x000000, alpha: shadowAlpha });
      shadowG.position.set(shadowOffset.x, shadowOffset.y);
      container.addChild(shadowG);
      container.shadowG = shadowG;
    }

    const paperG = new Graphics();
    paperG.poly(poly).fill({ color, alpha });
    if (strokeColor !== null) {
      paperG.stroke({ width: strokeWidth, color: strokeColor, alpha: strokeAlpha });
    }
    container.addChild(paperG);
    container.paperG = paperG;
    container.poly = poly;

    return container;
  }

  /**
   * Creates a pinking-shears zig-zag cut button (like the PLAY and LEVELS buttons).
   */
  static createZigZagRect(width, height, options = {}) {
    const {
      color = 0x4caf50,
      shadow = true,
      shadowOffset = { x: 5, y: 7 },
      shadowAlpha = 0.25,
      sawTooth = 8,
      sawDepth = 6,
      tape = true
    } = options;

    const container = new Container();
    const halfW = width / 2;
    const halfH = height / 2;

    const poly = [];

    // Top edge with zig-zags
    const topTeeth = Math.floor(width / sawTooth);
    for (let i = 0; i <= topTeeth; i++) {
      const x = -halfW + (width * (i / topTeeth));
      const y = -halfH + (i % 2 === 1 ? -sawDepth : 0);
      poly.push(x, y);
    }

    // Right edge
    poly.push(halfW, -halfH);
    poly.push(halfW, halfH);

    // Bottom edge with zig-zags (reverse order)
    for (let i = topTeeth; i >= 0; i--) {
      const x = -halfW + (width * (i / topTeeth));
      const y = halfH + (i % 2 === 1 ? sawDepth : 0);
      poly.push(x, y);
    }

    // Left edge
    poly.push(-halfW, halfH);
    poly.push(-halfW, -halfH);

    // Cardboard backing mount strip
    if (options.cardboardBacking) {
      const backW = width + 24;
      const backH = height + 16;
      const backContainer = this.createTornRect(backW, backH, {
        color: 0xb58b57,
        shadow: true,
        shadowOffset: { x: 4, y: 5 },
        shadowAlpha: 0.28,
        jitter: 2
      });
      container.addChild(backContainer);
    }

    // Shadow
    if (shadow) {
      const shadowG = new Graphics();
      shadowG.poly(poly).fill({ color: 0x000000, alpha: shadowAlpha });
      shadowG.position.set(shadowOffset.x, shadowOffset.y);
      container.addChild(shadowG);
    }

    // Main zig-zag paper
    const paperG = new Graphics();
    paperG.poly(poly).fill({ color });
    container.addChild(paperG);
    container.paperG = paperG;

    // Corner tape strips
    if (tape) {
      const tape1 = this.createTapeStrip(-halfW + 10, -halfH + 2, 45, 16, -0.6);
      const tape2 = this.createTapeStrip(halfW - 10, halfH - 2, 45, 16, -0.6);
      container.addChild(tape1, tape2);
    }

    return container;
  }

  /**
   * Creates a semi-transparent masking tape strip with ragged ripped ends.
   */
  static createTapeStrip(x, y, length = 60, width = 20, rotation = 0) {
    const container = new Container();
    container.position.set(x, y);
    container.rotation = rotation;

    const g = new Graphics();
    const halfL = length / 2;
    const halfW = width / 2;

    const poly = [];
    // Left ragged end
    const leftTeeth = 5;
    for (let i = 0; i <= leftTeeth; i++) {
      const py = -halfW + (width * (i / leftTeeth));
      const px = -halfL + (i % 2 === 1 ? -4 : 0);
      poly.push(px, py);
    }

    // Top straight edge with subtle jitter
    poly.push(-halfL, halfW);
    poly.push(halfL, halfW);

    // Right ragged end
    for (let i = leftTeeth; i >= 0; i--) {
      const py = -halfW + (width * (i / leftTeeth));
      const px = halfL + (i % 2 === 1 ? 4 : 0);
      poly.push(px, py);
    }

    // Bottom edge
    poly.push(halfL, -halfW);
    poly.push(-halfL, -halfW);

    // Drop shadow of tape
    const shadowG = new Graphics();
    shadowG.poly(poly).fill({ color: 0x000000, alpha: 0.12 });
    shadowG.position.set(2, 2);
    container.addChild(shadowG);

    // Translucent tape body (parchment white/cream)
    g.poly(poly).fill({ color: 0xfbf8ee, alpha: 0.68 });
    // Subtle tape gloss line
    g.moveTo(-halfL + 6, -halfW + 3)
      .lineTo(halfL - 6, -halfW + 3)
      .stroke({ width: 1.5, color: 0xffffff, alpha: 0.35 });

    container.addChild(g);
    return container;
  }

  /**
   * Creates an organic paper speech bubble / round bubble with drop shadow.
   */
  static createSpeechBubble(radiusX = 48, radiusY = 40, options = {}) {
    const {
      color = 0x64b5f6,
      shadowOffset = { x: 5, y: 7 },
      shadowAlpha = 0.25,
      hasTail = false,
      tailAngle = Math.PI * 0.75,
      roughness = 2
    } = options;

    const container = new Container();
    const points = [];
    const numPoints = 28;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const rJitter = (Math.random() - 0.5) * 2 * roughness;
      let rx = radiusX + rJitter;
      let ry = radiusY + rJitter;

      // Add speech bubble tail extension if requested
      if (hasTail && Math.abs(angle - tailAngle) < 0.25) {
        rx += 18;
        ry += 18;
      }

      points.push(Math.cos(angle) * rx, Math.sin(angle) * ry);
    }

    // Shadow
    const shadowG = new Graphics();
    shadowG.poly(points).fill({ color: 0x000000, alpha: shadowAlpha });
    shadowG.position.set(shadowOffset.x, shadowOffset.y);
    container.addChild(shadowG);

    // Main Bubble
    const bubbleG = new Graphics();
    bubbleG.poly(points).fill({ color });

    // Inner paper rim / highlight
    bubbleG.stroke({ width: 1.5, color: 0xffffff, alpha: 0.25 });

    container.addChild(bubbleG);
    container.bubbleG = bubbleG;
    container.radius = Math.max(radiusX, radiusY);

    return container;
  }

  /**
   * Creates an origami folded paper heart (with dual-tone red shading).
   */
  static createPaperHeart(size = 28, shadow = true) {
    const container = new Container();
    const half = size / 2;

    // Shadow
    if (shadow) {
      const shadowG = new Graphics();
      shadowG.moveTo(0, half * 0.9)
        .bezierCurveTo(-half * 1.3, -half * 0.3, -half * 1.1, -half * 1.3, 0, -half * 0.5)
        .bezierCurveTo(half * 1.1, -half * 1.3, half * 1.3, -half * 0.3, 0, half * 0.9)
        .closePath()
        .fill({ color: 0x000000, alpha: 0.22 });
      shadowG.position.set(3, 4);
      container.addChild(shadowG);
    }

    // Left half (lighter red origami fold)
    const leftHalf = new Graphics();
    leftHalf.moveTo(0, half * 0.9)
      .lineTo(-half * 0.9, -half * 0.2)
      .lineTo(-half * 0.7, -half * 0.9)
      .lineTo(-half * 0.2, -half * 0.8)
      .lineTo(0, -half * 0.4)
      .closePath()
      .fill({ color: 0xff3b52 });
    container.addChild(leftHalf);

    // Right half (slightly darker folded facet)
    const rightHalf = new Graphics();
    rightHalf.moveTo(0, half * 0.9)
      .lineTo(0, -half * 0.4)
      .lineTo(half * 0.2, -half * 0.8)
      .lineTo(half * 0.7, -half * 0.9)
      .lineTo(half * 0.9, -half * 0.2)
      .closePath()
      .fill({ color: 0xd31c38 });
    container.addChild(rightHalf);

    // Fold line
    const fold = new Graphics();
    fold.moveTo(0, -half * 0.4)
      .lineTo(0, half * 0.9)
      .stroke({ width: 1, color: 0x000000, alpha: 0.15 });
    container.addChild(fold);

    return container;
  }

  /**
   * Creates a 3D craft pushpin matching the Level Select screen reference.
   */
  static createPushPin(color = 0xfbc02d) {
    const container = new Container();

    // Pin shadow
    const shadow = new Graphics();
    shadow.ellipse(7, 10, 10, 5)
      .fill({ color: 0x000000, alpha: 0.3 });
    container.addChild(shadow);

    // Metal needle point
    const needle = new Graphics();
    needle.moveTo(0, 4)
      .lineTo(6, 15)
      .stroke({ width: 2.5, color: 0x616161, cap: 'round' });
    container.addChild(needle);

    // Plastic pin body (head)
    const head = new Graphics();
    // Base ring
    head.ellipse(0, 4, 8, 4).fill({ color });
    // Pin knob cylinder
    head.roundRect(-5, -6, 10, 9, 2).fill({ color });
    // Top spherical head
    head.circle(0, -7, 6).fill({ color });
    // Top highlight reflection
    head.circle(-2, -9, 2).fill({ color: 0xffffff, alpha: 0.6 });
    // Outline for paper/craft style
    head.circle(0, -7, 6).stroke({ width: 1.2, color: 0x000000, alpha: 0.2 });

    container.addChild(head);
    return container;
  }

  /**
   * Creates a cutout paper star.
   */
  static createPaperStar(size = 18, color = 0xffca28, shadow = true) {
    const container = new Container();
    const points = [];
    const spikes = 5;
    const outerR = size;
    const innerR = size * 0.45;

    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      points.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    if (shadow) {
      const shadowG = new Graphics();
      shadowG.poly(points).fill({ color: 0x000000, alpha: 0.25 });
      shadowG.position.set(3, 4);
      container.addChild(shadowG);
    }

    const starG = new Graphics();
    starG.poly(points).fill({ color });
    starG.poly(points).stroke({ width: 1, color: 0xe09b00, alpha: 0.5 });
    container.addChild(starG);

    return container;
  }

  /**
   * Creates a paper padlock for locked levels.
   */
  static createPadlock(size = 24) {
    const container = new Container();
    const g = new Graphics();
    const w = size;
    const h = size * 0.85;

    // Shackle (metal loop)
    g.roundRect(-w * 0.35, -h * 0.95, w * 0.7, h * 0.8, w * 0.35)
      .stroke({ width: 4.5, color: 0x424242 });

    // Lock Body
    g.roundRect(-w * 0.5, -h * 0.45, w, h, 4)
      .fill({ color: 0x424242 });

    // Keyhole
    g.circle(0, -h * 0.05, 2.5).fill({ color: 0x212121 });
    g.poly([-1.5, -h * 0.05, 1.5, -h * 0.05, 2, h * 0.2, -2, h * 0.2], true)
      .fill({ color: 0x212121 });

    container.addChild(g);
    return container;
  }

  /**
   * Creates the jagged comic pop banner for successful hits ("8+4=12 POP!").
   */
  static createPopBurst(size = 110) {
    const container = new Container();
    const spikes = 16;
    const pointsOuter = [];
    const pointsInner = [];

    // Outer orange starburst
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const r = i % 2 === 0 ? size : size * 0.55 + (Math.random() - 0.5) * 15;
      pointsOuter.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    // Inner yellow starburst
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2 + (Math.PI / spikes);
      const r = i % 2 === 0 ? size * 0.85 : size * 0.45;
      pointsInner.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    // Drop Shadow
    const shadowG = new Graphics();
    shadowG.poly(pointsOuter).fill({ color: 0x000000, alpha: 0.28 });
    shadowG.position.set(7, 9);
    container.addChild(shadowG);

    // Outer flame/orange burst
    const orangeG = new Graphics();
    orangeG.poly(pointsOuter).fill({ color: 0xff9800 });
    container.addChild(orangeG);

    // Inner bright yellow burst
    const yellowG = new Graphics();
    yellowG.poly(pointsInner).fill({ color: 0xffeb3b });
    container.addChild(yellowG);

    return container;
  }

  /**
   * Creates lined notepad paper matching the Settings screen reference.
   */
  static createLinedNotepad(width, height) {
    const container = new Container();
    const halfW = width / 2;
    const halfH = height / 2;

    // Shadow
    const shadow = new Graphics();
    shadow.rect(-halfW, -halfH, width, height)
      .fill({ color: 0x000000, alpha: 0.25 });
    shadow.position.set(6, 8);
    container.addChild(shadow);

    // Sheet body
    const paper = new Graphics();
    paper.rect(-halfW, -halfH, width, height)
      .fill({ color: 0xfffef8 });

    // Horizontal notebook lines
    const lineSpacing = 32;
    const startY = -halfH + 50;
    for (let y = startY; y < halfH - 20; y += lineSpacing) {
      paper.moveTo(-halfW + 16, y)
        .lineTo(halfW - 16, y)
        .stroke({ width: 1.2, color: 0x90a4ae, alpha: 0.45 });
    }

    container.addChild(paper);

    // Tape on all 4 corners
    const t1 = this.createTapeStrip(-halfW + 15, -halfH + 15, 60, 22, -Math.PI / 4);
    const t2 = this.createTapeStrip(halfW - 15, -halfH + 15, 60, 22, Math.PI / 4);
    const t3 = this.createTapeStrip(-halfW + 15, halfH - 15, 60, 22, Math.PI / 4);
    const t4 = this.createTapeStrip(halfW - 15, halfH - 15, 60, 22, -Math.PI / 4);
    container.addChild(t1, t2, t3, t4);

    return container;
  }

  /**
   * Creates a craft paper toggle switch (pill track + round knob).
   */
  static createPaperToggle(width = 110, height = 54, isOn = true) {
    const container = new Container();
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const halfW = width / 2;
    const halfH = height / 2;
    const r = halfH;

    // Track shadow
    const shadow = new Graphics();
    shadow.roundRect(-halfW, -halfH, width, height, r)
      .fill({ color: 0x000000, alpha: 0.2 });
    shadow.position.set(3, 4);
    container.addChild(shadow);

    // Track body (cardboard kraft brown)
    const track = new Graphics();
    track.roundRect(-halfW, -halfH, width, height, r)
      .fill({ color: 0xd7ccc8 })
      .stroke({ width: 2, color: 0x8d6e63, alpha: 0.5 });
    container.addChild(track);

    // Knob container
    const knob = new Container();
    const knobR = r - 4;
    const targetX = isOn ? (halfW - r) : (-halfW + r);
    knob.position.set(targetX, 0);

    // Knob shadow
    const knobShadow = new Graphics();
    knobShadow.circle(2, 3, knobR)
      .fill({ color: 0x000000, alpha: 0.25 });
    knob.addChild(knobShadow);

    // Knob body (colorful layered discs when on, grey when off)
    const knobG = new Graphics();
    if (isOn) {
      knobG.circle(0, 0, knobR).fill({ color: 0x81c784 }); // outer green
      knobG.circle(0, 0, knobR * 0.78).fill({ color: 0x4caf50 }); // inner green
      knobG.circle(-3, -3, knobR * 0.28).fill({ color: 0xffffff, alpha: 0.4 }); // highlight
    } else {
      knobG.circle(0, 0, knobR).fill({ color: 0xb0bec5 });
      knobG.circle(0, 0, knobR * 0.78).fill({ color: 0x90a4ae });
    }
    knob.addChild(knobG);
    container.addChild(knob);

    container.knob = knob;
    container.isOn = isOn;

    return container;
  }

  /**
   * Creates an open fairytale storybook with leather hardcover casing,
   * gold corner brackets, layered parchment pages, center spine gutter,
   * and a red satin ribbon bookmark.
   */
  static createStorybookBase(bookW, bookH) {
    const container = new Container();

    const halfW = bookW / 2;
    const halfH = bookH / 2;

    // 1. Deep tabletop drop shadow
    const bookShadow = new Graphics();
    bookShadow.roundRect(-halfW + 8, -halfH + 12, bookW, bookH, 18)
      .fill({ color: 0x000000, alpha: 0.38 });
    container.addChild(bookShadow);

    // 2. Leather Hardcover Casing (Rich vintage royal blue/burgundy leather)
    const coverG = new Graphics();
    coverG.roundRect(-halfW, -halfH, bookW, bookH, 16)
      .fill({ color: 0x24140e })
      .stroke({ width: 3, color: 0x120a07 });
    container.addChild(coverG);

    // 3. Ornate Brass / Gold Corner Brackets on 4 corners
    const cornerSize = Math.min(36, bookW * 0.08);
    const goldCorners = new Graphics();
    // Top-Left
    goldCorners.moveTo(-halfW, -halfH + cornerSize)
      .lineTo(-halfW + cornerSize, -halfH)
      .lineTo(-halfW, -halfH)
      .closePath()
      .fill({ color: 0xffb300 })
      .stroke({ width: 1.5, color: 0xff8f00 });
    // Top-Right
    goldCorners.moveTo(halfW, -halfH + cornerSize)
      .lineTo(halfW - cornerSize, -halfH)
      .lineTo(halfW, -halfH)
      .closePath()
      .fill({ color: 0xffb300 })
      .stroke({ width: 1.5, color: 0xff8f00 });
    // Bottom-Left
    goldCorners.moveTo(-halfW, halfH - cornerSize)
      .lineTo(-halfW + cornerSize, halfH)
      .lineTo(-halfW, halfH)
      .closePath()
      .fill({ color: 0xffb300 })
      .stroke({ width: 1.5, color: 0xff8f00 });
    // Bottom-Right
    goldCorners.moveTo(halfW, halfH - cornerSize)
      .lineTo(halfW - cornerSize, halfH)
      .lineTo(halfW, halfH)
      .closePath()
      .fill({ color: 0xffb300 })
      .stroke({ width: 1.5, color: 0xff8f00 });
    container.addChild(goldCorners);

    // 4. Stacked Paper Page Edges (rim showing book thickness)
    const rimMargin = 12;
    const pageW = bookW - rimMargin * 2;
    const pageH = bookH - rimMargin * 2;
    const pageHalfW = pageW / 2;
    const pageHalfH = pageH / 2;

    // Outer underlying page leaves (warm aged parchment stack)
    const pageStackG = new Graphics();
    // Underleaf 2
    pageStackG.roundRect(-pageHalfW - 3, -pageHalfH - 3, pageW + 6, pageH + 6, 12)
      .fill({ color: 0xe0d6bc });
    // Underleaf 1
    pageStackG.roundRect(-pageHalfW - 1, -pageHalfH - 1, pageW + 2, pageH + 2, 10)
      .fill({ color: 0xede4cd });
    container.addChild(pageStackG);

    // 5. Main Open Parchment Surface (Ivory cream)
    const parchmentG = new Graphics();
    parchmentG.roundRect(-pageHalfW, -pageHalfH, pageW, pageH, 10)
      .fill({ color: 0xfdfaf2 })
      .stroke({ width: 1.5, color: 0xd7ccc8, alpha: 0.6 });
    container.addChild(parchmentG);

    // 6. Center Spine Fold & Gutter Shadow
    const spineG = new Graphics();
    // Subtle center gutter shadow gradient approximation
    spineG.rect(-18, -pageHalfH, 36, pageH)
      .fill({ color: 0x5d4037, alpha: 0.08 });
    spineG.rect(-8, -pageHalfH, 16, pageH)
      .fill({ color: 0x4e342e, alpha: 0.14 });
    // Deep center crease line
    spineG.moveTo(0, -pageHalfH)
      .lineTo(0, pageHalfH)
      .stroke({ width: 2, color: 0x3e2723, alpha: 0.35 });
    // Stitching dots along crease
    for (let sy = -pageHalfH + 20; sy < pageHalfH - 15; sy += 25) {
      spineG.circle(0, sy, 1.5).fill({ color: 0x8d6e63, alpha: 0.8 });
    }
    container.addChild(spineG);

    // 7. Delicate Gold Foil Frame on both page halves
    const frameG = new Graphics();
    const leafW = pageHalfW - 20;
    const leafH = pageH - 24;
    // Left page frame
    frameG.roundRect(-pageHalfW + 10, -pageHalfH + 12, leafW, leafH, 8)
      .stroke({ width: 1, color: 0xd7ccc8, alpha: 0.4 });
    // Right page frame
    frameG.roundRect(10, -pageHalfH + 12, leafW, leafH, 8)
      .stroke({ width: 1, color: 0xd7ccc8, alpha: 0.4 });
    container.addChild(frameG);

    // 8. Red Satin Ribbon Bookmark hanging down center
    const ribbonG = new Graphics();
    const ribbonW = 20;
    const ribbonHalfW = ribbonW / 2;
    const ribbonTopY = -pageHalfH - 6;
    const ribbonBottomY = pageHalfH + 26;

    // Ribbon drop shadow
    ribbonG.moveTo(ribbonHalfW + 3, ribbonTopY)
      .lineTo(ribbonHalfW + 4, ribbonBottomY)
      .lineTo(4, ribbonBottomY - 10)
      .lineTo(-ribbonHalfW + 4, ribbonBottomY)
      .lineTo(-ribbonHalfW + 3, ribbonTopY)
      .closePath()
      .fill({ color: 0x000000, alpha: 0.25 });

    // Crimson ribbon body with notched banner tip
    ribbonG.moveTo(-ribbonHalfW, ribbonTopY)
      .lineTo(ribbonHalfW, ribbonTopY)
      .lineTo(ribbonHalfW, ribbonBottomY)
      .lineTo(0, ribbonBottomY - 12)
      .lineTo(-ribbonHalfW, ribbonBottomY)
      .closePath()
      .fill({ color: 0xd32f2f })
      .stroke({ width: 1, color: 0xb71c1c });

    // Gold trim on ribbon edges
    ribbonG.moveTo(-ribbonHalfW + 2, ribbonTopY)
      .lineTo(-ribbonHalfW + 2, ribbonBottomY - 2)
      .stroke({ width: 1, color: 0xffd54f, alpha: 0.7 });
    ribbonG.moveTo(ribbonHalfW - 2, ribbonTopY)
      .lineTo(ribbonHalfW - 2, ribbonBottomY - 2)
      .stroke({ width: 1, color: 0xffd54f, alpha: 0.7 });

    container.addChild(ribbonG);

    return container;
  }

  /**
   * Creates an origami pine tree with paper trunk and layered paper triangles.
   */
  static createOrigamiTree(x, y, scale = 1) {
    const container = new Container();
    container.position.set(x, y);
    container.scale.set(scale);

    // Drop shadow
    const shadow = new Graphics();
    shadow.ellipse(2, 22, 14, 6).fill({ color: 0x000000, alpha: 0.18 });
    container.addChild(shadow);

    // Kraft paper trunk
    const trunk = new Graphics();
    trunk.rect(-4, 6, 8, 16).fill({ color: 0x795548 })
      .stroke({ width: 1, color: 0x4e342e });
    container.addChild(trunk);

    // Layered foliage (bottom to top)
    const tiers = [
      { y: 10, w: 34, h: 20, colL: 0x388e3c, colR: 0x2e7d32 },
      { y: 0,  w: 28, h: 18, colL: 0x43a047, colR: 0x388e3c },
      { y: -10, w: 20, h: 16, colL: 0x4caf50, colR: 0x43a047 }
    ];

    tiers.forEach(t => {
      const g = new Graphics();
      // Left fold (sunlit)
      g.moveTo(0, t.y - t.h)
        .lineTo(-t.w / 2, t.y)
        .lineTo(0, t.y - 2)
        .closePath()
        .fill({ color: t.colL });
      // Right fold (shaded)
      g.moveTo(0, t.y - t.h)
        .lineTo(t.w / 2, t.y)
        .lineTo(0, t.y - 2)
        .closePath()
        .fill({ color: t.colR });
      // Clean paper outline
      g.moveTo(0, t.y - t.h)
        .lineTo(-t.w / 2, t.y)
        .lineTo(t.w / 2, t.y)
        .closePath()
        .stroke({ width: 1, color: 0x1b5e20, alpha: 0.4 });
      container.addChild(g);
    });

    return container;
  }

  /**
   * Creates a folded origami mountain peak with snowcap.
   */
  static createPaperMountain(x, y, width = 64, height = 48) {
    const container = new Container();
    container.position.set(x, y);

    const halfW = width / 2;

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(3, height / 2 + 3, halfW * 0.9, 7).fill({ color: 0x000000, alpha: 0.16 });
    container.addChild(shadow);

    const g = new Graphics();
    // Left lit face (light slate/periwinkle)
    g.moveTo(0, -height / 2)
      .lineTo(-halfW, height / 2)
      .lineTo(0, height / 2)
      .closePath()
      .fill({ color: 0x78909c });

    // Right shaded face (darker slate)
    g.moveTo(0, -height / 2)
      .lineTo(halfW, height / 2)
      .lineTo(0, height / 2)
      .closePath()
      .fill({ color: 0x546e7a });

    // Ridge line
    g.moveTo(0, -height / 2)
      .lineTo(0, height / 2)
      .stroke({ width: 1.5, color: 0x37474f, alpha: 0.5 });

    // Mountain perimeter stroke
    g.moveTo(0, -height / 2)
      .lineTo(-halfW, height / 2)
      .lineTo(halfW, height / 2)
      .closePath()
      .stroke({ width: 1, color: 0x37474f, alpha: 0.4 });
    container.addChild(g);

    // Snowcap on top
    const snow = new Graphics();
    const snowH = height * 0.38;
    const snowW = halfW * 0.38;
    // Left snow
    snow.moveTo(0, -height / 2)
      .lineTo(-snowW, -height / 2 + snowH)
      .lineTo(-snowW * 0.3, -height / 2 + snowH * 0.7)
      .lineTo(0, -height / 2 + snowH * 0.85)
      .closePath()
      .fill({ color: 0xffffff });
    // Right snow (slightly shaded)
    snow.moveTo(0, -height / 2)
      .lineTo(0, -height / 2 + snowH * 0.85)
      .lineTo(snowW * 0.4, -height / 2 + snowH * 0.7)
      .lineTo(snowW, -height / 2 + snowH)
      .closePath()
      .fill({ color: 0xeceff1 });
    container.addChild(snow);

    return container;
  }

  /**
   * Creates an adorable storybook castle turret with battlements and waving flag.
   */
  static createCastleTurret(x, y, scale = 1) {
    const container = new Container();
    container.position.set(x, y);
    container.scale.set(scale);

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(3, 30, 24, 8).fill({ color: 0x000000, alpha: 0.22 });
    container.addChild(shadow);

    const stoneG = new Graphics();
    // Tower stone body
    stoneG.roundRect(-16, -10, 32, 38, 3)
      .fill({ color: 0xcfd8dc })
      .stroke({ width: 1.5, color: 0x90a4ae });

    // Stone brick detail strokes
    stoneG.moveTo(-10, 0).lineTo(-2, 0).stroke({ width: 1, color: 0x78909c, alpha: 0.5 });
    stoneG.moveTo(4, 8).lineTo(12, 8).stroke({ width: 1, color: 0x78909c, alpha: 0.5 });
    stoneG.moveTo(-8, 16).lineTo(0, 16).stroke({ width: 1, color: 0x78909c, alpha: 0.5 });

    // Arched door
    stoneG.roundRect(-7, 12, 14, 16, 7)
      .fill({ color: 0x5d4037 })
      .stroke({ width: 1, color: 0x3e2723 });
    stoneG.circle(3, 20, 1.5).fill({ color: 0xffb300 }); // gold knob

    // Turret battlements rim
    stoneG.rect(-19, -16, 38, 8)
      .fill({ color: 0xb0bec5 })
      .stroke({ width: 1, color: 0x78909c });
    // Turret teeth
    stoneG.rect(-17, -21, 8, 6).fill({ color: 0xb0bec5 }).stroke({ width: 1, color: 0x78909c });
    stoneG.rect(-3, -21, 6, 6).fill({ color: 0xb0bec5 }).stroke({ width: 1, color: 0x78909c });
    stoneG.rect(9, -21, 8, 6).fill({ color: 0xb0bec5 }).stroke({ width: 1, color: 0x78909c });
    container.addChild(stoneG);

    // Conical roof (Rich fairytale purple or ruby)
    const roof = new Graphics();
    // Left roof
    roof.moveTo(0, -42)
      .lineTo(-18, -21)
      .lineTo(0, -21)
      .closePath()
      .fill({ color: 0xab47bc });
    // Right roof (shaded)
    roof.moveTo(0, -42)
      .lineTo(18, -21)
      .lineTo(0, -21)
      .closePath()
      .fill({ color: 0x7b1fa2 });
    roof.moveTo(0, -42)
      .lineTo(-18, -21)
      .lineTo(18, -21)
      .closePath()
      .stroke({ width: 1, color: 0x4a148c });
    container.addChild(roof);

    // Flag pole & pennant
    const flagG = new Graphics();
    flagG.moveTo(0, -42).lineTo(0, -56).stroke({ width: 2, color: 0xffd54f });
    // Waving golden pennant
    flagG.moveTo(0, -56)
      .lineTo(14, -50)
      .lineTo(0, -44)
      .closePath()
      .fill({ color: 0xffca28 })
      .stroke({ width: 1, color: 0xff8f00 });
    container.addChild(flagG);

    return container;
  }

  /**
   * Creates an adorable storybook treasure chest.
   */
  static createTreasureChest(x, y, scale = 1) {
    const container = new Container();
    container.position.set(x, y);
    container.scale.set(scale);

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(2, 16, 20, 7).fill({ color: 0x000000, alpha: 0.22 });
    container.addChild(shadow);

    const chestG = new Graphics();
    // Chest base box
    chestG.roundRect(-16, -4, 32, 20, 3)
      .fill({ color: 0x8d6e63 })
      .stroke({ width: 1.5, color: 0x4e342e });

    // Curved lid
    chestG.roundRect(-17, -15, 34, 14, 6)
      .fill({ color: 0xa1887f })
      .stroke({ width: 1.5, color: 0x4e342e });

    // Gold metal reinforcement bands
    chestG.rect(-12, -15, 4, 30).fill({ color: 0xffca28 });
    chestG.rect(8, -15, 4, 30).fill({ color: 0xffca28 });

    // Gold lock latch
    chestG.roundRect(-4, -6, 8, 9, 2)
      .fill({ color: 0xffb300 })
      .stroke({ width: 1, color: 0xff6f00 });
    chestG.circle(0, -2, 1.2).fill({ color: 0x3e2723 }); // keyhole
    container.addChild(chestG);

    // Little glittering stars bursting above
    const star1 = this.createPaperStar(6, 0xffeb3b, true);
    star1.position.set(-14, -22);
    const star2 = this.createPaperStar(7, 0xffd700, true);
    star2.position.set(12, -24);
    container.addChild(star1, star2);

    return container;
  }

  /**
   * Creates a waving "HERE!" pin flag marking the player's active current level.
   */
  static createPlayerPinFlag(x, y, label = 'HERE!') {
    const container = new Container();
    container.position.set(x, y);

    // Flag staff & needle
    const staff = new Graphics();
    staff.moveTo(0, 0).lineTo(0, -42).stroke({ width: 2.5, color: 0xffca28 });
    // Needle tip shadow
    staff.circle(2, 2, 3).fill({ color: 0x000000, alpha: 0.25 });
    container.addChild(staff);

    // Waving pennant ribbon
    const pennant = new Graphics();
    pennant.moveTo(0, -42)
      .lineTo(44, -36)
      .lineTo(38, -25)
      .lineTo(44, -14)
      .lineTo(0, -20)
      .closePath()
      .fill({ color: 0xe53935 })
      .stroke({ width: 1.5, color: 0xb71c1c });
    container.addChild(pennant);

    const txt = new Text({
      text: label,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0xffffff
      }
    });
    txt.position.set(5, -34);
    container.addChild(txt);

    // Golden ball finial on top of staff
    const finial = new Graphics();
    finial.circle(0, -43, 4.5).fill({ color: 0xffd54f }).stroke({ width: 1, color: 0xff8f00 });
    container.addChild(finial);

    return container;
  }
}
