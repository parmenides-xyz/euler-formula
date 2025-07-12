// Token analytics utilities for DAO merger analysis
// Calculates volatility, correlation, and other metrics from price data

// Calculate annualized volatility from price history
export const calculateVolatility = (priceHistory) => {
  if (!priceHistory || priceHistory.length < 2) return 0;
  
  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < priceHistory.length; i++) {
    const prevValue = priceHistory[i-1].value;
    const currValue = priceHistory[i].value;
    
    // Skip if either value is invalid
    if (!prevValue || prevValue <= 0 || !currValue || currValue <= 0) {
      continue;
    }
    
    const dailyReturn = (currValue - prevValue) / prevValue;
    returns.push(dailyReturn);
  }
  
  // Need at least 2 returns for meaningful calculation
  if (returns.length < 2) return 0;
  
  // Calculate standard deviation
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const dailyVol = Math.sqrt(variance);
  
  // Annualize (sqrt(365)) and cap at reasonable max (500% annual volatility)
  return Math.min(dailyVol * Math.sqrt(365), 5);
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

// Categorize volatility levels for risk assessment
export const categorizeVolatility = (volatility) => {
  if (volatility < 0.2) return { 
    level: 'low', 
    riskScore: 20,
    swapSizeRecommendation: 'large' // Can do bigger swaps with stable tokens
  };
  if (volatility < 0.5) return { 
    level: 'medium', 
    riskScore: 50,
    swapSizeRecommendation: 'medium'
  };
  return { 
    level: 'high', 
    riskScore: 80,
    swapSizeRecommendation: 'small' // Smaller swaps to minimize price impact
  };
};


// Calculate asymmetric concentration parameters for one-sided pools
export const getAsymmetricConcentrations = (marketCapRatio, dilutionPercentage, volatilityA, volatilityB) => {
  // concentrationX: For phased-out token (0.3-0.5 range)
  // Lower concentration allows more price discovery for the exiting token
  let concentrationX;
  if (marketCapRatio < 0.1) {
    concentrationX = 0.3; // Very small token, maximum flexibility
  } else if (marketCapRatio < 1) {
    concentrationX = 0.4; // Smaller token, good flexibility
  } else {
    concentrationX = 0.5; // Larger or equal token, moderate flexibility
  }
  
  // Adjust for volatility - more volatile tokens need lower concentration
  if (volatilityA > 0.5) {
    concentrationX *= 0.8; // 20% reduction for high volatility
  }
  
  // concentrationY: For surviving token (0.8-0.95 range)
  // Higher concentration provides stability for the continuing token
  let concentrationY;
  if (dilutionPercentage < 10) {
    concentrationY = 0.95; // Low dilution, can maintain tight spreads
  } else if (dilutionPercentage < 30) {
    concentrationY = 0.9;  // Moderate dilution
  } else {
    concentrationY = 0.85; // High dilution, need more flexibility
  }
  
  // Adjust for volatility - more volatile surviving tokens need slightly lower concentration
  if (volatilityB > 0.5) {
    concentrationY *= 0.95; // 5% reduction for high volatility
  }
  
  return {
    concentrationX: Math.floor(concentrationX * 1e18), // Scale to 1e18 format
    concentrationY: Math.floor(concentrationY * 1e18)  // Scale to 1e18 format
  };
};

// Calculate merger feasibility score (0-100)
export const calculateMergerFeasibility = (marketCapRatio, dilutionPercentage, priceCorrelation) => {
  let score = 100;
  
  // Market cap ratio component (40% weight)
  if (marketCapRatio < 0.1 || marketCapRatio > 10) {
    score -= 40; // Extreme size mismatch
  } else if (marketCapRatio < 0.5 || marketCapRatio > 2) {
    score -= 20; // Moderate size mismatch
  }
  
  // Dilution component (40% weight)
  if (dilutionPercentage > 50) {
    score -= 40; // Extreme dilution
  } else if (dilutionPercentage > 30) {
    score -= 30; // High dilution
  } else if (dilutionPercentage > 20) {
    score -= 20; // Moderate dilution
  } else if (dilutionPercentage > 10) {
    score -= 10; // Low dilution
  }
  
  // Price correlation component (20% weight)
  // Higher correlation suggests tokens move together, potentially easier merger
  if (Math.abs(priceCorrelation) < 0.3) {
    score -= 20; // Low correlation, different market behaviors
  } else if (Math.abs(priceCorrelation) < 0.5) {
    score -= 10; // Moderate correlation
  }
  
  return Math.max(0, score);
};


// Calculate vault funding requirements for surviving token
export const calculateVaultFundingNeeds = (requiredMint, bufferMultiplier = 1.2) => {
  const fundingNeeded = requiredMint * bufferMultiplier;
  
  return {
    fundingNeeded,
    requiredMint,
    bufferAmount: requiredMint * (bufferMultiplier - 1),
    bufferPercentage: (bufferMultiplier - 1) * 100
  };
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
  // Validate inputs
  if (!priceA || !priceB || priceA <= 0 || priceB <= 0) {
    console.warn('Invalid prices for scaleForEulerSwap:', { priceA, priceB });
    return { priceX: 1e18, priceY: 1e18 }; // Safe defaults (1:1 ratio)
  }
  
  // Account for token decimals and scale to EulerSwap bounds
  const decimalAdjustment = Math.pow(10, decimalsB - decimalsA);
  const rawRatio = (priceB / priceA) * decimalAdjustment;
  
  // Ensure within EulerSwap bounds (1 <= px, py <= 1e25)
  const priceX = 1e18; // Normalized base price
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

// Calculate vault capacity risk for surviving token in one-sided JIT model
export const calculateVaultCapacityRisk = (requiredMint, expectedDailyVolume) => {
  // In one-sided JIT, the surviving token vault needs to have sufficient capacity
  // Risk is based on the total required mint vs expected daily swap volume
  
  const volumeRatio = expectedDailyVolume / requiredMint;
  
  // Determine execution timeline based on volume ratio
  let executionDays;
  let capacityRisk;
  
  if (volumeRatio > 0.1) {
    executionDays = Math.ceil(1 / volumeRatio); // Can complete quickly
    capacityRisk = 'low';
  } else if (volumeRatio > 0.02) {
    executionDays = Math.ceil(1 / volumeRatio); // Moderate timeline
    capacityRisk = 'medium';
  } else {
    executionDays = Math.ceil(1 / volumeRatio); // Extended timeline
    capacityRisk = 'high';
  }
  
  return {
    requiredMint,
    expectedDailyVolume,
    volumeRatio,
    capacityRisk,
    executionDays,
    recommendedDailySwaps: Math.min(expectedDailyVolume, requiredMint * 0.05) // Max 5% per day
  };
};

