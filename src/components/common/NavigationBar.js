import { motion } from 'framer-motion';

/**
 * MD3 Navigation Bar - Material Design 3 Expressive
 *
 * Modern floating bottom navigation with pill indicators
 * Inspired by iOS 18 / Android 15 design language
 */
const NavigationBar = ({ tabs, onTabChange, darkMode }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        className="mx-4 mb-4 pointer-events-auto"
      >
        <div
          className="rounded-full backdrop-blur-xl overflow-hidden"
          style={{
            background: darkMode
              ? 'rgba(30, 30, 35, 0.85)'
              : 'rgba(255, 255, 255, 0.88)',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex justify-around items-center px-2 h-[64px]">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = tab.active;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="flex flex-col items-center justify-center flex-1 gap-1 relative py-2 outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Pill Background */}
                  <div className="relative flex items-center justify-center w-14 h-8">
                    {/* Active Indicator Pill - Sans animation */}
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'var(--md-sys-color-primary)',
                        }}
                      />
                    )}

                    {/* Icon */}
                    <div className="relative z-10">
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.5 : 2}
                        style={{
                          color: isActive
                            ? 'var(--md-sys-color-on-primary)'
                            : darkMode
                              ? 'rgba(255, 255, 255, 0.6)'
                              : 'rgba(0, 0, 0, 0.5)',
                        }}
                      />
                    </div>

                    {/* Badge */}
                    {tab.badge > 0 && (
                      <span
                        className="absolute -top-1 right-0 
                          min-w-[18px] h-[18px] px-1
                          flex items-center justify-center 
                          text-[10px] font-bold rounded-full"
                        style={{
                          background: 'var(--md-sys-color-error)',
                          color: 'var(--md-sys-color-on-error)',
                          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
                        }}
                      >
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className="text-[11px]"
                    style={{
                      color: isActive
                        ? 'var(--md-sys-color-primary)'
                        : darkMode
                          ? 'rgba(255, 255, 255, 0.6)'
                          : 'rgba(0, 0, 0, 0.5)',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </div>
  );
};

export default NavigationBar;
