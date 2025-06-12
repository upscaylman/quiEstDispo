import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, Film, Music, Users, Utensils, Wine, X } from 'lucide-react';
import React from 'react';

const ActivitySelectorModal = ({
  isOpen,
  onClose,
  onSelectActivity,
  darkMode = false,
}) => {
  const activities = [
    {
      id: 'coffee',
      label: 'Coffee',
      icon: Coffee,
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
    },
    {
      id: 'lunch',
      label: 'Lunch',
      icon: Utensils,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      id: 'drinks',
      label: 'Drinks',
      icon: Wine,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    {
      id: 'chill',
      label: 'Chill',
      icon: Users,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      id: 'clubbing',
      label: 'Clubbing',
      icon: Music,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
    },
    {
      id: 'cinema',
      label: 'Cinema',
      icon: Film,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
    },
  ];

  const handleActivitySelect = activityId => {
    onSelectActivity(activityId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4 py-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className={`${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } rounded-lg shadow-xl max-w-md w-full overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-opacity-20">
            <div>
              <h2 className="text-xl font-bold">Inviter vos amis</h2>
              <p
                className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                Choisissez une activité
              </p>
            </div>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Sélecteur d'activité */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {activities.map(activity => {
                const Icon = activity.icon;
                return (
                  <motion.button
                    key={activity.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleActivitySelect(activity.id)}
                    className={`${activity.color} ${activity.hoverColor} text-white p-6 rounded-xl font-medium transition-all duration-200 shadow-lg cursor-pointer aspect-square flex items-center justify-center`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Icon size={24} />
                      <span className="text-sm">{activity.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActivitySelectorModal;
