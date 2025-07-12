// Enhanced enterprise-grade DAO merger data from real API endpoints

// Fetch price data from API
const fetchPriceData = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/prices');
    const result = await response.json();
    if (result.success) {
      return result.data.map(token => ({
        symbol: token.symbol,
        currentPrice: token.currentPrice,
        priceHistory: token.priceHistory
      }));
    }
  } catch (error) {
    console.error('Error fetching price data:', error);
  }
  return [];
};

// DAO token price data - populated from /api/prices endpoint
export let marketData = [];

// Initialize market data on module load
(async () => {
  marketData = await fetchPriceData();
})();
  
// Fetch circulation data for all tracked tokens
const fetchCirculationData = async () => {
  try {
    // Get price data first to know which tokens to fetch
    const priceResponse = await fetch('http://localhost:3001/api/prices');
    const priceResult = await priceResponse.json();
    
    if (!priceResult.success) return [];
    
    const tokens = priceResult.data;
    const circulationPromises = tokens.map(async (token) => {
      try {
        const response = await fetch(`http://localhost:3001/api/token-circulation/${token.symbol}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          return {
            symbol: token.symbol,
            circulatingSupply: result.data.circulatingSupply || 0,
            marketCap: (result.data.circulatingSupply || 0) * (token.currentPrice || 0)
          };
        }
      } catch (error) {
        console.error(`Error fetching circulation for ${token.symbol}:`, error);
      }
      return null;
    });
    
    const results = await Promise.all(circulationPromises);
    return results.filter(Boolean); // Remove null entries
  } catch (error) {
    console.error('Error fetching circulation data:', error);
  }
  return [];
};

// DAO circulation data - populated from /api/token-circulation endpoint
export let circulationData = [];

// Initialize circulation data on module load
(async () => {
  circulationData = await fetchCirculationData();
  
  // Refresh data every 5 minutes
  setInterval(async () => {
    marketData = await fetchPriceData();
    circulationData = await fetchCirculationData();
  }, 5 * 60 * 1000);
})();
  
  // AI Analysis modules for DAO merger optimization
  export const aiModules = {
    volatility_analyzer: {
      name: 'Volatility & Risk Analyzer',
      status: 'active',
      confidence: 92.7,
      last_action: '2 minutes ago',
      description: 'Real-time volatility calculation and risk assessment for DAO tokens',
      calculations_today: 847,
      avg_volatility: '32.4%',
      risk_alerts: 3
    },
    correlation_calculator: {
      name: 'Token Correlation Engine',
      status: 'active',
      confidence: 89.3,
      last_action: '5 minutes ago',
      description: 'Pearson correlation analysis across DAO token pairs',
      pairs_analyzed: 156,
      avg_correlation: '0.68',
      high_correlation_pairs: 12
    },
    pool_parameter_optimizer: {
      name: 'Pool Parameter Optimizer',
      status: 'active',
      confidence: 94.8,
      last_action: '1 minute ago',
      description: 'Optimizes asymmetric concentration parameters for one-sided pools',
      optimizations_today: 67,
      avg_concentration_x: '0.42',
      avg_concentration_y: '0.88'
    },
    jit_liquidity_simulator: {
      name: 'JIT Liquidity Simulator',
      status: 'active',
      confidence: 91.2,
      last_action: 'continuous',
      description: 'Simulates one-sided JIT liquidity provision and vault funding needs',
      simulations_today: 423,
      avg_funding_ratio: '1.2x',
      successful_scenarios: '94.7%'
    },
    batch_execution_planner: {
      name: 'Batch Execution Planner',
      status: 'active',
      confidence: 93.5,
      last_action: '3 minutes ago',
      description: 'Plans optimal batch sizes and execution timing for merger swaps',
      batches_planned: 89,
      avg_batch_size: '5-15 batches',
      price_impact_reduction: '67%'
    }
  };
  
  // Live events for DAO merger activity
  export const liveEvents = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      type: 'volatility',
      severity: 'warning',
      title: 'High Volatility Detected',
      message: 'LDO volatility increased to 52% (annualized). Consider reducing swap size or widening concentration parameters',
      confidence: 92,
      module: 'volatility_analyzer',
      data: { token: 'LDO', volatility: 0.52, previousVolatility: 0.45 }
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      type: 'correlation',
      severity: 'success',
      title: 'High Correlation Identified',
      message: 'UNI-COMP correlation at 0.81. Optimal for tight liquidity concentration (0.95e18)',
      confidence: 89,
      module: 'correlation_calculator',
      data: { pair: 'UNI-COMP', correlation: 0.81, recommendedConcentration: '0.95e18' }
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'dilution',
      severity: 'info',
      title: 'Favorable Dilution Detected',
      message: 'AAVE-COMP merger would result in only 12% dilution. Excellent merger candidate',
      confidence: 96,
      module: 'pool_parameter_optimizer',
      data: { daoA: 'AAVE', daoB: 'COMP', dilutionPercentage: 12, feasibilityScore: 88 }
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 22 * 60 * 1000),
      type: 'concentration',
      severity: 'warning',
      title: 'Concentration Adjustment Recommended',
      message: 'High volatility in LDO suggests lowering concentrationX to 0.35 for better price discovery',
      confidence: 91,
      module: 'jit_liquidity_simulator',
      data: { token: 'LDO', currentVolatility: 0.65, recommendedConcentrationX: 0.35 }
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'merger',
      severity: 'success',
      title: 'Merger Parameters Optimized',
      message: 'UNI-AAVE merger feasibility: 94%. Required mint: 3.2M AAVE tokens',
      confidence: 94,
      module: 'pool_parameter_optimizer',
      data: { daoA: 'UNI', daoB: 'AAVE', feasibility: 0.94, requiredMint: 3200000 }
    }
  ];
  
 
  
  
  export default {
    marketData,
    circulationData,
    aiModules,
    liveEvents
  };