import { motion } from 'framer-motion';
import React from 'react';

const WarningBanner = ({
  icon: Icon,
  title,
  message,
  darkMode = false,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon size={24} className="text-orange-500" />
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h3 className="text-orange-800 font-medium text-sm mb-1">
              {title}
            </h3>
          )}
          <p className="text-orange-700 text-sm">{message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default WarningBanner;
