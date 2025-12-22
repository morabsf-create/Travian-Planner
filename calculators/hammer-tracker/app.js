/* Project/calculators/troop-calculator/app.js */

const TroopApp = {
    data: null,
    currentRole: 'hammer', // default role

    init: function() {
        if(typeof TROOP_DATA === 'undefined') {
            console.error("TROOP_DATA not found. Ensure data.js is loaded.");
            return;
        }
        this.data = TROOP_DATA;

        const tribeSelect = document.getElementById('tribeSelect');
        Object.keys(this.data).forEach(tribe => {
            const opt = document.createElement('option');
            opt.value = tribe;
            opt.innerText = tribe;
            tribeSelect.appendChild(opt);
        });

        this.populateLevelSelect('lvl_barracks', 20);
        this.populateLevelSelect('lvl_gb', 0);
        this.populateLevelSelect('lvl_stable', 20);
        this.populateLevelSelect('lvl_gs', 0);
        this.populateLevelSelect('lvl_workshop', 20);

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

    setRole: function(role, btn) {
        this.currentRole = role;
        
        // Update UI buttons
        const btns = document.querySelectorAll('.role-btn');
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.updateUnitDropdowns();
    },

    updateUnitDropdowns: function() {
        const tribe = document.getElementById('tribeSelect').value;
        const tribeUnits = this.data[tribe];
        if (!tribeUnits) return;

        const excludeList = ["Senator", "Chief", "Chieftain", "Nomarch", "Logades", "Ephor", "Jarl", "Settler"];

        // Filter based on Role
        const filteredUnits = tribeUnits.filter(u => {
            if(excludeList.includes(u.name)) return false;
            if(this.currentRole === 'hammer') return (u.role === 'off' || u.role === 'both');
            if(this.currentRole === 'anvil') return (u.role === 'def' || u.role === 'both');
            if(this.currentRole === 'scout') return (u.role === 'scout' || u.role === 'both');
            return false;
        });

        // Helper to fill selects
        const fillSelect = (id, buildingType) => {
            const el = document.getElementById(id);
            const currentVal = el.value; // Try to keep selection if possible
            el.innerHTML = '<option value="">-- None --</option>';
            
            filteredUnits.filter(u => u.building === buildingType).forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.name;
                opt.innerText = u.name;
                el.appendChild(opt);
            });
            
            // Re-select if still valid, otherwise default to first available
            if(currentVal && Array.from(el.options).some(o => o.value === currentVal)) {
                el.value = currentVal;
            } else if (el.options.length > 1 && id.endsWith('_1')) {
                // Default pick first for Primary units
                el.selectedIndex = 1; 
            }
        };

        fillSelect('unit_infantry_1', 'Barracks');
        fillSelect('unit_infantry_2', 'Barracks');
        fillSelect('unit_cavalry_1', 'Stable');
        fillSelect('unit_cavalry_2', 'Stable');
        fillSelect('unit_siege_1', 'Workshop');
        fillSelect('unit_siege_2', 'Workshop');

        // Check sliders visibility
        this.onUnitChange('infantry');
        this.onUnitChange('cavalry');
        this.onUnitChange('siege');

        this.calculate();
    },

    onUnitChange: function(type) {
        const u1 = document.getElementById(`unit_${type}_1`).value;
        const u2 = document.getElementById(`unit_${type}_2`).value;
        const sliderWrap = document.getElementById(`slider_${type === 'infantry' ? 'inf' : type === 'cavalry' ? 'cav' : 'siege'}_wrap`);
        
        if(u2 && u2 !== "") {
            sliderWrap.style.display = 'flex';
        } else {
            sliderWrap.style.display = 'none';
        }
        this.calculate();
    },

    onSliderChange: function(type) {
        const slider = document.getElementById(`slider_${type}`);
        const val1 = slider.value;
        document.getElementById(`val_${type}_1`).innerText = val1 + '%';
        document.getElementById(`val_${type}_2`).innerText = (100 - val1) + '%';
        this.calculate();
    },

    getUnitStats: function(tribe, unitName) {
        if(!unitName) return null;
        return this.data[tribe].find(u => u.name === unitName);
    },

    calculate: function() {
        const tribe = document.getElementById('tribeSelect').value;
        const speed = parseFloat(document.getElementById('serverSpeed').value);
        const durationHours = parseFloat(document.getElementById('duration').value) || 0;
        const durationSec = durationHours * 3600;
        const artifact = parseFloat(document.getElementById('artifact').value);
        const allyBonus = parseFloat(document.getElementById('allyBonus').value); 
        const helmetInf = parseFloat(document.getElementById('inf_helmet').value) || 0;
        const helmetCav = parseFloat(document.getElementById('cav_helmet').value) || 0;

        // Calc Queue logic
        const calcQueue = (u1Name, u2Name, sliderVal, lvl, isGreat, helmetPercent) => {
            const result = { count: 0, w:0, c:0, i:0, cr:0, cu:0, off:0, defInf:0, defCav:0 };
            
            // Helper for single unit calc
            const addUnit = (uName, sharePercent) => {
                if(!uName || lvl <= 0 || sharePercent <= 0) return;
                
                const unit = this.getUnitStats(tribe, uName);
                if(!unit) return;

                const reductionFactor = (1 - (helmetPercent/100)) * (1 - allyBonus);
                const buildFactor = SPEED_FACTORS[lvl] || 1.0;

                let timePerUnit = (unit.time / speed) * buildFactor * artifact * reductionFactor;
                if(timePerUnit < 1) timePerUnit = 1;

                const timeAvailable = durationSec * (sharePercent / 100);
                const quantity = Math.floor(timeAvailable / timePerUnit);

                if(quantity > 0) {
                    const costMult = isGreat ? 3 : 1;
                    result.count += quantity;
                    result.w += unit.wood * costMult * quantity;
                    result.c += unit.clay * costMult * quantity;
                    result.i += unit.iron * costMult * quantity;
                    result.cr += unit.crop * costMult * quantity;
                    result.cu += unit.cu * quantity;
                    result.off += unit.attack * quantity;
                    result.defInf += unit.def_inf * quantity;
                    result.defCav += unit.def_cav * quantity;
                }
            };

            const share1 = u2Name ? parseFloat(sliderVal) : 100;
            const share2 = 100 - share1;

            addUnit(u1Name, share1);
            addUnit(u2Name, share2);

            return result;
        };

        // --- Process Sections ---
        // Infantry
        const inf1 = document.getElementById('unit_infantry_1').value;
        const inf2 = document.getElementById('unit_infantry_2').value;
        const infSlider = document.getElementById('slider_inf').value;
        const infLvl = parseInt(document.getElementById('lvl_barracks').value)||0;
        const infGbLvl = parseInt(document.getElementById('lvl_gb').value)||0;

        const infStd = calcQueue(inf1, inf2, infSlider, infLvl, false, helmetInf);
        const infGb = calcQueue(inf1, inf2, infSlider, infGbLvl, true, helmetInf);
        const infStats = this.sumStats(infStd, infGb);

        // Cavalry
        const cav1 = document.getElementById('unit_cavalry_1').value;
        const cav2 = document.getElementById('unit_cavalry_2').value;
        const cavSlider = document.getElementById('slider_cav').value;
        const cavLvl = parseInt(document.getElementById('lvl_stable').value)||0;
        const cavGsLvl = parseInt(document.getElementById('lvl_gs').value)||0;

        const cavStd = calcQueue(cav1, cav2, cavSlider, cavLvl, false, helmetCav);
        const cavGs = calcQueue(cav1, cav2, cavSlider, cavGsLvl, true, helmetCav);
        const cavStats = this.sumStats(cavStd, cavGs);

        // Siege
        const sie1 = document.getElementById('unit_siege_1').value;
        const sie2 = document.getElementById('unit_siege_2').value;
        const sieSlider = document.getElementById('slider_siege').value;
        const sieLvl = parseInt(document.getElementById('lvl_workshop').value)||0;

        const siegeStats = calcQueue(sie1, sie2, sieSlider, sieLvl, false, 0); // No helmet, no GB/GS

        // Update DOM - Card Summaries
        this.updateCardFooter('inf', infStats);
        this.updateCardFooter('cav', cavStats);
        this.updateCardFooter('siege', siegeStats);

        // Global Totals
        const g = this.sumStats(infStats, cavStats, siegeStats);
        
        document.getElementById('global_inf').innerText = infStats.count.toLocaleString();
        document.getElementById('global_cav').innerText = cavStats.count.toLocaleString();
        document.getElementById('global_siege').innerText = siegeStats.count.toLocaleString();

        document.getElementById('global_off').innerText = g.off.toLocaleString();
        document.getElementById('global_def_inf').innerText = g.defInf.toLocaleString();
        document.getElementById('global_def_cav').innerText = g.defCav.toLocaleString();
        
        document.getElementById('global_upkeep').innerText = g.cu.toLocaleString();
        const totalCost = g.w + g.c + g.i + g.cr;
        document.getElementById('global_cost').innerText = this.formatNumber(totalCost);

        document.getElementById('gc_wood').innerText = this.formatNumber(g.w);
        document.getElementById('gc_clay').innerText = this.formatNumber(g.c);
        document.getElementById('gc_iron').innerText = this.formatNumber(g.i);
        document.getElementById('gc_crop').innerText = this.formatNumber(g.cr);

        // Push Villages
        if (durationHours > 0) {
            const costPerHour = totalCost / durationHours;
            const singleVillageProd = 8400 * speed;
            const villagesNeeded = costPerHour / singleVillageProd;
            document.getElementById('global_push_villages').innerText = (totalCost > 0) ? villagesNeeded.toFixed(2) : "0";
        } else {
            document.getElementById('global_push_villages').innerText = "0";
        }
    },

    updateCardFooter: function(prefix, stats) {
        document.getElementById(`${prefix}_total_units`).innerText = stats.count.toLocaleString();
        document.getElementById(`${prefix}_upkeep`).innerText = stats.cu.toLocaleString();
        document.getElementById(`${prefix}_wood`).innerText = this.formatNumber(stats.w);
        document.getElementById(`${prefix}_clay`).innerText = this.formatNumber(stats.c);
        document.getElementById(`${prefix}_iron`).innerText = this.formatNumber(stats.i);
        document.getElementById(`${prefix}_crop`).innerText = this.formatNumber(stats.cr);
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
                defInf: acc.defInf + curr.defInf,
                defCav: acc.defCav + curr.defCav
            };
        }, { count: 0, w:0, c:0, i:0, cr:0, cu:0, off:0, defInf:0, defCav:0 });
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