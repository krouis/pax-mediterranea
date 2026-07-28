# Pax Mediterranea Black-Box Test Report

This is the principal quality assurance and UX review report for **Pax Mediterranea**, a turn-based strategy game inspired by the Punic Wars.

---

## 1. Executive Summary

### Quality Level & Playability
* **Status:** The game is currently in a **Closed Alpha** state. It has a fully functional core engine that implements deterministic rules, local save/reload persistence, and multi-language support (English, French, Arabic).
* **Playability:** The game is *partially playable*. While the quick skirmish mode and hot seat modes work, the campaign scenario cannot be won due to a victory check blocker, and key actions like city-specific recruitment and cross-sea attacks are broken.

### Strongest Parts
1. **Multi-language and RTL support:** The French and Tunisian Arabic translations are highly accurate and natural. Arabic RTL layout transitions are executed correctly by setting `dir="rtl"`.
2. **IndexedDB Save and Resume:** The local persistence works flawlessly, saving the board state and placing a "Continue" button on the main menu.
3. **Core Board-Game Mechanics:** The underlying ruleset (asymmetry, card play, deity favors, deterministic strength checks) is clean, elegant, and very easy to learn.

### Weakest Parts
1. **Critical Logic Bugs:** Blocker defects in campaign victory check, recruitment destination locking, and blocked attacks on empty enemy ports.
2. **AI Passivity:** The AI does not recruit units, make naval invasions, or actively contest objective regions, rendering solo play trivial.
3. **Audio and Visual Identity:** The game is completely silent and relies heavily on raw text emoji characters (`♟`, `♞`, `⛵`) instead of custom assets.

### Most Urgent Improvements
* Fix the campaign Turn 6 victory trigger.
* Allow players to choose the destination territory for recruited units.
* Implement a scrollable log history to track AI movements.

---

## 2. Test Scope & Environment
* **URL Tested:** [krouis.github.io/pax-mediterranea](https://krouis.github.io/pax-mediterranea/)
* **Browser:** Headless Chromium (Playwright automation)
* **Viewport Size:** 1280x720 (Desktop)
* **Modes Explored:** Campaign (The Sicilian Question), Tutorial (Carthage/Baal Hammon), Main Menu, i18n switcher, Online Room adapter.
* **Matches Played:** Approximately 5 campaign matches and tutorial runs, playing through 6+ turns each.
* **Blocked Features:** Online multiplayer room (is a non-functional screen stub).

---

## 3. First-Time Player Experience
1. **Opening the Game:** The landing page renders quickly and presents a beautiful, minimalist board-game style menu. The flag emojis and language switching options are immediately clear.
2. **Starting the Tutorial:** The civilization and patron selection screens are clean and offer good historical flavor.
3. **The Drop-Off Point (Tutorial):** The tutorial starts with tip 1/4: "Select a unit..." When the player clicks the unit, it advances to step 2/4. However, after moving the unit and capturing Sicily, the tutorial gets stuck on step 2/4. If the player ends the turn, the tutorial tips disappear completely. This breaks onboarding.
4. **First Skirmish/Campaign:** Once in a match, the player moves their units easily, but is immediately confused by the objective panel which reads "Reach 8 Pax Points" (contradicting the campaign goal) and finds selection target areas (tiny emojis) extremely annoying to click.

---

## 4. Overall Scores (1 to 10)

| Category | Score | Explanation |
| :--- | :---: | :--- |
| **Onboarding & Tutorial** | **4 / 10** | The layout is inviting, but the interactive tutorial tips are bugged, get stuck, and disappear prematurely. |
| **UI Clarity** | **5 / 10** | Map readability and colors are clean, but tiny unit click targets, inline stacking overflows, and a lack of action log drag down clarity. |
| **Game Mechanics** | **8 / 10** | Core rules (asymmetry, terrain modifiers, cards, favor) are excellent, highly functional, and easy to grasp. |
| **Strategic Depth** | **6 / 10** | Deterministic combat is great for tactical calculation, but the AI's passivity prevents strategic depth from being realized. |
| **AI Competency** | **2 / 10** | The AI is essentially a static dummy script that does not recruit, attack, or adapt. |
| **Pacing** | **7 / 10** | Turns are resolved instantly and matches are compact (10-25 mins). |
| **Visual Appeal** | **5 / 10** | Nice responsive CSS absolute layout, but placeholder-looking text unicode emojis reduce the visual quality. |
| **Audio & Music** | **0 / 10** | Completely silent. Total lack of background music and action sound effects. |
| **Faction Identity** | **7 / 10** | Carthage (ports/Baal/Tanit) and Rome (levy/Jupiter/Juno) feel distinct and asymmetric. |
| **Replayability** | **3 / 10** | Low. Skirmish vs passive AI becomes repetitive instantly, and the campaign victory check is broken. |
| **Fun Factor** | **5 / 10** | Fun to learn and execute initially, but the lack of AI challenge and audio makes it dry quickly. |
| **Overall Polish** | **4 / 10** | Marred by blocker and critical bugs in core gameplay loops. |

---

## 5. Top Priorities

### The 10 Most Important Problems
1. **PM-GAME-001 (Blocker):** Campaign victory does not trigger at the end of Turn 6.
2. **PM-GAME-002 (Critical):** Recruitment target cannot be chosen, always defaulting to Carthage.
3. **PM-GAME-003 (Critical):** Cross-sea attacks on empty enemy territories are ignored by the engine.
4. **PM-UI-004 (Major):** Tutorial gets stuck on step 2/4 and disappears on Turn 2.
5. **PM-UI-005 (Major):** Lack of a scrollable log history feed to track AI moves.
6. **PM-UI-006 (Moderate):** Objective discrepancy between campaign screen and in-game UI.
7. **PM-UI-007 (Moderate):** Unit selection requires clicking tiny emojis instead of territory buttons.
8. **PM-MULTI-011 (Moderate):** Online Room is a non-functional static stub.
9. **PM-GAME-008 (Minor):** Starting territories do not grant initial Pax Points.
10. **PM-UI-009 (Minor):** Stacked units stretch button text and overlap adjacent elements.

### The 5 Highest-Value Improvements
1. **Graphical SVG Assets:** Replace unicode text emojis (`♟`, `♞`, `⛵`) with custom vector graphics of soldiers, cavalry, and galleys.
2. **Acoustic UI Feedback:** Add sound effects (sword clash, coin clinking, marching) and a simple ancient-themed background music track.
3. **Collapsible History Log Drawer:** Add a scrollable history side-panel so players can see what occurred during the AI's turn.
4. **Tactile Recruitment Flow:** Transition the UI to "placement mode" when a recruit button is clicked, highlighting legal placement nodes.
5. **Combat Animations:** Introduce brief CSS movement transitions and shake effects during battles to increase visual impact.

### The 3 Strongest Qualities to Preserve
1. **Deterministic Strength Combat:** The RNG-free deterministic battle resolution is excellent for strategy players and should not be replaced by random dice.
2. **Seamless i18n & RTL:** The French and Tunisian Arabic translation engine and RTL layouts work perfectly and should be maintained.
3. **IndexedDB Save State:** The robust local persistence that allows resuming matches is a stellar PWA feature.

---

## 6. Release Recommendation: Closed Alpha

We recommend classifying the current build as a **Closed Alpha**. 
* **Rationale:** While the visual layout, i18n localization, and local save/load persistence are mature and ready for release, the core gameplay is blocked by logic defects: the campaign victory trigger is broken, the player cannot recruit in captured cities, and attacks across sea lanes on undefended ports fail. Furthermore, the AI is completely passive. The game is not ready for public beta testing until these critical bugs are resolved.

---

## 7. Associated Reports
For more details, consult the sub-reports:
* **[Campaign Playthrough Journal](CAMPAIGN-PLAYTHROUGH.md)**
* **[Detailed Issue Register](ISSUES.md)**
* **[Game Design Critique](GAME-DESIGN-CRITIQUE.md)**
* **[UI/UX and Visual Critique](UI-UX-AND-VISUAL-CRITIQUE.md)**
* **[CSV Issue Register](ISSUES.csv)**
