// API service for DAO merger simulator

// Import token analytics utilities
import { 
  calculateVolatility, 
  calculateCorrelation, 
  categorizeVolatility,
  getUSDCCollateralLTV,
  calculatePriceStats,
  scaleForEulerSwap,
  calculateSafeReserves,
  calculateVaultCapacityRisk,
  calculateLiquidationRisk,
  getEulerSwapConcentration
} from '../utils/tokenAnalytics.js';

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

export const fetchTreasuries = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/treasuries', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Treasuries response from local backend:', result);
    
    if (result.success) {
      return result.data; // Array of DAO treasury data
    } else {
      console.error('Failed to fetch treasuries:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching treasuries from local backend:', error);
    return [];
  }
};

export const fetchVaults = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/euler-vaults', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Euler vaults response from local backend:', result);
    
    if (result.success) {
      return result.data; // Euler Prime USDC vault data
    } else {
      console.error('Failed to fetch vaults:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching vaults from local backend:', error);
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
export const calculateMergerConfiguration = async (daoA, daoB, existingData = null) => {
  try {
    // Use existing data if provided, otherwise fetch
    let pricesData, treasuriesData, vaultData;
    
    if (existingData && existingData.prices && existingData.treasuries && existingData.vaults) {
      pricesData = existingData.prices;
      treasuriesData = existingData.treasuries;
      vaultData = existingData.vaults;
    } else {
      // Only fetch if data not provided
      [pricesData, treasuriesData, vaultData] = await Promise.all([
        fetchPrices(),
        fetchTreasuries(),
        fetchVaults()
      ]);
    }
    
    // Find price data for both DAOs
    const priceA = pricesData.find(p => p.symbol === daoA.symbol);
    const priceB = pricesData.find(p => p.symbol === daoB.symbol);
    
    if (!priceA || !priceB) {
      throw new Error('Price data not found for one or both DAOs');
    }
    
    // Find treasury data and add aggregated fields
    const treasuryAData = treasuriesData.find(t => t.symbol === daoA.symbol);
    const treasuryBData = treasuriesData.find(t => t.symbol === daoB.symbol);
    
    // Aggregate treasury data for each DAO across all chains
    const treasuryA = treasuryAData ? {
      ...treasuryAData,
      totalValueUSD: treasuryAData.treasuries.reduce((sum, t) => sum + (t.tvl || 0), 0),
      stablecoinBalance: treasuryAData.treasuries.reduce((sum, t) => sum + (t.stablecoins || 0), 0),
      nativeTokenBalance: treasuryAData.treasuries.reduce((sum, t) => sum + (t.ownTokens || 0), 0),
      nativeTokenPrice: priceA?.currentPrice || 0
    } : null;
    
    const treasuryB = treasuryBData ? {
      ...treasuryBData,
      totalValueUSD: treasuryBData.treasuries.reduce((sum, t) => sum + (t.tvl || 0), 0),
      stablecoinBalance: treasuryBData.treasuries.reduce((sum, t) => sum + (t.stablecoins || 0), 0),
      nativeTokenBalance: treasuryBData.treasuries.reduce((sum, t) => sum + (t.ownTokens || 0), 0),
      nativeTokenPrice: priceB?.currentPrice || 0
    } : null;
    
    // 1. Volatility Analysis
    const volA = calculateVolatility(priceA.priceHistory.map(p => ({ value: p.price })));
    const volB = calculateVolatility(priceB.priceHistory.map(p => ({ value: p.price })));
    const correlation = calculateCorrelation(
      priceA.priceHistory.map(p => ({ value: p.price })),
      priceB.priceHistory.map(p => ({ value: p.price }))
    );
    
    const volCategoryA = categorizeVolatility(volA);
    const volCategoryB = categorizeVolatility(volB);
    
    // 2. Merger Type Determination
    const mergerType = determineMergerType(treasuryA, treasuryB, volA, volB, correlation);
    
    // 3. Swap Size Calculation
    const swapSizes = calculateSwapSizes(treasuryA, treasuryB, mergerType, volCategoryA, volCategoryB);
    
    // 4. Collateral Requirements (USDC-based)
    const usdcLTV = getUSDCCollateralLTV();
    
    const collateralRequirements = {
      daoA: {
        usdcRequired: swapSizes.tokenBRequired / usdcLTV.recommended,
        availableUsdc: treasuryA?.stablecoinBalance || 0,
        borrowingCapacity: (treasuryA?.stablecoinBalance || 0) * usdcLTV.recommended
      },
      daoB: {
        usdcRequired: swapSizes.tokenARequired / usdcLTV.recommended,
        availableUsdc: treasuryB?.stablecoinBalance || 0,
        borrowingCapacity: (treasuryB?.stablecoinBalance || 0) * usdcLTV.recommended
      }
    };
    
    // 5. Vault Configuration Parameters with EulerSwap constraints
    const vaultCapacity = Math.min(
      parseFloat(vaultData?.cash || vaultData?.totalAssets - vaultData?.totalBorrows || 0),
      parseFloat(vaultData?.borrowCapRemaining || Infinity),
      parseFloat(vaultData?.totalAssets || 0) * 0.1 // Conservative daily limit
    );
    
    const vaultConfig = {
      usdc: {
        ...vaultData,
        requiredLiquidity: swapSizes.totalValueUSD,
        utilizationImpact: calculateUtilizationImpact(vaultData, swapSizes.totalValueUSD),
        dailyCapacity: vaultCapacity,
        capacityRisk: calculateVaultCapacityRisk(vaultData, swapSizes.totalValueUSD)
      },
      crossCollateralization: {
        enabled: true,
        ltv: usdcLTV.recommended,
        liquidationLTV: usdcLTV.liquidationLTV,
        usdcCollateralLTV: 0.9e4, // 90% LTV for USDC backing (in basis points)
        initialSeedRatio: 0.15, // 15% initial deposits
        crossDepositMultiplier: 2.0, // Account for cross-vault deposits
        maxLeverageRatio: parseFloat(vaultData?.utilization || 0) < 0.8 ? 10 : 5
      }
    };
    
    // 6. EulerSwap AMM Parameters with proper constraints
    const { priceX, priceY } = scaleForEulerSwap(
      priceA.currentPrice, 
      priceB.currentPrice,
      priceA.decimals || 18,
      priceB.decimals || 18
    );
    
    // Use enhanced concentration calculation
    const concentrationX = getEulerSwapConcentration(correlation, volA, volB);
    const concentrationY = concentrationX; // Symmetric for initial deployment
    
    // Calculate reserves based on vault capacity and cross-deposits
    const equilibriumReserve0 = calculateSafeReserves(Math.min(
      swapSizes.tokenAAmount * 3, // Original multiplier
      vaultCapacity * 0.5, // Don't exceed half of available liquidity
      (treasuryA?.stablecoinBalance || 0) * usdcLTV.recommended * priceA.currentPrice // USDC collateral backing
    ));
    
    const equilibriumReserve1 = calculateSafeReserves(Math.min(
      swapSizes.tokenBAmount * 3,
      vaultCapacity * 0.5,
      (treasuryB?.stablecoinBalance || 0) * usdcLTV.recommended * priceB.currentPrice
    ));
    
    const ammParameters = {
      priceX: Math.min(priceX, 1e25), // Ensure within EulerSwap bounds
      priceY: Math.min(priceY, 1e25),
      concentrationX: Math.min(concentrationX, 1e18), // Cap at maximum allowed
      concentrationY: Math.min(concentrationY, 1e18),
      equilibriumReserve0,
      equilibriumReserve1,
      fee: 0.003e18, // 0.3% fee in 1e18 format
      borrowingEnabled: true,
      crossDepositsEnabled: true
    };
    
    // 7. Execution Timeline
    const timeline = estimateExecutionTimeline(swapSizes, volCategoryA, volCategoryB);
    
    // 8. Enhanced Risk Assessment with EulerSwap-specific risks
    const liquidationRisk = calculateLiquidationRisk(
      Math.max(volA, volB),
      usdcLTV.liquidationLTV,
      Math.max(collateralRequirements.daoA.availableUsdc, collateralRequirements.daoB.availableUsdc),
      swapSizes.totalValueUSD
    );
    
    const risks = assessMergerRisks({
      volatilities: { A: volA, B: volB },
      correlation,
      swapSizes,
      collateralRequirements,
      vaultUtilization: vaultConfig.usdc.utilizationImpact,
      liquidationRisk,
      vaultCapacityRisk: vaultConfig.usdc.capacityRisk,
      borrowingCostRisk: estimateBorrowingCosts(swapSizes.totalValueUSD, vaultData),
      slippageRisk: estimateSlippage(concentrationX, concentrationY, swapSizes)
    });
    
    // 9. Calculate overall feasibility score
    const feasibilityScore = calculateFeasibilityScore({
      collateralAdequacy: Math.min(
        collateralRequirements.daoA.availableUsdc / collateralRequirements.daoA.usdcRequired,
        collateralRequirements.daoB.availableUsdc / collateralRequirements.daoB.usdcRequired
      ),
      volatilityCompatibility: 1 - Math.abs(volA - volB) / Math.max(volA, volB),
      correlationFactor: Math.abs(correlation),
      vaultCapacity: 1 - vaultConfig.usdc.utilizationImpact.newUtilization,
      treasuryAlignment: calculateTreasuryAlignment(treasuryA, treasuryB)
    });
    
    return {
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
        sizes: swapSizes,
        collateral: collateralRequirements,
        ammParameters
      },
      vaultConfiguration: vaultConfig,
      timeline,
      risks,
      capitalEfficiency: {
        leverageMultiple: vaultConfig.crossCollateralization.maxLeverageRatio,
        liquidityEfficiency: '5-7x vs traditional AMMs',
        crossDepositBenefit: 'Each swap increases available liquidity',
        initialCapitalRequired: swapSizes.totalValueUSD * vaultConfig.crossCollateralization.initialSeedRatio
      },
      deploymentConfig: {
        vault0: `0x${treasuryA?.symbol}_VAULT`, // Placeholder - would need actual vault addresses
        vault1: `0x${treasuryB?.symbol}_VAULT`,
        eulerAccount: 'SHARED_EULER_ACCOUNT', // Would need actual account
        initialState: {
          currReserve0: equilibriumReserve0 * vaultConfig.crossCollateralization.initialSeedRatio,
          currReserve1: equilibriumReserve1 * vaultConfig.crossCollateralization.initialSeedRatio
        },
        curveValid: verifyCurveConstraints(ammParameters),
        paramValidation: validateEulerSwapParams(ammParameters)
      }
    };
    
  } catch (error) {
    console.error('Error calculating merger configuration:', error);
    throw error;
  }
};

// Helper functions for merger configuration

const determineMergerType = (treasuryA, treasuryB, volA, volB, correlation) => {
  const sizeRatio = (treasuryA?.totalValueUSD || 0) / (treasuryB?.totalValueUSD || 0);
  
  if (sizeRatio > 3 || sizeRatio < 0.33) {
    return 'acquisition'; // One DAO significantly larger
  } else if (Math.abs(correlation) > 0.7) {
    return 'strategic_alignment'; // High correlation suggests similar market exposure
  } else if (Math.abs(volA - volB) < 0.1) {
    return 'equal_merger'; // Similar volatility profiles
  } else {
    return 'diversification'; // Different profiles for risk diversification
  }
};

const calculateSwapSizes = (treasuryA, treasuryB, mergerType, volCategoryA, volCategoryB) => {
  const baseSwapPercentage = {
    acquisition: 0.25,
    strategic_alignment: 0.4,
    equal_merger: 0.35,
    diversification: 0.3
  }[mergerType];
  
  // Adjust for volatility
  const volAdjustment = Math.min(volCategoryA.swapSizeRecommendation, volCategoryB.swapSizeRecommendation) === 'small' ? 0.7 : 1;
  const adjustedPercentage = baseSwapPercentage * volAdjustment;
  
  const tokenAAmount = (treasuryA?.nativeTokenBalance || 0) * adjustedPercentage;
  const tokenBAmount = (treasuryB?.nativeTokenBalance || 0) * adjustedPercentage;
  
  return {
    tokenAAmount,
    tokenBAmount,
    tokenARequired: tokenBAmount,
    tokenBRequired: tokenAAmount,
    percentageA: adjustedPercentage * 100,
    percentageB: adjustedPercentage * 100,
    totalValueUSD: (tokenAAmount * (treasuryA?.nativeTokenPrice || 0)) + 
                   (tokenBAmount * (treasuryB?.nativeTokenPrice || 0))
  };
};

const calculateUtilizationImpact = (vaultData, requiredLiquidity) => {
  if (!vaultData) return { newUtilization: 0, impactSeverity: 'unknown' };
  
  const currentBorrows = parseFloat(vaultData.totalBorrows || 0);
  const totalAssets = parseFloat(vaultData.totalAssets || 0);
  const newBorrows = currentBorrows + requiredLiquidity;
  const newUtilization = totalAssets > 0 ? newBorrows / totalAssets : 0;
  
  return {
    currentUtilization: vaultData.utilization,
    newUtilization,
    impactSeverity: newUtilization > 0.9 ? 'high' : newUtilization > 0.7 ? 'medium' : 'low'
  };
};

const estimateExecutionTimeline = (swapSizes, volCategoryA, volCategoryB) => {
  const baseTime = 24; // hours
  const sizeMultiplier = swapSizes.totalValueUSD > 100000000 ? 2 : 1; // >$100M takes longer
  const volMultiplier = (volCategoryA.level === 'high' || volCategoryB.level === 'high') ? 1.5 : 1;
  
  return {
    preparation: 4 * sizeMultiplier,
    execution: baseTime * sizeMultiplier * volMultiplier,
    settlement: 2,
    total: (4 * sizeMultiplier) + (baseTime * sizeMultiplier * volMultiplier) + 2,
    unit: 'hours'
  };
};

const assessMergerRisks = (params) => {
  const risks = [];
  
  // Volatility risk
  if (params.volatilities.A > 0.5 || params.volatilities.B > 0.5) {
    risks.push({
      type: 'volatility',
      severity: 'high',
      description: 'High token volatility may impact swap execution',
      mitigation: 'Execute swaps in smaller batches over time'
    });
  }
  
  // Correlation risk
  if (Math.abs(params.correlation) < 0.3) {
    risks.push({
      type: 'correlation',
      severity: 'medium',
      description: 'Low correlation may lead to divergent price movements',
      mitigation: 'Use wider liquidity concentration parameters'
    });
  }
  
  // Collateral risk
  if (params.collateralRequirements.daoA.availableUsdc < params.collateralRequirements.daoA.usdcRequired ||
      params.collateralRequirements.daoB.availableUsdc < params.collateralRequirements.daoB.usdcRequired) {
    risks.push({
      type: 'collateral',
      severity: 'high',
      description: 'Insufficient USDC collateral for full swap',
      mitigation: 'Reduce swap size or acquire additional USDC'
    });
  }
  
  // Vault utilization risk
  if (params.vaultUtilization.impactSeverity === 'high') {
    risks.push({
      type: 'liquidity',
      severity: 'medium',
      description: 'High vault utilization may increase borrowing costs',
      mitigation: 'Monitor rates and execute during low utilization periods'
    });
  }
  
  // Liquidation risk
  if (params.liquidationRisk && params.liquidationRisk.riskScore === 'high') {
    risks.push({
      type: 'liquidation',
      severity: 'high',
      description: `Liquidation possible with ${(params.liquidationRisk.liquidationPriceMove * 100).toFixed(1)}% price movement`,
      mitigation: `Maintain LTV below ${(params.liquidationRisk.recommendedMaxLTV * 100).toFixed(0)}%`
    });
  }
  
  // Vault capacity risk
  if (params.vaultCapacityRisk && params.vaultCapacityRisk.capacityRisk === 'high') {
    risks.push({
      type: 'capacity',
      severity: 'high',
      description: 'Swap size exceeds recommended vault capacity',
      mitigation: `Reduce to ${params.vaultCapacityRisk.recommendedMaxSwap.toFixed(0)} or execute in batches`
    });
  }
  
  // Borrowing cost risk
  if (params.borrowingCostRisk && params.borrowingCostRisk.severity === 'high') {
    risks.push({
      type: 'borrowing_cost',
      severity: params.borrowingCostRisk.severity,
      description: `High borrowing costs: ${params.borrowingCostRisk.estimatedAPY}% APY`,
      mitigation: 'Consider smaller position or wait for lower utilization'
    });
  }
  
  // Slippage risk
  if (params.slippageRisk && params.slippageRisk.severity === 'high') {
    risks.push({
      type: 'slippage',
      severity: 'medium',
      description: `Expected slippage: ${params.slippageRisk.expectedSlippage}%`,
      mitigation: 'Use tighter concentration parameters or smaller swap sizes'
    });
  }
  
  return risks;
};

const calculateTreasuryAlignment = (treasuryA, treasuryB) => {
  if (!treasuryA || !treasuryB) return 0;
  
  // Compare treasury compositions
  const stablecoinRatioA = (treasuryA.stablecoinBalance || 0) / (treasuryA.totalValueUSD || 1);
  const stablecoinRatioB = (treasuryB.stablecoinBalance || 0) / (treasuryB.totalValueUSD || 1);
  
  // Similar stablecoin ratios indicate aligned treasury strategies
  return 1 - Math.abs(stablecoinRatioA - stablecoinRatioB);
};

const calculateFeasibilityScore = (factors) => {
  // Weighted average of factors
  const weights = {
    collateralAdequacy: 0.35,
    volatilityCompatibility: 0.2,
    correlationFactor: 0.15,
    vaultCapacity: 0.2,
    treasuryAlignment: 0.1
  };
  
  let score = 0;
  for (const [factor, value] of Object.entries(factors)) {
    score += (value || 0) * weights[factor];
  }
  
  return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
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

// Helper function to estimate borrowing costs
const estimateBorrowingCosts = (swapSize, vaultData) => {
  if (!vaultData) return { severity: 'unknown', estimatedAPY: 'N/A' };
  
  const utilization = parseFloat(vaultData.utilization || 0);
  const baseAPY = parseFloat(vaultData.borrowAPY || 5); // Default 5% if not provided
  
  // Higher utilization = higher rates (simplified model)
  const utilizationMultiplier = utilization > 0.8 ? 2 : utilization > 0.6 ? 1.5 : 1;
  const estimatedAPY = baseAPY * utilizationMultiplier;
  
  return {
    severity: estimatedAPY > 15 ? 'high' : estimatedAPY > 10 ? 'medium' : 'low',
    estimatedAPY: estimatedAPY.toFixed(2),
    dailyCost: (swapSize * estimatedAPY / 365 / 100).toFixed(2)
  };
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

// Comprehensive parameter validation for EulerSwap
export const validateEulerSwapParams = (params) => {
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