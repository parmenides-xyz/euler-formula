// Token analytics utilities for DAO merger analysis
// Calculates volatility, correlation, and other metrics from price data

// Calculate annualized volatility from price history
export const calculateVolatility = (priceHistory) => {
  if (!priceHistory || priceHistory.length < 2) return 0;
  
  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < priceHistory.length; i++) {
    const dailyReturn = (priceHistory[i].value - priceHistory[i-1].value) / priceHistory[i-1].value;
    returns.push(dailyReturn);
  }
  
  // Calculate standard deviation
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const dailyVol = Math.sqrt(variance);
  
  // Annualize (sqrt(365))
  return dailyVol * Math.sqrt(365);
};

// Calculate correlation between two token price histories
export const calculateCorrelation = (priceHistoryA, priceHistoryB) => {
  if (!priceHistoryA || !priceHistoryB || priceHistoryA.length !== priceHistoryB.length) {
    return 0;
  }
  
  // Calculate returns for both tokens
  const returnsA = calculateReturns(priceHistoryA);
  const returnsB = calculateReturns(priceHistoryB);
  
  if (returnsA.length === 0 || returnsB.length === 0) return 0;
  
  // Pearson correlation coefficient
  const meanA = average(returnsA);
  const meanB = average(returnsB);
  
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  
  for (let i = 0; i < returnsA.length; i++) {
    const diffA = returnsA[i] - meanA;
    const diffB = returnsB[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }
  
  if (denomA === 0 || denomB === 0) return 0;
  
  return numerator / Math.sqrt(denomA * denomB);
};

// Calculate volatility for all tokens in price data
export const calculateAllVolatilities = (pricesData) => {
  const volatilities = {};
  
  pricesData.forEach(token => {
    if (token.priceHistory && token.priceHistory.length > 0) {
      volatilities[token.symbol] = {
        volatility: calculateVolatility(token.priceHistory),
        percentage: (calculateVolatility(token.priceHistory) * 100).toFixed(2) + '%'
      };
    }
  });
  
  return volatilities;
};

// Categorize volatility levels for concentration parameters and risk assessment
export const categorizeVolatility = (volatility) => {
  if (volatility < 0.2) return { 
    level: 'low', 
    concentration: 0.95e18,  // Scale to 1e18 format for EulerSwap
    riskScore: 20,
    swapSizeRecommendation: 'large' // Can do bigger swaps with stable tokens
  };
  if (volatility < 0.5) return { 
    level: 'medium', 
    concentration: 0.85e18,  // Scale to 1e18 format for EulerSwap
    riskScore: 50,
    swapSizeRecommendation: 'medium'
  };
  return { 
    level: 'high', 
    concentration: 0.7e18,   // Scale to 1e18 format for EulerSwap
    riskScore: 80,
    swapSizeRecommendation: 'small' // Smaller swaps to minimize price impact
  };
};

// Get recommended LTV for USDC collateral (always high since USDC is stable)
export const getUSDCCollateralLTV = () => {
  return {
    borrowLTV: 0.9,      // 90% - can borrow up to 90% of USDC value
    liquidationLTV: 0.93, // 93% - liquidation threshold
    recommended: 0.85     // 85% - recommended safe operating level
  };
};

// Helper function to determine concentration parameters based on correlation
export const getConcentrationFromCorrelation = (correlation) => {
  // Higher correlation = higher concentration (tighter liquidity)
  if (Math.abs(correlation) > 0.7) return 0.95e18; // High correlation, scaled for EulerSwap
  if (Math.abs(correlation) > 0.3) return 0.85e18; // Medium correlation, scaled for EulerSwap
  return 0.7e18; // Low correlation, scaled for EulerSwap
};

// Enhanced correlation-based configuration for EulerSwap
export const getEulerSwapConcentration = (correlation, volatilityA, volatilityB) => {
  const avgVolatility = (volatilityA + volatilityB) / 2;
  const baseConcentration = Math.abs(correlation) > 0.7 ? 0.95e18 : 
                           Math.abs(correlation) > 0.3 ? 0.85e18 : 0.7e18;
  
  // Reduce concentration for high volatility pairs
  const volatilityAdjustment = Math.max(0.5, 1 - avgVolatility * 0.3);
  
  return Math.floor(baseConcentration * volatilityAdjustment);
};

// Helper functions
const calculateReturns = (priceHistory) => {
  const returns = [];
  for (let i = 1; i < priceHistory.length; i++) {
    returns.push((priceHistory[i].value - priceHistory[i-1].value) / priceHistory[i-1].value);
  }
  return returns;
};

const average = (arr) => {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

// Calculate basic statistics for price history
export const calculatePriceStats = (priceHistory) => {
  if (!priceHistory || priceHistory.length === 0) return null;
  
  const prices = priceHistory.map(p => p.value);
  const currentPrice = prices[prices.length - 1];
  const startPrice = prices[0];
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  
  return {
    current: currentPrice,
    change: ((currentPrice - startPrice) / startPrice * 100).toFixed(2) + '%',
    high: maxPrice,
    low: minPrice,
    volatility: calculateVolatility(priceHistory)
  };
};

// Add price scaling for EulerSwap parameters
export const scaleForEulerSwap = (priceA, priceB, decimalsA = 18, decimalsB = 18) => {
  // Account for token decimals and scale to EulerSwap bounds
  const decimalAdjustment = Math.pow(10, decimalsB - decimalsA);
  const rawRatio = (priceB / priceA) * decimalAdjustment;
  
  // Ensure within EulerSwap bounds (1 <= px, py <= 1e25)
  const priceX = Math.max(1, Math.min(1e25, 1e18)); // Normalized base
  const priceY = Math.max(1, Math.min(1e25, Math.floor(rawRatio * 1e18)));
  
  return { priceX, priceY };
};

// Validate reserve size for EulerSwap uint112 bounds
export const validateReserveSize = (reserveValue) => {
  const MAX_UINT112 = 2**112 - 1;
  return reserveValue <= MAX_UINT112;
};

export const calculateSafeReserves = (targetSwapValue, multiplier = 2.5) => {
  const MAX_UINT112 = 2**112 - 1;
  const proposedReserve = targetSwapValue * multiplier;
  
  if (proposedReserve > MAX_UINT112) {
    console.warn(`Reserve ${proposedReserve} exceeds uint112 max, capping at ${MAX_UINT112}`);
    return MAX_UINT112;
  }
  
  return Math.floor(proposedReserve);
};

// Calculate vault capacity risk for EulerSwap
export const calculateVaultCapacityRisk = (vaultData, targetSwapSize) => {
  const availableLiquidity = parseFloat(vaultData.cash || vaultData.totalAssets - vaultData.totalBorrows);
  const utilizationRate = parseFloat(vaultData.utilization) * 100;
  
  // Risk increases with utilization and swap size relative to available liquidity
  const liquidityRatio = targetSwapSize / availableLiquidity;
  const utilizationRisk = utilizationRate > 90 ? 'high' : utilizationRate > 70 ? 'medium' : 'low';
  const capacityRisk = liquidityRatio > 0.5 ? 'high' : liquidityRatio > 0.2 ? 'medium' : 'low';
  
  return {
    liquidityRatio,
    utilizationRisk,
    capacityRisk,
    recommendedMaxSwap: availableLiquidity * 0.1 // Conservative 10% of available
  };
};

// Calculate liquidation risk for leveraged positions
export const calculateLiquidationRisk = (volatility, ltv, collateralValue, debtValue) => {
  const currentLTV = debtValue / collateralValue;
  const safetyBuffer = ltv - currentLTV;
  
  // Estimate price movement needed to trigger liquidation
  const liquidationPriceMove = safetyBuffer / currentLTV;
  
  // Compare with volatility (daily moves)
  const riskScore = volatility > liquidationPriceMove ? 'high' : 
                   volatility > liquidationPriceMove * 0.5 ? 'medium' : 'low';
  
  return {
    currentLTV,
    safetyBuffer,
    liquidationPriceMove,
    riskScore,
    recommendedMaxLTV: ltv * 0.85 // 15% safety margin
  };
};