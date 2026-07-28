# Pax Mediterranea Black-Box Test Report Index

This directory contains the deliverables of a comprehensive, expert black-box quality assurance review and gameplay analysis of **Pax Mediterranea**. The evaluation was performed on the deployed version of the game.

## Test Scope & Environment
* **Tested Build/URL:** [krouis.github.io/pax-mediterranea](https://krouis.github.io/pax-mediterranea/)
* **Local Codebase:** `/home/krs/dev/krs/pax-mediterranea` (inspected for project metadata only after gameplay tests)
* **Execution Environment:** Headless Chromium via Playwright, viewport size 1280x720, running in a sandbox environment.
* **Campaign Status:** Played to completion (all 6 turns of Campaign Scenario I: *The Sicilian Question* were completed, but a blocker defect prevented the victory screen/match conclusion from triggering, forcing progression into Turn 7).

---

## Deliverables Index

Click on the links below to access the specific reports:

1. **[Executive Summary & Principal Report](PAX-MEDITERRANEA-BLACK-BOX-REPORT.md)**  
   Contains the executive summary, first-time player journey, game scores, strongest/weakest qualities, and final release recommendation.
2. **[Campaign Playthrough Journal](CAMPAIGN-PLAYTHROUGH.md)**  
   Provides a detailed, turn-by-turn log of Campaign Scenario I (*The Sicilian Question*), noting objectives, strategic execution, AI behaviors, and blocker defects.
3. **[Detailed Issue Register](ISSUES.md)**  
   A complete list of the 11 discovered defects categorized by gameplay, AI, UI/UX, graphics, and audio, complete with severity levels, reproduction steps, player impact, and suggested fixes.
4. **[Game Design Critique](GAME-DESIGN-CRITIQUE.md)**  
   An expert evaluation of the core loop, turn structure, combat mechanics, economy, cards, pantheon favors, and strategic depth.
5. **[UI/UX & Visual Critique](UI-UX-AND-VISUAL-CRITIQUE.md)**  
   A detailed analysis of information architecture, map readability, controls responsiveness, typography, accessibility, and visual assets consistency.
6. **[CSV Issue Register (Summary)](ISSUES.csv)**  
   A structured tabular register of all logged defects for engineering import.

---

## High-Level Findings & Release Recommendation

* **Current Quality Level:** The game is a playable vertical slice or **Closed Alpha**. It has a functional and solid core logic engine (serializable state, deterministic combat, local hot seat, i18n localization including RTL Arabic).
* **Blocker/Critical Issues:**
  1. The campaign scenario victory check is broken—reaching the end of Turn 6 with Carthage in control of Sicily fails to end the match.
  2. Recruitment targeting is completely broken—players cannot select where to place units; it always defaults to Carthage capital port.
  3. Attack actions on empty enemy-owned ports/cities across the sea zone are ignored by the game engine, preventing strategic progression.
* **Overall Release Recommendation:** **Closed Alpha** (or Internal Prototype). The game needs core logic bug fixes in recruitment, combat attacks, and victory triggers before it is ready for public beta testing.

---

## Evidence Directory
All captured visual evidence and screenshots are stored under:
* `test-report/evidence/screenshots/`
  * [PM-menu.png](evidence/screenshots/PM-menu.png) - English main menu
  * [PM-menu-fr.png](evidence/screenshots/PM-menu-fr.png) - French main menu
  * [PM-menu-ar.png](evidence/screenshots/PM-menu-ar.png) - Arabic main menu (RTL)
  * [PM-tutorial-start.png](evidence/screenshots/PM-tutorial-start.png) - Tutorial selection screen
  * [PM-tutorial-board.png](evidence/screenshots/PM-tutorial-board.png) - Tutorial turn 1 board state
  * [PM-campaign-start.png](evidence/screenshots/PM-campaign-start.png) - Campaign selection screen
  * [PM-campaign-t1-start.png](evidence/screenshots/PM-campaign-t1-start.png) - Campaign turn 1 start state
  * [PM-campaign-end-screen.png](evidence/screenshots/PM-campaign-end-screen.png) - Campaign turn 7 start state showing blocker (no victory trigger)
  * [PM-combat-preview.png](evidence/screenshots/PM-combat-preview.png) - Turn 2 combat attack selection hang
