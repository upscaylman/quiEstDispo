import React from 'react';
import { motion } from 'framer-motion';

const ActivityCard = ({ activity, friend, onJoin, darkMode }) => {
  const getActivityColor = (activityName) => {
    switch (activityName.toLowerCase()) {
      case 'coffee':
        return 'from-amber-400 to-orange-500';
      case 'lunch':
        return 'from-green-400 to-emerald-500';
      case 'drinks':
        return 'from-purple-400 to-pink-500';
      case 'chill':
        return 'from-blue-400 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{friend.avatar}</div>
          <div>
            <h3 className="font-semibold">{friend.name}</h3>
            <p className="text-sm opacity-60">{friend.location}</p>
          </div>
        </div>
        <div className={`bg-gradient-to-r ${getActivityColor(activity)} text-white px-3 py-1 rounded-full text-xs font-medium`}>
          {activity}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm opacity-50">
          {friend.timeLeft} min left
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onJoin}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
        >
          Join
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ActivityCard;
