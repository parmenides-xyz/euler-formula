import React from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

const AnimatedNumber = ({ 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 2, 
  className = '',
  showSign = false,
  duration = 1.5,
  fontSize = 'text-2xl',
  color = 'text-white'
}) => {
  const formatValue = (val) => {
    if (showSign && val > 0) {
      return `+${val}`;
    }
    return val;
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${className} ${fontSize} ${color} font-light tracking-tight`}
    >
      <CountUp
        start={0}
        end={value}
        duration={duration}
        decimals={decimals}
        decimal="."
        separator=","
        prefix={prefix}
        suffix={suffix}
        preserveValue={true}
        formattingFn={(value) => {
          const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }).format(value);
          return `${prefix}${formatValue(formatted)}${suffix}`;
        }}
      />
    </motion.div>
  );
};

export default AnimatedNumber;