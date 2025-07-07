import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Loader2,
  Play,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
// Dynamic recommendations will be generated based on selected DAOs
import { MergerRecommendations } from '../utils/mergerRecommendations';
import SuccessNotification from './SuccessNotification';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useLiquidGlass } from './SimpleLiquidGlass';

const SimulationPage = () => {
  const { 
    prices,
    treasuries,
    vaults,
    mergerConfiguration,
    analysis, 
    isAnalyzing, 
    analysisError, 
    performAnalysis,
    calculateMergerConfig,
    loading: dataLoading
  } = useData();
  
  const [selectedDaoA, setSelectedDaoA] = useState(null);
  const [selectedDaoB, setSelectedDaoB] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [simulationSteps, setSimulationSteps] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mergerAI] = useState(() => new MergerRecommendations());
  const [simulationMode, setSimulationMode] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [currentSimulationStep, setCurrentSimulationStep] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [successNotification, setSuccessNotification] = useState({
    show: false,
    title: '',
    message: '',
    impact: null,
    details: null
  });
  
  // Liquid glass refs for major sections
  const heroRef = useLiquidGlass({ width: 800, height: 300 });
  const recommendationsRef = useLiquidGlass({ width: 700, height: 400 });
  const actionsRef = useLiquidGlass({ width: 600, height: 200 });

  // Handle DAO selection and merger calculation
  useEffect(() => {
    const calculateMerger = async () => {
      if (!selectedDaoA?.symbol || !selectedDaoB?.symbol) {
        setRecommendations([]);
        setSimulationSteps([]);
        return;
      }

      setIsCalculating(true);
      try {
        // Calculate merger configuration
        const config = await calculateMergerConfig(selectedDaoA, selectedDaoB);
        
        // Generate recommendations from configuration
        const mergerRecommendations = mergerAI.generateMergerRecommendations(
          config,
          selectedDaoA,
          selectedDaoB
        );
        
        setRecommendations(mergerRecommendations);
        
        // Generate simulation steps for the primary recommendation
        if (mergerRecommendations.length > 0) {
          const steps = mergerAI.generateSimulationSteps(
            mergerRecommendations[0],
            config
          );
          setSimulationSteps(steps);
        }
      } catch (error) {
        console.error('Error calculating merger:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateMerger();
  }, [selectedDaoA?.symbol, selectedDaoB?.symbol]);

  const handleSimulateAction = (recommendation) => {
    // Check if simulation steps are available
    if (!simulationSteps || simulationSteps.length === 0) {
      console.error('No simulation steps available');
      return;
    }
    
    // Start interactive simulation with step-by-step panels
    setActiveSimulation({
      recommendation,
      config: mergerConfiguration,
      steps: simulationSteps,
      startTime: Date.now()
    });
    setCurrentSimulationStep(0);
    setSimulationMode(true);
    setStepCompleted(false);
    setCompletedSteps(new Set());
  };

  const handleSimulationStepNext = () => {
    const currentStep = simulationSteps[currentSimulationStep];
    
    // Check if currentStep exists
    if (!currentStep) {
      console.error('Current step is undefined:', { currentSimulationStep, simulationStepsLength: simulationSteps.length });
      return;
    }
    
    // If step not yet completed, mark it as completed and show success message
    if (!stepCompleted) {
      setStepCompleted(true);
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      
      // Show success message for current step (handled in rendering)
      setTimeout(() => {
        if (currentSimulationStep < simulationSteps.length - 1) {
          setCurrentSimulationStep(prev => prev + 1);
          setStepCompleted(false);
        } else {
          // Final simulation complete
          setSuccessNotification({
            show: true,
            title: 'Merger Simulation Complete',
            message: `Successfully simulated ${selectedDaoA.symbol}-${selectedDaoB.symbol} merger with ${mergerConfiguration.capitalEfficiency.leverageMultiple}x capital efficiency.`,
            impact: {
              efficiency: `${mergerConfiguration.capitalEfficiency.leverageMultiple}x vs traditional AMM`,
              feasibility: `${Math.round(mergerConfiguration.feasibility.score * 100)}% success probability`,
              totalValue: `$${(mergerConfiguration.swapConfiguration.sizes.totalValueUSD / 1e6).toFixed(1)}M swapped`,
              collateral: `$${(((mergerConfiguration.swapConfiguration.collateral?.daoA?.usdcRequired || 0) + 
                           (mergerConfiguration.swapConfiguration.collateral?.daoB?.usdcRequired || 0)) / 1e6).toFixed(1)}M USDC used`
            },
            details: {
              daoA: `${selectedDaoA.symbol} now holds ${(mergerConfiguration.swapConfiguration.sizes.tokenBAmount || 0).toLocaleString()} ${selectedDaoB.symbol}`,
              daoB: `${selectedDaoB.symbol} now holds ${(mergerConfiguration.swapConfiguration.sizes.tokenAAmount || 0).toLocaleString()} ${selectedDaoA.symbol}`,
              crossDeposits: `${mergerConfiguration.vaultConfiguration.crossCollateralization.crossDepositMultiplier}x liquidity multiplier achieved`
            }
          });
          setActiveSimulation(null);
          setSimulationMode(false);
          setCompletedSteps(new Set());
        }
      }, 1500); // Show success state for 1.5 seconds before proceeding
    }
  };

  const handleSimulationStepPrev = () => {
    if (currentSimulationStep > 0) {
      setCurrentSimulationStep(prev => prev - 1);
    }
  };

  const handleSimulationCancel = () => {
    setActiveSimulation(null);
    setSimulationMode(false);
    setCurrentSimulationStep(0);
    setStepCompleted(false);
    setCompletedSteps(new Set());
  };

  // Render step-specific results based on calculated merger configuration
  const renderStepResults = () => {
    if (!activeSimulation || !mergerConfiguration) return null;
    
    const currentStep = simulationSteps[currentSimulationStep];
    if (!currentStep) return null;

    switch (currentStep.id) {
      case 'collateral-setup':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Vault State After Collateral Deployment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">USDC Vault Utilization</div>
                <div className="text-2xl font-light text-white">
                  {((mergerConfiguration.vaultConfiguration.usdc.utilization || 0) * 100).toFixed(1)}%
                </div>
                <div className="text-white/50 text-xs mt-1">
                  After: {((mergerConfiguration.vaultConfiguration.usdc.utilizationImpact?.newUtilization || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Total Collateral Deployed</div>
                <div className="text-2xl font-light text-white">
                  ${(((mergerConfiguration.swapConfiguration.collateral?.daoA?.usdcRequired || 0) + 
                     (mergerConfiguration.swapConfiguration.collateral?.daoB?.usdcRequired || 0)) / 1e6).toFixed(1)}M
                </div>
                <div className="text-white/50 text-xs mt-1">
                  LTV: {(mergerConfiguration.vaultConfiguration.crossCollateralization.ltv * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        );

      case 'borrow-native-tokens':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Borrowing Calculations</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Borrowing Power Utilized</div>
                <div className="text-2xl font-light text-white">
                  {((mergerConfiguration.vaultConfiguration.crossCollateralization.ltv || 0.85) * 100).toFixed(0)}%
                </div>
                <div className="text-white/50 text-xs mt-1">
                  Buffer to liquidation: {(((mergerConfiguration.vaultConfiguration.crossCollateralization.liquidationLTV || 0.93) - 
                    (mergerConfiguration.vaultConfiguration.crossCollateralization.ltv || 0.85)) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Borrowing Cost</div>
                <div className="text-2xl font-light text-white">
                  {(mergerConfiguration.vaultConfiguration.usdc.borrowAPR || 0).toFixed(2)}% APR
                </div>
                <div className="text-white/50 text-xs mt-1">
                  Daily: ${((mergerConfiguration.swapConfiguration.sizes.totalValueUSD * 
                    (mergerConfiguration.vaultConfiguration.usdc.borrowAPR || 0) / 365 / 100) || 0).toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'deploy-eulerswap':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
            <h4 className="text-lg font-medium text-white mb-4">EulerSwap Pool Configuration</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Price Ratio</div>
                <div className="text-xl font-light text-white">
                  {((mergerConfiguration.swapConfiguration.ammParameters.priceY || 1) / 
                    (mergerConfiguration.swapConfiguration.ammParameters.priceX || 1)).toFixed(4)}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Concentration</div>
                <div className="text-xl font-light text-white">
                  {((mergerConfiguration.swapConfiguration.ammParameters.concentrationX || 0) / 1e18).toFixed(2)}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Fee Tier</div>
                <div className="text-xl font-light text-white">
                  {((mergerConfiguration.swapConfiguration.ammParameters.fee || 0.003e18) / 1e18 * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        );

      case 'execute-swaps':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Swap Execution Results</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">{selectedDaoA?.symbol} → {selectedDaoB?.symbol}</div>
                <div className="text-xl font-light text-white">
                  {(mergerConfiguration.swapConfiguration.sizes.tokenAAmount || 0).toLocaleString()}
                </div>
                <div className="text-white/50 text-xs mt-1">
                  {(mergerConfiguration.swapConfiguration.sizes.percentageA || 0).toFixed(1)}% of treasury
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">{selectedDaoB?.symbol} → {selectedDaoA?.symbol}</div>
                <div className="text-xl font-light text-white">
                  {(mergerConfiguration.swapConfiguration.sizes.tokenBAmount || 0).toLocaleString()}
                </div>
                <div className="text-white/50 text-xs mt-1">
                  {(mergerConfiguration.swapConfiguration.sizes.percentageB || 0).toFixed(1)}% of treasury
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <div className="text-white/60 text-sm mb-1">Cross-Deposit Effect</div>
              <div className="text-white text-sm">
                Each swap deposits tokens in opposite vault, multiplying available liquidity by {mergerConfiguration.vaultConfiguration.crossCollateralization.crossDepositMultiplier}x
              </div>
            </div>
          </div>
        );

      case 'monitor-positions':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Risk Monitoring Parameters</h4>
            <div className="grid grid-cols-2 gap-4">
              {mergerConfiguration.risks.slice(0, 2).map((risk, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-lg">
                  <div className="text-white/60 text-sm mb-1">{risk.type.charAt(0).toUpperCase() + risk.type.slice(1)} Risk</div>
                  <div className={`text-lg font-medium ${
                    risk.severity === 'high' ? 'text-red-400' : 
                    risk.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {risk.severity.toUpperCase()}
                  </div>
                  <div className="text-white/50 text-xs mt-1">{risk.mitigation}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'completion-verification':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Final Merger State</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Capital Efficiency Achieved</div>
                <div className="text-2xl font-light text-emerald-400">
                  {mergerConfiguration.capitalEfficiency.leverageMultiple}x
                </div>
                <div className="text-white/50 text-xs mt-1">vs traditional AMMs</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Total Value Swapped</div>
                <div className="text-2xl font-light text-white">
                  ${(mergerConfiguration.swapConfiguration.sizes.totalValueUSD / 1e6).toFixed(1)}M
                </div>
                <div className="text-white/50 text-xs mt-1">Both directions</div>
              </div>
            </div>
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-200 text-sm text-center">
                ✓ Merger simulation complete - DAOs now hold diversified treasury positions
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render step-specific success messages
  const renderStepSuccessMessage = () => {
    const currentStep = simulationSteps[currentSimulationStep];
    if (!currentStep || !stepCompleted) return null;

    const stepSuccessData = {
      'collateral-setup': {
        title: 'USDC Collateral Successfully Deployed',
        icon: '✓',
        color: 'from-blue-500 to-cyan-500',
        metrics: [
          {
            label: 'Total Collateral Deployed',
            value: `$${(((mergerConfiguration.swapConfiguration.collateral?.daoA?.usdcRequired || 0) + 
                      (mergerConfiguration.swapConfiguration.collateral?.daoB?.usdcRequired || 0)) / 1e6).toFixed(1)}M`,
            subtext: `${selectedDaoA.symbol}: $${((mergerConfiguration.swapConfiguration.collateral.daoA.usdcRequired || 0) / 1e6).toFixed(1)}M | ${selectedDaoB.symbol}: $${((mergerConfiguration.swapConfiguration.collateral.daoB.usdcRequired || 0) / 1e6).toFixed(1)}M`
          },
          {
            label: 'Vault Utilization Impact',
            value: `${((mergerConfiguration.vaultConfiguration.usdc.utilizationImpact?.delta || 0) * 100).toFixed(1)}%`,
            subtext: `New utilization: ${((mergerConfiguration.vaultConfiguration.usdc.utilizationImpact?.newUtilization || 0) * 100).toFixed(1)}%`
          }
        ]
      },
      'borrow-native-tokens': {
        title: 'Native Tokens Successfully Borrowed',
        icon: '✓',
        color: 'from-purple-500 to-pink-500',
        metrics: [
          {
            label: 'Tokens Borrowed',
            value: `${(mergerConfiguration.swapConfiguration.sizes.tokenAAmount || 0).toLocaleString()} + ${(mergerConfiguration.swapConfiguration.sizes.tokenBAmount || 0).toLocaleString()}`,
            subtext: `${selectedDaoA.symbol} + ${selectedDaoB.symbol} at ${(mergerConfiguration.vaultConfiguration.crossCollateralization.ltv * 100).toFixed(0)}% LTV`
          },
          {
            label: 'Borrowing Cost',
            value: `${(mergerConfiguration.vaultConfiguration.usdc.borrowAPR || 0).toFixed(2)}% APR`,
            subtext: `Daily cost: $${((mergerConfiguration.swapConfiguration.sizes.totalValueUSD * (mergerConfiguration.vaultConfiguration.usdc.borrowAPR || 0) / 365 / 100) || 0).toFixed(0)}`
          }
        ]
      },
      'deploy-eulerswap': {
        title: 'EulerSwap Pool Successfully Initialized',
        icon: '✓',
        color: 'from-blue-500 to-purple-500',
        metrics: [
          {
            label: 'Pool Parameters',
            value: `${((mergerConfiguration.swapConfiguration.ammParameters.concentrationX || 0) / 1e18).toFixed(2)} concentration`,
            subtext: `Fee tier: ${((mergerConfiguration.swapConfiguration.ammParameters.fee || 0.003e18) / 1e18 * 100).toFixed(2)}%`
          },
          {
            label: 'Initial Price Ratio',
            value: `1:${((mergerConfiguration.swapConfiguration.ammParameters.priceY || 1) / (mergerConfiguration.swapConfiguration.ammParameters.priceX || 1)).toFixed(4)}`,
            subtext: `${selectedDaoA.symbol}:${selectedDaoB.symbol}`
          }
        ]
      },
      'execute-swaps': {
        title: 'Cross-Deposit Swaps Successfully Executed',
        icon: '✓',
        color: 'from-green-500 to-emerald-500',
        metrics: [
          {
            label: 'Tokens Swapped',
            value: `$${(mergerConfiguration.swapConfiguration.sizes.totalValueUSD / 1e6).toFixed(1)}M`,
            subtext: `${(mergerConfiguration.swapConfiguration.sizes.percentageA || 0).toFixed(1)}% of each treasury`
          },
          {
            label: 'Liquidity Multiplier',
            value: `${mergerConfiguration.vaultConfiguration.crossCollateralization.crossDepositMultiplier}x`,
            subtext: 'Cross-deposits increase borrowable liquidity'
          }
        ]
      },
      'monitor-positions': {
        title: 'Monitoring System Successfully Configured',
        icon: '✓',
        color: 'from-yellow-500 to-amber-500',
        metrics: [
          {
            label: 'Health Factor',
            value: `${(1 / (mergerConfiguration.vaultConfiguration.crossCollateralization.ltv / mergerConfiguration.vaultConfiguration.crossCollateralization.liquidationLTV)).toFixed(2)}`,
            subtext: `Safe range maintained`
          },
          {
            label: 'Risk Parameters',
            value: `${mergerConfiguration.risks.filter(r => r.severity === 'high').length} high, ${mergerConfiguration.risks.filter(r => r.severity === 'medium').length} medium`,
            subtext: 'All risks have mitigation strategies'
          }
        ]
      },
      'completion-verification': {
        title: 'Merger Simulation Verified Complete',
        icon: '✓',
        color: 'from-emerald-500 to-teal-500',
        metrics: [
          {
            label: 'Final Efficiency',
            value: `${mergerConfiguration.capitalEfficiency.leverageMultiple}x`,
            subtext: 'vs traditional AMM pools'
          },
          {
            label: 'Treasury Diversification',
            value: 'Complete',
            subtext: `Both DAOs now hold partner tokens`
          }
        ]
      }
    };

    const successData = stepSuccessData[currentStep.id];
    if (!successData) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`mb-6 p-6 rounded-2xl bg-gradient-to-r ${successData.color} bg-opacity-10 border border-white/20`}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
            {successData.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-medium text-white mb-3">{successData.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {successData.metrics.map((metric, idx) => (
                <div key={idx} className="bg-white/10 rounded-lg p-3">
                  <div className="text-white/70 text-sm mb-1">{metric.label}</div>
                  <div className="text-white text-lg font-medium">{metric.value}</div>
                  {metric.subtext && (
                    <div className="text-white/50 text-xs mt-1">{metric.subtext}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const handleQuickAction = (actionType) => {
    const quickActions = {
      'analyze-all': {
        title: 'Full Market Analysis',
        message: 'Analyzing all DAO pairs for optimal merger opportunities based on treasury composition and correlation.',
        impact: {
          coverage: 'All tracked DAOs',
          efficiency: 'Finding best matches'
        }
      },
      'conservative-mode': {
        title: 'Conservative Parameters Set',
        message: 'Simulation parameters adjusted for low-risk merger scenarios with 30% treasury swaps.',
        impact: {
          risk: 'Minimized',
          efficiency: '4x vs traditional'
        }
      },
      'aggressive-mode': {
        title: 'Aggressive Parameters Set',
        message: 'Simulation parameters optimized for maximum efficiency with 70% treasury swaps.',
        impact: {
          risk: 'Higher',
          efficiency: '7x vs traditional'
        }
      },
      'refresh-data': {
        title: 'Data Refreshed',
        message: 'Latest treasury compositions and vault availability updated from on-chain sources.',
        impact: {
          accuracy: 'Real-time data',
          coverage: 'All sources synced'
        }
      }
    };

    const actionData = quickActions[actionType];
    setSuccessNotification({
      show: true,
      title: actionData.title,
      message: actionData.message,
      impact: actionData.impact
    });
  };

  const getActionIcon = (recommendation) => {
    if (!recommendation || !recommendation.title) {
      return <Activity className="w-6 h-6 text-gray-400" />;
    }
    
    const actionLower = recommendation.title.toLowerCase();
    if (actionLower.includes('merger') || actionLower.includes('merge')) {
      return <Target className="w-6 h-6 text-blue-400" />;
    }
    if (actionLower.includes('collateral') || actionLower.includes('usdc')) {
      return <Zap className="w-6 h-6 text-yellow-400" />;
    }
    if (actionLower.includes('analysis') || actionLower.includes('feasibility')) {
      return <Brain className="w-6 h-6 text-emerald-400" />;
    }
    if (actionLower.includes('conservative') || actionLower.includes('aggressive')) {
      return <TrendingUp className="w-6 h-6 text-blue-400" />;
    }
    return <Activity className="w-6 h-6 text-purple-400" />;
  };

  const getPriorityGradient = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-500/30 to-rose-500/30';
      case 'medium': return 'from-yellow-500/30 to-amber-500/30';
      case 'low': return 'from-green-500/30 to-emerald-500/30';
      default: return 'from-gray-500/30 to-gray-600/30';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };


  // Analysis helper functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'green':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'yellow':
        return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 'red':
        return 'from-red-500/20 to-rose-500/20 border-red-500/30';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  const getStatusBorderColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'green':
        return 'border-green-500/50 shadow-green-500/20';
      case 'yellow':
        return 'border-yellow-500/50 shadow-yellow-500/20';
      case 'red':
        return 'border-red-500/50 shadow-red-500/20';
      default:
        return 'border-gray-500/50 shadow-gray-500/20';
    }
  };


  if (dataLoading && !treasuries) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center overflow-hidden">
        {/* Ambient Effects */}
        <div className="fixed inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center relative z-10"
        >
          <div className="relative mb-8">
            {/* Outer Ring */}
            <div className="w-32 h-32 border-4 border-blue-500/20 rounded-full animate-spin"></div>
            {/* Middle Ring */}
            <div className="absolute inset-2 w-28 h-28 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            {/* Inner Ring */}
            <div className="absolute inset-6 w-20 h-20 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-2xl"
              >
                <Target className="w-8 h-8 text-white" />
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-extralight text-white tracking-tight mb-4">Simulation Center</h2>
            <div className="space-y-2">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/60 font-light"
              >
                Analyzing DAO merger opportunities...
              </motion.p>
              <div className="flex justify-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 bg-emerald-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Loading Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-xs text-white/40 space-y-1"
          >
            <div>✓ Treasury data modules loaded</div>
            <div>✓ EulerSwap parameters initialized</div>
            <div>✓ Cross-collateralization models active</div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2"></div>
              Generating merger simulations...
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Hero Header */}
        <div 
          ref={heroRef}
          className={`relative mb-16 rounded-3xl p-12 bg-gradient-to-r from-black/40 to-gray-900/40 backdrop-blur-xl border ${getStatusBorderColor(analysis?.status)}`}
        >
          {/* Status LED Border */}
          {analysis?.status && (
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
              analysis.status.toLowerCase() === 'green' ? 'from-green-400 to-emerald-400' :
              analysis.status.toLowerCase() === 'yellow' ? 'from-yellow-400 to-amber-400' :
              analysis.status.toLowerCase() === 'red' ? 'from-red-400 to-rose-400' :
              'from-gray-400 to-gray-500'
            } rounded-t-3xl animate-pulse shadow-lg`}></div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-extralight text-white tracking-tight">DAO Merger Simulator</h1>
                  <p className="text-xl text-white/60 font-light">EulerSwap Capital-Efficient Merger Analysis</p>
                  {analysis?.status && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className={`w-3 h-3 rounded-full ${
                        analysis.status.toLowerCase() === 'green' ? 'bg-green-400' :
                        analysis.status.toLowerCase() === 'yellow' ? 'bg-yellow-400' :
                        analysis.status.toLowerCase() === 'red' ? 'bg-red-400' :
                        'bg-gray-400'
                      } animate-pulse`}></div>
                      <span className={`text-sm font-medium ${
                        analysis.status.toLowerCase() === 'green' ? 'text-green-400' :
                        analysis.status.toLowerCase() === 'yellow' ? 'text-yellow-400' :
                        analysis.status.toLowerCase() === 'red' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {analysis.status.toUpperCase()} STATUS
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
            </div>

            {/* Analysis Control */}
            <div className="text-center space-y-4">
              <motion.button
                onClick={performAnalysis}
                disabled={isAnalyzing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all backdrop-blur-sm shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Run Analysis</span>
                  </>
                )}
              </motion.button>
              
              <button
                onClick={() => setSimulationMode(!simulationMode)}
                className={`relative px-8 py-4 rounded-2xl transition-all duration-300 ${
                  simulationMode 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">
                    {simulationMode ? 'Simulation Mode' : 'Live Mode'}
                  </span>
                </div>
                {simulationMode && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </button>
              <p className="text-white/50 text-xs">
                {simulationMode ? 'Safe testing environment' : 'Real operations control'}
              </p>
            </div>
          </div>
        </div>

        {/* DAO Selection */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10">
            <label className="block text-white/60 text-sm font-medium mb-3">Select DAO A</label>
            <select
              value={selectedDaoA?.symbol || ''}
              onChange={(e) => {
                const dao = treasuries?.find(t => t.symbol === e.target.value);
                if (dao) {
                  // Aggregate treasury data from all treasuries
                  const totalOwnTokens = dao.treasuries?.reduce((sum, t) => sum + (t.ownTokens || 0), 0) || 0;
                  const totalStablecoins = dao.treasuries?.reduce((sum, t) => sum + (t.stablecoins || 0), 0) || 0;
                  const totalTvl = dao.treasuries?.reduce((sum, t) => sum + (t.tvl || 0), 0) || 0;
                  
                  setSelectedDaoA({
                    ...dao,
                    ownTokens: totalOwnTokens,
                    stablecoins: totalStablecoins,
                    tvl: totalTvl,
                    name: dao.treasuries?.[0]?.name?.split(' (')[0] || dao.symbol
                  });
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 transition-all"
            >
              <option value="">Choose a DAO...</option>
              {treasuries?.map(dao => {
                const totalTvl = dao.treasuries?.reduce((sum, t) => sum + (t.tvl || 0), 0) || 0;
                return (
                  <option key={dao.symbol} value={dao.symbol}>
                    {dao.symbol} - ${(totalTvl / 1e6).toFixed(0)}M
                  </option>
                );
              })}
            </select>
            {selectedDaoA && (
              <div className="mt-3 text-sm text-white/50">
                Treasury: ${((selectedDaoA.tvl || 0) / 1e6).toFixed(1)}M | 
                USDC: ${((selectedDaoA.stablecoins || 0) / 1e6).toFixed(1)}M
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10">
            <label className="block text-white/60 text-sm font-medium mb-3">Select DAO B</label>
            <select
              value={selectedDaoB?.symbol || ''}
              onChange={(e) => {
                const dao = treasuries?.find(t => t.symbol === e.target.value);
                if (dao) {
                  // Aggregate treasury data from all treasuries
                  const totalOwnTokens = dao.treasuries?.reduce((sum, t) => sum + (t.ownTokens || 0), 0) || 0;
                  const totalStablecoins = dao.treasuries?.reduce((sum, t) => sum + (t.stablecoins || 0), 0) || 0;
                  const totalTvl = dao.treasuries?.reduce((sum, t) => sum + (t.tvl || 0), 0) || 0;
                  
                  setSelectedDaoB({
                    ...dao,
                    ownTokens: totalOwnTokens,
                    stablecoins: totalStablecoins,
                    tvl: totalTvl,
                    name: dao.treasuries?.[0]?.name?.split(' (')[0] || dao.symbol
                  });
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 transition-all"
              disabled={!selectedDaoA}
            >
              <option value="">Choose a DAO...</option>
              {treasuries?.filter(dao => dao.symbol !== selectedDaoA?.symbol).map(dao => {
                const totalTvl = dao.treasuries?.reduce((sum, t) => sum + (t.tvl || 0), 0) || 0;
                return (
                  <option key={dao.symbol} value={dao.symbol}>
                    {dao.symbol} - ${(totalTvl / 1e6).toFixed(0)}M
                  </option>
                );
              })}
            </select>
            {selectedDaoB && (
              <div className="mt-3 text-sm text-white/50">
                Treasury: ${((selectedDaoB.tvl || 0) / 1e6).toFixed(1)}M | 
                USDC: ${((selectedDaoB.stablecoins || 0) / 1e6).toFixed(1)}M
              </div>
            )}
          </div>
        </div>

        {/* Merger Configuration Display */}
        {isCalculating && (
          <div className="mb-12 p-8 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin mr-3" />
            <span className="text-white/80">Calculating optimal merger configuration...</span>
          </div>
        )}

        {/* Analysis Summary */}
        {analysis && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-12 p-8 rounded-3xl border bg-gradient-to-r ${getStatusColor(analysis.status)}`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h3 className="text-2xl font-light text-white">Market Analysis Summary</h3>
            </div>
            <p className="text-white/80 leading-relaxed text-lg">
              {analysis.summary || 'No analysis summary available'}
            </p>
          </motion.div>
        )}

        {/* Analysis Loading State */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
          >
            <div className="text-center py-8">
              <div className="relative mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full mx-auto"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h4 className="text-white font-medium mb-2">FORMULA AI is analyzing...</h4>
              <p className="text-white/60 text-sm">Processing market data and generating recommendations</p>
            </div>
          </motion.div>
        )}

        {/* Analysis Error State */}
        {analysisError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 p-8 bg-red-500/10 rounded-3xl border border-red-500/20"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h4 className="text-red-400 font-medium">Analysis Error</h4>
                <p className="text-red-400/80 text-sm">{analysisError}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Simulation Mode Panel */}
        {simulationMode && activeSimulation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-black/40 backdrop-blur-xl rounded-3xl border border-blue-500/30 overflow-hidden"
          >
            <div className="p-8 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Activity className="w-8 h-8 text-blue-400" />
                  <div>
                    <h2 className="text-3xl font-light text-white">Merger Simulation</h2>
                    <p className="text-white/60 text-sm mt-1">
                      Step {currentSimulationStep + 1} of {simulationSteps.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSimulationCancel}
                  className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                >
                  Cancel Simulation
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Current Step Display */}
              <div className="mb-8">
                <h3 className="text-2xl font-light text-white mb-4">
                  {simulationSteps[currentSimulationStep]?.name}
                </h3>
                <p className="text-white/70 mb-6">
                  {simulationSteps[currentSimulationStep]?.description}
                </p>

                {/* Step Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {simulationSteps[currentSimulationStep]?.details.map((detail, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-white/80 text-sm">{detail}</p>
                    </div>
                  ))}
                </div>

                {/* Step Success Message */}
                {renderStepSuccessMessage()}

                {/* Step-Specific Calculated Results */}
                {!stepCompleted && renderStepResults()}

                {/* Progress Indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/50 text-sm">Simulation Progress</span>
                    <span className="text-white/50 text-sm">
                      {Math.round((currentSimulationStep + 1) / simulationSteps.length * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${(currentSimulationStep + 1) / simulationSteps.length * 100}%` }}
                    />
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSimulationStepPrev}
                    disabled={currentSimulationStep === 0}
                    className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous Step
                  </button>
                  <div className="flex space-x-2">
                    {simulationSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`rounded-full transition-all ${
                          idx === currentSimulationStep 
                            ? stepCompleted 
                              ? 'w-3 h-3 bg-green-400' 
                              : 'w-2 h-2 bg-blue-400 w-8' 
                            : completedSteps.has(step.id) 
                              ? 'w-2 h-2 bg-green-400' 
                              : idx < currentSimulationStep 
                                ? 'w-2 h-2 bg-blue-400/50' 
                                : 'w-2 h-2 bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleSimulationStepNext}
                    className={`px-6 py-3 rounded-xl text-white hover:shadow-lg transition-all ${
                      stepCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}
                  >
                    {stepCompleted 
                      ? 'Continue' 
                      : currentSimulationStep === simulationSteps.length - 1 
                        ? 'Complete Simulation' 
                        : 'Execute Step'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Recommendations */}
        <div 
          ref={recommendationsRef}
          className="mb-12 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10"
        >
          <div className="p-8 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Brain className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-3xl font-light text-white">Merger Recommendations</h2>
                  <p className="text-white/60 text-sm mt-1">EulerSwap capital-efficient merger analysis</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/40 text-xs">Last Updated</div>
                <div className="text-white text-sm">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>

          <div className="p-8">

            {/* Original Recommendations */}
            <div className="space-y-8">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div key={index} className="group relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${getPriorityGradient(rec.priority)} rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                      {/* Header Section */}
                      <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-xl bg-white/10">
                              {getActionIcon(rec)}
                            </div>
                            <div>
                              <h3 className="text-xl font-medium text-white mb-1">{rec.title}</h3>
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                                rec.impact === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                rec.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-green-500/20 text-green-400 border-green-500/30'
                              }`}>
                                {rec.impact ? rec.impact.toUpperCase() : 'MEDIUM'} IMPACT
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleSimulateAction(rec)}
                              disabled={simulationMode || !mergerConfiguration}
                              className="flex items-center px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {simulationMode ? (
                                <>
                                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                                  In Progress
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Simulate Merger
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 space-y-6">
                        <p className="text-white/80 text-base leading-relaxed">{rec.description}</p>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {rec.expectedOutcomes?.feasibilityScore && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-white/60 text-xs mb-1">Feasibility</div>
                              <div className={`font-mono text-lg ${getConfidenceColor(parseInt(rec.expectedOutcomes.feasibilityScore))}`}>
                                {rec.expectedOutcomes.feasibilityScore}
                              </div>
                            </div>
                          )}
                          {rec.expectedOutcomes?.capitalEfficiency && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-white/60 text-xs mb-1">Capital Efficiency</div>
                              <div className="text-green-400 font-medium text-lg">{rec.expectedOutcomes.capitalEfficiency}</div>
                            </div>
                          )}
                          {rec.expectedOutcomes?.timeline && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-white/60 text-xs mb-1">Timeline</div>
                              <div className="text-white text-lg font-medium">{rec.expectedOutcomes.timeline}</div>
                            </div>
                          )}
                          {rec.metrics?.usdcUtilization && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-white/60 text-xs mb-1">Vault Utilization</div>
                              <div className="text-emerald-400 font-medium text-lg">{rec.metrics.usdcUtilization}</div>
                            </div>
                          )}
                        </div>
                        
                        {/* FORMULA Insight */}
                        {rec.formulaInsight && (
                          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                            <div className="flex items-start space-x-3">
                              <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                                <Brain className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <div className="text-blue-300 text-xs font-medium mb-1">FORMULA INSIGHT</div>
                                <p className="text-blue-200 text-sm italic">"{rec.formulaInsight}"</p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <AlertTriangle className="w-16 h-16 text-white/30 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-white mb-3">No Active Recommendations</h3>
                  <p className="text-white/60 font-light">No DAOs selected. Choose two DAOs above to analyze merger opportunities.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div 
          ref={actionsRef}
          className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10"
        >
          <h3 className="text-2xl font-light text-white mb-8">Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => handleQuickAction('analyze-all')}
              className="group relative p-6 bg-red-600/20 hover:bg-red-600/30 rounded-2xl border border-red-500/30 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center space-y-3">
                <Activity className="w-8 h-8 text-blue-400 mx-auto" />
                <div className="text-white font-medium">Analyze All DAOs</div>
                <div className="text-blue-400/80 text-sm">Find optimal pairs</div>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction('conservative-mode')}
              className="group relative p-6 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-2xl border border-yellow-500/30 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center space-y-3">
                <Target className="w-8 h-8 text-yellow-400 mx-auto" />
                <div className="text-white font-medium">Conservative Mode</div>
                <div className="text-yellow-400/80 text-sm">30% swaps, low risk</div>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction('aggressive-mode')}
              className="group relative p-6 bg-blue-600/20 hover:bg-blue-600/30 rounded-2xl border border-blue-500/30 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center space-y-3">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto" />
                <div className="text-white font-medium">Aggressive Mode</div>
                <div className="text-blue-400/80 text-sm">70% swaps, high efficiency</div>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction('refresh-data')}
              className="group relative p-6 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-2xl border border-emerald-500/30 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center space-y-3">
                <Zap className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-white font-medium">Refresh Data</div>
                <div className="text-emerald-400/80 text-sm">Update all sources</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      <SuccessNotification
        show={successNotification.show}
        title={successNotification.title}
        message={successNotification.message}
        impact={successNotification.impact}
        details={successNotification.details}
        onClose={() => setSuccessNotification(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default SimulationPage;