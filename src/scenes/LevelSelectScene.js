import { Container, Graphics, Text } from 'pixi.js';
import { PaperCraft } from '../graphics/PaperCraft.js';
import { Backgrounds } from '../graphics/Backgrounds.js';
import { audioSynth } from '../audio/AudioSynth.js';
import { gameState } from '../game/GameState.js';
import { adService } from '../services/AdService.js';

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

    this.scrollMask = new Graphics();
    this.addChild(this.scrollMask);
    this.scrollContainer.mask = this.scrollMask;

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
    const cx = w * 0.5;

    Backgrounds.drawCardboard(this.bg, w, h);
    adService.showBanner();

    // 1. Top Header Layer (Structured rows to eliminate any overlap)
    // Row A: Top Bar (y = 28)
    // Green "← BACK" button on top-left
    const backBtn = this.createBackButton(52, 28, () => {
      audioSynth.playClick();
      this.sceneManager.goToScene('menu');
    });
    this.headerLayer.addChild(backBtn);

    // Total stars progress on top-right
    const totalStarsBadge = this.createTotalStarsBadge(w - 52, 28);
    this.headerLayer.addChild(totalStarsBadge);

    // Row B: Centered Taped World Banner (y = 80)
    const bannerW = Math.min(w * 0.9, 320);
    const banner = this.createWorldBanner(cx, 80, bannerW);
    this.headerLayer.addChild(banner);

    // Row C: World Navigation Tabs (y = 126)
    const navY = 126;
    const hasPrev = this.currentWorld > 1;
    const hasNext = this.currentWorld < 10;

    if (hasPrev && hasNext) {
      const prevBtn = this.createWorldNavButton('◀ PREV WORLD', cx - 74, navY, () => {
        audioSynth.playClick();
        this.currentWorld--;
        this.setupUI();
      });
      const nextBtn = this.createWorldNavButton('NEXT WORLD ▶', cx + 74, navY, () => {
        audioSynth.playClick();
        this.currentWorld++;
        this.setupUI();
      });
      this.headerLayer.addChild(prevBtn, nextBtn);
    } else if (hasPrev) {
      // Single centered button (e.g. World 10)
      const prevBtn = this.createWorldNavButton('◀ PREV WORLD', cx, navY, () => {
        audioSynth.playClick();
        this.currentWorld--;
        this.setupUI();
      });
      this.headerLayer.addChild(prevBtn);
    } else if (hasNext) {
      // Single centered button (e.g. World 1)
      const nextBtn = this.createWorldNavButton('NEXT WORLD ▶', cx, navY, () => {
        audioSynth.playClick();
        this.currentWorld++;
        this.setupUI();
      });
      this.headerLayer.addChild(nextBtn);
    }

    // Clip scrolling badges neatly below navigation bar
    this.scrollMask.clear();
    this.scrollMask.rect(0, 150, w, Math.max(10, h - 150)).fill({ color: 0xffffff });

    // 2. Winding Level Path Nodes for Current World (10 levels)
    const startLevel = (this.currentWorld - 1) * 10 + 1;
    const levelsInWorld = 10;

    const nodeRadius = 38;
    const rowHeight = 110;
    const startY = 190;

    // S-curve winding coordinates centered within comfortable width
    const nodePositions = [];
    const maxContentW = Math.min(w * 0.9, 440);
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

  createWorldBanner(cx, cy, bannerW = 280) {
    const container = new Container();
    container.position.set(cx, cy);

    const worldName = gameState.getWorldName(this.currentWorld);
    const starsEarned = gameState.getWorldStars(this.currentWorld);
    const bannerH = 58;

    // White torn paper rectangle
    const banner = PaperCraft.createTornRect(bannerW, bannerH, {
      color: 0xffffff,
      jitter: 2,
      shadow: true,
      shadowOffset: { x: 3, y: 5 },
      shadowAlpha: 0.25
    });
    container.addChild(banner);

    // Tape on left and right ends
    const tape1 = PaperCraft.createTapeStrip(-bannerW * 0.44, 0, 32, 15, 0.35);
    const tape2 = PaperCraft.createTapeStrip(bannerW * 0.44, 0, 32, 15, -0.35);
    container.addChild(tape1, tape2);

    // World Title with dynamic font size for long world titles
    const titleStr = `WORLD ${this.currentWorld}: ${worldName.toUpperCase()}`;
    const fontSize = titleStr.length > 25 ? 12.5 : (titleStr.length > 20 ? 14 : 15.5);

    const titleTxt = new Text({
      text: titleStr,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize,
        fontWeight: 'bold',
        fill: 0xc62828,
        letterSpacing: 0.5
      }
    });
    titleTxt.anchor.set(0.5);
    titleTxt.position.set(0, -10);
    container.addChild(titleTxt);

    // Stars Tracker
    const starTxt = new Text({
      text: `${starsEarned} / 30 ★`,
      style: {
        fontFamily: 'Fredoka, Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xf57f17
      }
    });
    starTxt.anchor.set(0.5);
    starTxt.position.set(0, 13);
    container.addChild(starTxt);

    return container;
  }

  createTotalStarsBadge(x, y) {
    const container = new Container();
    container.position.set(x, y);

    const totalStars = gameState.totalStars || 0;

    const paper = PaperCraft.createTornRect(76, 32, {
      color: 0xfff9c4,
      jitter: 1.5,
      shadow: true,
      shadowOffset: { x: 2, y: 3 },
      shadowAlpha: 0.22
    });
    container.addChild(paper);

    const tape = PaperCraft.createTapeStrip(0, -14, 26, 10, -0.05);
    container.addChild(tape);

    const txt = new Text({
      text: `★ ${totalStars}`,
      style: {
        fontFamily: 'Fredoka, Arial',
        fontSize: 13.5,
        fontWeight: 'bold',
        fill: 0xf57f17
      }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

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
    const paper = PaperCraft.createTornRect(80, 34, {
      color: 0x66bb6a,
      jitter: 2,
      shadow: true,
      shadowOffset: { x: 3, y: 4 },
      shadowAlpha: 0.28
    });
    container.addChild(paper);

    // Top tape
    const tape = PaperCraft.createTapeStrip(0, -15, 30, 11, 0.05);
    container.addChild(tape);

    const txt = new Text({
      text: '← BACK',
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 14.5,
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
