import { useState } from 'react';

/**
 * MD3 Text Field (Outlined)
 *
 * Specs:
 * - Height: 56px
 * - Label: Floating
 * - Corners: 4px rounded
 */
const MD3TextField = ({
  label,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  error = false,
  helperText,
  disabled = false,
  placeholder = '',
  className = '',
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;

  return (
    <div className={`relative mb-6 ${className}`}>
      <div
        className={`
          relative flex items-center
          h-14 px-4 rounded-[4px] border
          transition-colors duration-200
          bg-surface
          ${
            error
              ? 'border-error'
              : focused
                ? 'border-primary ring-1 ring-primary'
                : 'border-outline hover:border-on-surface'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-variant/30' : ''}
        `}
      >
        {Icon && (
          <Icon
            size={24}
            className={`mr-3 ${
              error
                ? 'text-error'
                : focused
                  ? 'text-primary'
                  : 'text-on-surface-variant'
            }`}
          />
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder={focused ? placeholder : ''}
          className="flex-1 h-full bg-transparent border-none outline-none text-on-surface text-base pt-2 placeholder:text-on-surface-variant/50"
        />

        {/* Floating Label */}
        <label
          className={`
            absolute left-4 bg-surface px-1
            transition-all duration-200 pointer-events-none
            ${Icon ? 'left-12' : 'left-3'}
            ${
              focused || hasValue
                ? '-top-2.5 text-xs font-medium leading-none'
                : 'top-4 text-base'
            }
            ${
              error
                ? 'text-error'
                : focused
                  ? 'text-primary'
                  : 'text-on-surface-variant'
            }
          `}
        >
          {label}
        </label>
      </div>

      {/* Helper Text */}
      {helperText && (
        <p
          className={`mt-1 ml-4 text-xs ${error ? 'text-error' : 'text-on-surface-variant'}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default MD3TextField;
