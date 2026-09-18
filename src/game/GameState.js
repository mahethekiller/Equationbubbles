/**
 * Equation Bubbles - Game State & Persistence
 */
const STORAGE_KEY = 'equation_bubbles_data_v1';

export class GameState {
  static WORLD_NAMES = [
    'Starter Meadow',
    'Addition Ascent',
    'Subtraction Shore',
    'Subtraction Summit',
    'Harmony Hills',
    'Multiplication Grove',
    'Times Table Peak',
    'Division Lagoon',
    'Operation Oasis',
    'Grandmaster Galaxy'
  ];

  static CHAPTER_DATA = [
    {
      chapter: 1,
      name: 'Starter Meadow',
      subtitle: 'The journey begins under warm sunshine among gentle number blossoms!',
      theme: 'meadow'
    },
    {
      chapter: 2,
      name: 'Addition Ascent',
      subtitle: 'Climb the winding green hills where numbers stack higher and higher!',
      theme: 'hills'
    },
    {
      chapter: 3,
      name: 'Subtraction Shore',
      subtitle: 'Listen to the calm waves wash away bubbles one by one along the beach!',
      theme: 'shore'
    },
    {
      chapter: 4,
      name: 'Subtraction Summit',
      subtitle: 'Brave the chilly mountaintops to subtract tricky numbers from above!',
      theme: 'mountain'
    },
    {
      chapter: 5,
      name: 'Harmony Hills',
      subtitle: 'Addition and subtraction dance together across breezy pastures!',
      theme: 'pasture'
    },
    {
      chapter: 6,
      name: 'Multiplication Grove',
      subtitle: 'Magical trees bloom with clusters of multiplying fairy bubbles!',
      theme: 'grove'
    },
    {
      chapter: 7,
      name: 'Times Table Peak',
      subtitle: 'Scale the soaring stone towers by mastering multiplication charts!',
      theme: 'castle'
    },
    {
      chapter: 8,
      name: 'Division Lagoon',
      subtitle: 'Dive deep into crystal waters to share and divide shimmering gems!',
      theme: 'lagoon'
    },
    {
      chapter: 9,
      name: 'Operation Oasis',
      subtitle: 'Unravel ancient math puzzles where all four operations unite!',
      theme: 'oasis'
    },
    {
      chapter: 10,
      name: 'Grandmaster Galaxy',
      subtitle: 'Blast off to the stars and claim the crown of the Ultimate Math Hero!',
      theme: 'galaxy'
    }
  ];

  static getChapterData(worldIndex) {
    const idx = Math.max(0, Math.min(9, worldIndex - 1));
    return GameState.CHAPTER_DATA[idx];
  }

  constructor() {
    this.highScore = 0;
    this.unlockedLevel = 1;
    this.totalLevels = 100;
    this.levelStars = {}; // { 1: 3, 2: 2, ... }
    this.levelHighScores = {};
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.load();
  }

  getWorldForLevel(level) {
    return Math.min(10, Math.max(1, Math.ceil(level / 10)));
  }

  getWorldName(worldIndex) {
    return GameState.WORLD_NAMES[worldIndex - 1] || `World ${worldIndex}`;
  }

  getWorldStars(worldIndex) {
    let stars = 0;
    const start = (worldIndex - 1) * 10 + 1;
    const end = Math.min(this.totalLevels, worldIndex * 10);
    for (let l = start; l <= end; l++) {
      stars += (this.levelStars[l] || 0);
    }
    return stars;
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.highScore = data.highScore || 0;
        this.unlockedLevel = Math.max(1, data.unlockedLevel || 1);
        this.levelStars = data.levelStars || {};
        this.levelHighScores = data.levelHighScores || {};
        this.musicEnabled = data.musicEnabled !== undefined ? data.musicEnabled : true;
        this.sfxEnabled = data.sfxEnabled !== undefined ? data.sfxEnabled : true;
      }
    } catch (e) {
      console.warn('Could not load game state from localStorage:', e);
    }
  }

  save() {
    try {
      const data = {
        highScore: this.highScore,
        unlockedLevel: this.unlockedLevel,
        levelStars: this.levelStars,
        levelHighScores: this.levelHighScores,
        musicEnabled: this.musicEnabled,
        sfxEnabled: this.sfxEnabled
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save game state to localStorage:', e);
    }
  }

  recordLevelScore(level, score, stars) {
    if (score > this.highScore) {
      this.highScore = score;
    }
    const currentHigh = this.levelHighScores[level] || 0;
    if (score > currentHigh) {
      this.levelHighScores[level] = score;
    }
    const currentStars = this.levelStars[level] || 0;
    if (stars > currentStars) {
      this.levelStars[level] = stars;
    }

    if (level === this.unlockedLevel && this.unlockedLevel < this.totalLevels) {
      this.unlockedLevel = level + 1;
    }
    this.save();
  }

  setAudio(music, sfx) {
    this.musicEnabled = music;
    this.sfxEnabled = sfx;
    this.save();
  }

  resetProgress() {
    this.highScore = 0;
    this.unlockedLevel = 1;
    this.levelStars = {};
    this.levelHighScores = {};
    this.save();
  }
}

export const gameState = new GameState();
