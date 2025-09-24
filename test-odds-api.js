/**
 * Test script for The Odds API integration
 * This tests the API without needing the full Next.js server
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ODDS_API_KEY = '0a0b21697283ae150c1d1adf4caeab67';
const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4';

async function testOddsAPI() {
  console.log('🧪 Testing The Odds API Integration...\n');
  
  try {
    // Test 1: Check API key validity by getting sports list
    console.log('1️⃣ Testing API key validity...');
    const sportsUrl = `${ODDS_API_BASE_URL}/sports/?apiKey=${ODDS_API_KEY}`;
    const sportsResponse = await fetch(sportsUrl);
    
    if (!sportsResponse.ok) {
      throw new Error(`Sports API failed: ${sportsResponse.status} ${sportsResponse.statusText}`);
    }
    
    const sports = await sportsResponse.json();
    const nflSport = sports.find(sport => sport.key === 'americanfootball_nfl');
    
    if (nflSport) {
      console.log('✅ API key is valid');
      console.log(`📊 Found NFL sport: ${nflSport.title} (${nflSport.description})`);
      console.log(`🟢 Active: ${nflSport.active}`);
    } else {
      console.log('❌ NFL sport not found in sports list');
    }
    
    // Test 2: Fetch NFL odds
    console.log('\n2️⃣ Testing NFL odds fetch...');
    const oddsUrl = `${ODDS_API_BASE_URL}/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    const oddsResponse = await fetch(oddsUrl);
    
    if (!oddsResponse.ok) {
      throw new Error(`Odds API failed: ${oddsResponse.status} ${oddsResponse.statusText}`);
    }
    
    const oddsData = await oddsResponse.json();
    console.log(`✅ Successfully fetched ${oddsData.length} NFL games`);
    
    if (oddsData.length > 0) {
      const firstGame = oddsData[0];
      console.log(`\n📅 Sample game: ${firstGame.away_team} @ ${firstGame.home_team}`);
      console.log(`🕐 Game time: ${new Date(firstGame.commence_time).toLocaleString()}`);
      console.log(`📚 Bookmakers: ${firstGame.bookmakers.length}`);
      
      // Show sample odds
      if (firstGame.bookmakers.length > 0) {
        const bookmaker = firstGame.bookmakers[0];
        console.log(`\n🎯 Sample odds from ${bookmaker.title}:`);
        bookmaker.markets.forEach(market => {
          console.log(`  ${market.key}: ${market.outcomes.map(o => `${o.name} ${o.price}${o.point ? ` (${o.point})` : ''}`).join(' vs ')}`);
        });
      }
    }
    
    // Test 3: Check usage headers
    console.log('\n3️⃣ Checking API usage...');
    const usageRemaining = oddsResponse.headers.get('x-requests-remaining');
    const usageUsed = oddsResponse.headers.get('x-requests-used');
    
    if (usageRemaining) {
      console.log(`📊 Requests remaining: ${usageRemaining}`);
    }
    if (usageUsed) {
      console.log(`📊 Requests used: ${usageUsed}`);
    }
    
    console.log('\n🎉 All tests passed! The Odds API integration is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testOddsAPI();
