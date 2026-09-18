import { Container, Graphics, Text } from 'pixi.js';
import { PaperCraft } from '../graphics/PaperCraft.js';
import { Backgrounds } from '../graphics/Backgrounds.js';
import { audioSynth } from '../audio/AudioSynth.js';
import { gameState } from '../game/GameState.js';
import { EquationGenerator } from '../game/EquationGenerator.js';

export class GameScene extends Container {
  constructor(app, sceneManager) {
    super();
    this.app = app;
    this.sceneManager = sceneManager;

    this.level = 1;
    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.targetQuota = 5; // correct hits needed to win level
    this.quotaProgress = 0;
    this.lives = 3;
    this.timerSeconds = 45;

    this.timeAccumulator = 0;
    this.globalTime = 0;
    this.isGameOver = false;

    this.bubbles = [];
    this.particles = [];
    this.popBursts = [];

    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Layer stack
    this.bg = new Graphics();
    this.addChild(this.bg);

    this.gameWorld = new Container();
    this.addChild(this.gameWorld);

    this.bubbleLayer = new Container();
    this.gameWorld.addChild(this.bubbleLayer);

    this.fxLayer = new Container();
    this.gameWorld.addChild(this.fxLayer);

    this.hudLayer = new Container();
    this.addChild(this.hudLayer);
  }

  startLevel(level = 1) {
    this.level = Math.min(100, Math.max(1, level));
    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.lives = 3;
    this.quotaProgress = 0;
    this.targetQuota = Math.min(10, 4 + Math.floor(this.level * 0.08));
    this.timerSeconds = Math.min(65, 42 + Math.floor(this.level * 0.22));
    this.isGameOver = false;

    // Clear active objects
    this.bubbleLayer.removeChildren();
    this.fxLayer.removeChildren();
    this.bubbles = [];
    this.particles = [];
    this.popBursts = [];

    this.setupHUD();
    this.spawnNewWave();
  }

  setupHUD() {
    this.hudLayer.removeChildren();
    const w = this.app.screen.width;

    Backgrounds.drawBlueCraft(this.bg, w, this.app.screen.height);

    // Large Taped Paper Scrap Banner across top
    const hudW = Math.min(480, w * 0.94);
    const hudH = 95;
    const hudContainer = new Container();
    hudContainer.position.set(w * 0.5, 68);

    const hudPaper = PaperCraft.createTornRect(hudW, hudH, {
      color: 0xfffbf0, // Warm cream paper
      jitter: 2.2,
      shadow: true,
      shadowOffset: { x: 4, y: 7 },
      shadowAlpha: 0.3
    });
    hudContainer.addChild(hudPaper);

    // Tape on 4 corners / edges of the paper banner
    const tTopL = PaperCraft.createTapeStrip(-hudW * 0.45, -hudH * 0.46, 50, 16, -0.2);
    const tTopR = PaperCraft.createTapeStrip(hudW * 0.45, -hudH * 0.46, 50, 16, 0.2);
    const tBotL = PaperCraft.createTapeStrip(-hudW * 0.46, hudH * 0.44, 50, 16, 0.3);
    const tBotR = PaperCraft.createTapeStrip(hudW * 0.46, hudH * 0.44, 50, 16, -0.3);
    const tCenterTop = PaperCraft.createTapeStrip(0, -hudH * 0.5, 45, 14, 0);
    const tCenterBot = PaperCraft.createTapeStrip(0, hudH * 0.5, 45, 14, 0);
    hudContainer.addChild(tTopL, tTopR, tBotL, tBotR, tCenterTop, tCenterBot);

    // Text Style for Paper HUD
    const fontStyle = {
      fontFamily: 'Caveat, Patrick Hand, Arial',
      fontSize: 26,
      fontWeight: 'bold',
      fill: 0x1a1a1a
    };

    // Left Column: Score & Target Number
    this.scoreText = new Text({
      text: `Score: ${this.score}`,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Patrick Hand, Arial',
        fontSize: 26,
        fontWeight: 'bold',
        fill: 0x1a1a1a
      }
    });
    this.scoreText.position.set(-hudW * 0.44, -hudH * 0.34);
    hudContainer.addChild(this.scoreText);

    this.targetText = new Text({
      text: `Target: 10`,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Arial',
        fontSize: 34,
        fontWeight: 'bold',
        fill: 0xc62828,
        stroke: { color: 0xffffff, width: 3 }
      }
    });
    this.targetText.position.set(-hudW * 0.44, 4);
    hudContainer.addChild(this.targetText);

    // Right Column: Timer & Origami Hearts
    this.timerText = new Text({
      text: `Timer: ${this.timerSeconds}s`,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Patrick Hand, Arial',
        fontSize: 26,
        fontWeight: 'bold',
        fill: 0x1a1a1a
      }
    });
    this.timerText.anchor.set(1, 0);
    this.timerText.position.set(hudW * 0.44, -hudH * 0.34);
    hudContainer.addChild(this.timerText);

    // 3 Paper Folded Hearts
    this.heartsContainer = new Container();
    this.heartsContainer.position.set(hudW * 0.44 - 70, 20);
    this.heartNodes = [];

    for (let i = 0; i < 3; i++) {
      const heart = PaperCraft.createPaperHeart(26);
      heart.position.set(i * 28, 0);
      this.heartsContainer.addChild(heart);
      this.heartNodes.push(heart);
    }
    hudContainer.addChild(this.heartsContainer);

    this.hudLayer.addChild(hudContainer);
  }

  updateHUD() {
    if (this.scoreText) this.scoreText.text = `Score: ${this.score}`;
    if (this.targetText) this.targetText.text = `Target: ${this.currentTarget}`;
    if (this.timerText) this.timerText.text = `Timer: ${Math.max(0, Math.ceil(this.timerSeconds))}s`;

    for (let i = 0; i < 3; i++) {
      if (this.heartNodes && this.heartNodes[i]) {
        this.heartNodes[i].visible = i < this.lives;
      }
    }
  }

  spawnNewWave() {
    if (this.isGameOver) return;

    // Pick target
    const rules = EquationGenerator.getLevelRules(this.level);
    this.currentTarget = EquationGenerator.pickTarget(rules);
    this.updateHUD();

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Clear existing bubbles
    this.bubbleLayer.removeChildren();
    this.bubbles = [];

    // Create 6 bubbles in 3 or 4 balanced lanes, staggered vertically
    const playW = Math.min(w * 0.90, 520);
    const startLeft = (w - playW) / 2 + 50;
    const numLanes = 3;
    const laneWidth = (playW - 100) / (numLanes - 1);

    const totalBubbles = 6;
    const colors = [0x64b5f6, 0x81c784, 0xff80ab, 0xffb74d, 0xba68c8, 0xfff176, 0x4dd0e1];

    // Guarantee that bubbles 0 and 3 match target (one on screen right away, one coming up)
    for (let i = 0; i < totalBubbles; i++) {
      const isTarget = (i === 0 || i === 3);
      const eq = isTarget
        ? EquationGenerator.createCorrectEquation(this.currentTarget, this.level)
        : EquationGenerator.createDistractorEquation(this.currentTarget, this.level);

      const colIdx = i % numLanes;
      const laneX = startLeft + colIdx * laneWidth;
      // Stagger vertical positions: some already mid-screen at start, some below screen
      const startY = h * 0.42 + i * 115;

      const bubble = this.createBubbleNode(eq, laneX, startY, colors[i % colors.length]);
      this.bubbleLayer.addChild(bubble);
      this.bubbles.push(bubble);
    }
  }

  createBubbleNode(eq, laneX, y, color) {
    const bubble = PaperCraft.createSpeechBubble(52, 42, {
      color,
      hasTail: Math.random() > 0.4,
      tailAngle: Math.PI * (0.6 + Math.random() * 0.4),
      shadowOffset: { x: 4, y: 7 }
    });

    const txt = new Text({
      text: eq.text,
      style: {
        fontFamily: 'Fredoka, "Comic Neue", Patrick Hand, Arial, sans-serif',
        fontSize: 31,
        fontWeight: 'bold',
        fill: 0x111111,
        stroke: { color: 0xffffff, width: 2.5 }
      }
    });
    txt.anchor.set(0.5);
    bubble.addChild(txt);
    bubble.txtNode = txt;

    bubble.position.set(laneX, y);
    bubble.laneX = laneX;
    bubble.radius = 52;
    bubble.vy = 1.15 + Math.min(1.15, this.level * 0.012); // smooth velocity scaling for 100 levels
    bubble.swayAmp = 8; // subtle sway to stay within lane
    bubble.swayFreq = 1.4;
    bubble.swayPhase = Math.random() * Math.PI * 2;
    bubble.data = eq;

    bubble.eventMode = 'static';
    bubble.cursor = 'pointer';
    bubble.on('pointerdown', (e) => {
      e.stopPropagation();
      this.onBubbleTapped(bubble);
    });

    return bubble;
  }

  onBubbleTapped(bubble) {
    if (this.isGameOver) return;
    const isCorrect = (bubble.data.value === this.currentTarget);

    if (isCorrect) {
      // 1. Correct equation popped!
      audioSynth.playPop();
      audioSynth.playCorrect();

      const bubblePos = { x: bubble.x, y: bubble.y };
      const eq = bubble.data;

      // Remove popped bubble from scene
      this.removeBubble(bubble);

      // Create Comic POP Burst banner: "8+4=12 POP!"
      this.createPopBurstEffect(bubblePos.x, bubblePos.y, `${eq.text}=${this.currentTarget}`);

      // Create Paper Shred Confetti Explosion
      this.createConfettiExplosion(bubblePos.x, bubblePos.y, bubble.bubbleG ? bubble.bubbleG.tint : 0xffeb3b);

      this.score += 100 + this.level * 20;
      this.correctCount++;
      this.quotaProgress++;
      this.updateHUD();

      // Check level victory condition
      if (this.quotaProgress >= this.targetQuota) {
        this.handleLevelVictory();
        return;
      }

      // Spawn a replacement bubble at the bottom to maintain constant bubble count
      this.spawnReplacementBubble();

      // Check if any matching bubbles remain for this target
      const remainingMatches = this.bubbles.filter(b => b.data.value === this.currentTarget);
      if (remainingMatches.length === 0) {
        // Target cleared! Switch to next target
        const rules = EquationGenerator.getLevelRules(this.level);
        let nextTarget = EquationGenerator.pickTarget(rules);
        while (nextTarget === this.currentTarget) {
          nextTarget = EquationGenerator.pickTarget(rules);
        }
        this.currentTarget = nextTarget;
        this.updateHUD();

        // Immediately update 2 existing bubbles to match the new target!
        this.ensureMatchingBubblesExist(2);
      }
    } else {
      // 2. Wrong equation tapped!
      audioSynth.playWrong();
      this.triggerScreenShake();
      this.wrongCount++;
      this.lives--;
      this.updateHUD();

      // Mini wrong bump on bubble
      bubble.scale.set(0.85);
      setTimeout(() => {
        if (bubble.parent) bubble.scale.set(1.0);
      }, 150);

      if (this.lives <= 0) {
        this.handleGameOver(false);
      }
    }
  }

  spawnReplacementBubble() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const playW = Math.min(w * 0.90, 520);
    const startLeft = (w - playW) / 2 + 50;
    const numLanes = 3;
    const laneWidth = (playW - 100) / (numLanes - 1);

    // Pick lane with least bubbles
    const laneCounts = [0, 0, 0];
    this.bubbles.forEach(b => {
      const col = Math.round((b.laneX - startLeft) / laneWidth);
      if (col >= 0 && col < numLanes) laneCounts[col]++;
    });
    let bestLane = 0;
    let minCount = 999;
    laneCounts.forEach((c, idx) => {
      if (c < minCount) {
        minCount = c;
        bestLane = idx;
      }
    });

    const laneX = startLeft + bestLane * laneWidth;
    let lowestY = h + 40;
    this.bubbles.forEach(b => {
      if (b.y > lowestY) lowestY = b.y;
    });
    const startY = lowestY + 115;

    // Check if we need another matching bubble
    const currentMatches = this.bubbles.filter(b => b.data.value === this.currentTarget).length;
    const eq = (currentMatches < 2)
      ? EquationGenerator.createCorrectEquation(this.currentTarget, this.level)
      : EquationGenerator.createDistractorEquation(this.currentTarget, this.level);

    const colors = [0x64b5f6, 0x81c784, 0xff80ab, 0xffb74d, 0xba68c8, 0xfff176, 0x4dd0e1];
    const bubble = this.createBubbleNode(eq, laneX, startY, colors[Math.floor(Math.random() * colors.length)]);
    this.bubbleLayer.addChild(bubble);
    this.bubbles.push(bubble);
  }

  ensureMatchingBubblesExist(requiredCount = 1) {
    const h = this.app.screen.height;
    const matching = this.bubbles.filter(b => b.data.value === this.currentTarget);

    if (matching.length < requiredCount) {
      // Find candidate distractor bubbles that are visible or emerging
      const candidates = this.bubbles
        .filter(b => b.data.value !== this.currentTarget)
        .sort((a, b) => Math.abs(a.y - h * 0.55) - Math.abs(b.y - h * 0.55));

      const needed = requiredCount - matching.length;
      for (let i = 0; i < needed && i < candidates.length; i++) {
        const candidate = candidates[i];
        const newEq = EquationGenerator.createCorrectEquation(this.currentTarget, this.level);
        candidate.data = newEq;
        candidate.txtNode.text = newEq.text;
      }
    }
  }

  removeBubble(bubble) {
    const idx = this.bubbles.indexOf(bubble);
    if (idx !== -1) {
      this.bubbles.splice(idx, 1);
    }
    if (bubble.parent) {
      bubble.parent.removeChild(bubble);
    }
  }

  createPopBurstEffect(x, y, textLabel) {
    const burst = PaperCraft.createPopBurst(95);
    burst.position.set(x, Math.max(120, y));

    // Equation label inside pop burst: e.g. "8+4=12"
    const eqText = new Text({
      text: textLabel,
      style: {
        fontFamily: 'Fredoka, Caveat, Arial',
        fontSize: 26,
        fontWeight: 'bold',
        fill: 0x1b1b1b
      }
    });
    eqText.anchor.set(0.5);
    eqText.position.set(0, -12);
    burst.addChild(eqText);

    // Comic "POP!" label
    const popText = new Text({
      text: 'POP!',
      style: {
        fontFamily: 'Fredoka, Caveat, Arial',
        fontSize: 34,
        fontWeight: 'bold',
        fill: 0x111111,
        letterSpacing: 2
      }
    });
    popText.anchor.set(0.5);
    popText.position.set(0, 20);
    burst.addChild(popText);

    burst.alpha = 1;
    burst.scale.set(0.5);
    burst.life = 0;
    burst.maxLife = 35; // frames

    this.fxLayer.addChild(burst);
    this.popBursts.push(burst);
  }

  createConfettiExplosion(x, y, baseColor) {
    const shredColors = [0xff5722, 0xffeb3b, 0x4caf50, 0x2196f3, 0xe91e63, 0xff9800];
    const particleCount = 14;

    for (let i = 0; i < particleCount; i++) {
      const p = new Graphics();
      const col = shredColors[i % shredColors.length];
      const size = 5 + Math.random() * 8;

      // Random triangular or rectangular paper confetti shred
      if (Math.random() > 0.5) {
        p.poly([0, 0, size, size * 0.4, size * 0.3, size], true).fill({ color: col });
      } else {
        p.rect(-size / 2, -size / 4, size, size * 0.5).fill({ color: col });
      }

      p.position.set(x, y);
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 3.5 + Math.random() * 5.5;

      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.vr = (Math.random() - 0.5) * 0.35; // rotation speed
      p.life = 1.0;
      p.decay = 0.025 + Math.random() * 0.015;

      this.fxLayer.addChild(p);
      this.particles.push(p);
    }
  }

  triggerScreenShake(duration = 18, intensity = 12) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  handleLevelVictory() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    audioSynth.playFanfare();

    // Calculate stars: 3 stars if 3 lives, 2 stars if 2 lives, 1 star if 1 life
    const stars = Math.max(1, this.lives);
    gameState.recordLevelScore(this.level, this.score, stars);

    setTimeout(() => {
      this.sceneManager.openModal('results', {
        won: true,
        score: this.score,
        correct: this.correctCount,
        wrong: this.wrongCount,
        level: this.level
      });
    }, 650);
  }

  handleGameOver(won) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    audioSynth.playWrong();

    setTimeout(() => {
      this.sceneManager.openModal('results', {
        won: false,
        score: this.score,
        correct: this.correctCount,
        wrong: this.wrongCount,
        level: this.level
      });
    }, 600);
  }

  update(delta) {
    if (this.isGameOver) return;

    this.globalTime += 0.03 * delta;
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Timer countdown
    this.timeAccumulator += (delta / 60);
    if (this.timeAccumulator >= 1.0) {
      this.timeAccumulator -= 1.0;
      this.timerSeconds--;
      this.updateHUD();

      if (this.timerSeconds <= 0) {
        this.handleGameOver(false);
        return;
      }
    }

    // Screen Shake effect
    if (this.shakeDuration > 0) {
      this.shakeDuration -= delta;
      const offsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity * 0.5;
      this.gameWorld.position.set(offsetX, offsetY);
    } else {
      this.gameWorld.position.set(0, 0);
    }

    // 1. Move bubbles up & apply gentle horizontal lane sway
    const topLimit = 100;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y -= b.vy * delta;
      b.x = b.laneX + Math.sin(this.globalTime * b.swayFreq + b.swayPhase) * b.swayAmp;

      // If float above screen top, recycle below the lowest bubble
      if (b.y < topLimit) {
        let lowestY = h + 40;
        for (const other of this.bubbles) {
          if (other !== b && other.y > lowestY) lowestY = other.y;
        }
        b.y = lowestY + 115;

        // Refresh equation on recycle
        const matchesOnScreen = this.bubbles.filter(x => x !== b && x.data.value === this.currentTarget).length;
        const newEq = (matchesOnScreen < 2)
          ? EquationGenerator.createCorrectEquation(this.currentTarget, this.level)
          : EquationGenerator.createDistractorEquation(this.currentTarget, this.level);

        b.data = newEq;
        b.txtNode.text = newEq.text;
      }
    }

    // 2. Physics Anti-Overlap Elastic Repulsion
    const minDist = 104; // bubble diameter ~96px + 8px padding
    for (let i = 0; i < this.bubbles.length; i++) {
      for (let j = i + 1; j < this.bubbles.length; j++) {
        const b1 = this.bubbles[i];
        const b2 = this.bubbles[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDist * minDist && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;

          b1.x -= nx * overlap;
          b1.y -= ny * overlap;
          b2.x += nx * overlap;
          b2.y += ny * overlap;
        }
      }
    }

    // 3. Screen Boundary Clamping
    for (const b of this.bubbles) {
      b.x = Math.max(52, Math.min(w - 52, b.x));
    }

    // 4. GUARANTEE OF VISIBLE TARGET BUBBLES
    // Ensure that at least 1 bubble matching this.currentTarget is visibly present on screen
    const visibleMatches = this.bubbles.filter(
      b => b.data.value === this.currentTarget && b.y > 130 && b.y < h - 40
    );
    if (visibleMatches.length === 0) {
      this.ensureMatchingBubblesExist(1);
    }

    // Update Pop Burst Animations
    for (let i = this.popBursts.length - 1; i >= 0; i--) {
      const burst = this.popBursts[i];
      burst.life += delta;
      if (burst.life < 8) {
        burst.scale.set(0.5 + (burst.life / 8) * 0.55);
      } else {
        burst.alpha -= 0.04 * delta;
      }

      if (burst.life >= burst.maxLife || burst.alpha <= 0) {
        this.popBursts.splice(i, 1);
        if (burst.parent) burst.parent.removeChild(burst);
      }
    }

    // Update Confetti Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += 0.15 * delta;
      p.rotation += p.vr * delta;
      p.life -= p.decay * delta;
      p.alpha = Math.max(0, p.life);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        if (p.parent) p.parent.removeChild(p);
      }
    }
  }

  resize() {
    this.setupHUD();
  }
}
