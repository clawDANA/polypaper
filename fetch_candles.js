const axios = require('axios');

const BASE_URL = 'https://api.binance.com/api/v3/klines';

/**
 * Fetch OHLCV candles from Binance
 * @param {string} symbol - Pair (e.g., 'BTCUSDT', 'ETHUSDT')
 * @param {string} interval - Timeframe ('15m', '1h', '4h', '1d')
 * @param {number} limit - Number of candles (default 100)
 * @returns {Promise<Array>} Array of candles [{ time, open, high, low, close, volume }]
 */
async function fetchCandles(symbol, interval = '15m', limit = 100) {
    try {
        console.log(`Fetching ${symbol} ${interval} candles...`);
        const response = await axios.get(BASE_URL, {
            params: {
                symbol: symbol.toUpperCase(),
                interval: interval,
                limit: limit
            }
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            // Binance returns array of arrays:
            // [ [Open Time, Open, High, Low, Close, Volume, ...], ... ]
            return response.data.map(c => ({
                time: c[0],
                open: parseFloat(c[1]),
                high: parseFloat(c[2]),
                low: parseFloat(c[3]),
                close: parseFloat(c[4]),
                volume: parseFloat(c[5])
            }));
        } else {
            console.error(`Binance API Error: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching candles for ${symbol}:`, error.message);
        return null;
    }
}

// Self-test if run directly
if (require.main === module) {
    (async () => {
        const candles = await fetchCandles('BTCUSDT', '15m', 5);
        console.log(candles);
    })();
}

module.exports = { fetchCandles };
