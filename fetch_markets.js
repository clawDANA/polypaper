const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 1. Directory Structure
const DATA_DIR = path.resolve(__dirname, 'data');
const MARKETS_FILE = path.join(DATA_DIR, 'markets.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 2. Fetch Latest Events (Polymarket Gamma API)
async function fetchMarkets() {
  const url = 'https://gamma-api.polymarket.com/events'; // Using Gamma API from clawhub skill
  console.log(`Fetching latest events from ${url}...`);

  try {
    const response = await axios.get(url, {
      params: {
        active: true,
        closed: false,
        limit: 10,
        order: 'volume', // Sort by volume to find active markets
        ascending: false
      }
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      const events = response.data;
      console.log(`Fetched ${events.length} top-volume events.`);

      // 3. Process Events into Tradable Markets
      const processedMarkets = events.map(evt => {
        // Find the main market (usually the first one or largest volume)
        const market = evt.markets && evt.markets.length > 0 ? evt.markets[0] : null;

        if (!market) return null;

        // Extract outcomes and prices
        let outcomes, prices;
        try {
          outcomes = JSON.parse(market.outcomes);
          prices = JSON.parse(market.outcomePrices);
        } catch (e) {
          outcomes = [];
          prices = [];
        }

        return {
          event_id: evt.id,
          title: evt.title,
          slug: evt.slug,
          description: evt.description,
          volume: evt.volume,
          liquidity: evt.liquidity,
          market_id: market.id,
          question: market.question,
          outcomes: outcomes,
          prices: prices,
          url: `https://polymarket.com/event/${evt.slug}`
        };
      }).filter(m => m !== null); // Remove empty markets

      // 4. Save
      fs.writeFileSync(MARKETS_FILE, JSON.stringify(processedMarkets, null, 2));
      console.log(`Saved ${processedMarkets.length} processed markets to ${MARKETS_FILE}`);
      return processedMarkets;

    } else {
      console.error('Failed to fetch events:', response.status);
    }

  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}

fetchMarkets();
