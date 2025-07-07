import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {
  fetchPrices,
  fetchTreasuries,
  fetchVaults,
  analyzeMergerContext,
  calculateMergerConfiguration
} from '../services/api';

// Initial state
const initialState = {
  prices: [], // DAO token prices with history
  treasuries: [], // DAO treasury data
  vaults: null, // Euler Prime USDC vault data
  mergerConfiguration: null, // Calculated merger config
  loading: true,
  isUpdating: false,
  error: null,
  lastUpdated: null,
  // Analysis state
  analysis: null,
  isAnalyzing: false,
  analysisError: null
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_UPDATING: 'SET_UPDATING',
  SET_ERROR: 'SET_ERROR',
  SET_DATA: 'SET_DATA',
  REFRESH_DATA: 'REFRESH_DATA',
  SET_ANALYZING: 'SET_ANALYZING',
  SET_ANALYSIS: 'SET_ANALYSIS',
  SET_ANALYSIS_ERROR: 'SET_ANALYSIS_ERROR',
  SET_TREASURIES: 'SET_TREASURIES',
  SET_VAULTS: 'SET_VAULTS',
  SET_MERGER_CONFIG: 'SET_MERGER_CONFIG',
  SET_CALCULATING: 'SET_CALCULATING'
};

// Reducer function
const dataReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_UPDATING:
      return { ...state, isUpdating: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false, isUpdating: false };
    
    case ACTIONS.SET_DATA:
      return {
        ...state,
        ...action.payload,
        loading: false,
        isUpdating: false,
        error: null,
        lastUpdated: new Date().toISOString()
      };
    
    case ACTIONS.UPDATE_MACHINES:
      return {
        ...state,
        machines: { ...state.machines, ...action.payload },
        isUpdating: false
      };
    
    case ACTIONS.REFRESH_DATA:
      return {
        ...state,
        lastUpdated: new Date().toISOString()
      };
    
    case ACTIONS.UPDATE_SITE_CONFIG:
      return {
        ...state,
        ...action.payload
      };
    
    case ACTIONS.SET_ANALYZING:
      return { ...state, isAnalyzing: action.payload };
    
    case ACTIONS.SET_ANALYSIS:
      return { 
        ...state, 
        analysis: action.payload, 
        isAnalyzing: false, 
        analysisError: null 
      };
    
    case ACTIONS.SET_ANALYSIS_ERROR:
      return { 
        ...state, 
        analysisError: action.payload, 
        isAnalyzing: false 
      };
    
    default:
      return state;
  }
};

// Create context
const DataContext = createContext();

// Provider component
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Load data function
  const loadData = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const [prices, treasuries, vaults] = await Promise.all([
        fetchPrices(),
        fetchTreasuries(),
        fetchVaults()
      ]);
      
      dispatch({
        type: ACTIONS.SET_DATA,
        payload: { prices, treasuries, vaults }
      });
    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Calculate merger configuration function
  const calculateMergerConfig = async (daoA, daoB) => {
    try {
      dispatch({ type: ACTIONS.SET_UPDATING, payload: true });
      
      // Pass existing data to avoid re-fetching
      const existingData = {
        prices: state.prices,
        treasuries: state.treasuries,
        vaults: state.vaults
      };
      const mergerConfiguration = await calculateMergerConfiguration(daoA, daoB, existingData);
      
      dispatch({
        type: ACTIONS.SET_DATA,
        payload: { mergerConfiguration }
      });
      
      return mergerConfiguration;
    } catch (error) {
      console.error('Error calculating merger configuration:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Refresh data function
  const refreshData = async () => {
    dispatch({ type: ACTIONS.REFRESH_DATA });
    await loadData();
  };

  // Perform AI analysis function
  const performAnalysis = async () => {
    try {
      dispatch({ type: ACTIONS.SET_ANALYZING, payload: true });
      
      // Prepare merger context for analysis
      const mergerContext = {
        prices: state.prices,
        treasuries: state.treasuries,
        vaults: state.vaults,
        mergerConfiguration: state.mergerConfiguration,
        lastUpdated: state.lastUpdated
      };
      
      const analysisResult = await analyzeMergerContext(mergerContext);
      
      dispatch({ 
        type: ACTIONS.SET_ANALYSIS, 
        payload: analysisResult 
      });
      
      return analysisResult;
    } catch (error) {
      console.error('Error performing analysis:', error);
      dispatch({ 
        type: ACTIONS.SET_ANALYSIS_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    loadData();
    
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Context value
  const value = {
    ...state,
    loadData,
    calculateMergerConfig,
    refreshData,
    performAnalysis,
    dispatch
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Utility functions for data formatting
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2
  }).format(value);
};

export const formatChartData = (priceHistory) => {
  return priceHistory.map((point, index) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: point.price,
    value: point.price, // For compatibility with chart libraries
    index,
    timestamp: point.timestamp
  }));
};

export const getMetricColor = (metric) => {
  switch (metric) {
    // Major DAO tokens
    case 'UNI': return { primary: '#FF007A', secondary: '#E0006B', gradient: 'from-pink-500 to-pink-600' };
    case 'AAVE': return { primary: '#B6509E', secondary: '#A2478A', gradient: 'from-purple-500 to-purple-600' };
    case 'LDO': return { primary: '#00A3FF', secondary: '#0093E6', gradient: 'from-blue-500 to-blue-600' };
    case 'COMP': return { primary: '#00D395', secondary: '#00BE86', gradient: 'from-green-500 to-green-600' };
    case 'CRV': return { primary: '#FA4454', secondary: '#E13D4B', gradient: 'from-red-500 to-red-600' };
    case 'SKY': return { primary: '#F4B731', secondary: '#F2A212', gradient: 'from-yellow-500 to-yellow-600' };
    case 'SUSHI': return { primary: '#FA52A0', secondary: '#E14A90', gradient: 'from-pink-400 to-pink-500' };
    case 'BAL': return { primary: '#1E1E1E', secondary: '#0A0A0A', gradient: 'from-gray-800 to-gray-900' };
    case 'SNX': return { primary: '#00D1FF', secondary: '#00BCEB', gradient: 'from-cyan-400 to-cyan-500' };
    case 'YFI': return { primary: '#006AE3', secondary: '#0059C1', gradient: 'from-blue-600 to-blue-700' };
    // Additional DAO tokens
    case 'EUL': return { primary: '#E84142', secondary: '#D63939', gradient: 'from-red-500 to-red-600' };
    case 'GLM': return { primary: '#464D74', secondary: '#3A4163', gradient: 'from-indigo-700 to-indigo-800' };
    case 'OHM': return { primary: '#383838', secondary: '#2A2A2A', gradient: 'from-gray-700 to-gray-800' };
    case 'GNO': return { primary: '#009CB4', secondary: '#008A9F', gradient: 'from-teal-500 to-teal-600' };
    case 'ENS': return { primary: '#5298FF', secondary: '#4185E6', gradient: 'from-blue-400 to-blue-500' };
    case 'COW': return { primary: '#052B51', secondary: '#041F3B', gradient: 'from-blue-900 to-blue-950' };
    case 'CVX': return { primary: '#3F3F3F', secondary: '#2F2F2F', gradient: 'from-gray-700 to-gray-800' };
    case 'LQTY': return { primary: '#2EB6EA', secondary: '#1FA5DA', gradient: 'from-sky-400 to-sky-500' };
    case 'SILO': return { primary: '#E5312B', secondary: '#D42A24', gradient: 'from-red-500 to-red-600' };
    case 'XVS': return { primary: '#F8D12F', secondary: '#E7C01E', gradient: 'from-yellow-400 to-yellow-500' };
    case 'MNT': return { primary: '#000000', secondary: '#1A1A1A', gradient: 'from-black to-gray-900' };
    // Treasury types
    case 'ownTokens': return { primary: '#10B981', secondary: '#059669', gradient: 'from-emerald-500 to-teal-600' };
    case 'stablecoins': return { primary: '#3B82F6', secondary: '#2563EB', gradient: 'from-blue-500 to-blue-600' };
    default: return { primary: '#6B7280', secondary: '#4B5563', gradient: 'from-gray-500 to-gray-600' };
  }
}; 