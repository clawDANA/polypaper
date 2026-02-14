
// agents/RiskManager/logic.js

/**
 * Calculates the Weighted Score based on the 10-dimension framework.
 * @param {Object} scores - Object with keys mapping to dimensions (0-10)
 * @returns {Object} { weightedScore, decision, size, veto }
 */
function evaluateTrade(scores) {
    const WEIGHTS = {
        information_edge: 0.18,
        source_quality: 0.12,
        market_efficiency: 0.10,
        time_horizon: 0.08,
        downside_protection: 0.15,
        cross_validation: 0.12,
        historical_accuracy: 0.05,
        liquidity_execution: 0.07,
        consensus_divergence: 0.08,
        event_catalyst: 0.05
    };

    // 1. Calculate Weighted Score
    let totalScore = 0;
    let veto = false;
    let vetoReason = null;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
        const score = scores[key] || 0;
        
        // Veto Rule: Any dimension < 4
        if (score < 4) {
            veto = true;
            vetoReason = `Dimension '${key}' score is ${score} (< 4)`;
        }

        totalScore += score * weight;
    }

    // Normalize to 0-100 scale (input 0-10 * weight sum 1.0 = 0-10 range -> multiply by 10)
    const finalScore = totalScore * 10; 

    // 2. Determine Decision & Size
    let decision = "NO_TRADE";
    let size = "0%";

    if (!veto) {
        if (finalScore >= 90) {
            decision = "TRADE";
            size = "5% (Conviction)";
        } else if (finalScore >= 85) {
            decision = "TRADE";
            size = "2% (Standard)";
        } else if (finalScore >= 80) {
            decision = "TRADE";
            size = "1% (Minimum)";
        } else {
            decision = "NO_TRADE"; // Score too low
        }
    } else {
        decision = "VETO";
    }

    return {
        decision,
        size,
        finalScore: finalScore.toFixed(2),
        veto,
        vetoReason
    };
}

module.exports = { evaluateTrade };
