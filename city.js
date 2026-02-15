// City Builder — City Logic
// Grid initialization, building placement, resource management, turn processing
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');

  // =====================
  // PERLIN NOISE
  // =====================
  var _perm = [];
  function _initNoise(seed) {
    _perm = [];
    var s = seed || 42;
    for (var i = 0; i < 256; i++) {
      s = (s * 16807) % 2147483647;
      _perm.push(s & 255);
    }
  }
  function _hash2(ix, iy) {
    return _perm[(_perm[ix & 255] + iy) & 255] / 255;
  }
  function _noise2D(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    var a = _hash2(ix, iy), b = _hash2(ix + 1, iy);
    var c = _hash2(ix, iy + 1), d = _hash2(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function perlin2D(x, y, octaves, persistence) {
    var total = 0, maxVal = 0, amp = 1, freq = 1;
    for (var i = 0; i < (octaves || 3); i++) {
      total += _noise2D(x * freq, y * freq) * amp;
      maxVal += amp;
      amp *= (persistence || 0.5);
      freq *= 2;
    }
    return total / maxVal;
  }

  var City = {

    // =====================
    // GRID
    // =====================

    initGrid: function(w, h) {
      _initNoise(FA.rand(1, 999999));
      var grid = [];
      var noiseScale = 0.18;

      // Place ruins positions first
      var ruinsCount = FA.rand(1, 3);
      var ruinsPositions = [];
      for (var r = 0; r < ruinsCount; r++) {
        ruinsPositions.push({
          x: FA.rand(5, w - 5),
          y: FA.rand(4, h - 4)
        });
      }

      for (var y = 0; y < h; y++) {
        var row = [];
        for (var x = 0; x < w; x++) {
          var height = perlin2D(x * noiseScale, y * noiseScale, 4, 0.5);
          var terrain = this._terrainFromHeight(height);

          // Check ruins
          for (var ri = 0; ri < ruinsPositions.length; ri++) {
            if (x === ruinsPositions[ri].x && y === ruinsPositions[ri].y) {
              terrain = 'ruins';
              break;
            }
          }

          // Start area (center 5x4) is always plains and discovered
          var isStartArea = Math.abs(x - Math.floor(w / 2)) <= 2 && Math.abs(y - Math.floor(h / 2)) <= 2;
          if (isStartArea) {
            terrain = 'plains';
            height = FA.clamp(height, 0.3, 0.55);
          }

          row.push({
            x: x,
            y: y,
            terrain: terrain,
            height: height,
            variant: (x * 7 + y * 13) % 3,
            building: null,
            discovered: isStartArea || FA.rand(0, 100) < 70
          });
        }
        grid.push(row);
      }
      return grid;
    },

    _terrainFromHeight: function(h) {
      if (h < 0.22) return 'water';
      if (h < 0.62) return 'plains';
      if (h < 0.78) return 'forest';
      return 'hills';
    },

    getTile: function(grid, x, y) {
      if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return null;
      return grid[y][x];
    },

    // =====================
    // BUILDING PLACEMENT
    // =====================

    canPlace: function(buildingId, x, y, state) {
      var tile = this.getTile(state.grid, x, y);
      if (!tile) return { valid: false, reason: 'Out of bounds' };
      if (!tile.discovered) return { valid: false, reason: 'Not discovered' };
      if (tile.building) return { valid: false, reason: 'Tile occupied' };

      var bDef = FA.lookup('buildings', buildingId);
      if (!bDef) return { valid: false, reason: 'Unknown building' };

      var tDef = FA.lookup('terrain', tile.terrain);

      // Check unlock condition
      if (bDef.unlockCondition && !FA.narrative.getVar(bDef.unlockCondition)) {
        return { valid: false, reason: 'Requires Town Hall' };
      }

      // Check terrain buildable
      if (!tDef.buildable) {
        if (tDef.clearable) return { valid: false, reason: 'Clear forest first' };
        return { valid: false, reason: 'Cannot build here' };
      }

      // Check terrain restrictions (e.g. quarry on hills only)
      if (tDef.restrictedTo && tDef.restrictedTo.indexOf(buildingId) === -1) {
        return { valid: false, reason: 'Only ' + tDef.restrictedTo.join(', ') + ' here' };
      }
      if (bDef.terrain && bDef.terrain.indexOf(tile.terrain) === -1) {
        return { valid: false, reason: 'Wrong terrain' };
      }

      // Check resources
      if (bDef.cost) {
        for (var res in bDef.cost) {
          if ((state.resources[res] || 0) < bDef.cost[res]) {
            return { valid: false, reason: 'Need ' + bDef.cost[res] + ' ' + res };
          }
        }
      }

      return { valid: true };
    },

    placeBuilding: function(buildingId, x, y, state) {
      var check = this.canPlace(buildingId, x, y, state);
      if (!check.valid) return false;

      var bDef = FA.lookup('buildings', buildingId);
      var tile = this.getTile(state.grid, x, y);

      // Deduct costs
      if (bDef.cost) {
        for (var res in bDef.cost) {
          state.resources[res] -= bDef.cost[res];
        }
      }

      // Place building
      tile.building = {
        id: buildingId,
        def: bDef,
        active: true,
        builtTurn: state.turn
      };

      // Apply immediate effects
      if (bDef.effect) {
        if (bDef.effect.maxPopulation) {
          state.resources.maxPopulation += bDef.effect.maxPopulation;
        }
        if (bDef.effect.resourceCapBonus) {
          state.resourceCaps.gold += bDef.effect.resourceCapBonus;
          state.resourceCaps.food += bDef.effect.resourceCapBonus;
          state.resourceCaps.wood += bDef.effect.resourceCapBonus;
          state.resourceCaps.stone += bDef.effect.resourceCapBonus;
        }
        if (bDef.effect.defense) {
          state.defense = (state.defense || 0) + bDef.effect.defense;
        }
      }

      // Update count
      state.buildingCount = (state.buildingCount || 0) + 1;
      FA.narrative.setVar('buildings_count', state.buildingCount, 'Built ' + bDef.name);

      // Narrative trigger
      if (bDef.narrativeTrigger) {
        FA.narrative.setVar(bDef.narrativeTrigger, true, bDef.name + ' built');
      }

      FA.emit('city:built', { buildingId: buildingId, x: x, y: y });
      FA.playSound('build');

      var px = x * cfg.tileSize + cfg.tileSize / 2;
      var py = y * cfg.tileSize + cfg.tileSize / 2;
      FA.addFloat(px, py, bDef.name, bDef.color, 2000);

      return true;
    },

    clearForest: function(x, y, state) {
      var tile = this.getTile(state.grid, x, y);
      if (!tile || tile.terrain !== 'forest') return false;

      var tDef = FA.lookup('terrain', 'forest');
      tile.terrain = 'plains';

      if (tDef.clearYield) {
        for (var res in tDef.clearYield) {
          state.resources[res] = Math.min(
            state.resources[res] + tDef.clearYield[res],
            state.resourceCaps[res] || 999
          );
        }
      }

      FA.playSound('hit');
      var px = x * cfg.tileSize + cfg.tileSize / 2;
      var py = y * cfg.tileSize + cfg.tileSize / 2;
      FA.addFloat(px, py, '+' + (tDef.clearYield.wood || 0) + ' wood', '#8b4513', 2000);
      return true;
    },

    // =====================
    // TURN PROCESSING
    // =====================

    processTurn: function(state) {
      state.turn = (state.turn || 0) + 1;
      FA.narrative.setVar('turns', state.turn, 'Turn ' + state.turn);

      // 1. Assign workers
      this.assignWorkers(state);

      // 2. Production
      var prod = this.calculateProduction(state);
      for (var res in prod) {
        if (res === 'happiness') {
          state.resources.happiness = (state.resources.happiness || 0) + prod[res];
        } else {
          state.resources[res] = FA.clamp(
            state.resources[res] + prod[res],
            0,
            state.resourceCaps[res] || 999
          );
        }
      }

      // Crossroads bonus: trade hub gives +10 gold/turn
      if (FA.narrative.getVar('city_identity') === 'trade') {
        state.resources.gold = Math.min(
          state.resources.gold + 10,
          state.resourceCaps.gold || 999
        );
      }

      // 3. Food consumption
      var foodNeeded = Math.floor(state.resources.population / cfg.foodConsumptionRate);
      state.resources.food -= foodNeeded;

      // 4. Starvation
      if (state.resources.food < 0) {
        this.checkStarvation(state);
      }

      // 5. Population growth (slow, natural)
      if (state.resources.food > 10 && state.resources.population < state.resources.maxPopulation) {
        state.resources.population += 1;
        FA.narrative.setVar('population', state.resources.population, 'New settler');
      }

      // 6. Random event
      if (window.Events) window.Events.rollRandomEvent(state);

      // 7. Milestones
      if (window.Events) window.Events.checkMilestones(state);

      // 8. Sync narrative vars
      FA.narrative.setVar('population', state.resources.population);
      FA.narrative.setVar('happiness', state.resources.happiness || 0);

      // 9. Victory/defeat
      if (state.resources.population <= 0) {
        this.endGame(state, 'defeat');
      } else if (this.checkVictory(state)) {
        this.endGame(state, 'victory');
      }

      FA.emit('city:turnEnd', { turn: state.turn });
      FA.playSound('endTurn');
    },

    assignWorkers: function(state) {
      var available = state.resources.population;
      // Collect buildings sorted by build order
      var buildings = [];
      for (var y = 0; y < state.grid.length; y++) {
        for (var x = 0; x < state.grid[y].length; x++) {
          var tile = state.grid[y][x];
          if (tile.building && tile.building.def.populationRequired > 0) {
            buildings.push(tile.building);
          }
        }
      }
      buildings.sort(function(a, b) { return (a.builtTurn || 0) - (b.builtTurn || 0); });

      for (var i = 0; i < buildings.length; i++) {
        if (available >= buildings[i].def.populationRequired) {
          buildings[i].active = true;
          available -= buildings[i].def.populationRequired;
        } else {
          buildings[i].active = false;
        }
      }
    },

    calculateProduction: function(state) {
      var prod = { gold: 0, food: 0, wood: 0, stone: 0, happiness: 0 };
      for (var y = 0; y < state.grid.length; y++) {
        for (var x = 0; x < state.grid[y].length; x++) {
          var tile = state.grid[y][x];
          if (tile.building && tile.building.active && tile.building.def.production) {
            for (var res in tile.building.def.production) {
              prod[res] = (prod[res] || 0) + tile.building.def.production[res];
            }
          }
        }
      }
      return prod;
    },

    calculateDefense: function(state) {
      return state.defense || 0;
    },

    checkStarvation: function(state) {
      state.resources.food = 0;
      var lost = Math.min(state.resources.population - 1, cfg.starvationPenalty);
      if (lost > 0) {
        state.resources.population -= lost;
        FA.narrative.setVar('population', state.resources.population, 'Starvation');
        FA.emit('city:starvation');
        FA.playSound('danger');
        FA.addFloat(cfg.canvasWidth / 2, 100, 'STARVATION! -' + lost + ' population', '#ff4444', 4000);
      }
    },

    checkVictory: function(state) {
      return state.resources.population >= 50 &&
             (state.buildingCount || 0) >= 30 &&
             (state.turn || 0) >= 40 &&
             FA.narrative.getVar('town_hall_built');
    },

    calculateScore: function(state) {
      var score = 0;
      score += (state.resources.population || 0) * 10;
      score += (state.buildingCount || 0) * 50;
      score += (state.resources.gold || 0) * 2;
      score += (state.turn || 0) * 5;
      score += FA.narrative.getVar('narrative_bonus') || 0;
      return Math.floor(score);
    },

    // =====================
    // SCREEN MANAGEMENT
    // =====================

    startScreen: function() {
      FA.resetState({
        screen: 'start'
      });
    },

    beginGame: function() {
      var grid = this.initGrid(cfg.gridWidth, cfg.gridHeight);
      FA.resetState({
        screen: 'playing',
        grid: grid,
        resources: JSON.parse(JSON.stringify(cfg.startResources)),
        resourceCaps: JSON.parse(JSON.stringify(cfg.resourceCaps)),
        turn: 0,
        buildingCount: 0,
        defense: 0,
        selectedTile: null,
        buildMode: null,
        narrativeMessage: null,
        choiceDialog: null
      });
      var narCfg = FA.lookup('config', 'narrative');
      FA.narrative.init(narCfg);
      this.showNarrative('founding');
    },

    endGame: function(state, outcome) {
      state.screen = outcome;
      state.score = this.calculateScore(state);
      if (outcome === 'victory') {
        this.showNarrative('legacy');
      }
      FA.emit('game:over', { score: state.score, outcome: outcome });
    },

    showNarrative: function(nodeId) {
      var textDef = FA.lookup('narrativeText', nodeId);
      if (textDef) {
        var state = FA.getState();
        state.narrativeMessage = {
          text: textDef.text,
          color: textDef.color,
          life: 5000
        };
        FA.playSound('narrative');
      }
      FA.narrative.transition(nodeId);
      FA.emit('city:milestone', { nodeId: nodeId });
    }
  };

  window.City = City;
})();
