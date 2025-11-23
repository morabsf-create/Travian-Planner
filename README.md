This code is a sophisticated **web-based calculator and planner** designed specifically for the popular strategy game **Travian: Legends**. It helps players determine the **optimal build order** for resource fields and production buildings in a village to maximize resource output based on various parameters (village type, tribe, gold bonus, desired level, and resource weight prioritization).

Here is a comprehensive `README.md` file based on your HTML/JavaScript code:

# 🏰 Travian Planner 8.6

An advanced, browser-based resource and building planner for the strategy game **Travian: Legends**. This tool uses an optimization algorithm to calculate the most cost-effective development path (best Return on Investment or ROI) for a village, prioritizing field upgrades and production buildings based on user-defined weights and settings.

---

## 🚀 Features

The Travian Planner is divided into two main sections:

### 1. 📝 Pianificatore (Planner)

This is the core optimization engine. It provides a detailed, step-by-step development order designed to minimize the cost-to-gain ratio (ROI) of each upgrade.

* **Optimal Path Calculation:** Determines the best next upgrade (field, factory, or oasis) to maximize weighted production gain per resource cost.
* **Custom Configurations:** Configure key variables that affect production:
    * **Village Type:** Supports all standard resource field distributions (e.g., 4-4-4-6, 3-3-3-9, 0-0-0-18 Croppers, etc.).
    * **Tribe:** Accounts for tribe-specific bonuses (e.g., Egyptian Waterworks).
    * **Bonuses:** Apply Gold Club (25%) production bonus.
    * **Max Level:** Set the maximum level to which fields should be upgraded (e.g., max Lvl 19 or Lvl 20).
    * **Oases:** Input up to 3 nearby Oases to factor in their production boosts.
    * **Production Buildings:** Enable/disable factories, mills, bakeries, and waterworks for planning flexibility.
* **Resource Weighting:** Use weights (1 to 5) to prioritize the development of specific resources (Wood, Clay, Iron, Crop).
* **Results Summary:** Displays the final total hourly production, total resources spent, and the total **Time to Recover (ROI)**.
* **Save/Load Config:** Easily save and load your planning configurations using JSON files.

### 2. 📊 Laboratorio Analisi (Analysis Lab)

This section allows for comparison of up to three different scenarios (A, B, and C) to visualize the growth rate of their overall production.

* **Scenario Comparison:** Input different configurations (e.g., Cropper vs. Balanced, or weighted vs. unweighted development) and compare their production curves side-by-side on a Chart.js graph.
* **Visual Growth Curve:** Visualize how total production (Real Total Production) increases over the optimization steps for each scenario.

---

## 🛠️ Usage

The planner is entirely **client-side** and runs directly in your browser.

1.  **Open the HTML file:** Simply open the `index.html` file in any modern web browser.
2.  **Configure Your Village:**
    * Go to the **📝 Pianificatore** tab.
    * Select your **Villaggio** (Village) template, **Tribù** (Tribe), and **Bonus**.
    * Adjust the **Pesi (Weights)** for Wood, Clay, Iron, and Crop based on your needs (e.g., set Crop to 5 for a Cropper village).
3.  **Calculate:** Click the **`Calcola Percorso Ottimale`** (Calculate Optimal Path) button.
4.  **Analyze Results:** The results table will populate, showing the optimized development sequence, step-by-step cost, and current village state.

---

## ⚙️ Technical Details

The planner is built using plain HTML, CSS, and vanilla JavaScript.

* **Engine:** The core logic is handled by the `TravianEngine` class, which implements a greedy algorithm.
* **Optimization Metric:** The key metric is **ROI (Return on Investment)**, calculated as:
    $$\text{Adjusted Cost} / \text{Weighted Production Gain}$$
    The algorithm always selects the upgrade with the lowest ROI.
* **Dependencies:**
    * **Chart.js:** Used for generating the production growth charts in the Analysis Lab tab.
    * **Google Fonts:** `Roboto` (for data) and `Vollkorn` (for headings) for styling.

---

## 📝 Configuration and Development

The optimization parameters and game data are defined in the `GAME_DATA` object within the JavaScript:

* **`GAME_DATA.COSTS` / `GAME_DATA.FIELDS`:** Contains all the resource costs and production values for fields and buildings (levels 1-24).
* **`GAME_DATA.PREREQS`:** Defines the building prerequisites (e.g., Mill level 5 needed for Bakery).

If game data changes in a new Travian version, these objects can be easily updated in the JavaScript section to maintain accuracy.



