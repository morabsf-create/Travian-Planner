/* Project/calculators/troop-calculator/app.js */

const TroopApp = {
    // Cache for currently selected units to preserve selection across tribe changes if valid
    data: null,

    init: function() {
        // Load data from global variable defined in data.js
        if(typeof TROOP_DATA === 'undefined') {
            console.error("TROOP_DATA not found. Ensure data.js is loaded.");
            return;
        }
        this.data = TROOP_DATA;

        // Populate Tribe Select
        const tribeSelect = document.getElementById('tribeSelect');
        Object.keys(this.data).forEach(tribe => {
            const opt = document.createElement('option');
            opt.value = tribe;
            opt.innerText = tribe;
            tribeSelect.appendChild(opt);
        });

        // Trigger initial render
        this.updateUnitDropdowns();
    },

    updateUnitDropdowns: function() {
        const tribe = document.getElementById('tribeSelect').value;
        const tribeUnits = this.data[tribe];

        // Helper to populate a select element
        const populate = (elementId, filterFn) => {
            const el = document.getElementById(elementId);
            el.innerHTML = '<option value="">-- None --</option>'; // Default empty
            
            tribeUnits.filter(filterFn).forEach((u, index) => {
                const opt = document.createElement('option');
                // Store index relative to the main tribe array to look up stats later
                opt.value = u.name; 
                opt.innerText = u.name; 
                el.appendChild(opt);
            });
            // Auto-select first available unit for convenience? No, let user choose "None" or specific.
            // Actually, for calculators, selecting the first unit is usually friendlier.
            if(el.options.length > 1) el.selectedIndex = 1; 
        };

        populate('unit_infantry', u => u.building === 'Barracks');
        populate('unit_cavalry', u => u.building === 'Stable');
        populate('unit_siege', u => u.building === 'Workshop');

        this.calculate();
    },

    getUnitStats: function(tribe, unitName) {
        if(!unitName) return null;
        return this.data[tribe].find(u => u.name === unitName);
    },

    calculate: function() {
        // 1. Gather Global Settings
        const tribe = document.getElementById('tribeSelect').value;
        const speed = parseFloat(document.getElementById('serverSpeed').value);
        const durationHours = parseFloat(document.getElementById('duration').value) || 0;
        const durationSec = durationHours * 3600;
        
        const artifact = parseFloat(document.getElementById('artifact').value);
        const helmetPercent = parseFloat(document.getElementById('helmet').value) || 0;
        const allyBonus = parseFloat(document.getElementById('allyBonus').value); // 0.0 to 0.10

        // Modifiers
        // Formula: BaseTime * (1 - Helmet%) * (1 - Ally%) ... (simplified stacking)
        // Note: Artifact is a multiplier (0.75, 0.5), BuildFactor is multiplier.
        // Helmet and Ally are reductions.
        const reductionFactor = (1 - (helmetPercent/100)) * (1 - allyBonus);

        let totalUnits = 0;
        let totalCost = 0;
        let totalUpkeep = 0;
        let totalOff = 0;
        let totalDef = 0;

        // Helper Calculation Function
        const calcQueue = (unitName, buildingLvl, isGreat) => {
            if(!unitName || buildingLvl <= 0) return;
            
            const unit = this.getUnitStats(tribe, unitName);
            if(!unit) return;

            // Determine Building Speed Factor from data.js SPEED_FACTORS
            // Cap level at 20
            const safeLvl = Math.min(Math.max(buildingLvl, 0), 20);
            const buildFactor = SPEED_FACTORS[safeLvl] || 1.0;

            // Calculate Time Per Unit
            // Base Time / Server Speed * Building Factor * Artifact * Modifiers
            // Note: Great Buildings have same time as normal buildings, just 3x cost
            let timePerUnit = (unit.time / speed) * buildFactor * artifact * reductionFactor;
            
            if(timePerUnit < 1) timePerUnit = 1; // Hard cap 1 second

            // Calculate Quantity
            const quantity = Math.floor(durationSec / timePerUnit);

            // Add to Totals
            totalUnits += quantity;
            
            // Cost (3x if Great)
            const costMult = isGreat ? 3 : 1;
            const singleCost = (unit.wood + unit.clay + unit.iron + unit.crop) * costMult;
            totalCost += singleCost * quantity;

            // Stats
            totalUpkeep += unit.cu * quantity;
            totalOff += unit.attack * quantity;
            totalDef += (unit.def_inf + unit.def_cav) * quantity;
        };

        // 2. Process Infantry (Barracks + Great Barracks)
        const infUnit = document.getElementById('unit_infantry').value;
        const lvlBarracks = parseInt(document.getElementById('lvl_barracks').value) || 0;
        const lvlGB = parseInt(document.getElementById('lvl_gb').value) || 0;
        calcQueue(infUnit, lvlBarracks, false);
        calcQueue(infUnit, lvlGB, true);

        // 3. Process Cavalry (Stable + Great Stable)
        const cavUnit = document.getElementById('unit_cavalry').value;
        const lvlStable = parseInt(document.getElementById('lvl_stable').value) || 0;
        const lvlGS = parseInt(document.getElementById('lvl_gs').value) || 0;
        calcQueue(cavUnit, lvlStable, false);
        calcQueue(cavUnit, lvlGS, true);

        // 4. Process Siege (Workshop Only)
        const siegeUnit = document.getElementById('unit_siege').value;
        const lvlWorkshop = parseInt(document.getElementById('lvl_workshop').value) || 0;
        calcQueue(siegeUnit, lvlWorkshop, false);

        // 5. Update UI
        document.getElementById('res_total_units').innerText = totalUnits.toLocaleString();
        document.getElementById('res_total_cost').innerText = this.formatNumber(totalCost);
        document.getElementById('res_upkeep').innerText = totalUpkeep.toLocaleString();
        document.getElementById('res_off').innerText = totalOff.toLocaleString();
        document.getElementById('res_def').innerText = totalDef.toLocaleString();
    },

    formatNumber: function(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toLocaleString();
    }
};

window.onload = function() {
    TroopApp.init();
};