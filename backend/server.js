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

// API endpoint to fetch DAO treasury data from DeFiLlama
app.get('/api/treasuries', async (req, res) => {
  try {
    console.log('Fetching DAO treasury data from DeFiLlama...');
    
    const apiKey = process.env.DEFILLAMA_API_KEY || 'b5a28bcfb6577c185c634712a2b8675a233aeb1ac665cd9cc8bf07f45ef7d747';
    const response = await axios.get(`https://pro-api.llama.fi/${apiKey}/api/treasuries`);
    
    console.log('Treasury API Response received:');
    console.log('Status:', response.status);
    console.log('Total treasuries found:', response.data.length);
    
    // Create a mapping of DAO names to match against treasury names
    const daoNameMappings = {
      'UNI': ['uniswap'],
      'AAVE': ['aave'],
      'COMP': ['compound'],
      'CRV': ['curve'],
      'SKY': ['sky'],
      'SUSHI': ['sushi'],
      'BAL': ['balancer'],
      'SNX': ['synthetix'],
      'YFI': ['yearn'],
      'LDO': ['lido'],
      'GLM': ['golem'],
      'OHM': ['olympus'],
      'GNO': ['gnosis'],
      'ENS': ['ens', 'ethereum name service'],
      'COW': ['cow', 'cowswap'],
      'CVX': ['convex'],
      'LQTY': ['liquity'],
      'SILO': ['silo'],
      'XVS': ['venus'],
      'EUL': ['euler'],
      'MNT': ['mantle']
    };
    
    // Filter treasuries for our tracked DAOs
    const relevantTreasuries = [];
    
    for (const [symbol, nameVariants] of Object.entries(daoNameMappings)) {
      const matchingTreasuries = response.data.filter(treasury => 
        nameVariants.some(variant => 
          treasury.name.toLowerCase().includes(variant.toLowerCase())
        )
      );
      
      if (matchingTreasuries.length > 0) {
        relevantTreasuries.push({
          symbol: symbol,
          treasuries: matchingTreasuries.map(t => ({
            id: t.id,
            name: t.name,
            tvl: t.tvl || 0,
            chainTvls: {
              ...t.chainTvls,
              // Add stablecoins to chainTvls for backwards compatibility
              stablecoins: t.tokenBreakdowns?.stablecoins || 0
            },
            tokensBreakdown: t.tokensBreakdown || {},
            tokenBreakdowns: t.tokenBreakdowns || {},
            ownTokens: t.chainTvls?.OwnTokens || 0,
            chain: t.chain || 'Unknown',
            change_1h: t.change_1h || 0,
            change_1d: t.change_1d || 0,
            change_7d: t.change_7d || 0,
            url: t.url || null,
            // Also add stablecoins as a top-level field for easy access
            stablecoins: t.tokenBreakdowns?.stablecoins || 0
          }))
        });
      }
    }
    
    console.log('Relevant treasuries found:', relevantTreasuries.length);
    console.log('Sample treasuries:', relevantTreasuries.slice(0, 3).map(t => ({
      symbol: t.symbol,
      count: t.treasuries.length,
      totalTvl: t.treasuries.reduce((sum, treasury) => sum + (treasury.tvl || 0), 0)
    })));
    
    res.json({
      success: true,
      data: relevantTreasuries,
      summary: {
        totalDaosWithTreasuries: relevantTreasuries.length,
        totalTreasuriesFound: relevantTreasuries.reduce((sum, dao) => sum + dao.treasuries.length, 0),
        totalValueLocked: relevantTreasuries.reduce((sum, dao) => 
          sum + dao.treasuries.reduce((daoSum, t) => daoSum + (t.tvl || 0), 0), 0
        )
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching treasuries:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to decode Euler AmountCap format
function decodeAmountCap(rawCap) {
  if (rawCap === 0) return Number.MAX_SAFE_INTEGER; // No limit
  
  const exponent = rawCap & 63; // Last 6 bits
  const mantissa = rawCap >> 6;  // First 10 bits
  
  return Math.pow(10, exponent) * mantissa / 100;
}

// API endpoint for Euler Prime USDC Vault data
app.get('/api/euler-vaults', async (req, res) => {
  try {
    const EULER_PRIME_USDC_VAULT = "0x797DD80692c3b2dAdabCe8e30C07fDE5307D48a9";
    
    // ABI for Euler Vault
    const eulerVaultABI = [
      "function totalAssets() external view returns (uint256)",
      "function convertToAssets(uint256 shares) external view returns (uint256)",
      "function convertToShares(uint256 assets) external view returns (uint256)",
      "function cash() external view returns (uint256)",
      "function totalBorrows() external view returns (uint256)",
      "function debtOf(address account) external view returns (uint256)",
      "function interestRate() external view returns (uint256)",
      "function interestAccumulator() external view returns (uint256)",
      "function asset() external view returns (address)",
      "function name() external view returns (string)",
      "function symbol() external view returns (string)",
      "function decimals() external view returns (uint8)",
      "function caps() external view returns (uint16 supplyCap, uint16 borrowCap)",
      "function LTVFull(address collateral) external view returns (uint16 borrowLTV, uint16 liquidationLTV, uint16 initialLiquidationLTV, uint48 targetTimestamp, uint32 rampDuration)",
      "function creator() external view returns (address)",
      "function oracle() external view returns (address)",
      "function unitOfAccount() external view returns (address)"
    ];
    
    const provider = new ethers.JsonRpcProvider(
      process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/exAp0m_LKHnmcM2Uni2BbYH5cLgBYaV2'
    );
    
    const vault = new ethers.Contract(EULER_PRIME_USDC_VAULT, eulerVaultABI, provider);
    
    // Fetch vault data
    const [name, symbol, decimals, asset] = await Promise.all([
      vault.name(),
      vault.symbol(),
      vault.decimals(),
      vault.asset()
    ]);
    
    const [totalAssets, cash, totalBorrows, interestRate] = await Promise.all([
      vault.totalAssets(),
      vault.cash(),
      vault.totalBorrows(),
      vault.interestRate()
    ]);
    
    const [rawSupplyCap, rawBorrowCap] = await vault.caps();
    const supplyCap = decodeAmountCap(Number(rawSupplyCap));
    const borrowCap = decodeAmountCap(Number(rawBorrowCap));
    
    // CORRECT CALCULATIONS
    const utilizationRate = totalAssets > 0n ? Number((totalBorrows * 10000n) / totalAssets) : 0;
    const availableToBorrow = cash; // Cash IS what's available to borrow
    
    // Calculate borrow cap remaining
    const totalBorrowsFormatted = Number(ethers.formatUnits(totalBorrows, decimals));
    const borrowCapRemaining = borrowCap === Number.MAX_SAFE_INTEGER ? 
      Number.MAX_SAFE_INTEGER : 
      Math.max(0, borrowCap - totalBorrowsFormatted);
    
    // Convert SPY to APY properly
    const SECONDS_PER_YEAR = 365.2425 * 24 * 60 * 60;
    const interestRateSPY = Number(ethers.formatUnits(interestRate, 27));
    const apy = Math.pow(1 + interestRateSPY, SECONDS_PER_YEAR) - 1;
    
    // Format response
    const vaultData = {
      address: EULER_PRIME_USDC_VAULT,
      name,
      symbol,
      decimals: Number(decimals),
      underlyingAsset: asset,
      
      // Financial state
      totalAssets: ethers.formatUnits(totalAssets, decimals),
      cash: ethers.formatUnits(cash, decimals), // Available liquidity
      totalBorrows: ethers.formatUnits(totalBorrows, decimals),
      availableToBorrow: ethers.formatUnits(availableToBorrow, decimals),
      utilizationBps: utilizationRate,
      utilizationPercent: utilizationRate / 100,
      interestRateSPY: interestRateSPY.toString(),
      
      // Risk parameters (now properly decoded)
      supplyCap: supplyCap === Number.MAX_SAFE_INTEGER ? "No limit" : supplyCap.toLocaleString(),
      borrowCap: borrowCap === Number.MAX_SAFE_INTEGER ? "No limit" : borrowCap.toLocaleString(),
      borrowCapRemaining: borrowCapRemaining === Number.MAX_SAFE_INTEGER ? "No limit" : borrowCapRemaining.toLocaleString(),
      
      // Merger-specific calculations
      maxBorrowableUSDC: ethers.formatUnits(availableToBorrow, decimals),
      currentAPY: (apy * 100).toFixed(2) + '%',
      
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: vaultData
    });
    
  } catch (error) {
    console.error('Error querying Euler Prime USDC vault:', error);
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
      
    // Fetch real-time data for merger context
    const [vaultsRes, pricesRes, treasuriesRes] = await Promise.all([
      axios.get(`${BACKEND_URL}/api/euler-vaults`),
      axios.get(`${BACKEND_URL}/api/prices`),
      axios.get(`${BACKEND_URL}/api/treasuries`)
    ]);
  
    const eulerVault = vaultsRes.data.data;
    const prices = pricesRes.data.data;
    const treasuries = treasuriesRes.data.data;
    
    // Extract DAOs from merger pair
    const [daoA, daoB] = mergerPair ? mergerPair.split('-') : ['UNKNOWN', 'UNKNOWN'];
    
    // Get specific DAO data
    const daoAPrice = prices.find(p => p.symbol === daoA)?.currentPrice || 0;
    const daoBPrice = prices.find(p => p.symbol === daoB)?.currentPrice || 0;
    const daoATreasury = treasuries.find(t => t.symbol === daoA) || {};
    const daoBTreasury = treasuries.find(t => t.symbol === daoB) || {};
  
    // Build clean system prompt for merger context  
    const systemPrompt = `You are Formula, an expert in DAO treasury management and capital-efficient token swaps using EulerSwap's innovative borrowing mechanisms.

Current Merger Context:
DAO A: ${daoA} (Price: $${daoAPrice.toFixed(2)}, Treasury: $${(daoATreasury.totalValue || 0).toLocaleString()}, Stables: $${(daoATreasury.stablecoinValue || 0).toLocaleString()})
DAO B: ${daoB} (Price: $${daoBPrice.toFixed(2)}, Treasury: $${(daoBTreasury.totalValue || 0).toLocaleString()}, Stables: $${(daoBTreasury.stablecoinValue || 0).toLocaleString()})

Euler Prime USDC Vault Status:
- Available to Borrow: $${eulerVault.availableToBorrow || '0'}
- Utilization: ${eulerVault.utilizationPercent || 0}%
- Current APY: ${eulerVault.currentAPY || '0%'}
- Borrow Cap Remaining: ${eulerVault.borrowCapRemaining || 'Unknown'}

Your role is to:
• Explain the cross-collateralization model:
  - DAOs deposit USDC into Euler's USDC vault as collateral
  - Native token vaults (SUSHI/UNI) accept USDC vault positions as collateral
  - DAOs can borrow native tokens using USDC collateral (not depositing native tokens as collateral)
  - Each swap deposits tokens into the opposite vault, creating borrowable liquidity
• Assess merger feasibility based on stablecoin holdings and USDC vault availability
• Calculate borrowing capacity: With 90% LTV, $10M USDC enables borrowing up to $9M in native tokens
• Guide users through the setup:
  - SUSHI vault must call setLTV(USDC_vault, 0.9e4, 0.9e4, 0) to accept USDC as collateral
  - UNI vault must call setLTV(USDC_vault, 0.9e4, 0.9e4, 0) to accept USDC as collateral
  - Initial native token deposits: 10-20% of total swap value
  - NO native tokens used as collateral - only USDC
• Simulate the cross-deposit feedback loop:
  - Swap 1: UNI borrows SUSHI → deposits UNI into SUSHI vault
  - Swap 2: SUSHI can now borrow UNI from SUSHI vault (!!)
  - Each swap increases borrowable liquidity
• Alert to constraints: USDC vault liquidity, borrow caps, collateral requirements

Key Model Points:
- USDC LTV in native vaults: 85-95% (stablecoins are low-risk collateral)
- Only need 10-20% native tokens initially - rest comes from borrowing
- Cross-deposits multiply efficiency with each swap
- 5-7x capital efficiency vs traditional AMMs

When users ask about merger execution, provide specific parameter recommendations:

Vault Configuration (setLTV calls):
- SUSHI_vault.setLTV(USDC_vault_address, borrowLTV, liquidationLTV, 0)
- UNI_vault.setLTV(USDC_vault_address, borrowLTV, liquidationLTV, 0)
- Recommended values: borrowLTV=0.9e4 (90%), liquidationLTV=0.93e4 (93%)

EulerSwap Pool Parameters:
- equilibriumReserve0: [Calculate based on expected swap volume]
- equilibriumReserve1: [Calculate based on expected swap volume]
- priceX: [Current price ratio, e.g., 1e27 for 1:1]
- priceY: [Inverse of priceX]
- concentrationX: [0.7e18 to 0.95e18 based on volatility]
- concentrationY: [Usually same as concentrationX]
- fee: [0.001e18 to 0.003e18 for 0.1-0.3%]
- currReserve0: [Initial deposit amount]
- currReserve1: [Initial deposit amount]`;

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
  
    // Create a condensed version of merger context to avoid API limits
    const condensedContext = {
      prices: mergerContext.prices?.map(p => ({
        symbol: p.symbol,
        currentPrice: p.currentPrice,
        decimals: p.decimals,
        // Only include last 7 days of price history
        recentPrices: p.priceHistory?.slice(-7) || []
      })),
      treasuries: mergerContext.treasuries?.map(t => ({
        symbol: t.symbol,
        treasuries: t.treasuries?.map(treasury => ({
          name: treasury.name,
          tvl: treasury.tvl,
          stablecoins: treasury.stablecoins,
          ownTokens: treasury.ownTokens
        }))
      })),
      vaults: {
        utilization: mergerContext.vaults?.utilization,
        borrowAPY: mergerContext.vaults?.borrowAPY,
        supplyAPY: mergerContext.vaults?.supplyAPY,
        totalBorrows: mergerContext.vaults?.totalBorrows,
        cash: mergerContext.vaults?.cash
      },
      mergerConfiguration: mergerContext.mergerConfiguration
    };
    
    // Create the analysis prompt for DAO merger optimization
    const analysisPrompt = `You are the EulerSwap Strategy Engine. Analyze this DAO merger scenario and provide comprehensive strategic recommendations.

1. **Status**: A "Green", "Yellow", or "Red" indicator based on merger feasibility.
   * **Green**: Both DAOs have sufficient stablecoins, USDC vault has liquidity, treasury sizes aligned
   * **Yellow**: Some constraints (limited stables, high vault utilization, size mismatch)
   * **Red**: Blocking issues (insufficient collateral, no vault liquidity, extreme size disparity)

2. **Compatibility Score** (0-100): Calculate based on:
   * Treasury size ratio (optimal 0.5-2.0x)
   * Stablecoin sufficiency (need 15-30% of swap value)
   * Token price correlation (lower = better diversification)
   * USDC vault availability vs required borrowing

3. **Optimal Execution Strategy**: Provide specific, actionable steps:
   * Initial vault setup requirements
   * Recommended swap sequence and sizes
   * Dynamic LTV ratios based on treasury composition
   * Cross-deposit accumulation projections
   * Timing recommendations based on vault liquidity

4. **Risk Assessment**: Quantify key risks:
   * Liquidity risk: Probability of vault exhaustion
   * Price impact: Expected slippage from swaps
   * Collateral risk: LTV buffer recommendations
   * Governance risk: Alignment score

Consider EulerSwap's capital efficiency mechanisms:
   * Stablecoin collateral enables 5-7x leverage on native tokens
   * Cross-deposits create self-reinforcing liquidity
   * Progressive swaps allow price discovery
   * USDC vault constraints limit borrowing capacity

5. **Cross-Collateralization Setup** (CRITICAL):
   * Native token vaults must accept USDC vault as collateral
   * setLTV(USDC_vault, borrowLTV, liquidationLTV, 0) on both vaults
   * Recommended: borrowLTV=0.9e4 (90%), liquidationLTV=0.93e4 (93%)
   * DAOs deposit USDC as collateral, NOT native tokens

6. **EulerSwap Pool Parameters** (provide exact values):
   * equilibriumReserve0/1: Set to 2-3x expected total swap volume
   * priceX/priceY: Use 1e27 precision (e.g., 2e27 means token0 is 2x token1)
   * concentrationX/Y: 0.7e18 to 0.95e18 (use e18 precision)
   * fee: 0.001e18 to 0.003e18 (0.1-0.3%) 
   * currReserve0/1: Initial seed liquidity (10-20% of total)

Parameter Calculation Rules:
   * High volatility (>50% monthly) → concentration = 0.7e18
   * Medium volatility (20-50%) → concentration = 0.85e18
   * Low volatility (<20%) → concentration = 0.95e18
   * Set equilibrium reserves to handle full merger volume
   * Price ratios must reflect current market prices  
**Merger Context Data:**

${JSON.stringify(condensedContext, null, 2)}

Output Format:

{
  "status": "[[Green/Yellow/Red]]",
  "compatibilityScore": [[0-100]],
  "summary": "[[Concise merger feasibility summary including treasury analysis and vault constraints]]",
  "executionStrategy": {
    "vaultConfiguration": {
      "daoA": {
        "vault": {
          "requiredDeposit": "[[Amount]] [[Token]]",
          "borrowLTV": [[0.7-0.9]],
          "liquidationLTV": [[0.75-0.95]],
          "supplyCap": "[[Amount or 'No limit']]",
          "borrowCap": "[[Amount or 'No limit']]"
        }
      },
      "daoB": {
        "vault": {
          "requiredDeposit": "[[Amount]] [[Token]]",
          "borrowLTV": [[0.7-0.9]],
          "liquidationLTV": [[0.75-0.95]],
          "supplyCap": "[[Amount or 'No limit']]",
          "borrowCap": "[[Amount or 'No limit']]"
        }
      }
    },
    "eulerSwapParameters": {
      "equilibriumReserve0": "[[Amount]] [[TokenA]]",
      "equilibriumReserve1": "[[Amount]] [[TokenB]]",
      "priceX": [[Price ratio]],
      "priceY": [[Price ratio]],
      "concentrationX": [[0.7-0.95]],
      "concentrationY": [[0.7-0.95]],
      "fee": "[[0.001-0.003]]",
      "currReserve0": "[[Initial amount]]",
      "currReserve1": "[[Initial amount]]"
    },
    "swapSequence": [
      {
        "step": 1,
        "initiator": "[[DAO]]",
        "amount": "[[Amount]] [[Token]]",
        "expectedCrossDeposit": "[[Amount]] [[Token]]",
        "cumulativeLiquidity": "[[Amount]]"
      }
    ],
    "totalExecutionTime": "[[X]] days",
    "finalPositions": {
      "daoA": "[[Amount]] [[TokenB]] acquired",
      "daoB": "[[Amount]] [[TokenA]] acquired"
    }
  },
  "riskAssessment": {
    "liquidityRisk": {
      "score": [[0-100]],
      "mitigation": "[[Strategy]]"
    },
    "priceImpact": {
      "estimatedSlippage": "[[X]]%",
      "mitigation": "[[Strategy]]"
    },
    "collateralRisk": {
      "requiredBuffer": "[[X]]%",
      "mitigation": "[[Strategy]]"
    }
  },
  "recommendations": [
    {
      "priority": "[[High/Medium/Low]]",
      "action": "[[Specific action]]",
      "rationale": "[[Why this matters for the merger]]",
      "impact": "[[Expected outcome]]"
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
Analyze the execution outcome based on the cross-collateralization model where DAOs use USDC collateral to borrow native tokens.

**Executed Action:**  
${JSON.stringify(action, null, 2)}  
  
**Merger State Before Action:**  
${JSON.stringify(mergerContext, null, 2)}  
  
Generate a JSON object analyzing the execution's impact on the merger process:
  
{  
  "system_components_affected": [ "Component 1", "Component 2", "..." ],  
  "merger_metrics": [  
    { "metric": "Cross-Deposit Accumulation", "value": "XX.X [[Token]]", "comment": "(enables X more swaps)" },  
    { "metric": "USDC Collateral Utilization", "value": "XX.X%", "comment": "(X% of capacity)" },  
    { "metric": "Borrowing Efficiency", "value": "XX.X%", "comment": "(vs traditional AMM)" },  
    { "metric": "Merger Completion", "value": "XX.X%", "comment": "(X of Y swaps complete)" },
    { "metric": "Price Impact", "value": "XX.X%", "comment": "(below X% target)" }
  ],  
  "liquidity_state": {
    "vault_a_holdings": { "native": "XX [[Token]]", "opposite": "XX [[Token]]" },
    "vault_b_holdings": { "native": "XX [[Token]]", "opposite": "XX [[Token]]" },
    "cross_borrowable": "XX [[Token]] from each vault",
    "efficiency_multiplier": "X.Xx vs initial deposits"
  },
  "next_recommended_actions": [  
    "Execute swap X: [[DAO]] borrows [[Amount]] [[Token]]",
    "Monitor USDC vault - currently XX% utilized",
    "Adjust LTV if collateral ratio exceeds XX%"  
  ]  
}  
  
**Instructions:**  
1. **system_components_affected**: List affected components (e.g., "SUSHI Vault", "UNI Vault", "USDC Collateral Positions", "Cross-Deposit Liquidity")
2. **merger_metrics**: Track merger-specific KPIs including cross-deposits, collateral usage, and capital efficiency
3. **liquidity_state**: Show how cross-deposits are accumulating in each vault
4. **next_recommended_actions**: Provide specific next steps based on the cross-collateralization model

Focus on how the action affects:
- Cross-deposit accumulation (tokens deposited in opposite vaults)
- USDC collateral utilization and remaining capacity
- Capital efficiency vs traditional methods
- Progress toward merger completion

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
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`Prices endpoint: http://localhost:${PORT}/api/prices`);
  console.log(`Treasuries endpoint: http://localhost:${PORT}/api/treasuries`);
  console.log(`\n--- EulerSwap Endpoints ---`);
  console.log(`Euler Vaults: GET http://localhost:${PORT}/api/euler-vaults`);
  console.log(`\n--- Analysis Endpoints ---`);
  console.log(`Analysis endpoint: POST http://localhost:${PORT}/api/analysis`);
  console.log(`Execution Summary endpoint: POST http://localhost:${PORT}/api/execution-summary`);
}); 