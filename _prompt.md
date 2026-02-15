# City Builder — Game Design Prompt

You are creating a City Builder game for the ForkArcade platform. It's a turn-based strategy game where the player founds a settlement, places buildings on a grid, manages resources, and shapes the city's story through narrative choices.

## File Architecture

| File | What to do |
|------|-----------|
| `data.js` | Modify — add buildings, events, narrative nodes, sounds |
| `city.js` | Modify — grid generation, placement logic, turn processing |
| `events.js` | Modify — event effects, milestone triggers, choice resolution |
| `render.js` | Modify — all visual layers, HUD layout, dialogs |
| `main.js` | Modify — input handling, click routing, game loop |
| Engine files | DO NOT MODIFY |
| `forkarcade-sdk.js` | DO NOT MODIFY |

## Core Mechanics

### Grid System
- 20×15 tile grid, 40px per tile → 800×600 playable area
- Canvas is 1000×800 total (extra space for HUD at bottom)
- Terrain types determine what can be built where
- Map is procedurally generated: mostly plains, forests around edges, a few hills, 1-2 ruins, water on borders

### Terrain Types

| Terrain | Buildable | Notes |
|---------|-----------|-------|
| Plains | Yes | Default buildable tile |
| Forest | No (clearable) | Click to clear → becomes plains + yields 2 wood |
| Hills | Restricted | Only quarries can be built here |
| Water | No | River/lake borders, purely decorative |
| Ruins | No | Narrative discovery point, triggers story |

### Resources

| Resource | Source | Use |
|----------|--------|-----|
| Gold | Markets, traders | Building costs, tribute |
| Food | Farms | Population sustenance (1 food per 5 pop per turn) |
| Wood | Lumber Mills, clearing forest | Building material (most buildings) |
| Stone | Quarries | Advanced building material |
| Population | Huts (max capacity) | Workers for buildings |
| Happiness | Taverns, Chapels, events | Narrative triggers, negotiation power |

Resource caps start at 50/50/50/50 (gold/food/wood/stone). Warehouses add +50 each.

### Buildings

| Building | Cost | Workers | Production/Effect | Terrain | Unlock |
|----------|------|---------|-------------------|---------|--------|
| Hut | 5 wood | 0 | +5 max population | Plains | — |
| Farm | 3 wood | 2 | +4 food/turn | Plains | — |
| Lumber Mill | 5 wood | 2 | +3 wood/turn | Plains | — |
| Quarry | 8 wood | 3 | +2 stone/turn | Hills | — |
| Market | 8 wood, 5 stone | 3 | +5 gold/turn | Plains | — |
| Warehouse | 10 wood | 1 | +50 all resource caps | Plains | — |
| Tavern | 10 wood, 5 stone | 2 | +2 happiness/turn | Plains | — |
| Chapel | 15 wood, 10 stone | 1 | +3 happiness/turn | Plains | — |
| Watchtower | 12 wood, 8 stone | 2 | +1 defense | Plains | — |
| Town Hall | 30 wood, 20 stone, 10 gold | 3 | Unlocks advanced buildings | Plains | — |
| Library | 25 wood, 15 stone | 2 | +1 knowledge | Plains | Town Hall |
| Walls | 40 stone | 0 | +3 defense | Plains | Town Hall |

### Turn System

Each turn executes in order:
1. **Assign workers** — allocate population to buildings (first-placed buildings get priority)
2. **Production** — active buildings produce resources (capped by storage)
3. **Food consumption** — `floor(population / 5)` food consumed
4. **Starvation check** — if food < 0, lose 2 population, food set to 0
5. **Random event** — 20% chance per turn
6. **Milestone check** — narrative progression triggers
7. **Victory/defeat check**

### Placement Rules
- Must be on correct terrain (see table above)
- Tile must not have a building already
- Must have enough resources
- Some buildings require Town Hall to be built first (`unlockCondition`)
- Forest tiles must be cleared before building (click forest → clear → yields wood)

### Worker Assignment
- Each building needs `populationRequired` workers to be active
- Inactive buildings don't produce
- Workers assigned in build order (oldest buildings first)
- If population drops, newest buildings go inactive first

## Narrative System

This is the key differentiator — a rich story told through milestones and choices.

### Narrative Graph

```
founding → first_shelter → first_harvest → strangers_arrive [CHOICE]
→ the_ruins [CHOICE] → first_winter → growing_town → bandit_threat [CHOICE]
→ town_hall_built → the_scholar → festival → crossroads [CHOICE] → legacy
```

### Milestone Triggers

| Node | Trigger Condition |
|------|-------------------|
| `founding` | Game start |
| `first_shelter` | First building placed |
| `first_harvest` | First farm built |
| `strangers_arrive` | Population ≥ 10 |
| `the_ruins` | Build adjacent to ruins tile OR click ruins |
| `first_winter` | Turn 10 |
| `growing_town` | Population ≥ 25 |
| `bandit_threat` | Turn 20 |
| `town_hall_built` | Town Hall building placed (via narrativeTrigger) |
| `the_scholar` | Library building placed (via narrativeTrigger) |
| `festival` | Tavern + Chapel built AND population ≥ 30 |
| `crossroads` | Turn 40 |
| `legacy` | Victory condition met |

### Choices

**strangers_arrive** — "Travelers seek refuge in your growing settlement."
- A: "Welcome them" → +5 population, +5 max population, +200 narrative_bonus
- B: "Turn them away" → +5 food, no bonus

**the_ruins** — "Your people discover ancient ruins. Strange symbols cover the walls."
- A: "Study the ruins" → +300 narrative_bonus, narrative flavor
- B: "Sell the artifacts" → +20 gold, no bonus

**bandit_threat** — "Bandits have been spotted near the settlement!"
- A: "Build defenses" → requires ≥1 watchtower, +400 narrative_bonus
- B: "Pay tribute" → -15 gold, +100 narrative_bonus
- C: "Negotiate" → requires happiness ≥ 15, +200 narrative_bonus

**crossroads** — "Your settlement stands at a crossroads. What will define its future?"
- A: "Trade hub" → +10 gold/turn permanent bonus, +300 narrative_bonus
- B: "Fortress" → +5 defense permanent bonus, +400 narrative_bonus
- C: "Center of learning" → +500 narrative_bonus (highest)

### Narrative Display
- Text appears in a semi-transparent bar at the top of the canvas
- Fades out over 4 seconds (`life: 4000`)
- Color varies by node (gold for choices, purple for story, orange for warnings)
- Choice dialogs are modal — block all other input until resolved

### Narrative Variables (tracked via FA.narrative.setVar)
```
population, buildings_count, turns, happiness,
welcomed_strangers (bool), studied_ruins (bool),
defense_choice (string), city_identity (string),
narrative_bonus (cumulative integer)
```

## Random Events

| Event | Effect | Sound |
|-------|--------|-------|
| Drought | -4 food | danger |
| Traveling Traders | +10 gold | pickup |
| Plague | -5 population (min 1) | danger |
| Ancient Discovery | Reveal nearest ruins tile | levelup |
| Bandit Raid | -15 gold if defense = 0 | danger |
| Good Harvest | +8 food | pickup |
| Wandering Workers | +3 population (if max allows) | levelup |

Events show name as floating text. Effects applied immediately.

## Scoring

```
score = (population × 10) + (buildings × 50) + (gold × 2) + (turns × 5) + narrative_bonus
```

Maximum narrative_bonus: 200 + 300 + 400 + 500 = 1400 (if making the "best" choices).

## Victory & Defeat

**Victory**: population ≥ 50 AND buildings ≥ 30 AND turns ≥ 40 AND Town Hall built.
**Defeat**: population drops to 0.

On game end: calculate score, emit `game:over`, submit via `ForkArcade.submitScore()`.

## Rendering Guide

### Layer Architecture

| Order | Layer | Content |
|-------|-------|---------|
| 0 | screens | Start screen / end screen (only when active) |
| 1 | terrain | Grid of colored tiles with terrain characters |
| 5 | buildings | Building characters/sprites on tiles |
| 10 | selection | Yellow border on selected tile |
| 15 | buildCursor | Green/red preview following mouse in build mode |
| 20 | narrative | Top bar with story text (fading) |
| 25 | choiceDialog | Centered modal with option buttons |
| 30 | hud | Bottom panel: resources, build menu, End Turn |
| 35 | effects | Floating text (damage numbers, resource changes) |

### HUD Layout (bottom 120px)
- Left: resource values (Gold, Food, Wood, Stone) with icons/colors
- Center: Population, Happiness, Turn counter
- Right: "End Turn" button
- Bottom row: build menu — clickable building buttons with names and costs

### Sprite Fallback
Always provide fallback character + color:
```javascript
FA.draw.sprite('buildings', 'hut', x, y, 32, 'H', '#8b4513', 0);
```

### Color Coding
- Gold resources: `#ffd700`
- Food: `#ff8c00`
- Wood: `#8b4513`
- Stone: `#708090`
- Population: `#ffffff`
- Happiness: `#ff69b4`
- Danger/negative: `#ff4444`
- Narrative: `#c8b4ff`
- Choices: `#ffd700`

## Input Handling

This is a turn-based game — NO real-time input (`FA.isHeld()` not used).

All interaction via mouse clicks:
1. Click grid tile → select tile OR place building (if build mode active) OR clear forest
2. Click build menu button → toggle build mode for that building type
3. Click "End Turn" button → process turn
4. Click choice option → resolve narrative choice
5. Click on start/end screen → transition

Keyboard:
- `R` — restart (only on end screen)
- `Escape` — cancel build mode
- `E` — end turn shortcut

## Adding Content

### New Building (in data.js)
```javascript
FA.register('buildings', 'mill', {
  name: 'Windmill',
  description: 'Advanced food production',
  cost: { wood: 12, stone: 6 },
  populationRequired: 3,
  production: { food: 6 },
  unlockCondition: 'town_hall_built',
  terrain: ['plains'],
  char: 'W',
  color: '#daa520',
  narrativeTrigger: null
});
```

### New Event (in data.js)
```javascript
FA.register('events', 'eclipse', {
  name: 'Solar Eclipse',
  text: 'Darkness covers the land. The people are frightened.',
  effect: function(state) {
    state.resources.happiness = Math.max(0, state.resources.happiness - 3);
    FA.playSound('danger');
  }
});
```

### New Narrative Node
1. Add to graph config in data.js (nodes + edges)
2. Register narrative text: `FA.register('narrativeText', 'nodeId', { text, color })`
3. Add milestone trigger in events.js `checkMilestones()`
4. If choice node: register choice with options

## What to Avoid

- Do NOT use `FA.isHeld()` — this is turn-based, not real-time
- Do NOT modify engine files
- Do NOT add a physics system — buildings are static
- Do NOT render every tile every frame if performance is an issue — consider dirty flag
- Do NOT put logic in data.js — only declarations and simple effect functions
- Do NOT hardcode pixel positions for HUD — calculate from config values
- Do NOT skip the narrative — it's the core feature of this template
