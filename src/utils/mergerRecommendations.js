import { aiModules, liveEvents, marketData, circulationData } from '../services/mergerDataService';
import { decodeAmountCap, formatCapValue } from './eulerUtils';

export class MergerRecommendations {
  constructor() {
    this.personality = {
      greetings: [
        "Welcome to FORMULA merger analysis!",
        "Ready to optimize your DAO merger strategy.",
        "Let's explore one-sided JIT merger opportunities.",
        "EulerSwap merger simulator initialized."
      ],
      confidence_phrases: [
        "Analysis indicates",
        "Data strongly suggests",
        "Calculations confirm",
        "Metrics reveal",
        "One-sided JIT analysis shows"
      ],
      insights: [
        "Key observation:",
        "Important finding:",
        "Analysis result:",
        "Simulation insight:",
        "Price discovery metric:"
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
    const daoCount = circulationData.length;
    const highValueDAOs = circulationData.filter(t => t.marketCap > 50000000).length;
    const averageVolatility = marketData.reduce((sum, m) => sum + m.volatility, 0) / marketData.length;
    
    if (highValueDAOs >= 3 && averageVolatility < 0.4) {
      return {
        status: 'green',
        message: `${highValueDAOs} high-value tokens identified with stable volatility. Optimal conditions for one-sided JIT mergers.`,
        confidence: 94
      };
    } else if (daoCount >= 5) {
      return {
        status: 'yellow',
        message: `Analyzing ${daoCount} DAO tokens for merger opportunities. Market volatility at ${(averageVolatility * 100).toFixed(1)}%.`,
        confidence: 78
      };
    } else {
      return {
        status: 'yellow',
        message: 'Gathering market data and analyzing token circulation. Merger opportunities being evaluated.',
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
        response: `I'm designed to help with DAO merger analysis using EulerSwap's one-sided JIT liquidity model. Let me assist you with merger feasibility, price discovery, or simulation parameters instead.`
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
    const { feasibility, mergerType, swapConfiguration, vaultConfiguration, timeline, risks, mergerMetrics } = mergerConfig;

    // Primary merger simulation recommendation
    if (feasibility.viable) {
      recommendations.push({
        id: `sim-${mergerType}-${Date.now()}`,
        type: 'merger_simulation',
        priority: feasibility.score > 80 ? 'high' : feasibility.score > 60 ? 'medium' : 'low',
        title: `${mergerType.charAt(0).toUpperCase() + mergerType.slice(1).replace('_', ' ')} Merger Simulation`,
        description: feasibility.recommendation,
        
        simulationParams: {
          requiredMint: mergerMetrics.requiredMint,
          dilutionPercentage: mergerMetrics.dilutionPercentage,
          totalSwapAmount: swapConfiguration.totalSwapAmount,
          phasedOutToken: swapConfiguration.phasedOutToken,
          survivingToken: swapConfiguration.survivingToken,
          
          fundingNeeded: vaultConfiguration.fundingStrategy.totalRequired,
          fundingSource: vaultConfiguration.fundingStrategy.source,
          
          ammParams: {
            concentrationX: swapConfiguration.ammParameters.concentrationX / 1e18,
            concentrationY: swapConfiguration.ammParameters.concentrationY / 1e18,
            fee: swapConfiguration.ammParameters.fee / 1e18,
            equilibriumReserve0: swapConfiguration.ammParameters.equilibriumReserve0,
            equilibriumReserve1: swapConfiguration.ammParameters.equilibriumReserve1
          }
        },
        
        expectedOutcomes: {
          feasibilityScore: `${Math.round(feasibility.score * 100)}%`,
          priceImpact: `${mergerMetrics.priceImpact?.total?.toFixed(1) || 'N/A'}% total impact`,
          averageImpactPerBatch: `${mergerMetrics.priceImpact?.average?.toFixed(2) || 'N/A'}%`,
          timeline: timeline.total + ' ' + timeline.unit,
          dilution: `${mergerMetrics.dilutionPercentage.toFixed(1)}% for ${swapConfiguration.survivingToken} holders`
        },
        
        metrics: {
          vaultFundingNeeded: `${(vaultConfiguration.fundingStrategy.totalRequired / 1e6).toFixed(1)}M ${swapConfiguration.survivingToken}`,
          borrowAPR: `${vaultConfiguration.survivingVault.interestRateModel.description}`,
          marketCapRatio: `${mergerMetrics.marketCapRatio.toFixed(2)}:1`,
          totalValueSwapped: `$${(mergerMetrics.totalValueUSD / 1e6).toFixed(1)}M`
        },
        
        risks: risks.map(r => ({
          type: r.type,
          severity: r.severity,
          description: r.description,
          mitigation: r.mitigation
        }))
      });

      // Add funding preparation recommendation (always required for one-sided JIT)
      recommendations.push({
          id: `sim-funding-${Date.now()}`,
          type: 'vault_funding',
          priority: 'high',
          title: 'Vault Funding Preparation',
          description: `${swapConfiguration.survivingToken} DAO must fund vault before merger execution`,
          
          simulationParams: {
            tokenToMint: swapConfiguration.survivingToken,
            amountRequired: vaultConfiguration.fundingStrategy.totalRequired,
            dilutionImpact: mergerMetrics.dilutionPercentage,
            governanceRequired: true
          },
          
          expectedOutcomes: {
            timeToApproval: '3-7 days for governance vote',
            executionTime: '1 hour after approval',
            alternativeStrategy: 'Reduce merger size to avoid minting'
          },
          
          metrics: {
            fundingAsPercentOfSupply: `${mergerMetrics.dilutionPercentage.toFixed(1)}%`,
            vaultFundingRequired: `${(vaultConfiguration.fundingStrategy.totalRequired / 1e6).toFixed(1)}M tokens`
          },
          
          risks: [{
            type: 'governance',
            severity: 'medium',
            description: 'Token holders may reject dilutive minting',
            mitigation: 'Clear communication of merger benefits and long-term value'
          }]
        });
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
    const { mergerMetrics, volatilityAnalysis } = mergerConfig;
    const totalSwapAmount = mergerMetrics.requiredMint;
    const circulatingSupply = daoB.circulatingSupply || daoB.totalSupply || 1e9; // Fallback values
    
    // Determine optimal scenario based on conditions
    const volatilityA = volatilityAnalysis?.daoA?.volatility || 0.3;
    const volatilityB = volatilityAnalysis?.daoB?.volatility || 0.3;
    const avgVolatility = (volatilityA + volatilityB) / 2;
    
    // Price Discovery Scenarios
    
    // 1. Tight Discovery Scenario
    if (avgVolatility < 0.4 && mergerMetrics.marketCapRatio > 0.5 && mergerMetrics.marketCapRatio < 2) {
      variations.push({
        id: `scenario-tight-discovery-${Date.now()}`,
        type: 'price_discovery',
        priority: 'high',
        title: 'Tight Price Discovery (0.5, 0.95)',
        description: 'Minimal price impact within equilibrium zone, sharp discovery beyond',
        
        simulationParams: {
          concentrationX: 0.5,
          concentrationY: 0.95,
          discoveryEfficiency: 0.95,
          equilibriumZone: '±5% of equilibrium reserves',
          expectedImpactWithinZone: '0.1-0.5%',
          expectedImpactBeyondZone: 'Quadratic increase'
        },
        
        expectedOutcomes: {
          priceDiscoverySpeed: '95% discovery in first 10% of swaps',
          totalPriceImpact: `${this.calculateTightDiscoveryImpact(totalSwapAmount, circulatingSupply, totalSwapAmount * 0.1).toFixed(1)}%`,
          riskLevel: 'Low within zone, High beyond',
          bestFor: 'Stable tokens with high confidence in valuation'
        },
        
        metrics: {
          concentrationParameters: { X: 0.5, Y: 0.95 },
          impactFormula: 'Quadratic beyond 5% zone',
          avgBatchImpact: '0.5-1.0%'
        },
        
        risks: [{
          type: 'sharp_movement',
          severity: 'medium',
          description: 'Price can move sharply if swaps exceed equilibrium zone',
          mitigation: 'Monitor batch sizes and adjust if approaching zone boundary'
        }]
      });
    }
    
    // 2. Gradual Discovery Scenario (Default)
    variations.push({
      id: `scenario-gradual-discovery-${Date.now()}`,
      type: 'price_discovery',
      priority: avgVolatility >= 0.4 && avgVolatility <= 0.6 ? 'high' : 'medium',
      title: 'Gradual Price Discovery (0.35, 0.85)',
      description: 'Balanced approach with smooth price transitions',
      
      simulationParams: {
        concentrationX: 0.35,
        concentrationY: 0.85,
        discoveryEfficiency: 0.70,
        priceImpactModel: 'Linear with smoothing factor',
        smoothingRange: '0-30% based on progress'
      },
      
      expectedOutcomes: {
        priceDiscoverySpeed: '70% discovery in first 30% of swaps',
        totalPriceImpact: `${this.calculateGradualDiscoveryImpact(totalSwapAmount, circulatingSupply, totalSwapAmount).toFixed(1)}%`,
        riskLevel: 'Medium',
        bestFor: 'Moderate volatility tokens, standard mergers'
      },
      
      metrics: {
        concentrationParameters: { X: 0.35, Y: 0.85 },
        impactFormula: 'Linear with progress smoothing',
        avgBatchImpact: '2.0-3.0%'
      },
      
      risks: [{
        type: 'price_drift',
        severity: 'low',
        description: 'Gradual price movement may attract arbitrage',
        mitigation: 'Expected behavior - helps with price discovery'
      }]
    });
    
    // 3. Wide Discovery Scenario
    if (avgVolatility > 0.6 || mergerMetrics.marketCapRatio > 5 || mergerMetrics.marketCapRatio < 0.2) {
      variations.push({
        id: `scenario-wide-discovery-${Date.now()}`,
        type: 'price_discovery',
        priority: 'high',
        title: 'Wide Price Discovery (0.25, 0.75)',
        description: 'Maximum flexibility for volatile conditions',
        
        simulationParams: {
          concentrationX: 0.25,
          concentrationY: 0.75,
          discoveryEfficiency: 0.50,
          priceImpactModel: 'Near-constant rate',
          volatilityAbsorption: 'High'
        },
        
        expectedOutcomes: {
          priceDiscoverySpeed: '50% - gradual throughout execution',
          totalPriceImpact: `${this.calculateWideDiscoveryImpact(totalSwapAmount, circulatingSupply).toFixed(1)}%`,
          riskLevel: 'Low volatility risk, Higher slippage',
          bestFor: 'High volatility or large size differences'
        },
        
        metrics: {
          concentrationParameters: { X: 0.25, Y: 0.75 },
          impactFormula: 'Constant 3.5% per unit',
          avgBatchImpact: '3.0-4.0%'
        },
        
        risks: [{
          type: 'high_slippage',
          severity: 'medium',
          description: 'Higher constant slippage throughout execution',
          mitigation: 'Acceptable trade-off for volatility protection'
        }]
      });
    }
    
    // Execution Strategy Scenarios
    
    // 1. Rapid Execution
    const rapidStrategy = this.getRapidExecutionStrategy();
    variations.push({
      id: `scenario-rapid-execution-${Date.now()}`,
      type: 'execution_strategy',
      priority: mergerMetrics.priceImpact?.total < 5 ? 'high' : 'low',
      title: 'Rapid Execution (500 batches)',
      description: 'Front-loaded execution for quick completion',
      
      simulationParams: {
        numberOfBatches: rapidStrategy.batches,
        batchDistribution: 'Front-loaded: 30%→25%→20%→15%→10%',
        batchSizes: rapidStrategy.calculateBatchSizes(totalSwapAmount).map(size => 
          `${(size / 1e6).toFixed(1)}M ${mergerConfig.swapConfiguration.phasedOutToken}`
        ),
        impactMultiplier: rapidStrategy.priceImpactMultiplier
      },
      
      expectedOutcomes: {
        completionTime: rapidStrategy.estimateCompletion(),
        totalImpactAdjustment: `+${((rapidStrategy.priceImpactMultiplier - 1) * 100).toFixed(0)}% vs base`,
        executionRisk: 'Higher per-batch impact',
        bestFor: 'Time-sensitive mergers, stable markets'
      },
      
      metrics: {
        batchesPerDay: 1.7,
        frontLoadingRatio: '55% in first 2 batches',
        marketResponseTime: 'Limited'
      },
      
      risks: [{
        type: 'market_impact',
        severity: 'medium',
        description: 'Large initial batches may move market significantly',
        mitigation: 'Suitable only for liquid tokens or urgent situations'
      }]
    });
    
    // 2. Gradual Execution
    const gradualStrategy = this.getGradualExecutionStrategy();
    variations.push({
      id: `scenario-gradual-execution-${Date.now()}`,
      type: 'execution_strategy',
      priority: 'medium',
      title: 'Gradual Execution (1000 batches)',
      description: 'Even distribution for minimal market impact',
      
      simulationParams: {
        numberOfBatches: gradualStrategy.batches,
        batchDistribution: 'Equal 0.1% batches',
        batchSize: `${(totalSwapAmount / 1000 / 1e6).toFixed(1)}M ${mergerConfig.swapConfiguration.phasedOutToken}`,
        impactMultiplier: gradualStrategy.priceImpactMultiplier
      },
      
      expectedOutcomes: {
        completionTime: gradualStrategy.estimateCompletion(),
        totalImpactAdjustment: `-${((1 - gradualStrategy.priceImpactMultiplier) * 100).toFixed(0)}% vs base`,
        executionRisk: 'Lower, well distributed',
        bestFor: 'Large mergers, price-sensitive situations'
      },
      
      metrics: {
        batchesPerDay: 1.0,
        consistencyScore: '100% - equal batches',
        marketAbsorption: 'Excellent'
      },
      
      risks: [{
        type: 'extended_timeline',
        severity: 'low',
        description: 'Extended execution may face changing market conditions',
        mitigation: 'Monitor and adjust if volatility increases'
      }]
    });
    
    // 3. Dynamic Execution (if high volatility)
    if (avgVolatility > 0.5) {
      const dynamicStrategy = this.getDynamicExecutionStrategy();
      variations.push({
        id: `scenario-dynamic-execution-${Date.now()}`,
        type: 'execution_strategy',
        priority: 'high',
        title: 'Dynamic Execution (Adaptive)',
        description: 'Batch size adjusts to maintain 2% target impact',
        
        simulationParams: {
          numberOfBatches: '500-1500 (adaptive)',
          targetImpact: '2% per batch',
          adjustmentLogic: '3-10% of remaining based on impact',
          volatilityMultiplier: avgVolatility > 0.5 ? 1.5 : 1.0
        },
        
        expectedOutcomes: {
          completionTime: dynamicStrategy.estimateCompletion(avgVolatility),
          impactControl: 'Maintains consistent 2% target',
          executionRisk: 'Managed dynamically',
          bestFor: 'Volatile markets, uncertain conditions'
        },
        
        metrics: {
          adaptability: 'High',
          targetImpactMaintenance: '±0.5% of target',
          responseToVolatility: 'Automatic adjustment'
        },
        
        risks: [{
          type: 'complexity',
          severity: 'low',
          description: 'Requires active monitoring and adjustment',
          mitigation: 'Automated adjustment logic minimizes manual intervention'
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

      // Extract data from mergerConfig
      const { swapConfiguration, vaultConfiguration, mergerMetrics } = mergerConfig;
      const fundingRequired = mergerMetrics.requiredMint || vaultConfiguration.fundingStrategy.totalRequired;
      const survivingToken = swapConfiguration.survivingToken;
      const phasedOutToken = swapConfiguration.phasedOutToken;
      
      // Extract AMM parameters
      const concentrationX = (swapConfiguration.ammParameters.concentrationX || 0) / 1e18;
      const concentrationY = (swapConfiguration.ammParameters.concentrationY || 0) / 1e18;
      const fee = (swapConfiguration.ammParameters.fee || 0) / 1e18;
      const equilibriumReserve0 = swapConfiguration.ammParameters.equilibriumReserve0 || 0;
      const equilibriumReserve1 = swapConfiguration.ammParameters.equilibriumReserve1 || 0;
      
      // Determine execution strategy from recommendation or config
      const executionType = recommendation.simulationParams?.numberOfBatches || 
                           mergerConfig.numberOfBatches || 
                           20;
      let batchDetails;
      if (executionType === 500) {
        batchDetails = 'Rapid execution (500 batches)';
      } else if (executionType === 1000) {
        batchDetails = 'Gradual execution (1000 batches)';
      } else if (typeof executionType === 'number') {
        batchDetails = `${executionType} equal batches`;
      } else {
        batchDetails = 'Adaptive batching (10-30 batches)';
      }

      const steps = [
        {
          id: 'governance-approval',
          name: 'Governance Approval',
          description: `${survivingToken} DAO approves token minting for vault funding`,
          details: [
            `Proposal: Mint ${this.formatNumber(fundingRequired)} ${survivingToken} tokens`,
            `Dilution impact: ${mergerMetrics.dilutionPercentage.toFixed(1)}%`,
            `Purpose: Fund vault for ${phasedOutToken} merger`,
            `Expected timeline: 3-7 days for vote`
          ],
          duration: '3-7 days',
          status: 'pending'
        },
        {
          id: 'vault-deployment',
          name: 'Deploy Euler Vaults',
          description: 'Deploy vaults for both tokens with asymmetric configuration',
          details: [
            `${phasedOutToken} vault: Zero interest rate (0% IRM)`,
            `${survivingToken} vault: Dynamic IRM (0-4% base, kink at 80%)`,
            `Supply caps: ${formatCapValue(decodeAmountCap(0xFFFF))}`,
            `Borrow caps: ${formatCapValue(decodeAmountCap(0xFFFF))}`
          ],
          duration: '30 minutes',
          status: 'pending'
        },
        {
          id: 'vault-funding',
          name: `Fund ${survivingToken} Vault`,
          description: 'Mint and deposit tokens into surviving token vault',
          details: [
            `Mint ${this.formatNumber(fundingRequired)} ${survivingToken} tokens`,
            `Deposit into ${survivingToken} vault`,
            `Creates borrowable liquidity for JIT swaps`,
            `No funding needed for ${phasedOutToken} vault`
          ],
          duration: '1 hour',
          status: 'pending'
        },
        {
          id: 'deploy-eulerswap',
          name: 'Initialize One-Sided EulerSwap Pool',
          description: 'Deploy asymmetric curve for unidirectional swaps',
          details: [
            `Concentration X: ${concentrationX.toFixed(2)} (${phasedOutToken})`,
            `Concentration Y: ${concentrationY.toFixed(2)} (${survivingToken})`,
            `Fee tier: ${(fee * 100).toFixed(2)}%`,
            `Initial reserves: 0 / ${this.formatNumber(equilibriumReserve1)}`,
            `One-sided: ${phasedOutToken} → ${survivingToken} only`
          ],
          duration: '15 minutes',
          status: 'pending'
        },
        {
          id: 'execute-batch-swaps',
          name: 'Execute Merger Swaps',
          description: `Batch execution strategy: ${batchDetails}`,
          details: [
            `Total amount: ${this.formatNumber(mergerMetrics.requiredMint)} ${phasedOutToken}`,
            `Price impact: Calculated during execution`,
            `Execution timeline: ${recommendation.expectedOutcomes?.completionTime?.realistic || '10-20'} days`,
            `JIT borrowing from ${survivingToken} vault per swap`
          ],
          duration: `${recommendation.expectedOutcomes?.completionTime?.realistic || '10-20'} days`,
          status: 'pending'
        },
        {
          id: 'price-discovery-monitoring',
          name: 'Monitor Price Discovery',
          description: 'Track price evolution and discovery efficiency',
          details: [
            `Discovery type: ${recommendation.title || 'Gradual Discovery'}`,
            `Expected efficiency: ${recommendation.simulationParams?.discoveryEfficiency ? (recommendation.simulationParams.discoveryEfficiency * 100).toFixed(0) + '%' : '70%'}`,
            `Monitor batch impacts vs targets`,
            `Adjust execution if needed`
          ],
          duration: 'Throughout execution',
          status: 'pending'
        },
        {
          id: 'completion-verification',
          name: 'Verify Merger Completion',
          description: 'Confirm final token distributions',
          details: [
            `${phasedOutToken} holders: Now own ${survivingToken}`,
            `${survivingToken} holders: ${mergerMetrics.dilutionPercentage.toFixed(1)}% diluted`,
            `Final price discovery: Market-determined`,
            `Total value merged: $${this.formatNumber(mergerMetrics.totalValueUSD)}`
          ],
          duration: '1 hour',
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
    const { prices, circulationData, mergerConfiguration, selectedDaoA, selectedDaoB } = context;

    // Handle queries based on available data
    if (this.containsKeywords(lowercaseQuery, ['how', 'work', 'explain', 'what is'])) {
      if (lowercaseQuery.includes('one') || lowercaseQuery.includes('sided') || lowercaseQuery.includes('jit')) {
        return this.explainOneSidedJIT();
      }
      if (lowercaseQuery.includes('euler') || lowercaseQuery.includes('swap')) {
        return this.explainEulerSwapMechanism();
      }
    }

    // Queries requiring DAO selection
    if (this.containsKeywords(lowercaseQuery, ['merger', 'merge', 'feasibility', 'simulate'])) {
      if (!selectedDaoA || !selectedDaoB) {
        return `${this.personality.insights[0]} To analyze merger feasibility, please select two DAOs from our tracked list. I have data on ${circulationData?.length || 0} tokens with circulation data available.`;
      }
      if (!mergerConfiguration) {
        return `${this.personality.insights[1]} Calculating merger configuration for ${selectedDaoA.symbol} and ${selectedDaoB.symbol}. This analysis will include feasibility scoring, optimal swap parameters, and price discovery scenarios.`;
      }
      return this.analyzeMergerFeasibility(mergerConfiguration, selectedDaoA, selectedDaoB);
    }

    // Circulation analysis (can work with general data)
    if (this.containsKeywords(lowercaseQuery, ['circulation', 'supply', 'market', 'tokens'])) {
      const circulation = context.circulation || circulationData;
      if (!circulation || circulation.length === 0) {
        return `${this.personality.insights[2]} Token circulation data is being loaded. Please ensure the backend service is running.`;
      }
      return this.analyzeTokenLandscape(circulation);
    }

    // Vault questions - explain that vaults are deployed per-merger
    if (this.containsKeywords(lowercaseQuery, ['vault', 'liquidity', 'available', 'capacity'])) {
      return `${this.personality.insights[3]} In the one-sided JIT model, vaults are deployed specifically for each merger. The surviving token's DAO must deploy and fund a vault with sufficient tokens before merger execution. No pre-existing vaults are used.`;
    }

    // Price discovery questions
    if (this.containsKeywords(lowercaseQuery, ['price', 'discovery', 'impact', 'concentration'])) {
      if (mergerConfiguration) {
        return this.explainPriceDiscovery(mergerConfiguration);
      }
      return this.explainGeneralPriceDiscovery();
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
    return `${this.generateGreeting()} I can help you analyze DAO mergers using EulerSwap's one-sided JIT liquidity model. You can ask about:
- Token circulation and merger feasibility
- One-sided JIT liquidity mechanics
- Price discovery and concentration parameters
- Batch execution strategies
- Risk assessments and timeline planning

${circulationData?.length > 0 ? `I have data on ${circulationData.length} DAO tokens ready for analysis.` : 'Token data is loading...'}`;
  }

  // Helper methods for responses

  explainOneSidedJIT() {
    return `${this.personality.insights[0]} One-sided JIT liquidity in EulerSwap revolutionizes DAO mergers:

**How It Works:**
1. **Single-Sided Funding**: Only the surviving DAO pre-funds their vault with minted tokens
2. **Asymmetric Pool**: Phased-out token can only swap TO surviving token (not vice versa)
3. **JIT Borrowing**: Each swap borrows surviving tokens from vault on-demand
4. **Natural Price Discovery**: 
   - Low concentration for phased-out token (0.25-0.5)
   - High concentration for surviving token (0.75-0.95)
5. **Market-Driven Exit**: One-way swaps create natural selling pressure

**Key Innovation**: No bilateral funding needed - phased-out token holders can exit to surviving token through natural market dynamics.`;
  }

  explainEulerSwapMechanism() {
    return `${this.personality.conclusions[0]} EulerSwap revolutionizes AMM design through just-in-time liquidity:

**Core Innovation**: Instead of locking liquidity in pools, EulerSwap borrows it from Euler lending vaults on-demand.

**Mechanism:**
1. **No Pre-Funded Pools**: Liquidity providers deposit in Euler vaults, earning yield
2. **JIT Borrowing**: When swaps occur, the AMM borrows needed tokens
3. **Concentrated Curves**: Uses Uniswap v3-style concentration for precise price discovery
4. **Automatic Repayment**: Swap output repays the borrow instantly

**For DAO Mergers**: This enables massive token swaps through:
- One-sided liquidity provision (only surviving token needs funding)
- JIT borrowing reduces capital requirements
- Dynamic price discovery through concentrated AMM curves`;
  }

  analyzeMergerFeasibility(config, daoA, daoB) {
    return `${this.personality.conclusions[1]} ${daoA.symbol}-${daoB.symbol} Merger Analysis:

**Feasibility Score**: ${Math.round(config.feasibility.score * 100)}% (${config.feasibility.viable ? 'VIABLE' : 'NOT RECOMMENDED'})
**Merger Type**: ${config.mergerType.replace('_', ' ').toUpperCase()}

**Optimal Configuration**:
• Swap Size: ${(config.swapConfiguration.sizes.percentageA).toFixed(1)}% of circulating supply
• ${daoA.symbol}: ${this.formatNumber(config.swapConfiguration.sizes.tokenAAmount)} tokens ($${this.formatNumber(config.swapConfiguration.sizes.tokenAAmount * daoA.price)})
• ${daoB.symbol}: ${this.formatNumber(config.swapConfiguration.sizes.tokenBAmount)} tokens ($${this.formatNumber(config.swapConfiguration.sizes.tokenBAmount * daoB.price)})

**Capital Requirements**:
• Required Mint Amount: ${this.formatNumber(config.requiredMint)} ${daoB.symbol} tokens
• Dilution Impact: ${config.dilutionPercentage?.toFixed(2) || '0.00'}%
• Model: One-sided JIT liquidity (surviving token only)

**Risk Assessment**: ${config.risks.filter(r => r.severity === 'high').length} high-risk factors
${config.feasibility.recommendation}`;
  }

  analyzeTokenLandscape(circulation) {
    const totalMarketCap = circulation.reduce((sum, token) => sum + (token.marketCap || 0), 0);
    const avgSupply = circulation.reduce((sum, token) => sum + (token.circulatingSupply || 0), 0) / circulation.length;
    const largeCapTokens = circulation.filter(token => token.marketCap > 100000000); // >$100M

    return `${this.personality.insights[2]} DAO Token Landscape:

**Overview**:
• Total Market Cap: $${(totalMarketCap / 1e9).toFixed(1)}B across ${circulation.length} tokens
• Average Circulating Supply: ${(avgSupply / 1e6).toFixed(1)}M tokens
• Large-Cap DAOs: ${largeCapTokens.length} with >$100M market cap

**Top 5 by Market Cap**:
${circulation.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)).slice(0, 5).map((token, i) => 
  `${i + 1}. ${token.symbol}: $${((token.marketCap || 0) / 1e6).toFixed(0)}M (${((token.circulatingSupply || 0) / 1e6).toFixed(0)}M supply)`
).join('\n')}

**Merger Suitability**: Tokens with similar market caps (0.5-2x ratio) and moderate supplies are ideal for one-sided JIT mergers.`;
  }


  explainPriceDiscovery(config) {
    const priceImpact = config.mergerMetrics?.priceImpact?.total || 5;
    const concentrationX = (config.swapConfiguration.ammParameters.concentrationX / 1e18).toFixed(2);
    const concentrationY = (config.swapConfiguration.ammParameters.concentrationY / 1e18).toFixed(2);
    
    return `${this.personality.confidence_phrases[0]} price discovery mechanics for this merger:

**Asymmetric Concentration Parameters**:
• ${config.swapConfiguration.phasedOutToken}: ${concentrationX} (lower = wider price range)
• ${config.swapConfiguration.survivingToken}: ${concentrationY} (higher = tighter liquidity)

**Price Discovery Dynamics**:
• Total Expected Impact: ${priceImpact.toFixed(1)}%
• Discovery Type: ${concentrationX < 0.3 ? 'Wide' : concentrationX < 0.4 ? 'Gradual' : 'Tight'}
• Market Response: ${concentrationY > 0.9 ? 'Sharp near equilibrium' : 'Smooth transitions'}

**How Concentration Affects Price**:
1. Low concentration (${config.swapConfiguration.phasedOutToken}): Accepts wide price ranges
2. High concentration (${config.swapConfiguration.survivingToken}): Provides liquidity depth
3. Asymmetry creates natural discovery pressure

**Batch Impact Breakdown**:
${config.mergerMetrics?.priceImpact?.breakdown ? 
  config.mergerMetrics.priceImpact.breakdown.slice(0, 3).map(b => 
    `• Batch ${b.batch}: ${b.priceImpact.toFixed(2)}% impact`
  ).join('\n') : '• Impacts calculated per batch based on size'}

**Result**: Market-driven price discovery without artificial constraints.`;
  }

  explainGeneralPriceDiscovery() {
    return `${this.personality.insights[4]} EulerSwap's price discovery for DAO mergers:

**Traditional AMM**: Requires deep bilateral liquidity for stable prices
**EulerSwap One-Sided**: Natural discovery through asymmetric parameters

**How Dynamic Discovery Works**:
1. **Asymmetric Concentrations**
   - Phased-out token: 0.25-0.5 (accepts price movement)
   - Surviving token: 0.75-0.95 (provides stability)
   
2. **One-Way Liquidity**
   - Only phased-out → surviving swaps allowed
   - Creates natural selling pressure
   - Market finds true exchange rate
   
3. **Batch Execution**
   - 5-30 batches based on strategy
   - Each batch discovers incremental price
   - Total impact distributed over time

**Example**: 100M token merger
- Tight Discovery: 3-5% total impact, 95% discovery in first 10%
- Gradual Discovery: 5-8% total impact, smooth transitions
- Wide Discovery: 8-15% total impact, handles high volatility`;
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
1. Dynamic concentration parameters (${(config.swapConfiguration?.ammParameters?.concentrationX / 1e18 || 0.5).toFixed(2)} / ${(config.swapConfiguration?.ammParameters?.concentrationY / 1e18 || 0.9).toFixed(2)})
2. Phased execution over ${config.timeline?.total || '7-10'} ${config.timeline?.unit || 'days'}
3. Real-time monitoring of price impact and dilution
4. Batch size optimization for minimal market disruption

**Overall Risk Level**: ${highRisks.length === 0 ? 'LOW' : highRisks.length <= 1 ? 'MEDIUM' : 'HIGH'}`;
  }

  explainGeneralRisks() {
    return `${this.personality.insights[1]} Key risks in one-sided EulerSwap mergers:

**1. Dilution Risk** (PRIMARY)
• Surviving DAO must mint tokens upfront
• Dilution before value realization
• Mitigation: Clear governance communication

**2. Price Impact Risk**
• Large batches cause significant slippage
• Concentration parameters affect severity
• Mitigation: Optimize batch sizing and timing

**3. Vault Funding Risk**
• Must pre-fund entire merger amount
• Opportunity cost of locked capital
• Mitigation: Efficient execution timeline

**4. Discovery Efficiency Risk**
• Market may not converge to expected price
• External factors affect discovery
• Mitigation: Flexible concentration parameters

**5. Execution Timeline Risk**
• Extended timelines face market changes
• Governance delays compound risk
• Mitigation: Clear roadmap and contingencies`;
  }

  generateStatusReport(context) {
    const { aiModules: modules, selectedDaoA, selectedDaoB, mergerConfiguration } = context;
    const circulation = context.circulation || circulationData;
    const prices = marketData;
    
    return `${this.personality.greetings[1]} System Status Report:

**Data Collection**:
• Price Feeds: ${prices?.length || 0} tokens tracked
• Circulation Data: ${circulation?.length || 0} tokens monitored

**AI Modules**:
${modules ? Object.entries(modules).map(([, module]) => 
  `• ${module.name}: ${module.status.toUpperCase()} (${module.confidence}% confidence)`
).join('\n') : 'Loading...'}

**Merger Analysis**:
• Current Pair: ${selectedDaoA && selectedDaoB ? `${selectedDaoA.symbol}-${selectedDaoB.symbol}` : 'None selected'}
• Configuration: ${mergerConfiguration ? 'Calculated' : 'Not analyzed'}
• Model: One-sided JIT liquidity

**Recent Activity**:
${liveEvents.slice(0, 3).map(event => 
  `• ${event.title} (${this.getTimeAgo(event.timestamp)})`
).join('\n')}

Ready to analyze one-sided JIT merger opportunities with dynamic price discovery.`;
  }

  // Utility methods

  containsKeywords(query, keywords) {
    return keywords.some(keyword => query.includes(keyword));
  }

  formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
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

  // Price Discovery Scenario Calculations
  
  calculateTightDiscoveryImpact(swapSize, totalSupply, equilibriumReserve1) {
    // With high concentrationY (0.95), the curve is very flat near equilibrium
    const equilibriumZone = equilibriumReserve1 * 0.05;
    
    if (swapSize <= equilibriumZone) {
      // Within tight band: impact ≈ 0.1-0.5%
      return swapSize / totalSupply * 0.1;
    } else {
      // Outside band: impact accelerates rapidly
      const excess = (swapSize - equilibriumZone) / equilibriumZone;
      return 0.5 + (excess * excess * 5); // Quadratic increase
    }
  }
  
  calculateGradualDiscoveryImpact(swapSize, totalSupply, totalSwapAmount) {
    // More linear price impact with moderate concentrations
    const baseImpact = (swapSize / totalSupply) * 2.5;
    
    // Smoothing factor based on swap progress
    const progress = swapSize / totalSwapAmount;
    const smoothingFactor = 1 + (progress * 0.3);
    
    return baseImpact * smoothingFactor;
  }
  
  calculateWideDiscoveryImpact(swapSize, totalSupply) {
    // Nearly constant impact rate for low concentrations
    const constantImpact = 3.5; // percentage
    const sizeMultiplier = swapSize / totalSupply;
    
    return constantImpact * sizeMultiplier;
  }
  
  // Execution Strategy Calculations
  
  getRapidExecutionStrategy() {
    return {
      batches: 500,
      
      calculateBatchSizes: (totalAmount) => {
        // Front-loaded distribution across 500 batches
        // First 100: 0.3% each (30% total)
        // Next 100: 0.25% each (25% total)
        // Next 100: 0.2% each (20% total)
        // Next 100: 0.15% each (15% total)
        // Last 100: 0.1% each (10% total)
        const batchSizes = [];
        
        for (let i = 0; i < 100; i++) batchSizes.push(totalAmount * 0.003);   // 30%
        for (let i = 0; i < 100; i++) batchSizes.push(totalAmount * 0.0025);  // 25%
        for (let i = 0; i < 100; i++) batchSizes.push(totalAmount * 0.002);   // 20%
        for (let i = 0; i < 100; i++) batchSizes.push(totalAmount * 0.0015);  // 15%
        for (let i = 0; i < 100; i++) batchSizes.push(totalAmount * 0.001);   // 10%
        
        return batchSizes;
      },
      
      estimateCompletion: () => ({
        optimistic: 3,
        realistic: 5,
        conservative: 7
      }),
      
      priceImpactMultiplier: 1.1 // Lower multiplier due to smaller batches
    };
  }
  
  getGradualExecutionStrategy() {
    return {
      batches: 1000,
      
      calculateBatchSizes: (totalAmount) => {
        const batchSize = totalAmount / 1000;
        return Array(1000).fill(batchSize);
      },
      
      estimateCompletion: () => ({
        optimistic: 10,
        realistic: 20,
        conservative: 30
      }),
      
      priceImpactMultiplier: 0.5 // Much lower due to tiny batches
    };
  }
  
  getDynamicExecutionStrategy() {
    return {
      batches: 'adaptive',
      
      calculateNextBatch: (remainingAmount, currentImpact, targetImpact = 2.0) => {
        if (currentImpact > targetImpact) {
          return remainingAmount * 0.03;
        } else if (currentImpact < targetImpact * 0.5) {
          return remainingAmount * 0.1;
        } else {
          return remainingAmount * 0.05;
        }
      },
      
      estimateCompletion: (volatility) => {
        const volatilityFactor = volatility > 0.5 ? 1.5 : 1.0;
        return {
          optimistic: 7 * volatilityFactor,
          realistic: 15 * volatilityFactor,
          conservative: 25 * volatilityFactor
        };
      }
    };
  }
  
  // Analysis Functions
  
  measureDiscoveryEfficiency(executedSwaps, totalSwaps, currentPrice, targetPrice) {
    const progress = executedSwaps / totalSwaps;
    const priceConvergence = currentPrice / targetPrice;
    
    return {
      swapProgress: progress * 100,
      priceConvergence: priceConvergence * 100,
      efficiency: (priceConvergence / progress) * 100
    };
  }
  
  analyzeBatchImpact(batchSize, totalSupply, scenario = 'gradual') {
    let impact;
    
    switch(scenario) {
      case 'tight':
        impact = this.calculateTightDiscoveryImpact(batchSize, totalSupply, totalSupply * 0.1);
        break;
      case 'wide':
        impact = this.calculateWideDiscoveryImpact(batchSize, totalSupply);
        break;
      default:
        impact = this.calculateGradualDiscoveryImpact(batchSize, totalSupply, totalSupply);
    }
    
    const slippageTolerance = 3.0; // 3%
    
    return {
      impact,
      acceptable: impact < slippageTolerance,
      suggestedAdjustment: impact > slippageTolerance 
        ? batchSize * (slippageTolerance / impact)
        : batchSize
    };
  }
}