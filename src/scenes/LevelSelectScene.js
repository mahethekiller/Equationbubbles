import { Container, Graphics, Text } from 'pixi.js';
import { PaperCraft } from '../graphics/PaperCraft.js';
import { Backgrounds } from '../graphics/Backgrounds.js';
import { audioSynth } from '../audio/AudioSynth.js';
import { gameState, GameState } from '../game/GameState.js';

/**
 * LevelSelectScene - Fairytale Adventure Storybook
 * Renders an open illuminated storybook lying on a warm wooden desk.
 * Features chapter narrative prompts, winding dotted treasure trails,
 * procedural origami trees, paper mountains, milestone castles/chests,
 * level paper medallions with stars, and dog-eared page turn controls.
 */
export class LevelSelectScene extends Container {
  constructor(app, sceneManager) {
    super();
    this.app = app;
    this.sceneManager = sceneManager;

    this.currentWorld = gameState.getWorldForLevel(gameState.unlockedLevel);

    this.bg = new Graphics();
    this.addChild(this.bg);

    // Main book wrapper
    this.bookWrapper = new Container();
    this.addChild(this.bookWrapper);

    // Map scroll container & mask
    this.mapMask = new Graphics();
    this.addChild(this.mapMask);

    this.mapScroll = new Container();
    this.mapScroll.mask = this.mapMask;
    this.addChild(this.mapScroll);

    // Fixed UI on top of book (banner, controls, home button)
    this.uiLayer = new Container();
    this.addChild(this.uiLayer);

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
    this.bookWrapper.removeChildren();
    this.mapScroll.removeChildren();
    this.uiLayer.removeChildren();

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // 1. Warm Mahogany Desk Background
    Backgrounds.drawWoodTable(this.bg, w, h);

    // 2. Open Fairytale Storybook Base
    const bookW = Math.min(w * 0.94, 520);
    const bookH = Math.min(h - 76, 760);
    const bookX = w / 2;
    const bookY = 48 + bookH / 2;

    const storybook = PaperCraft.createStorybookBase(bookW, bookH);
    storybook.position.set(bookX, bookY);
    this.bookWrapper.addChild(storybook);

    // 3. Top Navigation & Home Button
    const backBtn = this.createBackButton(54, 34, () => {
      audioSynth.playClick();
      this.sceneManager.goToScene('menu');
    });
    this.uiLayer.addChild(backBtn);

    // 4. Chapter Story Header (inside the top of the open storybook)
    const chapterData = GameState.getChapterData(this.currentWorld);
    const headerContainer = this.createChapterHeader(bookX, bookY - bookH / 2 + 58, bookW - 48, chapterData);
    this.uiLayer.addChild(headerContainer);

    // 5. Setup Scroll Area Mask for the Adventure Trail
    const mapTop = bookY - bookH / 2 + 120;
    const mapBottom = bookY + bookH / 2 - 58;
    const mapHeight = mapBottom - mapTop;
    const mapWidth = bookW - 36;
    const mapLeft = bookX - mapWidth / 2;

    this.mapMask.clear();
    this.mapMask.roundRect(mapLeft, mapTop, mapWidth, mapHeight, 6).fill(0xffffff);

    // 6. Populate Adventure Map Winding Trail (10 levels)
    const startLevel = (this.currentWorld - 1) * 10 + 1;
    const levelsInWorld = 10;
    const rowHeight = 110;
    const startTrailY = mapTop + 36;

    const nodePositions = [];
    const trailSpanX = Math.min(mapWidth * 0.36, 130);
    const xPattern = [-trailSpanX, 0, trailSpanX, trailSpanX * 0.8, 0, -trailSpanX * 0.8, -trailSpanX, 0, trailSpanX * 0.6, trailSpanX];

    for (let i = 0; i < levelsInWorld; i++) {
      const lvl = startLevel + i;
      const px = bookX + xPattern[i % xPattern.length];
      const py = startTrailY + i * rowHeight;
      nodePositions.push({ x: px, y: py, level: lvl });
    }

    // A. Decorative Storybook Landmarks along the Trail
    this.createDecorations(bookX, startTrailY, rowHeight, mapWidth);

    // B. Dotted Treasure Map Trail Connecting Nodes
    const pathG = new Graphics();
    this.mapScroll.addChild(pathG);

    for (let i = 0; i < nodePositions.length - 1; i++) {
      const p1 = nodePositions[i];
      const p2 = nodePositions[i + 1];
      this.drawStorybookDottedTrail(pathG, p1.x, p1.y, p2.x, p2.y);
    }

    // C. Chapter Milestone Finish (Castle Turret or Treasure Chest at Level 10)
    const lastNode = nodePositions[nodePositions.length - 1];
    if (this.currentWorld === 10) {
      const chest = PaperCraft.createTreasureChest(lastNode.x + 52, lastNode.y - 12, 1.1);
      const castle = PaperCraft.createCastleTurret(lastNode.x - 56, lastNode.y - 18, 0.95);
      this.mapScroll.addChild(castle, chest);
    } else if (this.currentWorld % 2 === 0) {
      const castle = PaperCraft.createCastleTurret(lastNode.x + 54, lastNode.y - 16, 0.95);
      this.mapScroll.addChild(castle);
    } else {
      const chest = PaperCraft.createTreasureChest(lastNode.x + 50, lastNode.y - 10, 1.05);
      this.mapScroll.addChild(chest);
    }

    // D. Level Paper Medallion Badges (10 nodes)
    const pinColors = [0xffeb3b, 0x42a5f5, 0x66bb6a, 0xff7043, 0xab47bc];
    const nodeRadius = 35;

    nodePositions.forEach((pos) => {
      const isUnlocked = pos.level <= gameState.unlockedLevel;
      const isCurrentActive = pos.level === gameState.unlockedLevel;
      const starsEarned = gameState.levelStars[pos.level] || 0;
      const pinColor = pinColors[(pos.level - 1) % pinColors.length];

      const badge = this.createLevelNodeBadge(pos.level, isUnlocked, starsEarned, pinColor, nodeRadius);
      badge.position.set(pos.x, pos.y);
      this.mapScroll.addChild(badge);

      // If this is the player's active current level, add the waving "HERE!" pin flag
      if (isCurrentActive) {
        const pinFlag = PaperCraft.createPlayerPinFlag(pos.x - 14, pos.y - nodeRadius);
        this.mapScroll.addChild(pinFlag);
      }
    });

    // 7. Dog-Eared Page Turn Controls (Bottom of the storybook)
    const bottomY = bookY + bookH / 2 - 28;
    const cornerMargin = bookW / 2 - 22;

    // Previous Chapter Tab
    if (this.currentWorld > 1) {
      const prevTab = this.createDogEarButton(`◀ CH. ${this.currentWorld - 1}`, bookX - cornerMargin + 48, bottomY, 'left', () => {
        this.turnPage(this.currentWorld - 1);
      });
      this.uiLayer.addChild(prevTab);
    }

    // Next Chapter Tab
    if (this.currentWorld < 10) {
      const nextTab = this.createDogEarButton(`CH. ${this.currentWorld + 1} ▶`, bookX + cornerMargin - 48, bottomY, 'right', () => {
        this.turnPage(this.currentWorld + 1);
      });
      this.uiLayer.addChild(nextTab);
    }

    // Page number stamp at bottom center
    const pageNumTxt = new Text({
      text: `- Page ${this.currentWorld} of 10 -`,
      style: {
        fontFamily: 'Caveat, "Comic Neue", Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0x8d6e63
      }
    });
    pageNumTxt.anchor.set(0.5);
    pageNumTxt.position.set(bookX, bottomY);
    this.uiLayer.addChild(pageNumTxt);

    // 8. Calculate Scroll Bounds
    const totalTrailH = (levelsInWorld - 1) * rowHeight + 90;
    this.maxScrollY = 0;
    this.minScrollY = Math.min(0, mapHeight - totalTrailH);
    this.scrollY = 0;
    this.targetScrollY = 0;

    // Auto-scroll to show current unlocked level if on this chapter
    const currentInThisWorld = gameState.unlockedLevel - startLevel;
    if (currentInThisWorld >= 0 && currentInThisWorld < levelsInWorld) {
      const activeY = currentInThisWorld * rowHeight;
      const desiredScroll = -(activeY - mapHeight * 0.4);
      this.targetScrollY = Math.max(this.minScrollY, Math.min(this.maxScrollY, desiredScroll));
      this.scrollY = this.targetScrollY;
    }

    this.mapScroll.position.y = this.scrollY;
  }

  createChapterHeader(cx, cy, maxW, chapterData) {
    const container = new Container();
    container.position.set(cx, cy);

    // Parchment title placard
    const placardW = Math.min(maxW, 440);
    const placardH = 74;
    const placard = PaperCraft.createTornRect(placardW, placardH, {
      color: 0xfffdf5,
      jitter: 1.5,
      shadow: true,
      shadowOffset: { x: 2, y: 3 },
      shadowAlpha: 0.18,
      strokeColor: 0xd7ccc8,
      strokeWidth: 1,
      strokeAlpha: 0.5
    });
    container.addChild(placard);

    // Tape on top-left and top-right of placard
    const tapeL = PaperCraft.createTapeStrip(-placardW / 2 + 18, -placardH / 2, 34, 14, -0.3);
    const tapeR = PaperCraft.createTapeStrip(placardW / 2 - 18, -placardH / 2, 34, 14, 0.3);
    container.addChild(tapeL, tapeR);

    // Chapter Name & Title
    const titleTxt = new Text({
      text: `CHAPTER ${chapterData.chapter}: ${chapterData.name.toUpperCase()}`,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 15,
        fontWeight: 'bold',
        fill: 0xc62828,
        letterSpacing: 0.8
      }
    });
    titleTxt.anchor.set(0.5);
    titleTxt.position.set(0, -18);
    container.addChild(titleTxt);

    // Whimsical Storybook Narrative Prompt
    const storyTxt = new Text({
      text: `"${chapterData.subtitle}"`,
      style: {
        fontFamily: 'Patrick Hand, Caveat, "Comic Neue", Arial',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'italic',
        fill: 0x5d4037,
        wordWrap: true,
        wordWrapWidth: placardW - 36,
        align: 'center'
      }
    });
    storyTxt.anchor.set(0.5);
    storyTxt.position.set(0, 4);
    container.addChild(storyTxt);

    // Chapter Star Progress Badge
    const starsEarned = gameState.getWorldStars(chapterData.chapter);
    const starPill = new Graphics();
    starPill.roundRect(-42, 17, 84, 18, 9)
      .fill({ color: 0xfff8e1 })
      .stroke({ width: 1, color: 0xffb300 });
    container.addChild(starPill);

    const starTxt = new Text({
      text: `★ ${starsEarned} / 30`,
      style: {
        fontFamily: 'Fredoka, Arial',
        fontSize: 11,
        fontWeight: 'bold',
        fill: 0xf57f17
      }
    });
    starTxt.anchor.set(0.5);
    starTxt.position.set(0, 26);
    container.addChild(starTxt);

    return container;
  }

  createDecorations(bookX, startTrailY, rowHeight, mapWidth) {
    const halfW = mapWidth / 2;

    // Origami Trees scattered near bends
    const tree1 = PaperCraft.createOrigamiTree(bookX - halfW * 0.65, startTrailY + rowHeight * 0.8, 0.9);
    const tree2 = PaperCraft.createOrigamiTree(bookX + halfW * 0.72, startTrailY + rowHeight * 2.2, 1.05);
    const tree3 = PaperCraft.createOrigamiTree(bookX - halfW * 0.68, startTrailY + rowHeight * 5.1, 1.0);
    const tree4 = PaperCraft.createOrigamiTree(bookX + halfW * 0.65, startTrailY + rowHeight * 6.9, 0.85);
    this.mapScroll.addChild(tree1, tree2, tree3, tree4);

    // Folded Origami Mountain Peaks
    const mtn1 = PaperCraft.createPaperMountain(bookX + halfW * 0.68, startTrailY + rowHeight * 3.8, 70, 52);
    const mtn2 = PaperCraft.createPaperMountain(bookX - halfW * 0.62, startTrailY + rowHeight * 7.7, 80, 58);
    this.mapScroll.addChild(mtn1, mtn2);
  }

  drawStorybookDottedTrail(g, x1, y1, x2, y2) {
    const cx = (x1 + x2) / 2 + (Math.sin(y1 * 0.05) * 20);
    const cy = (y1 + y2) / 2;

    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
      const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;

      if (i % 2 === 0) {
        // Dotted dashed bead
        g.circle(px, py, 3.8).fill({ color: 0x8d6e63, alpha: 0.75 });
      }
    }
  }

  createLevelNodeBadge(levelNum, isUnlocked, starsEarned, color, radius) {
    const container = new Container();
    container.eventMode = isUnlocked ? 'static' : 'none';
    container.cursor = isUnlocked ? 'pointer' : 'default';

    // 1. Drop shadow
    const shadow = new Graphics();
    shadow.circle(3, 5, radius).fill({ color: 0x000000, alpha: 0.22 });
    container.addChild(shadow);

    // 2. Circular paper token
    const badgeColor = isUnlocked ? color : 0xb0bec5;
    const circleG = new Graphics();
    circleG.circle(0, 0, radius).fill({ color: badgeColor });
    circleG.circle(0, 0, radius).stroke({ width: 1.5, color: 0x000000, alpha: 0.16 });
    container.addChild(circleG);

    // 3. Masking tape strip across bottom
    const tape = PaperCraft.createTapeStrip(0, radius * 0.65, radius * 1.3, 13, 0);
    container.addChild(tape);

    // 4. Content (Bold Fredoka Number or Padlock)
    if (isUnlocked) {
      const fontSize = levelNum >= 100 ? 20 : (levelNum >= 10 ? 26 : 30);
      const numTxt = new Text({
        text: `${levelNum}`,
        style: {
          fontFamily: 'Fredoka, Arial',
          fontSize,
          fontWeight: 'bold',
          fill: 0x212121
        }
      });
      numTxt.anchor.set(0.5);
      numTxt.position.set(0, -2);
      container.addChild(numTxt);

      // Pushpin at top
      const pin = PaperCraft.createPushPin(color);
      pin.position.set(radius * 0.45, -radius * 0.75);
      container.addChild(pin);

      // 3 Paper Stars underneath badge
      const starSpacing = 15;
      [-1, 0, 1].forEach((idx) => {
        const starNum = idx + 2; // 1, 2, 3
        const isEarned = starNum <= starsEarned;
        const starCol = isEarned ? 0xffc107 : 0xe0e0e0;
        const star = PaperCraft.createPaperStar(8.5, starCol, isEarned);
        star.position.set(idx * starSpacing, radius + 13);
        container.addChild(star);
      });

      // Tap feedback
      container.on('pointerdown', () => container.scale.set(0.92));
      container.on('pointerup', () => {
        container.scale.set(1.0);
        audioSynth.playClick();
        this.sceneManager.goToScene('game', { level: levelNum });
      });
      container.on('pointerupoutside', () => container.scale.set(1.0));
    } else {
      // Locked level
      const lock = PaperCraft.createPadlock(20);
      lock.position.set(0, 0);
      container.addChild(lock);

      // Grey pushpin
      const pin = PaperCraft.createPushPin(0x78909c);
      pin.position.set(radius * 0.45, -radius * 0.75);
      container.addChild(pin);
    }

    return container;
  }

  createDogEarButton(label, x, y, side, onClick) {
    const container = new Container();
    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const btnW = 96;
    const btnH = 34;

    // Folded dog-ear corner paper scrap
    const paper = PaperCraft.createTornRect(btnW, btnH, {
      color: 0xfff9c4, // Pale yellow corner note
      jitter: 1.2,
      shadow: true,
      shadowOffset: { x: 2, y: 3 },
      shadowAlpha: 0.22,
      strokeColor: 0xfbc02d,
      strokeWidth: 1,
      strokeAlpha: 0.4
    });
    container.addChild(paper);

    // Decorative paper fold crease
    const crease = new Graphics();
    if (side === 'left') {
      crease.moveTo(-btnW / 2 + 10, -btnH / 2)
        .lineTo(-btnW / 2, -btnH / 2 + 10)
        .stroke({ width: 1.5, color: 0x8d6e63, alpha: 0.4 });
    } else {
      crease.moveTo(btnW / 2 - 10, -btnH / 2)
        .lineTo(btnW / 2, -btnH / 2 + 10)
        .stroke({ width: 1.5, color: 0x8d6e63, alpha: 0.4 });
    }
    container.addChild(crease);

    const txt = new Text({
      text: label,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 0x4e342e
      }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    container.on('pointerdown', () => container.scale.set(0.92));
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
    const paper = PaperCraft.createTornRect(84, 38, {
      color: 0x66bb6a,
      jitter: 1.8,
      shadow: true,
      shadowOffset: { x: 2, y: 3 },
      shadowAlpha: 0.25
    });
    container.addChild(paper);

    // Top tape
    const tape = PaperCraft.createTapeStrip(0, -16, 32, 12, 0.05);
    container.addChild(tape);

    const txt = new Text({
      text: '← HOME',
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 15,
        fontWeight: 'bold',
        fill: 0x1b5e20
      }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    container.on('pointerdown', () => container.scale.set(0.92));
    container.on('pointerup', () => {
      container.scale.set(1.0);
      onClick();
    });
    container.on('pointerupoutside', () => container.scale.set(1.0));

    return container;
  }

  turnPage(newWorld) {
    if (newWorld < 1 || newWorld > 10) return;

    audioSynth.playPageTurn();

    // Subtle page flip animation: scale down X slightly, then switch and expand
    let frame = 0;
    const animateFlip = () => {
      frame++;
      if (frame < 5) {
        this.bookWrapper.scale.x = 1.0 - (frame / 5) * 0.08;
        requestAnimationFrame(animateFlip);
      } else if (frame === 5) {
        this.currentWorld = newWorld;
        this.setupUI();
        this.bookWrapper.scale.x = 0.92;
        requestAnimationFrame(animateFlip);
      } else if (frame <= 10) {
        this.bookWrapper.scale.x = 0.92 + ((frame - 5) / 5) * 0.08;
        requestAnimationFrame(animateFlip);
      } else {
        this.bookWrapper.scale.x = 1.0;
      }
    };
    animateFlip();
  }

  setupTouchScroll() {
    this.eventMode = 'static';

    this.on('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartY = e.global.y - this.mapScroll.y;
    });

    this.on('pointermove', (e) => {
      if (this.isDragging) {
        let newY = e.global.y - this.dragStartY;
        if (newY > this.maxScrollY) {
          newY = this.maxScrollY + (newY - this.maxScrollY) * 0.25;
        } else if (newY < this.minScrollY) {
          newY = this.minScrollY + (newY - this.minScrollY) * 0.25;
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
    this.mapScroll.y = this.scrollY;
  }

  resize() {
    this.setupUI();
  }
}
