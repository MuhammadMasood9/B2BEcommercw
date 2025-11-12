import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Brand-specific responsive breakpoints
        'mobile': {'max': '639px'},
        'tablet': {'min': '640px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
        // Touch device detection
        'touch': {'raw': '(hover: none) and (pointer: coarse)'},
        'no-touch': {'raw': '(hover: hover) and (pointer: fine)'},
        // Accessibility-focused breakpoints
        'reduced-motion': {'raw': '(prefers-reduced-motion: reduce)'},
        'high-contrast': {'raw': '(prefers-contrast: high)'},
        'dark-mode': {'raw': '(prefers-color-scheme: dark)'},
        'light-mode': {'raw': '(prefers-color-scheme: light)'},
      },
      borderRadius: {
        lg: ".5625rem", /* 9px */
        md: ".375rem", /* 6px */
        sm: ".1875rem", /* 3px */
      },
      colors: {
        // Core theme-aware colors
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        
        // Enhanced Brand Color System with Theme Awareness
        "brand-orange": {
          50: "hsl(var(--brand-orange-50) / <alpha-value>)",
          100: "hsl(var(--brand-orange-100) / <alpha-value>)",
          200: "hsl(var(--brand-orange-200) / <alpha-value>)",
          300: "hsl(var(--brand-orange-300) / <alpha-value>)",
          400: "hsl(var(--brand-orange-400) / <alpha-value>)",
          500: "hsl(var(--brand-orange-500) / <alpha-value>)", // Base orange #F2A30F
          600: "hsl(var(--brand-orange-600) / <alpha-value>)",
          700: "hsl(var(--brand-orange-700) / <alpha-value>)",
          800: "hsl(var(--brand-orange-800) / <alpha-value>)",
          900: "hsl(var(--brand-orange-900) / <alpha-value>)",
          DEFAULT: "hsl(var(--brand-orange-500) / <alpha-value>)",
          hover: "hsl(var(--brand-hover-orange) / <alpha-value>)",
          active: "hsl(var(--brand-active-orange) / <alpha-value>)",
          accessible: "hsl(var(--brand-orange-accessible) / <alpha-value>)",
        },
        "brand-grey": {
          50: "hsl(var(--brand-grey-50) / <alpha-value>)", // #EEEEEE in light mode
          100: "hsl(var(--brand-grey-100) / <alpha-value>)",
          200: "hsl(var(--brand-grey-200) / <alpha-value>)",
          300: "hsl(var(--brand-grey-300) / <alpha-value>)",
          400: "hsl(var(--brand-grey-400) / <alpha-value>)",
          500: "hsl(var(--brand-grey-500) / <alpha-value>)",
          600: "hsl(var(--brand-grey-600) / <alpha-value>)",
          700: "hsl(var(--brand-grey-700) / <alpha-value>)",
          800: "hsl(var(--brand-grey-800) / <alpha-value>)",
          900: "hsl(var(--brand-grey-900) / <alpha-value>)", // #212121 in light mode
          DEFAULT: "hsl(var(--brand-grey-900) / <alpha-value>)",
          hover: "hsl(var(--brand-hover-grey) / <alpha-value>)",
          active: "hsl(var(--brand-active-grey) / <alpha-value>)",
        },
        
        // Theme-aware text colors
        "brand-text": {
          "on-light": "hsl(var(--brand-text-on-light) / <alpha-value>)",
          "on-dark": "hsl(var(--brand-text-on-dark) / <alpha-value>)",
          "on-orange": "hsl(var(--brand-text-on-orange) / <alpha-value>)",
          primary: "hsl(var(--foreground) / <alpha-value>)",
          secondary: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        
        // Theme-aware focus colors
        "brand-focus": {
          orange: "hsl(var(--brand-focus-orange) / <alpha-value>)",
          grey: "hsl(var(--brand-focus-grey) / <alpha-value>)",
          ring: "hsl(var(--ring) / <alpha-value>)",
        },
        
        // Theme-aware link colors
        "brand-link": {
          DEFAULT: "hsl(var(--brand-link-color) / <alpha-value>)",
          hover: "hsl(var(--brand-link-hover) / <alpha-value>)",
        },
        
        // Success and status colors
        success: {
          DEFAULT: "142 76% 36%",
          foreground: "0 0% 100%",
        },
        // Legacy colors for backward compatibility (mapped to brand colors)
        orange: {
          50: "hsl(var(--brand-orange-50) / <alpha-value>)",
          100: "hsl(var(--brand-orange-100) / <alpha-value>)",
          400: "hsl(var(--brand-orange-400) / <alpha-value>)",
          500: "hsl(var(--brand-orange-500) / <alpha-value>)",
          600: "hsl(var(--brand-orange-600) / <alpha-value>)",
          700: "hsl(var(--brand-orange-700) / <alpha-value>)",
          800: "hsl(var(--brand-orange-800) / <alpha-value>)",
          900: "hsl(var(--brand-orange-900) / <alpha-value>)",
        },
        grey: {
          50: "hsl(var(--brand-grey-50) / <alpha-value>)",
          100: "hsl(var(--brand-grey-100) / <alpha-value>)",
          200: "hsl(var(--brand-grey-200) / <alpha-value>)",
          300: "hsl(var(--brand-grey-300) / <alpha-value>)",
          400: "hsl(var(--brand-grey-400) / <alpha-value>)",
          500: "hsl(var(--brand-grey-500) / <alpha-value>)",
          600: "hsl(var(--brand-grey-600) / <alpha-value>)",
          700: "hsl(var(--brand-grey-700) / <alpha-value>)",
          800: "hsl(var(--brand-grey-800) / <alpha-value>)",
          900: "hsl(var(--brand-grey-900) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        // Status colors with theme awareness
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
        
        // Theme-aware responsive utilities
        "theme-responsive": {
          "button-primary": "hsl(var(--brand-orange-500) / <alpha-value>)",
          "button-secondary": "hsl(var(--brand-grey-900) / <alpha-value>)",
          "nav-bg": "hsl(var(--sidebar) / <alpha-value>)",
          "card-bg": "hsl(var(--card) / <alpha-value>)",
          "input-border": "hsl(var(--border) / <alpha-value>)",
          "text-primary": "hsl(var(--foreground) / <alpha-value>)",
          "text-secondary": "hsl(var(--muted-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        // Primary font families using CSS custom properties for theme awareness
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Consolas", "monospace"],
        
        // System font family with optimized fallback stack
        "system": [
          "Inter",
          "system-ui", 
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        "system-mono": [
          "Consolas",
          "Monaco",
          "Courier New",
          "monospace"
        ],
        
        // Performance-optimized fallback stacks
        "fallback-sans": [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        "fallback-mono": [
          "Consolas",
          "Monaco",
          "Courier New",
          "monospace"
        ],
        
        // Theme-aware font families
        "theme-sans": ["var(--font-sans)"],
        "theme-serif": ["var(--font-serif)"],
        "theme-mono": ["var(--font-mono)"],
      },
      
      // Enhanced font configuration
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
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      
      // Font loading optimization utilities
      fontDisplay: {
        auto: "auto",
        block: "block",
        swap: "swap",
        fallback: "fallback",
        optional: "optional",
      },
      // Enhanced spacing system
      spacing: {
        '0': '0px',
        'px': '1px',
        '0.5': '0.125rem',
        '1': '0.25rem',
        '1.5': '0.375rem',
        '2': '0.5rem',
        '2.5': '0.625rem',
        '3': '0.75rem',
        '3.5': '0.875rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '9': '2.25rem',
        '10': '2.5rem',
        '11': '2.75rem',
        '12': '3rem',
        '14': '3.5rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '28': '7rem',
        '32': '8rem',
        '36': '9rem',
        '40': '10rem',
        '44': '11rem',
        '48': '12rem',
        '52': '13rem',
        '56': '14rem',
        '60': '15rem',
        '64': '16rem',
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
      },
      
      // Theme transition system
      transitionProperty: {
        'none': 'none',
        'all': 'all',
        'default': 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
        'opacity': 'opacity',
        'shadow': 'box-shadow',
        'transform': 'transform',
        'theme': 'color, background-color, border-color, box-shadow, opacity',
      },
      
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
        'theme': '200ms',
      },
      
      transitionTimingFunction: {
        'linear': 'linear',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'theme': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Enhanced keyframes for theme transitions
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "theme-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "theme-slide-in": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-brand": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "theme-fade-in": "theme-fade-in 200ms ease-out",
        "theme-slide-in": "theme-slide-in 200ms ease-out",
        "pulse-brand": "pulse-brand 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      
      // Accessibility utilities
      ringWidth: {
        DEFAULT: '3px',
        '0': '0px',
        '1': '1px',
        '2': '2px',
        '4': '4px',
        '8': '8px',
        'focus': '2px',
        'focus-visible': '3px',
      },
      
      ringOffsetWidth: {
        '0': '0px',
        '1': '1px',
        '2': '2px',
        '4': '4px',
        '8': '8px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Custom plugin for theme-aware utilities
    function({ addUtilities, addComponents, theme }) {
      // Theme-aware button components
      addComponents({
        '.btn-brand-primary': {
          backgroundColor: 'hsl(var(--brand-orange-500))',
          color: 'hsl(var(--brand-text-on-orange))',
          fontFamily: theme('fontFamily.sans'),
          fontWeight: theme('fontWeight.medium'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          border: '1px solid hsl(var(--brand-orange-600))',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'hsl(var(--brand-orange-600))',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px hsl(var(--brand-orange-500) / 0.3)',
          },
          '&:active': {
            backgroundColor: 'hsl(var(--brand-orange-700))',
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: 'hsl(var(--brand-focus-orange))',
            ringOffsetWidth: '2px',
          },
        },
        '.btn-brand-secondary': {
          backgroundColor: 'hsl(var(--brand-grey-900))',
          color: 'hsl(var(--brand-text-on-dark))',
          fontFamily: theme('fontFamily.sans'),
          fontWeight: theme('fontWeight.medium'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          border: '1px solid hsl(var(--brand-grey-800))',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'hsl(var(--brand-grey-800))',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            backgroundColor: 'hsl(var(--brand-grey-700))',
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: 'hsl(var(--brand-focus-grey))',
            ringOffsetWidth: '2px',
          },
        },
        '.btn-brand-outline': {
          backgroundColor: 'transparent',
          color: 'hsl(var(--brand-orange-500))',
          fontFamily: theme('fontFamily.sans'),
          fontWeight: theme('fontWeight.medium'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          border: '1px solid hsl(var(--brand-orange-500))',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'hsl(var(--brand-orange-500))',
            color: 'hsl(var(--brand-text-on-orange))',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            backgroundColor: 'hsl(var(--brand-orange-600))',
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: 'hsl(var(--brand-focus-orange))',
            ringOffsetWidth: '2px',
          },
        },
      });

      // Theme-aware form components
      addComponents({
        '.input-brand': {
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          fontFamily: theme('fontFamily.sans'),
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          borderRadius: theme('borderRadius.md'),
          border: '1px solid hsl(var(--border))',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:focus': {
            outline: 'none',
            borderColor: 'hsl(var(--brand-orange-500))',
            ringWidth: '2px',
            ringColor: 'hsl(var(--brand-orange-500) / 0.2)',
          },
          '&::placeholder': {
            color: 'hsl(var(--muted-foreground))',
          },
        },
      });

      // Accessibility utilities
      addUtilities({
        '.focus-brand': {
          '&:focus-visible': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: 'hsl(var(--brand-focus-orange))',
            ringOffsetWidth: '2px',
          },
        },
        '.focus-brand-grey': {
          '&:focus-visible': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: 'hsl(var(--brand-focus-grey))',
            ringOffsetWidth: '2px',
          },
        },
        '.theme-transition': {
          transition: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.reduced-motion': {
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            animation: 'none',
          },
        },

        '.sr-only-focusable': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
          '&:focus': {
            position: 'static',
            width: 'auto',
            height: 'auto',
            padding: 'inherit',
            margin: 'inherit',
            overflow: 'visible',
            clip: 'auto',
            whiteSpace: 'normal',
          },
        },
        // High contrast mode utilities
        '.high-contrast-focus': {
          '.high-contrast &:focus, .high-contrast &:focus-visible': {
            outline: '3px solid hsl(var(--brand-focus-color)) !important',
            outlineOffset: '2px !important',
            boxShadow: '0 0 0 1px hsl(var(--background)), 0 0 0 5px hsl(var(--brand-focus-color)) !important',
          },
        },
        '.high-contrast-border': {
          '.high-contrast &': {
            borderWidth: '2px !important',
            borderStyle: 'solid !important',
          },
        },
        '.high-contrast-text': {
          '.high-contrast &': {
            color: 'hsl(var(--foreground)) !important',
            fontWeight: '600 !important',
          },
        },
        '.high-contrast-button': {
          '.high-contrast &': {
            borderWidth: '2px !important',
            borderStyle: 'solid !important',
            fontWeight: '600 !important',
          },
          '.high-contrast &:hover': {
            borderWidth: '3px !important',
            transform: 'none !important',
          },
          '.high-contrast &:focus, .high-contrast &:focus-visible': {
            outline: '3px solid hsl(var(--brand-focus-color)) !important',
            outlineOffset: '2px !important',
            boxShadow: '0 0 0 1px hsl(var(--background)), 0 0 0 5px hsl(var(--brand-focus-color)) !important',
          },
        },
        '.high-contrast-link': {
          '.high-contrast &': {
            color: 'hsl(var(--brand-link-color)) !important',
            textDecoration: 'underline !important',
            textDecorationThickness: '2px !important',
            textUnderlineOffset: '3px !important',
            fontWeight: '600 !important',
          },
          '.high-contrast &:hover': {
            color: 'hsl(var(--brand-link-hover)) !important',
            textDecorationThickness: '3px !important',
          },
          '.high-contrast &:focus, .high-contrast &:focus-visible': {
            outline: '3px solid hsl(var(--brand-focus-color)) !important',
            outlineOffset: '2px !important',
            textDecoration: 'underline !important',
            textDecorationThickness: '3px !important',
            textUnderlineOffset: '4px !important',
          },
        },
        '.high-contrast-input': {
          '.high-contrast &': {
            backgroundColor: 'hsl(var(--input)) !important',
            color: 'hsl(var(--foreground)) !important',
            borderWidth: '2px !important',
            borderStyle: 'solid !important',
            borderColor: 'hsl(var(--border)) !important',
            fontWeight: '500 !important',
          },
          '.high-contrast &:focus': {
            outline: '3px solid hsl(var(--brand-focus-color)) !important',
            outlineOffset: '2px !important',
            borderColor: 'hsl(var(--brand-focus-color)) !important',
            boxShadow: '0 0 0 1px hsl(var(--background)), 0 0 0 5px hsl(var(--brand-focus-color)) !important',
          },
          '.high-contrast &::placeholder': {
            color: 'hsl(var(--muted-foreground)) !important',
            opacity: '1 !important',
            fontWeight: '500 !important',
          },
        },
        '.high-contrast-card': {
          '.high-contrast &': {
            backgroundColor: 'hsl(var(--card)) !important',
            color: 'hsl(var(--card-foreground)) !important',
            borderWidth: '2px !important',
            borderStyle: 'solid !important',
            borderColor: 'hsl(var(--card-border)) !important',
          },
        },
      });
    },
  ],
} satisfies Config;
