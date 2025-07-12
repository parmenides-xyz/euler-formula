const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
// Define backend URL for internal API calls
const BACKEND_URL = `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json());

// DAO token addresses mapping
const DAO_TOKEN_ADDRESSES = {
  // Original tokens
  UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  COMP: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
  SKY: '0x56072c95FAA701256059aa122697B133aDEd9279', // Sky (formerly MakerDAO)
  SUSHI: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2',
  BAL: '0xba100000625a3754423978a60c9317c58a424e3D',
  SNX: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
  LDO: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
  EUL: '0xd9Fcd98c322942075A5C3860693e9f4f03AAE07b',
  
  // Additional tokens with known addresses
  GLM: '0x7dd9c5cba05e151c895fde1cf355c9a1d5da6429',
  OHM: '0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5',
  ENS: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72',
  MNT: '0x3c3a81e81dc49A522A592e7622A7E711c06bf354',
  
  // Additional DAO tokens (Ethereum mainnet addresses)
  COW: '0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB', // CoW Protocol
  CVX: '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', // Convex
  LQTY: '0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D', // Liquity
  SILO: '0x6f80310CA7F2C654691D1383149Fa1A57d8AB1f8', // Silo Finance
  XVS: '0xd3CC9d8f3689B83c91b7B59cAB4946B063EB894A', // Venus
}

// API endpoint to fetch DAO token prices from DeFiLlama with 50 daily data points
app.get('/api/prices', async (req, res) => {
  try {
    console.log('Fetching DAO token prices from DeFiLlama chart endpoint...');
    
    // Calculate start timestamp for 50 days ago
    const now = Math.floor(Date.now() / 1000);
    const fiftyDaysAgo = now - (50 * 86400); // 50 days * 86400 seconds/day
    
    // Add delay function to avoid rate limiting
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Fetch price data for each token with 50 daily data points
    const pricePromises = Object.entries(DAO_TOKEN_ADDRESSES).map(async ([symbol, address], index) => {
      // Add a 300ms delay between each request to avoid rate limiting
      await delay(index * 300);
      try {
        const coinId = `ethereum:${address}`;
        // Use the correct query parameters: start, span, period, searchWidth
        const url = `https://coins.llama.fi/chart/${coinId}?start=${fiftyDaysAgo}&span=50&period=1d&searchWidth=600`;
        
        const response = await axios.get(url);
        
        // Extract the coin data from the nested structure
        const coinData = response.data.coins?.[coinId];
        
        if (!coinData || !coinData.prices) {
          throw new Error('No price data found');
        }
        
        // Get the most recent price for current price display
        const prices = coinData.prices;
        const latestPrice = prices.length > 0 ? prices[prices.length - 1] : null;
        
        return {
          symbol: symbol,
          address: address,
          decimals: coinData.decimals || 18,
          confidence: coinData.confidence || 0,
          currentPrice: latestPrice ? latestPrice.price : 0,
          timestamp: latestPrice ? new Date(latestPrice.timestamp * 1000).toISOString() : new Date().toISOString(),
          priceHistory: prices.map(point => ({
            timestamp: new Date(point.timestamp * 1000).toISOString(),
            price: point.price
          }))
        };
      } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error.message);
        return {
          symbol: symbol,
          address: address,
          decimals: 18,
          confidence: 0,
          currentPrice: 0,
          timestamp: new Date().toISOString(),
          priceHistory: [],
          error: error.message
        };
      }
    });
    
    // Wait for all price fetches to complete
    const priceData = await Promise.all(pricePromises);
    
    // Filter out tokens with errors for summary
    const successfulFetches = priceData.filter(token => !token.error);
    
    console.log('API Response received:');
    console.log('Tokens processed:', priceData.length);
    console.log('Successful fetches:', successfulFetches.length);
    console.log('Sample prices:', priceData.slice(0, 3).map(t => ({
      symbol: t.symbol,
      currentPrice: t.currentPrice,
      historyPoints: t.priceHistory.length
    })));
    
    res.json({
      success: true,
      data: priceData,
      summary: {
        totalTokens: priceData.length,
        successfulFetches: successfulFetches.length,
        failedFetches: priceData.length - successfulFetches.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching prices:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint for token circulating supply from CoinGecko
app.get('/api/token-circulation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Validate token parameter
    if (!token || !DAO_TOKEN_ADDRESSES[token.toUpperCase()]) {
      return res.status(400).json({
        success: false,
        error: `Invalid token. Valid tokens are: ${Object.keys(DAO_TOKEN_ADDRESSES).join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    const tokenSymbol = token.toUpperCase();
    
    // Map token symbols to CoinGecko IDs
    const coingeckoIds = {
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'COMP': 'compound-governance-token',
      'SKY': 'sky',
      'SUSHI': 'sushi',
      'BAL': 'balancer',
      'SNX': 'havven',
      'LDO': 'lido-dao',
      'EUL': 'euler',
      'GLM': 'golem',
      'OHM': 'olympus',
      'ENS': 'ethereum-name-service',
      'MNT': 'mantle',
      'COW': 'cow-protocol',
      'CVX': 'convex-finance',
      'LQTY': 'liquity',
      'SILO': 'silo-finance',
      'XVS': 'venus'
    };
    
    const coinId = coingeckoIds[tokenSymbol];
    if (!coinId) {
      throw new Error(`No CoinGecko ID mapping found for token ${tokenSymbol}`);
    }
    
    console.log(`Fetching circulating supply for ${tokenSymbol} (${coinId}) from CoinGecko`);
    
    const options = {
      method: 'GET',
      url: `https://api.coingecko.com/api/v3/coins/${coinId}?market_data=true`,
      headers: {
        accept: 'application/json',
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
      }
    };
    
    const response = await axios.request(options);
    
    if (!response.data || !response.data.market_data) {
      throw new Error('Invalid response format from CoinGecko API');
    }
    
    const circulatingSupply = response.data.market_data.circulating_supply;
    
    console.log(`Token ${tokenSymbol} circulating supply: ${circulatingSupply.toLocaleString()}`);
    
    res.json({
      success: true,
      data: {
        token: tokenSymbol,
        circulatingSupply: circulatingSupply,
        name: response.data.name,
        symbol: response.data.symbol.toUpperCase()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching token circulation data:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


app.post('/api/test-analysis', async (req, res) => {
    // WARNING: Hardcoding API keys is insecure. In production, use environment variables.
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    try {
        console.log('Proxying request to Anthropic API...');
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-opus-4-0",
            max_tokens: 1024,
            messages: [
                { role: "user", content: "Hello, world" }
            ]
        }, {
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        console.log('Anthropic API Response received:');
        console.log('Status:', response.status);
        res.json({
            success: true,
            data: response.data,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error proxying to Anthropic API:', error.message);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            return res.status(error.response.status).json({
                success: false,
                error: error.response.data
            });
        }
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Chat endpoint integrating with Claude AI  
app.post('/api/chat', async (req, res) => {  
  try {  
    const { messages: userMessages, mergerPair } = req.body; // mergerPair like "AAVE-COMP"
      
    // Extract DAOs from merger pair
    const [daoA, daoB] = mergerPair ? mergerPair.split('-') : ['UNKNOWN', 'UNKNOWN'];
    
    // Fetch prices and circulating supply for both tokens
    const [pricesRes, tokenACirculation, tokenBCirculation] = await Promise.all([
      axios.get(`${BACKEND_URL}/api/prices`),
      daoA !== 'UNKNOWN' ? axios.get(`${BACKEND_URL}/api/token-circulation/${daoA}`) : Promise.resolve({ data: { data: { circulatingSupply: 0 } } }),
      daoB !== 'UNKNOWN' ? axios.get(`${BACKEND_URL}/api/token-circulation/${daoB}`) : Promise.resolve({ data: { data: { circulatingSupply: 0 } } })
    ]);
  
    const prices = pricesRes.data.data;
    
    // Get specific DAO data
    const daoAPrice = prices.find(p => p.symbol === daoA)?.currentPrice || 0;
    const daoBPrice = prices.find(p => p.symbol === daoB)?.currentPrice || 0;
    const daoASupply = tokenACirculation.data.data.circulatingSupply || 0;
    const daoBSupply = tokenBCirculation.data.data.circulatingSupply || 0;
    
    // Calculate merger metrics
    const requiredMint = daoASupply && daoBPrice ? (daoASupply * daoAPrice) / daoBPrice : 0;
    const dilutionPercentage = daoBSupply ? (requiredMint / (daoBSupply + requiredMint)) * 100 : 0;
    
    // Calculate dynamic concentration parameters
    // Lower concentration for phased-out token (allows more price discovery)
    // Higher concentration for surviving token (provides stability)
    const marketCapRatio = daoASupply && daoBSupply && daoAPrice && daoBPrice ? 
      (daoASupply * daoAPrice) / (daoBSupply * daoBPrice) : 1;
    
    // concentrationX: 0.3-0.5 for phased-out token (lower = more flexible pricing)
    const concentrationX = marketCapRatio < 0.1 ? 0.3 : 
                          marketCapRatio < 1 ? 0.4 : 
                          0.5;
    
    // concentrationY: 0.8-0.95 for surviving token (higher = more stable)
    const concentrationY = dilutionPercentage < 10 ? 0.95 : 
                          dilutionPercentage < 30 ? 0.9 : 
                          0.85;
  
    // Build clean system prompt for merger context  
    const systemPrompt = `You are FORMULA, an expert in EulerSwap's one-sided JIT liquidity model for capital-efficient DAO mergers.

Current Merger Context:
• Phased-out Token: ${daoA} 
  - Circulating Supply: ${daoASupply.toLocaleString()} tokens
  - Price: $${daoAPrice.toFixed(2)}
  - Market Cap: $${(daoASupply * daoAPrice).toLocaleString()}
• Surviving Token: ${daoB}
  - Circulating Supply: ${daoBSupply.toLocaleString()} tokens
  - Price: $${daoBPrice.toFixed(2)}
  - Market Cap: $${(daoBSupply * daoBPrice).toLocaleString()}

EulerSwap One-Sided JIT Model:
• Zero initial liquidity deployment (currReserve0 = 1, currReserve1 = ${requiredMint.toFixed(0)})
• Only surviving token vault needs pre-funding
• Phased-out tokens deposited as collateral in their vault
• Surviving tokens borrowed just-in-time from pre-funded vault
• Up to 40x capital efficiency vs traditional AMMs

Merger Feasibility Assessment:
• Required surviving token mint: ${requiredMint.toLocaleString()} ${daoB} tokens
• Dilution impact: ${dilutionPercentage.toFixed(1)}% to ${daoB} holders
• Status: ${dilutionPercentage < 20 ? 'Green (low dilution)' : dilutionPercentage < 50 ? 'Yellow (moderate dilution)' : 'Red (high dilution)'}
• Market cap ratio: ${daoASupply && daoBSupply ? ((daoASupply * daoAPrice) / (daoBSupply * daoBPrice)).toFixed(2) : 'N/A'}x

Pool Configuration:
- vault0: ${daoA} vault (collateral sink only)
- vault1: ${daoB} vault (pre-funded liquidity source)
- equilibriumReserve0: 1 (no pre-funding for phased-out side)
- equilibriumReserve1: ${requiredMint.toLocaleString()} tokens
- concentrationX/Y: 0.95e18 (95% concentration for efficiency)
- priceX/Y: Based on ${(daoAPrice/daoBPrice).toFixed(4)} ratio
- fee: 0.003e18 (0.3% standard fee)

Dynamic Pricing:
• Continuous price adjustment based on swap volume
• High concentration (95%) provides efficiency with controlled slippage
• Price impact increases for swaps beyond concentrated range
• No fixed exchange rate - market-driven price discovery

Key Advantages:
• No idle capital locked in pools
• Single-sided funding requirement
• Yield generation on vault deposits
• True price discovery through AMM curve
• Phased execution possible for large mergers

Your role is to:
• Explain the one-sided JIT liquidity model and how it works
• Assess merger feasibility based on circulating supplies and dilution impact
• Calculate required surviving token mint amounts
• Guide users through pool configuration with specific parameters
• Analyze price impact and recommend execution strategies
• Focus on "merger feasibility" not "ragequit" or "phaseout" mechanisms

When users ask about merger execution, provide specific parameter recommendations:

EulerSwap Pool Parameters for ${daoA}-${daoB} merger:
{
  vault0: "${daoA}VaultAddress",     // Phased-out token vault (collateral only)
  vault1: "${daoB}VaultAddress",     // Surviving token vault (liquidity source)
  equilibriumReserve0: 1,             // Zero for phased-out side
  equilibriumReserve1: ${requiredMint.toFixed(0)},  // Required mint amount
  priceX: 1e18,                       // Base unit
  priceY: ${Math.floor((daoAPrice/daoBPrice) * 1e18)}, // Price ratio
  concentrationX: ${concentrationX}e18,    // Dynamic: ${(concentrationX * 100).toFixed(0)}% for phased-out token
  concentrationY: ${concentrationY}e18,    // Dynamic: ${(concentrationY * 100).toFixed(0)}% for surviving token
  fee: 0.003e18,                      // 0.3% fee
  currReserve0: 1,                    // No initial liquidity
  currReserve1: ${requiredMint.toFixed(0)} // Start at equilibrium point
}

Execution Steps:
1. Deploy ${daoB} vault with sufficient tokens (${(requiredMint * 1.2).toFixed(0)} with buffer)
2. Deploy ${daoA} vault (empty - will receive collateral)
3. Configure pool with asymmetric parameters above
4. Execute swaps - each swap borrows ${daoB} using ${daoA} as collateral
5. Monitor price impact and adjust execution pace

Feasibility Score Components:
- Supply ratio compatibility (30%): ${daoASupply && daoBSupply ? 'Market cap ratio ' + ((daoASupply * daoAPrice) / (daoBSupply * daoBPrice)).toFixed(2) + 'x' : 'N/A'}
- Dilution acceptability (35%): ${dilutionPercentage.toFixed(1)}% dilution
- Price impact tolerance (20%): Depends on swap size vs concentration
- Vault funding capability (15%): ${daoB} DAO's ability to fund ${requiredMint.toLocaleString()} tokens`;

    // Call Claude via Messages API  
    const aiResp = await axios.post('https://api.anthropic.com/v1/messages', {  
      model: 'claude-sonnet-4-20250514',  
      max_tokens: 3000,  
      system: systemPrompt,  
      messages: userMessages.map(m => ({ role: m.role, content: m.content }))  
    }, {  
      headers: {  
        'x-api-key': process.env.ANTHROPIC_API_KEY,  
        'anthropic-version': '2023-06-01',  
        'content-type': 'application/json'  
      }  
    });  
    const completion = aiResp.data.content.map(c => c.text).join('').trim();  
    res.json({ success: true, completion });  
  } catch (error) {  
    console.error('Error in chat endpoint:', error);  
    if (error.response) {  
      return res.status(error.response.status).json({ success: false, error: error.response.data });  
    }  
    res.status(500).json({ success: false, error: error.message });  
  }  
});

// Analysis endpoint for AI-powered merger strategy optimization
app.post('/api/analysis', async (req, res) => {  
  try {  
    const { mergerContext } = req.body; // mergerContext contains comprehensive merger data
      
    if (!mergerContext) {  
      return res.status(400).json({  
        success: false,  
        error: 'Merger context is required',  
        timestamp: new Date().toISOString()  
      });  
    }  
  
    console.log('Performing AI analysis of DAO merger strategy...');  
    console.log('Merger context keys:', Object.keys(mergerContext));  
  
    // Extract DAO information
    const daoA = mergerContext.daoA;
    const daoB = mergerContext.daoB;
    
    if (!daoA || !daoB) {
      return res.status(400).json({
        success: false,
        error: 'Both daoA and daoB must be provided in merger context',
        timestamp: new Date().toISOString()
      });
    }
    
    // Fetch circulating supply data for merger pair
    const [daoACirculation, daoBCirculation] = await Promise.all([
      axios.get(`${BACKEND_URL}/api/token-circulation/${daoA.symbol}`),
      axios.get(`${BACKEND_URL}/api/token-circulation/${daoB.symbol}`)
    ]);
    
    // Calculate key merger metrics
    const daoASupply = daoACirculation.data.data.circulatingSupply || 0;
    const daoBSupply = daoBCirculation.data.data.circulatingSupply || 0;
    const daoAPrice = daoA.price || 0;
    const daoBPrice = daoB.price || 0;
    
    const requiredMint = daoASupply && daoBPrice ? (daoASupply * daoAPrice) / daoBPrice : 0;
    const dilutionPercentage = daoBSupply ? (requiredMint / (daoBSupply + requiredMint)) * 100 : 0;
    const marketCapRatio = daoASupply && daoBSupply && daoAPrice && daoBPrice ? 
      (daoASupply * daoAPrice) / (daoBSupply * daoBPrice) : 0;
    
    // Calculate dynamic concentration parameters
    // Lower concentration for phased-out token (allows more price discovery)
    // Higher concentration for surviving token (provides stability)
    
    // concentrationX: 0.3-0.5 for phased-out token (lower = more flexible pricing)
    const concentrationX = marketCapRatio < 0.1 ? 0.3 : 
                          marketCapRatio < 1 ? 0.4 : 
                          0.5;
    
    // concentrationY: 0.8-0.95 for surviving token (higher = more stable)
    const concentrationY = dilutionPercentage < 10 ? 0.95 : 
                          dilutionPercentage < 30 ? 0.9 : 
                          0.85;
    
    // Create condensed context with circulation data
    const condensedContext = {
      daoA: {
        symbol: daoA.symbol,
        price: daoAPrice,
        circulatingSupply: daoASupply,
        marketCap: daoASupply * daoAPrice
      },
      daoB: {
        symbol: daoB.symbol,
        price: daoBPrice,
        circulatingSupply: daoBSupply,
        marketCap: daoBSupply * daoBPrice
      },
      mergerMetrics: {
        requiredMint,
        dilutionPercentage,
        marketCapRatio
      },
      prices: mergerContext.prices?.map(p => ({
        symbol: p.symbol,
        currentPrice: p.currentPrice,
        decimals: p.decimals,
        recentPrices: p.priceHistory?.slice(-7) || []
      }))
    };
    
    // Create the analysis prompt for DAO merger optimization
    const analysisPrompt = `You are the EulerSwap Strategy Engine. Analyze this DAO merger using the one-sided JIT liquidity model.

MERGER FEASIBILITY ASSESSMENT FRAMEWORK:

1. **Circulating Supply Analysis**:
   - ${daoA.symbol}: ${daoASupply.toLocaleString()} tokens at $${daoAPrice}
   - ${daoB.symbol}: ${daoBSupply.toLocaleString()} tokens at $${daoBPrice}
   - Market cap ratio: ${marketCapRatio.toFixed(2)}x
   - Optimal range: 0.1x to 10x

2. **Required Surviving Token Mint**:
   - Calculation: (${daoASupply.toLocaleString()} × $${daoAPrice}) / $${daoBPrice}
   - Required mint: ${requiredMint.toLocaleString()} ${daoB.symbol}
   - Dilution: ${dilutionPercentage.toFixed(1)}%
   - Status: ${dilutionPercentage < 20 ? 'Green' : dilutionPercentage < 50 ? 'Yellow' : 'Red'}

3. **Feasibility Status**: Determine "Green", "Yellow", or "Red" based on:
   * **Green**: Dilution <20%, market cap ratio 0.5-2x, straightforward execution
   * **Yellow**: Dilution 20-50%, market cap ratio 0.1-10x, requires phased approach
   * **Red**: Dilution >50%, extreme market cap disparity, not recommended

4. **Compatibility Score** (0-100): Calculate weighted average of:
   * Supply ratio compatibility (25%): ${marketCapRatio > 0.1 && marketCapRatio < 10 ? 100 : marketCapRatio > 0.01 && marketCapRatio < 100 ? 50 : 0}
   * Dilution acceptability (30%): ${Math.max(0, 100 - (dilutionPercentage * 2))}
   * Price impact tolerance (20%): Based on concentration parameters
   * Vault funding capability (25%): Assess if ${daoB.symbol} DAO can fund ${requiredMint.toLocaleString()} tokens

5. **Dynamic Pricing Impact** (with ${concentrationX}e18/${concentrationY}e18 concentration):
   - Calculate price impact for different swap volumes:
     * 10% of supply: Minimal impact (<2%)
     * 50% of supply: Moderate impact (5-10%)
     * 100% of supply: Significant impact (>15%)
   - Target: <5% impact for majority of swaps

6. **Vault Funding Requirements**:
   - Only ${daoB.symbol} vault needs funding
   - Required liquidity: ${(requiredMint * 1.2).toFixed(0)} tokens (20% buffer)
   - No funding needed for ${daoA.symbol} vault (collateral sink only)

7. **Merger Type Classification**:
   ${marketCapRatio > 5 ? 'Acquisition' : 
     marketCapRatio > 0.5 && marketCapRatio < 2 ? 'Merger of Equals' :
     'Strategic Alliance'}

8. **EulerSwap Pool Parameters**:
   {
     vault0: "${daoA.symbol}VaultAddress",
     vault1: "${daoB.symbol}VaultAddress", 
     equilibriumReserve0: 1,
     equilibriumReserve1: ${requiredMint.toFixed(0)},
     priceX: 1e18,
     priceY: ${Math.floor((daoAPrice / daoBPrice) * 1e18)},
     concentrationX: ${concentrationX}e18,
     concentrationY: ${concentrationY}e18,
     fee: 0.003e18,
     currReserve0: 1,
     currReserve1: ${requiredMint.toFixed(0)}
   }

**Risk Assessment**: Focus on:
   * Dilution Risk: Impact on ${daoB.symbol} holders (${dilutionPercentage.toFixed(1)}%)
   * Price Impact: Slippage from large swaps with ${concentrationX}e18/${concentrationY}e18 concentration
   * Vault Funding: ${daoB.symbol} DAO's ability to fund required liquidity
   * Execution Timing: Optimal phasing to minimize market impact

**Merger Context Data:**

${JSON.stringify(condensedContext, null, 2)}

Output Format:

{
  "status": "[[Green/Yellow/Red]]",
  "compatibilityScore": [[weighted average 0-100]],
  "summary": "Merger feasibility assessment with key constraints",
  "mergerType": "[[Acquisition/Merger of Equals/Strategic Alliance]]",
  "keyMetrics": {
    "supplyRatio": "[[marketCapRatio]]x",
    "requiredMint": "[[requiredMint]] [[daoB.symbol]]",
    "dilutionImpact": "[[dilutionPercentage]]%",
    "priceImpactAt50%": "[[calculated]]%"
  },
  "executionStrategy": {
    "poolConfiguration": {
      "vault0": "0x...",
      "vault1": "0x...",
      "equilibriumReserve0": "1",
      "equilibriumReserve1": "[[requiredMint]]",
      "concentrationX": "[[calculated concentrationX]]e18",
      "concentrationY": "[[calculated concentrationY]]e18",
      "priceX": "1e18",
      "priceY": "[[calculated price ratio]]",
      "fee": "0.003e18"
    },
    "phaseOutToken": "[[daoA.symbol]]",
    "survivingToken": "[[daoB.symbol]]",
    "totalExecutionTime": "[[based on volume]]",
    "recommendedPhases": [
      {
        "phase": 1,
        "description": "Deploy vaults and configure pool",
        "duration": "1 day"
      },
      {
        "phase": 2,
        "description": "Execute [[X]]% of total swap volume",
        "duration": "[[Y]] days"
      }
    ]
  },
  "riskAssessment": {
    "dilutionRisk": {
      "score": [[0-100]],
      "severity": "[[Low/Medium/High]]",
      "mitigation": "Strategy to address"
    },
    "priceImpact": {
      "estimatedSlippage": "[[X]]%",
      "mitigation": "Phased execution over [[Y]] days"
    },
    "vaultFunding": {
      "requiredLiquidity": "[[requiredMint * 1.2]]",
      "fundingSource": "DAO treasury assessment"
    }
  },
  "recommendations": [
    {
      "priority": "High",
      "action": "Specific actionable step",
      "rationale": "Why this matters",
      "impact": "Expected outcome"
    }
  ]
}

Provide a valid JSON response with realistic calculations based on the merger context.`;  
  
    // Call Anthropic API for analysis  
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;  
      
    if (!ANTHROPIC_API_KEY) {  
      return res.status(500).json({  
        success: false,  
        error: 'Anthropic API key not configured',  
        timestamp: new Date().toISOString()  
      });  
    }  
  
    const response = await axios.post('https://api.anthropic.com/v1/messages', {  
      model: 'claude-sonnet-4-20250514',  
      max_tokens: 2048,  
      messages: [  
        {   
          role: "user",   
          content: analysisPrompt  
        }  
      ]  
    }, {  
      headers: {  
        'x-api-key': ANTHROPIC_API_KEY,  
        'anthropic-version': '2023-06-01',  
        'content-type': 'application/json'  
      }  
    });  
  
    console.log('Anthropic API Response received:');  
    console.log('Status:', response.status);  
      
    // Parse the AI response  
    const aiResponse = response.data.content[0].text;  
    console.log('AI Response:', aiResponse);  
  
    // Try to extract JSON from the response  
    let analysisResult;  
    try {  
      // Look for JSON in the response  
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);  
      if (jsonMatch) {  
        analysisResult = JSON.parse(jsonMatch[0]);  
      } else {  
        throw new Error('No JSON found in response');  
      }  
    } catch (parseError) {  
      console.error('Error parsing AI response:', parseError);  
      // Return a fallback response  
      analysisResult = {  
        status: "Yellow",  
        summary: "Unable to parse AI analysis. Please check the data and try again.",  
        actions: []  
      };  
    }  
  
    res.json({  
      success: true,  
      data: analysisResult,  
      rawResponse: aiResponse,  
      timestamp: new Date().toISOString()  
    });  
  
  } catch (error) {  
    console.error('Error in analysis endpoint:', error);  
    if (error.response) {  
      console.error('Error response data:', error.response.data);  
      return res.status(error.response.status).json({  
        success: false,  
        error: error.response.data,  
        timestamp: new Date().toISOString()  
      });  
    }  
    res.status(500).json({  
      success: false,  
      error: error.message,  
      timestamp: new Date().toISOString()  
    });  
  }  
});
  
// Endpoint to generate a detailed summary after a merger action is executed
app.post('/api/execution-summary', async (req, res) => {
  try {
    const { action, mergerContext } = req.body;

    if (!action || !mergerContext) {
      return res.status(400).json({
        success: false,
        error: 'Action and merger context are required',
      });
    }

    console.log('Generating merger execution summary...');

    const summaryPrompt = `  
A merger action was just executed in the EulerSwap DAO merger simulator.
Analyze the execution outcome based on the one-sided JIT liquidity model where only the surviving token vault needs pre-funding.

**Executed Action:**  
${JSON.stringify(action, null, 2)}  
  
**Merger State Before Action:**  
${JSON.stringify(mergerContext, null, 2)}  
  
Generate a JSON object analyzing the execution's impact on the merger process:
  
{  
  "system_components_affected": [ "Component 1", "Component 2", "..." ],  
  "merger_metrics": [  
    { "metric": "Phased-out Tokens Deposited", "value": "XX.X [[Token]]", "comment": "(used as collateral)" },  
    { "metric": "Surviving Tokens Borrowed", "value": "XX.X [[Token]]", "comment": "(from pre-funded vault)" },  
    { "metric": "Dilution Progress", "value": "XX.X%", "comment": "(of total XX% expected)" },
    { "metric": "Price Impact", "value": "XX.X%", "comment": "(based on concentration parameters)" },
    { "metric": "Merger Completion", "value": "XX.X%", "comment": "(of circulating supply swapped)" }
  ],  
  "liquidity_state": {
    "phaseout_vault": { 
      "collateral_received": "XX [[PhaseoutToken]]",
      "borrowing_capacity": "XX [[SurvivingToken]]" 
    },
    "surviving_vault": { 
      "pre_funded": "XX [[SurvivingToken]]",
      "available_to_borrow": "XX [[SurvivingToken]]",
      "borrowed_so_far": "XX [[SurvivingToken]]"
    },
    "price_discovery": "Current ratio: XX [[PhaseoutToken]]/[[SurvivingToken]]"
  },
  "next_recommended_actions": [  
    "Continue swaps: XX% of circulating supply remaining",
    "Monitor price impact: currently XX% slippage",
    "Vault funding check: XX [[SurvivingToken]] available",
    "Adjust execution pace if price impact exceeds X%"
  ]  
}  
  
**Instructions:**  
1. **system_components_affected**: List affected components (e.g., "[PhaseoutToken] Vault", "[SurvivingToken] Vault", "EulerSwap AMM Curve", "Dynamic Pricing Mechanism", "JIT Borrowing Engine")
2. **merger_metrics**: Track one-sided JIT specific KPIs including collateral deposits, JIT borrowing, dilution progress, and price impact
3. **liquidity_state**: Show vault states for the asymmetric liquidity model (phaseout vault receives collateral, surviving vault provides borrowable liquidity)
4. **next_recommended_actions**: Provide specific next steps based on merger progress and price impact

Focus on how the action affects:
- Phased-out token deposits as collateral
- Surviving token JIT borrowing from pre-funded vault
- Dynamic pricing through concentrated AMM curve
- Progress toward complete merger (% of circulating supply)
- Capital efficiency gains (32-40x vs traditional)

Remember:
- equilibriumReserve0 = 1 (phaseout side)
- No initial liquidity deployment (currReserve0 = 1, currReserve1 = ${requiredMint.toFixed(0)})
- Only surviving token vault needs funding
- Price adjusts dynamically based on swap volume

Provide ONLY the raw JSON object in your response.
    `;

    // Call Anthropic API
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'Anthropic API key not configured',
        });
    }

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: summaryPrompt }]
    }, {
        headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        }
    });

    const aiResponse = response.data.content[0].text;
    console.log('AI Execution Summary Response:', aiResponse);

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const summaryResult = JSON.parse(jsonMatch[0]);
      res.json({
        success: true,
        data: summaryResult,
      });
    } else {
      throw new Error('No JSON found in AI response for execution summary');
    }

  } catch (error) {
    console.error('Error in execution-summary endpoint:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data,
      });
    }
    res.status(500).json({
        success: false,
        error: error.message,
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`\n--- Core Endpoints ---`);
  console.log(`Test endpoint: GET http://localhost:${PORT}/api/test`);
  console.log(`Prices endpoint: GET http://localhost:${PORT}/api/prices`);
  console.log(`Token Circulation: GET http://localhost:${PORT}/api/token-circulation/:token`);
  console.log(`\n--- AI-Powered Endpoints ---`);
  console.log(`Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`Analysis endpoint: POST http://localhost:${PORT}/api/analysis`);
  console.log(`Execution Summary: POST http://localhost:${PORT}/api/execution-summary`);
  console.log(`\n--- One-Sided JIT Model Features ---`);
  console.log(`• Zero initial liquidity deployment`);
  console.log(`• Only surviving token vault needs funding`);
  console.log(`• Up to 40x capital efficiency`);
  console.log(`• Dynamic pricing through AMM curves`);
}); 
