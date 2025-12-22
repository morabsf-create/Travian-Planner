/* Project/calculators/hammer-tracker/app.js */

const HammerApp = {
    data: null,

    init: function() {
        if(typeof TROOP_DATA === 'undefined') {
            console.error("TROOP_DATA not found. Ensure data.js is loaded.");
            return;
        }
        this.data = TROOP_DATA;

        // 1. Populate Tribe
        const tribeSelect = document.getElementById('tribeSelect');
        Object.keys(this.data).forEach(tribe => {
            const opt = document.createElement('option');
            opt.value = tribe;
            opt.innerText = tribe;
            tribeSelect.appendChild(opt);
        });

        // 2. Populate Levels
        this.populateLevelSelect('lvl_barracks', 20);
        this.populateLevelSelect('lvl_gb', 0);
        this.populateLevelSelect('lvl_stable', 20);
        this.populateLevelSelect('lvl_gs', 0);
        this.populateLevelSelect('lvl_workshop', 20);

        // 3. Init Date Pickers
        // Default Snapshot: Yesterday same time
        const now = new Date();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        
        // Format for datetime-local: YYYY-MM-DDTHH:MM
        const toLocalISO = (date) => {
            const pad = (n) => n < 10 ? '0'+n : n;
            return date.getFullYear() + '-' + 
                   pad(date.getMonth()+1) + '-' + 
                   pad(date.getDate()) + 'T' + 
                   pad(date.getHours()) + ':' + 
                   pad(date.getMinutes());
        };

        document.getElementById('time_snapshot').value = toLocalISO(yesterday);
        document.getElementById('time_target').value = toLocalISO(now);

        this.updateUnitDropdowns();
    },

    populateLevelSelect: function(id, defaultVal) {
        const sel = document.getElementById(id);
        sel.innerHTML = '';
        for(let i=0; i<=20; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            if(i === defaultVal) opt.selected = true;
            sel.appendChild(opt);
        }
    },

    updateUnitDropdowns: function() {
        const tribe = document.getElementById('tribeSelect').value;
        const tribeUnits = this.data[tribe];
        if (!tribeUnits) return;

        const excludeList = ["Senator", "Chief", "Chieftain", "Nomarch", "Logades", "Ephor", "Jarl", "Settler"];

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
        // --- TIME CALCULATION ---
        const tSnap = new Date(document.getElementById('time_snapshot').value);
        const tTarget = new Date(document.getElementById('time_target').value);
        
        let diffMs = tTarget - tSnap;
        if(diffMs < 0) diffMs = 0; 
        
        const durationSec = diffMs / 1000;
        const days = Math.floor(durationSec / 86400);
        const hours = Math.floor((durationSec % 86400) / 3600);
        // Display Days + Hours, Drop Minutes
        document.getElementById('disp_elapsed').innerText = `${days}d ${hours}h`;

        // --- SETTINGS ---
        const tribe = document.getElementById('tribeSelect').value;
        const speed = parseFloat(document.getElementById('serverSpeed').value);
        const artifact = parseFloat(document.getElementById('artifact').value);
        const allyBonus = parseFloat(document.getElementById('allyBonus').value);
        const infHelm = parseFloat(document.getElementById('inf_helmet').value) || 0;
        const cavHelm = parseFloat(document.getElementById('cav_helmet').value) || 0;

        let globalOff = 0;
        let globalDef = 0;
        let globalUpkeep = 0;
        let globalGrowthCost = 0;
        
        let gWood = 0, gClay = 0, gIron = 0, gCrop = 0;

        // --- CORE CALC LOGIC ---
        const processSection = (uId, lvlId, lvlGId, snapId, helm, outputTotalId, outputLabelId, projId) => {
            const unitName = document.getElementById(uId).value;
            const snapshot = parseInt(document.getElementById(snapId).value) || 0;
            const lvl = parseInt(document.getElementById(lvlId).value) || 0;
            const lvlG = lvlGId ? (parseInt(document.getElementById(lvlGId).value) || 0) : 0; 

            // Set Label
            document.getElementById(outputLabelId).innerText = unitName ? unitName : "Units";

            if(!unitName) {
                document.getElementById(outputTotalId).innerText = snapshot.toLocaleString();
                document.getElementById(projId).innerText = "+0";
                return;
            }

            const unit = this.getUnitStats(tribe, unitName);
            const reductionFactor = (1 - (helm/100)) * (1 - allyBonus);

            // Calc Production Rate (Units per Second)
            const getRate = (level) => {
                if(level <= 0) return 0;
                // Since using dropdowns, level is safe, but strict check is good
                const buildFactor = SPEED_FACTORS[level] || 1.0;
                let timePerUnit = (unit.time / speed) * buildFactor * artifact * reductionFactor;
                if(timePerUnit < 1) timePerUnit = 1;
                return 1 / timePerUnit; 
            };

            const rateStd = getRate(lvl);
            const rateGr = getRate(lvlG);
            
            // Total Produced
            const producedStd = Math.floor(rateStd * durationSec);
            const producedGr = Math.floor(rateGr * durationSec);
            const totalNew = producedStd + producedGr;
            
            // Update UI
            document.getElementById(projId).innerText = "+" + totalNew.toLocaleString();
            
            const grandTotal = snapshot + totalNew;
            document.getElementById(outputTotalId).innerText = grandTotal.toLocaleString();

            // Stats
            globalOff += grandTotal * unit.attack;
            globalDef += grandTotal * (unit.def_inf + unit.def_cav); 
            globalUpkeep += grandTotal * unit.cu;

            // Cost Calculation (Only for NEW troops)
            // Std
            const wStd = producedStd * unit.wood;
            const cStd = producedStd * unit.clay;
            const iStd = producedStd * unit.iron;
            const crStd = producedStd * unit.crop;
            
            // Great (3x)
            const wGr = producedGr * unit.wood * 3;
            const cGr = producedGr * unit.clay * 3;
            const iGr = producedGr * unit.iron * 3;
            const crGr = producedGr * unit.crop * 3;

            gWood += (wStd + wGr);
            gClay += (cStd + cGr);
            gIron += (iStd + iGr);
            gCrop += (crStd + crGr);
            globalGrowthCost += (wStd + wGr + cStd + cGr + iStd + iGr + crStd + crGr);
        };

        // Run for all 3
        processSection('unit_infantry', 'lvl_barracks', 'lvl_gb', 'snap_inf', infHelm, 'total_inf', 'lbl_inf', 'proj_inf');
        processSection('unit_cavalry', 'lvl_stable', 'lvl_gs', 'snap_cav', cavHelm, 'total_cav', 'lbl_cav', 'proj_cav');
        processSection('unit_siege', 'lvl_workshop', null, 'snap_siege', 0, 'total_siege', 'lbl_siege', 'proj_siege');

        // Update Globals
        document.getElementById('global_off').innerText = this.formatNumber(globalOff);
        document.getElementById('global_def').innerText = this.formatNumber(globalDef);
        document.getElementById('global_upkeep').innerText = globalUpkeep.toLocaleString();
        
        document.getElementById('growth_wood').innerText = this.formatNumber(gWood);
        document.getElementById('growth_clay').innerText = this.formatNumber(gClay);
        document.getElementById('growth_iron').innerText = this.formatNumber(gIron);
        document.getElementById('growth_crop').innerText = this.formatNumber(gCrop);
        document.getElementById('global_growth_cost').innerText = this.formatNumber(globalGrowthCost);
    },

    formatNumber: function(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toLocaleString();
    }
};

window.onload = function() {
    HammerApp.init();
};