import { Container, Graphics, Text } from 'pixi.js';
import { PaperCraft } from '../graphics/PaperCraft.js';
import { audioSynth } from '../audio/AudioSynth.js';
import { gameState } from '../game/GameState.js';
import { adService } from '../services/AdService.js';

export class ResultsModal extends Container {
  constructor(app, sceneManager) {
    super();
    this.app = app;
    this.sceneManager = sceneManager;

    this.backdrop = new Graphics();
    this.addChild(this.backdrop);

    this.modalContent = new Container();
    this.addChild(this.modalContent);

    this.data = {
      won: true,
      score: 0,
      correct: 0,
      wrong: 0,
      level: 1
    };

    this.setupUI();
  }

  show(data = {}) {
    this.data = { ...this.data, ...data };
    this.setupUI();
  }

  setupUI() {
    this.modalContent.removeChildren();

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Dim Background Overlay
    this.backdrop.clear();
    this.backdrop.rect(0, 0, w, h).fill({ color: 0x0a141e, alpha: 0.82 });
    this.backdrop.eventMode = 'static';

    const sheetW = Math.min(340, w * 0.85);
    const sheetH = Math.min(520, h * 0.85);
    const cx = w * 0.5;
    const cy = h * 0.5;

    this.modalContent.position.set(cx, cy);

    // 1. White Paper Sheet with Torn Edges & 4 Corner Tape Strips
    const paperSheet = PaperCraft.createTornRect(sheetW, sheetH, {
      color: 0xfffef9,
      jitter: 2.2,
      shadow: true,
      shadowOffset: { x: 5, y: 8 },
      shadowAlpha: 0.32
    });
    this.modalContent.addChild(paperSheet);

    // 4 Corner Masking Tape Strips
    const t1 = PaperCraft.createTapeStrip(-sheetW * 0.46, -sheetH * 0.46, 55, 18, -Math.PI / 4);
    const t2 = PaperCraft.createTapeStrip(sheetW * 0.46, -sheetH * 0.46, 55, 18, Math.PI / 4);
    const t3 = PaperCraft.createTapeStrip(-sheetW * 0.46, sheetH * 0.46, 55, 18, Math.PI / 4);
    const t4 = PaperCraft.createTapeStrip(sheetW * 0.46, sheetH * 0.46, 55, 18, -Math.PI / 4);
    this.modalContent.addChild(t1, t2, t3, t4);

    // 2. Red Torn Banner: "WELL DONE!" or "TRY AGAIN!"
    const bannerTitle = this.data.won ? 'WELL DONE!' : 'TRY AGAIN!';
    const bannerColor = this.data.won ? 0xe53935 : 0xd84315;

    const banner = PaperCraft.createTornRect(sheetW * 0.82, 54, {
      color: bannerColor,
      jitter: 2.4,
      shadow: true,
      shadowOffset: { x: 3, y: 5 },
      shadowAlpha: 0.3
    });
    banner.position.set(0, -sheetH * 0.38);
    this.modalContent.addChild(banner);

    const bannerText = new Text({
      text: bannerTitle,
      style: {
        fontFamily: 'Fredoka, Caveat, Arial',
        fontSize: 30,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 2
      }
    });
    bannerText.anchor.set(0.5);
    banner.addChild(bannerText);

    // 3. FINAL SCORE Label
    const finalScoreLabel = new Text({
      text: 'FINAL SCORE:',
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fill: 0x222222,
        letterSpacing: 1.5
      }
    });
    finalScoreLabel.anchor.set(0.5);
    finalScoreLabel.position.set(0, -sheetH * 0.20);
    this.modalContent.addChild(finalScoreLabel);

    // 4. Huge Marker Score Number: "680"
    const scoreVal = new Text({
      text: `${this.data.score}`,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 66,
        fontWeight: 'bold',
        fill: 0x111111
      }
    });
    scoreVal.anchor.set(0.5);
    scoreVal.position.set(0, -sheetH * 0.05);
    this.modalContent.addChild(scoreVal);

    // 5. Stats: "Correct: 28" & "Wrong: 4"
    const statsText = new Text({
      text: `Correct: ${this.data.correct}    Wrong: ${this.data.wrong}`,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0x333333,
        align: 'center'
      }
    });
    statsText.anchor.set(0.5);
    statsText.position.set(0, sheetH * 0.09);
    this.modalContent.addChild(statsText);

    // 6. Taped Paper Strip: "HIGHSCORE: 1250"
    const hsContainer = new Container();
    hsContainer.position.set(0, sheetH * 0.20);

    const hsPaper = PaperCraft.createTornRect(sheetW * 0.78, 38, {
      color: 0xffffff,
      jitter: 1.5,
      shadow: true,
      shadowOffset: { x: 2, y: 3 },
      shadowAlpha: 0.2
    });
    hsContainer.addChild(hsPaper);

    const hsTapeL = PaperCraft.createTapeStrip(-sheetW * 0.38, 0, 32, 14, -0.3);
    const hsTapeR = PaperCraft.createTapeStrip(sheetW * 0.38, 0, 32, 14, 0.3);
    hsContainer.addChild(hsTapeL, hsTapeR);

    const hsText = new Text({
      text: `HIGHSCORE: ${gameState.highScore}`,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0x111111,
        letterSpacing: 1
      }
    });
    hsText.anchor.set(0.5);
    hsContainer.addChild(hsText);
    this.modalContent.addChild(hsContainer);

    // 7. Navigation Buttons
    const hasNextLevel = this.data.won && (this.data.level < gameState.totalLevels);

    if (hasNextLevel) {
      // Primary NEXT LEVEL Button
      const nextBtnW = sheetW * 0.82;
      const nextBtnH = 48;
      const nextBtnY = sheetH * 0.33;
      const nextBtn = this.createActionButton('NEXT LEVEL ▶', 0, nextBtnY, nextBtnW, nextBtnH, 0x4caf50, () => {
        audioSynth.playClick();
        this.sceneManager.closeModal();
        this.sceneManager.goToScene('game', { level: this.data.level + 1 });
      });
      this.modalContent.addChild(nextBtn);

      // Secondary Row: REPLAY (Orange) & MENU (Blue)
      const subBtnW = sheetW * 0.39;
      const subBtnH = 42;
      const subBtnY = sheetH * 0.43;

      const replayBtn = this.createActionButton('REPLAY', -sheetW * 0.22, subBtnY, subBtnW, subBtnH, 0xffb74d, () => {
        audioSynth.playClick();
        this.sceneManager.closeModal();
        this.sceneManager.goToScene('game', { level: this.data.level });
      });
      this.modalContent.addChild(replayBtn);

      const menuBtn = this.createActionButton('MENU', sheetW * 0.22, subBtnY, subBtnW, subBtnH, 0x42a5f5, () => {
        audioSynth.playClick();
        this.sceneManager.closeModal();
        this.sceneManager.goToScene('menu');
      });
      this.modalContent.addChild(menuBtn);
    } else {
      // Player Lost: Offer REVIVE with Rewarded Ad
      const reviveBtnW = sheetW * 0.82;
      const reviveBtnH = 46;
      const reviveBtnY = sheetH * 0.32;

      const reviveBtn = this.createActionButton('🎬 REVIVE (+3 ❤️)', 0, reviveBtnY, reviveBtnW, reviveBtnH, 0xffca28, () => {
        audioSynth.playClick();
        adService.showRewarded(() => {
          this.sceneManager.closeModal();
          if (this.sceneManager.scenes.game) {
            this.sceneManager.scenes.game.revivePlayer();
          }
        });
      });
      this.modalContent.addChild(reviveBtn);

      // Secondary Row: REPLAY (Green) & MENU (Blue)
      const subBtnW = sheetW * 0.39;
      const subBtnH = 42;
      const subBtnY = sheetH * 0.42;

      const replayBtn = this.createActionButton('REPLAY', -sheetW * 0.22, subBtnY, subBtnW, subBtnH, 0x66bb6a, () => {
        audioSynth.playClick();
        this.sceneManager.closeModal();
        this.sceneManager.goToScene('game', { level: this.data.level });
      });
      this.modalContent.addChild(replayBtn);

      const menuBtn = this.createActionButton('MENU', sheetW * 0.22, subBtnY, subBtnW, subBtnH, 0x42a5f5, () => {
        audioSynth.playClick();
        this.sceneManager.closeModal();
        this.sceneManager.goToScene('menu');
      });
      this.modalContent.addChild(menuBtn);
    }
  }

  createActionButton(label, x, y, width, height, color, onClick) {
    const container = new Container();
    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const paper = PaperCraft.createTornRect(width, height, {
      color,
      jitter: 2,
      shadow: true,
      shadowOffset: { x: 3, y: 4 },
      shadowAlpha: 0.28
    });
    container.addChild(paper);

    const txt = new Text({
      text: label,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0x111111,
        letterSpacing: 1.2
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

  resize() {
    this.setupUI();
  }
}
