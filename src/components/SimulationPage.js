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
    circulationData,
    getTokenCirculation,
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
  const [error, setError] = useState(null);
  const [activeScenario, setActiveScenario] = useState({
    priceDiscovery: 'gradual',
    executionStrategy: 'gradual',
    batchCount: 15
  });
  const [priceTracking, setPriceTracking] = useState({
    initial: 0,
    current: 0,
    firstBatchPrice: 0,
    batchProgress: 0,
    impacts: []
  });
  const [finalPriceTracking, setFinalPriceTracking] = useState(null);
  
  // Batch execution control states
  const [isExecutingBatches, setIsExecutingBatches] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(1); // 1x, 2x, 5x speed
  const [currentBatch, setCurrentBatch] = useState(0);
  const [batchHistory, setBatchHistory] = useState([]); // Store each batch's impact
  const [animationInterval, setAnimationInterval] = useState(null);
  
  // Helper function to format market cap
  const formatMarketCap = (value) => {
    if (!value || value === 0) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    return `$${(value / 1e3).toFixed(0)}K`;
  };
  
  // Helper function to format price without trailing zeroes
  const formatPrice = (price) => {
    if (!price || price === 0) return '0';
    // For small prices, use up to 4 decimals but remove trailing zeroes
    if (price < 1) {
      return price.toFixed(4).replace(/\.?0+$/, '');
    }
    // For regular prices, use 2 decimals but remove trailing zeroes
    return price.toFixed(2).replace(/\.?0+$/, '');
  };
  
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
        setError(error.message || 'Failed to calculate merger configuration');
        setRecommendations([]);
        setSimulationSteps([]);
      } finally {
        setIsCalculating(false);
      }
    };

    setError(null); // Clear previous errors
    calculateMerger();
  }, [selectedDaoA?.symbol, selectedDaoB?.symbol]);

  const handleSimulateAction = async (recommendation) => {
    // Check if simulation steps are available
    if (!simulationSteps || simulationSteps.length === 0) {
      console.error('No simulation steps available');
      return;
    }
    
    // Extract scenario details from recommendations
    const priceDiscoveryRec = recommendations.find(r => r.type === 'price_discovery');
    const executionRec = recommendations.find(r => r.type === 'execution_strategy');
    
    // Determine scenario values based on recommendation titles
    const priceDiscovery = priceDiscoveryRec?.title?.includes('Tight') ? 'tight' : 
                          priceDiscoveryRec?.title?.includes('Wide') ? 'wide' : 'gradual';
    const executionStrategy = executionRec?.title?.includes('Rapid') ? 'rapid' :
                             executionRec?.title?.includes('Dynamic') ? 'dynamic' : 'gradual';
    const batchCount = executionRec?.simulationParams?.numberOfBatches || 15;
    
    // Get batch distribution based on execution strategy
    let batchDistribution = null;
    if (executionStrategy === 'rapid' && typeof batchCount === 'number') {
      // Rapid: front-loaded distribution for 500 batches
      batchDistribution = [];
      // First 100: 0.3% each (30% total)
      for (let i = 0; i < 100; i++) batchDistribution.push(0.003);
      // Next 100: 0.25% each (25% total)
      for (let i = 0; i < 100; i++) batchDistribution.push(0.0025);
      // Next 100: 0.2% each (20% total)
      for (let i = 0; i < 100; i++) batchDistribution.push(0.002);
      // Next 100: 0.15% each (15% total)
      for (let i = 0; i < 100; i++) batchDistribution.push(0.0015);
      // Last 100: 0.1% each (10% total)
      for (let i = 0; i < 100; i++) batchDistribution.push(0.001);
    } else if (executionStrategy === 'gradual') {
      // Gradual: equal distribution
      batchDistribution = null; // null means equal
    } else if (executionStrategy === 'dynamic') {
      // Dynamic: adaptive (start with moderate, adjust based on impact)
      // For now, use a declining distribution
      const dynamicBatchCount = Math.min(Math.max(batchCount, 500), 1500); // 500-1500 range
      batchDistribution = Array.from({ length: dynamicBatchCount }, (_, i) => 
        0.002 - (0.001 * i / dynamicBatchCount) // 0.2% down to 0.1%
      );
      // Normalize to sum to 1
      const sum = batchDistribution.reduce((a, b) => a + b, 0);
      batchDistribution = batchDistribution.map(b => b / sum);
    }
    
    setActiveScenario({
      priceDiscovery,
      executionStrategy,
      batchCount,
      batchDistribution
    });
    
    // Recalculate merger configuration with the specific batch parameters
    setIsCalculating(true);
    try {
      const updatedConfig = await calculateMergerConfig(selectedDaoA, selectedDaoB, {
        numberOfBatches: batchCount,
        batchDistribution: batchDistribution
      });
      
      console.log('Updated merger config with batch params:', {
        batchCount,
        hasBreakdown: !!updatedConfig?.priceImpact?.breakdown,
        breakdownLength: updatedConfig?.priceImpact?.breakdown?.length
      });
      
      // Generate new simulation steps with updated config
      const updatedSteps = mergerAI.generateSimulationSteps(recommendation, updatedConfig);
      
      // Start interactive simulation with step-by-step panels
      setActiveSimulation({
        recommendation,
        config: updatedConfig,
        steps: updatedSteps,
        startTime: Date.now()
      });
      setCurrentSimulationStep(0);
      setSimulationMode(true);
      setStepCompleted(false);
      setCompletedSteps(new Set());
      setSimulationSteps(updatedSteps);
    } catch (error) {
      console.error('Error recalculating merger config:', error);
      setError(error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle batch execution animation
  const startBatchExecution = () => {
    console.log('Start Execution clicked');
    const config = activeSimulation?.config || mergerConfiguration;
    console.log('config:', config);
    console.log('priceImpact:', config?.mergerMetrics?.priceImpact);
    console.log('breakdown:', config?.mergerMetrics?.priceImpact?.breakdown);
    
    if (!config?.mergerMetrics?.priceImpact?.breakdown) {
      console.error('Missing price impact breakdown data');
      alert('Unable to start execution: Price impact data not available. Please ensure the merger configuration is complete.');
      return;
    }
    
    const priceImpacts = config.mergerMetrics.priceImpact.breakdown;
    console.log('Starting animation with', priceImpacts.length, 'batches');
    
    setIsExecutingBatches(true);
    setIsPaused(false);
    setCurrentBatch(0);
    setBatchHistory([]);
    
    runBatchAnimation(priceImpacts, 0);
  };
  
  const runBatchAnimation = (priceImpacts, startIndex) => {
    let batchIndex = startIndex;
    
    const interval = setInterval(() => {
      // Check if paused - we'll handle resume separately
      if (isPaused) {
        clearInterval(interval);
        setAnimationInterval(null);
        // Store current index for resume
        setCurrentBatch(batchIndex);
        return;
      }
      
      if (batchIndex >= priceImpacts.length) {
        clearInterval(interval);
        setIsExecutingBatches(false);
        // Use functional update to get current state value, not stale closure
        setPriceTracking(currentPriceTracking => {
          setFinalPriceTracking({...currentPriceTracking});
          return currentPriceTracking; // Return unchanged
        });
        setStepCompleted(true);
        setCompletedSteps(prev => new Set([...prev, simulationSteps[currentSimulationStep].id]));
        setAnimationInterval(null);
        return;
      }
      
      const progress = (batchIndex + 1) / priceImpacts.length;
      const batchData = priceImpacts[batchIndex];
      
      // Calculate the effective price based on cumulative amounts
      const effectivePrice = batchData?.cumulativeOutput > 0 
        ? batchData.cumulativeInput / batchData.cumulativeOutput 
        : priceTracking.initial;
      
      setPriceTracking(prev => ({
        ...prev,
        batchProgress: progress,
        current: effectivePrice,
        // Track the price after first batch for realistic impact
        firstBatchPrice: batchIndex === 0 ? effectivePrice : prev.firstBatchPrice
      }));
      
      setCurrentBatch(batchIndex + 1);
      setBatchHistory(prev => [...prev, {
        batch: batchIndex + 1,
        impact: batchData?.priceImpact || 0,
        cumulativeImpact: priceTracking.initial > 0 ? ((effectivePrice - priceTracking.initial) / priceTracking.initial * 100) : 0
      }]);
      
      batchIndex++;
    }, 200 / executionSpeed); // Adjust speed based on executionSpeed
    
    setAnimationInterval(interval);
  };
  
  // Handle pause/resume
  React.useEffect(() => {
    if (!isPaused && isExecutingBatches && !animationInterval && mergerConfiguration?.mergerMetrics?.priceImpact?.breakdown) {
      // Resume from current batch
      runBatchAnimation(mergerConfiguration.mergerMetrics.priceImpact.breakdown, currentBatch);
    }
  }, [isPaused, isExecutingBatches, animationInterval, currentBatch]);
  
  // Cleanup intervals on unmount
  React.useEffect(() => {
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [animationInterval]);

  const handleSimulationStepNext = () => {
    const currentStep = simulationSteps[currentSimulationStep];
    
    // Check if currentStep exists
    if (!currentStep) {
      console.error('Current step is undefined:', { currentSimulationStep, simulationStepsLength: simulationSteps.length });
      return;
    }
    
    // Special handling for execute-batch-swaps step
    if ((currentStep.id === 'execute-batch-swaps' || currentStep.id === 'execute-swaps') && !stepCompleted && !isExecutingBatches && !finalPriceTracking) {
      // Start the batch execution animation
      startBatchExecution();
      return;
    }
    
    // Don't allow proceeding if batches are executing
    if (isExecutingBatches) {
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
          
          // Reset price tracking when moving to execute-swaps step
          const nextStep = simulationSteps[currentSimulationStep + 1];
          if (nextStep && (nextStep.id === 'execute-batch-swaps' || nextStep.id === 'execute-swaps')) {
            setPriceTracking({
              initial: 0,
              current: 0,
              firstBatchPrice: 0,
              batchProgress: 0,
              impacts: []
            });
            setFinalPriceTracking(null);
            setIsExecutingBatches(false);
            setCurrentBatch(0);
            setBatchHistory([]);
          }
          
        } else {
          // Final simulation complete
          setSuccessNotification({
            show: true,
            title: 'Merger Simulation Complete',
            message: `Successfully simulated ${selectedDaoA.symbol}-${selectedDaoB.symbol} merger using one-sided JIT liquidity model.`,
            impact: {
              dilution: `${mergerConfiguration.dilutionPercentage?.toFixed(2) || '0'}% dilution for ${selectedDaoB.symbol} holders`,
              priceImpact: finalPriceTracking?.initial > 0 
                ? `${((finalPriceTracking.current - finalPriceTracking.initial) / finalPriceTracking.initial * 100).toFixed(2)}% execution price impact`
                : `${mergerConfiguration.totalPriceImpact?.toFixed(2) || '0'}% total price impact`,
              totalValue: `$${(mergerConfiguration.swapConfiguration.sizes.totalValueUSD / 1e6).toFixed(1)}M swapped`,
              mintAmount: `${(mergerConfiguration.requiredMint || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${selectedDaoB.symbol} tokens minted`
            },
            details: {
              survivingDAO: `${selectedDaoB.symbol} pre-funded vault with minted tokens`,
              phasedOutDAO: `${selectedDaoA.symbol} holders can swap to ${selectedDaoB.symbol}`,
              priceDiscovery: `${activeScenario.priceDiscovery} price discovery scenario`
            }
          });
          setActiveSimulation(null);
          setSimulationMode(false);
          setCompletedSteps(new Set());
        }
      }, 1500); // Show success state for 1.5 seconds before proceeding
    } else if ((currentStep.id === 'execute-batch-swaps' || currentStep.id === 'execute-swaps') && stepCompleted && finalPriceTracking) {
      // Handle already completed batch execution steps
      if (currentSimulationStep < simulationSteps.length - 1) {
        setCurrentSimulationStep(prev => prev + 1);
        setStepCompleted(false);
        
        // Reset price tracking when moving to next step
        const nextStep = simulationSteps[currentSimulationStep + 1];
        if (nextStep && (nextStep.id === 'execute-batch-swaps' || nextStep.id === 'execute-swaps')) {
          setPriceTracking({
            initial: 0,
            current: 0,
            firstBatchPrice: 0,
            batchProgress: 0,
            impacts: []
          });
          setFinalPriceTracking(null);
          setIsExecutingBatches(false);
          setCurrentBatch(0);
          setBatchHistory([]);
        }
      } else {
        // Final simulation complete
        setSuccessNotification({
          show: true,
          title: 'Merger Simulation Complete',
          message: `Successfully simulated ${selectedDaoA.symbol}-${selectedDaoB.symbol} merger using one-sided JIT liquidity model.`,
          impact: {
            dilution: `${mergerConfiguration.dilutionPercentage?.toFixed(2) || '0'}% dilution for ${selectedDaoB.symbol} holders`,
            priceImpact: finalPriceTracking?.initial > 0 
              ? `${((finalPriceTracking.current - finalPriceTracking.initial) / finalPriceTracking.initial * 100).toFixed(2)}% execution price impact`
              : `${mergerConfiguration.totalPriceImpact?.toFixed(2) || '0'}% total price impact`,
            totalValue: `$${(mergerConfiguration.swapConfiguration.sizes.totalValueUSD / 1e6).toFixed(1)}M swapped`,
            mintAmount: `${(mergerConfiguration.requiredMint || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${selectedDaoB.symbol} tokens minted`
          },
          details: {
            survivingDAO: `${selectedDaoB.symbol} pre-funded vault with minted tokens`,
            phasedOutDAO: `${selectedDaoA.symbol} holders can swap to ${selectedDaoB.symbol}`,
            priceDiscovery: `${activeScenario.priceDiscovery} price discovery scenario`
          }
        });
        setActiveSimulation(null);
        setSimulationMode(false);
        setCompletedSteps(new Set());
      }
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
    if (!activeSimulation || !activeSimulation.config) return null;
    
    const mergerConfiguration = activeSimulation.config;
    const currentStep = simulationSteps[currentSimulationStep];
    if (!currentStep) return null;

    switch (currentStep.id) {
      case 'governance-approval':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Governance Proposal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Proposal Type</div>
                <div className="text-xl font-light text-white">
                  Token Minting
                </div>
                <div className="text-white/50 text-xs mt-1">
                  For merger vault funding
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Voting Period</div>
                <div className="text-xl font-light text-white">
                  3-7 days
                </div>
                <div className="text-white/50 text-xs mt-1">
                  Standard governance timeline
                </div>
              </div>
            </div>
          </div>
        );

      case 'vault-deployment':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Euler Vault Deployment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">{selectedDaoA.symbol} Vault</div>
                <div className="text-xl font-light text-white">
                  0% Interest
                </div>
                <div className="text-white/50 text-xs mt-1">
                  Phased-out token configuration
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">{selectedDaoB.symbol} Vault</div>
                <div className="text-xl font-light text-white">
                  Dynamic IRM
                </div>
                <div className="text-white/50 text-xs mt-1">
                  0-4% base, 80% kink
                </div>
              </div>
            </div>
          </div>
        );

      case 'vault-funding':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Vault Pre-Funding via Token Minting</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Mint Funding Amount</div>
                <div className="text-2xl font-light text-white">
                  {(mergerConfiguration.requiredMint || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} {selectedDaoB.symbol}
                </div>
                <div className="text-white/50 text-xs mt-1">
                  Dilution: {(mergerConfiguration.dilutionPercentage || 0).toFixed(2)}%
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Price Discovery Scenario</div>
                <div className="text-2xl font-light text-white">
                  {activeScenario.priceDiscovery.charAt(0).toUpperCase() + activeScenario.priceDiscovery.slice(1)}
                </div>
                <div className="text-white/50 text-xs mt-1">
                  Concentration: {((mergerConfiguration.swapConfiguration.ammParameters.concentrationX || 0.5e18) / 1e18).toFixed(2)}-{((mergerConfiguration.swapConfiguration.ammParameters.concentrationY || 0.85e18) / 1e18).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'execute-batch-swaps':
      case 'execute-swaps':
        // Initialize price tracking when we enter this step
        if (priceTracking.initial === 0 && mergerConfiguration?.swapConfiguration) {
          const priceX = mergerConfiguration.swapConfiguration.ammParameters?.priceX || 1e18;
          const priceY = mergerConfiguration.swapConfiguration.ammParameters?.priceY || 1e18;
          const initialPrice = priceY / priceX;
          const priceImpacts = mergerConfiguration.mergerMetrics?.priceImpact?.breakdown || [];
          
          console.log('Initializing price tracking:', {
            priceX,
            priceY,
            initialPrice,
            impactsCount: priceImpacts.length,
            hasBreakdown: !!mergerConfiguration.mergerMetrics?.priceImpact?.breakdown
          });
          
          setPriceTracking({
            initial: initialPrice,
            current: initialPrice,
            firstBatchPrice: 0, // Will be set after first batch
            batchProgress: 0,
            impacts: priceImpacts
          });
        }
        
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <h4 className="text-lg font-medium text-white mb-4">One-Sided Swap Execution</h4>
            
            {/* Dynamic Price Display */}
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
              <div className="text-white/60 text-sm mb-1">AMM Pool Price Discovery</div>
              <div className="text-white/40 text-xs mb-3">(Pool pricing, not market price)</div>
              
              {/* Batch Execution Controls */}
              {!stepCompleted && (
                <div className="mb-4 flex items-center gap-3">
                  {!isExecutingBatches && !finalPriceTracking && (
                    <>
                      <button
                        onClick={startBatchExecution}
                        disabled={!activeSimulation?.config?.mergerMetrics?.priceImpact?.breakdown || priceTracking.initial === 0}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                          !activeSimulation?.config?.mergerMetrics?.priceImpact?.breakdown || priceTracking.initial === 0
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title={
                          !activeSimulation?.config?.mergerMetrics?.priceImpact?.breakdown 
                            ? 'Price impact data not available' 
                            : priceTracking.initial === 0 
                            ? 'Initializing price data...' 
                            : 'Start batch execution'
                        }
                      >
                        <Play className="w-4 h-4" />
                        Start Execution
                      </button>
                      {(!activeSimulation?.config?.mergerMetrics?.priceImpact?.breakdown || priceTracking.initial === 0) && (
                        <span className="text-yellow-400 text-sm">
                          {!activeSimulation?.config?.priceImpact?.breakdown 
                            ? '⚠️ Waiting for price impact calculation...' 
                            : '⚠️ Initializing prices...'}
                        </span>
                      )}
                    </>
                  )}
                  {isExecutingBatches && (
                    <>
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">Speed:</span>
                        {[1, 2, 5].map(speed => (
                          <button
                            key={speed}
                            onClick={() => setExecutionSpeed(speed)}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                              executionSpeed === speed 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {finalPriceTracking && (
                    <div className="text-emerald-400 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Execution Complete
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-white/50 text-xs">Initial Price</div>
                  <div className="text-lg font-light text-white">
                    {priceTracking.initial > 0 ? priceTracking.initial.toFixed(4) : '-.----'}
                  </div>
                </div>
                <div>
                  <div className="text-white/50 text-xs">Current Price</div>
                  <div className="text-lg font-light text-emerald-400">
                    {priceTracking.current > 0 ? priceTracking.current.toFixed(4) : '-.----'}
                  </div>
                </div>
                <div>
                  <div className="text-white/50 text-xs">Total Impact</div>
                  <div className="text-lg font-light text-yellow-400">
                    {priceTracking.initial > 0 ? ((priceTracking.current - priceTracking.initial) / priceTracking.initial * 100).toFixed(2) : '-.--'}%
                  </div>
                </div>
              </div>
              
              {/* Price Progress Bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(priceTracking.batchProgress * 100, 100)}%` }}
                />
              </div>
              <div className="text-white/50 text-xs mt-1">
                {isExecutingBatches ? 'Executing: ' : ''}
                Batch {currentBatch || Math.floor(priceTracking.batchProgress * activeScenario.batchCount)} of {activeScenario.batchCount} ({(priceTracking.batchProgress * 100).toFixed(1)}% complete)
              </div>
              
              {/* Current Batch Details */}
              {isExecutingBatches && currentBatch > 0 && batchHistory.length > 0 && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg">
                  <div className="text-white/60 text-xs mb-1">Current Batch #{currentBatch}</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Batch Impact:</span>
                    <span className="text-yellow-400">
                      +{(batchHistory[batchHistory.length - 1]?.impact || 0).toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Cumulative:</span>
                    <span className="text-emerald-400">
                      +{(batchHistory[batchHistory.length - 1]?.cumulativeImpact || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">{selectedDaoA?.symbol} → {selectedDaoB?.symbol}</div>
                <div className="text-xl font-light text-white">
                  Available to swap
                </div>
                <div className="text-white/50 text-xs mt-1">
                  One-way swaps only
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Price Impact</div>
                <div className="text-xl font-light text-white">
                  {finalPriceTracking?.initial > 0 
                    ? ((finalPriceTracking.current - finalPriceTracking.initial) / finalPriceTracking.initial * 100).toFixed(2)
                    : priceTracking.initial > 0 
                      ? ((priceTracking.current - priceTracking.initial) / priceTracking.initial * 100).toFixed(2)
                      : '0.00'}%
                </div>
                <div className="text-white/50 text-xs mt-1">
                  {finalPriceTracking || priceTracking.initial > 0 
                    ? 'Actual execution impact' 
                    : 'Waiting for execution'}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <div className="text-white/60 text-sm mb-1">Batch Execution Strategy</div>
              <div className="text-white text-sm">
                {activeScenario.executionStrategy === 'rapid' 
                  ? `Front-loaded execution in ${activeScenario.batchCount} batches`
                  : activeScenario.executionStrategy === 'gradual'
                  ? `Even distribution across ${activeScenario.batchCount} batches (${(100/activeScenario.batchCount).toFixed(2)}% each)`
                  : `Dynamic execution with ${activeScenario.batchCount} adaptive batches`
                }
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
            <h4 className="text-lg font-medium text-white mb-4">One-Sided Swap Execution</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">{selectedDaoA?.symbol} → {selectedDaoB?.symbol}</div>
                <div className="text-xl font-light text-white">
                  Available to swap
                </div>
                <div className="text-white/50 text-xs mt-1">
                  One-way swaps only
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Price Impact</div>
                <div className="text-xl font-light text-white">
                  {finalPriceTracking?.initial > 0 
                    ? ((finalPriceTracking.current - finalPriceTracking.initial) / finalPriceTracking.initial * 100).toFixed(2)
                    : priceTracking.initial > 0 
                      ? ((priceTracking.current - priceTracking.initial) / priceTracking.initial * 100).toFixed(2)
                      : '0.00'}%
                </div>
                <div className="text-white/50 text-xs mt-1">
                  {finalPriceTracking || priceTracking.initial > 0 
                    ? 'Actual execution impact' 
                    : 'Waiting for execution'}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <div className="text-white/60 text-sm mb-1">Batch Execution Strategy</div>
              <div className="text-white text-sm">
                {activeScenario.executionStrategy === 'rapid' 
                  ? `Front-loaded execution in ${activeScenario.batchCount} batches (30%→25%→20%→15%→10%)`
                  : activeScenario.executionStrategy === 'gradual'
                  ? `Even distribution across ${activeScenario.batchCount} batches (${(100/activeScenario.batchCount).toFixed(2)}% each)`
                  : `Dynamic execution with ${activeScenario.batchCount} adaptive batches`
                }
              </div>
            </div>
          </div>
        );

      case 'price-discovery-monitoring':
      case 'monitor-positions':
        return (
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20">
            <h4 className="text-lg font-medium text-white mb-4">Risk Monitoring Parameters</h4>
            <div className="grid grid-cols-2 gap-4">
              {mergerConfiguration.risks.slice(0, 2).map((risk, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-lg">
                  <div className="text-white/60 text-sm mb-1">{risk.type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Risk</div>
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
                <div className="text-white/60 text-sm mb-1">Dilution Impact</div>
                <div className="text-2xl font-light text-emerald-400">
                  {(mergerConfiguration.dilutionPercentage || 0).toFixed(2)}%
                </div>
                <div className="text-white/50 text-xs mt-1">for {selectedDaoB.symbol} holders</div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white/60 text-sm mb-1">Tokens Minted</div>
                <div className="text-2xl font-light text-white">
                  {(mergerConfiguration.requiredMint || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-white/50 text-xs mt-1">{selectedDaoB.symbol} tokens</div>
              </div>
            </div>
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-200 text-sm text-center">
                ✓ One-sided JIT merger complete - {selectedDaoA.symbol} holders can now swap to {selectedDaoB.symbol}
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
      'governance-approval': {
        title: 'Governance Proposal Approved',
        icon: '✓',
        color: 'from-indigo-500 to-purple-500',
        metrics: [
          {
            label: 'Proposal Status',
            value: 'Passed',
            subtext: `${selectedDaoB.symbol} DAO approved token minting`
          },
          {
            label: 'Voting Result',
            value: 'Quorum reached',
            subtext: 'Ready to proceed with minting'
          }
        ]
      },
      'vault-deployment': {
        title: 'Vaults Successfully Deployed',
        icon: '✓',
        color: 'from-cyan-500 to-blue-500',
        metrics: [
          {
            label: 'Vault Configuration',
            value: 'Asymmetric setup',
            subtext: `${selectedDaoA.symbol}: 0% IRM, ${selectedDaoB.symbol}: Dynamic IRM`
          },
          {
            label: 'Deployment Status',
            value: 'Both vaults live',
            subtext: 'Ready for funding and operations'
          }
        ]
      },
      'vault-funding': {
        title: 'Vault Successfully Pre-funded',
        icon: '✓',
        color: 'from-blue-500 to-cyan-500',
        metrics: [
          {
            label: 'Tokens Minted',
            value: `${(mergerConfiguration.requiredMint || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${selectedDaoB.symbol}`,
            subtext: `${selectedDaoB.symbol} DAO minted new tokens for funding`
          },
          {
            label: 'Dilution Impact',
            value: `${(mergerConfiguration.dilutionPercentage || 0).toFixed(2)}%`,
            subtext: `Impact on existing ${selectedDaoB.symbol} holders`
          }
        ]
      },
      'execute-batch-swaps': {
        title: 'Batch Swaps Executing',
        icon: '✓',
        color: 'from-green-500 to-emerald-500',
        metrics: [
          {
            label: 'Execution Progress',
            value: finalPriceTracking ? '100% complete' : `${Math.floor(priceTracking.batchProgress * 100)}% complete`,
            subtext: finalPriceTracking ? `Batch ${activeScenario.batchCount} of ${activeScenario.batchCount}` : `Batch ${Math.floor(priceTracking.batchProgress * activeScenario.batchCount)} of ${activeScenario.batchCount}`
          },
          {
            label: 'Current Price Impact',
            value: finalPriceTracking 
              ? (finalPriceTracking.initial > 0 
                  ? `${((finalPriceTracking.current - finalPriceTracking.initial) / finalPriceTracking.initial * 100).toFixed(2)}%`
                  : '0.00%')
              : (priceTracking.initial > 0 
                  ? `${((priceTracking.current - priceTracking.initial) / priceTracking.initial * 100).toFixed(2)}%`
                  : '0.00%'),
            subtext: 'Actual execution impact'
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
        title: 'One-Sided Swaps Enabled',
        icon: '✓',
        color: 'from-green-500 to-emerald-500',
        metrics: [
          {
            label: 'Swap Direction',
            value: `${selectedDaoA.symbol} → ${selectedDaoB.symbol} only`,
            subtext: `Unidirectional swaps for phased-out token`
          },
          {
            label: 'Execution Strategy',
            value: `${activeScenario.executionStrategy.charAt(0).toUpperCase() + activeScenario.executionStrategy.slice(1)} in ${activeScenario.batchCount} batches`,
            subtext: finalPriceTracking?.firstBatchPrice > 0 
              ? `Execution impact: ${((finalPriceTracking.current - finalPriceTracking.firstBatchPrice) / finalPriceTracking.firstBatchPrice * 100).toFixed(2)}%`
              : `Expected impact: ${(mergerConfiguration.totalPriceImpact || 0).toFixed(2)}%`
          }
        ]
      },
      'price-discovery-monitoring': {
        title: 'Price Discovery Monitoring Active',
        icon: '✓',
        color: 'from-yellow-500 to-amber-500',
        metrics: [
          {
            label: 'Discovery Efficiency',
            value: `${activeScenario.priceDiscovery.charAt(0).toUpperCase() + activeScenario.priceDiscovery.slice(1)} mode`,
            subtext: 'Tracking price evolution'
          },
          {
            label: 'Monitoring Status',
            value: 'Active surveillance',
            subtext: 'Real-time impact tracking'
          }
        ]
      },
      'monitor-positions': {
        title: 'Monitoring System Successfully Configured',
        icon: '✓',
        color: 'from-yellow-500 to-amber-500',
        metrics: [
          {
            label: 'Vault Utilization',
            value: `${(mergerConfiguration.vaultConfiguration?.survivingVault?.expectedUtilization || 0.65).toFixed(2)}`,
            subtext: `Expected utilization for ${selectedDaoB.symbol} vault`
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
            label: 'Final Dilution',
            value: `${(mergerConfiguration.dilutionPercentage || 0).toFixed(2)}%`,
            subtext: `for ${selectedDaoB.symbol} holders`
          },
          {
            label: 'Merger Model',
            value: 'One-sided JIT',
            subtext: `${selectedDaoA.symbol} phased out, ${selectedDaoB.symbol} surviving`
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
        message: 'Analyzing all DAO pairs for optimal merger opportunities based on market cap and token dynamics.',
        impact: {
          coverage: 'All tracked DAOs',
          efficiency: 'Finding best matches'
        }
      },
      'conservative-mode': {
        title: 'Conservative Parameters Set',
        message: 'Simulation parameters adjusted for tight price discovery with minimal dilution impact.',
        impact: {
          dilution: 'Minimized',
          priceDiscovery: 'Tight range'
        }
      },
      'aggressive-mode': {
        title: 'Aggressive Parameters Set',
        message: 'Simulation parameters optimized for wide price discovery with faster execution.',
        impact: {
          dilution: 'Higher acceptance',
          priceDiscovery: 'Wide range'
        }
      },
      'refresh-data': {
        title: 'Data Refreshed',
        message: 'Latest token prices and circulation data updated from on-chain sources.',
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
    if (actionLower.includes('funding') || actionLower.includes('mint')) {
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


  if (dataLoading && !prices) {
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
            <div>✓ Token circulation data loaded</div>
            <div>✓ EulerSwap parameters initialized</div>
            <div>✓ One-sided JIT model active</div>
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
                const priceData = prices?.find(p => p.symbol === e.target.value);
                if (priceData) {
                  const circulation = getTokenCirculation(priceData.symbol);
                  setSelectedDaoA({
                    ...priceData,
                    price: priceData.currentPrice || 0,
                    circulatingSupply: circulation?.circulatingSupply || 0,
                    marketCap: circulation?.marketCap || (circulation?.circulatingSupply || 0) * (priceData.currentPrice || 0),
                    name: circulation?.name || priceData.name || priceData.symbol
                  });
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 transition-all"
            >
              <option value="">Choose a DAO...</option>
              {prices?.map(priceData => {
                const circulation = getTokenCirculation(priceData.symbol);
                const marketCap = circulation?.marketCap || 0;
                return (
                  <option key={priceData.symbol} value={priceData.symbol}>
                    {priceData.symbol} - {formatMarketCap(marketCap)}
                  </option>
                );
              })}
            </select>
            {selectedDaoA && (
              <div className="mt-3 text-sm text-white/50">
                Market Cap: {formatMarketCap(selectedDaoA.marketCap || 0)} | 
                Price: ${formatPrice(selectedDaoA.price)}
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10">
            <label className="block text-white/60 text-sm font-medium mb-3">Select DAO B</label>
            <select
              value={selectedDaoB?.symbol || ''}
              onChange={(e) => {
                const priceData = prices?.find(p => p.symbol === e.target.value);
                if (priceData) {
                  const circulation = getTokenCirculation(priceData.symbol);
                  setSelectedDaoB({
                    ...priceData,
                    price: priceData.currentPrice || 0,
                    circulatingSupply: circulation?.circulatingSupply || 0,
                    marketCap: circulation?.marketCap || (circulation?.circulatingSupply || 0) * (priceData.currentPrice || 0),
                    name: circulation?.name || priceData.name || priceData.symbol
                  });
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 transition-all"
              disabled={!selectedDaoA}
            >
              <option value="">Choose a DAO...</option>
              {prices?.filter(priceData => priceData.symbol !== selectedDaoA?.symbol).map(priceData => {
                const circulation = getTokenCirculation(priceData.symbol);
                const marketCap = circulation?.marketCap || 0;
                return (
                  <option key={priceData.symbol} value={priceData.symbol}>
                    {priceData.symbol} - {formatMarketCap(marketCap)}
                  </option>
                );
              })}
            </select>
            {selectedDaoB && (
              <div className="mt-3 text-sm text-white/50">
                Market Cap: {formatMarketCap(selectedDaoB.marketCap || 0)} | 
                Price: ${formatPrice(selectedDaoB.price)}
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
        
        {/* Error Display */}
        {error && !isCalculating && (
          <div className="mb-12 p-8 rounded-3xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-medium mb-2">Error Calculating Merger</h3>
                <p className="text-white/70">{error}</p>
                <p className="text-white/50 text-sm mt-2">
                  Please ensure both DAOs have sufficient price history and circulation data.
                </p>
              </div>
            </div>
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
              <h4 className="text-white font-medium mb-2">FORMULA is analyzing...</h4>
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
                    disabled={isExecutingBatches}
                    className={`px-6 py-3 rounded-xl text-white hover:shadow-lg transition-all ${
                      isExecutingBatches
                        ? 'bg-gray-500 cursor-not-allowed opacity-50'
                        : stepCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}
                  >
                    {(() => {
                      const currentStep = simulationSteps[currentSimulationStep];
                      if (isExecutingBatches) {
                        return 'Executing Batches...';
                      } else if ((currentStep?.id === 'execute-batch-swaps' || currentStep?.id === 'execute-swaps') && !stepCompleted && !finalPriceTracking) {
                        return 'Click Start Execution Above';
                      } else if (stepCompleted) {
                        return 'Continue';
                      } else if (currentSimulationStep === simulationSteps.length - 1) {
                        return 'Complete Simulation';
                      } else {
                        return 'Execute Step';
                      }
                    })()}
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
                          {rec.expectedOutcomes?.priceImpact && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-white/60 text-xs mb-1">Price Impact</div>
                              <div className="text-green-400 font-medium text-lg">{rec.expectedOutcomes.priceImpact}</div>
                            </div>
                          )}
                          {rec.expectedOutcomes?.timeline && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-white/60 text-xs mb-1">Timeline</div>
                              <div className="text-white text-lg font-medium">{rec.expectedOutcomes.timeline}</div>
                            </div>
                          )}
                          {rec.metrics?.dilutionPercentage && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <div className="text-white/60 text-xs mb-1">Dilution Impact</div>
                              <div className="text-emerald-400 font-medium text-lg">{rec.metrics.dilutionPercentage}%</div>
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
                <div className="text-yellow-400/80 text-sm">Tight price discovery</div>
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
                <div className="text-blue-400/80 text-sm">Wide price discovery</div>
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