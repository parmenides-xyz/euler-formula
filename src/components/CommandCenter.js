import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Mic,
  MicOff,
  Send,
  TrendingUp
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { liveEvents, marketData } from '../services/mergerDataService';

import AnimatedNumber from './AnimatedNumber';
import MarkdownRenderer from './MarkdownRenderer';
import SuccessNotification from './SuccessNotification';
import { useData } from '../context/DataContext';
import { useLiquidGlass } from './SimpleLiquidGlass';

const CommandCenter = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm FORMULA, your DAO merger assistant. How can I help you analyze merger opportunities using one-sided JIT liquidity today?",
      timestamp: new Date(),
      confidence: 95
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [transcript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [notifications] = useState(liveEvents.slice(0, 5));
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [actionProgress, setActionProgress] = useState({});
  const [executingActions, setExecutingActions] = useState(new Set());
  const [successNotification, setSuccessNotification] = useState({
    show: false,
    title: '',
    message: '',
    impact: null
  });
  
  const { prices, circulationData, mergerConfiguration } = useData();
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  // Liquid glass containers
  const heroRef = useLiquidGlass({ width: 1200, height: 300 });
  const chatRef = useLiquidGlass({ width: 800, height: 400 });

  // Live merger metrics
  const [liveMetrics, setLiveMetrics] = useState({
    activeMergers: mergerConfiguration ? 1 : 0,
    priceDiscoveryProgress: 0,
    averageDilution: 8.5,
    mergerSuccessRate: 94.2,
    viableTokens: 0,
    totalMarketCap: 0
  });

  useEffect(() => {
    // Initialize speech recognition
    const initSpeechRecognition = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          console.log('Speech recognition started');
        };
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setInputText(prev => prev + finalTranscript);
          }
          
          setInterimTranscript(interimTranscript);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          setInterimTranscript('');
        };
        
        setSpeechRecognition(recognition);
      } else {
        console.warn('Speech recognition not supported');
        setSpeechSupported(false);
      }
    };

    initSpeechRecognition();


    // Calculate initial metrics
    const viableCount = circulationData ? 
      Object.values(circulationData).filter(token => token.marketCap > 10000000).length : 0;
    const totalMktCap = circulationData ?
      Object.values(circulationData).reduce((sum, token) => sum + (token.marketCap || 0), 0) : 0;
    
    setLiveMetrics(prev => ({
      ...prev,
      viableTokens: viableCount,
      totalMarketCap: totalMktCap,
      activeMergers: mergerConfiguration ? 1 : 0
    }));

    // Simulate real-time merger metrics updates
    const interval = setInterval(() => {
      setLiveMetrics(prev => {
        const newMetrics = {
          ...prev,
          priceDiscoveryProgress: mergerConfiguration ? 
            Math.min(100, prev.priceDiscoveryProgress + Math.random() * 5) : 0,
          averageDilution: Math.max(5, Math.min(15, prev.averageDilution + (Math.random() - 0.5) * 0.5)),
          mergerSuccessRate: Math.max(85, Math.min(98, prev.mergerSuccessRate + (Math.random() - 0.5) * 1.5))
        };

        return newMetrics;
      });
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
      // Cleanup speech recognition
      if (speechRecognition) {
        speechRecognition.stop();
      }
    };
  }, [circulationData, mergerConfiguration]);

  // Toggle microphone input for speech recognition
  const handleMicrophoneToggle = () => {
    if (!speechRecognition) return;
    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userMessage = { id: Date.now(), type: 'user', content: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoadingChat(true);
    setInputText('');
    // build conversation excluding initial greeting
    const history = [...messages.slice(1), userMessage];
    const messagesForAPI = history.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForAPI })
      });
      const result = await response.json();
      const aiContent = result.success ? result.completion : `Error: ${result.error}`;
      const aiMessage = { id: Date.now()+1, type: 'ai', content: aiContent, timestamp: new Date(), confidence: null };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages(prev => [...prev, { id: Date.now()+1, type:'ai', content:'Sorry, error processing request.', timestamp:new Date(), confidence:null }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  const runAnalysisSimulation = async (actionType) => {
    if (executingActions.has(actionType)) return;

    setExecutingActions(prev => new Set([...prev, actionType]));
    setActionProgress(prev => ({ ...prev, [actionType]: 0 }));

    // Simulate detailed progress with multiple steps
    const steps = getActionSteps(actionType);
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setActionProgress(prev => ({ 
        ...prev, 
        [actionType]: Math.round((i + 1) / steps.length * 100)
      }));
    }

    // Generate AI response for all actions
    const response = generateActionResponse(actionType);
    const aiMessage = {
      id: Date.now(),
      type: 'ai',
      content: response,
      timestamp: new Date(),
      confidence: Math.floor(Math.random() * 15) + 85,
      actionType: actionType
    };

    setMessages(prev => [...prev, aiMessage]);

    // Show success notification
    const successData = getSuccessData(actionType);
    setSuccessNotification({
      show: true,
      title: successData.title,
      message: successData.message,
      impact: successData.impact
    });
    
    setExecutingActions(prev => {
      const newSet = new Set(prev);
      newSet.delete(actionType);
      return newSet;
    });
    setActionProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[actionType];
      return newProgress;
    });
  };

  const getSuccessData = (actionType) => {
    const successData = {
      'volatility_analyzer': {
        title: 'Volatility Analysis Complete',
        message: 'Risk assessment complete. 3 high-volatility pairs identified requiring adjusted parameters.',
        impact: {
          revenue: 'Risk-adjusted',
          efficiency: '44.4% avg volatility'
        }
      },
      'correlation_calculator': {
        title: 'Correlation Analysis Complete',
        message: 'Identified 12 high-correlation pairs optimal for concentrated liquidity positions.',
        impact: {
          revenue: 'High correlation pairs',
          efficiency: '0.81 max correlation'
        }
      },
      'pool_parameter_optimizer': {
        title: 'Pool Parameters Optimized',
        message: 'Asymmetric concentration parameters optimized for one-sided JIT liquidity provision.',
        impact: {
          revenue: 'Minimized price impact',
          efficiency: '0.25/0.85 concentration'
        }
      },
      'batch_execution_planner': {
        title: 'Batch Execution Plan Ready',
        message: 'Optimal batch strategy calculated: 12 batches over 5 days with minimal price impact.',
        impact: {
          revenue: '67% impact reduction',
          efficiency: '12 optimal batches'
        }
      }
    };
    return successData[actionType] || {
      title: 'Action Complete',
      message: 'Operation completed successfully.',
      impact: null
    };
  };

  const getActionSteps = (actionType) => {
    const steps = {
      'volatility_analyzer': [
        'Fetching real-time DAO token prices...',
        'Calculating historical volatility metrics...',
        'Analyzing standard deviation patterns...',
        'Identifying risk concentration areas...',
        'Generating volatility report...'
      ],
      'correlation_calculator': [
        'Loading token pair historical data...',
        'Computing Pearson correlation coefficients...',
        'Analyzing correlation matrices...',
        'Identifying optimal merger pairs...',
        'Calculating concentration parameters...'
      ],
      'pool_parameter_optimizer': [
        'Analyzing token pair characteristics...',
        'Calculating asymmetric concentration parameters...',
        'Optimizing for one-sided liquidity provision...',
        'Simulating price discovery efficiency...',
        'Generating optimal pool configuration...'
      ],
      'batch_execution_planner': [
        'Loading merger configuration parameters...',
        'Calculating optimal batch sizes...',
        'Simulating price impact for each batch...',
        'Optimizing execution timing intervals...',
        'Generating batch execution strategy...'
      ]
    };
    return steps[actionType] || ['Processing request...'];
  };


  const generateActionResponse = (actionType) => {
    const responses = {
      'volatility_analyzer': `**Volatility Analysis Complete** 📈

**Current Market Volatility:**
• UNI: 42.3% annualized (↑ 8.2% from 7-day avg)
• AAVE: 38.7% annualized (stable)
• LDO: 52.1% annualized (⚠️ high volatility)
• Average DAO volatility: 44.4%

**Risk Assessment:**
✓ 3 high-volatility pairs identified
✓ Recommend wider concentration for volatile assets
✓ UNI-COMP showing lowest volatility correlation
✓ Optimal swap timing: low volatility windows

**Strategic Insight:** Higher volatility requires more conservative concentration parameters and additional execution batches to minimize price impact.`,

      'correlation_calculator': `**Correlation Analysis Complete** 🔗

**Top Correlated Pairs:**
• UNI-COMP: 0.81 correlation (excellent for mergers)
• AAVE-CRV: 0.76 correlation (strong positive)
• LDO-RPL: 0.73 correlation (liquid staking synergy)
• SNX-BAL: 0.68 correlation (DeFi infrastructure)

**Merger Recommendations:**
✓ UNI-COMP: High correlation supports tight price discovery
✓ AAVE-CRV: Suitable for gradual execution strategy
✓ Low correlation pairs need more batches
✓ 12 high-correlation opportunities identified

**Strategic Insight:** High correlation reduces price discovery risk and enables smoother merger execution with minimal market disruption.`,

      'pool_parameter_optimizer': `**Pool Parameter Optimization Complete** 🎯

**Asymmetric Configuration:**
• Phased-out token (X): 0.25 concentration
• Surviving token (Y): 0.85 concentration
• Price discovery zone: ±15% from equilibrium
• One-sided liquidity model confirmed

**Optimization Results:**
✓ Minimized price impact for large swaps
✓ 67 parameter combinations analyzed
✓ Optimal for gradual price discovery
✓ Supports 5-30 batch execution

**Strategic Configuration:** Asymmetric parameters enable efficient price discovery while protecting the surviving token from excessive dilution.`,

      'batch_execution_planner': `**Batch Execution Plan Complete** 📊

**Execution Strategy:**
• Optimal batch count: 12 batches
• Time span: 5 days (10 hours per batch)
• Price impact per batch: 0.8-1.2%
• Total price impact reduction: 67%

**Batch Distribution:**
✓ Batches 1-3: 15% each (price discovery phase)
✓ Batches 4-9: 8% each (steady execution)
✓ Batches 10-12: 6% each (completion phase)
✓ Adapts to market conditions in real-time

**Strategic Execution:** Phased batching minimizes market disruption while allowing natural price discovery through the one-sided JIT liquidity mechanism.`
    };
    return responses[actionType] || 'Analysis complete. Results processed successfully.';
  };

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.good) return 'text-green-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusGradient = (value, thresholds) => {
    if (value >= thresholds.good) return 'from-green-500 to-emerald-600';
    if (value >= thresholds.warning) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-x-hidden">
      {/* Ambient Effects */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Command Center Header */}
        <motion.div 
          ref={heroRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-12 rounded-3xl p-12 bg-gradient-to-r from-black/40 to-gray-900/40 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Brain className="w-16 h-16 text-blue-400" />
                <div>
                  <h1 className="text-5xl font-extralight text-white tracking-tight">Merger Command Center</h1>
                  <p className="text-xl text-white/60 font-light">One-Sided JIT Liquidity Analysis</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-8">
                <div className="text-center">
                  <AnimatedNumber 
                    value={liveMetrics.activeMergers} 
                    suffix="" 
                    decimals={0}
                    fontSize="text-2xl"
                    color="text-yellow-400"
                  />
                  <div className="text-white/60 text-sm">Active Mergers</div>
                </div>
                <div className="text-center">
                  <AnimatedNumber 
                    value={liveMetrics.priceDiscoveryProgress} 
                    suffix="%" 
                    decimals={1}
                    fontSize="text-2xl"
                    color="text-blue-400"
                  />
                  <div className="text-white/60 text-sm">Price Discovery</div>
                </div>
                <div className="text-center">
                  <AnimatedNumber 
                    value={liveMetrics.averageDilution} 
                    suffix="%" 
                    decimals={1}
                    fontSize="text-2xl"
                    color="text-green-400"
                  />
                  <div className="text-white/60 text-sm">Avg Dilution</div>
                </div>
                <div className="text-center">
                  <AnimatedNumber 
                    value={liveMetrics.mergerSuccessRate} 
                    suffix="%" 
                    decimals={1}
                    fontSize="text-2xl"
                    color={getStatusColor(liveMetrics.mergerSuccessRate, { good: 90, warning: 80 })}
                  />
                  <div className="text-white/60 text-sm">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Live Status Orb */}
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-24 h-24 rounded-full bg-gradient-to-r ${getStatusGradient(liveMetrics.mergerSuccessRate, { good: 90, warning: 80 })} shadow-2xl flex items-center justify-center`}
              >
                <Activity className="w-8 h-8 text-white" />
              </motion.div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-black animate-pulse"></div>
            </div>
          </div>
        </motion.div>

        {/* Main Command Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* FORMULA Chat Interface */}
          <div className="lg:col-span-2 h-[600px]">
            <motion.div 
              ref={chatRef}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 h-full flex flex-col"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Brain className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-light text-white">FORMULA Command Interface</h3>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20'
                    }`}>
                      <MarkdownRenderer 
                        content={message.content} 
                        className="text-sm leading-relaxed"
                      />
                      {message.confidence && (
                        <div className="text-xs opacity-70 mt-2">Confidence: {message.confidence}%</div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 backdrop-blur-sm text-gray-100 px-4 py-2 rounded-2xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={isListening ? "🎙️ Listening... speak now" : "Ask FORMULA: 'Analyze merger opportunities' or 'Check price discovery progress'"}
                      className={`w-full bg-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
                        isListening ? 'ring-red-400/30 border-red-400/50' : 'ring-blue-500/50 border-white/20'
                      } backdrop-blur-sm border placeholder-white/50 transition-all`}
                    />
                    {/* Interim speech results overlay */}
                    {interimTranscript && (
                      <div className="absolute inset-0 px-4 py-3 pointer-events-none flex items-center overflow-hidden">
                        <span className="text-white/80 text-sm">
                          {inputText}
                          <span className="text-blue-300 animate-pulse font-medium">{interimTranscript}</span>
                          <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                        </span>
                      </div>
                    )}
                    {/* Recording indicator */}
                    {isListening && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="flex space-x-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-1 h-3 bg-red-400 rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleMicrophoneToggle}
                    disabled={!speechSupported}
                    className={`px-4 py-3 rounded-xl transition-all backdrop-blur-sm relative ${
                      isListening 
                        ? 'bg-red-600/80 hover:bg-red-600 border-red-500/50 animate-pulse' 
                        : speechSupported 
                          ? 'bg-white/10 hover:bg-white/20 border-white/20'
                          : 'bg-gray-600/50 cursor-not-allowed border-gray-500/50'
                    } border`}
                    title={!speechSupported ? 'Speech recognition not supported' : isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 text-white" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      </>
                    ) : (
                      <Mic className={`w-4 h-4 ${speechSupported ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all backdrop-blur-sm"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>

              </div>
            </motion.div>
          </div>

          {/* Live Merger Events */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-white">Live Merger Events</h3>
                <Bell className="w-5 h-5 text-blue-400" />
              </div>
              
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className={`w-5 h-5 mt-1 ${
                        notification.severity === 'critical' ? 'text-red-400' : 
                        notification.severity === 'warning' ? 'text-yellow-400' : 'text-emerald-400'
                      }`} />
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-medium">{notification.title}</h4>
                        <p className="text-white/70 text-xs mt-1">{notification.message.substring(0, 60)}...</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-white/50">
                            {Math.floor((Date.now() - new Date(notification.timestamp)) / 60000)}m ago
                          </span>
                          <span className="text-xs text-blue-400 font-mono">
                            {notification.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Analysis Modules */}
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-white">AI Analysis Modules</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => runAnalysisSimulation('volatility_analyzer')}
                  disabled={executingActions.has('volatility_analyzer')}
                  className="relative p-3 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 rounded-xl border border-blue-500/30 transition-all group overflow-hidden"
                >
                  {executingActions.has('volatility_analyzer') ? (
                    <>
                      <div className="absolute inset-0 bg-blue-500/20">
                        <div 
                          className="h-full bg-blue-500/40 transition-all duration-300"
                          style={{ width: `${actionProgress['volatility_analyzer'] || 0}%` }}
                        />
                      </div>
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <div className="text-xs text-white">{actionProgress['volatility_analyzer'] || 0}%</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs text-white">Volatility Analyzer</div>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => runAnalysisSimulation('correlation_calculator')}
                  disabled={executingActions.has('correlation_calculator')}
                  className="relative p-3 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 rounded-xl border border-blue-500/30 transition-all group overflow-hidden"
                >
                  {executingActions.has('correlation_calculator') ? (
                    <>
                      <div className="absolute inset-0 bg-blue-500/20">
                        <div 
                          className="h-full bg-blue-500/40 transition-all duration-300"
                          style={{ width: `${actionProgress['correlation_calculator'] || 0}%` }}
                        />
                      </div>
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <div className="text-xs text-white">{actionProgress['correlation_calculator'] || 0}%</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs text-white">Correlation Engine</div>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => runAnalysisSimulation('pool_parameter_optimizer')}
                  disabled={executingActions.has('pool_parameter_optimizer')}
                  className="relative p-3 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 rounded-xl border border-emerald-500/30 transition-all group overflow-hidden"
                >
                  {executingActions.has('pool_parameter_optimizer') ? (
                    <>
                      <div className="absolute inset-0 bg-emerald-500/20">
                        <div 
                          className="h-full bg-emerald-500/40 transition-all duration-300"
                          style={{ width: `${actionProgress['pool_parameter_optimizer'] || 0}%` }}
                        />
                      </div>
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <div className="text-xs text-white">{actionProgress['pool_parameter_optimizer'] || 0}%</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs text-white">Pool Parameters</div>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => runAnalysisSimulation('batch_execution_planner')}
                  disabled={executingActions.has('batch_execution_planner')}
                  className="relative p-3 bg-purple-600/20 hover:bg-purple-600/30 disabled:opacity-50 rounded-xl border border-purple-500/30 transition-all group overflow-hidden"
                >
                  {executingActions.has('batch_execution_planner') ? (
                    <>
                      <div className="absolute inset-0 bg-purple-500/20">
                        <div 
                          className="h-full bg-purple-500/40 transition-all duration-300"
                          style={{ width: `${actionProgress['batch_execution_planner'] || 0}%` }}
                        />
                      </div>
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <div className="text-xs text-white">{actionProgress['batch_execution_planner'] || 0}%</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs text-white">Batch Execution</div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNotificationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-3xl p-8 border border-white/20 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className={`w-6 h-6 ${
                  selectedNotification.severity === 'critical' ? 'text-red-400' : 
                  selectedNotification.severity === 'warning' ? 'text-yellow-400' : 'text-emerald-400'
                }`} />
                <h3 className="text-lg font-medium text-white">{selectedNotification.title}</h3>
              </div>
              
              <p className="text-white/80 mb-6">{selectedNotification.message}</p>
              
              <div className="flex items-center justify-between mb-6">
                <span className="text-white/60 text-sm">Confidence: {selectedNotification.confidence}%</span>
                <span className="text-white/60 text-sm">{new Date(selectedNotification.timestamp).toLocaleString()}</span>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowNotificationModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => {
                    // Run the relevant analysis based on the notification
                    const analysisActions = {
                      'critical': () => runAnalysisSimulation('volatility_analyzer'),
                      'warning': () => runAnalysisSimulation('pool_parameter_optimizer'),
                      'success': () => runAnalysisSimulation('correlation_calculator'),
                      'info': () => runAnalysisSimulation('batch_execution_planner')
                    };
                    
                    const actionHandler = analysisActions[selectedNotification.severity] || analysisActions['info'];
                    actionHandler();
                    
                    setShowNotificationModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all"
                >
                  Run Analysis
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Success Notification */}
      <SuccessNotification
        show={successNotification.show}
        title={successNotification.title}
        message={successNotification.message}
        impact={successNotification.impact}
        onClose={() => setSuccessNotification(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default CommandCenter;