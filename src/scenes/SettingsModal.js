import { Container, Graphics, Text } from 'pixi.js';
import { PaperCraft } from '../graphics/PaperCraft.js';
import { audioSynth } from '../audio/AudioSynth.js';
import { gameState } from '../game/GameState.js';

export class SettingsModal extends Container {
  constructor(app, sceneManager) {
    super();
    this.app = app;
    this.sceneManager = sceneManager;

    this.backdrop = new Graphics();
    this.addChild(this.backdrop);

    this.modalContent = new Container();
    this.addChild(this.modalContent);

    this.parentalUnlocked = false;
    this.enteredAnswer = '';
    this.generateParentalMath();

    this.setupUI();
  }

  generateParentalMath() {
    this.num1 = 6 + Math.floor(Math.random() * 4); // 6..9
    this.num2 = 4 + Math.floor(Math.random() * 6); // 4..9
    this.expectedAnswer = `${this.num1 * this.num2}`;
    this.enteredAnswer = '';
  }

  setupUI() {
    this.modalContent.removeChildren();

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Darkened Dim Backdrop
    this.backdrop.clear();
    this.backdrop.rect(0, 0, w, h).fill({ color: 0x111c26, alpha: 0.85 });
    this.backdrop.eventMode = 'static'; // block clicks behind

    const sheetW = Math.min(360, w * 0.88);
    const sheetH = Math.min(580, h * 0.88);
    const cx = w * 0.5;
    const cy = h * 0.5;

    this.modalContent.position.set(cx, cy);

    // 1. Lined Notebook Paper with 4 Corner Tape Strips
    const notepad = PaperCraft.createLinedNotepad(sheetW, sheetH);
    this.modalContent.addChild(notepad);

    // 2. Red Torn Paper Banner: "SETTINGS"
    const banner = PaperCraft.createTornRect(sheetW * 0.75, 52, {
      color: 0xe53935,
      jitter: 2.2,
      shadow: true,
      shadowOffset: { x: 3, y: 5 },
      shadowAlpha: 0.3
    });
    banner.position.set(0, -sheetH * 0.43);
    this.modalContent.addChild(banner);

    const bannerText = new Text({
      text: 'SETTINGS',
      style: {
        fontFamily: 'Fredoka, Caveat, Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fill: 0xffffff,
        letterSpacing: 2
      }
    });
    bannerText.anchor.set(0.5);
    banner.addChild(bannerText);

    // 3. Audio Option Rows: Music & Sound FX
    const rowY1 = -sheetH * 0.28;
    const rowY2 = -sheetH * 0.16;

    // "Music" Row
    const musicLabel = new Text({
      text: 'Music',
      style: {
        fontFamily: 'Caveat, Patrick Hand, Arial',
        fontSize: 32,
        fontWeight: 'bold',
        fill: 0x1a1a1a
      }
    });
    musicLabel.anchor.set(0, 0.5);
    musicLabel.position.set(-sheetW * 0.38, rowY1);
    this.modalContent.addChild(musicLabel);

    const musicToggle = PaperCraft.createPaperToggle(90, 44, gameState.musicEnabled);
    musicToggle.position.set(sheetW * 0.25, rowY1);
    musicToggle.on('pointerdown', () => {
      const nextVal = !musicToggle.isOn;
      musicToggle.isOn = nextVal;
      gameState.setAudio(nextVal, gameState.sfxEnabled);
      audioSynth.setSettings(nextVal, gameState.sfxEnabled);
      this.setupUI(); // redraw toggle state
      audioSynth.playClick();
    });
    this.modalContent.addChild(musicToggle);

    // "Sound FX" Row
    const sfxLabel = new Text({
      text: 'Sound FX',
      style: {
        fontFamily: 'Caveat, Patrick Hand, Arial',
        fontSize: 32,
        fontWeight: 'bold',
        fill: 0x1a1a1a
      }
    });
    sfxLabel.anchor.set(0, 0.5);
    sfxLabel.position.set(-sheetW * 0.38, rowY2);
    this.modalContent.addChild(sfxLabel);

    const sfxToggle = PaperCraft.createPaperToggle(90, 44, gameState.sfxEnabled);
    sfxToggle.position.set(sheetW * 0.25, rowY2);
    sfxToggle.on('pointerdown', () => {
      const nextVal = !sfxToggle.isOn;
      sfxToggle.isOn = nextVal;
      gameState.setAudio(gameState.musicEnabled, nextVal);
      audioSynth.setSettings(gameState.musicEnabled, nextVal);
      this.setupUI();
      if (nextVal) audioSynth.playClick();
    });
    this.modalContent.addChild(sfxToggle);

    // 4. Yellow Sticky Post-it Note: "PARENTS ONLY"
    const stickyContainer = this.createParentalSticky(sheetW * 0.85, 200);
    stickyContainer.position.set(0, sheetH * 0.12);
    this.modalContent.addChild(stickyContainer);

    // 5. Blue Taped Paper Button at Bottom: "CLOSE"
    const closeBtn = this.createCloseButton(sheetW * 0.65, 48, () => {
      audioSynth.playClick();
      this.sceneManager.closeModal();
    });
    closeBtn.position.set(0, sheetH * 0.44);
    this.modalContent.addChild(closeBtn);
  }

  createParentalSticky(width, height) {
    const container = new Container();

    // Yellow paper with torn edges and curled corner
    const paper = PaperCraft.createTornRect(width, height, {
      color: 0xfff176, // Warm sticky yellow
      jitter: 1.8,
      shadow: true,
      shadowOffset: { x: 4, y: 6 },
      shadowAlpha: 0.28
    });
    container.addChild(paper);

    // Top center tape holding note
    const tape = PaperCraft.createTapeStrip(0, -height * 0.5, 48, 14, 0.04);
    container.addChild(tape);

    // Title: "PARENTS ONLY"
    const title = new Text({
      text: 'PARENTS ONLY',
      style: {
        fontFamily: 'Patrick Hand, Caveat, Arial',
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0x212121
      }
    });
    title.anchor.set(0.5);
    title.position.set(0, -height * 0.36);
    container.addChild(title);

    // Underline
    const lineG = new Graphics();
    lineG.moveTo(-65, -height * 0.25).lineTo(65, -height * 0.25)
      .stroke({ width: 2, color: 0x212121, alpha: 0.6 });
    container.addChild(lineG);

    if (!this.parentalUnlocked) {
      // Prompt: "Solve to Enter: 8 x 4 = __"
      const prompt = new Text({
        text: `Solve to Enter:\n${this.num1} × ${this.num2} = ${this.enteredAnswer || '___'}`,
        style: {
          fontFamily: 'Caveat, Patrick Hand, Arial',
          fontSize: 24,
          fontWeight: 'bold',
          fill: 0x212121,
          align: 'center'
        }
      });
      prompt.anchor.set(0.5);
      prompt.position.set(0, -height * 0.05);
      container.addChild(prompt);

      // Mini Keypad Grid: Digits 1 to 9, 0, Backspace
      const padY = height * 0.22;
      const btnSize = 25;
      const gap = 6;
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'];
      const totalKeys = keys.length;
      const startX = -((totalKeys * (btnSize + gap)) / 2) + btnSize / 2;

      // Draw horizontal keypad row or 2 rows
      keys.forEach((k, i) => {
        const row = i < 6 ? 0 : 1;
        const col = i < 6 ? i : (i - 6);
        const kx = -75 + col * 30;
        const ky = padY + (row - 0.5) * 28;

        const keyBtn = this.createKeypadButton(k, kx, ky, 24, 22, () => {
          audioSynth.playClick();
          if (k === '⌫') {
            this.enteredAnswer = this.enteredAnswer.slice(0, -1);
          } else {
            if (this.enteredAnswer.length < 3) {
              this.enteredAnswer += k;
            }
          }
          // Check solution
          if (this.enteredAnswer === this.expectedAnswer) {
            audioSynth.playCorrect();
            this.parentalUnlocked = true;
          }
          this.setupUI();
        });
        container.addChild(keyBtn);
      });
    } else {
      // Unlocked state: Show Reset Progress button
      const unlockedMsg = new Text({
        text: '✓ Access Granted',
        style: {
          fontFamily: 'Patrick Hand, Arial',
          fontSize: 20,
          fontWeight: 'bold',
          fill: 0x2e7d32
        }
      });
      unlockedMsg.anchor.set(0.5);
      unlockedMsg.position.set(0, -height * 0.06);
      container.addChild(unlockedMsg);

      // Reset Button
      const resetBtn = new Container();
      resetBtn.position.set(0, height * 0.22);
      resetBtn.eventMode = 'static';
      resetBtn.cursor = 'pointer';

      const rPaper = PaperCraft.createTornRect(180, 36, {
        color: 0xef5350,
        jitter: 1.5,
        shadow: true,
        shadowOffset: { x: 2, y: 3 },
        shadowAlpha: 0.3
      });
      resetBtn.addChild(rPaper);

      const rTxt = new Text({
        text: 'RESET PROGRESS',
        style: {
          fontFamily: 'Fredoka, Arial',
          fontSize: 14,
          fontWeight: 'bold',
          fill: 0xffffff
        }
      });
      rTxt.anchor.set(0.5);
      resetBtn.addChild(rTxt);

      resetBtn.on('pointerdown', () => {
        if (confirm('Are you sure you want to reset all progress and high scores?')) {
          gameState.resetProgress();
          audioSynth.playPop();
          this.parentalUnlocked = false;
          this.generateParentalMath();
          this.setupUI();
        }
      });
      container.addChild(resetBtn);
    }

    return container;
  }

  createKeypadButton(char, x, y, w, h, onClick) {
    const btn = new Container();
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    // White paper tile
    const g = new Graphics();
    g.rect(-w / 2, -h / 2, w, h).fill({ color: 0xffffff });
    g.rect(-w / 2, -h / 2, w, h).stroke({ width: 1, color: 0x9e9e9e, alpha: 0.5 });
    btn.addChild(g);

    const txt = new Text({
      text: char,
      style: {
        fontFamily: 'Patrick Hand, Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0x111111
      }
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.on('pointerdown', () => btn.scale.set(0.9));
    btn.on('pointerup', () => {
      btn.scale.set(1.0);
      onClick();
    });
    btn.on('pointerupoutside', () => btn.scale.set(1.0));

    return btn;
  }

  createCloseButton(width, height, onClick) {
    const container = new Container();
    container.eventMode = 'static';
    container.cursor = 'pointer';

    // Blue paper banner with pinking shears / torn edge
    const paper = PaperCraft.createZigZagRect(width, height, {
      color: 0x42a5f5,
      sawTooth: 8,
      sawDepth: 5,
      shadow: true,
      shadowOffset: { x: 3, y: 5 },
      shadowAlpha: 0.3,
      tape: false
    });
    container.addChild(paper);

    const txt = new Text({
      text: 'CLOSE',
      style: {
        fontFamily: 'Caveat, Patrick Hand, Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fill: 0x0d47a1,
        letterSpacing: 2
      }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);

    container.on('pointerdown', () => container.scale.set(0.94));
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
