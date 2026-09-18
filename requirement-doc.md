# Product Requirements Document (PRD): Equation Bubbles

## 1. Project Overview & Scope
* **Application Name:** Equation Bubbles
* **Genre:** Educational Puzzle Game
* **Target Audience:** Children ages 4–10
* **Core Loop:** Players identify and tap floating bubbles containing math equations that evaluate to a specific target number before time expires.
* **Target Platforms:** Android Mobile and Android Tablet.

## 2. Technical Stack & Architecture
* **Rendering Engine:** PixiJS (v8).
* **Deployment Wrapper:** Capacitor (for native Android APK/AAB builds and hardware access).
* **Persistence:** HTML5 `localStorage` for saving high scores, level progression, and audio preferences.
* **Audio Pipeline:** Web Audio API. Generate simple oscillator beeps (sine/square waves) for UI clicks, correct pops, and error buzzes to avoid relying on external audio files.

## 3. Strict Development Constraints (Agent Instructions)
* **Zero External Assets:** The project must not load any `.png`, `.jpg`, `.svg`, `.mp3`, or `.wav` files. 
* **Procedural Paper-Craft Aesthetics:** All visual elements must be drawn entirely using `PIXI.Graphics` vector rendering.
  * **Torn Edges:** Generate UI panels and bubbles using `drawPolygon` with randomized coordinate offsets to simulate jagged, hand-cut scissor edges.
  * **Layered Depth:** Duplicate every primary UI polygon, apply a coordinate offset (e.g., `x: 6, y: 6`), fill it with `0x000000`, and set `alpha: 0.2` to create hard cast shadows that simulate stacked craft paper.
* **Typography System:** Utilize native web fonts (like Caveat or Arial) loaded via CSS and rendered exclusively through `PIXI.Text` objects to mimic handwritten marker text.

## 4. Device Optimization & Responsiveness
* **Canvas Fluidity:** Configure the PixiJS Application with `resizeTo: window` and `autoDensity: true` to ensure the canvas natively scales its internal coordinate system across all Android aspect ratios (16:9 phones, 4:3 tablets) without stretching.
* **Safe Area Padding:** Calculate the layout relative to the `window.innerWidth` and `window.innerHeight`. Apply dynamic padding to the top UI header to prevent obstruction by Android camera notches or system navigation bars.
* **Input Handling:** Bind all interactions exclusively to `pointerdown` and `pointerup` events. Do not use `click` events to prevent the native 300ms touch delay on Android screens.
* **Orientation Lock:** Utilize the `@capacitor/screen-orientation` plugin to lock the application state strictly to Portrait mode upon initialization.

## 5. Application Flow & Screen Specifications
* **Main Menu Screen:**
  * Render a brown background with procedurally generated low-alpha micro-dots to simulate cardboard texture.
  * Interactive paper-craft buttons for "PLAY" and "SETTINGS".
* **Settings & Parental Gate Modal:**
  * Toggles for SFX and Music.
  * **Parental Gate Logic:** Prevent access to data deletion (reset progress) unless the user correctly answers a complex multiplication prompt (e.g., "Confirm: 7 x 6 = ?") via a generated numpad.
* **Level Selection Screen:**
  * Draw a scrolling canvas with a dotted `lineStyle` path connecting numbered `drawCircle` nodes.
  * Read progression state from `localStorage` to lock/unlock specific nodes, applying a gray fill color to locked stages.
* **Core Gameplay Screen:**
  * **Top HUD:** Display Target Number, Timer (counting down), and Lives (3 hearts drawn via `drawPolygon`).
  * **Play Area:** Spawn bubbles containing text equations just below the bottom of the screen bounds.
* **Game Over Results Modal:**
  * Inject a black `PIXI.Graphics` rectangle across the full screen with `alpha: 0.7` to dim the gameplay state.
  * Display a centralized paper panel with the Final Score, High Score update logic, and navigation buttons.

## 6. Core Mechanics & Game Logic
* **Equation Generator:** Create a dynamic function that accepts a level parameter and outputs an array containing one correct equation (matching the target) and three incorrect equations. Restrict math operations (addition only for Level 1, subtraction introduced in Level 3, etc.).
* **Buoyancy Physics:** In the PixiJS `Ticker` loop, update the `y` position of each bubble by a negative velocity factor, and apply `Math.sin()` to the `x` position relative to time to simulate natural drifting.
* **Collision & Hit Detection:** Calculate distance using the Pythagorean theorem between the pointer's local coordinates and the center `x/y` of the bubble container.
* **Particle Emitter System:** Upon a successful tap, immediately destroy the bubble container. Instantiate an array of 8-12 small `PIXI.Graphics` triangles at the destruction coordinates. In the render loop, exponentially increase their radial velocity and decrease their `alpha` to 0 over 30 frames to create a paper-shred explosion.
* **Error Handling:** Tapping an incorrect equation must trigger a screen shake effect (tweening the main gameplay container's `x` position back and forth rapidly) and remove one life from the HUD.