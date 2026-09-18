import { Container, Graphics, Text } from 'pixi.js';
import { PaperCraft } from '../graphics/PaperCraft.js';
import { Backgrounds } from '../graphics/Backgrounds.js';
import { audioSynth } from '../audio/AudioSynth.js';
import { gameState } from '../game/GameState.js';

export class LevelSelectScene extends Container {
  constructor(app, sceneManager) {
    super();
    this.app = app;
    this.sceneManager = sceneManager;

    this.currentWorld = gameState.getWorldForLevel(gameState.unlockedLevel);

    this.bg = new Graphics();
    this.addChild(this.bg);

    // Scrollable track container
    this.scrollContainer = new Container();
    this.addChild(this.scrollContainer);

    // Static header layer (stays fixed above scrolling content)
    this.headerLayer = new Container();
    this.addChild(this.headerLayer);

    this.dragStartY = 0;
    this.isDragging = false;
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.maxScrollY = 0;
    this.minScrollY = 0;

    this.setupUI();
    this.setupTouchScroll();
  }

  setupUI() {
    this.scrollContainer.removeChildren();
    this.headerLayer.removeChildren();

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    Backgrounds.drawCardboard(this.bg, w, h);

    // 1. Top Header Layer (Fixed)
    // Green "← BACK" button on top-left
    const backBtn = this.createBackButton(58, 44, () => {
      audioSynth.playClick();
      this.sceneManager.goToScene('menu');
    });
    this.headerLayer.addChild(backBtn);

    // Center Taped World Banner
    const banner = this.createWorldBanner(w * 0.52, 44);
    this.headerLayer.addChild(banner);

    // World Navigation Bar (Prev / Next World tabs)
    const navY = 96;
    if (this.currentWorld > 1) {
      const prevBtn = this.createWorldNavButton('◀ PREV WORLD', w * 0.28, navY, () => {
        audioSynth.playClick();
        this.currentWorld--;
        this.setupUI();
      });
      this.headerLayer.addChild(prevBtn);
    }

    if (this.currentWorld < 10) {
      const nextBtn = this.createWorldNavButton('NEXT WORLD ▶', w * 0.72, navY, () => {
        audioSynth.playClick();
        this.currentWorld++;
        this.setupUI();
      });
      this.headerLayer.addChild(nextBtn);
    }

    // 2. Winding Level Path Nodes for Current World (10 levels)
    const startLevel = (this.currentWorld - 1) * 10 + 1;
    const levelsInWorld = 10;

    const nodeRadius = 38;
    const rowHeight = 110;
    const startY = 160;

    // S-curve winding coordinates centered within comfortable width
    const nodePositions = [];
    const maxContentW = Math.min(w * 0.9, 440);
    const cx = w * 0.5;
    const colLeft = cx - maxContentW * 0.34;
    const colCenter = cx;
    const colRight = cx + maxContentW * 0.34;

    // Repeating wave sequence: Left -> Center -> Right -> Center -> Left ...
    const xPattern = [colLeft, colCenter, colRight, colRight, colCenter, colLeft, colLeft, colCenter, colRight, colRight];

    for (let i = 0; i < levelsInWorld; i++) {
      const lvl = startLevel + i;
      const px = xPattern[i % xPattern.length];
      const py = startY + i * rowHeight;
      nodePositions.push({ x: px, y: py, level: lvl });
    }

    // Draw winding dotted path
    const pathG = new Graphics();
    this.scrollContainer.addChild(pathG);

    // Connect node centers with dotted line segments
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const p1 = nodePositions[i];
      const p2 = nodePositions[i + 1];
      this.drawDottedCurve(pathG, p1.x, p1.y, p2.x, p2.y);
    }

    // Pin colors cycle: Yellow, Blue, Green
    const pinColors = [0xffeb3b, 0x29b6f6, 0x66bb6a];

    // Render 10 level node badges
    nodePositions.forEach((pos) => {
      const isUnlocked = pos.level <= gameState.unlockedLevel;
      const starsEarned = gameState.levelStars[pos.level] || 0;
      const pinColor = pinColors[(pos.level - 1) % pinColors.length];

      const badge = this.createLevelNodeBadge(pos.level, isUnlocked, starsEarned, pinColor, nodeRadius);
      badge.position.set(pos.x, pos.y);
      this.scrollContainer.addChild(badge);
    });

    // Scroll limits
    const totalContentHeight = startY + levelsInWorld * rowHeight + 90;
    this.minScrollY = Math.min(0, h - totalContentHeight);
    this.maxScrollY = 0;
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.scrollContainer.position.y = 0;
  }

  createWorldBanner(cx, cy) {
    const container = new Container();
    container.position.set(cx, cy);

    const worldName = gameState.getWorldName(this.currentWorld);
    const starsEarned = gameState.getWorldStars(this.currentWorld);

    // White torn paper rectangle
    const banner = PaperCraft.createTornRect(260, 56, {
      color: 0xffffff,
      jitter: 2,
      shadow: true,
      shadowOffset: { x: 3, y: 5 },
      shadowAlpha: 0.25
    });
    container.addChild(banner);

    // Tape on left and right ends
    const tape1 = PaperCraft.createTapeStrip(-115, 0, 36, 16, 0.4);
    const tape2 = PaperCraft.createTapeStrip(115, 0, 36, 16, -0.4);
    container.addChild(tape1, tape2);

    // World Title
    const titleTxt = new Text({
      text: `WORLD ${this.currentWorld}: ${worldName.toUpperCase()}`,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xc62828,
        letterSpacing: 1
      }
    });
    titleTxt.anchor.set(0.5);
    titleTxt.position.set(0, -9);
    container.addChild(titleTxt);

    // Stars Tracker
    const starTxt = new Text({
      text: `${starsEarned} / 30 ★`,
      style: {
        fontFamily: 'Fredoka, Arial',
        fontSize: 15,
        fontWeight: 'bold',
        fill: 0xf57f17
      }
    });
    starTxt.anchor.set(0.5);
    starTxt.position.set(0, 12);
    container.addChild(starTxt);

    return container;
  }

  createWorldNavButton(label, x, y, onClick) {
    const container = new Container();
    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const paper = PaperCraft.createTornRect(125, 30, {
      color: 0xfff9c4, // Pale yellow sticky scrap
      jitter: 1.5,
      shadow: true,
      shadowOffset: { x: 2, y: 3 },
      shadowAlpha: 0.22
    });
    container.addChild(paper);

    const txt = new Text({
      text: label,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0x333333
      }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    container.on('pointerdown', () => container.scale.set(0.93));
    container.on('pointerup', () => {
      container.scale.set(1.0);
      onClick();
    });
    container.on('pointerupoutside', () => container.scale.set(1.0));

    return container;
  }

  createBackButton(x, y, onClick) {
    const container = new Container();
    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';

    // Green paper scrap
    const paper = PaperCraft.createTornRect(85, 40, {
      color: 0x66bb6a,
      jitter: 2,
      shadow: true,
      shadowOffset: { x: 3, y: 4 },
      shadowAlpha: 0.28
    });
    container.addChild(paper);

    // Top tape
    const tape = PaperCraft.createTapeStrip(0, -18, 34, 13, 0.05);
    container.addChild(tape);

    const txt = new Text({
      text: '← BACK',
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0x1b5e20
      }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    container.on('pointerdown', () => container.scale.set(0.93));
    container.on('pointerup', () => {
      container.scale.set(1.0);
      onClick();
    });
    container.on('pointerupoutside', () => container.scale.set(1.0));

    return container;
  }

  drawDottedCurve(g, x1, y1, x2, y2) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
      const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;

      if (i % 2 === 0) {
        g.circle(px, py, 4.5).fill({ color: 0x212121, alpha: 0.75 });
      }
    }
  }

  createLevelNodeBadge(levelNum, isUnlocked, starsEarned, color, radius) {
    const container = new Container();
    container.eventMode = isUnlocked ? 'static' : 'none';
    container.cursor = isUnlocked ? 'pointer' : 'default';

    // 1. Shadow
    const shadow = new Graphics();
    shadow.circle(4, 6, radius).fill({ color: 0x000000, alpha: 0.25 });
    container.addChild(shadow);

    // 2. Circular badge body
    const badgeColor = isUnlocked ? color : 0xb0bec5;
    const circleG = new Graphics();
    circleG.circle(0, 0, radius).fill({ color: badgeColor });
    circleG.circle(0, 0, radius).stroke({ width: 1.5, color: 0x000000, alpha: 0.15 });
    container.addChild(circleG);

    // 3. Masking tape strip across bottom
    const tape = PaperCraft.createTapeStrip(0, radius * 0.65, radius * 1.3, 14, 0);
    container.addChild(tape);

    // 4. Content (Number or Padlock)
    if (isUnlocked) {
      const fontSize = levelNum >= 100 ? 22 : (levelNum >= 10 ? 27 : 33);
      const numTxt = new Text({
        text: `${levelNum}`,
        style: {
          fontFamily: 'Fredoka, "Comic Neue", Arial',
          fontSize,
          fontWeight: 'bold',
          fill: 0x212121
        }
      });
      numTxt.anchor.set(0.5);
      numTxt.position.set(0, -2);
      container.addChild(numTxt);

      // Pushpin at top (Yellow, Blue, or Green)
      const pin = PaperCraft.createPushPin(color);
      pin.position.set(radius * 0.45, -radius * 0.75);
      container.addChild(pin);

      // 3 Paper Stars underneath
      const starSpacing = 16;
      [-1, 0, 1].forEach((idx) => {
        const starNum = idx + 2; // 1, 2, 3
        const isEarned = starNum <= starsEarned;
        const starCol = isEarned ? 0xffc107 : 0xe0e0e0;
        const star = PaperCraft.createPaperStar(9, starCol, isEarned);
        star.position.set(idx * starSpacing, radius + 14);
        container.addChild(star);
      });

      // Tap event
      container.on('pointerdown', () => container.scale.set(0.92));
      container.on('pointerup', () => {
        container.scale.set(1.0);
        audioSynth.playClick();
        this.sceneManager.goToScene('game', { level: levelNum });
      });
      container.on('pointerupoutside', () => container.scale.set(1.0));
    } else {
      // Locked level
      const lock = PaperCraft.createPadlock(22);
      lock.position.set(0, 0);
      container.addChild(lock);

      // Grey pushpin
      const pin = PaperCraft.createPushPin(0x78909c);
      pin.position.set(radius * 0.45, -radius * 0.75);
      container.addChild(pin);
    }

    return container;
  }

  setupTouchScroll() {
    this.eventMode = 'static';

    this.on('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartY = e.global.y - this.scrollContainer.y;
    });

    this.on('pointermove', (e) => {
      if (this.isDragging) {
        let newY = e.global.y - this.dragStartY;
        if (newY > this.maxScrollY) {
          newY = this.maxScrollY + (newY - this.maxScrollY) * 0.3;
        } else if (newY < this.minScrollY) {
          newY = this.minScrollY + (newY - this.minScrollY) * 0.3;
        }
        this.targetScrollY = newY;
      }
    });

    const endDrag = () => {
      this.isDragging = false;
      if (this.targetScrollY > this.maxScrollY) {
        this.targetScrollY = this.maxScrollY;
      } else if (this.targetScrollY < this.minScrollY) {
        this.targetScrollY = this.minScrollY;
      }
    };

    this.on('pointerup', endDrag);
    this.on('pointerupoutside', endDrag);

    window.addEventListener('wheel', (e) => {
      if (this.sceneManager.currentSceneName === 'levelSelect') {
        this.targetScrollY = Math.max(
          this.minScrollY,
          Math.min(this.maxScrollY, this.targetScrollY - e.deltaY * 0.6)
        );
      }
    }, { passive: true });
  }

  update(delta) {
    if (!this.isDragging) {
      this.scrollY += (this.targetScrollY - this.scrollY) * 0.18;
    } else {
      this.scrollY = this.targetScrollY;
    }
    this.scrollContainer.y = this.scrollY;
  }

  resize() {
    this.setupUI();
  }
}
