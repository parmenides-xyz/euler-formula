import { aiModules, liveEvents, marketData, treasuryData } from '../services/mergerDataService';

export class MergerRecommendations {
  constructor() {
    this.personality = {
      greetings: [
        "Welcome to FORMULA merger analysis!",
        "Ready to optimize your DAO merger strategy.",
        "Let's explore capital-efficient merger opportunities.",
        "EulerSwap merger simulator initialized."
      ],
      confidence_phrases: [
        "Analysis indicates",
        "Data strongly suggests",
        "Calculations confirm",
        "Metrics reveal",
        "Cross-collateralization analysis shows"
      ],
      insights: [
        "Key observation:",
        "Important finding:",
        "Analysis result:",
        "Simulation insight:",
        "Efficiency metric:"
      ],
      conclusions: [
        "Recommendation:",
        "Optimal strategy:",
        "Analysis conclusion:",
        "Best approach:",
        "Suggested action:"
      ]
    };
    
    // Content filtering for inappropriate topics
    this.blockedTopics = [
      'politics', 'political', 'election', 'government', 'democrat', 'republican',
      'war', 'warfare', 'military', 'army', 'conflict', 'violence', 'weapon',
      'religion', 'religious', 'god', 'allah', 'jesus', 'muslim', 'christian',
      'racism', 'racist', 'discrimination', 'hate', 'nazi', 'terrorist',
      'drugs', 'cocaine', 'heroin', 'marijuana', 'illegal'
    ];
  }

  generateGreeting() {
    return this.personality.greetings[Math.floor(Math.random() * this.personality.greetings.length)];
  }

  analyzeMarketConditions() {
    // Analyze current market data to provide status
    const daoCount = treasuryData.length;
    const highValueDAOs = treasuryData.filter(t => t.totalValueUSD > 50000000).length;
    const averageVolatility = marketData.reduce((sum, m) => sum + m.volatility, 0) / marketData.length;
    
    if (highValueDAOs >= 3 && averageVolatility < 0.4) {
      return {
        status: 'green',
        message: `${highValueDAOs} high-value DAOs identified with stable volatility. Optimal conditions for cross-collateralization mergers.`,
        confidence: 94
      };
    } else if (daoCount >= 5) {
      return {
        status: 'yellow',
        message: `Analyzing ${daoCount} DAO treasuries for merger opportunities. Market volatility at ${(averageVolatility * 100).toFixed(1)}%.`,
        confidence: 78
      };
    } else {
      return {
        status: 'yellow',
        message: 'Gathering market data and analyzing treasury positions. Merger opportunities being evaluated.',
        confidence: 65
      };
    }
  }

  filterContent(input) {
    const lowercaseInput = input.toLowerCase();
    const containsBlockedTopic = this.blockedTopics.some(topic => 
      lowercaseInput.includes(topic.toLowerCase())
    );

    if (containsBlockedTopic) {
      return {
        isBlocked: true,
        response: `I'm designed to help with DAO merger analysis using EulerSwap's capital-efficient mechanisms. Let me assist you with treasury optimization, merger feasibility, or simulation parameters instead.`
      };
    }

    return { isBlocked: false };
  }

  generateMergerRecommendations(mergerConfig, daoA, daoB) {
    if (!mergerConfig || !mergerConfig.feasibility) {
      return [{
        id: 'awaiting-selection',
        type: 'info',
        priority: 'low',
        title: 'Select DAOs for Analysis',
        description: 'Choose two DAOs to simulate merger opportunities',
        simulationParams: {},
        expectedOutcomes: {},
        metrics: {},
        risks: []
      }];
    }

    const recommendations = [];
    const { feasibility, mergerType, swapConfiguration, vaultConfiguration, capitalEfficiency, timeline, risks } = mergerConfig;

    // Primary merger simulation recommendation
    if (feasibility.viable) {
      recommendations.push({
        id: `sim-${mergerType}-${Date.now()}`,
        type: 'merger_simulation',
        priority: feasibility.score > 80 ? 'high' : feasibility.score > 60 ? 'medium' : 'low',
        title: `${mergerType.charAt(0).toUpperCase() + mergerType.slice(1).replace('_', ' ')} Merger Simulation`,
        description: feasibility.recommendation,
        
        simulationParams: {
          swapSizeA: swapConfiguration.sizes.tokenAAmount,
          swapSizeB: swapConfiguration.sizes.tokenBAmount,
          percentageA: swapConfiguration.sizes.percentageA,
          percentageB: swapConfiguration.sizes.percentageB,
          totalValueUSD: swapConfiguration.sizes.totalValueUSD,
          
          collateral: {
            daoA: swapConfiguration.collateral.daoA.usdcRequired,
            daoB: swapConfiguration.collateral.daoB.usdcRequired,
            total: swapConfiguration.collateral.daoA.usdcRequired + swapConfiguration.collateral.daoB.usdcRequired
          },
          
          ammParams: {
            concentrationX: swapConfiguration.ammParameters.concentrationX / 1e18,
            concentrationY: swapConfiguration.ammParameters.concentrationY / 1e18,
            fee: swapConfiguration.ammParameters.fee / 1e18,
            virtualReserveA: swapConfiguration.ammParameters.equilibriumReserve0,
            virtualReserveB: swapConfiguration.ammParameters.equilibriumReserve1
          }
        },
        
        expectedOutcomes: {
          feasibilityScore: `${Math.round(feasibility.score * 100)}%`,
          capitalEfficiency: capitalEfficiency.leverageMultiple + 'x vs traditional AMM',
          liquidityMultiplier: vaultConfiguration.crossCollateralization.crossDepositMultiplier + 'x',
          timeline: timeline.total + ' ' + timeline.unit,
          crossDepositEffect: 'Each swap increases borrowable liquidity'
        },
        
        metrics: {
          usdcUtilization: `${(vaultConfiguration.usdc.utilization * 100).toFixed(1)}%`,
          borrowAPR: `${vaultConfiguration.usdc.borrowAPR.toFixed(2)}%`,
          availableLiquidity: `$${(vaultConfiguration.usdc.cash / 1e6).toFixed(1)}M`,
          ltv: `${(vaultConfiguration.crossCollateralization.ltv * 100).toFixed(0)}%`
        },
        
        risks: risks.map(r => ({
          type: r.type,
          severity: r.severity,
          description: r.description,
          mitigation: r.mitigation
        }))
      });

      // Add collateral optimization simulation
      if (swapConfiguration.collateral.daoA.availableUsdc < swapConfiguration.collateral.daoA.usdcRequired ||
          swapConfiguration.collateral.daoB.availableUsdc < swapConfiguration.collateral.daoB.usdcRequired) {
        recommendations.push({
          id: `sim-collateral-${Date.now()}`,
          type: 'collateral_optimization',
          priority: 'high',
          title: 'USDC Collateral Acquisition Simulation',
          description: 'Simulate optimal USDC acquisition strategy for merger',
          
          simulationParams: {
            currentUsdcA: swapConfiguration.collateral.daoA.availableUsdc,
            currentUsdcB: swapConfiguration.collateral.daoB.availableUsdc,
            requiredUsdcA: swapConfiguration.collateral.daoA.usdcRequired,
            requiredUsdcB: swapConfiguration.collateral.daoB.usdcRequired,
            deficitA: Math.max(0, swapConfiguration.collateral.daoA.usdcRequired - swapConfiguration.collateral.daoA.availableUsdc),
            deficitB: Math.max(0, swapConfiguration.collateral.daoB.usdcRequired - swapConfiguration.collateral.daoB.availableUsdc)
          },
          
          expectedOutcomes: {
            acquisitionCost: 'Market rate + 0.3% slippage',
            timeToAcquire: '2-4 hours via DEX aggregators',
            alternativeStrategy: 'Reduce swap size to match available collateral'
          },
          
          metrics: {
            currentCollateralCoverage: `${Math.min(
              swapConfiguration.collateral.daoA.availableUsdc / swapConfiguration.collateral.daoA.usdcRequired,
              swapConfiguration.collateral.daoB.availableUsdc / swapConfiguration.collateral.daoB.usdcRequired
            ) * 100}%`
          },
          
          risks: [{
            type: 'execution',
            severity: 'medium',
            description: 'Large USDC purchases may move market',
            mitigation: 'Use OTC or staged acquisition'
          }]
        });
      }
    } else {
      // Non-viable merger analysis
      recommendations.push({
        id: `analysis-nonviable-${Date.now()}`,
        type: 'feasibility_analysis',
        priority: 'info',
        title: 'Merger Feasibility Analysis',
        description: feasibility.recommendation,
        
        simulationParams: {
          feasibilityScore: feasibility.score,
          primaryIssues: risks.filter(r => r.severity === 'high').map(r => r.type)
        },
        
        expectedOutcomes: {
          recommendation: 'Address identified issues before proceeding',
          alternativeApproach: mergerType === 'acquisition' ? 
            'Consider phased acquisition with smaller initial swaps' : 
            'Explore partnership structures instead of full merger'
        },
        
        metrics: {
          feasibilityScore: `${Math.round(feasibility.score * 100)}%`,
          viabilityThreshold: '60%',
          gap: `${Math.round((0.6 - feasibility.score) * 100)}%`
        },
        
        risks: risks
      });
    }

    // Add scenario variations
    recommendations.push(...this.generateScenarioVariations(mergerConfig, daoA, daoB));

    return recommendations;
  }

  generateScenarioVariations(mergerConfig, daoA, daoB) {
    const variations = [];
    const baseConfig = mergerConfig.swapConfiguration;

    // Conservative scenario
    variations.push({
      id: `scenario-conservative-${Date.now()}`,
      type: 'scenario',
      priority: 'medium',
      title: 'Conservative Approach (30% Treasury Swap)',
      description: 'Lower risk profile with reduced swap sizes',
      
      simulationParams: {
        swapPercentage: 30,
        swapSizeA: baseConfig.sizes.tokenAAmount * 0.3,
        swapSizeB: baseConfig.sizes.tokenBAmount * 0.3,
        collateralRequired: (baseConfig.collateral.daoA.usdcRequired + baseConfig.collateral.daoB.usdcRequired) * 0.3,
        concentration: 0.7 // Wider bands for safety
      },
      
      expectedOutcomes: {
        capitalEfficiency: '4.2x vs traditional AMM',
        riskLevel: 'Low',
        executionComplexity: 'Simple'
      },
      
      metrics: {
        expectedSlippage: '0.5%',
        timeTocomplete: '24 hours'
      },
      
      risks: [{
        type: 'opportunity',
        severity: 'low',
        description: 'May not achieve full synergy benefits',
        mitigation: 'Can increase swap size later if successful'
      }]
    });

    // Aggressive scenario (if base is not already aggressive)
    if (mergerConfig.swapConfiguration.sizes.percentageA < 60) {
      variations.push({
        id: `scenario-aggressive-${Date.now()}`,
        type: 'scenario',
        priority: 'low',
        title: 'Aggressive Approach (70% Treasury Swap)',
        description: 'Maximum efficiency with higher risk tolerance',
        
        simulationParams: {
          swapPercentage: 70,
          swapSizeA: baseConfig.sizes.tokenAAmount * 2,
          swapSizeB: baseConfig.sizes.tokenBAmount * 2,
          collateralRequired: (baseConfig.collateral.daoA.usdcRequired + baseConfig.collateral.daoB.usdcRequired) * 2,
          concentration: 0.95 // Tight bands for efficiency
        },
        
        expectedOutcomes: {
          capitalEfficiency: '6.8x vs traditional AMM',
          riskLevel: 'High',
          executionComplexity: 'Complex - requires active management'
        },
        
        metrics: {
          expectedSlippage: '1.5%',
          timeTocomplete: '72 hours phased'
        },
        
        risks: [{
          type: 'liquidation',
          severity: 'high',
          description: 'Higher liquidation risk with tight LTV',
          mitigation: 'Continuous monitoring and rebalancing required'
        }]
      });
    }

    return variations;
  }

  generateSimulationSteps(recommendation, mergerConfig) {
    if (!mergerConfig || !recommendation) {
      console.warn('generateSimulationSteps: Missing required parameters', { 
        hasRecommendation: !!recommendation, 
        hasMergerConfig: !!mergerConfig 
      });
      return [];
    }

    try {
      // Validate mergerConfig structure
      if (!mergerConfig.swapConfiguration) {
        console.error('generateSimulationSteps: Missing swapConfiguration in mergerConfig');
        return [];
      }

      // Extract data from mergerConfig with defensive checks
      const collateralA = mergerConfig.swapConfiguration?.collateral?.daoA?.usdcRequired || 0;
      const collateralB = mergerConfig.swapConfiguration?.collateral?.daoB?.usdcRequired || 0;
      const ltv = mergerConfig.vaultConfiguration?.crossCollateralization?.ltv || 0.85;
      const liquidationLTV = mergerConfig.vaultConfiguration?.crossCollateralization?.liquidationLTV || 0.9;
    
    // Extract swap sizes and other data from mergerConfig
    const swapSizeA = mergerConfig.swapConfiguration?.sizes?.tokenAAmount || 0;
    const swapSizeB = mergerConfig.swapConfiguration?.sizes?.tokenBAmount || 0;
    const percentageA = mergerConfig.swapConfiguration?.sizes?.percentageA || 0;
    const percentageB = mergerConfig.swapConfiguration?.sizes?.percentageB || 0;
    
    // Extract AMM parameters
    const concentrationX = (mergerConfig.swapConfiguration?.ammParameters?.concentrationX || 0) / 1e18;
    const concentrationY = (mergerConfig.swapConfiguration?.ammParameters?.concentrationY || 0) / 1e18;
    const fee = (mergerConfig.swapConfiguration?.ammParameters?.fee || 0) / 1e18;
    const equilibriumReserve0 = mergerConfig.swapConfiguration?.ammParameters?.equilibriumReserve0 || 0;
    const equilibriumReserve1 = mergerConfig.swapConfiguration?.ammParameters?.equilibriumReserve1 || 0;
    
    // Extract vault data
    const borrowAPR = mergerConfig.vaultConfiguration?.usdc?.borrowAPR || 0;
    const vaultCash = mergerConfig.vaultConfiguration?.usdc?.cash || 0;
    const crossDepositMultiplier = mergerConfig.vaultConfiguration?.crossCollateralization?.crossDepositMultiplier || 2;

    const steps = [
      {
        id: 'collateral-setup',
        name: 'USDC Collateral Deployment',
        description: 'Both DAOs deposit USDC into Euler vaults as collateral',
        details: [
          `DAO A deposits ${this.formatNumber(collateralA)} USDC`,
          `DAO B deposits ${this.formatNumber(collateralB)} USDC`,
          `Target LTV: ${(ltv * 100).toFixed(0)}%`,
          `Liquidation buffer: ${((liquidationLTV - ltv) * 100).toFixed(0)}%`
        ],
        duration: '10 minutes',
        status: 'pending'
      },
      {
        id: 'borrow-native-tokens',
        name: 'Cross-Collateralized Borrowing',
        description: 'Borrow native tokens using USDC collateral positions',
        details: [
          `DAO A borrows ${this.formatNumber(swapSizeB)} Token B`,
          `DAO B borrows ${this.formatNumber(swapSizeA)} Token A`,
          `Borrow APR: ${borrowAPR.toFixed(2)}%`,
          `Available liquidity: $${(vaultCash / 1e6).toFixed(1)}M`
        ],
        duration: '5 minutes',
        status: 'pending'
      },
      {
        id: 'deploy-eulerswap',
        name: 'Initialize EulerSwap Curve',
        description: 'Deploy concentrated liquidity curve with optimal parameters',
        details: [
          `Concentration X: ${concentrationX.toFixed(2)}`,
          `Concentration Y: ${concentrationY.toFixed(2)}`,
          `Fee tier: ${(fee * 100).toFixed(2)}%`,
          `Virtual reserves: ${this.formatNumber(equilibriumReserve0)} / ${this.formatNumber(equilibriumReserve1)}`
        ],
        duration: '5 minutes',
        status: 'pending'
      },
      {
        id: 'execute-swaps',
        name: 'Execute Cross-Deposit Swaps',
        description: 'Perform token swaps with automatic vault deposits',
        details: [
          `Swap ${percentageA.toFixed(1)}% of DAO A treasury`,
          `Swap ${percentageB.toFixed(1)}% of DAO B treasury`,
          `Each swap deposits tokens in opposite vault`,
          `Creates ${crossDepositMultiplier}x liquidity multiplier`
        ],
        duration: '15 minutes',
        status: 'pending'
      },
      {
        id: 'monitor-positions',
        name: 'Position Monitoring & Rebalancing',
        description: 'Track collateral health and rebalance if needed',
        details: [
          `Monitor LTV ratio (current: ${(ltv * 100).toFixed(0)}%)`,
          `Track vault utilization impact`,
          `Adjust positions if market moves >5%`,
          `Emergency unwinding available if needed`
        ],
        duration: 'Ongoing',
        status: 'pending'
      },
      {
        id: 'completion-verification',
        name: 'Verify Merger Completion',
        description: 'Confirm final positions and treasury diversification',
        details: [
          `DAO A holds ${this.formatNumber(swapSizeB)} of DAO B tokens`,
          `DAO B holds ${this.formatNumber(swapSizeA)} of DAO A tokens`,
          `Capital efficiency achieved: ${mergerConfig.capitalEfficiency?.leverageMultiple || 'N/A'}x`,
          `Total value swapped: $${this.formatNumber((swapSizeA + swapSizeB) || 0)}`
        ],
        duration: '5 minutes',
        status: 'pending'
      }
    ];

    return steps;
    
    } catch (error) {
      console.error('Error generating simulation steps:', error);
      console.error('MergerConfig structure:', JSON.stringify(mergerConfig, null, 2));
      return [];
    }
  }

  processAdvancedQuery(query, context = {}) {
    // Filter inappropriate content
    const filterResult = this.filterContent(query);
    if (filterResult.isBlocked) {
      return filterResult.response;
    }

    const lowercaseQuery = query.toLowerCase();
    const { prices, treasuries, vaults, mergerConfiguration, selectedDaoA, selectedDaoB } = context;

    // Handle queries based on available data
    if (this.containsKeywords(lowercaseQuery, ['how', 'work', 'explain', 'what is'])) {
      if (lowercaseQuery.includes('cross') || lowercaseQuery.includes('collateral')) {
        return this.explainCrossCollateralization();
      }
      if (lowercaseQuery.includes('euler') || lowercaseQuery.includes('swap')) {
        return this.explainEulerSwapMechanism();
      }
    }

    // Queries requiring DAO selection
    if (this.containsKeywords(lowercaseQuery, ['merger', 'merge', 'feasibility', 'simulate'])) {
      if (!selectedDaoA || !selectedDaoB) {
        return `${this.personality.insights[0]} To analyze merger feasibility, please select two DAOs from our tracked list. I have data on ${treasuries?.length || 0} DAOs with treasury information available.`;
      }
      if (!mergerConfiguration) {
        return `${this.personality.insights[1]} Calculating merger configuration for ${selectedDaoA.symbol} and ${selectedDaoB.symbol}. This analysis will include feasibility scoring, optimal swap parameters, and capital efficiency projections.`;
      }
      return this.analyzeMergerFeasibility(mergerConfiguration, selectedDaoA, selectedDaoB);
    }

    // Treasury analysis (can work with general data)
    if (this.containsKeywords(lowercaseQuery, ['treasury', 'treasuries', 'holdings'])) {
      if (!treasuries || treasuries.length === 0) {
        return `${this.personality.insights[2]} Treasury data is being loaded. Please ensure the backend service is running and connected to DeFiLlama.`;
      }
      return this.analyzeTreasuryLandscape(treasuries);
    }

    // Vault status (can work with general data)
    if (this.containsKeywords(lowercaseQuery, ['vault', 'liquidity', 'available', 'capacity'])) {
      if (!vaults) {
        return `${this.personality.insights[3]} Euler vault data is being fetched. This will show USDC availability for collateralized borrowing.`;
      }
      return this.analyzeVaultStatus(vaults);
    }

    // Capital efficiency questions
    if (this.containsKeywords(lowercaseQuery, ['efficiency', 'capital', 'leverage'])) {
      if (mergerConfiguration) {
        return this.explainCapitalEfficiency(mergerConfiguration);
      }
      return this.explainGeneralCapitalEfficiency();
    }

    // Risk analysis
    if (this.containsKeywords(lowercaseQuery, ['risk', 'risks', 'safe', 'danger'])) {
      if (mergerConfiguration) {
        return this.analyzeSpecificRisks(mergerConfiguration);
      }
      return this.explainGeneralRisks();
    }

    // Status report
    if (this.containsKeywords(lowercaseQuery, ['status', 'current', 'now'])) {
      return this.generateStatusReport(context);
    }

    // Default response
    return `${this.generateGreeting()} I can help you analyze DAO mergers using EulerSwap's capital-efficient mechanisms. You can ask about:
- Treasury compositions and merger feasibility
- Cross-collateralization mechanics
- Capital efficiency calculations
- Risk assessments
- Current vault liquidity

${treasuries?.length > 0 ? `I have data on ${treasuries.length} DAOs ready for analysis.` : 'Treasury data is loading...'}`;
  }

  // Helper methods for responses

  explainCrossCollateralization() {
    return `${this.personality.insights[0]} Cross-collateralization in EulerSwap enables unprecedented capital efficiency:

**How It Works:**
1. **USDC as Universal Collateral**: Both DAOs deposit stablecoins (USDC) into Euler vaults
2. **Cross-Vault Borrowing**: Native token vaults accept USDC positions as collateral at 85-90% LTV
3. **Bidirectional Flow**: 
   - DAO A uses USDC collateral → borrows DAO B tokens
   - DAO B uses USDC collateral → borrows DAO A tokens
4. **Swap Execution**: Borrowed tokens are swapped via concentrated AMM
5. **Cross-Deposits**: Each swap deposits tokens in the opposite vault

**Key Efficiency Gain**: Each swap increases the borrowable liquidity in both vaults, creating a self-reinforcing cycle that achieves 5-7x capital efficiency versus traditional AMMs.`;
  }

  explainEulerSwapMechanism() {
    return `${this.personality.conclusions[0]} EulerSwap revolutionizes AMM design through just-in-time liquidity:

**Core Innovation**: Instead of locking liquidity in pools, EulerSwap borrows it from Euler lending vaults on-demand.

**Mechanism:**
1. **No Pre-Funded Pools**: Liquidity providers deposit in Euler vaults, earning yield
2. **JIT Borrowing**: When swaps occur, the AMM borrows needed tokens
3. **Concentrated Curves**: Uses Uniswap v3-style concentration for efficiency
4. **Automatic Repayment**: Swap output repays the borrow instantly

**For DAO Mergers**: This enables massive treasury swaps without requiring billions in locked liquidity. The 5-7x efficiency comes from:
- Only needing 10-20% collateral vs 100% in traditional AMMs
- Cross-deposits multiplying available liquidity
- Borrowed liquidity earning yield when not in use`;
  }

  analyzeMergerFeasibility(config, daoA, daoB) {
    return `${this.personality.conclusions[1]} ${daoA.symbol}-${daoB.symbol} Merger Analysis:

**Feasibility Score**: ${Math.round(config.feasibility.score * 100)}% (${config.feasibility.viable ? 'VIABLE' : 'NOT RECOMMENDED'})
**Merger Type**: ${config.mergerType.replace('_', ' ').toUpperCase()}

**Optimal Configuration**:
• Swap Size: ${(config.swapConfiguration.sizes.percentageA).toFixed(1)}% of each treasury
• ${daoA.symbol}: ${this.formatNumber(config.swapConfiguration.sizes.tokenAAmount)} tokens ($${this.formatNumber(config.swapConfiguration.sizes.tokenAAmount * daoA.price)})
• ${daoB.symbol}: ${this.formatNumber(config.swapConfiguration.sizes.tokenBAmount)} tokens ($${this.formatNumber(config.swapConfiguration.sizes.tokenBAmount * daoB.price)})

**Capital Requirements**:
• Total USDC Collateral: $${this.formatNumber(config.swapConfiguration.collateral.daoA.usdcRequired + config.swapConfiguration.collateral.daoB.usdcRequired)}
• Efficiency vs Traditional AMM: ${config.capitalEfficiency.leverageMultiple}x
• Cross-Deposit Multiplier: ${config.vaultConfiguration.crossCollateralization.crossDepositMultiplier}x

**Risk Assessment**: ${config.risks.filter(r => r.severity === 'high').length} high-risk factors
${config.feasibility.recommendation}`;
  }

  analyzeTreasuryLandscape(treasuries) {
    const totalTVL = treasuries.reduce((sum, dao) => sum + (dao.tvl || 0), 0);
    const totalStables = treasuries.reduce((sum, dao) => sum + (dao.stablecoins || 0), 0);
    const mergerCandidates = treasuries.filter(dao => dao.stablecoins > 10000000); // >$10M USDC

    return `${this.personality.insights[2]} DAO Treasury Landscape:

**Overview**:
• Total Value Locked: $${(totalTVL / 1e9).toFixed(1)}B across ${treasuries.length} DAOs
• Stablecoin Holdings: $${(totalStables / 1e9).toFixed(1)}B (${((totalStables/totalTVL) * 100).toFixed(1)}% of total)
• Merger-Ready DAOs: ${mergerCandidates.length} with >$10M USDC

**Top 5 by Treasury Size**:
${treasuries.sort((a, b) => (b.tvl || 0) - (a.tvl || 0)).slice(0, 5).map((dao, i) => 
  `${i + 1}. ${dao.name}: $${((dao.tvl || 0) / 1e6).toFixed(0)}M (${((dao.stablecoins || 0) / 1e6).toFixed(0)}M USDC)`
).join('\n')}

**Optimal Merger Candidates**: DAOs with 20-40% stablecoin ratios have ideal collateral for EulerSwap mergers.`;
  }

  analyzeVaultStatus(vaultData) {
    const availableLiquidity = vaultData.cash || (vaultData.totalAssets - vaultData.totalBorrows);
    const utilization = vaultData.utilization || 0;
    
    return `${this.personality.insights[3]} Euler USDC Vault Status:

**Current Metrics**:
• Total Assets: $${(vaultData.totalAssets / 1e6).toFixed(1)}M
• Available to Borrow: $${(availableLiquidity / 1e6).toFixed(1)}M
• Utilization: ${(utilization * 100).toFixed(1)}%
• Borrow APR: ${vaultData.borrowAPR?.toFixed(2) || 'N/A'}%

**Merger Capacity**:
• Single Merger Limit: $${(availableLiquidity * 0.1 / 1e6).toFixed(1)}M (10% of available)
• Optimal Utilization Range: 60-80%
• Current Status: ${utilization > 0.8 ? 'HIGH - costs may increase' : utilization > 0.6 ? 'OPTIMAL' : 'LOW - excellent borrowing conditions'}

${utilization > 0.8 ? '⚠️ High utilization may increase borrowing costs. Consider smaller swaps or wait for better conditions.' : '✅ Good liquidity conditions for merger execution.'}`;
  }

  explainCapitalEfficiency(config) {
    const traditionalRequired = config.swapConfiguration.sizes.totalValueUSD;
    const eulerRequired = traditionalRequired / config.capitalEfficiency.leverageMultiple;
    
    return `${this.personality.confidence_phrases[0]} capital efficiency analysis for this merger:

**Traditional AMM Requirements**:
• Upfront Liquidity: $${this.formatNumber(traditionalRequired)} (100% of swap value)
• Capital Locked: Indefinitely in LP positions
• Efficiency: 1.0x baseline

**EulerSwap Innovation**:
• Upfront Capital: $${this.formatNumber(eulerRequired)} (${((eulerRequired/traditionalRequired) * 100).toFixed(0)}% of swap value)
• Efficiency Gain: ${config.capitalEfficiency.leverageMultiple}x
• Liquidity Source: Borrowed from Euler vaults

**Efficiency Breakdown**:
1. USDC Collateral at ${(config.vaultConfiguration.crossCollateralization.ltv * 100).toFixed(0)}% LTV
2. Cross-deposits create ${config.vaultConfiguration.crossCollateralization.crossDepositMultiplier}x multiplier
3. Total efficiency: ${config.capitalEfficiency.leverageMultiple}x vs traditional

**Result**: Save $${this.formatNumber(traditionalRequired - eulerRequired)} in capital requirements.`;
  }

  explainGeneralCapitalEfficiency() {
    return `${this.personality.insights[4]} EulerSwap's capital efficiency for DAO mergers:

**Traditional AMM**: Requires 100% of swap value locked in liquidity pools
**EulerSwap**: Requires only 15-20% as USDC collateral

**How 5-7x Efficiency is Achieved**:
1. **Collateralized Borrowing** (3-4x)
   - 85-90% LTV on USDC means $1 controls $5.7-10 of liquidity
   
2. **Cross-Deposits** (1.5-2x)
   - Each swap deposits in opposite vault
   - Creates borrowable liquidity for future swaps
   
3. **JIT Liquidity** (1.2x)
   - No idle capital sitting in pools
   - All liquidity earns yield until borrowed

**Example**: $200M treasury swap
- Traditional: Need $200M locked liquidity
- EulerSwap: Need $30-40M USDC collateral
- Savings: $160-170M capital freed for other uses`;
  }

  analyzeSpecificRisks(config) {
    const highRisks = config.risks.filter(r => r.severity === 'high');
    const mediumRisks = config.risks.filter(r => r.severity === 'medium');
    
    return `${this.personality.conclusions[2]} Risk Assessment for this merger:

**High-Priority Risks** (${highRisks.length}):
${highRisks.map(r => `• ${r.type.toUpperCase()}: ${r.description}\n  Mitigation: ${r.mitigation}`).join('\n\n')}

**Medium Risks** (${mediumRisks.length}):
${mediumRisks.map(r => `• ${r.type}: ${r.description}`).join('\n')}

**Risk Mitigation Framework**:
1. Conservative LTV (${(config.vaultConfiguration.crossCollateralization.ltv * 100).toFixed(0)}% vs ${(config.vaultConfiguration.crossCollateralization.liquidationLTV * 100).toFixed(0)}% liquidation)
2. Phased execution over ${config.timeline.total} ${config.timeline.unit}
3. Real-time monitoring of collateral health
4. Emergency unwinding procedures ready

**Overall Risk Level**: ${highRisks.length === 0 ? 'LOW' : highRisks.length <= 1 ? 'MEDIUM' : 'HIGH'}`;
  }

  explainGeneralRisks() {
    return `${this.personality.insights[1]} Key risks in EulerSwap DAO mergers:

**1. Liquidation Risk** (PRIMARY)
• Occurs if: Token prices move adversely vs USDC collateral
• Threshold: 93% LTV (we maintain 85% for safety)
• Mitigation: 8% buffer + continuous monitoring

**2. Vault Capacity Risk**
• Large swaps may exceed available liquidity
• Check vault utilization before executing
• Mitigation: Phase swaps or wait for better conditions

**3. Borrowing Cost Risk**
• High utilization increases borrow APR
• Can make merger expensive if rates spike
• Mitigation: Execute when utilization <80%

**4. Smart Contract Risk**
• Euler Protocol is audited but risks exist
• Cross-collateralization adds complexity
• Mitigation: Start with smaller test swaps

**5. Correlation Breakdown**
• Token correlation may change during merger
• Affects optimal concentration parameters
• Mitigation: Wider concentration bands for safety`;
  }

  generateStatusReport(context) {
    const { prices, treasuries, vaults, aiModules: modules } = context;
    
    return `${this.personality.greetings[1]} System Status Report:

**Data Collection**:
• Price Feeds: ${prices?.length || 0} tokens tracked
• Treasury Data: ${treasuries?.length || 0} DAOs monitored
• Vault Status: ${vaults ? 'CONNECTED' : 'LOADING'}

**AI Modules**:
${modules ? Object.entries(modules).map(([key, module]) => 
  `• ${module.name}: ${module.status.toUpperCase()} (${module.confidence}% confidence)`
).join('\n') : 'Loading...'}

**Vault Liquidity**:
${vaults ? `• Available: $${((vaults.cash || 0) / 1e6).toFixed(1)}M
• Utilization: ${((vaults.utilization || 0) * 100).toFixed(1)}%
• Borrow APR: ${(vaults.borrowAPR || 0).toFixed(2)}%` : 'Fetching...'}

**Recent Activity**:
${liveEvents.slice(0, 3).map(event => 
  `• ${event.title} (${this.getTimeAgo(event.timestamp)})`
).join('\n')}

Ready to analyze DAO merger opportunities with ${this.personality.confidence_phrases[4]} 5-7x capital efficiency.`;
  }

  // Utility methods

  containsKeywords(query, keywords) {
    return keywords.some(keyword => query.includes(keyword));
  }

  formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  getTimeAgo(timestamp) {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
}