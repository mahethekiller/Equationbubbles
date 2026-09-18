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
* **Fairytale Adventure Storybook (`LevelSelectScene.js`):**
  - **Open Fairytale Book:** Rendered over a rich mahogany wood desk (`Backgrounds.drawWoodTable`) with leather hardcover casing, gold corner brackets, layered parchment pages, center spine crease with stitches, and red satin ribbon bookmark.
  - **Chapter Story Narrative:** Each world features an illuminated chapter title placard with whimsical 1-sentence kid story prompts (`GameState.CHAPTER_DATA`) and gold star progress badge.
  - **Treasure Map Trail & Procedural Landmarks:** S-curve winding dotted trail decorated with procedural origami pine trees (`createOrigamiTree`), folded paper mountain peaks (`createPaperMountain`), milestone castles with waving pennants (`createCastleTurret`), and gold treasure chests (`createTreasureChest`).
  - **Active Level Marker:** Waving red `"HERE!"` pin flag (`createPlayerPinFlag`) mounted on the player's active unlocked stage.
  - **Dog-Eared Corner Page Turns:** Interactive folded paper corner buttons (`◀ CH. X` and `CH. Y ▶`) with realistic paper-turn audio (`audioSynth.playPageTurn()`) and page flip animation.

