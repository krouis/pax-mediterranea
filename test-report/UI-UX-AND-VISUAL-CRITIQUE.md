# Pax Mediterranea UI/UX and Visual Critique

This document provides a detailed critique of the visual design, information architecture, navigation, controls, and responsiveness of **Pax Mediterranea**.

---

## Major Critique Items

### 1. Direct Unit Selection Target Area
* **What is currently shown:** Emojis representing units (e.g., `♟` or `♞`) are wrapped in a tiny `<span>` element inside the larger map territory button. To move a unit, the player must click precisely on the small emoji span; clicking the main territory button does nothing or deselects.
* **Why it creates a problem:** The target click area is extremely small (less than 15x15 pixels). On high-resolution screens or mobile touchscreens, this makes unit selection highly frustrating, finicky, and prone to misclicks.
* **What a normal player is likely to understand:** Clicking the territory button itself should select the unit present on that territory.
* **What should be communicated instead:** The territory button acts as the parent container for the units, so clicking any part of the territory button should select the unit.
* **Concrete improvement direction:** Delegate click events on the territory button: if a unit is present inside the territory and no unit is currently active, clicking the territory button should select the unit. If a unit is already selected, click should trigger movement.

### 2. Stacked Unit Text Overlap
* **What is currently shown:** When multiple units occupy a territory, they are rendered inline as raw text character emojis inside the button (e.g. `⚓ Carthage ♟ ♟ ♞ ♟`).
* **Why it creates a problem:** Stacking units increases the width of the territory button, stretching it horizontally. This distorts the map layout, overlaps adjacent buttons, and makes counting units at a glance difficult and unpolished.
* **What a normal player is likely to understand:** The unit characters look like a rendering bug or overlapping text strings.
* **What should be communicated instead:** A clean, organized stack representation that shows the counts of each unit type clearly without altering the button's dimensions.
* **Concrete improvement direction:** Replace inline emojis with a small absolute-positioned badge on the corner of the territory button. The badge should list unit icons with counters (e.g., `3x ♟`, `1x ♞`).

### 3. Lack of Historical Game Log / Action Feed
* **What is currently shown:** Only a single status message (e.g. `Carthage receives 5 coins.`) is shown in a small text container in the bottom panel.
* **Why it creates a problem:** The player has no idea what actions the Roman AI performed during its turn. If a territory changes owner or a unit disappears, the player has to scan the entire map to deduce what happened.
* **What a normal player is likely to understand:** The game state is changing dynamically but without any explanation or transparency, making the AI's turn feel like a "black box."
* **What should be communicated instead:** A scrollable log history showing exactly what actions, movements, recruitments, and card plays occurred in chronological order.
* **Concrete improvement direction:** Implement a collapsible log drawer or sidebar panel that lists the history of all processed game state commands (`state.logs`).

### 4. Contradictory Campaign Objective Panel
* **What is currently shown:** During the campaign scenario *The Sicilian Question*, the top-left Panel Objective text displays: "OBJECTIVE Reach 8 Pax Points by holding and capturing strategic territories." This contradicts the campaign screen objective ("Control Sicily at the end of turn 6").
* **Why it creates a problem:** Players are confused about how to win, leading them to chase Pax points instead of focusing on defending Sicily, or to believe that the campaign scenario was not loaded properly.
* **What a normal player is likely to understand:** They must reach 8 Pax Points to achieve victory.
* **What should be communicated instead:** "OBJECTIVE Control Sicily at the end of Turn 6."
* **Concrete improvement direction:** Update the component that renders the top-left objective text to check if a scenario is active, and if so, render the scenario's custom objective description instead of the default skirmish string.

### 5. Instantaneous Combat and Movement (No Visual Impact)
* **What is currently shown:** When a unit moves or attacks, it teleport-moves instantly. Battles resolve in a single frame with defeated units immediately disappearing from the board with no visual transition or effects.
* **Why it creates a problem:** The gameplay feels flat, static, and lacking impact. There is no visual feedback or dramatic tension during crucial battles.
* **What a normal player is likely to understand:** A unit simply ceased to exist, leaving them to manually verify if the attack succeeded, stalemated, or failed.
* **What should be communicated instead:** A combat event occurred, showing the relative strengths, the dice variance (if any), and the clear outcome of the battle.
* **Concrete improvement direction:** Introduce simple CSS micro-animations: unit translation transitions for movement, shake animations and flashing red colors for combat, and a brief battle result overlay card showing the math (e.g., `Infantry (2) vs Plains City (1) = Carthage Victory!`).

---

## Design and Aesthetic Assessment

### 1. Readability and Visual Hierarchy
* **Assessment:** The layout is generally readable and clean. The absolute positioning of territories creates a recognizable graph of the Mediterranean basin. However, there is a lack of a clear visual hierarchy. Faction stats, recruit options, cards, and map nodes all share similar font sizes and flat border designs.
* **Improvement:** Introduce a sidebar for stats/deities and keep the map central. Use varying font weights (e.g., Outfit or Inter font) to distinguish headers from body text.

### 2. Terrain and Faction Color Coding
* **Assessment:** Territories are colored by owner: Carthage (`owner-p1` is red/orange?), Rome (`owner-p2` is purple?), and neutral (`owner-neutral` is gray/beige). The color-plus-symbol approach is excellent for accessibility.
* **Improvement:** Faction colors should be more vibrant and historically resonant (e.g. Tyrian purple for Carthage, Roman imperial red for Rome).

### 3. Historical Mediterranean Identity
* **Assessment:** The visual presentation uses text emojis (`♟`, `♞`, `⛵`, `⚓`, `▲`, `✦`, `▦`, `♒`, `≈`, `·`) which feels prototype-like. While it achieves accessibility, it lacks an authentic ancient Mediterranean board-game aesthetic.
* **Improvement:** Replace generic unicode emojis with custom SVG icons (e.g., a Hoplon shield for Infantry, a gladius for attack, a classic Roman galley/trireme for Fleet, and a Punic symbol for Carthage).

### 4. Audio Quality and Atmosphere
* **Assessment:** Currently 0/10. The complete silence is the weakest part of the presentation, stripping away any potential atmosphere.
* **Improvement:** Add ambient sounds of waves, marching soldiers, clashing swords, and coin collection. Even a simple retro synth-brass soundtrack would significantly enhance immersion.
