# City Builder — ForkArcade

Turn-based city builder on a square grid with resource management, building placement, and rich narrative with branching choices.

## File Structure

| File | Role | Modify? |
|------|------|---------|
| `fa-engine.js` | Core engine (event bus, state, loop, registry) | NO |
| `fa-renderer.js` | Canvas, layers, draw helpers, camera | NO |
| `fa-input.js` | Keyboard/mouse input | NO |
| `fa-audio.js` | Web Audio, procedural sounds | NO |
| `fa-narrative.js` | Narrative graph, variables, transitions | NO |
| `forkarcade-sdk.js` | Platform SDK (scoring, auth) | NO |
| `data.js` | All data registrations (config, buildings, terrain, events, narrative, sounds) | YES |
| `city.js` | City logic: grid, placement, resources, turns | YES |
| `events.js` | Random events, milestones, choice system | YES |
| `render.js` | Rendering layers: terrain, buildings, UI, HUD, narrative | YES |
| `main.js` | Entry point: input, game loop, ForkArcade integration | YES |

## Engine API (window.FA)

### Event Bus
- `FA.on(event, fn)` — subscribe
- `FA.off(event, fn)` — unsubscribe
- `FA.emit(event, data)` — emit

### State
- `FA.resetState(obj)` — reset entire state
- `FA.getState()` — get state object (mutable reference)
- `FA.setState(key, val)` — set single key

### Registry
- `FA.register(category, key, data)` — register definition
- `FA.lookup(category, key)` — get by key
- `FA.lookupAll(category)` — get all in category (object)

### Game Loop
- `FA.setUpdate(fn)` — set update callback. **dt is in milliseconds** (~16.67ms)
- `FA.setRender(fn)` — set render callback
- `FA.start()` / `FA.stop()`

### Canvas & Drawing
- `FA.initCanvas(id, w, h)` — initialize canvas
- `FA.getCtx()` / `FA.getCanvas()`
- `FA.addLayer(name, drawFn, order)` — add render layer (lower order = background)
- `FA.renderLayers()` — render all layers in order
- `FA.draw.clear(color)` — clear canvas
- `FA.draw.rect(x, y, w, h, color)`
- `FA.draw.strokeRect(x, y, w, h, color, lineWidth)`
- `FA.draw.text(str, x, y, opts)` — opts: `{ color, size, bold, align, baseline }`
- `FA.draw.bar(x, y, w, h, fill, opts)` — progress bar
- `FA.draw.circle(x, y, r, color)`
- `FA.draw.sprite(category, key, x, y, size, fallbackChar, fallbackColor, frame)`
- `FA.draw.withAlpha(alpha, fn)` — temporary alpha
- `FA.draw.withClip(x, y, w, h, fn)` — clipping region

### Input
- `FA.bindKey(action, keys)` — bind keys to action name
- `FA.isAction(action)` — single-frame press
- `FA.isHeld(action)` — continuous hold (not used in turn-based)
- `FA.getMouse()` — `{ x, y }`
- `FA.consumeClick()` — consume-once click
- `FA.clearInput()` — clear per-frame state

### Audio
- `FA.defineSound(name, fn(actx, dest))` — register procedural sound
- `FA.playSound(name)` — play sound
- Built-in sounds: `hit`, `pickup`, `death`, `step`, `spell`, `levelup`
- Auto-play: `entity:damaged` → hit, `entity:killed` → death

### Effects & Floats
- `FA.addFloat(x, y, text, color, durationMs)` — floating text
- `FA.updateFloats(dt)` / `FA.drawFloats()`
- `FA.addEffect(obj)` / `FA.updateEffects(dt)`

### Narrative
- `FA.narrative.init(cfg)` — initialize with graph config
- `FA.narrative.transition(nodeId)` — move to node
- `FA.narrative.setVar(name, val, reason)` — set variable
- `FA.narrative.getVar(name)` — get variable
- `FA.narrative.currentNode` — current node ID

### Utils
- `FA.rand(min, max)` — random integer [min, max]
- `FA.clamp(val, min, max)`
- `FA.pick(arr)` — random element
- `FA.shuffle(arr)` — in-place shuffle
- `FA.uid()` — unique ID string

## City API (window.City)

| Method | Description |
|--------|-------------|
| `initGrid(w, h)` | Create tile grid with procedural terrain |
| `getTile(grid, x, y)` | Get tile at grid coords, null if out of bounds |
| `canPlace(buildingId, x, y, state)` | Returns `{ valid, reason }` |
| `placeBuilding(buildingId, x, y, state)` | Place building, deduct resources, emit `city:built` |
| `clearForest(x, y, state)` | Convert forest to plains, yield wood |
| `processTurn(state)` | Full turn: production, consumption, events, milestones |
| `assignWorkers(state)` | Allocate population to buildings |
| `calculateProduction(state)` | Returns resource delta `{ gold, food, wood, stone, happiness }` |
| `calculateDefense(state)` | Sum of defense from watchtowers + walls |
| `checkStarvation(state)` | Handle food < 0 |
| `checkVictory(state)` | Check win conditions |
| `calculateScore(state)` | Final score with narrative bonus |
| `startScreen()` | Reset to start screen |
| `beginGame()` | Init grid, resources, narrative, start playing |
| `endGame(state, outcome)` | Set victory/defeat, emit `game:over` |
| `showNarrative(nodeId)` | Display narrative text, transition graph |

## Events API (window.Events)

| Method | Description |
|--------|-------------|
| `rollRandomEvent(state)` | 20% chance to trigger random event |
| `triggerEvent(eventId, state)` | Execute event effect |
| `checkMilestones(state)` | Check narrative progression triggers |
| `showChoice(choiceId, state)` | Set `state.choiceDialog` for rendering |
| `resolveChoice(choiceId, optionIndex, state)` | Execute choice, advance narrative |

## Render API (window.Render)

| Method | Description |
|--------|-------------|
| `setup()` | Register all render layers |

### Layers (by order)
| Order | Name | Content |
|-------|------|---------|
| 0 | startScreen | Title, instructions |
| 0 | endScreen | Victory/defeat, score |
| 1 | terrain | Grid tiles with terrain colors |
| 5 | buildings | Building sprites on tiles |
| 10 | selection | Yellow highlight on selected tile |
| 15 | buildCursor | Green/red preview on hover |
| 20 | narrative | Top bar with narrative text (fade) |
| 25 | choiceDialog | Modal with choice buttons |
| 30 | hud | Resources, turn counter, build menu, End Turn button |
| 35 | effects | Floating text numbers |

## Game Events

| Event | Payload | When |
|-------|---------|------|
| `city:built` | `{ buildingId, x, y }` | Building placed |
| `city:turnEnd` | `{ turn }` | Turn processed |
| `city:starvation` | — | Population lost to hunger |
| `city:event` | `{ eventId }` | Random event triggered |
| `city:choice` | `{ choiceId }` | Choice dialog opened |
| `city:milestone` | `{ nodeId }` | Narrative milestone reached |
| `game:over` | `{ score, outcome }` | Game ended |

## Scoring

```
score = (population × 10) + (buildings × 50) + (gold × 2) + (turns × 5) + narrative_bonus
```

Narrative bonus from choices (cumulative):
- Welcome strangers: +200
- Study ruins: +300
- Build defenses: +400
- Center of learning identity: +500

## Data Registration Examples

### New Building
```javascript
FA.register('buildings', 'windmill', {
  name: 'Windmill',
  description: 'Grinds grain into flour',
  cost: { wood: 12, stone: 6 },
  populationRequired: 3,
  production: { food: 6 },
  unlockCondition: 'town_hall_built',
  terrain: ['plains'],
  char: 'W',
  color: '#daa520'
});
```

### New Event
```javascript
FA.register('events', 'harvest_festival', {
  name: 'Harvest Festival',
  text: 'The people celebrate a bountiful harvest!',
  effect: function(state) { state.resources.happiness += 5; }
});
```

### New Narrative Node
```javascript
FA.register('narrativeText', 'new_era', {
  text: 'Your city enters a new era of prosperity.',
  color: '#ffd700'
});
```

## Sprite Fallback Pattern

```javascript
// Always provide fallback char + color as last 2 params
FA.draw.sprite('buildings', 'hut', x, y, 32, 'H', '#8b4513');
FA.draw.sprite('terrain', 'forest', x, y, 16, 'T', '#228b22');
```

## Coordinate System

- Grid origin: top-left (0,0)
- Pixel position: `x * tileSize`, `y * tileSize`
- HUD occupies bottom `hudHeight` pixels (not part of grid)
- Click → grid: `Math.floor(mouseX / tileSize)`, `Math.floor(mouseY / tileSize)`

## Timing

- **dt is in milliseconds** (~16.67ms per tick at 60 FPS)
- All durations in ms: `life: 4000` = 4 seconds
- Turn-based: game logic runs on `processTurn()`, not on every frame
- Frame update only for: effects, floats, narrative fade
