/* global BigInt */
// API service for DAO merger simulator

// Import token analytics utilities
import { 
  calculateVolatility, 
  calculateCorrelation, 
  categorizeVolatility,
  calculatePriceStats,
  scaleForEulerSwap,
  calculateSafeReserves,
  calculateVaultCapacityRisk,
  getAsymmetricConcentrations,
  calculateMergerFeasibility,
  calculateVaultFundingNeeds
} from '../utils/tokenAnalytics.js';
import { decodeAmountCap } from '../utils/eulerUtils';

// API functions are exported inline below

export const fetchPrices = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/prices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Prices response from local backend:', result);
    
    if (result.success) {
      return result.data; // Array of DAO token prices with history
    } else {
      console.error('Failed to fetch prices:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching prices from local backend:', error);
    return [];
  }
};

export const fetchTokenCirculation = async (token) => {
  try {
    const response = await fetch(`http://localhost:3001/api/token-circulation/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`Token circulation response for ${token}:`, result);
    
    if (result.success) {
      return result.data; // Token circulation data
    } else {
      console.error(`Failed to fetch circulation for ${token}:`, result.error);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching circulation for ${token}:`, error);
    return null;
  }
};

export const analyzeMergerContext = async (mergerContext) => {
  if (!mergerContext) {
    console.error('Merger context is required for analysis');
    return null;
  }
  
  try {
    const response = await fetch('http://localhost:3001/api/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mergerContext
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error in merger analysis:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Merger analysis completed successfully:', result);
    return result.data;
  } catch (error) {
    console.error('Error analyzing merger context:', error);
    throw error;
  }
}

// Calculate comprehensive merger configuration for two DAOs
export const calculateMergerConfiguration = async (daoA, daoB, existingData = null, executionStrategy = {}) => {
  try {
    // Use existing data if provided, otherwise fetch
    let pricesData, circulationDataA, circulationDataB;
    
    if (existingData && existingData.prices && existingData.circulationA && existingData.circulationB) {
      pricesData = existingData.prices;
      circulationDataA = existingData.circulationA;
      circulationDataB = existingData.circulationB;
    } else {
      // Fetch price and circulation data
      [pricesData, circulationDataA, circulationDataB] = await Promise.all([
        fetchPrices(),
        fetchTokenCirculation(daoA.symbol),
        fetchTokenCirculation(daoB.symbol)
      ]);
    }
    
    // Find price data for both DAOs
    const priceA = pricesData.find(p => p.symbol === daoA.symbol);
    const priceB = pricesData.find(p => p.symbol === daoB.symbol);
    
    if (!priceA || !priceB) {
      throw new Error('Price data not found for one or both DAOs');
    }
    
    // Ensure we have circulation data
    if (!circulationDataA || !circulationDataB) {
      throw new Error('Circulation data not found for one or both DAOs');
    }
    
    // Validate price data has required fields
    if (!priceA.currentPrice || !priceB.currentPrice) {
      throw new Error('Current price data missing for one or both DAOs');
    }
    
    if (!priceA.priceHistory || !priceB.priceHistory || 
        priceA.priceHistory.length === 0 || priceB.priceHistory.length === 0) {
      throw new Error('Price history missing for volatility calculation');
    }
    
    // Calculate key merger metrics with validation
    const circulatingSupplyA = circulationDataA.circulatingSupply || 0;
    const circulatingSupplyB = circulationDataB.circulatingSupply || 0;
    const currentPriceA = priceA.currentPrice;
    const currentPriceB = priceB.currentPrice;
    
    // Validate we have positive values
    if (circulatingSupplyA <= 0 || circulatingSupplyB <= 0) {
      throw new Error('Invalid circulating supply values');
    }
    
    if (currentPriceA <= 0 || currentPriceB <= 0) {
      throw new Error('Invalid price values');
    }
    
    // Calculate required mint and dilution
    const requiredMint = circulatingSupplyA && currentPriceB ? 
      (circulatingSupplyA * currentPriceA) / currentPriceB : 0;
    const dilutionPercentage = circulatingSupplyB ? 
      (requiredMint / (circulatingSupplyB + requiredMint)) * 100 : 0;
    const marketCapRatio = circulatingSupplyA && circulatingSupplyB && currentPriceA && currentPriceB ? 
      (circulatingSupplyA * currentPriceA) / (circulatingSupplyB * currentPriceB) : 0;
    
    // 1. Volatility Analysis - with validation for price history
    const priceHistoryA = priceA.priceHistory.map(p => ({ value: p.price || 0 })).filter(p => p.value > 0);
    const priceHistoryB = priceB.priceHistory.map(p => ({ value: p.price || 0 })).filter(p => p.value > 0);
    
    if (priceHistoryA.length < 2 || priceHistoryB.length < 2) {
      throw new Error('Insufficient price history for volatility calculation');
    }
    
    const volA = calculateVolatility(priceHistoryA);
    const volB = calculateVolatility(priceHistoryB);
    const correlation = calculateCorrelation(priceHistoryA, priceHistoryB);
    
    const volCategoryA = categorizeVolatility(volA);
    const volCategoryB = categorizeVolatility(volB);
    
    // 2. Merger Type Determination
    const mergerType = determineMergerType(marketCapRatio, correlation);
    
    // 3. Calculate asymmetric concentration parameters
    const { concentrationX, concentrationY } = getAsymmetricConcentrations(
      marketCapRatio, 
      dilutionPercentage, 
      volA, 
      volB
    );
    
    // 4. Interest Rate Model Configuration
    const interestRateModels = {
      phasedOutVault: {
        type: 'Zero Rate Model',
        address: '0x0000000000000000000000000000000000000000', // Zero address for 0% rate
        rationale: 'Phased-out tokens are only deposited, never borrowed'
      },
      survivingVault: {
        type: 'Dynamic Utilization Model',
        recommendedModel: 'LinearKink IRM',
        parameters: {
          baseRate: 0, // 0% at 0% utilization
          slope1: 0.05e27, // 5% APY below kink
          slope2: 1.0e27, // 100% APY above kink  
          kink: 0.8e18 // 80% utilization kink point
        },
        rationale: 'Incentivizes liquidity provision while managing JIT borrowing costs'
      }
    };
    
    // 5. Vault Deployment Configuration
    const fundingRequired = calculateVaultFundingNeeds(requiredMint, 1.2); // Use utility function for 20% buffer
    const expectedUtilization = requiredMint / fundingRequired; // ~83%
    
    const vaultDeployment = {
      phasedOutVault: {
        token: daoA.symbol,
        interestRateModel: interestRateModels.phasedOutVault,
        interestFee: 0, // No fees on 0% interest
        supplyCap: decodeAmountCap(0xFFFF), // Decode to human-readable value
        borrowCap: decodeAmountCap(0), // No borrowing allowed
        fundingRequired: 0 // No pre-funding needed
      },
      survivingVault: {
        token: daoB.symbol,
        interestRateModel: interestRateModels.survivingVault,
        interestFee: 1000, // 10% of interest as protocol fee
        supplyCap: decodeAmountCap(0xFFFF), // Decode to human-readable value
        borrowCap: decodeAmountCap(0xFFFF), // Decode to human-readable value - allows JIT borrowing
        fundingRequired,
        expectedUtilization,
        expectedBorrowRate: `${(expectedUtilization * 0.05 * 100).toFixed(1)}% APY` // Based on IRM curve
      },
      fundingStrategy: {
        totalRequired: fundingRequired,
        source: `${daoB.symbol} DAO Treasury`,
        bufferRatio: 1.2,
        rationale: '20% buffer keeps utilization below 80% kink for optimal rates'
      }
    };
    
    // 6. EulerSwap AMM Parameters for one-sided pool
    const { priceX, priceY } = scaleForEulerSwap(
      currentPriceA, 
      currentPriceB,
      priceA.decimals || 18,
      priceB.decimals || 18
    );
    
    // One-sided pool configuration
    // Use calculateSafeReserves to ensure reserves are within safe bounds
    const totalSwapValue = requiredMint * currentPriceB;
    const safeReserve1 = calculateSafeReserves(totalSwapValue, 1.5); // 1.5x multiplier for liquidity
    
    const ammParameters = {
      vault0: `${daoA.symbol} Vault`, // Phased-out token vault
      vault1: `${daoB.symbol} Vault`, // Surviving token vault
      equilibriumReserve0: 1, // Minimal amount to avoid division by zero
      equilibriumReserve1: safeReserve1, // Use safe reserves
      currReserve0: 1, // Start with minimal phased-out tokens
      currReserve1: safeReserve1, // Start with safe liquidity
      priceX: Math.min(priceX, 1e25), // Ensure within EulerSwap bounds
      priceY: Math.min(priceY, 1e25),
      concentrationX: Math.min(concentrationX, 1e18), // Dynamic based on volatility
      concentrationY: Math.min(concentrationY, 1e18),
      fee: 0.003e18, // 0.3% fee in 1e18 format
      borrowingEnabled: true,
      description: 'One-sided pool where phased-out tokens can only be swapped for surviving tokens'
    };
    
    // 7. Execution Timeline
    const totalValueSwapped = requiredMint * currentPriceB;
    const expectedDailyVolume = totalValueSwapped * 0.1; // Assume 10% can be swapped daily
    
    // Calculate vault capacity risk
    const vaultCapacityRisk = calculateVaultCapacityRisk(requiredMint, expectedDailyVolume);
    
    const timeline = {
      estimatedDays: Math.ceil(10), // Conservative 10 days
      phases: [
        { phase: 1, description: 'Deploy vaults and fund surviving token vault', duration: '1 day' },
        { phase: 2, description: 'Deploy EulerSwap pool with one-sided parameters', duration: '1 hour' },
        { phase: 3, description: 'Execute merger swaps', duration: '7-10 days' }
      ],
      total: 10,
      unit: 'days'
    };
    
    // 8. Risk Assessment for one-sided JIT model
    // Calculate exact price impact using EulerSwap curve mathematics
    
    // Parse execution strategy parameters
    const executionParams = {
      numberOfBatches: executionStrategy.numberOfBatches || 10,
      batchDistribution: executionStrategy.batchDistribution || null
    };
    
    const priceImpactResult = calculateMergerPriceImpact(
      circulatingSupplyA,  // totalSwapAmount - amount of phased-out token to swap
      circulatingSupplyA,  // circulatingSupply
      ammParameters,       // ammParameters
      executionParams      // execution parameters
    );
    
    const risks = assessOneSidedMergerRisks({
      dilutionPercentage,
      marketCapRatio,
      volatilities: { A: volA, B: volB },
      correlation,
      concentrations: { X: concentrationX, Y: concentrationY },
      fundingRequired,
      priceImpact: priceImpactResult.totalPriceImpact,
      vaultCapacityRisk
    });
    
    // 9. Calculate overall feasibility score
    const feasibilityScore = calculateMergerFeasibility(
      marketCapRatio,
      dilutionPercentage,
      correlation
    ) / 100; // Convert to 0-1 scale
    
    return {
      // Expose key metrics at top level for easier access
      dilutionPercentage,
      requiredMint,
      totalPriceImpact: priceImpactResult.totalPriceImpact,
      
      feasibility: {
        score: feasibilityScore,
        viable: feasibilityScore > 0.6,
        recommendation: getRecommendation(feasibilityScore, risks)
      },
      mergerType,
      volatilityAnalysis: {
        daoA: { volatility: volA, category: volCategoryA },
        daoB: { volatility: volB, category: volCategoryB },
        correlation
      },
      swapConfiguration: {
        ammParameters,
        phasedOutToken: daoA.symbol,
        survivingToken: daoB.symbol,
        totalSwapAmount: requiredMint,
        sizes: {
          totalValueUSD: totalValueSwapped,
          tokenAAmount: 0, // One-sided model: no A tokens needed
          tokenBAmount: requiredMint,
          percentageA: 0, // Not applicable in one-sided model
          percentageB: (dilutionPercentage || 0).toFixed(2) // Dilution percentage
        }
      },
      vaultConfiguration: vaultDeployment,
      timeline,
      risks,
      mergerMetrics: {
        requiredMint,
        dilutionPercentage,
        marketCapRatio,
        totalValueUSD: totalValueSwapped,
        priceImpact: {
          total: priceImpactResult.totalPriceImpact,
          average: priceImpactResult.totalSlippage / 10, // Average across batches
          breakdown: priceImpactResult.impacts
        }
      },
      deploymentSteps: [
        {
          step: 1,
          action: 'Deploy Interest Rate Models',
          details: {
            phasedOutIRM: 'Use zero address (0x0) for 0% rate',
            survivingIRM: 'Deploy LinearKink IRM with kink at 80% utilization'
          }
        },
        {
          step: 2,
          action: `Deploy ${daoA.symbol} vault (phased-out)`,
          config: vaultDeployment.phasedOutVault
        },
        {
          step: 3,
          action: `Deploy ${daoB.symbol} vault (surviving)`,
          config: vaultDeployment.survivingVault
        },
        {
          step: 4,
          action: `Fund ${daoB.symbol} vault`,
          amount: fundingRequired,
          source: vaultDeployment.fundingStrategy.source
        },
        {
          step: 5,
          action: 'Deploy EulerSwap pool',
          poolParams: ammParameters
        }
      ]
    };
    
  } catch (error) {
    console.error('Error calculating merger configuration:', error);
    throw error;
  }
};

// Helper functions for merger configuration

const determineMergerType = (marketCapRatio, correlation) => {
  if (marketCapRatio > 3 || marketCapRatio < 0.33) {
    return 'acquisition'; // One DAO significantly larger
  } else if (Math.abs(correlation) > 0.7) {
    return 'strategic_alignment'; // High correlation suggests similar market exposure
  } else if (marketCapRatio > 0.5 && marketCapRatio < 2) {
    return 'equal_merger'; // Similar market caps
  } else {
    return 'diversification'; // Different profiles for risk diversification
  }
};



const assessOneSidedMergerRisks = (factors) => {
  const risks = [];
  
  // Dilution risk
  if (factors.dilutionPercentage > 50) {
    risks.push({
      type: 'dilution',
      severity: 'high',
      description: `Extreme dilution of ${factors.dilutionPercentage.toFixed(1)}% may face governance resistance`,
      mitigation: 'Consider phased approach or reduced merger scope'
    });
  } else if (factors.dilutionPercentage > 30) {
    risks.push({
      type: 'dilution',
      severity: 'medium',
      description: `Significant dilution of ${factors.dilutionPercentage.toFixed(1)}%`,
      mitigation: 'Clear communication of merger benefits required'
    });
  }
  
  // Market cap compatibility
  if (factors.marketCapRatio > 10 || factors.marketCapRatio < 0.1) {
    risks.push({
      type: 'size_mismatch',
      severity: 'high',
      description: 'Extreme size difference between DAOs',
      mitigation: 'Consider alternative merger structures'
    });
  }
  
  // Price impact risk based on concentration
  if (factors.priceImpact > 10) {
    risks.push({
      type: 'price_impact',
      severity: 'high',
      description: `Price impact of ${factors.priceImpact.toFixed(1)}% is very high`,
      mitigation: 'Increase number of batches or reduce concentration parameters'
    });
  } else if (factors.priceImpact > 5) {
    risks.push({
      type: 'price_impact',
      severity: 'medium',
      description: `Price impact of ${factors.priceImpact.toFixed(1)}% may affect execution`,
      mitigation: 'Execute swaps gradually over multiple days'
    });
  }
  
  // Funding risk
  risks.push({
    type: 'funding',
    severity: 'medium',
    description: `DAO must fund ${(factors.fundingRequired / 1e6).toFixed(1)}M tokens upfront`,
    mitigation: 'Ensure DAO has sufficient liquid tokens for minting'
  });
  
  // Volatility risk
  if (factors.volatilities.A > 0.5 || factors.volatilities.B > 0.5) {
    risks.push({
      type: 'volatility',
      severity: 'medium',
      description: 'High token volatility may affect merger execution',
      mitigation: 'Use lower concentration parameters for flexibility'
    });
  }
  
  return risks;
};




const getRecommendation = (score, risks) => {
  const highRisks = risks.filter(r => r.severity === 'high').length;
  
  if (score > 0.8 && highRisks === 0) {
    return 'Highly recommended - optimal conditions for merger';
  } else if (score > 0.6 && highRisks <= 1) {
    return 'Recommended with risk mitigation measures';
  } else if (score > 0.4) {
    return 'Proceed with caution - address identified risks first';
  } else {
    return 'Not recommended - significant barriers to successful merger';
  }
};


// Helper function to estimate slippage
const estimateSlippage = (concentrationX, concentrationY, swapSizes) => {
  // Lower concentration = higher slippage
  const avgConcentration = (concentrationX + concentrationY) / 2;
  const concentrationFactor = avgConcentration / 1e18; // Normalize from 1e18 format
  
  // Larger swaps = higher slippage
  const swapSizeFactor = Math.min(swapSizes.totalValueUSD / 10000000, 1); // Normalize to $10M
  
  const expectedSlippage = (1 - concentrationFactor) * swapSizeFactor * 100;
  
  return {
    severity: expectedSlippage > 2 ? 'high' : expectedSlippage > 1 ? 'medium' : 'low',
    expectedSlippage: expectedSlippage.toFixed(2),
    maxAcceptableSlippage: 3 // 3% max
  };
};

// Helper function to verify curve constraints
const verifyCurveConstraints = (ammParams) => {
  // Basic validation based on EulerSwap requirements
  const priceValid = ammParams.priceX >= 1 && ammParams.priceX <= 1e25 &&
                    ammParams.priceY >= 1 && ammParams.priceY <= 1e25;
  const concentrationValid = ammParams.concentrationX <= 1e18 && ammParams.concentrationY <= 1e18;
  const reservesValid = ammParams.equilibriumReserve0 > 0 && ammParams.equilibriumReserve1 > 0;
  const feeValid = ammParams.fee <= 1e18;
  
  return priceValid && concentrationValid && reservesValid && feeValid;
};

// Helper function for safe BigInt conversion
const safeBigInt = (value, defaultValue = 0) => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    console.warn('Invalid value for BigInt conversion:', value);
    return BigInt(defaultValue);
  }
  return BigInt(Math.floor(Math.max(0, value)));
};

// Comprehensive parameter validation for EulerSwap
export // Robust price impact calculations based on EulerSwap's actual curve mathematics

// Direct implementation of EulerSwap's f() function from CurveLib.sol
const calculateCurveF = (x, px, py, x0, y0, c) => {
  // Using BigInt for precision to match Solidity's behavior
  const x_bi = safeBigInt(x);
  const px_bi = safeBigInt(px, 1);
  const py_bi = safeBigInt(py, 1);
  const x0_bi = safeBigInt(x0);
  const y0_bi = safeBigInt(y0);
  const c_bi = safeBigInt(c);
  const ONE_E18 = BigInt(1e18);
  
  // v = Math.mulDiv(px * (x0 - x), c * x + (1e18 - c) * x0, x * 1e18, Math.Rounding.Ceil)
  const numerator = px_bi * (x0_bi - x_bi);
  const denominator1 = c_bi * x_bi + (ONE_E18 - c_bi) * x0_bi;
  const denominator2 = x_bi * ONE_E18;
  
  // Ceiling division for v
  const v = (numerator * denominator1 + denominator2 - 1n) / denominator2;
  
  // return y0 + (v + (py - 1)) / py
  const result = y0_bi + (v + py_bi - 1n) / py_bi;
  
  return Number(result);
};

// Implementation of EulerSwap's fInverse() function (simplified quadratic solver)
const calculateCurveFInverse = (y, px, py, x0, y0, c) => {
  // Validate inputs
  if ([y, px, py, x0, y0, c].some(v => v === null || v === undefined || isNaN(v))) {
    console.error('Invalid inputs to calculateCurveFInverse:', { y, px, py, x0, y0, c });
    return 0;
  }
  
  // Convert to BigInt for precision
  const y_bi = safeBigInt(y);
  const px_bi = safeBigInt(px, 1);
  const py_bi = safeBigInt(py, 1);
  const x0_bi = safeBigInt(x0);
  const y0_bi = safeBigInt(y0);
  const c_bi = safeBigInt(c);
  const ONE_E18 = BigInt(1e18);
  
  // Quadratic equation components
  const term1 = (py_bi * ONE_E18 * (y_bi - y0_bi)) / px_bi;
  const term2 = (2n * c_bi - ONE_E18) * x0_bi;
  const B = (term1 - term2) / ONE_E18;
  
  const C = ((ONE_E18 - c_bi) * x0_bi * x0_bi) / ONE_E18;
  const fourAC = (4n * c_bi * C) / ONE_E18;
  
  const absB = B >= 0n ? B : -B;
  
  // Calculate discriminant and solve
  // Using JavaScript's Math.sqrt for simplicity (production code should use BigInt sqrt)
  const discriminant = Number(absB * absB + fourAC);
  const sqrt_disc = BigInt(Math.floor(Math.sqrt(discriminant)));
  
  let x;
  if (B <= 0n) {
    // Standard quadratic formula
    x = ((absB + sqrt_disc) * ONE_E18) / (2n * c_bi) + 1n;
  } else {
    // Citardauq formula for numerical stability
    x = (2n * C) / (absB + sqrt_disc) + 1n;
  }
  
  // Return min(x, x0)
  return Number(x < x0_bi ? x : x0_bi);
};

// Calculate exact price impact using EulerSwap curve mathematics
export const calculateExactPriceImpact = (params) => {
  const {
    swapAmount,
    currentReserve0,
    currentReserve1,
    equilibriumReserve0,
    equilibriumReserve1,
    priceX,
    priceY,
    concentrationX,
    concentrationY,
    fee = 0.003e18, // 0.3% default fee
    isToken0Input = true
  } = params;
  
  // Apply fee to input amount (as done in QuoteLib.computeQuote)
  const effectiveAmount = swapAmount * (1 - fee / 1e18);
  
  // Get initial price - handle case when reserve0 is very small
  const initialPrice = currentReserve0 > 0 ? currentReserve1 / currentReserve0 : priceY / priceX;
  
  let newReserve0, newReserve1, outputAmount;
  
  if (isToken0Input) {
    // Swap token0 in, token1 out
    newReserve0 = currentReserve0 + effectiveAmount;
    
    if (newReserve0 <= equilibriumReserve0) {
      // Use f() function
      newReserve1 = calculateCurveF(
        newReserve0, priceX, priceY, 
        equilibriumReserve0, equilibriumReserve1, concentrationX
      );
    } else {
      // Use fInverse() function
      newReserve1 = calculateCurveFInverse(
        newReserve0, priceY, priceX, 
        equilibriumReserve1, equilibriumReserve0, concentrationY
      );
    }
    
    outputAmount = currentReserve1 - newReserve1;
  } else {
    // Swap token1 in, token0 out
    newReserve1 = currentReserve1 + effectiveAmount;
    
    if (newReserve1 <= equilibriumReserve1) {
      // Use f() function (g in the original)
      newReserve0 = calculateCurveF(
        newReserve1, priceY, priceX, 
        equilibriumReserve1, equilibriumReserve0, concentrationY
      );
    } else {
      // Use fInverse() function
      newReserve0 = calculateCurveFInverse(
        newReserve1, priceX, priceY, 
        equilibriumReserve0, equilibriumReserve1, concentrationX
      );
    }
    
    outputAmount = currentReserve0 - newReserve0;
  }
  
  // Ensure output is positive
  outputAmount = Math.max(0, outputAmount);
  
  // Calculate final price and impact - handle edge cases
  const finalPrice = newReserve0 > 0 ? newReserve1 / newReserve0 : priceY / priceX;
  const priceImpact = initialPrice > 0 ? Math.abs((finalPrice - initialPrice) / initialPrice) : 0;
  
  // Calculate effective price (including fees)
  const effectivePrice = outputAmount / swapAmount;
  
  return {
    outputAmount,
    priceImpact,
    priceImpactPercentage: priceImpact * 100,
    newReserve0,
    newReserve1,
    effectivePrice,
    initialPrice,
    finalPrice,
    slippage: (1 - effectivePrice / initialPrice) * 100
  };
};

// Calculate price impact for one-sided merger swaps
export const calculateMergerPriceImpact = (
  totalSwapAmount,
  circulatingSupply,
  ammParameters,
  executionParams = {}
) => {
  // Extract execution parameters with defaults
  const {
    numberOfBatches = 10,
    batchDistribution = null // null means equal distribution
  } = executionParams;
  
  // Use the curve-based calculation for all pools
  let currentReserve0 = ammParameters.currReserve0 || 1; // Default to 1 if not provided
  let currentReserve1 = ammParameters.currReserve1;
  let totalOutput = 0;
  let totalInputSoFar = 0;
  
  const impacts = [];
  
  // Calculate batch sizes based on distribution
  const batchSizes = [];
  if (batchDistribution && Array.isArray(batchDistribution)) {
    // Use provided distribution (e.g., [0.3, 0.25, 0.2, 0.15, 0.1] for rapid)
    for (let i = 0; i < numberOfBatches; i++) {
      batchSizes.push(totalSwapAmount * (batchDistribution[i] || 1/numberOfBatches));
    }
  } else {
    // Equal distribution
    const batchSize = totalSwapAmount / numberOfBatches;
    for (let i = 0; i < numberOfBatches; i++) {
      batchSizes.push(batchSize);
    }
  }
  
  for (let i = 0; i < numberOfBatches; i++) {
    const result = calculateExactPriceImpact({
      swapAmount: batchSizes[i],
      currentReserve0,
      currentReserve1,
      equilibriumReserve0: ammParameters.equilibriumReserve0,
      equilibriumReserve1: ammParameters.equilibriumReserve1,
      priceX: ammParameters.priceX,
      priceY: ammParameters.priceY,
      concentrationX: ammParameters.concentrationX,
      concentrationY: ammParameters.concentrationY,
      fee: ammParameters.fee,
      isToken0Input: true // Phased-out tokens coming in
    });
    
    // Update totals
    totalOutput += result.outputAmount;
    totalInputSoFar += batchSizes[i];
    
    // Calculate cumulative slippage from expected rate
    // Note: priceX and priceY are in 1e18 format, so the rate doesn't need adjustment
    // But we need to ensure amounts are in the same units
    const expectedRate = ammParameters.priceY / ammParameters.priceX;
    const expectedOutputSoFar = totalInputSoFar * expectedRate;
    const actualOutputSoFar = totalOutput;
    const cumulativeSlippage = actualOutputSoFar > 0 
      ? ((expectedOutputSoFar - actualOutputSoFar) / expectedOutputSoFar) * 100
      : 0;
    
    impacts.push({
      batch: i + 1,
      swapAmount: batchSizes[i],
      outputAmount: result.outputAmount,
      priceImpact: result.priceImpactPercentage,
      cumulativeImpact: cumulativeSlippage,
      // Add cumulative totals for accurate price calculation
      cumulativeInput: totalInputSoFar,
      cumulativeOutput: totalOutput
    });
    
    // Update reserves for next iteration
    currentReserve0 = result.newReserve0;
    currentReserve1 = result.newReserve1;
  }
  
  // Calculate total price impact as average slippage from expected rate
  // priceX and priceY are both in 1e18 format, so direct ratio gives the rate
  const expectedRate = ammParameters.priceY / ammParameters.priceX;
  const expectedTotalOutput = totalSwapAmount * expectedRate;
  const actualTotalOutput = totalOutput;
  const totalPriceImpact = ((expectedTotalOutput - actualTotalOutput) / expectedTotalOutput) * 100;
  
  // Log only if there's an issue
  if (Math.abs(totalPriceImpact) > 50 || totalOutput === 0) {
    console.warn('Price impact issue detected:', {
      totalSwapAmount,
      expectedRate,
      expectedTotalOutput,
      actualTotalOutput,
      totalPriceImpact,
      priceX: ammParameters.priceX,
      priceY: ammParameters.priceY,
      currReserve1: ammParameters.currReserve1,
      numberOfBatches: executionParams.numberOfBatches,
      firstBatchOutput: impacts[0]?.outputAmount || 0
    });
  }
  
  // Calculate average effective price
  const averagePrice = totalOutput / totalSwapAmount;
  const expectedPrice = ammParameters.priceY / ammParameters.priceX;
  const totalSlippage = (1 - averagePrice / expectedPrice) * 100;
  
  return {
    totalPriceImpact,
    totalSlippage,
    averagePrice,
    impacts,
    breakdown: impacts, // Add breakdown field for UI
    recommendation: totalPriceImpact > 10 ? 
      'High price impact - consider increasing concentration or splitting over more days' :
      totalPriceImpact > 5 ?
      'Moderate price impact - current parameters acceptable' :
      'Low price impact - efficient execution expected'
  };
};

const validateEulerSwapParams = (params) => {
  const errors = [];
  const MAX_UINT112 = 2**112 - 1;
  
  // Price bounds checking
  if (params.priceX > 1e25) errors.push('PriceX exceeds maximum of 1e25');
  if (params.priceY > 1e25) errors.push('PriceY exceeds maximum of 1e25');
  if (params.priceX < 1) errors.push('PriceX below minimum of 1');
  if (params.priceY < 1) errors.push('PriceY below minimum of 1');
  
  // Concentration bounds
  if (params.concentrationX > 1e18) errors.push('ConcentrationX exceeds maximum of 1e18');
  if (params.concentrationY > 1e18) errors.push('ConcentrationY exceeds maximum of 1e18');
  if (params.concentrationX < 0) errors.push('ConcentrationX cannot be negative');
  if (params.concentrationY < 0) errors.push('ConcentrationY cannot be negative');
  
  // Reserve bounds (uint112)
  if (params.equilibriumReserve0 > MAX_UINT112) errors.push(`Reserve0 exceeds uint112 max: ${MAX_UINT112}`);
  if (params.equilibriumReserve1 > MAX_UINT112) errors.push(`Reserve1 exceeds uint112 max: ${MAX_UINT112}`);
  if (params.equilibriumReserve0 <= 0) errors.push('Reserve0 must be positive');
  if (params.equilibriumReserve1 <= 0) errors.push('Reserve1 must be positive');
  
  // Fee validation
  if (params.fee > 1e18) errors.push('Fee exceeds maximum of 1e18');
  if (params.fee < 0) errors.push('Fee cannot be negative');
  
  // Edge case warnings
  if (params.concentrationX === 0 || params.concentrationX === 1e18) {
    errors.push('Warning: Extreme concentration values may cause curve calculation issues');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: errors.filter(e => e.includes('Warning'))
  };
};