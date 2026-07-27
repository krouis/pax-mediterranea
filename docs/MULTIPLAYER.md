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
