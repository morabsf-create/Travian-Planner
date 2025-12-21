/* js/data.js */

/**
 * TRAVIAN BUILDING DATABASE
 * Source: Provided CSV (52 Buildings)
 * Columns: Name, Wood, Clay, Iron, Crop, K_Factor, Max_Level, CU, CP
 */
const BUILDING_DB = {
    // Source 1: Resource Fields [cite: 1]
    "Woodcutter": { w: 40, c: 100, i: 50, cr: 60, k: 1.67, max: 22, cu: 2, cp: 1, type: "resource_wood" },
    "Clay Pit": { w: 80, c: 40, i: 80, cr: 50, k: 1.67, max: 22, cu: 2, cp: 1, type: "resource_clay" },
    "Iron Mine": { w: 100, c: 80, i: 30, cr: 60, k: 1.67, max: 22, cu: 3, cp: 1, type: "resource_iron" },
    "Cropland": { w: 70, c: 90, i: 70, cr: 20, k: 1.67, max: 22, cu: 0, cp: 1, type: "resource_crop" },

    // Source 2: Production & Infrastructure [cite: 2]
    "Sawmill": { w: 520, c: 380, i: 290, cr: 90, k: 1.8, max: 5, cu: 4, cp: 1, type: "bonus_wood" },
    "Brickyard": { w: 440, c: 480, i: 320, cr: 50, k: 1.8, max: 5, cu: 3, cp: 1, type: "bonus_clay" },
    "Iron Foundry": { w: 200, c: 450, i: 510, cr: 120, k: 1.8, max: 5, cu: 6, cp: 1, type: "bonus_iron" },
    "Grain Mill": { w: 500, c: 440, i: 380, cr: 1240, k: 1.8, max: 5, cu: 3, cp: 1, type: "bonus_crop" },
    
    // Source 3 [cite: 3]
    "Bakery": { w: 1200, c: 1480, i: 870, cr: 1600, k: 1.8, max: 5, cu: 4, cp: 1, type: "bonus_crop_2" },
    "Warehouse": { w: 130, c: 160, i: 90, cr: 40, k: 1.28, max: 20, cu: 1, cp: 1 },
    "Granary": { w: 80, c: 100, i: 70, cr: 20, k: 1.28, max: 20, cu: 1, cp: 1 },
    "Blacksmith": { w: 170, c: 200, i: 380, cr: 130, k: 1.28, max: 20, cu: 4, cp: 2 },
    "Armoury": { w: 130, c: 210, i: 410, cr: 130, k: 1.28, max: 20, cu: 4, cp: 2 },

    // Source 4 [cite: 4]
    "Tournament Square": { w: 1750, c: 2250, i: 1530, cr: 240, k: 1.28, max: 20, cu: 1, cp: 1 },
    "Main Building": { w: 70, c: 40, i: 60, cr: 20, k: 1.28, max: 20, cu: 2, cp: 2 },
    "Rally Point": { w: 110, c: 160, i: 90, cr: 70, k: 1.28, max: 20, cu: 1, cp: 1 },
    "Marketplace": { w: 80, c: 70, i: 120, cr: 70, k: 1.28, max: 20, cu: 4, cp: 3 },
    "Embassy": { w: 180, c: 130, i: 150, cr: 80, k: 1.28, max: 20, cu: 3, cp: 4 },
    "Barracks": { w: 210, c: 140, i: 260, cr: 120, k: 1.28, max: 20, cu: 4, cp: 1 },
    "Stable": { w: 260, c: 140, i: 220, cr: 100, k: 1.28, max: 20, cu: 5, cp: 2 },

    // Source 5 [cite: 5]
    "Workshop": { w: 460, c: 510, i: 600, cr: 320, k: 1.28, max: 20, cu: 3, cp: 3 },
    "Academy": { w: 220, c: 160, i: 90, cr: 40, k: 1.28, max: 20, cu: 4, cp: 4 },
    "Cranny": { w: 40, c: 50, i: 30, cr: 10, k: 1.28, max: 10, cu: 0, cp: 1 },
    "Town Hall": { w: 1250, c: 1110, i: 1260, cr: 600, k: 1.28, max: 20, cu: 4, cp: 5 },
    "Residence": { w: 580, c: 460, i: 350, cr: 180, k: 1.28, max: 20, cu: 1, cp: 2 },
    "Palace": { w: 550, c: 800, i: 750, cr: 250, k: 1.28, max: 20, cu: 1, cp: 5 },
    "Treasury": { w: 2880, c: 2740, i: 2580, cr: 990, k: 1.26, max: 20, cu: 4, cp: 6 },

    // Source 6 [cite: 6]
    "Trade Office": { w: 1400, c: 1330, i: 1200, cr: 400, k: 1.28, max: 20, cu: 3, cp: 3 },
    "Great Barracks": { w: 630, c: 420, i: 780, cr: 360, k: 1.28, max: 20, cu: 4, cp: 1 },
    "Great Stable": { w: 780, c: 420, i: 660, cr: 300, k: 1.28, max: 20, cu: 5, cp: 2 },
    "City Wall": { w: 70, c: 90, i: 170, cr: 70, k: 1.28, max: 20, cu: 0, cp: 1 },
    "Earth Wall": { w: 120, c: 200, i: 0, cr: 80, k: 1.28, max: 20, cu: 0, cp: 1 },
    "Palisade": { w: 160, c: 100, i: 80, cr: 60, k: 1.28, max: 20, cu: 0, cp: 1 },

    // Source 7 [cite: 7]
    "Stonemason": { w: 155, c: 130, i: 125, cr: 70, k: 1.28, max: 20, cu: 2, cp: 1 },
    "Brewery": { w: 1460, c: 930, i: 1250, cr: 1740, k: 1.4, max: 10, cu: 6, cp: 4 },
    "Trapper": { w: 100, c: 100, i: 100, cr: 100, k: 1.28, max: 20, cu: 4, cp: 1 },
    "Hero's Mansion": { w: 700, c: 670, i: 700, cr: 240, k: 1.33, max: 20, cu: 2, cp: 1, type: "special_oasis" },
    "Great Warehouse": { w: 650, c: 800, i: 450, cr: 200, k: 1.28, max: 20, cu: 1, cp: 1 },

    // Source 8 [cite: 8]
    "Great Granary": { w: 400, c: 500, i: 350, cr: 100, k: 1.28, max: 20, cu: 1, cp: 1 },
    "Wonder of the World": { w: 66700, c: 69050, i: 72200, cr: 13200, k: 1.0275, max: 100, cu: 1, cp: 0 },
    "Horse Drinking Trough": { w: 780, c: 420, i: 660, cr: 540, k: 1.28, max: 20, cu: 5, cp: 3 },
    "Stone Wall": { w: 110, c: 160, i: 70, cr: 60, k: 1.28, max: 20, cu: 0, cp: 1 },

    // Source 9 [cite: 9]
    "Makeshift Wall": { w: 50, c: 80, i: 40, cr: 30, k: 1.28, max: 20, cu: 0, cp: 1 },
    "Command Center": { w: 1600, c: 1250, i: 1050, cr: 200, k: 1.22, max: 20, cu: 1, cp: 2 },
    "Waterworks": { w: 910, c: 945, i: 910, cr: 340, k: 1.31, max: 20, cu: 1, cp: 2, type: "special_egypt" },
    "Hospital": { w: 320, c: 280, i: 420, cr: 360, k: 1.28, max: 20, cu: 3, cp: 4 },
    "Defensive wall": { w: 240, c: 110, i: 275, cr: 100, k: 1.28, max: 20, cu: 4, cp: 3 },
    "Spartans hospital": { w: 160, c: 100, i: 80, cr: 60, k: 1.28, max: 20, cu: 4, cp: 3 },

    // Source 10 [cite: 10]
    "Harbor": { w: 1440, c: 1370, i: 1290, cr: 495, k: 1.28, max: 20, cu: 3, cp: 3 },
    "Barricade": { w: 110, c: 170, i: 70, cr: 50, k: 1.28, max: 20, cu: 0, cp: 1 },
    "Water Ditch": { w: 740, c: 850, i: 960, cr: 620, k: 1.28, max: 20, cu: 4, cp: 3 },
    "Natarian wall": { w: 120, c: 200, i: 0, cr: 80, k: 1.28, max: 20, cu: 0, cp: 1 }
};

// Production Per Level (Standard Travian curve - Not in CSV, must preserve)
const PRODUCTION_CURVE = [3, 7, 13, 21, 31, 46, 70, 98, 140, 203, 280, 392, 525, 693, 889, 1120, 1400, 1820, 2240, 2800, 3430, 4270, 5250, 6440];

/**
 * Rounds value to the nearest 5.
 * Travian logic: 42->40, 43->45, 47->45, 48->50.
 */
function roundTo5(num) {
    return Math.round(num / 5) * 5;
}

/**
 * Calculates building cost for a specific level.
 * Formula: RoundTo5(Base * k^(Level-1))
 */
function getBuildingCost(name, level) {
    const b = BUILDING_DB[name];
    if (!b) return null;
    if (level === 1) return { w: b.w, c: b.c, i: b.i, cr: b.cr, total: b.w + b.c + b.i + b.cr };

    const power = level - 1;
    // Calculate exponential factor
    const factor = Math.pow(b.k, power);

    const w = roundTo5(b.w * factor);
    const c = roundTo5(b.c * factor);
    const i = roundTo5(b.i * factor);
    const cr = roundTo5(b.cr * factor);
    
    return { w, c, i, cr, total: w + c + i + cr };
}