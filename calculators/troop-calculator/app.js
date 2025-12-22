/* Project/calculators/troop-calculator/app.js */

const TroopApp = {
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

        // --- Helper to Calc Specific Line ---
        const calcLine = (unitName, lvl, isGreat) => {
            if(!unitName || lvl <= 0) return { count: 0, w:0, c:0, i:0, cr:0, cu:0, off:0, def:0 };
            
            const unit = this.getUnitStats(tribe, unitName);
            if(!unit) return { count: 0, w:0, c:0, i:0, cr:0, cu:0, off:0, def:0 };

            const safeLvl = Math.min(Math.max(lvl, 0), 20);
            const buildFactor = SPEED_FACTORS[safeLvl] || 1.0;

            let timePerUnit = (unit.time / speed) * buildFactor * artifact * reductionFactor;
            if(timePerUnit < 1) timePerUnit = 1;

            const quantity = Math.floor(durationSec / timePerUnit);
            if(quantity <= 0) return { count: 0, w:0, c:0, i:0, cr:0, cu:0, off:0, def:0 };

            const costMult = isGreat ? 3 : 1;
            return {
                count: quantity,
                w: unit.wood * costMult * quantity,
                c: unit.clay * costMult * quantity,
                i: unit.iron * costMult * quantity,
                cr: unit.crop * costMult * quantity,
                cu: unit.cu * quantity,
                off: unit.attack * quantity,
                def: (unit.def_inf + unit.def_cav) * quantity
            };
        };

        // --- INFANTRY ---
        const infUnit = document.getElementById('unit_infantry').value;
        const infStd = calcLine(infUnit, parseInt(document.getElementById('lvl_barracks').value)||0, false);
        const infGb  = calcLine(infUnit, parseInt(document.getElementById('lvl_gb').value)||0, true);
        
        // Sum Infantry
        const infStats = this.sumStats(infStd, infGb);
        
        // Update DOM - Infantry
        document.getElementById('out_inf_std').innerText = infStd.count.toLocaleString();
        document.getElementById('out_inf_gb').innerText = infGb.count.toLocaleString();
        
        document.getElementById('inf_total_units').innerText = infStats.count.toLocaleString();
        document.getElementById('inf_upkeep').innerText = infStats.cu.toLocaleString();
        document.getElementById('inf_wood').innerText = this.formatNumber(infStats.w);
        document.getElementById('inf_clay').innerText = this.formatNumber(infStats.c);
        document.getElementById('inf_iron').innerText = this.formatNumber(infStats.i);
        document.getElementById('inf_crop').innerText = this.formatNumber(infStats.cr);


        // --- CAVALRY ---
        const cavUnit = document.getElementById('unit_cavalry').value;
        const cavStd = calcLine(cavUnit, parseInt(document.getElementById('lvl_stable').value)||0, false);
        const cavGs  = calcLine(cavUnit, parseInt(document.getElementById('lvl_gs').value)||0, true);
        
        // Sum Cavalry
        const cavStats = this.sumStats(cavStd, cavGs);
        
        // Update DOM - Cavalry
        document.getElementById('out_cav_std').innerText = cavStd.count.toLocaleString();
        document.getElementById('out_cav_gs').innerText = cavGs.count.toLocaleString();

        document.getElementById('cav_total_units').innerText = cavStats.count.toLocaleString();
        document.getElementById('cav_upkeep').innerText = cavStats.cu.toLocaleString();
        document.getElementById('cav_wood').innerText = this.formatNumber(cavStats.w);
        document.getElementById('cav_clay').innerText = this.formatNumber(cavStats.c);
        document.getElementById('cav_iron').innerText = this.formatNumber(cavStats.i);
        document.getElementById('cav_crop').innerText = this.formatNumber(cavStats.cr);


        // --- SIEGE ---
        const siegeUnit = document.getElementById('unit_siege').value;
        const siegeStd = calcLine(siegeUnit, parseInt(document.getElementById('lvl_workshop').value)||0, false);
        
        // Update DOM - Siege
        document.getElementById('out_siege_std').innerText = siegeStd.count.toLocaleString();
        
        document.getElementById('siege_total_units').innerText = siegeStd.count.toLocaleString();
        document.getElementById('siege_upkeep').innerText = siegeStd.cu.toLocaleString();
        document.getElementById('siege_wood').innerText = this.formatNumber(siegeStd.w);
        document.getElementById('siege_clay').innerText = this.formatNumber(siegeStd.c);
        document.getElementById('siege_iron').innerText = this.formatNumber(siegeStd.i);
        document.getElementById('siege_crop').innerText = this.formatNumber(siegeStd.cr);


        // --- GLOBAL TOTALS ---
        const globalStats = this.sumStats(infStats, cavStats, siegeStd);
        
        document.getElementById('global_inf').innerText = infStats.count.toLocaleString();
        document.getElementById('global_cav').innerText = cavStats.count.toLocaleString();
        document.getElementById('global_siege').innerText = siegeStd.count.toLocaleString();
        
        const totalCost = globalStats.w + globalStats.c + globalStats.i + globalStats.cr;
        document.getElementById('global_cost').innerText = this.formatNumber(totalCost);
        document.getElementById('global_upkeep').innerText = globalStats.cu.toLocaleString();
        
        document.getElementById('global_off').innerText = globalStats.off.toLocaleString();
        document.getElementById('global_def').innerText = globalStats.def.toLocaleString();
    },

    sumStats: function(...args) {
        return args.reduce((acc, curr) => {
            return {
                count: acc.count + curr.count,
                w: acc.w + curr.w,
                c: acc.c + curr.c,
                i: acc.i + curr.i,
                cr: acc.cr + curr.cr,
                cu: acc.cu + curr.cu,
                off: acc.off + curr.off,
                def: acc.def + curr.def
            };
        }, { count: 0, w:0, c:0, i:0, cr:0, cu:0, off:0, def:0 });
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