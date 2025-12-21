/* js/engine.js */

const CONSTANTS = {
    MAX_FIELDS: 21,
    TRIBE_EGYPT_BONUS: 0.05,
    FACTORY_BONUS: 0.05,
    MAX_WAIT_TOLERANCE: 10.0 // Hours willing to wait for ROI
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
        const getBase = (arr) => arr.reduce((sum, lvl) => sum + (lvl > 0 ? PRODUCTION_CURVE[lvl-1] : 0), 0);
        
        const isEgypt = this.config.tribe === 'egyptian';
        const wwBonus = isEgypt ? (1 + state.waterworks * CONSTANTS.TRIBE_EGYPT_BONUS) : 1;
        const goldBonus = this.config.goldBonus; // e.g., 1.25

        // Oases
        let wOasis = 0, cOasis = 0, iOasis = 0, crOasis = 0;
        for(let k=0; k < state.oasisActive; k++) {
            const o = this.config.oases[k];
            if(o.wood) wOasis += o.wood;
            if(o.clay) cOasis += o.clay;
            if(o.iron) iOasis += o.iron;
            if(o.crop) crOasis += o.crop;
        }

        // Calculate Real Production
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

    // PURE ROI: Cost / Production Gain
    evaluateUpgrade(action, currentProdTotal) {
        // 1. Calculate Cost
        // 2. Apply Action
        // 3. Calculate New Prod
        // 4. ROI = Cost / (New - Old)
        
        const stateCopy = JSON.parse(JSON.stringify(this.state));
        let cost = 0;
        let valid = false;

        // Apply logic to copy
        if (action.type === 'field') {
            const lvl = stateCopy[action.res][action.idx];
            if (lvl < this.config.maxLevel) {
                // Map generic resource types to specific DB names
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
             // Logic for oasis unlock (Requires Hero Mansion 10, 15, 20)
             if (stateCopy.oasisActive < 3) {
                 const reqHm = [10, 15, 20][stateCopy.oasisActive];
                 let hmCost = 0;
                 // Add cost to upgrade HM if needed
                 while (stateCopy.hm < reqHm) {
                     hmCost += getBuildingCost("Hero's Mansion", stateCopy.hm + 1).total;
                     stateCopy.hm++;
                 }
                 cost = hmCost; 
                 // Note: Capture cost is negligible (hero health), we count infrastructure cost
                 stateCopy.oasisActive++;
                 valid = true;
             }
        }

        if (!valid || cost === 0) return { roi: Infinity };

        const newMetrics = this.calculateHourlyProduction(stateCopy);
        const gain = newMetrics.total - currentProdTotal;

        if (gain <= 0.01) return { roi: Infinity }; // Avoid division by zero

        return {
            roi: cost / gain,
            cost: cost,
            prod: newMetrics.total,
            newState: stateCopy,
            gain: gain
        };
    }

    runSimulation() {
        const steps = [];
        let totalSpent = 0;
        const MAX_STEPS = 100; // Cap to prevent infinite loops

        for(let step=0; step<MAX_STEPS; step++) {
            const currentMetrics = this.calculateHourlyProduction(this.state);
            let bestMove = { roi: Infinity };
            let bestAction = null;

            // 1. Evaluate All Fields
            ['wood', 'clay', 'iron', 'crop'].forEach(res => {
                // Only evaluate the lowest level field of each type (optimization strategy)
                const minLvl = Math.min(...this.state[res]);
                const idx = this.state[res].indexOf(minLvl);
                
                const result = this.evaluateUpgrade({ type: 'field', res, idx }, currentMetrics.total);
                if (result.roi < bestMove.roi) {
                    bestMove = result;
                    bestAction = { type: 'field', name: res, lvl: minLvl+1 };
                }
            });

            // 2. Evaluate Buildings (Factories)
            // Prerequisite check is simplified: We assume if you enable it, you want it evaluated
            const factories = [
                { id: 'sawmill', db: 'Sawmill', reqField: 'wood', reqLvl: 10 },
                { id: 'brickyard', db: 'Brickyard', reqField: 'clay', reqLvl: 10 },
                { id: 'foundry', db: 'Iron Foundry', reqField: 'iron', reqLvl: 10 },
                { id: 'mill', db: 'Grain Mill', reqField: 'crop', reqLvl: 5 },
                { id: 'bakery', db: 'Bakery', reqField: 'crop', reqLvl: 10, reqBuild: 'mill', reqBuildLvl: 5 },
                { id: 'waterworks', db: 'Waterworks', tribe: 'egyptian' } // Unique requirement handled in UI
            ];

            factories.forEach(f => {
                // Check prereqs
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
                    bestAction = { type: 'building', name: f.db, lvl: this.state[f.id] + 1 };
                }
            });

            // 3. Evaluate Oasis
            // Only if configured
            if (this.state.oasisActive < 3 && Object.keys(this.config.oases[this.state.oasisActive]).length > 0) {
                 const result = this.evaluateUpgrade({ type: 'oasis' }, currentMetrics.total);
                 if (result.roi < bestMove.roi) {
                     bestMove = result;
                     bestAction = { type: 'oasis', lvl: this.state.oasisActive + 1 };
                 }
            }

            if (bestMove.roi === Infinity) break;

            // Execute Move
            this.state = bestMove.newState;
            totalSpent += bestMove.cost;
            
            steps.push({
                step: step + 1,
                desc: this.formatActionDesc(bestAction),
                prod: Math.round(bestMove.prod),
                cost: bestMove.cost,
                totalSpent: totalSpent,
                roi: Math.round(bestMove.roi)
            });
        }
        return { steps, totalSpent };
    }

    formatActionDesc(action) {
        if (action.type === 'field') {
            const map = { wood: 'Bosco', clay: 'Argilla', iron: 'Miniera', crop: 'Grano' };
            return `Migliora ${map[action.name]} a livello ${action.lvl}`;
        }
        if (action.type === 'building') {
            return `Costruisci ${action.name} a livello ${action.lvl}`;
        }
        if (action.type === 'oasis') {
            return `Conquista Oasi #${action.lvl}`;
        }
        return 'Unknown';
    }
}