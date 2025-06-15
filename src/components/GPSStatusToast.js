import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, MapPin, MapPinOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const GPSStatusToast = ({ status, darkMode }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status) {
      setIsVisible(true);
      // Auto-hide après 3 secondes
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!status) return null;

  const getStatusConfig = () => {
    switch (status.type) {
      case 'gps_enabled':
        return {
          icon: CheckCircle,
          bgColor: darkMode ? 'bg-green-800' : 'bg-green-500',
          textColor: 'text-white',
          message: '🎯 GPS activé - Position mise à jour',
        };
      case 'gps_disabled':
        return {
          icon: MapPinOff,
          bgColor: darkMode ? 'bg-red-800' : 'bg-red-500',
          textColor: 'text-white',
          message: 'GPS désactivé',
        };
      case 'gps_updating':
        return {
          icon: MapPin,
          bgColor: darkMode ? 'bg-blue-800' : 'bg-blue-500',
          textColor: 'text-white',
          message: '📍 Mise à jour de votre position...',
        };
      default:
        return {
          icon: MapPin,
          bgColor: darkMode ? 'bg-gray-800' : 'bg-gray-500',
          textColor: 'text-white',
          message: status.message || 'Changement GPS',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
                     ${config.bgColor} ${config.textColor} 
                     px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2
                     max-w-sm mx-auto backdrop-blur-sm`}
        >
          <IconComponent size={20} />
          <span className="font-medium text-sm">{config.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GPSStatusToast;
