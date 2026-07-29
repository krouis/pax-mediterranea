# Multiplayer

`MultiplayerTransport` separates room transport from deterministic rules. It connects/disconnects,
sends signed and sequenced actions, emits actions/presence, and requests resync. `MockTransport`
supports tests and UI development without a service.

A future small WebSocket service should use random 6–8 character room codes, temporary player IDs,
readiness, timers, reconnect tokens, bounded state snapshots, origin checks, rate limits, and
message-size limits. It must reject duplicates, gaps, version mismatches, invalid names, and every
action rejected by the authoritative engine. Never trust client state. Configure its URL through an
environment variable; never commit secrets. Static solo, campaign, tutorial, and hot-seat builds
remain independent.

Until that service ships, the Online Room screen honestly labels itself as unavailable (a "Coming
soon" badge on the heading, plain-language explanatory text, a disabled Join button) and offers
direct buttons to Quick Skirmish and Local Hot Seat instead of presenting a non-functional flow as
usable.
