# Pax Mediterranea Issue Register

This register documents all defects and usability issues discovered during the black-box playtest of **Pax Mediterranea**. Issues are ordered by **Severity** (Blocker, Critical, Major, Moderate, Minor) and **Priority** (P0, P1, P2, P3).

---

## Blocker Issues

### PM-GAME-001: Campaign Victory Condition Not Triggered at End of Turn 6
* **Category:** Gameplay / Campaign
* **Severity:** Blocker
* **Priority:** P0
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** Campaign (Scenario I: *The Sicilian Question*)
* **Preconditions:** Carthage must control Sicily at the end of Turn 6.
* **Steps to reproduce:**
  1. Click "Campaign", then "Begin match".
  2. On Turn 1, click the Infantry unit in Carthage and move it to Sicily.
  3. Spend Turn 2 to 6 reinforcing Sicily and passing the turn.
  4. On Turn 6, ensure Carthage still has a unit in Sicily and click "End turn".
* **Current behaviour:** The match transitions to Turn 7, Carthage receives income, and the game loop continues indefinitely. No victory screen or campaign completion dialog is displayed.
* **Expected behaviour:** The match should immediately conclude at the end of Turn 6, verifying Carthage controls Sicily and showing a victory screen.
* **Frequency:** 100% (Always)
* **Player impact:** High. Players cannot complete the campaign mission or achieve victory, leaving the campaign unfinished and offering no payoff for success.
* **Evidence:** [PM-campaign-end-screen.png](evidence/screenshots/PM-campaign-end-screen.png) (shows Turn 7 active despite controlling Sicily).
* **Suggested improvement:** Fix the scenario victory evaluation logic in the engine to trigger the win condition immediately at the phase transition between Turn 6 and Turn 7.

---

## Critical Issues

### PM-GAME-002: Recruitment Target Destination Cannot Be Chosen by Player
* **Category:** Gameplay / UI-UX
* **Severity:** Critical
* **Priority:** P0
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** Campaign / Skirmish
* **Preconditions:** Carthage must control multiple eligible recruitment territories (e.g. Carthage port and Sicily city).
* **Steps to reproduce:**
  1. Advance to Turn 2 of the Campaign (Carthage controls both Carthage and Sicily).
  2. Select Sicily on the map (optionally).
  3. Click *Recruit Infantry* (cost 2) under the RECRUIT section in the bottom bar.
* **Current behaviour:** Clicking *Recruit Infantry* immediately deducts coins and places the Infantry unit inside Carthage port. The player is never prompted to select a placement territory, eligible territories are not highlighted, and pre-selecting Sicily beforehand is completely ignored.
* **Expected behaviour:** Clicking a recruit button should highlight all controlled ports/cities eligible for that unit type and wait for the player to click on an eligible territory to confirm placement.
* **Frequency:** 100% (Always)
* **Player impact:** Very High. Players cannot deploy units to newly captured territories (like Sicily) to reinforce them. Reinforcements must walk all the way from Carthage, making tactical city defense impossible.
* **Suggested improvement:** Modify the recruitment flow in the React UI: clicking a unit type should transition the UI into "placement mode" (highlighting legal port/city nodes as `legal`), and only execute the recruitment command when a valid node is clicked.

### PM-GAME-003: Clicking Enemy-Owned Legal Movement Targets Does Nothing (Attack Blocked)
* **Category:** Gameplay / UI-UX
* **Severity:** Critical
* **Priority:** P0
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** Campaign / Skirmish
* **Preconditions:** Carthage must have an active unit in Sicily and Magna Graecia must be owned by Rome (empty).
* **Steps to reproduce:**
  1. Advance to Turn 2 of the Campaign (Carthage has 1 active Infantry in Sicily).
  2. Click the Infantry unit in Sicily. Note that Magna Graecia is highlighted with the class `legal`.
  3. Click the Magna Graecia button.
* **Current behaviour:** Clicking Magna Graecia does absolutely nothing. The unit remains selected, the legal targets remain highlighted, and no movement, attack, or combat preview occurs. The action is silently ignored.
* **Expected behaviour:** Clicking Magna Graecia should either move the unit (capturing the empty enemy territory) or trigger the combat preview/attack confirmation overlay to resolve the attack.
* **Frequency:** 100% (Always)
* **Player impact:** Very High. The player is completely blocked from attacking or capturing enemy-owned territories across sea routes, even when highlighted as legal. This breaks offensive play.
* **Evidence:** [PM-combat-preview.png](evidence/screenshots/PM-combat-preview.png) (shows Magna Graecia highlighted as legal, but unit remains selected in Sicily).
* **Suggested improvement:** Fix the movement/attack handler in the UI. If a clicked territory is enemy-controlled, trigger the combat confirmation dialog or automatically execute the capture command if empty.

---

## Major Issues

### PM-UI-004: Lack of Interactive Tutorial Step Progression Check (Tutorial Stuck)
* **Category:** Instructions & Onboarding
* **Severity:** Major
* **Priority:** P1
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** Tutorial
* **Preconditions:** Start the Carthaginian tutorial.
* **Steps to reproduce:**
  1. Click "Tutorial", select Carthage and Baal Hammon.
  2. Click the Infantry unit in Carthage (step 1/4 completes, transitioning to step 2/4: "Move to a highlighted territory and capture it").
  3. Click Sicily to move the unit there.
* **Current behaviour:** The unit moves to Sicily and captures it. However, the tutorial tip is stuck on step 2/4 ("Move to a highlighted territory and capture it"). If the player clicks "End turn", the tutorial tip box disappears completely on Turn 2, failing to show steps 3 and 4.
* **Expected behaviour:** Moving the unit to Sicily should immediately trigger step 3/4. The tutorial tips should persist across turns to guide the player through recruiting, cards, and favors.
* **Frequency:** 100% (Always)
* **Player impact:** High. New players cannot complete the tutorial as intended, leaving them confused about cards, favors, and subsequent phases.
* **Suggested improvement:** Ensure the tutorial event listener correctly listens to unit movement and captures of neutral territories, and triggers the next tutorial state step.

### PM-UI-005: Lack of Historical Game Log / Feed History
* **Category:** UI & UX
* **Severity:** Major
* **Priority:** P1
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** All Modes
* **Preconditions:** Play any match.
* **Steps to reproduce:**
  1. Perform an action (e.g. recruit a unit, move a unit, or pass the turn).
  2. Look for the logs.
* **Current behaviour:** Only a single status message (e.g. "Carthage receives 5 coins.") is shown in a small `<p class="status">` element. There is no history log, chat log, or feed where past actions can be reviewed.
* **Expected behaviour:** A dedicated scrollable panel or dialog should keep a log of all game events (e.g. "Carthage recruited Infantry in Carthage", "Rome moved Cavalry from Campania to Rome", "Carthage captured Sicily").
* **Frequency:** 100% (Always)
* **Player impact:** High. The player cannot see what the AI did during its turn, making it extremely difficult to track enemy unit movements, card plays, and combat results.
* **Suggested improvement:** Add a "Log history" panel or button that opens a dialog showing the full serialized engine log list (`state.logs`).

---

## Moderate Issues

### PM-UI-006: Discrepancy Between Campaign Menu Objective and In-Game Objective Text
* **Category:** Instructions & Onboarding
* **Severity:** Moderate
* **Priority:** P2
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** Campaign (Scenario I: *The Sicilian Question*)
* **Preconditions:** Start the campaign.
* **Steps to reproduce:**
  1. Read the objective on the Campaign Selection screen ("Control Sicily at the end of turn 6").
  2. Click "Begin match" and start the game.
  3. Look at the top-left Panel Objective text.
* **Current behaviour:** The in-game Panel Objective text displays "OBJECTIVE Reach 8 Pax Points by holding and capturing strategic territories." which is the generic skirmish objective.
* **Expected behaviour:** The in-game objective text should match the scenario-specific objective: "Control Sicily at the end of turn 6."
* **Frequency:** 100% (Always)
* **Player impact:** Medium. It creates player confusion and gives the impression that the scenario rules were not properly loaded.
* **Suggested improvement:** Dynamically update the UI objective text element based on the loaded scenario definition.

### PM-UI-007: Direct Unit Selection Is Required but Map Buttons Are Large (Poor Target Priority)
* **Category:** UI & UX / Controls
* **Severity:** Moderate
* **Priority:** P2
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** All Modes
* **Preconditions:** Any unit must be present on a territory.
* **Steps to reproduce:**
  1. Try selecting a unit by clicking directly on the territory button (e.g., the word "Carthage").
  2. Try selecting the unit by clicking the unit emoji (`♟`) inside the button.
* **Current behaviour:** Clicking the territory button does not select the unit and instead deselects any active selection. The player is forced to click exactly on the small unit emoji span.
* **Expected behaviour:** Clicking a territory containing a unit should automatically select that unit (or present a selection menu if multiple exist), as the territory button represents the major click target.
* **Frequency:** 100% (Always)
* **Player impact:** Medium. It makes selection finicky, frustrating, and counter-intuitive, especially on mobile devices or smaller screens where unit emojis are very small tap targets.
* **Suggested improvement:** Delegate click event handling: clicking a territory button should check if it has units, and if so, select the first active unit.

### PM-MULTI-011: Online Multiplayer Room Is a Non-Functional Screen Stub
* **Category:** Multiplayer
* **Severity:** Moderate
* **Priority:** P2
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** Main Menu (Online Room)
* **Preconditions:** Click "Online Room" from the main menu.
* **Steps to reproduce:**
  1. Click "Online Room" on the main menu.
  2. Enter a room code and click "Join room".
* **Current behaviour:** The screen displays a static room code form and a "Join room" button that does nothing, as it is just an offline demonstrator stub.
* **Expected behaviour:** Since the multiplayer features are not implemented in the static build, this screen should either be hidden behind a "Coming Soon" banner or disabled.
* **Frequency:** 100% (Always)
* **Player impact:** Medium. Players expect to play online but find a broken/stub screen, leading to a feeling of incomplete development.
* **Suggested improvement:** Clearly label the screen as "Multiplayer Draft / Coming Soon" and disable the form inputs.

---

## Minor Issues

### PM-GAME-008: Starting Territories Do Not Grant Initial Pax Points (Income/Pax Discrepancy)
* **Category:** Gameplay / Balance
* **Severity:** Minor
* **Priority:** P3
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** All Modes
* **Preconditions:** Start any match.
* **Steps to reproduce:**
  1. Start a new match as Carthage.
  2. Observe starting Pax Points (`0/8 PAX`) even though Carthage controls Carthage, Iberia, and Numidia.
  3. Move unit to Sardinia (Hills) on Turn 1.
  4. Note that Pax Points immediately increase to `1/8 PAX`.
* **Current behaviour:** Starting territories do not contribute to the initial Pax Points total, but capturing a new territory of the same type immediately adds Pax Points.
* **Expected behaviour:** If Pax Points are calculated by territory ownership, the starting territories should either grant points initially (e.g. start with `3/8 PAX` for Carthage, Numidia, Iberia) or the rules should explain that starting territories are excluded from the score.
* **Frequency:** 100% (Always)
* **Player impact:** Low. It is a minor scoring inconsistency.
* **Suggested improvement:** Align starting territory value with the scoring rules, or clarify the score calculation in the help screens.

### PM-UI-009: Visual Overlap and Poor Text Readability on Territories with Multiple Units
* **Category:** Graphics & UI
* **Severity:** Minor
* **Priority:** P3
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** All Modes
* **Preconditions:** Stacking multiple units in one territory.
* **Steps to reproduce:**
  1. Recruit 3-4 units in Carthage port.
  2. Observe the territory button text.
* **Current behaviour:** Stacked units are displayed as a raw text string of emojis (e.g., `⚓ Carthage ♟ ♟ ♞ ♟`) inside the button. This stretches the button width and overflows or overlaps adjacent elements on smaller screen resolutions.
* **Expected behaviour:** Stacked units should be grouped or displayed using a clean graphical badge/counter (e.g. a small shield icon with "3x Infantry, 1x Cavalry").
* **Frequency:** 100% (Always)
* **Player impact:** Low. It affects screen readability and visual appeal but does not block gameplay.
* **Suggested improvement:** Replace inline text emojis with an overlay badge listing unit counts when multiple units occupy a territory.

### PM-AUDIO-010: Total Lack of Audio / Sound Feedback
* **Category:** Audio
* **Severity:** Minor
* **Priority:** P3
* **Environment:** Deployed (Chrome Headless)
* **Mode or campaign mission:** All Modes
* **Preconditions:** Start the game.
* **Steps to reproduce:**
  1. Turn up the speaker volume.
  2. Play the game, recruit, move, win battles, click buttons.
* **Current behaviour:** The game is completely silent. No sound effects are played for selections, movements, battles, or victories, and there is no background music.
* **Expected behaviour:** Subtle, historical atmospheric background music and simple acoustic feedback (e.g., sword clashing for battles, coin clinking for recruit/income, drum beats for moves) should be played.
* **Frequency:** 100% (Always)
* **Player impact:** Low. It makes the game feel dry and prototype-like.
* **Suggested improvement:** Integrate standard Web Audio API sounds for UI clicks, moves, recruitments, and battles.
