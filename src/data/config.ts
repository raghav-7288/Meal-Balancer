/** Scoring rule: condition to check and penalty/message to apply. */
export interface ScoringRule {
    /** Field name from totals to extract */
    field: keyof NutrientTotals;
    /** Comparison operator */
    op: ">" | "<";
    /** Threshold value to compare against */
    threshold: number;
    /** Points to deduct (positive number) */
    penalty: number;
    /** Reason message shown to user */
    reason: string;
}

/** Score band thresholds */
export interface ScoreBands {
    excellent: number;
    good: number;
    moderate: number;
}

/** Visible fat limits by sex and activity level */
export interface VisibleFatConfig {
    male: { sedentary: number; moderate: number; heavy: number };
    female: { sedentary: number; moderate: number; heavy: number };
}

/** Main application configuration */
export interface AppConfig {
    cerealEnergyTargetPct: number;
    vegetableBenchmarkG: number;
    pulseBenchmarkG: number;
    nutsSeedsBenchmarkG: number;
    addedSugarLimitG: number;
    saltLimitG: number;
    visibleFat: VisibleFatConfig;
    scoreBands: ScoreBands;
}

/** Nutrient totals produced by aggregateMeal / combineDay */
export interface NutrientTotals {
    kcal: number;
    carbs: number;
    protein: number;
    fat: number;
    fibre: number;
    vitamins: number;
    minerals: number;
    addedSugar: number;
    visibleFat: number;
    vegetablesG: number;
    cerealEnergy: number;
    cerealEnergyPct: number;
    exchangeTotals: Record<string, number>;
}

/** Score result returned by scoreMeal / scoreDay */
export interface ScoreResult {
    score: number;
    band: string;
    reasons: string[];
}

/** A food item from the local FOODS array */
export interface LocalFood {
    id: string;
    name: string;
    group: string;
    gramsPerExchange: number;
    carbs: number;
    protein: number;
    fat: number;
    fibre: number;
    vitamins: number;
    minerals: number;
    kcal: number;
}

/** A single ingredient within a composite meal item */
export interface Ingredient {
    foodId: string;
    foodName: string;
    grams: number;
    foodGroupId?: number | null;
    foodGroup?: string;
    nutrients?: {
        kcal?: number;
        carbs?: number;
        protein?: number;
        fat?: number;
        fibre?: number;
        vitamins?: number;
        minerals?: number;
    };
}

/** A meal item that may come from DB (with nutrients) or be a legacy item (with foodId) */
export interface MealItem {
    foodId: string;
    grams: number;
    nutrients?: {
        kcal?: number;
        carbs?: number;
        protein?: number;
        fat?: number;
        fibre?: number;
        vitamins?: number;
        minerals?: number;
    };
    foodGroup?: string;
    foodGroupId?: number | null;
    day?: string;
    /** If present, this is a composite item (e.g., "Banana Shake") with multiple ingredients */
    ingredients?: Ingredient[];
}

export const APP_CONFIG: AppConfig = {
    cerealEnergyTargetPct: 45,

    vegetableBenchmarkG: 400,

    pulseBenchmarkG: 60,

    nutsSeedsBenchmarkG: 35,

    addedSugarLimitG: 25,

    saltLimitG: 5,

    visibleFat: {
        male: {
            sedentary: 25,
            moderate: 30,
            heavy: 40,
        },
        female: {
            sedentary: 20,
            moderate: 25,
            heavy: 30,
        },
    },

    scoreBands: {
        excellent: 85,
        good: 70,
        moderate: 50,
    },
};
