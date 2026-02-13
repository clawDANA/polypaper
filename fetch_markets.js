const axios = require('axios');
const fs = require('fs');

const DATA_DIR = 'polypaper/data';
const MARKETS_FILE = `${DATA_DIR}/markets.json`;

async function fetchMarkets() {
  try {
    const url = 'https://clob.polymarket.com/markets'; // Using CLOB API v1
    console.log(`Fetching markets from ${url}...`);
    
    // Note: Polymarket CLOB API might require pagination/filtering
    // For now, fetch top 20 by volume if possible, or just raw list
    const response = await axios.get(url, {
      params: {
        limit: 20,
        active: true,
        closed: false
      }
    });

    if (response.status === 200 && response.data) {
      const markets = response.data.data || response.data; // Adjust based on actual structure
      console.log(`Fetched ${markets.length} markets.`);
      
      fs.writeFileSync(MARKETS_FILE, JSON.stringify(markets, null, 2));
      console.log(`Saved to ${MARKETS_FILE}`);
      return markets;
    } else {
      console.error('Failed to fetch markets:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching markets:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

fetchMarkets();
