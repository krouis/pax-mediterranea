# Map format

A map is an array of territories with stable ID, localized name key, terrain, normalized 0–100
position, reciprocal connection IDs, optional owner/capital/major flags, and scenario overlays.
Validators reject duplicates, missing/asymmetric connections, invalid coordinates, and unsupported
terrain.

Sea/port edges must make fleet routes explicit; land connections must remain visually readable at
mobile scale. Quick maps target 20–35 nodes after playtesting; the 12-node slice is a tutorial-scale
foundation, not the final quick-map size.
