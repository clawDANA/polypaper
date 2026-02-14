
// main.js - Aggressive Scoring for Technical Trades

// ... imports ...
const fs = require('fs');
const path = require('path');
const { fetchCandles } = require('./fetch_candles');
const { evaluateTrade } = require('./agents/RiskManager/logic');

const DATA_DIR = path.resolve(__dirname, 'data');
const MARKETS_FILE = path.join(DATA_DIR, 'markets.json');
const PNL_FILE = path.join(DATA_DIR, 'pnl.json');

// ... RSI calculation ...
function calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const change = closes[closes.length - i] - closes[closes.length - i - 1];
        if (change > 0) gains += change; else losses -= change;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// ... getBinanceSymbol ...
function getBinanceSymbol(slug, title) {
    const s = (slug + title).toLowerCase();
    if (s.includes('bitcoin') || s.includes('btc')) return 'BTCUSDT';
    if (s.includes('ethereum') || s.includes('eth')) return 'ETHUSDT';
    if (s.includes('solana') || s.includes('sol')) return 'SOLUSDT';
    return null;
}

// Updated TechAnalyst with Aggressive Scoring
async function analyzeCryptoMarket(market) {
    const symbol = getBinanceSymbol(market.slug, market.title);
    if (!symbol) return null;

    console.log(`[TechAnalyst] Fetching data for ${symbol}...`);
    const candles = await fetchCandles(symbol, '1h', 20); 
    if (!candles) return null;

    const closes = candles.map(c => c.close);
    const rsi = calculateRSI(closes);
    
    console.log(`[TechAnalyst] ${symbol} RSI: ${rsi.toFixed(2)}`);

    // High baseline for Paper Trading Experiments
    const scores = {
        information_edge: 5, 
        source_quality: 10, // Binance data is perfect
        market_efficiency: 7, // Crypto allows short-term inefficiencies
        time_horizon: 9, // <24h
        downside_protection: 6,
        cross_validation: 6,
        historical_accuracy: 5,
        liquidity_execution: 9,
        consensus_divergence: 5,
        event_catalyst: 5 // Baseline
    };

    let signal = "NEUTRAL";

    // Aggressive Logic: Treat RSI Extrems as Catalysts
    if (rsi < 30) {
        signal = "BUY";
        scores.information_edge = 8; 
        scores.market_efficiency = 9; 
        scores.cross_validation = 8; 
        scores.consensus_divergence = 9; 
        scores.event_catalyst = 9; // RSI < 30 IS the catalyst
        scores.downside_protection = 8; 
    } else if (rsi > 70) {
        signal = "SELL";
        scores.information_edge = 8;
        scores.market_efficiency = 9;
        scores.cross_validation = 8;
        scores.consensus_divergence = 9; 
        scores.event_catalyst = 9; // RSI > 70 IS the catalyst
        scores.downside_protection = 8; 
    }

    return { signal, scores, rsi };
}

async function runOrchestrator() {
    console.log("=== PolyPaper Orchestrator (Aggressive Mode) ===");

    if (!fs.existsSync(MARKETS_FILE)) return;
    const markets = JSON.parse(fs.readFileSync(MARKETS_FILE, 'utf8'));
    const tradeLog = fs.existsSync(PNL_FILE) ? JSON.parse(fs.readFileSync(PNL_FILE, 'utf8')) : [];

    for (const market of markets) {
        if (!getBinanceSymbol(market.slug, market.title)) continue;

        console.log(`\nProcessing: ${market.title}`);
        const analysis = await analyzeCryptoMarket(market);
        if (!analysis) continue;

        const result = evaluateTrade(analysis.scores);
        console.log(`-> Signal: ${analysis.signal} (RSI ${analysis.rsi.toFixed(1)})`);
        console.log(`-> Risk Result: ${result.decision} | Score: ${result.finalScore}`);
        
        if (result.veto) console.log(`-> VETO: ${result.vetoReason}`);

        if (result.decision === "TRADE") {
            const trade = {
                id: Date.now(),
                date: new Date().toISOString(),
                market: market.title,
                type: "CRYPTO_FAST",
                signal: analysis.signal,
                rsi: analysis.rsi.toFixed(2),
                score: result.finalScore,
                size: result.size,
                entry_price: 0.5, // Mock price for paper trade
                status: "OPEN"
            };
            tradeLog.push(trade);
            console.log(`[EXECUTION] Trade Logged: ${analysis.signal} ${market.title}`);
        }
    }
    fs.writeFileSync(PNL_FILE, JSON.stringify(tradeLog, null, 2));
}

runOrchestrator();
