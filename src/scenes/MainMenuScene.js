import { Container, Graphics, Text } from 'pixi.js';
import { PaperCraft } from '../graphics/PaperCraft.js';
import { Backgrounds } from '../graphics/Backgrounds.js';
import { audioSynth } from '../audio/AudioSynth.js';
import { gameState } from '../game/GameState.js';
import { adService } from '../services/AdService.js';

export class MainMenuScene extends Container {
  constructor(app, sceneManager) {
    super();
    this.app = app;
    this.sceneManager = sceneManager;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.content = new Container();
    this.addChild(this.content);

    this.floatingBubbles = [];
    this.time = 0;

    this.setupUI();
  }

  setupUI() {
    this.content.removeChildren();
    this.floatingBubbles = [];

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    Backgrounds.drawCardboard(this.bg, w, h);
    adService.showBanner();

    // 1. Decorative background floating equation bubbles (relative to center)
    const cx = w * 0.5;
    const cy = h * 0.38;
    const spreadX = Math.min(w * 0.42, 280);
    const spreadY = Math.min(h * 0.28, 180);

    const bubbleEquations = [
      { text: '2 + 3', dx: -spreadX * 0.65, dy: -spreadY * 0.85, color: 0xffffff, scale: 0.95 },
      { text: '5 + 1', dx: spreadX * 0.70, dy: -spreadY * 0.88, color: 0xffffff, scale: 0.95 },
      { text: '9 - 4', dx: -spreadX * 0.28, dy: -spreadY * 0.55, color: 0x81d4fa, scale: 0.9 },
      { text: '7 - 2', dx: spreadX * 0.40, dy: -spreadY * 0.55, color: 0x81d4fa, scale: 0.9 },
      { text: '4 - 7', dx: -spreadX * 0.95, dy: -spreadY * 0.42, color: 0x81d4fa, scale: 0.8 },
      { text: '6 + 3', dx: spreadX * 0.95, dy: -spreadY * 0.45, color: 0xffffff, scale: 0.85 },
      { text: '6 - 3', dx: -spreadX * 0.88, dy: spreadY * 0.55, color: 0xffffff, scale: 0.85 },
      { text: '4 - 1', dx: spreadX * 0.90, dy: spreadY * 0.58, color: 0x81d4fa, scale: 0.85 }
    ];

    bubbleEquations.forEach((item, index) => {
      const bubble = PaperCraft.createSpeechBubble(50 * item.scale, 40 * item.scale, {
        color: item.color,
        hasTail: true,
        tailAngle: Math.PI * 0.65,
        shadowOffset: { x: 4, y: 6 }
      });
      const bx = cx + item.dx;
      const by = cy + item.dy;
      bubble.position.set(bx, by);

      const txt = new Text({
        text: item.text,
        style: {
          fontFamily: 'Caveat, Patrick Hand, Arial',
          fontSize: 26 * item.scale,
          fontWeight: 'bold',
          fill: 0x1a1a1a
        }
      });
      txt.anchor.set(0.5);
      bubble.addChild(txt);

      bubble.baseY = by;
      bubble.floatOffset = index * 0.8;
      bubble.floatSpeed = 1.2 + (index % 3) * 0.3;

      this.content.addChild(bubble);
      this.floatingBubbles.push(bubble);
    });

    // 2. Top Right Utility Buttons (Settings gear & Audio speaker)
    const gearBtn = this.createIconPaperButton('⚙', w - 105, 45, () => {
      audioSynth.playClick();
      this.sceneManager.openModal('settings');
    });
    this.soundBtn = this.createIconPaperButton(
      gameState.sfxEnabled ? '🔊' : '🔇',
      w - 48,
      45,
      () => {
        const nextState = !gameState.sfxEnabled;
        gameState.setAudio(nextState, nextState);
        audioSynth.setSettings(nextState, nextState);
        this.soundBtn.iconText.text = nextState ? '🔊' : '🔇';
        if (nextState) audioSynth.playClick();
      }
    );
    this.content.addChild(gearBtn, this.soundBtn);

    // 3. Scattered Decorative Paper Stars
    const starCoords = [
      { x: w * 0.09, y: h * 0.46, s: 20, rot: -0.2 },
      { x: w * 0.91, y: h * 0.45, s: 22, rot: 0.3 },
      { x: w * 0.12, y: h * 0.74, s: 26, rot: 0.4 },
      { x: w * 0.88, y: h * 0.64, s: 24, rot: -0.3 },
      { x: w * 0.13, y: h * 0.90, s: 30, rot: -0.15 }
    ];
    starCoords.forEach(st => {
      const star = PaperCraft.createPaperStar(st.s, 0xffd54f);
      star.position.set(st.x, st.y);
      star.rotation = st.rot;
      this.content.addChild(star);
    });

    // 4. Large 3D Layered Title: "EQUATION BUBBLES"
    const titleContainer = this.createTitleLogo(w * 0.5, h * 0.38);
    this.content.addChild(titleContainer);

    // 5. Interactive Big Action Buttons: "PLAY" & "LEVELS"
    const btnWidth = Math.min(260, w * 0.68);
    const btnHeight = 65;

    // PLAY button (Green zig-zag)
    const playBtn = this.createMenuButton(
      'PLAY',
      w * 0.5,
      h * 0.63,
      btnWidth,
      btnHeight,
      0x4caf50,
      () => {
        audioSynth.playClick();
        this.sceneManager.goToScene('game', { level: gameState.unlockedLevel });
      }
    );
    this.content.addChild(playBtn);

    // LEVELS button (Blue zig-zag)
    const levelsBtn = this.createMenuButton(
      'LEVELS',
      w * 0.5,
      h * 0.77,
      btnWidth,
      btnHeight,
      0x42a5f5,
      () => {
        audioSynth.playClick();
        this.sceneManager.goToScene('levelSelect');
      }
    );
    this.content.addChild(levelsBtn);
  }

  createTitleLogo(cx, cy) {
    const container = new Container();
    container.position.set(cx, cy);

    // Kraft paper backing with torn edges
    const backing = PaperCraft.createTornRect(320, 140, {
      color: 0xdeb887,
      jitter: 2.5,
      shadow: true,
      shadowOffset: { x: 5, y: 7 },
      shadowAlpha: 0.35
    });
    container.addChild(backing);

    // Top Tape and Bottom Tape
    const tapeTop = PaperCraft.createTapeStrip(-110, -68, 55, 18, -0.4);
    const tapeBottom = PaperCraft.createTapeStrip(115, 68, 55, 18, -0.4);
    container.addChild(tapeTop, tapeBottom);

    // EQUATION text
    const txtEquation = new Text({
      text: 'EQUATION',
      style: {
        fontFamily: 'Fredoka, Caveat, Arial',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xef5350, // Crimson red
        stroke: { color: 0x212121, width: 5 },
        dropShadow: {
          alpha: 0.4,
          angle: Math.PI / 3,
          blur: 1,
          color: 0x000000,
          distance: 5
        }
      }
    });
    txtEquation.anchor.set(0.5);
    txtEquation.position.set(0, -28);
    container.addChild(txtEquation);

    // BUBBLES text
    const txtBubbles = new Text({
      text: 'BUBBLES',
      style: {
        fontFamily: 'Fredoka, Caveat, Arial',
        fontSize: 54,
        fontWeight: 'bold',
        fill: 0xffca28, // Bright amber yellow
        stroke: { color: 0x212121, width: 5 },
        dropShadow: {
          alpha: 0.4,
          angle: Math.PI / 3,
          blur: 1,
          color: 0x000000,
          distance: 5
        }
      }
    });
    txtBubbles.anchor.set(0.5);
    txtBubbles.position.set(0, 30);
    container.addChild(txtBubbles);

    return container;
  }

  createMenuButton(label, x, y, width, height, color, onClick) {
    const container = new Container();
    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const btnPaper = PaperCraft.createZigZagRect(width, height, {
      color,
      cardboardBacking: true,
      sawTooth: 9,
      sawDepth: 6,
      tape: true
    });
    container.addChild(btnPaper);

    const txt = new Text({
      text: label,
      style: {
        fontFamily: 'Caveat, Patrick Hand, Arial',
        fontSize: 38,
        fontWeight: 'bold',
        fill: 0x111111,
        letterSpacing: 2
      }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    // Interaction animations (bounce / press)
    container.on('pointerdown', () => {
      container.scale.set(0.95);
    });
    container.on('pointerup', () => {
      container.scale.set(1.0);
      onClick();
    });
    container.on('pointerupoutside', () => {
      container.scale.set(1.0);
    });

    return container;
  }

  createIconPaperButton(iconChar, x, y, onClick) {
    const container = new Container();
    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';

    // Small taped paper square
    const paper = PaperCraft.createTornRect(42, 42, {
      color: 0xefebe9,
      jitter: 1.5,
      shadow: true,
      shadowOffset: { x: 3, y: 4 },
      shadowAlpha: 0.25
    });
    container.addChild(paper);

    // Mini tape strip across top
    const tape = PaperCraft.createTapeStrip(0, -20, 34, 12, 0.1);
    container.addChild(tape);

    const iconText = new Text({
      text: iconChar,
      style: {
        fontSize: 22,
        fill: 0x333333
      }
    });
    iconText.anchor.set(0.5);
    container.addChild(iconText);
    container.iconText = iconText;

    container.on('pointerdown', () => {
      container.scale.set(0.92);
    });
    container.on('pointerup', () => {
      container.scale.set(1.0);
      onClick();
    });
    container.on('pointerupoutside', () => {
      container.scale.set(1.0);
    });

    return container;
  }

  update(delta) {
    this.time += 0.03 * delta;
    // Gentle floating bobbing for background preview bubbles
    for (const b of this.floatingBubbles) {
      b.y = b.baseY + Math.sin(this.time * b.floatSpeed + b.floatOffset) * 6;
    }
  }

  resize() {
    this.setupUI();
  }
}
