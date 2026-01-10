import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * MD3 Switch Component - Material Design 3 Expressive
 */
const MD3Switch = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  icon,
  checkedIcon,
  size = 'medium',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const sizes = {
    small: {
      track: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5',
      icon: 'text-[10px]',
    },
    medium: {
      track: 'w-14 h-8',
      thumb: 'w-6 h-6',
      translate: 'translate-x-6',
      icon: 'text-sm',
    },
    large: {
      track: 'w-16 h-9',
      thumb: 'w-7 h-7',
      translate: 'translate-x-7',
      icon: 'text-base',
    },
  };

  const handleClick = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  return (
    <div
      className={`flex items-center gap-4 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleClick}
    >
      {/* Switch */}
      <motion.div
        className={`
          relative shrink-0
          ${sizes[size].track}
          rounded-full
          transition-colors duration-200
          ${
            checked
              ? 'bg-[var(--md-sys-color-primary)]'
              : 'bg-[var(--md-sys-color-surface-container-highest)] border-2 border-[var(--md-sys-color-outline)]'
          }
          ${isFocused ? 'ring-2 ring-[var(--md-sys-color-primary)] ring-offset-2' : ''}
        `}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {/* Thumb */}
        <motion.div
          className={`
            absolute top-1/2 left-1
            ${sizes[size].thumb}
            rounded-full
            flex items-center justify-center
            ${
              checked
                ? 'bg-[var(--md-sys-color-on-primary)]'
                : 'bg-[var(--md-sys-color-outline)]'
            }
            shadow-sm
          `}
          initial={false}
          animate={{
            x: checked ? 24 : 0,
            y: '-50%',
            scale: checked ? 1.1 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          {/* Icon inside thumb */}
          {(checked && checkedIcon) || icon ? (
            <motion.span
              className={`${sizes[size].icon} ${checked ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-surface)]'}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {checked ? checkedIcon || icon : icon}
            </motion.span>
          ) : null}
        </motion.div>

        {/* Hidden input for accessibility */}
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => {}}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </motion.div>

      {/* Label */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-base font-medium text-[var(--md-sys-color-on-surface)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MD3Switch;
