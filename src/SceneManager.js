import { Container } from 'pixi.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { SettingsModal } from './scenes/SettingsModal.js';
import { ResultsModal } from './scenes/ResultsModal.js';

export class SceneManager {
  constructor(app) {
    this.app = app;
    this.stage = app.stage;

    this.sceneContainer = new Container();
    this.modalContainer = new Container();
    this.stage.addChild(this.sceneContainer);
    this.stage.addChild(this.modalContainer);

    this.scenes = {};
    this.modals = {};
    this.currentScene = null;
    this.currentSceneName = '';
    this.activeModal = null;

    this.initScenes();
  }

  initScenes() {
    this.scenes = {
      menu: new MainMenuScene(this.app, this),
      levelSelect: new LevelSelectScene(this.app, this),
      game: new GameScene(this.app, this)
    };

    this.modals = {
      settings: new SettingsModal(this.app, this),
      results: new ResultsModal(this.app, this)
    };
  }

  goToScene(name, params = {}) {
    this.closeModal();

    if (this.currentScene && this.currentScene.parent) {
      this.sceneContainer.removeChild(this.currentScene);
    }

    const nextScene = this.scenes[name];
    if (!nextScene) {
      console.error(`Scene ${name} not found!`);
      return;
    }

    this.currentScene = nextScene;
    this.currentSceneName = name;
    this.sceneContainer.addChild(this.currentScene);

    if (name === 'game') {
      this.scenes.game.startLevel(params.level || 1);
    } else if (nextScene.resize) {
      nextScene.resize();
    }
  }

  openModal(name, data = {}) {
    const modal = this.modals[name];
    if (!modal) return;

    if (this.activeModal && this.activeModal.parent) {
      this.modalContainer.removeChild(this.activeModal);
    }

    this.activeModal = modal;
    if (modal.show) {
      modal.show(data);
    } else if (modal.setupUI) {
      modal.setupUI();
    }

    this.modalContainer.addChild(modal);
  }

  closeModal() {
    if (this.activeModal) {
      if (this.activeModal.parent) {
        this.modalContainer.removeChild(this.activeModal);
      }
      this.activeModal = null;
    }
  }

  update(delta) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(delta);
    }
    if (this.activeModal && this.activeModal.update) {
      this.activeModal.update(delta);
    }
  }

  resize() {
    if (this.currentScene && this.currentScene.resize) {
      this.currentScene.resize();
    }
    if (this.activeModal && this.activeModal.resize) {
      this.activeModal.resize();
    }
  }
}
