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

// Helper: Parse Date safe
function parseDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

// 2. Fetch Latest Events (Polymarket Gamma API)
async function fetchMarkets() {
  const url = 'https://gamma-api.polymarket.com/events';
  console.log(`Fetching events from ${url}...`);

  try {
    // Fetch more items to allow for aggressive filtering
    const response = await axios.get(url, {
      params: {
        active: true,
        closed: false,
        limit: 50, // Increased limit to find gems after filtering
        order: 'volume', // Still prioritizing volume for liquidity
        ascending: false
      }
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      const events = response.data;
      console.log(`Fetched ${events.length} raw events.`);

      const now = new Date();
      const MAX_DURATION_DAYS = 45; // Max 45 days lockup
      const MIN_LIQUIDITY = 10000; // $10k min liquidity

      // Banned Tags/Keywords (heuristic)
      const BANNED_KEYWORDS = [
        'NBA', 'NFL', 'Premier League', 'Champions League', 'FIFA', 'Olympics', // Sports
        'Nominee 2028', 'Election 2028', // Long term politics
        'GTA 6', 'Half-Life 3', // Memes/Gaming
        'Person of the Year', 'Oscars', 'Grammy', // Subjective/Pop Culture
        'Pop Culture' 
      ];

      // 3. Process & Filter
      const processedMarkets = events.map(evt => {
        // --- FILTER 1: Keywords & Tags ---
        const titleLower = evt.title.toLowerCase();
        const descriptionLower = evt.description.toLowerCase();
        
        const isBanned = BANNED_KEYWORDS.some(kw => 
            titleLower.includes(kw.toLowerCase()) || 
            (evt.tags && evt.tags.some(t => t.label.toLowerCase().includes(kw.toLowerCase())))
        );

        if (isBanned) return null;

        // --- FILTER 2: Market Structure ---
        const market = evt.markets && evt.markets.length > 0 ? evt.markets[0] : null;
        if (!market) return null;

        // --- FILTER 3: Liquidity ---
        // Note: evt.liquidity might be a string
        const liquidity = parseFloat(evt.liquidity || 0);
        if (liquidity < MIN_LIQUIDITY) return null;

        // --- FILTER 4: Time Horizon ---
        // Try to find an end date from market or event
        const endDateStr = market.endDate || evt.endDate;
        const endDate = parseDate(endDateStr);
        
        if (!endDate) {
            // If no date, skip (risk of indefinite lockup)
            return null;
        }

        const durationMs = endDate - now;
        const durationDays = durationMs / (1000 * 60 * 60 * 24);

        if (durationDays < 0) return null; // Already ended?
        if (durationDays > MAX_DURATION_DAYS) return null; // Too long

        // Extract outcomes and prices
        let outcomes, prices;
        try {
          outcomes = JSON.parse(market.outcomes);
          prices = JSON.parse(market.outcomePrices);
        } catch (e) {
          outcomes = [];
          prices = [];
        }

        // --- FILTER 5: Price Range ---
        // Exclude markets that are effectively settled (e.g. >98% or <2%)
        // Prices are strings in JSON, need parsing
        const hasValidPrice = prices.some(p => {
            const val = parseFloat(p);
            return val > 0.02 && val < 0.98;
        });
        
        if (!hasValidPrice) return null;

        return {
          event_id: evt.id,
          title: evt.title,
          slug: evt.slug,
          description: evt.description,
          volume: evt.volume,
          liquidity: liquidity,
          market_id: market.id,
          question: market.question,
          endDate: endDate.toISOString(),
          duration_days: Math.round(durationDays),
          outcomes: outcomes,
          prices: prices,
          url: `https://polymarket.com/event/${evt.slug}`
        };
      }).filter(m => m !== null);

      // 4. Save
      fs.writeFileSync(MARKETS_FILE, JSON.stringify(processedMarkets, null, 2));
      console.log(`Saved ${processedMarkets.length} filtered markets to ${MARKETS_FILE} (out of ${events.length} fetched).`);
      return processedMarkets;

    } else {
      console.error('Failed to fetch events:', response.status);
    }

  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}

fetchMarkets();
