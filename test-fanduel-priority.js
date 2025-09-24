/**
 * Test script to verify FanDuel prioritization in The Odds API
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ODDS_API_KEY = '0a0b21697283ae150c1d1adf4caeab67';
const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4';

async function testFanDuelPriority() {
  console.log('🎯 Testing FanDuel Priority in The Odds API...\n');
  
  try {
    // Test 1: Check if FanDuel is available
    console.log('1️⃣ Checking FanDuel availability...');
    const fanduelUrl = `${ODDS_API_BASE_URL}/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=fanduel`;
    const fanduelResponse = await fetch(fanduelUrl);
    
    if (fanduelResponse.ok) {
      const fanduelData = await fanduelResponse.json();
      console.log(`✅ FanDuel is available! Found ${fanduelData.length} games`);
      
      if (fanduelData.length > 0) {
        const firstGame = fanduelData[0];
        console.log(`📅 Sample FanDuel game: ${firstGame.away_team} @ ${firstGame.home_team}`);
        
        if (firstGame.bookmakers.length > 0) {
          const fanduelBookmaker = firstGame.bookmakers[0];
          console.log(`🎯 FanDuel odds: ${fanduelBookmaker.title}`);
          fanduelBookmaker.markets.forEach(market => {
            console.log(`  ${market.key}: ${market.outcomes.map(o => `${o.name} ${o.price}`).join(' vs ')}`);
          });
        }
      }
    } else {
      console.log(`❌ FanDuel not available: ${fanduelResponse.status} ${fanduelResponse.statusText}`);
    }
    
    // Test 2: Compare with all bookmakers
    console.log('\n2️⃣ Comparing with all bookmakers...');
    const allBookmakersUrl = `${ODDS_API_BASE_URL}/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american`;
    const allResponse = await fetch(allBookmakersUrl);
    
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log(`📊 All bookmakers: ${allData.length} games`);
      
      if (allData.length > 0) {
        const firstGame = allData[0];
        console.log(`📅 Sample game: ${firstGame.away_team} @ ${firstGame.home_team}`);
        console.log(`📚 Available bookmakers: ${firstGame.bookmakers.map(bm => bm.key).join(', ')}`);
        
        const fanduelInAll = firstGame.bookmakers.find(bm => bm.key === 'fanduel');
        if (fanduelInAll) {
          console.log('✅ FanDuel found in all bookmakers data');
        } else {
          console.log('❌ FanDuel not found in all bookmakers data');
        }
      }
    }
    
    // Test 3: Check usage
    console.log('\n3️⃣ Checking API usage...');
    const usageRemaining = fanduelResponse.headers.get('x-requests-remaining');
    const usageUsed = fanduelResponse.headers.get('x-requests-used');
    
    if (usageRemaining) {
      console.log(`📊 Requests remaining: ${usageRemaining}`);
    }
    if (usageUsed) {
      console.log(`📊 Requests used: ${usageUsed}`);
    }
    
    console.log('\n🎉 FanDuel priority test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testFanDuelPriority();
