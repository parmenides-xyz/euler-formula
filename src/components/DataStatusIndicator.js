import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

import React from 'react';
import { useData } from '../context/DataContext';

const DataStatusIndicator = () => {
  const { loading, error, lastUpdated, prices, circulationData } = useData();

  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (loading) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-4 h-4" />;
    if (loading) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (loading) return 'Loading';
    return 'Live';
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const date = new Date(lastUpdated);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getDataSummary = () => {
    if (!prices || !prices.length) return 'No data';
    
    const circulationCount = circulationData ? Object.keys(circulationData).length : 0;
    
    return `${prices.length} tokens • ${circulationCount} with live data`;
  };

  return (
    <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
      <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      <div className="text-xs text-white/60">
        <div>Updated: {formatLastUpdated()}</div>
        <div>{getDataSummary()}</div>
      </div>
      
      {!loading && !error && (
        <div className="flex items-center space-x-1">
          <Activity className="w-3 h-3 text-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Auto-refresh</span>
        </div>
      )}
    </div>
  );
};

export default DataStatusIndicator; 