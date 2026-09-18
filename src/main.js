import { Application } from 'pixi.js';
import { SceneManager } from './SceneManager.js';
import { audioSynth } from './audio/AudioSynth.js';
import { gameState } from './game/GameState.js';

async function bootstrap() {
  const app = new Application();

  // Initialize PixiJS v8
  await app.init({
    resizeTo: window,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    antialias: true,
    backgroundColor: 0x2b1f14
  });

  const container = document.getElementById('app-container');
  container.appendChild(app.canvas);

  const sceneManager = new SceneManager(app);
  sceneManager.goToScene('menu');

  // Per-frame game loop ticker
  app.ticker.add((ticker) => {
    sceneManager.update(ticker.deltaTime);
  });

  // Window resize handler
  window.addEventListener('resize', () => {
    sceneManager.resize();
  });

  // First interaction audio unlock
  const unlockAudio = () => {
    audioSynth.init();
    audioSynth.setSettings(gameState.musicEnabled, gameState.sfxEnabled);
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

bootstrap().catch((err) => {
  console.error('Failed to initialize Equation Bubbles:', err);
});
