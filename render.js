// City Builder — Rendering
// All visual layers: screens, terrain, buildings, UI, HUD, narrative, choices
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');
  var colors = FA.lookup('config', 'colors');

  // Building list for menu (order matters)
  var BUILD_MENU = [
    'hut', 'farm', 'lumberMill', 'quarry', 'market',
    'warehouse', 'tavern', 'chapel', 'watchtower',
    'townHall', 'library', 'walls'
  ];

  var Render = {

    setup: function() {
      var ctx = FA.getCtx();
      var gridAreaHeight = cfg.gridHeight * cfg.tileSize;

      // =====================
      // START SCREEN (layer 0)
      // =====================
      FA.addLayer('startScreen', function() {
        var state = FA.getState();
        if (state.screen !== 'start') return;

        FA.draw.rect(0, 0, cfg.canvasWidth, cfg.canvasHeight, '#1a2a1e');

        FA.draw.text('CITY BUILDER', cfg.canvasWidth / 2, 180, {
          color: '#ffd700', size: 48, bold: true, align: 'center'
        });

        FA.draw.text('Found a settlement. Manage resources. Shape your story.', cfg.canvasWidth / 2, 250, {
          color: '#aaa', size: 16, align: 'center'
        });

        var instructions = [
          'Click tiles to build or clear forests',
          'End Turn to advance — buildings produce resources',
          'Make choices that shape your city\'s destiny',
          'Victory: 50 pop, 30 buildings, 40 turns, Town Hall'
        ];
        for (var i = 0; i < instructions.length; i++) {
          FA.draw.text(instructions[i], cfg.canvasWidth / 2, 320 + i * 28, {
            color: '#888', size: 14, align: 'center'
          });
        }

        FA.draw.text('[ Click to Begin ]', cfg.canvasWidth / 2, 500, {
          color: '#fff', size: 22, bold: true, align: 'center'
        });
      }, 0);

      // =====================
      // END SCREEN (layer 0)
      // =====================
      FA.addLayer('endScreen', function() {
        var state = FA.getState();
        if (state.screen !== 'victory' && state.screen !== 'defeat') return;

        FA.draw.withAlpha(0.85, function() {
          FA.draw.rect(0, 0, cfg.canvasWidth, cfg.canvasHeight, '#000');
        });

        var isVictory = state.screen === 'victory';
        var title = isVictory ? 'YOUR LEGACY ENDURES' : 'THE SETTLEMENT FALLS';
        var titleColor = isVictory ? '#ffd700' : '#ff4444';

        FA.draw.text(title, cfg.canvasWidth / 2, 180, {
          color: titleColor, size: 40, bold: true, align: 'center'
        });

        FA.draw.text('Final Score: ' + (state.score || 0), cfg.canvasWidth / 2, 260, {
          color: '#fff', size: 28, bold: true, align: 'center'
        });

        var stats = [
          'Population: ' + (state.resources.population || 0),
          'Buildings: ' + (state.buildingCount || 0),
          'Turns survived: ' + (state.turn || 0),
          'Narrative bonus: ' + (FA.narrative.getVar('narrative_bonus') || 0)
        ];
        for (var i = 0; i < stats.length; i++) {
          FA.draw.text(stats[i], cfg.canvasWidth / 2, 320 + i * 26, {
            color: '#aaa', size: 14, align: 'center'
          });
        }

        // Show identity if chosen
        var identity = FA.narrative.getVar('city_identity');
        if (identity) {
          var identityNames = { trade: 'Trade Hub', fortress: 'Fortress', learning: 'Center of Learning' };
          FA.draw.text('City Identity: ' + (identityNames[identity] || identity), cfg.canvasWidth / 2, 440, {
            color: '#c8b4ff', size: 16, align: 'center'
          });
        }

        FA.draw.text('[ Click or press R to restart ]', cfg.canvasWidth / 2, 520, {
          color: '#fff', size: 18, bold: true, align: 'center'
        });
      }, 0);

      // =====================
      // TERRAIN (layer 1)
      // =====================
      FA.addLayer('terrain', function() {
        var state = FA.getState();
        if (state.screen !== 'playing') return;

        for (var y = 0; y < state.grid.length; y++) {
          for (var x = 0; x < state.grid[y].length; x++) {
            var tile = state.grid[y][x];
            var tx = x * cfg.tileSize;
            var ty = y * cfg.tileSize;

            if (!tile.discovered) {
              FA.draw.rect(tx, ty, cfg.tileSize, cfg.tileSize, '#111');
              continue;
            }

            var tDef = FA.lookup('terrain', tile.terrain);
            FA.draw.rect(tx, ty, cfg.tileSize, cfg.tileSize, tDef.color);

            // Grid lines
            FA.draw.strokeRect(tx, ty, cfg.tileSize, cfg.tileSize, 'rgba(0,0,0,0.2)', 1);

            // Terrain character (if no building)
            if (!tile.building) {
              FA.draw.sprite('terrain', tile.terrain, tx + 12, ty + 12, 16, tDef.char, tDef.color === '#228b22' ? '#1a6b1a' : '#555');
            }
          }
        }
      }, 1);

      // =====================
      // BUILDINGS (layer 5)
      // =====================
      FA.addLayer('buildings', function() {
        var state = FA.getState();
        if (state.screen !== 'playing') return;

        for (var y = 0; y < state.grid.length; y++) {
          for (var x = 0; x < state.grid[y].length; x++) {
            var tile = state.grid[y][x];
            if (!tile.building || !tile.discovered) continue;

            var tx = x * cfg.tileSize + 4;
            var ty = y * cfg.tileSize + 4;
            var b = tile.building;

            // Building sprite with fallback
            FA.draw.sprite('buildings', b.id, tx, ty, 32, b.def.char, b.def.color);

            // Inactive overlay
            if (!b.active && b.def.populationRequired > 0) {
              FA.draw.withAlpha(0.5, function() {
                FA.draw.rect(tx, ty, 32, 32, '#000');
              });
              FA.draw.text('!', tx + 16, ty + 10, { color: '#f44', size: 12, bold: true, align: 'center' });
            }
          }
        }
      }, 5);

      // =====================
      // SELECTION HIGHLIGHT (layer 10)
      // =====================
      FA.addLayer('selection', function() {
        var state = FA.getState();
        if (state.screen !== 'playing') return;
        if (!state.selectedTile) return;

        var tx = state.selectedTile.x * cfg.tileSize;
        var ty = state.selectedTile.y * cfg.tileSize;
        FA.draw.strokeRect(tx + 1, ty + 1, cfg.tileSize - 2, cfg.tileSize - 2, colors.selected, 3);
      }, 10);

      // =====================
      // BUILD CURSOR (layer 15)
      // =====================
      FA.addLayer('buildCursor', function() {
        var state = FA.getState();
        if (state.screen !== 'playing' || !state.buildMode) return;

        var mouse = FA.getMouse();
        if (!mouse || mouse.x == null) return;

        var gx = Math.floor(mouse.x / cfg.tileSize);
        var gy = Math.floor(mouse.y / cfg.tileSize);

        if (gy >= cfg.gridHeight || gx >= cfg.gridWidth || gx < 0 || gy < 0) return;

        var check = City.canPlace(state.buildMode, gx, gy, state);
        var cursorColor = check.valid ? 'rgba(50,255,50,0.35)' : 'rgba(255,50,50,0.35)';
        FA.draw.rect(gx * cfg.tileSize, gy * cfg.tileSize, cfg.tileSize, cfg.tileSize, cursorColor);

        if (!check.valid) {
          FA.draw.text(check.reason, mouse.x, mouse.y - 12, {
            color: '#f44', size: 11, align: 'center'
          });
        }
      }, 15);

      // =====================
      // NARRATIVE OVERLAY (layer 20)
      // =====================
      FA.addLayer('narrative', function() {
        var state = FA.getState();
        if (state.screen !== 'playing') return;
        if (!state.narrativeMessage || state.narrativeMessage.life <= 0) return;

        var msg = state.narrativeMessage;
        var alpha = FA.clamp(msg.life / 1000, 0, 1);

        FA.draw.withAlpha(alpha, function() {
          FA.draw.rect(0, 0, cfg.canvasWidth, 44, 'rgba(0,0,0,0.75)');
          FA.draw.text(msg.text, cfg.canvasWidth / 2, 16, {
            color: msg.color, size: 14, align: 'center'
          });
        });
      }, 20);

      // =====================
      // CHOICE DIALOG (layer 25)
      // =====================
      FA.addLayer('choiceDialog', function() {
        var state = FA.getState();
        if (state.screen !== 'playing' || !state.choiceDialog) return;

        var dialog = state.choiceDialog;
        var optCount = dialog.options.length;
        var cw = 640;
        var ch = 120 + optCount * 60;
        var cx = (cfg.canvasWidth - cw) / 2;
        var cy = (cfg.canvasHeight - ch) / 2 - 40;

        // Dim background
        FA.draw.withAlpha(0.6, function() {
          FA.draw.rect(0, 0, cfg.canvasWidth, cfg.canvasHeight, '#000');
        });

        // Dialog box
        FA.draw.rect(cx, cy, cw, ch, '#1a2a1e');
        FA.draw.strokeRect(cx, cy, cw, ch, '#ffd700', 2);

        // Question text
        FA.draw.text(dialog.text, cfg.canvasWidth / 2, cy + 35, {
          color: '#fff', size: 15, align: 'center'
        });

        // Separator
        FA.draw.rect(cx + 20, cy + 60, cw - 40, 1, '#444');

        // Options
        state._choiceBounds = [];
        for (var i = 0; i < dialog.options.length; i++) {
          var opt = dialog.options[i];
          var oy = cy + 75 + i * 60;
          var bx = cx + 30;
          var bw = cw - 60;
          var bh = 46;

          // Button bg
          FA.draw.rect(bx, oy, bw, bh, '#2d4a3e');
          FA.draw.strokeRect(bx, oy, bw, bh, '#558855', 1);

          // Label
          FA.draw.text(opt.label || ('Option ' + (i + 1)), bx + 15, oy + 10, {
            color: '#ffd700', size: 14, bold: true
          });

          // Description
          FA.draw.text(opt.text, bx + 15, oy + 28, {
            color: '#ccc', size: 11
          });

          // Store bounds for click detection
          state._choiceBounds.push({ x: bx, y: oy, w: bw, h: bh });
        }
      }, 25);

      // =====================
      // HUD (layer 30)
      // =====================
      FA.addLayer('hud', function() {
        var state = FA.getState();
        if (state.screen !== 'playing') return;

        var hudY = gridAreaHeight;
        var res = state.resources;

        // HUD background
        FA.draw.rect(0, hudY, cfg.canvasWidth, cfg.hudHeight, colors.uiBg);
        FA.draw.rect(0, hudY, cfg.canvasWidth, 1, '#444');

        // === TOP ROW: Resources ===
        var ry = hudY + 12;
        var rx = 15;

        var resItems = [
          { label: 'Gold', value: res.gold, cap: state.resourceCaps.gold, color: colors.gold },
          { label: 'Food', value: res.food, cap: state.resourceCaps.food, color: colors.food },
          { label: 'Wood', value: res.wood, cap: state.resourceCaps.wood, color: colors.wood },
          { label: 'Stone', value: res.stone, cap: state.resourceCaps.stone, color: colors.stone }
        ];

        for (var i = 0; i < resItems.length; i++) {
          var item = resItems[i];
          FA.draw.text(item.label + ': ', rx, ry, { color: colors.uiDim, size: 12 });
          FA.draw.text(item.value + '/' + item.cap, rx + 48, ry, {
            color: item.value <= 0 ? colors.danger : item.color, size: 12, bold: true
          });
          rx += 130;
        }

        // Pop, happiness, turn
        rx = 540;
        FA.draw.text('Pop: ', rx, ry, { color: colors.uiDim, size: 12 });
        FA.draw.text(res.population + '/' + res.maxPopulation, rx + 36, ry, { color: colors.pop, size: 12, bold: true });

        rx = 660;
        FA.draw.text('Happy: ', rx, ry, { color: colors.uiDim, size: 12 });
        FA.draw.text('' + (res.happiness || 0), rx + 52, ry, { color: colors.happy, size: 12, bold: true });

        rx = 770;
        FA.draw.text('Turn: ', rx, ry, { color: colors.uiDim, size: 12 });
        FA.draw.text('' + (state.turn || 0), rx + 44, ry, { color: colors.uiText, size: 12, bold: true });

        // Production preview
        var prod = City.calculateProduction(state);
        var prodY = hudY + 30;
        var prodX = 15;
        var prodItems = [
          { val: prod.food, label: 'food', color: colors.food },
          { val: prod.wood, label: 'wood', color: colors.wood },
          { val: prod.stone, label: 'stone', color: colors.stone },
          { val: prod.gold, label: 'gold', color: colors.gold }
        ];
        var foodNeeded = Math.floor(res.population / cfg.foodConsumptionRate);

        FA.draw.text('Per turn:', prodX, prodY, { color: colors.uiDim, size: 10 });
        prodX += 65;
        for (var p = 0; p < prodItems.length; p++) {
          var pi = prodItems[p];
          var netVal = pi.val;
          if (pi.label === 'food') netVal -= foodNeeded;
          var sign = netVal >= 0 ? '+' : '';
          FA.draw.text(sign + netVal + ' ' + pi.label, prodX, prodY, {
            color: netVal < 0 ? colors.danger : pi.color, size: 10
          });
          prodX += 100;
        }

        // === END TURN BUTTON ===
        var btnW = 120;
        var btnH = 36;
        var btnX = cfg.canvasWidth - btnW - 15;
        var btnY = hudY + 8;
        FA.draw.rect(btnX, btnY, btnW, btnH, '#4a7a4a');
        FA.draw.strokeRect(btnX, btnY, btnW, btnH, '#6a9a6a', 2);
        FA.draw.text('End Turn [E]', btnX + btnW / 2, btnY + 12, {
          color: '#fff', size: 14, bold: true, align: 'center'
        });
        state._endTurnBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

        // === BUILD MENU (bottom row) ===
        var menuY = hudY + 52;
        FA.draw.rect(0, menuY - 2, cfg.canvasWidth, 1, '#333');

        var menuX = 10;
        var btnSize = 76;
        var gap = 4;

        state._buildBtns = [];

        // Scroll if needed — show first 12
        var visible = BUILD_MENU;
        for (var b = 0; b < visible.length; b++) {
          var bid = visible[b];
          var bDef = FA.lookup('buildings', bid);
          if (!bDef) continue;

          // Check if locked
          var locked = bDef.unlockCondition && !FA.narrative.getVar(bDef.unlockCondition);
          var selected = state.buildMode === bid;

          var bx = menuX + b * (btnSize + gap);
          var by = menuY + 5;
          var bh = cfg.hudHeight - 58;

          // Button bg
          if (locked) {
            FA.draw.rect(bx, by, btnSize, bh, '#222');
          } else if (selected) {
            FA.draw.rect(bx, by, btnSize, bh, '#4a6a2a');
            FA.draw.strokeRect(bx, by, btnSize, bh, colors.selected, 2);
          } else {
            FA.draw.rect(bx, by, btnSize, bh, colors.uiPanel);
          }

          // Building char and name
          FA.draw.text(bDef.char, bx + btnSize / 2, by + 8, {
            color: locked ? '#555' : bDef.color, size: 18, bold: true, align: 'center'
          });
          FA.draw.text(bDef.name, bx + btnSize / 2, by + 30, {
            color: locked ? '#444' : colors.uiText, size: 9, align: 'center'
          });

          // Cost summary
          var costParts = [];
          if (bDef.cost) {
            for (var r in bDef.cost) costParts.push(bDef.cost[r] + r[0].toUpperCase());
          }
          if (costParts.length > 0) {
            FA.draw.text(costParts.join(' '), bx + btnSize / 2, by + 44, {
              color: locked ? '#333' : colors.uiDim, size: 8, align: 'center'
            });
          }

          // Lock indicator
          if (locked) {
            FA.draw.text('LOCKED', bx + btnSize / 2, by + 58, {
              color: '#444', size: 8, align: 'center'
            });
          }

          if (!locked) {
            state._buildBtns.push({ id: bid, x: bx, y: by, w: btnSize, h: bh });
          }
        }

        // === SELECTED TILE INFO ===
        if (state.selectedTile && state.selectedTile.building) {
          var sb = state.selectedTile.building;
          var infoX = cfg.canvasWidth - 200;
          var infoY = menuY + 5;
          FA.draw.rect(infoX, infoY, 185, bh, 'rgba(0,0,0,0.5)');
          FA.draw.text(sb.def.name, infoX + 8, infoY + 8, { color: sb.def.color, size: 12, bold: true });
          FA.draw.text(sb.def.description || '', infoX + 8, infoY + 24, { color: colors.uiDim, size: 10 });
          if (sb.def.production) {
            var prodStr = Object.keys(sb.def.production).map(function(k) { return '+' + sb.def.production[k] + ' ' + k; }).join(', ');
            FA.draw.text(prodStr, infoX + 8, infoY + 40, { color: colors.success, size: 10 });
          }
          FA.draw.text(sb.active ? 'Active' : 'No workers!', infoX + 8, infoY + 56, {
            color: sb.active ? colors.success : colors.danger, size: 10
          });
        }
      }, 30);

      // =====================
      // EFFECTS (layer 35)
      // =====================
      FA.addLayer('effects', function() {
        FA.drawFloats();
      }, 35);
    }
  };

  window.Render = Render;
})();
