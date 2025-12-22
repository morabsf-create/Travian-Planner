/* Project/calculators/troop-calculator/data.js */

const SPEED_FACTORS = {
  "0": 1.0, "1": 1.0, "2": 0.9, "3": 0.81, "4": 0.729, "5": 0.656,
  "6": 0.59, "7": 0.531, "8": 0.478, "9": 0.43, "10": 0.387,
  "11": 0.349, "12": 0.314, "13": 0.282, "14": 0.254, "15": 0.229,
  "16": 0.206, "17": 0.185, "18": 0.167, "19": 0.15, "20": 0.135
};

const TROOP_DATA = {
  "Roman": [
    { "name": "Legionnaire", "attack": 40, "def_inf": 35, "def_cav": 50, "wood": 120, "clay": 100, "iron": 150, "crop": 30, "cu": 1, "time": 1600.0, "building": "Barracks" },
    { "name": "Praetorian", "attack": 30, "def_inf": 65, "def_cav": 35, "wood": 100, "clay": 130, "iron": 160, "crop": 70, "cu": 1, "time": 1760.0, "building": "Barracks" },
    { "name": "Imperian", "attack": 70, "def_inf": 40, "def_cav": 25, "wood": 150, "clay": 160, "iron": 210, "crop": 80, "cu": 1, "time": 1920.0, "building": "Barracks" },
    { "name": "Equites Legati", "attack": 0, "def_inf": 20, "def_cav": 10, "wood": 140, "clay": 160, "iron": 20, "crop": 40, "cu": 2, "time": 1360.0, "building": "Stable" },
    { "name": "Equites Imperatoris", "attack": 120, "def_inf": 65, "def_cav": 50, "wood": 550, "clay": 440, "iron": 320, "crop": 100, "cu": 3, "time": 2640.0, "building": "Stable" },
    { "name": "Equites Caesaris", "attack": 180, "def_inf": 80, "def_cav": 105, "wood": 550, "clay": 640, "iron": 800, "crop": 180, "cu": 4, "time": 3520.0, "building": "Stable" },
    { "name": "Battering ram", "attack": 60, "def_inf": 30, "def_cav": 75, "wood": 900, "clay": 360, "iron": 500, "crop": 70, "cu": 3, "time": 4600.0, "building": "Workshop" },
    { "name": "Fire Catapult", "attack": 75, "def_inf": 60, "def_cav": 10, "wood": 950, "clay": 1350, "iron": 600, "crop": 90, "cu": 6, "time": 9000.0, "building": "Workshop" },
    { "name": "Senator", "attack": 50, "def_inf": 40, "def_cav": 30, "wood": 30750, "clay": 27200, "iron": 45000, "crop": 37500, "cu": 5, "time": 4300.0, "building": "Barracks" },
    { "name": "Settler", "attack": 0, "def_inf": 80, "def_cav": 80, "wood": 4600, "clay": 4200, "iron": 5800, "crop": 4400, "cu": 1, "time": 26900.0, "building": "Barracks" }
  ],
  "Teutonic": [
    { "name": "Maceman", "attack": 40, "def_inf": 20, "def_cav": 5, "wood": 95, "clay": 75, "iron": 40, "crop": 40, "cu": 1, "time": 720.0, "building": "Barracks" },
    { "name": "Spearman", "attack": 10, "def_inf": 35, "def_cav": 60, "wood": 145, "clay": 70, "iron": 85, "crop": 40, "cu": 1, "time": 1120.0, "building": "Barracks" },
    { "name": "Axeman", "attack": 60, "def_inf": 30, "def_cav": 30, "wood": 130, "clay": 120, "iron": 170, "crop": 70, "cu": 1, "time": 1200.0, "building": "Barracks" },
    { "name": "Scout", "attack": 0, "def_inf": 10, "def_cav": 5, "wood": 160, "clay": 100, "iron": 50, "crop": 50, "cu": 1, "time": 1120.0, "building": "Barracks" },
    { "name": "Paladin", "attack": 55, "def_inf": 100, "def_cav": 40, "wood": 370, "clay": 270, "iron": 290, "crop": 75, "cu": 2, "time": 2400.0, "building": "Stable" },
    { "name": "Teutonic Knight", "attack": 150, "def_inf": 50, "def_cav": 75, "wood": 450, "clay": 515, "iron": 480, "crop": 80, "cu": 3, "time": 2960.0, "building": "Stable" },
    { "name": "Teutonic Ram", "attack": 65, "def_inf": 30, "def_cav": 80, "wood": 1000, "clay": 300, "iron": 350, "crop": 70, "cu": 3, "time": 4200.0, "building": "Workshop" },
    { "name": "Teutonic Catapult", "attack": 50, "def_inf": 60, "def_cav": 10, "wood": 900, "clay": 1200, "iron": 600, "crop": 60, "cu": 6, "time": 9000.0, "building": "Workshop" },
    { "name": "Chief", "attack": 40, "def_inf": 60, "def_cav": 40, "wood": 35500, "clay": 26600, "iron": 25000, "crop": 27200, "cu": 4, "time": 70500.0, "building": "Barracks" },
    { "name": "Settler", "attack": 10, "def_inf": 80, "def_cav": 80, "wood": 5800, "clay": 4400, "iron": 4600, "crop": 5200, "cu": 1, "time": 31000.0, "building": "Barracks" }
  ],
  "Gauls": [
    { "name": "Phalanx", "attack": 15, "def_inf": 40, "def_cav": 50, "wood": 100, "clay": 130, "iron": 55, "crop": 30, "cu": 1, "time": 1040.0, "building": "Barracks" },
    { "name": "Swordsman", "attack": 65, "def_inf": 35, "def_cav": 20, "wood": 140, "clay": 150, "iron": 185, "crop": 60, "cu": 1, "time": 1440.0, "building": "Barracks" },
    { "name": "Pathfinder", "attack": 0, "def_inf": 20, "def_cav": 10, "wood": 170, "clay": 150, "iron": 20, "crop": 40, "cu": 2, "time": 1360.0, "building": "Stable" },
    { "name": "Theutates Thunder", "attack": 100, "def_inf": 25, "def_cav": 40, "wood": 350, "clay": 450, "iron": 230, "crop": 60, "cu": 2, "time": 2480.0, "building": "Stable" },
    { "name": "Druidrider", "attack": 45, "def_inf": 115, "def_cav": 55, "wood": 360, "clay": 330, "iron": 280, "crop": 120, "cu": 2, "time": 2560.0, "building": "Stable" },
    { "name": "Haeduan", "attack": 140, "def_inf": 60, "def_cav": 165, "wood": 500, "clay": 620, "iron": 675, "crop": 170, "cu": 3, "time": 3120.0, "building": "Stable" },
    { "name": "Gauls Ram", "attack": 50, "def_inf": 30, "def_cav": 105, "wood": 950, "clay": 555, "iron": 330, "crop": 75, "cu": 3, "time": 5000.0, "building": "Workshop" },
    { "name": "Trebuchet", "attack": 70, "def_inf": 45, "def_cav": 10, "wood": 960, "clay": 1450, "iron": 630, "crop": 90, "cu": 6, "time": 9000.0, "building": "Workshop" },
    { "name": "Chieftain", "attack": 40, "def_inf": 50, "def_cav": 50, "wood": 30750, "clay": 45400, "iron": 31000, "crop": 37500, "cu": 4, "time": 4300.0, "building": "Barracks" },
    { "name": "Settler", "attack": 0, "def_inf": 80, "def_cav": 80, "wood": 4400, "clay": 5600, "iron": 4200, "crop": 3900, "cu": 1, "time": 22700.0, "building": "Barracks" }
  ],
  "Egyptian": [
    { "name": "Slave Militia", "attack": 10, "def_inf": 30, "def_cav": 20, "wood": 45, "clay": 60, "iron": 30, "crop": 15, "cu": 1, "time": 530.0, "building": "Barracks" },
    { "name": "Ash Warden", "attack": 30, "def_inf": 55, "def_cav": 40, "wood": 115, "clay": 100, "iron": 145, "crop": 60, "cu": 1, "time": 1380.0, "building": "Barracks" },
    { "name": "Khopesh Warrior", "attack": 65, "def_inf": 50, "def_cav": 20, "wood": 170, "clay": 180, "iron": 220, "crop": 80, "cu": 1, "time": 1440.0, "building": "Barracks" },
    { "name": "Sopdu Explorer", "attack": 0, "def_inf": 20, "def_cav": 10, "wood": 170, "clay": 150, "iron": 20, "crop": 40, "cu": 2, "time": 1360.0, "building": "Stable" },
    { "name": "Anhur Guard", "attack": 50, "def_inf": 110, "def_cav": 50, "wood": 360, "clay": 330, "iron": 280, "crop": 120, "cu": 2, "time": 2560.0, "building": "Stable" },
    { "name": "Resheph Chariot", "attack": 110, "def_inf": 120, "def_cav": 150, "wood": 450, "clay": 560, "iron": 610, "crop": 180, "cu": 3, "time": 3240.0, "building": "Stable" },
    { "name": "Egyptian Ram", "attack": 55, "def_inf": 30, "def_cav": 95, "wood": 995, "clay": 575, "iron": 340, "crop": 80, "cu": 3, "time": 4800.0, "building": "Workshop" },
    { "name": "Stone Catapult", "attack": 65, "def_inf": 55, "def_cav": 10, "wood": 980, "clay": 1510, "iron": 660, "crop": 100, "cu": 6, "time": 9000.0, "building": "Workshop" },
    { "name": "Nomarch", "attack": 40, "def_inf": 50, "def_cav": 50, "wood": 34000, "clay": 50000, "iron": 34000, "crop": 42000, "cu": 4, "time": 4300.0, "building": "Barracks" },
    { "name": "Settler", "attack": 0, "def_inf": 80, "def_cav": 80, "wood": 5040, "clay": 6510, "iron": 4830, "crop": 4620, "cu": 1, "time": 24800.0, "building": "Barracks" }
  ],
  "Huns": [
    { "name": "Mercenary", "attack": 35, "def_inf": 40, "def_cav": 30, "wood": 130, "clay": 80, "iron": 40, "crop": 40, "cu": 1, "time": 810.0, "building": "Barracks" },
    { "name": "Bowman", "attack": 50, "def_inf": 30, "def_cav": 10, "wood": 140, "clay": 110, "iron": 60, "crop": 60, "cu": 1, "time": 1120.0, "building": "Barracks" },
    { "name": "Spotter", "attack": 0, "def_inf": 20, "def_cav": 10, "wood": 170, "clay": 150, "iron": 20, "crop": 40, "cu": 2, "time": 1360.0, "building": "Stable" },
    { "name": "Steppe Rider", "attack": 120, "def_inf": 30, "def_cav": 15, "wood": 290, "clay": 370, "iron": 190, "crop": 45, "cu": 2, "time": 2400.0, "building": "Stable" },
    { "name": "Marksman", "attack": 110, "def_inf": 80, "def_cav": 70, "wood": 320, "clay": 350, "iron": 330, "crop": 50, "cu": 2, "time": 2480.0, "building": "Stable" },
    { "name": "Marauder", "attack": 180, "def_inf": 60, "def_cav": 40, "wood": 450, "clay": 560, "iron": 610, "crop": 140, "cu": 3, "time": 2990.0, "building": "Stable" },
    { "name": "Huns Ram", "attack": 65, "def_inf": 30, "def_cav": 90, "wood": 1060, "clay": 330, "iron": 360, "crop": 70, "cu": 3, "time": 4400.0, "building": "Workshop" },
    { "name": "Huns Catapult", "attack": 45, "def_inf": 55, "def_cav": 10, "wood": 950, "clay": 1280, "iron": 620, "crop": 60, "cu": 6, "time": 9000.0, "building": "Workshop" },
    { "name": "Logades", "attack": 50, "def_inf": 40, "def_cav": 30, "wood": 37200, "clay": 27600, "iron": 25200, "crop": 27600, "cu": 4, "time": 4300.0, "building": "Barracks" },
    { "name": "Settler", "attack": 10, "def_inf": 80, "def_cav": 80, "wood": 6100, "clay": 4600, "iron": 4800, "crop": 5400, "cu": 1, "time": 28950.0, "building": "Barracks" }
  ],
  "Spartans": [
    { "name": "Hoplite", "attack": 50, "def_inf": 35, "def_cav": 30, "wood": 110, "clay": 185, "iron": 110, "crop": 35, "cu": 1, "time": 1700.0, "building": "Barracks" },
    { "name": "Sentinel", "attack": 0, "def_inf": 40, "def_cav": 22, "wood": 185, "clay": 150, "iron": 35, "crop": 75, "cu": 1, "time": 1232.0, "building": "Barracks" },
    { "name": "Shieldsman", "attack": 40, "def_inf": 85, "def_cav": 45, "wood": 145, "clay": 95, "iron": 245, "crop": 45, "cu": 1, "time": 1936.0, "building": "Barracks" },
    { "name": "Twinsteel Therion", "attack": 90, "def_inf": 55, "def_cav": 40, "wood": 130, "clay": 200, "iron": 400, "crop": 65, "cu": 1, "time": 2112.0, "building": "Barracks" },
    { "name": "Elpida Rider", "attack": 55, "def_inf": 120, "def_cav": 90, "wood": 555, "clay": 445, "iron": 330, "crop": 110, "cu": 2, "time": 2816.0, "building": "Stable" },
    { "name": "Corinthian Crusher", "attack": 195, "def_inf": 80, "def_cav": 75, "wood": 660, "clay": 495, "iron": 995, "crop": 165, "cu": 3, "time": 3432.0, "building": "Stable" },
    { "name": "Spartans Ram", "attack": 65, "def_inf": 30, "def_cav": 80, "wood": 525, "clay": 260, "iron": 790, "crop": 130, "cu": 3, "time": 4620.0, "building": "Workshop" },
    { "name": "Ballista", "attack": 50, "def_inf": 60, "def_cav": 10, "wood": 550, "clay": 1240, "iron": 825, "crop": 135, "cu": 6, "time": 9900.0, "building": "Workshop" },
    { "name": "Ephor", "attack": 40, "def_inf": 60, "def_cav": 40, "wood": 33450, "clay": 30665, "iron": 36240, "crop": 13935, "cu": 4, "time": 77550.0, "building": "Barracks" },
    { "name": "Settler", "attack": 10, "def_inf": 80, "def_cav": 80, "wood": 5115, "clay": 5580, "iron": 6045, "crop": 3255, "cu": 1, "time": 34100.0, "building": "Barracks" }
  ],
  "Vikings": [
    { "name": "Thrall", "attack": 45, "def_inf": 22, "def_cav": 5, "wood": 95, "clay": 80, "iron": 50, "crop": 40, "cu": 1, "time": 800.0, "building": "Barracks" },
    { "name": "Shield Maiden", "attack": 20, "def_inf": 50, "def_cav": 30, "wood": 125, "clay": 70, "iron": 85, "crop": 40, "cu": 1, "time": 1080.0, "building": "Barracks" },
    { "name": "Berserker", "attack": 70, "def_inf": 30, "def_cav": 25, "wood": 235, "clay": 220, "iron": 200, "crop": 70, "cu": 2, "time": 1550.0, "building": "Barracks" },
    { "name": "Heimdall\u2019s Eye", "attack": 0, "def_inf": 10, "def_cav": 5, "wood": 155, "clay": 95, "iron": 50, "crop": 50, "cu": 1, "time": 1120.0, "building": "Barracks" },
    { "name": "Huskarl Rider", "attack": 45, "def_inf": 95, "def_cav": 100, "wood": 385, "clay": 295, "iron": 290, "crop": 85, "cu": 2, "time": 2650.0, "building": "Stable" },
    { "name": "Valkyrie\u2019s Blessing", "attack": 160, "def_inf": 50, "def_cav": 75, "wood": 475, "clay": 535, "iron": 515, "crop": 100, "cu": 2, "time": 3060.0, "building": "Stable" },
    { "name": "Vikings Ram", "attack": 65, "def_inf": 30, "def_cav": 80, "wood": 950, "clay": 325, "iron": 375, "crop": 70, "cu": 2, "time": 4200.0, "building": "Workshop" },
    { "name": "Vikings Catapult", "attack": 50, "def_inf": 60, "def_cav": 10, "wood": 850, "clay": 1225, "iron": 625, "crop": 60, "cu": 6, "time": 9000.0, "building": "Workshop" },
    { "name": "Jarl", "attack": 40, "def_inf": 40, "def_cav": 60, "wood": 35500, "clay": 26600, "iron": 25000, "crop": 27200, "cu": 4, "time": 70500.0, "building": "Barracks" },
    { "name": "Settler", "attack": 10, "def_inf": 80, "def_cav": 80, "wood": 5800, "clay": 4600, "iron": 4800, "crop": 4800, "cu": 1, "time": 31000.0, "building": "Barracks" }
  ]
};
