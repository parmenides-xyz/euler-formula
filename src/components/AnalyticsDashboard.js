import { Activity, Brain, Zap, Database, DollarSign } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import React, { useState } from 'react';
import { formatChartData, formatCurrency, getMetricColor, useData } from '../context/DataContext';

import AnimatedNumber from './AnimatedNumber';
import { useLiquidGlass } from './SimpleLiquidGlass';

const AnalyticsDashboard = () => {
  const { 
    prices, 
    treasuries,
    vaults,
    loading
  } = useData();
  
  const [selectedToken, setSelectedToken] = useState('UNI');
  const [hoveredData, setHoveredData] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Liquid glass refs for major components
  const chartContainerRef = useLiquidGlass({ width: 800, height: 400 });
  const metricsGridRef = useLiquidGlass({ width: 600, height: 300 });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center overflow-hidden">
        {/* Dynamic Background */}
        <div className="fixed inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center relative z-10"
        >
          <div className="relative mb-8">
            {/* Animated Chart Icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 flex items-center justify-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Activity className="w-6 h-6 text-blue-400" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Data Flow Animation */}
            <div className="flex justify-center space-x-4 mb-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    duration: 1.2, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                  className="w-3 h-8 bg-gradient-to-t from-blue-500/30 to-blue-500 rounded-full"
                />
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-extralight text-white tracking-tight mb-4">Analytics Dashboard</h2>
            <p className="text-white/60 font-light mb-6">Loading DAO treasury and price data...</p>
            
            {/* Loading Progress */}
            <div className="w-64 mx-auto">
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>Loading...</span>
                <span>Processing data streams</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 space-y-2 text-xs text-white/40"
          >
            <div className="flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full mr-2"
              />
              Connecting to market data feeds...
            </div>
            <div>✓ Treasury monitoring systems online</div>
            <div>✓ Performance metrics calculated</div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Get selected token data
  const selectedTokenData = prices.find(p => p.symbol === selectedToken) || {};
  const chartData = selectedTokenData.priceHistory ? formatChartData(selectedTokenData.priceHistory) : [];
  const tokenColors = getMetricColor(selectedToken);
  
  // Custom tooltip component to suppress default tooltip
  const CustomTooltip = () => null;


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-40 left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-extralight text-white tracking-tight mb-4">
            DAO Analytics Dashboard
          </h1>
          <p className="text-white/60 text-lg font-light">Token prices, vault status, and treasury compositions</p>
        </div>

        {/* Vault Status Metrics */}
        <div 
          ref={metricsGridRef}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10"
        >
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative text-center p-6">
              <Database className="w-8 h-8 text-blue-500 mx-auto mb-4" />
              <div className="text-2xl font-light text-white mb-1">
                ${vaults ? (parseFloat(vaults.availableToBorrow) / 1e6).toFixed(1) + 'M' : '0.0M'}
              </div>
              <div className="text-white/60 text-sm">Available to Borrow</div>
              <div className="flex items-center justify-center mt-2 space-x-1">
                <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400">USDC Vault</span>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative text-center p-6">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
              <div className="text-2xl font-light text-white mb-1">
                {vaults ? vaults.utilizationPercent.toFixed(1) + '%' : '0.0%'}
              </div>
              <div className="text-white/60 text-sm">Vault Utilization</div>
              {vaults && (
                <div className={`text-xs mt-2 ${
                  vaults.utilizationPercent > 80 ? 'text-red-400' : 
                  vaults.utilizationPercent > 60 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {vaults.utilizationPercent > 80 ? 'High' : 
                   vaults.utilizationPercent > 60 ? 'Optimal' : 'Low'}
                </div>
              )}
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative text-center p-6">
              <Brain className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
              <div className="text-2xl font-light text-white mb-1">
                {vaults ? vaults.currentAPY : '0.0%'}
              </div>
              <div className="text-white/60 text-sm">Borrow APY</div>
              <div className="flex items-center justify-center mt-2 space-x-1">
                <span className="text-xs text-emerald-400">Annual Rate</span>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative text-center p-6">
              <DollarSign className="w-8 h-8 text-blue-500 mx-auto mb-4" />
              <div className="text-2xl font-light text-white mb-1">
                ${treasuries ? (treasuries.reduce((sum, dao) => sum + dao.treasuries.reduce((s, t) => s + (t.tvl || 0), 0), 0) / 1e9).toFixed(1) + 'B' : '0.0B'}
              </div>
              <div className="text-white/60 text-sm">Total Treasury Value</div>
              <div className="flex items-center justify-center mt-2 space-x-1">
                <span className="text-xs text-blue-400">{treasuries ? treasuries.length : 0} DAOs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Chart Section */}
        <div 
          ref={chartContainerRef}
          className="mb-12 p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-light text-white">Token Price History</h3>
            <div className="flex items-center space-x-4">
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 focus:border-blue-500 transition-all"
              >
                {prices.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              {selectedTokenData.currentPrice && (
                <div className="text-white/60">
                  Current: <span className="text-white font-medium">${selectedTokenData.currentPrice.toFixed(3)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="h-80 p-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onMouseMove={(e) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const payload = e.activePayload[0].payload;
                    setHoveredData(payload);
                    setShowTooltip(true);
                  }
                }}
                onMouseLeave={() => {
                  setShowTooltip(false);
                  setHoveredData(null);
                }}
              >
                <defs>
                  <linearGradient id={`gradient-${selectedToken}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={tokenColors.primary} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={tokenColors.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={tokenColors.primary} stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="lineBlur"/>
                    <feMerge>
                      <feMergeNode in="lineBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  fontSize={10}
                  fontWeight={300}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }}
                  tickMargin={15}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  fontSize={10}
                  fontWeight={300}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }}
                  tickMargin={15}
                  width={60}
                  tickFormatter={(value) => {
                    if (value < 1) return `$${value.toFixed(3)}`;
                    if (value < 100) return `$${value.toFixed(1)}`;
                    return `$${Math.round(value)}`;
                  }}
                  domain={['dataMin * 0.95', 'dataMax * 1.05']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={tokenColors.primary}
                  strokeWidth={3}
                  fill={`url(#gradient-${selectedToken})`}
                  dot={false}
                  activeDot={{ 
                    r: 8, 
                    stroke: tokenColors.primary, 
                    strokeWidth: 4,
                    fill: 'rgba(0, 0, 0, 0.9)',
                    filter: 'url(#glow)',
                    style: { dropShadow: `0 0 10px ${tokenColors.primary}` }
                  }}
                  connectNulls={true}
                  animationDuration={800}
                />
                <Tooltip content={<CustomTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Custom Floating Tooltip */}
            <AnimatePresence>
              {showTooltip && hoveredData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                >
                  <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
                    <div className="text-center space-y-4">
                      <div className="text-white/60 text-sm font-medium">
                        {selectedToken} Price
                      </div>
                      
                      <div className="space-y-2">
                        <AnimatedNumber 
                          value={hoveredData.price || 0}
                          prefix="$"
                          suffix=""
                          decimals={hoveredData.price < 1 ? 4 : hoveredData.price < 100 ? 2 : 0}
                          fontSize="text-5xl"
                          color={`text-${tokenColors.primary}`}
                          className="font-light"
                        />
                      </div>
                      
                      <div className="text-white/50 text-xs">
                        {hoveredData.time}
                      </div>
                      
                      {/* Price movement insight */}
                      <div className="text-xs text-white/70 max-w-xs text-center">
                        {selectedTokenData.priceHistory && selectedTokenData.priceHistory.length > 1 && (
                          <div>
                            {hoveredData.price > selectedTokenData.currentPrice * 1.1 && '📈 Above current price'}
                            {hoveredData.price < selectedTokenData.currentPrice * 0.9 && '📉 Below current price'}
                            {hoveredData.price >= selectedTokenData.currentPrice * 0.9 && 
                             hoveredData.price <= selectedTokenData.currentPrice * 1.1 && '➡️ Near current price'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        {/* Treasury List */}
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-light text-white">DAO Treasury Compositions</h3>
          </div>
          
          <div className="h-96 overflow-y-auto space-y-4 pr-2">
            {treasuries && treasuries.map((dao) => {
              const totalTreasury = dao.treasuries.reduce((sum, t) => sum + (t.tvl || 0), 0);
              const stablecoins = dao.treasuries.reduce((sum, t) => sum + (t.chainTvls?.stablecoins || 0), 0);
              const ownTokens = dao.treasuries.reduce((sum, t) => sum + (t.ownTokens || 0), 0);
              
              return (
                <div key={dao.symbol} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium">{dao.symbol}</h4>
                        <p className="text-white/60 text-sm">
                          Total: ${(totalTreasury / 1e6).toFixed(1)}M
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-white/60 text-xs">Stables/Own</div>
                        <div className="text-white text-sm">
                          ${(stablecoins / 1e6).toFixed(1)}M / ${(ownTokens / 1e6).toFixed(1)}M
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Stable ratio: {totalTreasury > 0 ? ((stablecoins / totalTreasury) * 100).toFixed(1) : 0}%</span>
                      <div className={`px-2 py-1 rounded-full ${
                        stablecoins > 10000000 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {stablecoins > 10000000 ? 'MERGER READY' : 'LIMITED COLLATERAL'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {(!treasuries || treasuries.length === 0) && (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">Loading treasury data...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;