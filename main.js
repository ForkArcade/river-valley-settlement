// City Builder — Entry Point
// Canvas init, input handling, game loop, ForkArcade integration
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');
  var colors = FA.lookup('config', 'colors');

  FA.initCanvas('game', cfg.canvasWidth, cfg.canvasHeight);

  // =====================
  // INPUT BINDINGS
  // =====================

  FA.bindKey('endTurn', ['e']);
  FA.bindKey('restart', ['r']);
  FA.bindKey('cancel', ['Escape']);

  // =====================
  // MOUSE CLICK HANDLER
  // =====================

  var canvas = FA.getCanvas();
  canvas.addEventListener('click', function(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = cfg.canvasWidth / rect.width;
    var scaleY = cfg.canvasHeight / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleY;
    var state = FA.getState();

    // --- Start screen ---
    if (state.screen === 'start') {
      City.beginGame();
      return;
    }

    // --- End screen ---
    if (state.screen === 'victory' || state.screen === 'defeat') {
      City.startScreen();
      return;
    }

    // --- Playing ---
    if (state.screen !== 'playing') return;

    // Choice dialog (modal — blocks all other input)
    if (state.choiceDialog && state._choiceBounds) {
      for (var i = 0; i < state._choiceBounds.length; i++) {
        var cb = state._choiceBounds[i];
        if (mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h) {
          Events.resolveChoice(state.choiceDialog.id, i, state);
          return;
        }
      }
      return; // Block clicks outside dialog
    }

    // End Turn button
    if (state._endTurnBtn) {
      var btn = state._endTurnBtn;
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        City.processTurn(state);
        return;
      }
    }

    // Build menu buttons
    if (state._buildBtns) {
      for (var b = 0; b < state._buildBtns.length; b++) {
        var bb = state._buildBtns[b];
        if (mx >= bb.x && mx <= bb.x + bb.w && my >= bb.y && my <= bb.y + bb.h) {
          state.buildMode = (state.buildMode === bb.id) ? null : bb.id;
          state.selectedTile = null;
          return;
        }
      }
    }

    // Grid clicks (only in playable area)
    var gridAreaHeight = cfg.gridHeight * cfg.tileSize;
    if (my < gridAreaHeight) {
      var gx = Math.floor(mx / cfg.tileSize);
      var gy = Math.floor(my / cfg.tileSize);
      var tile = City.getTile(state.grid, gx, gy);
      if (!tile || !tile.discovered) return;

      // Build mode: try to place building
      if (state.buildMode) {
        if (City.placeBuilding(state.buildMode, gx, gy, state)) {
          // Keep build mode active for repeated placement
        }
        return;
      }

      // Click on forest: clear it
      if (tile.terrain === 'forest' && !tile.building) {
        City.clearForest(gx, gy, state);
        return;
      }

      // Click on ruins: discover narrative
      if (tile.terrain === 'ruins') {
        tile.discovered = true;
        return;
      }

      // Select tile
      state.selectedTile = tile;
    }
  });

  // =====================
  // KEYBOARD INPUT
  // =====================

  FA.on('input:action', function(data) {
    var state = FA.getState();

    if (data.action === 'restart' && (state.screen === 'victory' || state.screen === 'defeat')) {
      City.startScreen();
    }

    if (state.screen !== 'playing') return;

    if (data.action === 'endTurn' && !state.choiceDialog) {
      City.processTurn(state);
    }

    if (data.action === 'cancel') {
      if (state.buildMode) {
        state.buildMode = null;
      } else {
        state.selectedTile = null;
      }
    }
  });

  // =====================
  // SCORE SUBMISSION
  // =====================

  FA.on('game:over', function(data) {
    if (typeof ForkArcade !== 'undefined') {
      ForkArcade.submitScore(data.score);
    }
  });

  // =====================
  // GAME LOOP
  // =====================

  FA.setUpdate(function(dt) {
    var state = FA.getState();
    if (state.screen !== 'playing') return;

    // Update floating text
    FA.updateFloats(dt);
    FA.updateEffects(dt);

    // Narrative message fade
    if (state.narrativeMessage && state.narrativeMessage.life > 0) {
      state.narrativeMessage.life -= dt;
    }

    // Clear per-frame input
    FA.clearInput();
  });

  FA.setRender(function() {
    FA.draw.clear('#1a2a1e');
    FA.renderLayers();
  });

  // =====================
  // START
  // =====================

  Render.setup();
  City.startScreen();

  if (typeof ForkArcade !== 'undefined') {
    ForkArcade.onReady(function(data) {
      // Game ready for platform
    });
  }

  FA.start();
})();
