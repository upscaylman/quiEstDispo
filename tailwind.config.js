/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        display: ['Roboto', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      },
      // MD3 Typography Scale
      fontSize: {
        'display-large': [
          '57px',
          { lineHeight: '64px', letterSpacing: '-0.25px' },
        ],
        'display-medium': [
          '45px',
          { lineHeight: '52px', letterSpacing: '0px' },
        ],
        'display-small': ['36px', { lineHeight: '44px', letterSpacing: '0px' }],
        'headline-large': [
          '32px',
          { lineHeight: '40px', letterSpacing: '0px' },
        ],
        'headline-medium': [
          '28px',
          { lineHeight: '36px', letterSpacing: '0px' },
        ],
        'headline-small': [
          '24px',
          { lineHeight: '32px', letterSpacing: '0px' },
        ],
        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0px' }],
        'title-medium': [
          '16px',
          { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' },
        ],
        'title-small': [
          '14px',
          { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' },
        ],
        'body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.5px' }],
        'body-medium': [
          '14px',
          { lineHeight: '20px', letterSpacing: '0.25px' },
        ],
        'body-small': ['12px', { lineHeight: '16px', letterSpacing: '0.4px' }],
        'label-large': [
          '14px',
          { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' },
        ],
        'label-medium': [
          '12px',
          { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' },
        ],
        'label-small': [
          '11px',
          { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' },
        ],
      },
      colors: {
        // Material Design 3 Semantic Tokens
        primary: {
          DEFAULT: 'var(--md-sys-color-primary)',
          on: 'var(--md-sys-color-on-primary)',
          container: 'var(--md-sys-color-primary-container)',
          'on-container': 'var(--md-sys-color-on-primary-container)',
          // Backward compatibility
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          DEFAULT: 'var(--md-sys-color-secondary)',
          on: 'var(--md-sys-color-on-secondary)',
          container: 'var(--md-sys-color-secondary-container)',
          'on-container': 'var(--md-sys-color-on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--md-sys-color-tertiary)',
          on: 'var(--md-sys-color-on-tertiary)',
          container: 'var(--md-sys-color-tertiary-container)',
          'on-container': 'var(--md-sys-color-on-tertiary-container)',
        },
        error: {
          DEFAULT: 'var(--md-sys-color-error)',
          on: 'var(--md-sys-color-on-error)',
          container: 'var(--md-sys-color-error-container)',
          'on-container': 'var(--md-sys-color-on-error-container)',
        },
        surface: {
          DEFAULT: 'var(--md-sys-color-surface)',
          on: 'var(--md-sys-color-on-surface)',
          variant: 'var(--md-sys-color-surface-variant)',
          'on-variant': 'var(--md-sys-color-on-surface-variant)',
        },
        outline: {
          DEFAULT: 'var(--md-sys-color-outline)',
          variant: 'var(--md-sys-color-outline-variant)',
        },
        // MD3 Direct "on-" color aliases for text/icon colors
        'on-primary': 'var(--md-sys-color-on-primary)',
        'on-secondary': 'var(--md-sys-color-on-secondary)',
        'on-tertiary': 'var(--md-sys-color-on-tertiary)',
        'on-error': 'var(--md-sys-color-on-error)',
        'on-surface': 'var(--md-sys-color-on-surface)',
        'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
        'on-primary-container': 'var(--md-sys-color-on-primary-container)',
        'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',
        'on-tertiary-container': 'var(--md-sys-color-on-tertiary-container)',
        'on-error-container': 'var(--md-sys-color-on-error-container)',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlurpx: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
