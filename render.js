// City Builder — Rendering
// All visual layers: screens, terrain, buildings, UI, HUD, narrative, choices
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');
  var colors = FA.lookup('config', 'colors');
  var layouts = FA.lookup('config', 'layouts');
  var L = layouts[cfg.layout] || layouts.classic;
  var tR = FA.lookup('config', 'terrainRender');

  // Load tileset image
  var _tileset = new Image();
  _tileset.src = tR.tileset.src;

  var BUILD_MENU = [
    'hut', 'farm', 'lumberMill', 'quarry', 'market',
    'warehouse', 'tavern', 'chapel', 'watchtower',
    'townHall', 'library', 'walls'
  ];

  function _darken(hex, factor) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = Math.round(parseInt(h.substr(0,2),16) * factor);
    var g = Math.round(parseInt(h.substr(2,2),16) * factor);
    var b = Math.round(parseInt(h.substr(4,2),16) * factor);
    return '#' + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }

  var Render = {

    setup: function() {

      // =====================
      // START SCREEN (layer 0)
      // =====================
      FA.addLayer('startScreen', function() {
        var state = FA.getState();
        if (state.screen !== 'start') return;

        FA.draw.rect(0, 0, cfg.canvasWidth, cfg.canvasHeight, '#1a2a1e');

        var st = L.startTitle;
        FA.draw.text('CITY BUILDER', st.x, st.y, {
          color: '#ffd700', size: st.size, bold: true, align: st.align
        });

        var sub = L.startSubtitle;
        FA.draw.text('Found a settlement. Manage resources. Shape your story.', sub.x, sub.y, {
          color: '#aaa', size: sub.size, align: sub.align
        });

        var inst = L.startInstructions;
        var instructions = [
          'Click tiles to build or clear forests',
          'End Turn to advance — buildings produce resources',
          'Make choices that shape your city\'s destiny',
          'Victory: 50 pop, 30 buildings, 40 turns, Town Hall'
        ];
        for (var i = 0; i < instructions.length; i++) {
          FA.draw.text(instructions[i], inst.x, inst.y + i * inst.spacing, {
            color: '#888', size: inst.size, align: inst.align
          });
        }

        var cta = L.startCta;
        FA.draw.text('[ Click to Begin ]', cta.x, cta.y, {
          color: '#fff', size: cta.size, bold: true, align: cta.align
        });
      }, 0);

      // =====================
      // END SCREEN (layer 0)
      // =====================
      FA.addLayer('endScreen', function() {
        var state = FA.getState();
        if (state.screen !== 'victory' && state.screen !== 'defeat') return;

        FA.draw.pushAlpha(0.85);
        FA.draw.rect(0, 0, cfg.canvasWidth, cfg.canvasHeight, '#000');
        FA.draw.popAlpha();

        var isVictory = state.screen === 'victory';
        var title = isVictory ? 'YOUR LEGACY ENDURES' : 'THE SETTLEMENT FALLS';
        var titleColor = isVictory ? '#ffd700' : '#ff4444';

        var et = L.endTitle;
        FA.draw.text(title, et.x, et.y, {
          color: titleColor, size: et.size, bold: true, align: et.align
        });

        var es = L.endScore;
        FA.draw.text('Final Score: ' + (state.score || 0), es.x, es.y, {
          color: '#fff', size: es.size, bold: true, align: es.align
        });

        var est = L.endStats;
        var stats = [
          'Population: ' + (state.resources.population || 0),
          'Buildings: ' + (state.buildingCount || 0),
          'Turns survived: ' + (state.turn || 0),
          'Narrative bonus: ' + (FA.narrative.getVar('narrative_bonus') || 0)
        ];
        for (var i = 0; i < stats.length; i++) {
          FA.draw.text(stats[i], est.x, est.y + i * est.spacing, {
            color: '#aaa', size: est.size, align: est.align
          });
        }

        var identity = FA.narrative.getVar('city_identity');
        if (identity) {
          var identityNames = { trade: 'Trade Hub', fortress: 'Fortress', learning: 'Center of Learning' };
          var ei = L.endIdentity;
          FA.draw.text('City Identity: ' + (identityNames[identity] || identity), ei.x, ei.y, {
            color: '#c8b4ff', size: ei.size, align: ei.align
          });
        }

        var ec = L.endCta;
        FA.draw.text('[ Click or press R to restart ]', ec.x, ec.y, {
          color: '#fff', size: ec.size, bold: true, align: ec.align
        });
      }, 0);

      // =====================
      // TERRAIN (layer 1)
      // =====================
      FA.addLayer('terrain', function() {
        var state = FA.getState();
        if (state.screen !== 'playing') return;
        var ctx = FA.getCtx();
        var ts = cfg.tileSize;
        var srcTs = tR.tileset.srcTileSize;
        var tilesetReady = _tileset.complete && _tileset.naturalWidth > 0;

        for (var y = 0; y < state.grid.length; y++) {
          for (var x = 0; x < state.grid[y].length; x++) {
            var tile = state.grid[y][x];
            var tx = L.grid.x + x * ts;
            var baseY = L.grid.y + y * ts;
            var h = tR.heights[tile.terrain] || 0;
            var ty = baseY - h;

            if (!tile.discovered) {
              FA.draw.rect(tx, baseY, ts, ts, '#111');
              continue;
            }

            var tDef = FA.lookup('terrain', tile.terrain);
            var tileW = ts - 1;

            // Tile surface — from tileset image
            if (tilesetReady) {
              var row = tR.tileset.rows[tile.terrain];
              if (row !== undefined) {
                var variant = tile.variant % 3;
                ctx.drawImage(
                  _tileset,
                  variant * srcTs, row * srcTs, srcTs, srcTs,
                  tx + 1, ty, tileW, tileW
                );
              } else {
                FA.draw.rect(tx + 1, ty, tileW, tileW, tDef.color);
              }
            } else {
              FA.draw.rect(tx + 1, ty, tileW, tileW, tDef.color);
            }

            // Forest: tree sprite overlay on grass tile
            if (tile.terrain === 'forest') {
              FA.draw.sprite('terrain', 'forest', tx + 4, ty + 2, ts - 8, 'T', '#1a6b1a', tile.variant);
            }

            // Front wall (depth shadow below tile)
            if (h > 0) {
              var sc = tR.shadowColors[tile.terrain] || _darken(tDef.color, 0.6);
              FA.draw.rect(tx + 1, ty + tileW, tileW, h, sc);
            }

            // Right wall (thin shadow)
            if (h > 0) {
              FA.draw.withAlpha(0.7, function() {
                FA.draw.rect(tx + ts, ty, 1, tileW + h, tR.shadowColors[tile.terrain] || '#222');
              });
            }

            // 3D gradient highlight
            if (h > 0) {
              var grad = ctx.createLinearGradient(tx + 1, ty, tx + ts, ty + tileW);
              grad.addColorStop(0, 'rgba(255,255,255,0.1)');
              grad.addColorStop(0.5, 'rgba(255,255,255,0)');
              grad.addColorStop(1, 'rgba(0,0,0,0.1)');
              ctx.fillStyle = grad;
              ctx.fillRect(tx + 1, ty, tileW, tileW);
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

            var h = tR.heights[tile.terrain] || 0;
            var tx = L.grid.x + x * cfg.tileSize + 4;
            var ty = L.grid.y + y * cfg.tileSize - h + 4;
            var b = tile.building;

            FA.draw.sprite('buildings', b.id, tx, ty, 32, b.def.char, b.def.color, 0);

            if (!b.active && b.def.populationRequired > 0) {
              FA.draw.pushAlpha(0.5);
              FA.draw.rect(tx, ty, 32, 32, '#000');
              FA.draw.popAlpha();
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

        var st = state.selectedTile;
        var h = tR.heights[st.terrain] || 0;
        var tx = L.grid.x + st.x * cfg.tileSize;
        var ty = L.grid.y + st.y * cfg.tileSize - h;
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

        var gx = Math.floor((mouse.x - L.grid.x) / cfg.tileSize);
        var gy = Math.floor((mouse.y - L.grid.y) / cfg.tileSize);

        if (gy >= cfg.gridHeight || gx >= cfg.gridWidth || gx < 0 || gy < 0) return;

        var tile = state.grid[gy] && state.grid[gy][gx];
        var h = tile ? (tR.heights[tile.terrain] || 0) : 0;
        var check = City.canPlace(state.buildMode, gx, gy, state);
        var cursorColor = check.valid ? 'rgba(50,255,50,0.35)' : 'rgba(255,50,50,0.35)';
        FA.draw.rect(L.grid.x + gx * cfg.tileSize, L.grid.y + gy * cfg.tileSize - h, cfg.tileSize, cfg.tileSize, cursorColor);

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
        var barW = L.grid.w || cfg.canvasWidth;

        FA.draw.pushAlpha(alpha);
        FA.draw.rect(L.grid.x, L.grid.y, barW, 44, 'rgba(0,0,0,0.75)');
        FA.draw.text(msg.text, L.grid.x + barW / 2, L.grid.y + 16, {
          color: msg.color, size: 14, align: 'center'
        });
        FA.draw.popAlpha();
      }, 20);

      // =====================
      // CHOICE DIALOG (layer 25) — FA.ui
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

        FA.ui.overlay(0.6);

        FA.ui.begin('choiceDialog', {
          x: cx, y: cy, w: cw, h: ch,
          bg: '#1a2a1e', border: '#ffd700', borderWidth: 2,
          padding: 20, layout: 'vertical', gap: 10
        });

        FA.ui.label(dialog.text, { color: '#fff', size: 15, align: 'center' });
        FA.ui.space(4);
        FA.ui.separator();
        FA.ui.space(4);

        for (var i = 0; i < dialog.options.length; i++) {
          var opt = dialog.options[i];
          if (FA.ui.button('choice_' + i, opt.label || ('Option ' + (i + 1)), {
            h: 46, bg: '#2d4a3e', border: '#558855',
            subtitle: opt.text, color: '#ffd700', align: 'left'
          })) {
            Events.resolveChoice(dialog.id, i, state);
          }
        }

        FA.ui.end();
      }, 25);

      // =====================
      // HUD (layer 30) — FA.ui for buttons + tile info
      // =====================
      FA.addLayer('hud', function() {
        var state = FA.getState();
        if (state.screen !== 'playing') return;

        var res = state.resources;
        var hud = L.hud;
        var bm = L.buildMenu;

        // HUD background
        FA.draw.rect(hud.x, hud.y, hud.w, hud.h, colors.uiBg);
        if (hud.direction === 'vertical') {
          FA.draw.rect(hud.x, hud.y, 1, hud.h, '#444');
        } else {
          FA.draw.rect(hud.x, hud.y, hud.w, 1, '#444');
        }

        if (hud.direction === 'vertical') {
          // === SIDEBAR LAYOUT — one vertical FA.ui container ===
          FA.ui.begin('hudPanel', {
            x: hud.x, y: hud.y, w: hud.w, h: hud.h,
            padding: 10, layout: 'vertical', gap: 4
          });

          // Resources
          FA.ui.stat('Gold', res.gold + '/' + state.resourceCaps.gold, {
            valueColor: res.gold <= 0 ? colors.danger : colors.gold
          });
          FA.ui.stat('Food', res.food + '/' + state.resourceCaps.food, {
            valueColor: res.food <= 0 ? colors.danger : colors.food
          });
          FA.ui.stat('Wood', res.wood + '/' + state.resourceCaps.wood, {
            valueColor: res.wood <= 0 ? colors.danger : colors.wood
          });
          FA.ui.stat('Stone', res.stone + '/' + state.resourceCaps.stone, {
            valueColor: res.stone <= 0 ? colors.danger : colors.stone
          });

          FA.ui.space(4);
          FA.ui.separator();
          FA.ui.space(2);

          // Production
          var prod = City.calculateProduction(state);
          var foodNeeded = Math.floor(res.population / cfg.foodConsumptionRate);
          FA.ui.label('Per turn:', { color: colors.uiDim, size: 10 });
          var prodItems = [
            { val: prod.food - foodNeeded, label: 'food', color: colors.food },
            { val: prod.wood, label: 'wood', color: colors.wood },
            { val: prod.stone, label: 'stone', color: colors.stone },
            { val: prod.gold, label: 'gold', color: colors.gold }
          ];
          for (var p = 0; p < prodItems.length; p++) {
            var pi = prodItems[p];
            var sign = pi.val >= 0 ? '+' : '';
            FA.ui.label('  ' + sign + pi.val + ' ' + pi.label, {
              color: pi.val < 0 ? colors.danger : pi.color, size: 10
            });
          }

          FA.ui.space(4);
          FA.ui.separator();
          FA.ui.space(2);

          // Stats
          FA.ui.stat('Pop', res.population + '/' + res.maxPopulation, { valueColor: colors.pop });
          FA.ui.stat('Happy', '' + (res.happiness || 0), { valueColor: colors.happy });
          FA.ui.stat('Turn', '' + (state.turn || 0), { valueColor: colors.uiText });

          FA.ui.space(8);

          // End Turn button
          if (FA.ui.button('endTurn', 'End Turn [E]', {
            h: 36, bg: '#4a7a4a', border: '#6a9a6a', borderWidth: 2
          })) {
            City.processTurn(state);
          }

          FA.ui.space(4);
          FA.ui.separator();
          FA.ui.space(4);

          // Build menu
          for (var b = 0; b < BUILD_MENU.length; b++) {
            var bid = BUILD_MENU[b];
            var bDef = FA.lookup('buildings', bid);
            if (!bDef) continue;
            var locked = bDef.unlockCondition && !FA.narrative.getVar(bDef.unlockCondition);
            var selected = state.buildMode === bid;
            var costParts = [];
            if (bDef.cost) { for (var r in bDef.cost) costParts.push(bDef.cost[r] + r[0].toUpperCase()); }

            if (FA.ui.button('build_' + bid, bDef.char + ' ' + bDef.name, {
              h: bm.btnH, locked: locked, selected: selected,
              subtitle: locked ? 'LOCKED' : costParts.join(' ')
            })) {
              state.buildMode = (state.buildMode === bid) ? null : bid;
              state.selectedTile = null;
            }
          }

          FA.ui.end();

        } else {
          // === CLASSIC (HORIZONTAL) LAYOUT ===

          // Resources — positioned with layout config
          var rc = L.resources;
          var resItems = [
            { label: 'Gold', value: res.gold, cap: state.resourceCaps.gold, color: colors.gold },
            { label: 'Food', value: res.food, cap: state.resourceCaps.food, color: colors.food },
            { label: 'Wood', value: res.wood, cap: state.resourceCaps.wood, color: colors.wood },
            { label: 'Stone', value: res.stone, cap: state.resourceCaps.stone, color: colors.stone }
          ];
          for (var i = 0; i < resItems.length; i++) {
            var item = resItems[i];
            var rx = rc.x + i * rc.spacing;
            FA.draw.text(item.label + ': ', rx, rc.y, { color: colors.uiDim, size: 12 });
            FA.draw.text(item.value + '/' + item.cap, rx + 48, rc.y, {
              color: item.value <= 0 ? colors.danger : item.color, size: 12, bold: true
            });
          }

          // Stats
          var sc = L.stats;
          var statValues = {
            pop: { label: 'Pop: ', value: res.population + '/' + res.maxPopulation, color: colors.pop },
            happy: { label: 'Happy: ', value: '' + (res.happiness || 0), color: colors.happy },
            turn: { label: 'Turn: ', value: '' + (state.turn || 0), color: colors.uiText }
          };
          for (var s = 0; s < sc.items.length; s++) {
            var si = sc.items[s];
            var sv = statValues[si.key];
            FA.draw.text(sv.label, sc.x + si.x, sc.y, { color: colors.uiDim, size: 12 });
            FA.draw.text(sv.value, sc.x + si.x + 52, sc.y, { color: sv.color, size: 12, bold: true });
          }

          // Production
          var pc = L.production;
          var prod = City.calculateProduction(state);
          var foodNeeded = Math.floor(res.population / cfg.foodConsumptionRate);
          var prodItems = [
            { val: prod.food, label: 'food', color: colors.food },
            { val: prod.wood, label: 'wood', color: colors.wood },
            { val: prod.stone, label: 'stone', color: colors.stone },
            { val: prod.gold, label: 'gold', color: colors.gold }
          ];
          var prodX = pc.x;
          FA.draw.text('Per turn:', prodX, pc.y, { color: colors.uiDim, size: 10 });
          prodX += 65;
          for (var p = 0; p < prodItems.length; p++) {
            var pi = prodItems[p];
            var netVal = pi.val;
            if (pi.label === 'food') netVal -= foodNeeded;
            var sign = netVal >= 0 ? '+' : '';
            FA.draw.text(sign + netVal + ' ' + pi.label, prodX, pc.y, {
              color: netVal < 0 ? colors.danger : pi.color, size: 10
            });
            prodX += pc.spacing;
          }

          // End Turn — FA.ui button (standalone)
          var btn = L.endTurnBtn;
          if (FA.ui.button('endTurn', 'End Turn [E]', {
            x: btn.x, y: btn.y, w: btn.w, h: btn.h,
            bg: '#4a7a4a', border: '#6a9a6a', borderWidth: 2
          })) {
            City.processTurn(state);
          }

          // Build Menu separator
          FA.draw.rect(0, bm.y - 2, cfg.canvasWidth, 1, '#333');

          // Build Menu — FA.ui horizontal container
          FA.ui.begin('buildMenu', { x: bm.x, y: bm.y + 5, layout: 'horizontal', gap: bm.gap });
          for (var b = 0; b < BUILD_MENU.length; b++) {
            var bid = BUILD_MENU[b];
            var bDef = FA.lookup('buildings', bid);
            if (!bDef) continue;
            var locked = bDef.unlockCondition && !FA.narrative.getVar(bDef.unlockCondition);
            var selected = state.buildMode === bid;
            var costParts = [];
            if (bDef.cost) { for (var r in bDef.cost) costParts.push(bDef.cost[r] + r[0].toUpperCase()); }

            if (FA.ui.button('build_' + bid, bDef.char + ' ' + bDef.name, {
              w: bm.btnW, h: bm.btnH, locked: locked, selected: selected,
              subtitle: locked ? 'LOCKED' : costParts.join(' ')
            })) {
              state.buildMode = (state.buildMode === bid) ? null : bid;
              state.selectedTile = null;
            }
          }
          FA.ui.end();
        }

        // Tile info (both layouts) — FA.ui container
        if (state.selectedTile && state.selectedTile.building) {
          var sb = state.selectedTile.building;
          var ti = L.tileInfo;

          FA.ui.begin('tileInfo', {
            x: ti.x, y: ti.y, w: ti.w, h: ti.h,
            bg: 'rgba(0,0,0,0.5)', padding: 8, layout: 'vertical', gap: 4
          });
          FA.ui.label(sb.def.name, { color: sb.def.color, size: 12, bold: true });
          FA.ui.label(sb.def.description || '', { color: colors.uiDim, size: 10 });
          if (sb.def.production) {
            var prodStr = Object.keys(sb.def.production).map(function(k) {
              return '+' + sb.def.production[k] + ' ' + k;
            }).join(', ');
            FA.ui.label(prodStr, { color: colors.success, size: 10 });
          }
          FA.ui.label(sb.active ? 'Active' : 'No workers!', {
            color: sb.active ? colors.success : colors.danger, size: 10
          });
          FA.ui.end();
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
