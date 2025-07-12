import { Activity, CheckCircle, Clock, Loader2, TrendingUp, X, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

const SuccessNotification = ({ show, onClose, title, message, impact, details }) => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Success Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-md w-full mx-4 overflow-hidden">
              {/* Header with Success Animation */}
              <div className="relative p-8 text-center">
                {/* Animated Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
                
                {/* Success Icon with Pulse Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", damping: 15 }}
                  className="relative mb-6"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-2xl">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", damping: 12 }}
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                  </div>
                  
                  {/* Expanding Ring Animation */}
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ delay: 0.2, duration: 1.5 }}
                    className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-emerald-500"
                  />
                  
                  {/* Particle Effects */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ 
                        scale: 1,
                        opacity: 0,
                        x: Math.cos(i * 60 * Math.PI / 180) * 40,
                        y: Math.sin(i * 60 * Math.PI / 180) * 40
                      }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-400 rounded-full"
                    />
                  ))}
                </motion.div>

                {/* Title with Type Animation */}
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-medium text-white mb-4"
                >
                  {title}
                </motion.h3>

                {/* Message */}
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-white/80 leading-relaxed mb-6"
                >
                  {message}
                </motion.p>

                {/* Impact Metrics */}
                {impact && Object.keys(impact).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="p-4 bg-white/5 rounded-xl border border-white/10 mb-6"
                  >
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {Object.entries(impact).map(([key, value], index) => {
                        // Format the key into a readable label
                        const label = key
                          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                          .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                          .trim();
                        
                        // Choose color based on key type
                        let valueColor = 'text-emerald-400';
                        if (key.includes('dilution')) valueColor = 'text-yellow-400';
                        else if (key.includes('value') || key.includes('Value')) valueColor = 'text-blue-400';
                        else if (key.includes('efficiency')) valueColor = 'text-purple-400';
                        else if (key.includes('coverage')) valueColor = 'text-cyan-400';
                        
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-white/70">{label}:</span>
                            <span className={`${valueColor} font-medium`}>{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Detailed Information */}
                <AnimatePresence>
                  {showDetails && details && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 text-left"
                    >
                      <h4 className="text-white font-medium mb-3 text-center">📊 Detailed Analysis</h4>
                      <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center space-x-2 text-white/60"><Clock className="w-4 h-4" /><span>Simulation Time:</span></div>
                            <div className="text-white pl-6">{new Date().toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 text-white/60"><CheckCircle className="w-4 h-4" /><span>Status:</span></div>
                            <div className="text-green-400 pl-6">✅ Completed Successfully</div>
                          </div>
                        </div>
                        
                        {details.system_components_affected && (
                          <div>
                            <div className="flex items-center space-x-2 text-white/60"><Activity className="w-4 h-4" /><span>Components Analyzed:</span></div>
                            <div className="text-white pl-6">{details.system_components_affected.join(', ')}</div>
                          </div>
                        )}
                        
                        {details.performance_metrics && (
                          <div>
                            <div className="flex items-center space-x-2 text-white/60"><Activity className="w-4 h-4" /><span>Performance Metrics:</span></div>
                            <ul className="text-white list-disc list-inside pl-6">
                              {details.performance_metrics.map((metric, index) => (
                                <li key={index}>
                                  {metric.metric}: <span className="text-green-400">{metric.value}</span> {metric.comment}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {details.next_recommended_actions && (
                          <div>
                            <div className="flex items-center space-x-2 text-white/60"><Zap className="w-4 h-4" /><span>Next Recommended Actions:</span></div>
                            <ul className="text-white list-disc list-inside pl-6">
                              {details.next_recommended_actions.map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="p-6 border-t border-white/10"
              >
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => details && setShowDetails(!showDetails)}
                    disabled={!details}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl transition-all font-medium flex items-center justify-center disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {!details ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Simulating...</span>
                      </>
                    ) : showDetails ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SuccessNotification;