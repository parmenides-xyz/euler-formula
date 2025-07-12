import { Activity, AlertCircle, Brain, TrendingDown, TrendingUp, DollarSign, Users, Database } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { aiModules, liveEvents } from '../services/mergerDataService';
import { formatCurrency, useData } from '../context/DataContext';

import AnimatedNumber from './AnimatedNumber';
import { MergerRecommendations } from '../utils/mergerRecommendations';
import MarkdownRenderer from './MarkdownRenderer';
import { useLiquidGlass } from './SimpleLiquidGlass';

const PremiumHomepage = () => {
  const { prices, circulationData, mergerConfiguration, loading } = useData();
  const [aiStatus, setAiStatus] = useState({ status: 'green', message: '', confidence: 0 });
  const [notifications, setNotifications] = useState([]);
  
  // Liquid glass refs for each major component
  const heroRef = useLiquidGlass({ width: 800, height: 400 });
  const statusRef = useLiquidGlass({ width: 300, height: 200 });
  const insightsRef = useLiquidGlass({ width: 600, height: 300 });

  useEffect(() => {
    if (prices.length > 0 && circulationData) {
      // Generate merger recommendations
      const mergerAI = new MergerRecommendations();
      const analysis = mergerAI.analyzeMarketConditions();
      
      // Set AI status based on analysis
      setAiStatus({
        status: analysis.status,
        message: analysis.message,
        confidence: analysis.confidence
      });
      
      // Generate dynamic notifications based on current data
      const dynamicNotifications = generateNotifications(prices, circulationData);
      
      // Combine with live events
      const combinedNotifications = [
        ...dynamicNotifications,
        ...liveEvents.slice(0, 3).map(event => ({
          id: event.id + 100, // Offset IDs to avoid conflicts
          type: event.severity,
          title: event.title,
          message: event.message,
          timestamp: event.timestamp,
          confidence: event.confidence
        }))
      ].slice(0, 3); // Keep top 3 notifications
      
      setNotifications(combinedNotifications);
    }
  }, [prices, circulationData]);

  const generateNotifications = (prices, circulationData) => {
    const notifications = [];
    
    // Check for high volatility in DAO tokens
    if (prices.length > 0) {
      const highVolTokens = prices.filter(p => p.volatility > 0.4);
      if (highVolTokens.length > 0) {
        notifications.push({
          id: 1,
          type: 'critical',
          title: 'High Volatility Alert',
          message: `${highVolTokens[0].symbol} volatility at ${(highVolTokens[0].volatility * 100).toFixed(1)}%. Consider adjusting concentration parameters.`,
          timestamp: new Date(),
          confidence: 92
        });
      }
    }

    // Check for merger opportunities based on market cap
    if (circulationData) {
      const viableTokens = Object.values(circulationData).filter(token => token.marketCap > 10000000);
      if (viableTokens.length < 3) {
        notifications.push({
          id: 2,
          type: 'warning',
          title: 'Limited Merger Options',
          message: `Only ${viableTokens.length} tokens have sufficient market cap (>$10M) for viable mergers.`,
          timestamp: new Date(),
          confidence: 89
        });
      }
    }
    
    // Check for high correlation pairs
    if (prices.length >= 2 && circulationData) {
      const viableTokens = Object.values(circulationData)
        .filter(token => token.marketCap > 10000000)
        .slice(0, 3); // Check top 3 for demo
      if (viableTokens.length >= 2) {
        notifications.push({
          id: 3,
          type: 'opportunity',
          title: 'Merger Opportunity Detected',
          message: `${viableTokens.length} DAOs with sufficient liquidity for mergers. Run correlation analysis for optimal pairs.`,
          timestamp: new Date(),
          confidence: 91
        });
      }
    }

    return notifications;
  };

  const getStatusGradient = (status) => {
    switch (status) {
      case 'green': return 'from-emerald-500 to-teal-600';
      case 'yellow': return 'from-purple-500 to-blue-600';
      case 'red': return 'from-red-500 to-rose-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center overflow-hidden">
        {/* Ambient Loading Effects */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
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
            <div className="absolute inset-6 w-20 h-20 border-4 border-transparent border-t-amber-400 rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-2xl"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-extralight text-white tracking-tight mb-4">FORMULA</h2>
            <div className="space-y-2">
              <motion.p 
                key={loading ? 'loading' : 'loaded'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/60 font-light"
              >
                Initializing DAO merger simulation systems...
              </motion.p>
              <div className="flex justify-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 bg-blue-400 rounded-full"
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
            <div>✓ One-sided JIT liquidity model initialized</div>
            <div>✓ Token circulation data connected</div>
            <div>✓ Merger simulation engine online</div>
            <div>
              <span className="inline-block" style={{ width: '0.9em' }}>
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              </span>
              {' '}Calibrating merger simulation algorithms...
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section - Chat-Focused */}
        <div 
          ref={heroRef}
          className="relative mb-16 rounded-3xl p-12 bg-gradient-to-r from-black/40 to-gray-900/40 backdrop-blur-xl"
        >
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center space-x-4">
              <Brain className="w-24 h-24 text-blue-500" />
              <div>
                <h1 className="text-6xl font-extralight text-white tracking-tight">FORMULA</h1>
                <p className="text-2xl text-white/60 font-light">DAO Merger Simulation Platform</p>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-xl text-white/80 font-light leading-relaxed mb-8">
                "Welcome to FORMULA! I analyze token circulation data, simulate one-sided JIT liquidity pools, 
                and identify optimal merger opportunities using EulerSwap's asymmetric concentration parameters."
              </p>
              
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-light text-white mb-2">
                    {circulationData ? Object.values(circulationData).filter(t => t.marketCap > 10000000).length : 0}
                  </div>
                  <div className="text-white/60">Viable DAOs</div>
                </div>
                
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getStatusGradient(aiStatus.status)} shadow-xl flex items-center justify-center`}>
                  <Activity className="w-6 h-6 text-white animate-pulse" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-light text-white mb-2">{aiStatus.confidence}%</div>
                  <div className="text-white/60">AI Confidence</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Notifications - Primary Focus */}
        <div className="mb-16">
          <h2 className="text-3xl font-light text-white mb-8 text-center">Live AI Notifications</h2>
          
          {notifications.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {notifications.map((notification) => (
                <div key={notification.id} className="group relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${
                    notification.type === 'critical' ? 'from-red-500/30 to-rose-500/30' : 
                    notification.type === 'opportunity' ? 'from-emerald-500/30 to-teal-500/30' :
                    'from-yellow-500/30 to-purple-500/30'
                  } rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity`}></div>
                  
                  <div className="relative bg-black/60 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-2xl ${
                        notification.type === 'critical' ? 'bg-red-500/20' : 
                        notification.type === 'opportunity' ? 'bg-emerald-500/20' :
                        'bg-yellow-500/20'
                      }`}>
                        <AlertCircle className={`w-8 h-8 ${
                          notification.type === 'critical' ? 'text-red-400' : 
                          notification.type === 'opportunity' ? 'text-emerald-400' :
                          'text-yellow-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-medium text-white mb-2">{notification.title}</h3>
                        <MarkdownRenderer 
                          content={notification.message} 
                          className="text-white/80 text-lg mb-4 leading-relaxed"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-white/50 text-sm">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white/60 text-sm">Confidence:</span>
                            <span className="text-blue-400 font-mono text-lg">
                              {notification.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-2xl font-light text-white mb-4">All Systems Optimal</h3>
              <p className="text-white/60 text-lg font-light max-w-2xl mx-auto">
                FORMULA is continuously analyzing token circulation and market conditions. All merger parameters are within optimal ranges. 
                I'll notify you immediately of any arbitrage opportunities or risk alerts.
              </p>
            </div>
          )}
        </div>

        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Merger Opportunities Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-yellow-500/30 transition-all">
              <div className="flex items-center justify-between mb-6">
                <Database className="w-6 h-6 text-yellow-500" />
                <div className="text-sm text-white/60 font-mono">MERGERS</div>
              </div>
              <div className="space-y-2">
                <AnimatedNumber 
                  value={circulationData ? Math.floor(
                    Object.values(circulationData).filter(t => t.marketCap > 10000000).length * 
                    (Object.values(circulationData).filter(t => t.marketCap > 10000000).length - 1) / 2
                  ) : 0}
                  suffix=" pairs"
                  decimals={0}
                  fontSize="text-3xl"
                  color="text-white"
                />
                <p className="text-white/60">Possible Mergers</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white/50">Min MC:</span>
                  <span className="text-sm text-green-400">$10M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Market Cap Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between mb-6">
                <DollarSign className="w-6 h-6 text-blue-500" />
                <div className="text-sm text-white/60 font-mono">MARKET CAP</div>
              </div>
              <div className="space-y-2">
                <AnimatedNumber 
                  value={circulationData ? 
                    Object.values(circulationData).reduce((sum, token) => sum + (token.marketCap || 0), 0) / 1e9 : 0
                  }
                  prefix="$"
                  suffix="B"
                  decimals={1}
                  fontSize="text-3xl"
                  color="text-white"
                />
                <p className="text-white/60">Total Value</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white/50">Tokens:</span>
                  <span className="text-sm text-blue-400">
                    {circulationData ? Object.keys(circulationData).length : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Dilution Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between mb-6">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
                <div className="text-sm text-white/60 font-mono">DILUTION</div>
              </div>
              <div className="space-y-2">
                <AnimatedNumber 
                  value={mergerConfiguration?.dilutionPercentage || 8.5}
                  suffix="%"
                  decimals={1}
                  fontSize="text-3xl"
                  color="text-white"
                />
                <p className="text-white/60">Average Dilution</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white/50">Target:</span>
                  <span className="text-sm text-emerald-400">
                    &lt;15%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Status & Insights with Liquid Glass */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* AI Status */}
          <div 
            ref={statusRef}
            className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getStatusGradient(aiStatus.status)} animate-pulse`}></div>
              <h3 className="text-2xl font-light text-white">System Status</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-white/80 text-lg font-light leading-relaxed">
                {aiStatus.message}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-white/60">Confidence Level</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getStatusGradient(aiStatus.status)} transition-all duration-1000`}
                      style={{ width: `${aiStatus.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-mono">{aiStatus.confidence}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Notifications */}
          <div className="space-y-4">
            <h3 className="text-2xl font-light text-white mb-6">Critical Insights</h3>
            
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="group relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${
                    notification.type === 'critical' ? 'from-red-500/20 to-rose-500/20' : 'from-emerald-500/20 to-teal-500/20'
                  } rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity`}></div>
                  
                  <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-start space-x-4">
                      <AlertCircle className={`w-6 h-6 mt-1 ${
                        notification.type === 'critical' ? 'text-red-500' : 'text-emerald-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{notification.title}</h4>
                        <p className="text-white/70 text-sm mb-3">{notification.message}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          <span className="text-white/60 font-mono">
                            {notification.confidence}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <p className="text-white/60 font-light">All systems operating within normal parameters</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Call-to-Action */}
        <div 
          ref={insightsRef}
          className="relative bg-gradient-to-r from-black/40 to-gray-900/40 backdrop-blur-xl rounded-3xl p-12 border border-white/10 text-center"
        >
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-2xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-light text-white">Start Conversation</h3>
            </div>
            
            <p className="text-2xl text-white/80 font-light leading-relaxed">
              "Ready to simulate DAO mergers? Click the chat icon in the bottom right to begin our conversation. 
              I can help with circulation analysis, merger feasibility, one-sided JIT strategies, and optimal swap parameters."
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-white font-medium mb-3">Circulation Analysis</h4>
                <p className="text-white/70 text-sm">
                  "Ask me about token circulation, market caps, or correlation analysis"
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-white font-medium mb-3">Merger Feasibility</h4>
                <p className="text-white/70 text-sm">
                  "Request merger simulations, one-sided JIT analysis, or dilution projections"
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-white font-medium mb-3">Optimization Strategies</h4>
                <p className="text-white/70 text-sm">
                  "Get AI-powered recommendations for swap sizes, concentration parameters, and timing"
                </p>
              </div>
            </div>
            
            <div className="pt-8">
              <div className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <Brain className="w-6 h-6 text-white animate-pulse" />
                <span className="text-white font-medium">FORMULA is online and ready</span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumHomepage;