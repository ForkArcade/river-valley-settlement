// City Builder — Events
// Random events, milestone checking, narrative choice system
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');

  var Events = {

    // =====================
    // RANDOM EVENTS
    // =====================

    rollRandomEvent: function(state) {
      if (Math.random() > cfg.eventChance) return;

      var allEvents = FA.lookupAll('events');
      var eventIds = Object.keys(allEvents);
      if (eventIds.length === 0) return;

      var eventId = FA.pick(eventIds);
      this.triggerEvent(eventId, state);
    },

    triggerEvent: function(eventId, state) {
      var evt = FA.lookup('events', eventId);
      if (!evt) return;

      // Show event notification
      FA.addFloat(cfg.canvasWidth / 2, 80, evt.name, '#ffd700', 3000);

      // Set narrative message for longer display
      state.narrativeMessage = {
        text: evt.text,
        color: '#ffd700',
        life: 3000
      };

      if (evt.effect) {
        evt.effect(state);
      }

      FA.emit('city:event', { eventId: eventId });
    },

    // =====================
    // MILESTONE CHECKS
    // =====================

    checkMilestones: function(state) {
      var current = FA.narrative.currentNode;
      if (!current) return;

      // founding → first_shelter: first building placed
      if (current === 'founding' && (state.buildingCount || 0) >= 1) {
        City.showNarrative('first_shelter');
        return;
      }

      // first_shelter → first_harvest: farm exists
      if (current === 'first_shelter' && this._hasBuilding(state, 'farm')) {
        City.showNarrative('first_harvest');
        return;
      }

      // first_harvest → strangers_arrive: population >= 10
      if (current === 'first_harvest' && state.resources.population >= 10) {
        this.showChoice('strangers_arrive', state);
        return;
      }

      // strangers_arrive → the_ruins: any ruins tile discovered & adjacent building
      if (current === 'strangers_arrive' && this._ruinsDiscovered(state)) {
        this.showChoice('the_ruins', state);
        return;
      }

      // the_ruins → first_winter: turn 10
      if (current === 'the_ruins' && state.turn >= 10) {
        City.showNarrative('first_winter');
        return;
      }

      // first_winter → growing_town: population >= 25
      if (current === 'first_winter' && state.resources.population >= 25) {
        City.showNarrative('growing_town');
        return;
      }

      // growing_town → bandit_threat: turn 20
      if (current === 'growing_town' && state.turn >= 20) {
        this.showChoice('bandit_threat', state);
        return;
      }

      // bandit_threat → town_hall_built (triggered by building placement via narrativeTrigger)
      // This transition happens automatically when Town Hall is built

      // town_hall_built → the_scholar (triggered by Library via narrativeTrigger)
      if (current === 'town_hall_built' && FA.narrative.getVar('library_built')) {
        City.showNarrative('the_scholar');
        return;
      }

      // the_scholar → festival: tavern + chapel + pop >= 30
      if (current === 'the_scholar' &&
          FA.narrative.getVar('tavern_built') &&
          FA.narrative.getVar('chapel_built') &&
          state.resources.population >= 30) {
        City.showNarrative('festival');
        return;
      }

      // festival → crossroads: turn 40
      if (current === 'festival' && state.turn >= 40) {
        this.showChoice('crossroads', state);
        return;
      }
    },

    _hasBuilding: function(state, buildingId) {
      for (var y = 0; y < state.grid.length; y++) {
        for (var x = 0; x < state.grid[y].length; x++) {
          if (state.grid[y][x].building && state.grid[y][x].building.id === buildingId) {
            return true;
          }
        }
      }
      return false;
    },

    _ruinsDiscovered: function(state) {
      for (var y = 0; y < state.grid.length; y++) {
        for (var x = 0; x < state.grid[y].length; x++) {
          if (state.grid[y][x].terrain === 'ruins' && state.grid[y][x].discovered) {
            return true;
          }
        }
      }
      return false;
    },

    // =====================
    // CHOICE SYSTEM
    // =====================

    showChoice: function(choiceId, state) {
      var choice = FA.lookup('choices', choiceId);
      if (!choice) return;

      // Filter options by conditions
      var availableOptions = [];
      for (var i = 0; i < choice.options.length; i++) {
        var opt = choice.options[i];
        if (!opt.condition || opt.condition(state)) {
          availableOptions.push(opt);
        }
      }

      if (availableOptions.length === 0) {
        // No valid options — skip choice, advance narrative
        this._advanceFromChoice(choiceId);
        return;
      }

      state.choiceDialog = {
        id: choiceId,
        text: choice.text,
        options: availableOptions
      };

      FA.playSound('choice');
      FA.emit('city:choice', { choiceId: choiceId });
    },

    resolveChoice: function(choiceId, optionIndex, state) {
      if (!state.choiceDialog || state.choiceDialog.id !== choiceId) return;

      var option = state.choiceDialog.options[optionIndex];
      if (!option) return;

      if (option.effect) {
        option.effect(state);
      }

      state.choiceDialog = null;
      this._advanceFromChoice(choiceId);
    },

    _advanceFromChoice: function(choiceId) {
      // Find next node in graph
      var narCfg = FA.lookup('config', 'narrative');
      var edges = narCfg.graph.edges;
      for (var i = 0; i < edges.length; i++) {
        if (edges[i].from === choiceId) {
          City.showNarrative(edges[i].to);
          return;
        }
      }
    }
  };

  window.Events = Events;
})();
