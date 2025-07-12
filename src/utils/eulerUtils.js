// Euler-specific utility functions

// Helper function to decode Euler AmountCap format
export function decodeAmountCap(rawCap) {
  if (rawCap === 0) return Number.MAX_SAFE_INTEGER; // No limit
  
  const exponent = rawCap & 63; // Last 6 bits
  const mantissa = rawCap >> 6;  // First 10 bits
  
  return Math.pow(10, exponent) * mantissa / 100;
}

// Format decoded cap value for display
export function formatCapValue(decodedCap) {
  if (decodedCap === Number.MAX_SAFE_INTEGER) {
    return 'Unlimited';
  }
  
  if (decodedCap >= 1e9) {
    return `${(decodedCap / 1e9).toFixed(1)}B`;
  } else if (decodedCap >= 1e6) {
    return `${(decodedCap / 1e6).toFixed(1)}M`;
  } else if (decodedCap >= 1e3) {
    return `${(decodedCap / 1e3).toFixed(1)}K`;
  }
  
  return decodedCap.toLocaleString();
}