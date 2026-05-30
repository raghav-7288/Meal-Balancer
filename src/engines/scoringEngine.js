import { APP_CONFIG } from "../data/config";

export function scoreMeal(totals) {
    const cerealPct = totals.cerealEnergyPct ?? 0;
    const vegG = totals.vegetablesG ?? 0;
    const proteinG = totals.protein ?? 0;
    const fibreG = totals.fibre ?? 0;
    const sugarG = totals.addedSugar ?? 0;
    const visibleFatG = totals.visibleFat ?? 0;

    let score = 100;
    const reasons = [];

    if (cerealPct > APP_CONFIG.cerealEnergyTargetPct + 10) {
        score -= 15;
        reasons.push("Too cereal-heavy relative to the rest of the meal.");
    }

    if (vegG < 100) {
        score -= 15;
        reasons.push("Vegetable quantity is too low.");
    }

    if (proteinG < 10) {
        score -= 12;
        reasons.push("Low protein or pulse contribution.");
    }

    if (fibreG < 5) {
        score -= 10;
        reasons.push("Fibre support is weak.");
    }

    if (sugarG > 5) {
        score -= 10;
        reasons.push("Added sugar is high.");
    }

    if (visibleFatG > 7) {
        score -= 10;
        reasons.push("Visible fat/oil exceeds target.");
    }

    score = Math.max(0, Math.min(100, score));

    let band = "Poor balance";
    if (score >= APP_CONFIG.scoreBands.excellent) band = "Excellent balance";
    else if (score >= APP_CONFIG.scoreBands.good) band = "Good balance";
    else if (score >= APP_CONFIG.scoreBands.moderate) band = "Moderate imbalance";

    return { score, band, reasons };
}

export function scoreDay(dayTotals) {
    const cerealPct = dayTotals.cerealEnergyPct ?? 0;
    const vegG = dayTotals.vegetablesG ?? 0;
    const proteinG = dayTotals.protein ?? 0;
    const fibreG = dayTotals.fibre ?? 0;
    const sugarG = dayTotals.addedSugar ?? 0;
    const visibleFatG = dayTotals.visibleFat ?? 0;

    let score = 100;
    const reasons = [];

    if (cerealPct > APP_CONFIG.cerealEnergyTargetPct + 10) {
        score -= 15;
        reasons.push("Day pattern is cereal-forward.");
    }

    if (vegG < APP_CONFIG.vegetableBenchmarkG) {
        score -= 15;
        reasons.push("Vegetables are below the day benchmark.");
    }

    if (proteinG < APP_CONFIG.pulseBenchmarkG / 2) {
        score -= 12;
        reasons.push("Protein/pulse intake is low.");
    }

    if (fibreG < 20) {
        score -= 10;
        reasons.push("Daily fibre needs improvement.");
    }

    if (sugarG > APP_CONFIG.addedSugarLimitG) {
        score -= 10;
        reasons.push("Added sugar exceeds the limit.");
    }

    if (visibleFatG > 25) {
        score -= 10;
        reasons.push("Visible fat/oil is too high.");
    }

    score = Math.max(0, Math.min(100, score));

    let band = "Poor balance";
    if (score >= APP_CONFIG.scoreBands.excellent) band = "Excellent balance";
    else if (score >= APP_CONFIG.scoreBands.good) band = "Good balance";
    else if (score >= APP_CONFIG.scoreBands.moderate) band = "Moderate imbalance";

    return { score, band, reasons };
}