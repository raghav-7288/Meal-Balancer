export function calculateFoodNutrients(food, grams) {
    const factor = grams / food.gramsPerExchange;

    return {
        carbs: food.carbs * factor,
        protein: food.protein * factor,
        fat: food.fat * factor,
        fibre: food.fibre * factor,
        vitamins: food.vitamins * factor,
        minerals: food.minerals * factor,
        kcal: food.kcal * factor,
    };
}

export function calculateMealTotals(items) {
    return items.reduce(
        (acc, item) => {
            acc.carbs += item.carbs;
            acc.protein += item.protein;
            acc.fat += item.fat;
            acc.fibre += item.fibre;
            acc.vitamins += item.vitamins;
            acc.minerals += item.minerals;
            acc.kcal += item.kcal;
            return acc;
        },
        {
            carbs: 0,
            protein: 0,
            fat: 0,
            fibre: 0,
            vitamins: 0,
            minerals: 0,
            kcal: 0,
        }
    );
}