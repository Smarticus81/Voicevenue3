import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Core theme colors
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        
        // Neumorphic palette
        neuro: {
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
        
        // Accent gradients
        primary: {
          DEFAULT: 'var(--accent-emerald)',
          foreground: '#ffffff',
          light: '#34d399',
          dark: '#059669',
        },
        secondary: {
          DEFAULT: 'var(--accent-cyan)',
          foreground: '#ffffff',
          light: '#22d3ee',
          dark: '#0891b2',
        },
        
        // Semantic colors
        muted: {
          DEFAULT: 'var(--text-tertiary)',
          foreground: 'var(--text-secondary)',
        },
        accent: {
          violet: '#8b5cf6',
          indigo: '#6366f1',
          blue: '#3b82f6',
          emerald: '#10b981',
          cyan: '#06b6d4',
          pink: '#ec4899',
        },
      },
      
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-neuro': 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-glow': 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.15) 0%, transparent 70%)',
      },
      
      boxShadow: {
        // Neumorphic shadows
        'neuro-sm': '2px 2px 4px rgba(0,0,0,0.25), -2px -2px 4px rgba(255,255,255,0.05)',
        'neuro': '4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05)',
        'neuro-md': '6px 6px 12px rgba(0,0,0,0.3), -6px -6px 12px rgba(255,255,255,0.05)',
        'neuro-lg': '9px 9px 16px rgba(0,0,0,0.35), -9px -9px 16px rgba(255,255,255,0.05)',
        'neuro-xl': '12px 12px 24px rgba(0,0,0,0.4), -12px -12px 24px rgba(255,255,255,0.05)',
        
        // Inset shadows
        'neuro-inset': 'inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.05)',
        'neuro-inset-md': 'inset 4px 4px 8px rgba(0,0,0,0.3), inset -4px -4px 8px rgba(255,255,255,0.05)',
        
        // Glow effects
        'glow-sm': '0 0 10px rgba(16,185,129,0.3)',
        'glow': '0 0 20px rgba(16,185,129,0.4)',
        'glow-lg': '0 0 30px rgba(16,185,129,0.5)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.4)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.4)',
        
        // Combined effects
        'neuro-glow': '4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05), 0 0 20px rgba(16,185,129,0.2)',
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'tilt': 'tilt 0.3s ease-out',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16,185,129,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(16,185,129,0.6)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        tilt: {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
      
      backdropBlur: {
        '3xl': '64px',
        '4xl': '128px',
      },
      
      borderRadius: {
        'neuro': '20px',
        'neuro-sm': '12px',
        'neuro-lg': '28px',
        'neuro-xl': '36px',
      },
      
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }) {
      addUtilities({
        '.neuro-base': {
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          boxShadow: '4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05)',
          borderRadius: '20px',
        },
        '.neuro-pressed': {
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(255,255,255,0.05)',
        },
        '.glass-panel': {
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '20px',
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
      });
    },
  ],
} satisfies Config;

