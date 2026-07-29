# Game design

Pax Mediterranea is a short territorial strategy game between a handheld tactics game and a premium
board game. Turns should take 30 seconds to two minutes. The player reviews the map, receives one
currency (Coins), recruits one of three permanent unit types, moves or attacks, optionally uses one
card or favor, then ends the turn.

The vertical slice uses 8 Pax Points as its score victory and avoids mandatory elimination.
Carthage earns trade income and tactical flexibility; Rome receives discounted infantry. Cards and
patrons create faction identity without separate technology trees. Randomness is absent in
Competitive rules and small, visible, and seeded in Classic rules.

The scope deliberately excludes grand-strategy administration, large unit trees, real-time action,
complex diplomacy, open chat, advertising, monetization, and tracking.

## Default AI

The default opponent plays every turn's action phase to completion rather than a single move: it
scores every legal move/attack across all of its ready units (favoring only attacks it would win,
weighted toward capturing valuable and scenario-objective territory), recruits at controlled
cities/ports up to a garrison-sized cap, spends cards (economic cards for coins, others to refresh
an already-acted unit for another action), and invokes favor when available, before ending its
turn. It never receives hidden information, illegal actions, or bonus resources — only a better
view of the same legal action space the player has. On the compact 12-territory quick map this can
still reach a stable frontier where neither side has a further favorable move; expanding the map
(Roadmap item 2) is the intended lever for deeper mid/late-game AI-vs-AI variety, not hand-tuning
the heuristic further. The guided tutorial's opponent is an exception: it stays passive so the
fixed-name script ("recruit in Carthage") cannot be invalidated by the opponent capturing a
referenced territory.
