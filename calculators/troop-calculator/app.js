/* Project/calculators/troop-calculator/app.js */

const TroopApp = {
    // Cache for currently selected units to preserve selection across tribe changes if valid
    data: null,

    init: function() {
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

        if (!tribeUnits) return;

        // Expansion units to exclude
        const excludeList = [
            "Senator", "Chief", "Chieftain", "Nomarch", "Logades", "Ephor", "Jarl",
            "Settler"
        ];

        // Helper to populate a select element
        const populate = (elementId, filterFn) => {
            const el = document.getElementById(elementId);
            el.innerHTML = '<option value="">-- None --</option>'; 
            
            tribeUnits.filter(u => !excludeList.includes(u.name) && filterFn(u)).forEach((u) => {
                const opt = document.createElement('option');
                opt.value = u.name; 
                opt.innerText = u.name; 
                el.appendChild(opt);
            });
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
        const allyBonus = parseFloat(document.getElementById('allyBonus').value); 

        // Modifiers
        const reductionFactor = (1 - (helmetPercent/100)) * (1 - allyBonus);

        // Totals
        let totalUnits = 0;
        let totalCost = 0;
        let totalUpkeep = 0;
        let totalOff = 0;
        let totalDef = 0;

        // Resource Breakdown
        let resWood = 0;
        let resClay = 0;
        let resIron = 0;
        let resCrop = 0;

        // Source Breakdown
        const counts = {
            barracks: 0,
            gb: 0,
            stable: 0,
            gs: 0,
            workshop: 0
        };

        // Helper Calculation Function
        const calcQueue = (unitName, buildingLvl, isGreat, sourceKey) => {
            if(!unitName || buildingLvl <= 0) return;
            
            const unit = this.getUnitStats(tribe, unitName);
            if(!unit) return;

            // Determine Building Speed Factor
            const safeLvl = Math.min(Math.max(buildingLvl, 0), 20);
            const buildFactor = SPEED_FACTORS[safeLvl] || 1.0;

            // Calculate Time Per Unit
            let timePerUnit = (unit.time / speed) * buildFactor * artifact * reductionFactor;
            if(timePerUnit < 1) timePerUnit = 1;

            // Calculate Quantity
            const quantity = Math.floor(durationSec / timePerUnit);
            if(quantity <= 0) return;

            // Update Counts
            counts[sourceKey] += quantity;
            totalUnits += quantity;
            
            // Stats
            totalUpkeep += unit.cu * quantity;
            totalOff += unit.attack * quantity;
            totalDef += (unit.def_inf + unit.def_cav) * quantity;

            // Costs (3x if Great)
            const costMult = isGreat ? 3 : 1;
            
            const w = unit.wood * costMult * quantity;
            const c = unit.clay * costMult * quantity;
            const i = unit.iron * costMult * quantity;
            const cr = unit.crop * costMult * quantity;

            resWood += w;
            resClay += c;
            resIron += i;
            resCrop += cr;
            totalCost += (w + c + i + cr);
        };

        // 2. Process Infantry 
        const infUnit = document.getElementById('unit_infantry').value;
        const lvlBarracks = parseInt(document.getElementById('lvl_barracks').value) || 0;
        const lvlGB = parseInt(document.getElementById('lvl_gb').value) || 0;
        calcQueue(infUnit, lvlBarracks, false, 'barracks');
        calcQueue(infUnit, lvlGB, true, 'gb');

        // 3. Process Cavalry 
        const cavUnit = document.getElementById('unit_cavalry').value;
        const lvlStable = parseInt(document.getElementById('lvl_stable').value) || 0;
        const lvlGS = parseInt(document.getElementById('lvl_gs').value) || 0;
        calcQueue(cavUnit, lvlStable, false, 'stable');
        calcQueue(cavUnit, lvlGS, true, 'gs');

        // 4. Process Siege 
        const siegeUnit = document.getElementById('unit_siege').value;
        const lvlWorkshop = parseInt(document.getElementById('lvl_workshop').value) || 0;
        calcQueue(siegeUnit, lvlWorkshop, false, 'workshop');

        // 5. Update UI - Main Stats
        document.getElementById('res_total_units').innerText = totalUnits.toLocaleString();
        document.getElementById('res_total_cost').innerText = this.formatNumber(totalCost);
        document.getElementById('res_upkeep').innerText = totalUpkeep.toLocaleString();
        document.getElementById('res_off').innerText = totalOff.toLocaleString();
        document.getElementById('res_def').innerText = totalDef.toLocaleString();

        // 6. Update UI - Breakdowns
        document.getElementById('bd_wood').innerText = this.formatNumber(resWood);
        document.getElementById('bd_clay').innerText = this.formatNumber(resClay);
        document.getElementById('bd_iron').innerText = this.formatNumber(resIron);
        document.getElementById('bd_crop').innerText = this.formatNumber(resCrop);

        document.getElementById('bd_barracks').innerText = counts.barracks.toLocaleString();
        document.getElementById('bd_gb').innerText = counts.gb.toLocaleString();
        document.getElementById('bd_stable').innerText = counts.stable.toLocaleString();
        document.getElementById('bd_gs').innerText = counts.gs.toLocaleString();
        document.getElementById('bd_workshop').innerText = counts.workshop.toLocaleString();
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