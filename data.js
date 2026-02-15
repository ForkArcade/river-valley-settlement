// City Builder — Data
// All game definitions: config, terrain, buildings, events, narrative, sounds
// DATA ONLY — no logic here (except simple event effect functions)
(function() {
  'use strict';
  var FA = window.FA;

  // =====================
  // CONFIG
  // =====================

  FA.register('config', 'game', {
    canvasWidth: 1000,
    canvasHeight: 800,
    gridWidth: 20,
    gridHeight: 15,
    tileSize: 40,
    hudHeight: 140,
    startResources: {
      gold: 10,
      food: 20,
      wood: 15,
      stone: 0,
      population: 5,
      maxPopulation: 5,
      happiness: 5
    },
    resourceCaps: {
      gold: 50,
      food: 50,
      wood: 50,
      stone: 50
    },
    eventChance: 0.2,
    foodConsumptionRate: 5,
    starvationPenalty: 2,
    heightScale: 6,
    layout: 'sidebar'
  });

  // =====================
  // LAYOUTS
  // =====================

  FA.register('config', 'layouts', {
    classic: {
      grid: { x: 0, y: 0, w: 800, h: 600 },
      hud: { x: 0, y: 600, w: 1000, h: 140, direction: 'horizontal' },
      resources: { x: 15, y: 612, direction: 'horizontal', spacing: 130 },
      production: { x: 15, y: 630, direction: 'horizontal', spacing: 100 },
      stats: { x: 540, y: 612, items: [
        { label: 'Pop', key: 'pop', x: 0 },
        { label: 'Happy', key: 'happy', x: 120 },
        { label: 'Turn', key: 'turn', x: 230 }
      ]},
      endTurnBtn: { x: 865, y: 608, w: 120, h: 36 },
      buildMenu: { x: 10, y: 652, direction: 'horizontal', btnW: 76, btnH: 82, gap: 4 },
      tileInfo: { x: 800, y: 657, w: 185, h: 82 },
      startTitle: { x: 500, y: 180, size: 48, align: 'center' },
      startSubtitle: { x: 500, y: 250, size: 16, align: 'center' },
      startInstructions: { x: 500, y: 320, spacing: 28, size: 14, align: 'center' },
      startCta: { x: 500, y: 500, size: 22, align: 'center' },
      endTitle: { x: 500, y: 180, size: 40, align: 'center' },
      endScore: { x: 500, y: 260, size: 28, align: 'center' },
      endStats: { x: 500, y: 320, spacing: 26, size: 14, align: 'center' },
      endIdentity: { x: 500, y: 440, size: 16, align: 'center' },
      endCta: { x: 500, y: 520, size: 18, align: 'center' }
    },
    sidebar: {
      grid: { x: 0, y: 0, w: 800, h: 800 },
      hud: { x: 800, y: 0, w: 200, h: 800, direction: 'vertical' },
      resources: { x: 812, y: 12, direction: 'vertical', spacing: 22 },
      production: { x: 812, y: 108, direction: 'vertical', spacing: 16 },
      stats: { x: 812, y: 180, items: [
        { label: 'Pop', key: 'pop', x: 0 },
        { label: 'Happy', key: 'happy', x: 0 },
        { label: 'Turn', key: 'turn', x: 0 }
      ]},
      endTurnBtn: { x: 812, y: 248, w: 176, h: 36 },
      buildMenu: { x: 812, y: 300, direction: 'vertical', btnW: 176, btnH: 34, gap: 2 },
      tileInfo: { x: 812, y: 710, w: 176, h: 80 },
      startTitle: { x: 400, y: 220, size: 48, align: 'center' },
      startSubtitle: { x: 400, y: 290, size: 16, align: 'center' },
      startInstructions: { x: 400, y: 360, spacing: 28, size: 14, align: 'center' },
      startCta: { x: 400, y: 540, size: 22, align: 'center' },
      endTitle: { x: 400, y: 220, size: 40, align: 'center' },
      endScore: { x: 400, y: 300, size: 28, align: 'center' },
      endStats: { x: 400, y: 360, spacing: 26, size: 14, align: 'center' },
      endIdentity: { x: 400, y: 480, size: 16, align: 'center' },
      endCta: { x: 400, y: 560, size: 18, align: 'center' }
    }
  });

  FA.register('config', 'colors', {
    grass: '#6b8e23',
    forest: '#228b22',
    hills: '#8b7355',
    water: '#4682b4',
    ruins: '#696969',
    selected: '#ffd700',
    uiBg: '#1a2a1e',
    uiPanel: '#2d4a3e',
    uiText: '#e8e8e8',
    uiDim: '#888888',
    gold: '#ffd700',
    food: '#ff8c00',
    wood: '#8b4513',
    stone: '#708090',
    pop: '#ffffff',
    happy: '#ff69b4',
    danger: '#ff4444',
    narrative: '#c8b4ff',
    success: '#44cc44'
  });

  // =====================
  // TERRAIN TYPES
  // =====================

  FA.register('terrain', 'plains', {
    name: 'Plains',
    buildable: true,
    color: '#6b8e23',
    char: '.'
  });

  FA.register('terrain', 'forest', {
    name: 'Forest',
    buildable: false,
    clearable: true,
    clearYield: { wood: 2 },
    color: '#228b22',
    char: 'T'
  });

  FA.register('terrain', 'hills', {
    name: 'Hills',
    buildable: true,
    restrictedTo: ['quarry'],
    color: '#8b7355',
    char: '^'
  });

  FA.register('terrain', 'water', {
    name: 'Water',
    buildable: false,
    color: '#4682b4',
    char: '~'
  });

  FA.register('terrain', 'ruins', {
    name: 'Ancient Ruins',
    buildable: false,
    narrative: true,
    color: '#696969',
    char: 'R'
  });

  // =====================
  // BUILDINGS
  // =====================

  FA.register('buildings', 'hut', {
    name: 'Hut',
    description: 'Houses for your people',
    cost: { wood: 5 },
    populationRequired: 0,
    production: null,
    effect: { maxPopulation: 5 },
    terrain: ['plains'],
    char: 'H',
    color: '#8b4513',
    narrativeTrigger: null
  });

  FA.register('buildings', 'farm', {
    name: 'Farm',
    description: 'Grows food to sustain population',
    cost: { wood: 3 },
    populationRequired: 2,
    production: { food: 4 },
    effect: null,
    terrain: ['plains'],
    char: 'F',
    color: '#ff8c00',
    narrativeTrigger: null
  });

  FA.register('buildings', 'lumberMill', {
    name: 'Lumber Mill',
    description: 'Processes wood from nearby forests',
    cost: { wood: 5 },
    populationRequired: 2,
    production: { wood: 3 },
    effect: null,
    terrain: ['plains'],
    char: 'L',
    color: '#a0522d',
    narrativeTrigger: null
  });

  FA.register('buildings', 'quarry', {
    name: 'Quarry',
    description: 'Extracts stone from the hills',
    cost: { wood: 8 },
    populationRequired: 3,
    production: { stone: 2 },
    effect: null,
    terrain: ['hills'],
    char: 'Q',
    color: '#708090',
    narrativeTrigger: null
  });

  FA.register('buildings', 'market', {
    name: 'Market',
    description: 'Trade goods for gold',
    cost: { wood: 8, stone: 5 },
    populationRequired: 3,
    production: { gold: 5 },
    effect: null,
    terrain: ['plains'],
    char: 'M',
    color: '#ffd700',
    narrativeTrigger: null
  });

  FA.register('buildings', 'warehouse', {
    name: 'Warehouse',
    description: 'Increases storage capacity',
    cost: { wood: 10 },
    populationRequired: 1,
    production: null,
    effect: { resourceCapBonus: 50 },
    terrain: ['plains'],
    char: 'W',
    color: '#a0522d',
    narrativeTrigger: null
  });

  FA.register('buildings', 'tavern', {
    name: 'Tavern',
    description: 'A place for rest and stories',
    cost: { wood: 10, stone: 5 },
    populationRequired: 2,
    production: { happiness: 2 },
    effect: null,
    terrain: ['plains'],
    char: 'V',
    color: '#cd853f',
    narrativeTrigger: 'tavern_built'
  });

  FA.register('buildings', 'chapel', {
    name: 'Chapel',
    description: 'A place of peace and reflection',
    cost: { wood: 15, stone: 10 },
    populationRequired: 1,
    production: { happiness: 3 },
    effect: null,
    terrain: ['plains'],
    char: 'C',
    color: '#daa520',
    narrativeTrigger: 'chapel_built'
  });

  FA.register('buildings', 'watchtower', {
    name: 'Watchtower',
    description: 'Guards the settlement',
    cost: { wood: 12, stone: 8 },
    populationRequired: 2,
    production: null,
    effect: { defense: 1 },
    terrain: ['plains'],
    char: 'Y',
    color: '#696969',
    narrativeTrigger: 'watchtower_built'
  });

  FA.register('buildings', 'townHall', {
    name: 'Town Hall',
    description: 'Center of government — unlocks advanced buildings',
    cost: { wood: 30, stone: 20, gold: 10 },
    populationRequired: 3,
    production: null,
    effect: null,
    unlockBuildings: ['library', 'walls'],
    terrain: ['plains'],
    char: 'G',
    color: '#b8860b',
    narrativeTrigger: 'town_hall_built'
  });

  FA.register('buildings', 'library', {
    name: 'Library',
    description: 'Repository of knowledge',
    cost: { wood: 25, stone: 15 },
    populationRequired: 2,
    production: null,
    effect: { knowledge: 1 },
    unlockCondition: 'town_hall_built',
    terrain: ['plains'],
    char: 'B',
    color: '#4682b4',
    narrativeTrigger: 'library_built'
  });

  FA.register('buildings', 'walls', {
    name: 'Walls',
    description: 'Strong fortifications',
    cost: { stone: 40 },
    populationRequired: 0,
    production: null,
    effect: { defense: 3 },
    unlockCondition: 'town_hall_built',
    terrain: ['plains'],
    char: '#',
    color: '#708090',
    narrativeTrigger: null
  });

  // =====================
  // RANDOM EVENTS
  // =====================

  FA.register('events', 'drought', {
    name: 'Drought',
    text: 'A harsh drought strikes the land. Crops wither.',
    effect: function(state) {
      state.resources.food = Math.max(0, state.resources.food - 4);
    }
  });

  FA.register('events', 'traders', {
    name: 'Traveling Traders',
    text: 'Merchants pass through, offering goods for fair prices.',
    effect: function(state) {
      state.resources.gold += 10;
    }
  });

  FA.register('events', 'plague', {
    name: 'Plague',
    text: 'Illness spreads through the settlement. People fall sick.',
    effect: function(state) {
      state.resources.population = Math.max(1, state.resources.population - 5);
    }
  });

  FA.register('events', 'discovery', {
    name: 'Ancient Discovery',
    text: 'Scouts report strange structures in the distance.',
    effect: function(state) {
      // Reveal a random undiscovered ruins tile
      for (var y = 0; y < state.grid.length; y++) {
        for (var x = 0; x < state.grid[y].length; x++) {
          if (state.grid[y][x].terrain === 'ruins' && !state.grid[y][x].discovered) {
            state.grid[y][x].discovered = true;
            return;
          }
        }
      }
    }
  });

  FA.register('events', 'bandits', {
    name: 'Bandit Raid',
    text: 'Bandits raid the settlement under cover of night!',
    effect: function(state) {
      var defense = window.City ? window.City.calculateDefense(state) : 0;
      if (defense === 0) {
        var loss = Math.min(state.resources.gold, 15);
        state.resources.gold -= loss;
      }
    }
  });

  FA.register('events', 'goodHarvest', {
    name: 'Bountiful Harvest',
    text: 'The fields yield an exceptional harvest this season!',
    effect: function(state) {
      state.resources.food += 8;
    }
  });

  FA.register('events', 'wanderers', {
    name: 'Wandering Workers',
    text: 'A small group of workers seeks to join your settlement.',
    effect: function(state) {
      if (state.resources.population < state.resources.maxPopulation) {
        var gain = Math.min(3, state.resources.maxPopulation - state.resources.population);
        state.resources.population += gain;
      }
    }
  });

  // =====================
  // NARRATIVE
  // =====================

  FA.register('config', 'narrative', {
    startNode: 'founding',
    variables: {
      population: 5,
      buildings_count: 0,
      turns: 0,
      happiness: 5,
      welcomed_strangers: false,
      studied_ruins: false,
      defense_choice: null,
      city_identity: null,
      narrative_bonus: 0,
      town_hall_built: false,
      tavern_built: false,
      chapel_built: false,
      watchtower_built: false,
      library_built: false
    },
    graph: {
      nodes: [
        { id: 'founding', label: 'The Founding', type: 'scene' },
        { id: 'first_shelter', label: 'First Shelter', type: 'scene' },
        { id: 'first_harvest', label: 'First Harvest', type: 'scene' },
        { id: 'strangers_arrive', label: 'Strangers at the Gate', type: 'choice' },
        { id: 'the_ruins', label: 'The Ancient Ruins', type: 'choice' },
        { id: 'first_winter', label: 'First Winter', type: 'scene' },
        { id: 'growing_town', label: 'A Growing Town', type: 'scene' },
        { id: 'bandit_threat', label: 'The Bandit Threat', type: 'choice' },
        { id: 'town_hall_built', label: 'Seat of Power', type: 'scene' },
        { id: 'the_scholar', label: 'The Scholar', type: 'scene' },
        { id: 'festival', label: 'The Festival', type: 'scene' },
        { id: 'crossroads', label: 'Crossroads', type: 'choice' },
        { id: 'legacy', label: 'Legacy', type: 'ending' }
      ],
      edges: [
        { from: 'founding', to: 'first_shelter' },
        { from: 'first_shelter', to: 'first_harvest' },
        { from: 'first_harvest', to: 'strangers_arrive' },
        { from: 'strangers_arrive', to: 'the_ruins' },
        { from: 'the_ruins', to: 'first_winter' },
        { from: 'first_winter', to: 'growing_town' },
        { from: 'growing_town', to: 'bandit_threat' },
        { from: 'bandit_threat', to: 'town_hall_built' },
        { from: 'town_hall_built', to: 'the_scholar' },
        { from: 'the_scholar', to: 'festival' },
        { from: 'festival', to: 'crossroads' },
        { from: 'crossroads', to: 'legacy' }
      ]
    }
  });

  // Narrative text for each node
  FA.register('narrativeText', 'founding', {
    text: 'You arrive at a fertile river valley. The land is rich and the water runs clear. Time to build a new home.',
    color: '#c8b4ff'
  });

  FA.register('narrativeText', 'first_shelter', {
    text: 'The first structure stands against the sky. Your people have shelter at last.',
    color: '#8b4513'
  });

  FA.register('narrativeText', 'first_harvest', {
    text: 'Golden grain sways in the fields. The settlement can sustain itself now.',
    color: '#ff8c00'
  });

  FA.register('narrativeText', 'strangers_arrive', {
    text: 'A group of weary travelers appears at the edge of your settlement...',
    color: '#ffd700'
  });

  FA.register('narrativeText', 'the_ruins', {
    text: 'Strange symbols cover ancient walls. The ruins hold secrets of a forgotten civilization...',
    color: '#c8b4ff'
  });

  FA.register('narrativeText', 'first_winter', {
    text: 'Frost covers the fields. Your first winter tests the settlement\'s resolve. Will your stores hold?',
    color: '#aaccff'
  });

  FA.register('narrativeText', 'growing_town', {
    text: 'Word spreads of your settlement. Merchants and artisans arrive. This is no longer a village — it\'s a town.',
    color: '#44cc44'
  });

  FA.register('narrativeText', 'bandit_threat', {
    text: 'Smoke rises on the horizon. Scouts report a bandit camp forming nearby...',
    color: '#ff4444'
  });

  FA.register('narrativeText', 'town_hall_built', {
    text: 'The Town Hall stands proud at the center. Your settlement now has a seat of governance.',
    color: '#b8860b'
  });

  FA.register('narrativeText', 'the_scholar', {
    text: 'An old scholar arrives, drawn by your library. "Knowledge is the true foundation of any great city," she says.',
    color: '#4682b4'
  });

  FA.register('narrativeText', 'festival', {
    text: 'Music and laughter fill the streets! The first festival celebrates how far you\'ve come.',
    color: '#ff69b4'
  });

  FA.register('narrativeText', 'crossroads', {
    text: 'Your settlement stands at a crossroads. The decisions you make now will echo through generations.',
    color: '#ffd700'
  });

  FA.register('narrativeText', 'legacy', {
    text: 'You have built something that will endure. Your legacy is written in stone and story.',
    color: '#c8b4ff'
  });

  // =====================
  // NARRATIVE CHOICES
  // =====================

  FA.register('choices', 'strangers_arrive', {
    text: 'Weary travelers seek refuge in your growing settlement. They bring strong hands but empty stomachs.',
    options: [
      {
        label: 'Welcome them',
        text: 'Welcome them — more hands to build with (+5 population, +200 bonus)',
        effect: function(state) {
          state.resources.population += 5;
          state.resources.maxPopulation += 5;
          FA.narrative.setVar('welcomed_strangers', true, 'Welcomed the strangers');
          FA.narrative.setVar('narrative_bonus', (FA.narrative.getVar('narrative_bonus') || 0) + 200, 'Strangers welcomed');
        }
      },
      {
        label: 'Turn them away',
        text: 'Turn them away — we barely have enough for ourselves (+5 food)',
        effect: function(state) {
          state.resources.food += 5;
          FA.narrative.setVar('welcomed_strangers', false, 'Turned strangers away');
        }
      }
    ]
  });

  FA.register('choices', 'the_ruins', {
    text: 'The ancient ruins contain strange artifacts covered in glowing symbols. The scholar in your group is fascinated.',
    options: [
      {
        label: 'Study them',
        text: 'Study the ruins — unlock their secrets (+300 bonus)',
        effect: function(state) {
          FA.narrative.setVar('studied_ruins', true, 'Studying the ancient ruins');
          FA.narrative.setVar('narrative_bonus', (FA.narrative.getVar('narrative_bonus') || 0) + 300, 'Ruins studied');
        }
      },
      {
        label: 'Sell the artifacts',
        text: 'Sell the artifacts to passing traders (+20 gold)',
        effect: function(state) {
          state.resources.gold += 20;
          FA.narrative.setVar('studied_ruins', false, 'Sold the artifacts');
        }
      }
    ]
  });

  FA.register('choices', 'bandit_threat', {
    text: 'A bandit warband has camped near your settlement. They demand tribute or threaten to attack.',
    options: [
      {
        label: 'Defend',
        text: 'Stand and fight — rally the watchtowers (requires watchtower, +400 bonus)',
        condition: function(state) {
          return window.City && window.City.calculateDefense(state) >= 1;
        },
        effect: function(state) {
          FA.narrative.setVar('defense_choice', 'defend', 'Defended against bandits');
          FA.narrative.setVar('narrative_bonus', (FA.narrative.getVar('narrative_bonus') || 0) + 400, 'Bandits defeated');
        }
      },
      {
        label: 'Pay tribute',
        text: 'Pay them off — gold buys peace (-15 gold, +100 bonus)',
        effect: function(state) {
          state.resources.gold = Math.max(0, state.resources.gold - 15);
          FA.narrative.setVar('defense_choice', 'pay', 'Paid tribute to bandits');
          FA.narrative.setVar('narrative_bonus', (FA.narrative.getVar('narrative_bonus') || 0) + 100, 'Tribute paid');
        }
      },
      {
        label: 'Negotiate',
        text: 'Negotiate with words — your reputation precedes you (requires happiness ≥ 15, +200 bonus)',
        condition: function(state) {
          return state.resources.happiness >= 15;
        },
        effect: function(state) {
          FA.narrative.setVar('defense_choice', 'negotiate', 'Negotiated with bandits');
          FA.narrative.setVar('narrative_bonus', (FA.narrative.getVar('narrative_bonus') || 0) + 200, 'Bandits negotiated');
        }
      }
    ]
  });

  FA.register('choices', 'crossroads', {
    text: 'Your city stands at a crossroads. What will define its future for generations to come?',
    options: [
      {
        label: 'Trade Hub',
        text: 'Become a center of commerce — wealth flows through our streets (+10 gold/turn, +300 bonus)',
        effect: function(state) {
          FA.narrative.setVar('city_identity', 'trade', 'Chose trade hub identity');
          FA.narrative.setVar('narrative_bonus', (FA.narrative.getVar('narrative_bonus') || 0) + 300, 'Trade hub');
          // Permanent gold bonus applied in city.js processTurn
        }
      },
      {
        label: 'Fortress',
        text: 'Build an impregnable fortress — none shall threaten us again (+5 defense, +400 bonus)',
        effect: function(state) {
          FA.narrative.setVar('city_identity', 'fortress', 'Chose fortress identity');
          FA.narrative.setVar('narrative_bonus', (FA.narrative.getVar('narrative_bonus') || 0) + 400, 'Fortress');
        }
      },
      {
        label: 'Center of Learning',
        text: 'Pursue knowledge above all — scholars will flock to our halls (+500 bonus)',
        effect: function(state) {
          FA.narrative.setVar('city_identity', 'learning', 'Chose center of learning');
          FA.narrative.setVar('narrative_bonus', (FA.narrative.getVar('narrative_bonus') || 0) + 500, 'Center of learning');
        }
      }
    ]
  });

  // =====================
  // SOUNDS
  // =====================

  FA.defineSound('build', function(actx, dest) {
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, actx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, actx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.12);
  });

  FA.defineSound('endTurn', function(actx, dest) {
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, actx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, actx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.15);
  });

  FA.defineSound('danger', function(actx, dest) {
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, actx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.35);
  });

  FA.defineSound('choice', function(actx, dest) {
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, actx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, actx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.2);
  });

  FA.defineSound('narrative', function(actx, dest) {
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, actx.currentTime);
    osc.frequency.linearRampToValueAtTime(659, actx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(784, actx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(actx.currentTime + 0.5);
  });

})();
