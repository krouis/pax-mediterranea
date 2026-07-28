# Pax Mediterranea Game Design Critique

This document presents an expert game-design evaluation of **Pax Mediterranea**, assessing its core loop, mechanics, turn structure, combat system, economy, and strategic depth.

---

## 1. Verified Defects
The following design elements are confirmed to be technically bugged and actively break the intended gameplay mechanics:
* **Broken Victory Triggers:** The campaign scenario cannot be successfully concluded because the victory condition at the end of Turn 6 does not trigger.
* **Locked Recruitment Targeting:** Cities other than the capital cannot be targeted for recruitment, making the capture of strategic cities like Sicily economically valuable (for income and Pax points) but tactically useless for frontline reinforcements.
* **Blocked Sea Attack Routes:** Undefended enemy ports (like Magna Graecia) cannot be captured across sea zones, locking players from offensive maritime strategies.

---

## 2. Repeated Playtest Observations
These observations were consistently noted across multiple simulated runs and playthroughs:
* **AI Passivity:** The Roman AI is non-aggressive. It does not actively recruit new units, does not cross sea zones, and does not contest Carthage's capture of Sicily. Matches lack tension because the AI is essentially static after Turn 1.
* **Deterministic Combat Predictability:** Because combat is 100% deterministic (attacker strength vs defender strength + terrain, higher wins), the outcome of every fight is known before clicking. This removes all element of surprise or risk, making battles feel like simple mathematical computations rather than tense tactical engagements.
* **Recruitment Sick Unit Delay:** Recruited units are flagged as `(already acted)` immediately upon purchase. This is a solid design choice that prevents players from buying a unit and attacking with it on the same turn, which would lead to indefensible blitz strategies.

---

## 3. Subjective Design Opinions
These assessments represent professional design critiques of the game's core loop and balance:
* **The Core Loop is Elegant:** The loop of *Income -> Recruit -> Move and Act -> End Turn* is streamlined, intuitive, and highly reminiscent of successful lightweight board games (such as *Risk* or *Conqueror*). It can be learned by a new player in under 3 minutes.
* **Faction Asymmetry is Well Balanced:** 
  * **Carthage** has a strong maritime economic focus, receiving +1 coin when controlling ports. This encourages naval play and holding ports.
  * **Rome** receives a 1-coin discount on their first infantry recruitment, encouraging a swarm/citizen levy strategy.
  * This starting asymmetry is historically flavorful and creates distinct playstyles.
* **Card Integration feels Tactile:** Cards like *War Elephants* (+2 attack on plains) and *Hannibal Barca* (+1 attack for land armies) are simple numerical modifiers, but they provide the player with powerful tactical "bursts" that can turn the tide of a battle.
* **Favor/Morale Mechanic:** Spending 3 Favor to invoke Baal Hammon/Jupiter is a great way to represent public morale and faith. It provides a strategic secondary currency that is not overpowered.

---

## 4. Hypotheses Requiring Additional Player Testing
These design hypotheses should be validated with user playtests before final tuning:
* **Is 8 Pax Points Too Low?** Since capturing a normal territory gives 1 Pax Point and cities give 2, Carthage can easily reach 8 Pax Points by Turn 4-5 simply by spreading out and capturing empty neutral spaces. 8 Pax Points may make matches end too quickly, reducing the viability of long-term economic strategies. We suggest testing 10 or 12 Pax Points as the target score.
* **Starting Territory Scoring Consistency:** It is mathematically inconsistent that Carthage starts with 3 territories but 0 Pax points, while capturing a 4th immediately gives +1 Pax point. Players might find this confusing. We hypothesize that starting the match with Pax points already matching starting territories (e.g. start at `3/8 PAX` for Carthage, Numidia, Iberia) would feel more logical.
* **Need for a "Fleet Transport" Limit:** Currently, a single Fleet in the Balearic Isles allows land units to move across the sea to multiple territories in the same turn without any transport limit. We hypothesize that adding a transport capacity limit (e.g., a Fleet can only transport 1 land unit per turn) would add interesting tactical constraints and increase the value of building multiple Fleets.
