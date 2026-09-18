# Equation Bubbles - Living Project Encyclopedia

## 1. Project Overview & Scope
* **Application Name:** Equation Bubbles
* **Genre:** Educational Puzzle Game
* **Target Audience:** Children ages 4–10
* **Core Loop:** Players identify and tap floating paper bubbles containing math equations that evaluate to a specified target number before time runs out.
* **Target Platforms:** Web (desktop/mobile) & Android via Capacitor.
* **Aesthetic Identity:** Procedural Paper-Craft & Scrapbook style — torn scissor edges, cardboard corrugation, tape strips, folded origami hearts, pushpins, and marker typography.

## 2. Technical Stack & Architecture
* **Rendering Engine:** PixiJS (v8.x).
* **Build System:** Vite (ES Modules).
* **Audio Engine:** Pure Web Audio API Synthesizer (`AudioSynth.js`) for zero-asset dynamic audio (sine/sweep pops, bell chords, error buzzes, ambient pentatonic music box).
* **Data & Persistence:** HTML5 `localStorage` (`GameState.js`) for storing high scores, 3-star level ratings, unlocked levels, and audio preferences.
* **Assets Policy:** **Strict Zero External Assets**. All textures, UI widgets, icons, shapes, and audio are procedurally rendered in vector code (`PaperCraft.js`) or synthesized in code.

## 3. Project Structure
```
├── .agents/                    # Workspace agent guidelines & skills
├── screens/                    # Reference visual mockups
│   ├── Gemini_Generated_Image_k0pywzk0pywzk0py.png   # Main Menu
│   ├── Gemini_Generated_Image_gp95sygp95sygp95.png   # Level Select
│   ├── Gemini_Generated_Image_rpkkx2rpkkx2rpkk(2).png # Gameplay HUD & Bubbles
│   ├── Gemini_Generated_Image_f8vsssf8vsssf8vs.png   # Settings & Parental Gate
│   └── Gemini_Generated_Image_rt27v7rt27v7rt27.png   # Results / Game Over Modal
├── src/
│   ├── audio/
│   │   └── AudioSynth.js       # Web Audio API procedural sound & music engine
│   ├── game/
│   │   ├── EquationGenerator.js # Progressive math equation engine (12 levels)
│   │   └── GameState.js        # Progression, scores, stars, storage
│   ├── graphics/
│   │   └── PaperCraft.js       # Procedural torn paper, cardboard, tape, pins, buttons
│   ├── scenes/
│   │   ├── MainMenuScene.js    # Cardboard title screen with 3D letters & preview bubbles
│   │   ├── LevelSelectScene.js # Winding dotted path with pushpins & 3-star badges
│   │   ├── GameScene.js        # Core gameplay, floating physics, pop bursts, confetti
│   │   ├── SettingsModal.js    # Notepad modal, switches, parental gate numpad
│   │   └── ResultsModal.js     # Taped score sheet, replay, and highscore
│   ├── SceneManager.js         # State machine & transition manager
│   └── main.js                 # PixiJS v8 Application bootstrap & resizing
├── index.html
├── package.json
└── PROJECT_INFO.md
```

## 4. Visual Elements & Paper Craft Specifications
* **Torn Edge Algorithm:** Perturbed vertices along polygon perimeters using pseudo-random offset step variations.
* **Layered Shadows:** Secondary polygon at `(+5px, +7px)` with `alpha: 0.22` in `0x000000` to create cardboard depth.
* **Tape Strips:** Semi-transparent parchment polygons (`0xf7f2e4`, `alpha: 0.68`) with jagged cut ends.
* **Pushpins:** Metal needle (`0x8c8c8c`) + colorful conical plastic head with highlight ellipse and cast shadow.
* **Hearts:** Folded origami paper hearts with dual-tone shading split along the vertical axis.
* **Comic Pop Banner:** Jagged yellow/orange starburst with bold `"POP!"` and equation label.
* **Confetti Particles:** 12-16 spinning triangular paper shreds fading over 30-40 frames.
* **Anti-Overlap Physics:** Pairwise circle-circle elastic repulsion algorithm preventing bubble clipping or stacking.
* **Target Guarantee Invariant:** Dynamic per-frame validation ensuring at least one visibly floating bubble matches `this.currentTarget` at all times.
* **Child-Friendly Typography:** Upright bold typography (`Fredoka` & `Comic Neue`) with 2.5px white contrast stroke ensuring clear visibility of digits across all paper tones.
* **Level Progression Modal:** Includes prominent "NEXT LEVEL ▶" button on level completion to advance immediately through stages 1 to 100.
* **100-Level Curriculum Engine:** Formulaic difficulty progression spanning 10 thematic worlds (10 levels each):
  1. *Starter Meadow (1–10):* Addition sums to 10.
  2. *Addition Ascent (11–20):* Teens addition and sums to 25.
  3. *Subtraction Shore (21–30):* Subtraction from numbers up to 10.
  4. *Subtraction Summit (31–40):* Subtraction from teens and numbers up to 25.
  5. *Harmony Hills (41–50):* Mixed addition & subtraction agility to 30.
  6. *Multiplication Grove (51–60):* Skip counting tables (2x, 5x, 10x).
  7. *Times Table Peak (61–70):* Full 1–10 multiplication tables.
  8. *Division Lagoon (71–80):* Fair sharing and division basics (÷ 2, 3, 5, 10).
  9. *Operation Oasis (81–90):* All 4 operations (+, -, ×, ÷).
  10. *Grandmaster Galaxy (91–100):* High-speed master mix across all operations to 50.
* **Cardboard Winding Trail Level Select (`LevelSelectScene.js`):**
  - **Cardboard Corkboard Canvas:** Textured cardboard backdrop (`Backgrounds.drawCardboard`) with torn paper scrap back button and taped world banner.
  - **World Navigation Tabs:** Interactive torn-paper sticky scrap buttons (`◀ PREV WORLD` and `NEXT WORLD ▶`) for cycling between the 10 thematic worlds.
  - **Winding Dotted S-Curve Path:** Dotted quadratic curve connecting 10 level node badges per world.
  - **Paper Node Badges:** Multi-layered circular paper badges featuring cast shadows, masking tape strips, colorful plastic pushpins (Yellow, Blue, Green), level number/padlock, and 3-star rating badges.
  - **Smooth Inertial Touch/Wheel Scrolling:** Smooth scrolling mechanics allowing players to navigate tall paths on both mobile and desktop.

## 5. Google AdMob & Monetization Architecture (`AdService.js`)
* **Plugin Architecture:** Powered by `@capacitor-community/admob` with native Android scaffolding in `android/`.
* **Designed for Families & COPPA Compliance:**
  - All ad requests strictly enforce `tagForChildDirectedTreatment: true`, `tagForUnderAgeOfConsent: true`, and `maxAdContentRating: MaxAdContentRating.G`.
  - Non-personalized ads (`npa: true`) strictly enforced.
* **Ad Formats & Placements:**
  1. **Sticky Bottom Banner:** Displayed on non-gameplay screens (`MainMenuScene`, `LevelSelectScene`). Automatically hidden via `AdService.hideBanner()` during gameplay so floating bubbles and math equations are never obscured.
  2. **Milestone Interstitial:** Triggered after level completion in `GameScene.handleLevelVictory()`. Enforces a 90-second minimum cooldown and a 3-level completion threshold to avoid interrupting children.
  3. **Rewarded Video Revive:** Voluntary player reward on Game Over in `ResultsModal.js` (`🎬 REVIVE (+3 ❤️)`). Watching an ad restores 3 hearts and extra time, continuing the current stage without losing score progress.
* **Zero-Crash Web Dev Fallback:** Seamless mock behavior when running in standard browser/Vite dev server, logging ad events and allowing uninterrupted testing without native hardware.

