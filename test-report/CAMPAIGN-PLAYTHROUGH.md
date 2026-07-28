# Campaign Playthrough Journal: The Sicilian Question

This document registers the step-by-step black-box playtest of the available campaign scenario *The Sicilian Question*. 

## Scenario Overview
* **Faction Played:** Carthage (Merchant Republic)
* **Patron Deity:** Baal Hammon (Prosperity and civic endurance)
* **Scenario Objective (Menu):** Control Sicily at the end of turn 6.
* **Scenario Objective (In-Game Panel):** Reach 8 Pax Points by holding and capturing strategic territories.
* **Starting Territories:** Carthage (Port, 1 Infantry), Numidia (Plains, Empty), Iberia (Hills, Empty).

---

## Turn-by-Turn Playthrough Log

### Turn 1
* **Objective as understood:** Capture Sicily.
* **Carthage Actions:**
  1. Selected Carthage Infantry (`♟` inside `⚓ Carthage` button).
  2. Moved unit to `▦ Sicily` (neutral city). The move was legal because Carthage has a Fleet in the adjacent `≈ Balearic Isles` sea zone.
  3. Played the *Merchant Fleet* card from hand (+2 coins, hand size goes to 2/3).
  4. Ended turn.
* **Roman AI Actions:**
  1. Moved Campania Cavalry (`♞`) to Rome (`▦ Rome`).
  2. Moved Rome Infantry (`♟`) to Corsica (`▲ Corsica`).
* **Turn 1 Outcome:** Carthage controls Sicily (`2/8 PAX`, 10 coins remaining).

### Turn 2
* **Objective as understood:** Recruit defense forces and expand.
* **Carthage Actions:**
  1. Carthage receives 5 coins income. Total: 15 coins.
  2. Clicked *Recruit Infantry* (costs 2). Unit automatically placed in Carthage.
  3. Clicked *Recruit Cavalry* (costs 3). Unit automatically placed in Carthage.
  4. Attempted to move Sicily Infantry to `⚓ Magna Graecia` (Rome-controlled, empty). The UI highlighted Magna Graecia as `legal`. However, clicking it did absolutely nothing. The action was ignored by the engine. (See bug [PM-GAME-003](ISSUES.md#pm-game-003)).
  5. Ended turn.
* **Roman AI Actions:**
  1. No observable unit movements. Rome Cavalry remained in Rome, Rome Infantry remained in Corsica.
* **Turn 2 Outcome:** Carthage holds Sicily with 1 Infantry, and Carthage port has 1 Infantry (already acted) and 1 Cavalry (already acted). Total coins: 10.

### Turn 3
* **Objective as understood:** Move Carthage reinforcements to Sicily.
* **Carthage Actions:**
  1. Carthage receives 5 coins income. Total: 15 coins (Wait, starting coins showed 18 due to a potential calculation bug [PM-GAME-008](ISSUES.md#pm-game-008)).
  2. Selected Carthage Infantry and moved to `▦ Sicily`.
  3. Selected Carthage Cavalry and moved to `▦ Sicily`.
  4. Ended turn.
* **Roman AI Actions:**
  1. Passive. No movements.
* **Turn 3 Outcome:** Sicily is heavily defended with 2 Infantry and 1 Cavalry. Carthage port is empty.

### Turn 4
* **Objective as understood:** Recruit more units.
* **Carthage Actions:**
  1. Clicked *Recruit Infantry* (cost 2, placed in Carthage).
  2. Ended turn.
* **Roman AI Actions:**
  1. Passive. No movements.
* **Turn 4 Outcome:** Carthage port has 1 Infantry. Sicily has 2 Infantry, 1 Cavalry.

### Turn 5
* **Objective as understood:** Move reinforcements to Sicily.
* **Carthage Actions:**
  1. Selected Carthage Infantry and moved to `▦ Sicily`.
  2. Ended turn.
* **Roman AI Actions:**
  1. Passive.
* **Turn 5 Outcome:** Sicily has a massive defensive stack: 3 Infantry, 1 Cavalry.

### Turn 6
* **Objective as understood:** Hold Sicily on the final turn to trigger victory.
* **Carthage Actions:**
  1. Ended turn directly (Carthage has 33 coins, 2 Pax points, massive defense in Sicily).
* **Roman AI Actions:**
  1. Passive. No movements.
* **Turn 6 Outcome:** Turn 6 ends with Carthage in full, uncontested control of Sicily.

### Turn 7 (Bug State)
* **Observed Behavior:**
  - The game transitions to Turn 7.
  - No victory screen, dialog, or banner appears.
  - The match continues indefinitely, allowing Carthage to recruit and move.
* **Turn 7 Outcome:** Scenario failed to conclude due to blocker [PM-GAME-001](ISSUES.md#pm-game-001).

---

## Campaign Assessment

### 1. Objective Clarity
* **Critique:** Highly confusing. The campaign description explicitly tasks the player with controlling Sicily at the end of turn 6. However, the in-game UI displays a generic objective: "Reach 8 Pax Points." This objective discrepancy makes first-time players doubt whether they are playing the campaign scenario or a standard skirmish match.

### 2. Difficulty and Pacing
* **Critique:** The scenario is extremely easy and paced poorly. Because Carthage starts with access to Sicily, and the Roman AI does not attempt to contest Sicily or cross the sea, the player wins the objective on Turn 1 and simply waits. There is zero tension.

### 3. AI Observations
* **Critique:** The Roman AI is incredibly passive. On Turn 1, it consolidates its cavalry to Rome and sends its infantry to Corsica. After that, it makes no strategic decisions. It does not recruit units, does not move towards Carthage or Sicily, and does not leverage its ships or ports. It acts like a static script.

### 4. UI/UX Observations
* **Critique:**
  * Selecting units is frustrating because clicking the territory button does not select the unit inside it. The player must click the tiny unit character (`♟`).
  * The status text is not historically logging. It only says "Carthage receives 5 coins," offering no clue that Rome ended its turn.
  * Stacked units (`♟ ♟ ♞ ♟`) appear as a raw text string inside the territory button, making it look unpolished.

### 5. Progression and Replayability
* **Critique:** The campaign currently contains only one scenario ("The Sicilian Question"). Replayability is non-existent due to the passive AI, the lack of strategic choices (only one viable path: capture Sicily on T1 and wait), and the fact that the victory screen is broken.

### 6. Summary Evidence
* Starting Scenario: [PM-campaign-start.png](evidence/screenshots/PM-campaign-start.png)
* Turn 1 Board: [PM-campaign-t1-start.png](evidence/screenshots/PM-campaign-t1-start.png)
* Bugged Turn 7 End: [PM-campaign-end-screen.png](evidence/screenshots/PM-campaign-end-screen.png)
