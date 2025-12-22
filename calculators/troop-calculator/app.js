const TroopApp = {
    init: function() {
        // Populate Tribe Select
        const select = document.getElementById('tribeSelect');
        Object.keys(TROOP_DATA).forEach(tribe => {
            const opt = document.createElement('option');
            opt.value = tribe;
            opt.innerText = tribe;
            select.appendChild(opt);
        });
        
        // Initial Render
        this.render();
    },

    getSettings: function() {
        return {
            tribe: document.getElementById('tribeSelect').value,
            duration: parseFloat(document.getElementById('duration').value) || 0,
            speed: parseFloat(document.getElementById('serverSpeed').value),
            artifact: parseFloat(document.getElementById('artifact').value),
            helmet: parseFloat(document.getElementById('helmet').value) || 0,
            levels: {
                "Barracks": parseInt(document.getElementById('lvl_Barracks').value) || 0,
                "Stable": parseInt(document.getElementById('lvl_Stable').value) || 0,
                "Workshop": parseInt(document.getElementById('lvl_Workshop').value) || 0
            }
        };
    },

    formatNumber: function(num) {
        return num.toLocaleString();
    },

    render: function() {
        const settings = this.getSettings();
        const units = TROOP_DATA[settings.tribe];
        const tbody = document.getElementById('resultsBody');
        tbody.innerHTML = '';

        units.forEach(unit => {
            // 1. Get Building Reduction
            const bName = unit.building; // "Barracks", "Stable", "Workshop"
            const level = settings.levels[bName] !== undefined ? settings.levels[bName] : 0;
            const buildFactor = SPEED_FACTORS[Math.min(level, 20)] || 1.0;

            // 2. Calculate Training Time (Seconds)
            // Formula: (Base / Speed) * BuildFactor * Artifact * (1 - Helmet%)
            let timePerUnit = (unit.time / settings.speed) * buildFactor * settings.artifact;
            
            // Helmet only applies to infantry/cavalry usually, but simple calculation applies generally or check unit type
            // For simplicity, we apply helmet to all units if input is set
            timePerUnit = timePerUnit * (1 - (settings.helmet / 100));

            if (timePerUnit < 1) timePerUnit = 1; // Minimum 1 second cap (soft)

            // 3. Calculate Quantity
            const totalSeconds = settings.duration * 3600;
            const quantity = Math.floor(totalSeconds / timePerUnit);

            if (quantity <= 0) return;

            // 4. Totals
            const totalCost = (unit.wood + unit.clay + unit.iron + unit.crop) * quantity;
            const totalUpkeep = unit.cu * quantity;
            const totalOff = unit.attack * quantity;
            const totalDef = (unit.def_inf + unit.def_cav) * quantity;

            // 5. Render Row
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${unit.name}</strong><br><small style="color:#888">${bName} Lv${level}</small></td>
                <td style="font-size:1.2em; color:#859f51;">${this.formatNumber(quantity)}</td>
                <td>
                    ${this.formatNumber(totalCost)} Res<br>
                    <small>(${this.formatNumber(unit.wood + unit.clay + unit.iron + unit.crop)} each)</small>
                </td>
                <td>
                    ⚔️ ${this.formatNumber(totalOff)}<br>
                    🛡️ ${this.formatNumber(totalDef)}
                </td>
                <td>🌾 ${this.formatNumber(totalUpkeep)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
};

// Start the app
window.onload = function() {
    TroopApp.init();
};