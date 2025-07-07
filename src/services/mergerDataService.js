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
  
// Fetch treasury data from API
const fetchTreasuryData = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/treasuries');
    const result = await response.json();
    if (result.success) {
      return result.data.map(dao => {
        // Get the first treasury entry (most DAOs have one main treasury)
        const mainTreasury = dao.treasuries[0];
        if (!mainTreasury) return null;
        
        const tokenBreakdowns = mainTreasury.tokenBreakdowns || {};
        
        return {
          symbol: dao.symbol,
          ownTokens: tokenBreakdowns.ownTokens || 0,
          stablecoins: tokenBreakdowns.stablecoins || 0
        };
      }).filter(Boolean); // Remove null entries
    }
  } catch (error) {
    console.error('Error fetching treasury data:', error);
  }
  return [];
};

// DAO treasury composition - populated from /api/treasuries endpoint
export let treasuryData = [];

// Initialize treasury data on module load
(async () => {
  treasuryData = await fetchTreasuryData();
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
    collateral_optimizer: {
      name: 'USDC Collateral Optimizer',
      status: 'active',
      confidence: 94.8,
      last_action: '1 minute ago',
      description: 'Optimizes USDC collateral usage for maximum capital efficiency',
      optimizations_today: 67,
      avg_ltv_achieved: '85.2%',
      capital_efficiency: '5.7x'
    },
    crossdeposit_simulator: {
      name: 'Cross-Deposit Mechanism Simulator',
      status: 'active',
      confidence: 91.2,
      last_action: 'continuous',
      description: 'Simulates cross-vault deposit effects on liquidity availability',
      simulations_today: 423,
      liquidity_multiplier: '2.3x',
      successful_scenarios: '94.7%'
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
      type: 'treasury',
      severity: 'info',
      title: 'Treasury Movement Detected',
      message: 'Aave treasury moved 15M USDC to vault. Merger capacity increased by $13.5M',
      confidence: 96,
      module: 'collateral_optimizer',
      data: { dao: 'AAVE', usdcMoved: 15000000, capacityIncrease: 13500000 }
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 22 * 60 * 1000),
      type: 'vault',
      severity: 'warning',
      title: 'Vault Utilization Rising',
      message: 'USDC Prime Vault utilization at 89.7%. Borrowing costs may increase for large swaps',
      confidence: 91,
      module: 'crossdeposit_simulator',
      data: { vault: 'USDC_PRIME', utilization: 0.78, borrowAPY: 5.2 }
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'merger',
      severity: 'success',
      title: 'Merger Parameters Optimized',
      message: 'UNI-AAVE merger feasibility: 94%. Optimal swap size: $125M each side',
      confidence: 94,
      module: 'collateral_optimizer',
      data: { daoA: 'UNI', daoB: 'AAVE', feasibility: 0.94, optimalSwap: 125000000 }
    }
  ];
  
 
  
  
  export default {
    marketData,
    treasuryData,
    aiModules,
    liveEvents
  };