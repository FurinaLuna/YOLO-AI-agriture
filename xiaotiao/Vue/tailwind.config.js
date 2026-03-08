/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      
      primary: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
        950: '#022c22',
        DEFAULT: '#10b981',
      },
      
      secondary: {
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
        950: '#172554',
        DEFAULT: '#3b82f6',
      },
      
      accent: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
        DEFAULT: '#f97316',
      },
      
      neutral: {
        0: '#ffffff',
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
      
      success: {
        light: '#dcfce7',
        DEFAULT: '#22c55e',
        dark: '#16a34a',
      },
      
      warning: {
        light: '#fef3c7',
        DEFAULT: '#f59e0b',
        dark: '#d97706',
      },
      
      error: {
        light: '#fee2e2',
        DEFAULT: '#ef4444',
        dark: '#dc2626',
      },
      
      info: {
        light: '#dbeafe',
        DEFAULT: '#3b82f6',
        dark: '#2563eb',
      },
    },
    
    fontFamily: {
      sans: ['Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      display: ['Inter', 'PingFang SC', 'system-ui', 'sans-serif'],
    },
    
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    
    spacing: {
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '8': '2rem',
      '10': '2.5rem',
      '12': '3rem',
      '16': '4rem',
      '20': '5rem',
      '24': '6rem',
      '32': '8rem',
      '40': '10rem',
      '48': '12rem',
      '56': '14rem',
      '64': '16rem',
    },
    
    borderRadius: {
      'none': '0',
      'sm': '0.25rem',
      'md': '0.5rem',
      'lg': '0.75rem',
      'xl': '1rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      'full': '9999px',
    },
    
    boxShadow: {
      'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      'none': 'none',
      'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
      'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04)',
      'primary-sm': '0 2px 8px rgba(16, 185, 129, 0.15)',
      'primary-md': '0 4px 14px rgba(16, 185, 129, 0.25)',
      'primary-lg': '0 8px 24px rgba(16, 185, 129, 0.35)',
      'secondary-sm': '0 2px 8px rgba(59, 130, 246, 0.15)',
      'secondary-md': '0 4px 14px rgba(59, 130, 246, 0.25)',
      'dropdown': '0 4px 16px rgba(0, 0, 0, 0.12)',
      'modal': '0 8px 32px rgba(0, 0, 0, 0.16)',
    },
    
    transitionDuration: {
      '0': '0ms',
      '75': '75ms',
      '100': '100ms',
      '150': '150ms',
      '200': '200ms',
      '250': '250ms',
      '300': '300ms',
      '350': '350ms',
      '400': '400ms',
      '500': '500ms',
      '700': '700ms',
      '1000': '1000ms',
    },
    
    transitionTimingFunction: {
      'linear': 'linear',
      'in': 'cubic-bezier(0.4, 0, 1, 1)',
      'out': 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    
    animation: {
      'none': 'none',
      'spin': 'spin 1s linear infinite',
      'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'bounce': 'bounce 1s infinite',
      'fade-in': 'fadeIn 0.3s ease-out',
      'fade-in-up': 'fadeInUp 0.4s ease-out',
      'fade-in-down': 'fadeInDown 0.4s ease-out',
      'fade-in-left': 'fadeInLeft 0.4s ease-out',
      'fade-in-right': 'fadeInRight 0.4s ease-out',
      'scale-in': 'scaleIn 0.3s ease-out',
      'slide-in-up': 'slideInUp 0.3s ease-out',
      'shimmer': 'shimmer 1.5s infinite',
    },
    
    keyframes: {
      spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      ping: {
        '75%, 100%': { transform: 'scale(2)', opacity: '0' },
      },
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
      bounce: {
        '0%, 100%': {
          transform: 'translateY(-25%)',
          animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
        },
        '50%': {
          transform: 'translateY(0)',
          animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
        },
      },
      fadeIn: {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
      fadeInUp: {
        from: { opacity: '0', transform: 'translateY(20px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      fadeInDown: {
        from: { opacity: '0', transform: 'translateY(-20px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      fadeInLeft: {
        from: { opacity: '0', transform: 'translateX(-20px)' },
        to: { opacity: '1', transform: 'translateX(0)' },
      },
      fadeInRight: {
        from: { opacity: '0', transform: 'translateX(20px)' },
        to: { opacity: '1', transform: 'translateX(0)' },
      },
      scaleIn: {
        from: { opacity: '0', transform: 'scale(0.95)' },
        to: { opacity: '1', transform: 'scale(1)' },
      },
      slideInUp: {
        from: { transform: 'translateY(100%)' },
        to: { transform: 'translateY(0)' },
      },
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    },
    
    backdropBlur: {
      'none': 'none',
      'sm': '4px',
      'md': '8px',
      'lg': '12px',
      'xl': '16px',
      '2xl': '24px',
      '3xl': '32px',
    },
    
    zIndex: {
      '0': '0',
      '10': '10',
      '20': '20',
      '30': '30',
      '40': '40',
      '50': '50',
      'dropdown': '1000',
      'sticky': '1020',
      'fixed': '1030',
      'modal-backdrop': '1040',
      'modal': '1050',
      'popover': '1060',
      'tooltip': '1070',
      'toast': '1080',
    },
    
    extend: {
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'gradient-hero': 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      },
    },
  },
  plugins: [],
}
