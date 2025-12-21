/**
 * CAPITAL PLANNER LOGIC
 */

// --- ENGINE SECTION ---
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

class TravianEngine {
    constructor(config) {
        this.config = config;
        this.state = this.getInitialState();
    }

    getInitialState() {
        const tpl = TEMPLATES[this.config.villageType] || TEMPLATES['4446'];
        return {
            wood: Array(tpl.w).fill(0), clay: Array(tpl.c).fill(0),
            iron: Array(tpl.i).fill(0), crop: Array(tpl.cr).fill(0),
            sawmill: 0, brickyard: 0, foundry: 0, mill: 0, bakery: 0,
            waterworks: 0, oasisActive: 0, hm: 0
        };
    }

    calculateHourlyProduction(state) {
        // PRODUCTION_CURVE is available globally via data.js
        const getBase = (arr) => arr.reduce((sum, lvl) => sum + (lvl > 0 ? PRODUCTION_CURVE[lvl-1] : 0), 0);
        
        const isEgypt = this.config.tribe === 'egyptian';
        const wwBonus = isEgypt ? (1 + state.waterworks * CONSTANTS.TRIBE_EGYPT_BONUS) : 1;
        const goldBonus = this.config.goldBonus; 

        let wOasis = 0, cOasis = 0, iOasis = 0, crOasis = 0;
        for(let k=0; k < state.oasisActive; k++) {
            const o = this.config.oases[k];
            if(o.wood) wOasis += o.wood;
            if(o.clay) cOasis += o.clay;
            if(o.iron) iOasis += o.iron;
            if(o.crop) crOasis += o.crop;
        }

        const wBase = getBase(state.wood);
        const wProd = wBase * (1 + (state.sawmill * CONSTANTS.FACTORY_BONUS) + (wOasis * wwBonus)) * goldBonus;
        const cBase = getBase(state.clay);
        const cProd = cBase * (1 + (state.brickyard * CONSTANTS.FACTORY_BONUS) + (cOasis * wwBonus)) * goldBonus;
        const iBase = getBase(state.iron);
        const iProd = iBase * (1 + (state.foundry * CONSTANTS.FACTORY_BONUS) + (iOasis * wwBonus)) * goldBonus;
        const crBase = getBase(state.crop);
        const crProd = crBase * (1 + (crOasis * wwBonus) + (state.mill * CONSTANTS.FACTORY_BONUS) + (state.bakery * CONSTANTS.FACTORY_BONUS)) * goldBonus;

        return {
            wood: wProd, clay: cProd, iron: iProd, crop: crProd,
            total: wProd + cProd + iProd + crProd
        };
    }

    evaluateUpgrade(action, currentProdTotal) {
        const stateCopy = JSON.parse(JSON.stringify(this.state));
        let cost = 0;
        let valid = false;

        // VERIFICATION: Using getBuildingCost uses the data.js Database, not hardcoded arrays
        if (action.type === 'field') {
            const lvl = stateCopy[action.res][action.idx];
            if (lvl < this.config.maxLevel) {
                const dbNameMap = { wood: "Woodcutter", clay: "Clay Pit", iron: "Iron Mine", crop: "Cropland" };
                const c = getBuildingCost(dbNameMap[action.res], lvl + 1);
                if (c) {
                    cost = c.total;
                    stateCopy[action.res][action.idx]++;
                    valid = true;
                }
            }
        } else if (action.type === 'building') {
            const lvl = stateCopy[action.name];
            const db = BUILDING_DB[action.name];
            if (lvl < db.max) {
                const c = getBuildingCost(action.name, lvl + 1);
                if (c) {
                    cost = c.total;
                    stateCopy[action.name]++;
                    valid = true;
                }
            }
        } else if (action.type === 'oasis') {
             if (stateCopy.oasisActive < 3) {
                 const reqHm = [10, 15, 20][stateCopy.oasisActive];
                 let hmCost = 0;
                 while (stateCopy.hm < reqHm) {
                     hmCost += getBuildingCost("Hero's Mansion", stateCopy.hm + 1).total;
                     stateCopy.hm++;
                 }
                 cost = hmCost; 
                 stateCopy.oasisActive++;
                 valid = true;
             }
        }

        if (!valid || cost === 0) return { roi: Infinity };

        const newMetrics = this.calculateHourlyProduction(stateCopy);
        const gain = newMetrics.total - currentProdTotal;
        if (gain <= 0.01) return { roi: Infinity }; 

        return {
            roi: cost / gain,
            cost: cost,
            prod: newMetrics.total,
            newState: stateCopy
        };
    }

    runSimulation() {
        const steps = [];
        let totalSpent = 0;
        const MAX_STEPS = 1500; 

        // Step 0
        steps.push({
            step: 0, desc: "Start", prod: Math.round(this.calculateHourlyProduction(this.state).total), 
            cost: 0, totalSpent: 0, roi: 0, state: JSON.parse(JSON.stringify(this.state))
        });

        for(let step=0; step<MAX_STEPS; step++) {
            const currentMetrics = this.calculateHourlyProduction(this.state);
            let bestMove = { roi: Infinity };
            let bestAction = null;

            // 1. Fields
            ['wood', 'clay', 'iron', 'crop'].forEach(res => {
                const arr = this.state[res];
                if(arr.length === 0) return;
                const minLvl = Math.min(...arr);
                const idx = arr.indexOf(minLvl);
                
                const result = this.evaluateUpgrade({ type: 'field', res, idx }, currentMetrics.total);
                if (result.roi < bestMove.roi) {
                    bestMove = result;
                    bestAction = { type: 'field', name: res, lvl: minLvl+1, sortKey: res };
                }
            });

            // 2. Buildings
            const factories = [
                { id: 'sawmill', db: 'Sawmill', reqField: 'wood', reqLvl: 10 },
                { id: 'brickyard', db: 'Brickyard', reqField: 'clay', reqLvl: 10 },
                { id: 'foundry', db: 'Iron Foundry', reqField: 'iron', reqLvl: 10 },
                { id: 'mill', db: 'Grain Mill', reqField: 'crop', reqLvl: 5 },
                { id: 'bakery', db: 'Bakery', reqField: 'crop', reqLvl: 10, reqBuild: 'mill', reqBuildLvl: 5 },
                { id: 'waterworks', db: 'Waterworks', tribe: 'egyptian' } 
            ];

            factories.forEach(f => {
                if (f.reqField) {
                    const maxField = Math.max(...this.state[f.reqField]);
                    if (maxField < f.reqLvl) return;
                }
                if (f.reqBuild) {
                    if (this.state[f.reqBuild] < f.reqBuildLvl) return;
                }
                if (f.tribe && this.config.tribe !== f.tribe) return;

                const result = this.evaluateUpgrade({ type: 'building', name: f.db }, currentMetrics.total);
                if (result.roi < bestMove.roi) {
                    bestMove = result;
                    bestAction = { type: 'building', name: f.db, lvl: this.state[f.id] + 1, sortKey: f.id };
                }
            });

            // 3. Oasis
            if (this.state.oasisActive < 3 && Object.keys(this.config.oases[this.state.oasisActive]).length > 0) {
                 const result = this.evaluateUpgrade({ type: 'oasis' }, currentMetrics.total);
                 if (result.roi < bestMove.roi) {
                     bestMove = result;
                     bestAction = { type: 'oasis', lvl: this.state.oasisActive + 1, sortKey: 'oasis' };
                 }
            }

            if (bestMove.roi === Infinity) break;

            this.state = bestMove.newState;
            totalSpent += bestMove.cost;
            
            steps.push({
                step: step + 1,
                desc: this.formatActionDesc(bestAction),
                type: bestAction.sortKey, 
                lvl: bestAction.lvl,
                prod: Math.round(bestMove.prod),
                cost: bestMove.cost,
                totalSpent: totalSpent,
                roi: Math.round(bestMove.roi),
                state: bestMove.newState 
            });
        }
        return { steps, totalSpent };
    }

    formatActionDesc(action) {
        if (action.type === 'field') {
            const map = { wood: 'Bosco', clay: 'Argilla', iron: 'Miniera', crop: 'Grano' };
            return `Migliora ${map[action.name]} al livello ${action.lvl}`;
        }
        if (action.type === 'building') {
            const map = { 'Sawmill': 'Segheria', 'Brickyard': 'Fornace', 'Iron Foundry': 'Fonderia', 'Grain Mill': 'Mulino', 'Bakery': 'Forno', 'Waterworks': 'Acquedotto' };
            return `Costruisci ${map[action.name] || action.name} al livello ${action.lvl}`;
        }
        if (action.type === 'oasis') return `Conquista Oasi`;
        return 'Azione';
    }
}

// --- UI SECTION ---
const UI = {
    chartInstance: null,
    currentResult: null,

    setTab: function(view) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
        
        document.getElementById('view-' + view).classList.add('active');
        const tabs = document.querySelectorAll('.nav-tab');
        if(view === 'calc') tabs[0].classList.add('active');
        else tabs[1].classList.add('active');
        
        if (view === 'chart') this.updateChart();
    },

    getOasisVal: function(id) {
        const val = document.getElementById(id).value;
        if(val === 'none') return {};
        // Handles "wood-25_crop-25" style strings
        const parts = val.split('_');
        const res = {};
        parts.forEach(p => {
            const [type, num] = p.split('-');
            // Convert '25' to 0.25
            res[type] = parseFloat(num) / 100.0;
        });
        return res;
    },

    calculateMain: function() {
        const config = {
            villageType: document.getElementById('villageType').value,
            tribe: document.getElementById('tribe').value,
            maxLevel: parseInt(document.getElementById('maxLevel').value),
            goldBonus: parseFloat(document.getElementById('goldBonus').value),
            oases: [this.getOasisVal('oasis1'), this.getOasisVal('oasis2'), this.getOasisVal('oasis3')]
        };
        const engine = new TravianEngine(config);
        const result = engine.runSimulation();
        this.renderTable(result);
        this.currentResult = result;
        if(document.getElementById('view-chart').classList.contains('active')) this.updateChart();
    },

    updateChart: function() {
        if(!this.currentResult) return;
        const ctx = document.getElementById('analysisChart').getContext('2d');
        if (this.chartInstance) this.chartInstance.destroy();

        const rawData = this.currentResult.steps.map(s => ({ x: s.totalSpent, y: s.prod }));
        // Downsample chart points for performance
        const dataPoints = rawData.filter((_, i) => i % Math.ceil(rawData.length / 50) === 0 || i === rawData.length - 1);

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Produzione Oraria',
                    data: dataPoints,
                    borderColor: '#859f51',
                    backgroundColor: 'rgba(133, 159, 81, 0.1)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'Risorse Totali' }, ticks: { callback: function(value) { return value >= 1000000 ? (value/1000000).toFixed(1) + 'M' : (value/1000).toFixed(0) + 'k'; } } },
                    y: { title: { display: true, text: 'Prod. Oraria' } }
                }
            }
        });
    },

    renderTable: function(res) {
        document.getElementById('results-area').style.display = 'block';
        const steps = res.steps;
        if(steps.length > 0) {
            const last = steps[steps.length-1];
            document.getElementById('final-prod').innerText = last.prod.toLocaleString();
            document.getElementById('final-cost').innerText = res.totalSpent.toLocaleString();
            document.getElementById('final-roi').innerText = last.roi + "h";
        }
        
        const container = document.getElementById('output-grouped');
        container.innerHTML = '';
        const table = document.createElement('table');
        table.innerHTML = `<thead><tr><th class="col-type">Tipo</th><th class="col-action">Azione</th><th class="col-prod">Prod. Oraria</th><th class="col-status">Stato Villaggio</th></tr></thead><tbody></tbody>`;
        const tbody = table.querySelector('tbody');

        if(steps.length === 0) return;

        // --- GROUPING LOGIC ---
        // We look for consecutive steps that are the same Type and same Level
        let group = { ...steps[1], count: 1 }; // Start at index 1 (skip step 0)

        const flushGroup = (g) => {
            const tr = document.createElement('tr');
            
            // Theme Badge
            let theme = 'theme-special';
            let label = g.type ? g.type.toUpperCase() : 'ACTION';
            if(['wood','sawmill'].includes(g.type)) { theme = 'theme-wood'; label = 'LEGNO'; }
            else if(['clay','brickyard'].includes(g.type)) { theme = 'theme-clay'; label = 'ARGILLA'; }
            else if(['iron','foundry'].includes(g.type)) { theme = 'theme-iron'; label = 'FERRO'; }
            else if(['crop','mill','bakery'].includes(g.type)) { theme = 'theme-crop'; label = 'GRANO'; }
            else if(g.type === 'oasis') { theme = 'theme-special'; label = 'OASI'; }

            // Action Text
            let actionText = "";
            const mapName = {
                wood: 'Bosco', clay: 'Argilla', iron: 'Miniera', crop: 'Grano',
                sawmill: 'Segheria', brickyard: 'Fornace', foundry: 'Fonderia', 
                mill: 'Mulino', bakery: 'Forno', waterworks: 'Acquedotto', oasis: 'Oasi'
            };
            const name = mapName[g.type] || g.type;

            if (['wood','clay','iron','crop'].includes(g.type)) {
                // e.g., "Porta 3 Grano al livello 5"
                actionText = `Porta <b>${g.count}</b> ${name} al livello <b>${g.lvl}</b>`;
            } else {
                actionText = `Costruisci ${name} al livello ${g.lvl}`;
            }

            // Using "text-cell" and "prod-cell" classes ensures Mobile Friendliness via CSS
            tr.innerHTML = `<td class="type-cell"><span class="badge ${theme}">${label}</span></td>
                <td class="text-cell">${actionText} <span style="font-size:0.8em; color:#888; white-space:nowrap;">(ROI: ${g.roi}h)</span></td>
                <td class="prod-cell">${g.prod.toLocaleString()}</td>
                <td class="status-cell">${this.renderStateChips(g.state)}</td>`;
            tbody.appendChild(tr);
        };

        for (let i = 2; i < steps.length; i++) {
            const s = steps[i];
            // Check if matches current group (same type, same target level)
            if (s.type === group.type && s.lvl === group.lvl && ['wood','clay','iron','crop'].includes(s.type)) {
                group.count++;
                group.prod = s.prod; // Update to latest production
                group.state = s.state; // Update to latest state (for chips)
            } else {
                flushGroup(group);
                group = { ...s, count: 1 };
            }
        }
        // Flush last group
        if(steps.length > 1) flushGroup(group);

        container.appendChild(table);
    },

    renderStateChips: function(s) {
        if(!s) return '';
        const getChip = (type, icon, lvlArr, factoryLvl) => {
            const counts = {}; lvlArr.forEach(l => counts[l] = (counts[l] || 0) + 1);
            const txt = Object.entries(counts).sort((a,b)=>b[0]-a[0]).map(([l,n]) => `${n}x${l}`).join(' ');
            let html = `<div class="res-chip chip-${type}"><span class="chip-icon">${icon}</span><span class="chip-val">${txt}</span>`;
            if(factoryLvl > 0) html += `<div class="fact-pills"><span class="fact-pill">L${factoryLvl}</span></div>`;
            html += `</div>`;
            return html;
        };
        let html = '<div class="status-grid">';
        if(s.wood && s.wood.length) html += getChip('wood', '🌲', s.wood, s.sawmill);
        if(s.clay && s.clay.length) html += getChip('clay', '🧱', s.clay, s.brickyard);
        if(s.iron && s.iron.length) html += getChip('iron', '⚒️', s.iron, s.foundry);
        if(s.crop && s.crop.length) {
            const counts = {}; s.crop.forEach(l => counts[l] = (counts[l] || 0) + 1);
            const txt = Object.entries(counts).sort((a,b)=>b[0]-a[0]).map(([l,n]) => `${n}x${l}`).join(' ');
            let facts = []; if(s.mill) facts.push(`M${s.mill}`); if(s.bakery) facts.push(`F${s.bakery}`);
            html += `<div class="res-chip chip-crop"><span class="chip-icon">🌾</span><span class="chip-val">${txt}</span>`;
            if(facts.length) html += `<div class="fact-pills">${facts.map(f=>`<span class="fact-pill">${f}</span>`).join('')}</div>`;
            html += `</div>`;
        }
        if(s.oasisActive) html += `<div class="res-chip chip-spec"><span class="chip-val">🏝️ ${s.oasisActive}</span></div>`;
        html += '</div>';
        return html;
    }
};