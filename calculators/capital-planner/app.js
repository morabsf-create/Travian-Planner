/**
 * CAPITAL PLANNER — gross-production ROI path
 * Requires data.js: BUILDING_DB, PRODUCTION_CURVE, getBuildingCost
 */

const CONSTANTS = {
  TRIBE_EGYPT_BONUS: 0.05,
  FACTORY_BONUS: 0.05
};

const TEMPLATES = {
  '4446': { w: 4, c: 4, i: 4, cr: 6 },
  '11115': { w: 1, c: 1, i: 1, cr: 15 },
  '3339': { w: 3, c: 3, i: 3, cr: 9 },
  '4437': { w: 4, c: 4, i: 3, cr: 7 },
  '3447': { w: 3, c: 4, i: 4, cr: 7 },
  '4347': { w: 4, c: 3, i: 4, cr: 7 },
  '3456': { w: 3, c: 4, i: 5, cr: 6 },
  '4536': { w: 4, c: 5, i: 3, cr: 6 },
  '5346': { w: 5, c: 3, i: 4, cr: 6 },
  '3546': { w: 3, c: 5, i: 4, cr: 6 },
  '4356': { w: 4, c: 3, i: 5, cr: 6 },
  '5436': { w: 5, c: 4, i: 3, cr: 6 },
  '00018': { w: 0, c: 0, i: 0, cr: 18 }
};

const FIELD_DB_NAMES = {
  wood: 'Woodcutter',
  clay: 'Clay Pit',
  iron: 'Iron Mine',
  crop: 'Cropland'
};

const FACTORIES = [
  { id: 'sawmill', db: 'Sawmill', reqField: 'wood', reqLvl: 10, enabled: 'useSawmill' },
  { id: 'brickyard', db: 'Brickyard', reqField: 'clay', reqLvl: 10, enabled: 'useBrickyard' },
  { id: 'foundry', db: 'Iron Foundry', reqField: 'iron', reqLvl: 10, enabled: 'useFoundry' },
  { id: 'mill', db: 'Grain Mill', reqField: 'crop', reqLvl: 5, enabled: 'useMill' },
  { id: 'bakery', db: 'Bakery', reqField: 'crop', reqLvl: 10, reqBuild: 'mill', reqBuildLvl: 5, enabled: 'useBakery' },
  { id: 'waterworks', db: 'Waterworks', tribe: 'egyptian', enabled: 'useWaterworks' }
];

const deepCopy = value => JSON.parse(JSON.stringify(value));

class TravianEngine {
  constructor(config) {
    this.config = config;
    this.state = this.getInitialState();
  }

  getInitialState() {
    const tpl = TEMPLATES[this.config.villageType] || TEMPLATES['4446'];
    return {
      wood: Array(tpl.w).fill(0),
      clay: Array(tpl.c).fill(0),
      iron: Array(tpl.i).fill(0),
      crop: Array(tpl.cr).fill(0),
      sawmill: 0,
      brickyard: 0,
      foundry: 0,
      mill: 0,
      bakery: 0,
      waterworks: 0,
      hm: 0,
      claimedOases: []
    };
  }

  calculateHourlyProduction(state) {
    const base = resource => state[resource].reduce(
      (sum, level) => sum + PRODUCTION_CURVE[level], 0
    );
    const oasisBonus = { wood: 0, clay: 0, iron: 0, crop: 0 };

    state.claimedOases.forEach(index => {
      const oasis = this.config.oases[index];
      if (!oasis) return;
      ['wood', 'clay', 'iron', 'crop'].forEach(resource => {
        oasisBonus[resource] += oasis[resource] || 0;
      });
    });

    // Waterworks improves oasis bonuses only; resource buildings remain additive.
    const waterworksMultiplier = this.config.tribe === 'egyptian'
      ? 1 + state.waterworks * CONSTANTS.TRIBE_EGYPT_BONUS
      : 1;
    const buildingBonus = {
      wood: state.sawmill * CONSTANTS.FACTORY_BONUS,
      clay: state.brickyard * CONSTANTS.FACTORY_BONUS,
      iron: state.foundry * CONSTANTS.FACTORY_BONUS,
      crop: (state.mill + state.bakery) * CONSTANTS.FACTORY_BONUS
    };
    const production = {};

    ['wood', 'clay', 'iron', 'crop'].forEach(resource => {
      production[resource] = base(resource) * (
        1 + buildingBonus[resource] + oasisBonus[resource] * waterworksMultiplier
      ) * this.config.goldBonus;
    });

    production.total = production.wood + production.clay + production.iron + production.crop;
    return production;
  }

  getHeroMansionCosts(fromLevel, targetLevel) {
    const costs = [];
    for (let level = fromLevel + 1; level <= targetLevel; level++) {
      const cost = getBuildingCost("Hero's Mansion", level);
      if (!cost) return null;
      costs.push({ level, cost: cost.total });
    }
    return costs;
  }

  evaluateField(resource, index, currentTotal) {
    const state = deepCopy(this.state);
    const level = state[resource][index];
    if (level >= this.config.maxLevel) return null;

    const cost = getBuildingCost(FIELD_DB_NAMES[resource], level + 1);
    if (!cost) return null;
    state[resource][index]++;

    return this.makeMove({
      type: 'field', resource, index, level: level + 1,
      cost: cost.total, state, currentTotal
    });
  }

  evaluateBuilding(factory, currentTotal) {
    const state = deepCopy(this.state);
    const level = state[factory.id];
    const db = BUILDING_DB[factory.db];
    if (!db || level >= db.max) return null;

    const cost = getBuildingCost(factory.db, level + 1);
    if (!cost) return null;
    state[factory.id]++;

    return this.makeMove({
      type: 'building', key: factory.id, name: factory.db, level: level + 1,
      cost: cost.total, state, currentTotal
    });
  }

  evaluateOasis(oasisIndex, currentTotal) {
    if (this.state.claimedOases.includes(oasisIndex)) return null;
    const requiredHm = [10, 15, 20][this.state.claimedOases.length];
    if (requiredHm === undefined) return null;

    const hmSteps = this.getHeroMansionCosts(this.state.hm, requiredHm);
    if (!hmSteps) return null;

    const state = deepCopy(this.state);
    state.hm = requiredHm;
    state.claimedOases.push(oasisIndex);
    const cost = hmSteps.reduce((sum, step) => sum + step.cost, 0);

    return this.makeMove({
      type: 'oasis', oasisIndex, requiredHm, hmSteps,
      cost, state, currentTotal
    });
  }

  makeMove(move) {
    const newProduction = this.calculateHourlyProduction(move.state);
    const gain = newProduction.total - move.currentTotal;
    if (gain <= 0.01 || move.cost <= 0) return null;

    return {
      ...move,
      production: newProduction.total,
      gain,
      roi: move.cost / gain
    };
  }

  isFactoryAvailable(factory) {
    if (!this.config[factory.enabled]) return false;
    if (factory.tribe && this.config.tribe !== factory.tribe) return false;
    if (factory.reqField && Math.max(...this.state[factory.reqField]) < factory.reqLvl) return false;
    if (factory.reqBuild && this.state[factory.reqBuild] < factory.reqBuildLvl) return false;
    return true;
  }

  getCandidates(currentTotal) {
    const candidates = [];

    // Evaluate every legal individual field upgrade, not only the lowest field.
    ['wood', 'clay', 'iron', 'crop'].forEach(resource => {
      this.state[resource].forEach((_, index) => {
        const candidate = this.evaluateField(resource, index, currentTotal);
        if (candidate) candidates.push(candidate);
      });
    });

    FACTORIES.forEach(factory => {
      if (!this.isFactoryAvailable(factory)) return;
      const candidate = this.evaluateBuilding(factory, currentTotal);
      if (candidate) candidates.push(candidate);
    });

    // Oasis order is chosen by ROI; UI slot order does not constrain annexation order.
    this.config.oases.forEach((oasis, index) => {
      if (!oasis || Object.keys(oasis).length === 0) return;
      const candidate = this.evaluateOasis(index, currentTotal);
      if (candidate) candidates.push(candidate);
    });

    return candidates;
  }

  addOasisSteps(steps, move, totalSpent) {
    let runningTotal = totalSpent;
    const production = Math.round(this.calculateHourlyProduction(this.state).total);

    move.hmSteps.forEach(hm => {
      runningTotal += hm.cost;
      steps.push({
        type: 'hm',
        level: hm.level,
        production,
        cost: hm.cost,
        totalSpent: runningTotal,
        roi: null,
        state: deepCopy(this.state)
      });
    });

    steps.push({
      type: 'oasis',
      oasisIndex: move.oasisIndex,
      level: this.state.claimedOases.length,
      production: Math.round(move.production),
      cost: 0,
      totalSpent: runningTotal,
      roi: move.roi,
      state: deepCopy(this.state)
    });

    return runningTotal;
  }

  runSimulation() {
    const steps = [{
      type: 'start', level: 0,
      production: Math.round(this.calculateHourlyProduction(this.state).total),
      cost: 0, totalSpent: 0, roi: null, state: deepCopy(this.state)
    }];
    let totalSpent = 0;
    const MAX_ACTIONS = 2000;

    for (let actionCount = 0; actionCount < MAX_ACTIONS; actionCount++) {
      const currentTotal = this.calculateHourlyProduction(this.state).total;
      const candidates = this.getCandidates(currentTotal);
      if (!candidates.length) break;

      candidates.sort((a, b) => a.roi - b.roi || b.gain - a.gain);
      const best = candidates[0];
      this.state = best.state;

      if (best.type === 'oasis') {
        totalSpent = this.addOasisSteps(steps, best, totalSpent);
        continue;
      }

      totalSpent += best.cost;
      steps.push({
        type: best.type === 'field' ? best.resource : best.key,
        level: best.level,
        production: Math.round(best.production),
        cost: best.cost,
        totalSpent,
        roi: best.roi,
        state: deepCopy(this.state)
      });
    }

    return { steps, totalSpent };
  }
}

const UI = {
  chartInstance: null,
  currentResult: null,

  setTab(view) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    document.querySelectorAll('.nav-tab')[view === 'calc' ? 0 : 1].classList.add('active');
    if (view === 'chart') this.updateChart();
  },

  getOasisVal(id) {
    const value = document.getElementById(id).value;
    if (value === 'none') return {};
    return value.split('_').reduce((oasis, part) => {
      const [resource, percent] = part.split('-');
      oasis[resource] = Number(percent) / 100;
      return oasis;
    }, {});
  },

  calculateMain() {
    const config = {
      villageType: document.getElementById('villageType').value,
      tribe: document.getElementById('tribe').value,
      maxLevel: Number(document.getElementById('maxLevel').value),
      goldBonus: Number(document.getElementById('goldBonus').value),
      oases: ['oasis1', 'oasis2', 'oasis3'].map(id => this.getOasisVal(id)),
      useSawmill: document.getElementById('useSawmill').checked,
      useBrickyard: document.getElementById('useBrickyard').checked,
      useFoundry: document.getElementById('useFoundry').checked,
      useMill: document.getElementById('useMill').checked,
      useBakery: document.getElementById('useBakery').checked,
      useWaterworks: document.getElementById('useWaterworks').checked
    };

    this.currentResult = new TravianEngine(config).runSimulation();
    this.renderTable(this.currentResult);
    if (document.getElementById('view-chart').classList.contains('active')) this.updateChart();
  },

  updateChart() {
    if (!this.currentResult) return;
    const canvas = document.getElementById('analysisChart');
    const context = canvas.getContext('2d');
    if (this.chartInstance) this.chartInstance.destroy();

    const allPoints = this.currentResult.steps.map(step => ({ x: step.totalSpent, y: step.production }));
    const interval = Math.max(1, Math.ceil(allPoints.length / 50));
    const points = allPoints.filter((_, index) => index % interval === 0 || index === allPoints.length - 1);

    this.chartInstance = new Chart(context, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Gross hourly production', data: points,
          borderColor: '#859f51', backgroundColor: 'rgba(133,159,81,.1)',
          fill: true, tension: .2, pointRadius: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Total resources invested' } },
          y: { title: { display: true, text: 'Gross hourly production' } }
        }
      }
    });
  },

  actionName(type) {
    return {
      wood: 'Woodcutter', clay: 'Clay Pit', iron: 'Iron Mine', crop: 'Cropland',
      sawmill: 'Sawmill', brickyard: 'Brickyard', foundry: 'Iron Foundry',
      mill: 'Grain Mill', bakery: 'Bakery', waterworks: 'Waterworks',
      hm: "Hero's Mansion", oasis: 'Annex oasis'
    }[type] || type;
  },

  renderTable(result) {
    document.getElementById('results-area').style.display = 'block';
    const last = result.steps[result.steps.length - 1];
    document.getElementById('final-prod').innerText = last.production.toLocaleString();
    document.getElementById('final-cost').innerText = result.totalSpent.toLocaleString();
    document.getElementById('final-roi').innerText = last.roi ? `${Math.round(last.roi)}h` : '—';

    const container = document.getElementById('output-grouped');
    container.innerHTML = '';
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Type</th><th>Action</th><th>Gross hourly production</th><th>Village state</th></tr></thead><tbody></tbody>';
    const body = table.querySelector('tbody');

    result.steps.slice(1).forEach(step => {
      const row = document.createElement('tr');
      const isOasis = step.type === 'oasis';
      const action = isOasis
        ? `Annex selected oasis ${step.oasisIndex + 1}`
        : `Upgrade ${this.actionName(step.type)} to level ${step.level}`;
      const roi = step.roi ? ` <span style="font-size:.8em;color:#888">(package ROI: ${Math.round(step.roi)}h)</span>` : '';
      row.innerHTML = `
        <td>${this.actionName(step.type)}</td>
        <td>${action}${roi}</td>
        <td>${step.production.toLocaleString()}</td>
        <td>${this.renderState(step.state)}</td>`;
      body.appendChild(row);
    });

    container.appendChild(table);
  },

  renderState(state) {
    const fields = ['wood', 'clay', 'iron', 'crop'].map(resource => {
      if (!state[resource].length) return '';
      const levels = state[resource].reduce((counts, level) => {
        counts[level] = (counts[level] || 0) + 1;
        return counts;
      }, {});
      const text = Object.entries(levels)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([level, count]) => `${count}×${level}`).join(' ');
      return `${resource[0].toUpperCase()}: ${text}`;
    }).filter(Boolean);

    const buildings = [
      ['sawmill', 'S'], ['brickyard', 'B'], ['foundry', 'F'],
      ['mill', 'M'], ['bakery', 'Ba'], ['waterworks', 'W'], ['hm', 'HM']
    ].filter(([key]) => state[key] > 0)
      .map(([key, label]) => `${label}${state[key]}`);

    const oasis = state.claimedOases.length ? `Oases: ${state.claimedOases.length}` : '';
    return [...fields, buildings.join(' '), oasis].filter(Boolean).join('<br>');
  }
};
