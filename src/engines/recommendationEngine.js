export function getBestPlan(plans, scoreMap) {
    if (!plans.length) return null;

    let best = plans[0];
    let bestScore = scoreMap[best.id]?.score ?? 0;

    for (const plan of plans) {
        const current = scoreMap[plan.id]?.score ?? 0;
        if (current > bestScore) {
            best = plan;
            bestScore = current;
        }
    }

    return best;
}