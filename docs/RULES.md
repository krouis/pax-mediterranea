# Rules

## Objective

Reach 8 Pax Points by capturing neutral/enemy territories and holding major cities or capitals.
Scenario objectives may override this; _The Sicilian Question_ asks Carthage to hold Sicily.

## Turn

Income is paid from cities, major cities, capitals, ports, and faction bonuses. Draw at most one
card up to a hand of three. Recruit in a controlled city (land units) or port (all units). During
the action phase, each unit moves or attacks once. Play an eligible card or spend 3 Favor, then end
the turn. The UI streamlines phase confirmation while preserving the explicit engine phases.

## Units and movement

- Infantry costs 2, captures reliably, and defends well.
- Cavalry costs 3, attacks strongly on plains, and is weaker in hills, mountains, and cities.
- Fleets cost 4, recruit in ports, and move between sea/port nodes.

Move only along visible connections. Land units cannot enter sea; fleets cannot enter inland
terrain. Entering unoccupied neutral land captures it. Occupied or enemy territory requires attack.

## Terrain and combat

Plains have no defense modifier; hills, cities, ports, and sacred sites add 1; mountains add 2. A
preview shows `unit attack + situational modifier` against `defending units + terrain`. Higher
strength wins; lower strength loses the attacker; equality is a stalemate. Competitive play is
deterministic. Classic may resolve close fights with a visible seeded variation.

Example: infantry (2 attack) entering an undefended city (1 defense) wins. Cavalry attacking a city
loses 1 attack and should seek open ground.

## Economy, cards, and favor

Carthage's Merchant Republic adds 1 Coin when it controls a port. Rome's first infantry discount is
represented by a 1-Coin reduction. One card is normally played per turn; the slice includes leader,
special-force, mobility, and economic effects. Patron favors cost 3 Favor and provide modest income,
protection/resolve, or prestige—never literal destructive magic.

Baal Hammon and Tanit are available to Carthage; Jupiter and Juno to Rome. Favor represents public
belief, morale, ritual, and legitimacy.
