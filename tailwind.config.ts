import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Paleta base do projeto
        navy: {
          DEFAULT: "#0B1F3A",
          50: "#E6EAF1",
          100: "#C0CADB",
          200: "#8C9DBA",
          300: "#586F99",
          400: "#2E4877",
          500: "#0B1F3A",
          600: "#091932",
          700: "#071328",
          800: "#040D1E",
          900: "#020714",
        },
        aqua: {
          DEFAULT: "#5BD1D7",
          50: "#EAFAFB",
          100: "#CDF3F5",
          200: "#9EE7EB",
          300: "#6FDBE0",
          400: "#5BD1D7",
          500: "#33B8BE",
          600: "#258F94",
          700: "#1A6669",
          800: "#0F3E40",
          900: "#051518",
        },
        teal: {
          DEFAULT: "#1F8A8F",
          50: "#E5F4F5",
          100: "#BFE3E5",
          200: "#7FC7CB",
          300: "#3FAAB1",
          400: "#1F8A8F",
          500: "#176B6F",
          600: "#114F52",
          700: "#0B3437",
          800: "#06191B",
          900: "#020708",
        },
        sand: {
          DEFAULT: "#F2EAD3",
          50: "#FBF8EF",
          100: "#F7F1E1",
          200: "#F2EAD3",
          300: "#E6D8AE",
          400: "#D9C588",
          500: "#C9B065",
          600: "#A48A45",
          700: "#75612F",
          800: "#46391A",
          900: "#191305",
        },
        // Tokens semânticos (mapeados a CSS vars em globals.css)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        highlight: {
          DEFAULT: "hsl(var(--highlight) / <alpha-value>)",
          foreground: "hsl(var(--highlight-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
