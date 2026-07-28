# Data Plan: Floor Plan & Components

> **Status:** Draft — pending Blender model

## Source of Truth

The **Blender model** defines all spatial data. A Python export script produces a single
`data/room.json` file committed to the repo. This JSON is the canonical layout description
for both simulation and kiosk modes.

## `data/room.json` — Schema (draft)

```jsonc
{
  "room": {
    "width": 8.6,        // metres (x-axis)
    "depth": 4.8,        // metres (z-axis)
    "height": 2.8        // metres (y-axis)
  },
  "walls": [
    { "id": "west",   "from": [0, 0], "to": [0, 4.8] },
    { "id": "north",  "from": [0, 0], "to": [8.6, 0] },
    { "id": "east",   "from": [8.6, 0], "to": [8.6, 4.8] }
  ],
  "curtains": {
    "walls": [
      { "id": "cw-west",  "from": [2.0, 0.8], "to": [2.0, 4.0] },
      { "id": "cw-north", "from": [2.0, 0.8], "to": [6.6, 0.8] },
      { "id": "cw-east",  "from": [6.6, 0.8], "to": [6.6, 4.0] }
    ],
    "doors": [
      { "id": "door-west", "position": [2.0, 3.8], "width": 0.8 },
      { "id": "door-east", "position": [6.6, 3.8], "width": 0.8 }
    ]
  },
  "components": [
    {
      "id": "mirror-1",
      "type": "mirror",
      "position": [0.0, 2.4, 1.4],
      "rotation_y": 0,
      "label": "West mirror"
    },
    {
      "id": "mirror-2",
      "type": "mirror",
      "position": [4.3, 2.4, 0.8],
      "rotation_y": 90,
      "label": "North mirror"
    },
    {
      "id": "mirror-3",
      "type": "mirror",
      "position": [8.6, 2.4, 1.4],
      "rotation_y": 180,
      "label": "East mirror"
    }
  ]
}
```

Coordinates are **metres**, origin at the south-west corner of the room,
y is up, z points north (towards the north wall at z=0 in screen coords
will need a mapping step — see Coordinate System below).

## Coordinate System

| Axis | Room space | Blender (default) | Screen (2D sim) |
|------|-----------|-------------------|-----------------|
| x    | x (east)  | x                 | x               |
| y    | y (up)    | z                 | —               |
| z    | z (north) | y                 | inverted y      |

The Blender export script will normalise everything to the room-space convention
above. The Flutter rendering layer maps room-space to screen-space.

## SQLite (drift) — Dev Mode Only

During development the simulation app reads `room.json` on startup and writes a local
`room_state.db` (drift). This lets us tweak positions live and save state without
re-exporting from Blender.

```
data/room.json  ──import──▶  drift DB (dev mode)
                                  │
                           live edits (sim UI)
                                  │
                           export back to JSON (optional)
```

### Tables (draft)

```sql
-- Mirrors, cameras, sensors, etc.
CREATE TABLE components (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,       -- mirror | camera | sensor | ...
  pos_x       REAL NOT NULL,
  pos_y       REAL NOT NULL,
  pos_z       REAL NOT NULL,
  rotation_y  REAL NOT NULL DEFAULT 0,
  label       TEXT
);

-- Walls and curtain segments
CREATE TABLE walls (
  id      TEXT PRIMARY KEY,
  kind    TEXT NOT NULL,           -- solid | curtain
  x1      REAL NOT NULL,
  z1      REAL NOT NULL,
  x2      REAL NOT NULL,
  z2      REAL NOT NULL
);

-- Curtain doors / openings
CREATE TABLE openings (
  id      TEXT PRIMARY KEY,
  wall_id TEXT REFERENCES walls(id),
  pos_x   REAL NOT NULL,
  pos_z   REAL NOT NULL,
  width   REAL NOT NULL
);
```

### Sync Rules

1. **App start (dev):** If DB empty → load `room.json` into drift. If DB has data → use drift (preserves live edits).
2. **"Reset" button:** Reloads from `room.json`, wipes drift.
3. **"Export" button (dev only):** Writes current drift state back to a `room_state.json` alongside the original.
4. **Kiosk mode:** Reads `room.json` directly into memory. No drift, no writes.

## Blender Export (future)

A Python script inside Blender will:
1. Read object positions, rotations, and custom properties.
2. Write `data/room.json` in the schema above.
3. Be run manually after layout changes (`blender --background --python export_room.py`).

The script and its expected Blender scene conventions will be documented once the model exists.

## Next Steps

- [ ] Build the Blender model (user)
- [ ] Finalise `room.json` schema based on actual model exports
- [ ] Add drift dependency to `pubspec.yaml`
- [ ] Create Dart data models (`lib/models/`)
- [ ] Create drift database class
- [ ] Build JSON ↔ drift import/export tooling
- [ ] Refactor `room_view.dart` to read from data layer instead of hardcoded values
