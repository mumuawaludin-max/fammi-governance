import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fammi: {
          DEFAULT: "#6323DA",
          light: "#EDE5FF",
          dark: "#4A0F99",
          50: "#F8F5FF",
          100: "#EDE5FF",
          200: "#D4C2FF",
          300: "#B59AFF",
          400: "#8E5EFF",
          500: "#6323DA",
          600: "#5418C1",
          700: "#4A0F99",
          800: "#330970",
          900: "#1E0857",
        },
        success: {
          DEFAULT: "#00B894",
          light: "#D1F4EC",
          dark: "#008870",
        },
        warning: {
          DEFAULT: "#F39C12",
          light: "#FCECCE",
          dark: "#B97208",
        },
        danger: {
          DEFAULT: "#E74C3C",
          light: "#FAD5D1",
          dark: "#A82D20",
        },
        surface: "#FFFFFF",
        background: "#F8F5FF",
        text: {
          primary: "#1E1B3A",
          secondary: "#636E72",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        card: "40px",
      },
      boxShadow: {
        // default shadow dihapus dari card — hanya muncul saat hover
        fammi: "0 4px 24px rgba(99,35,218,0.08)",
        "fammi-hover": "0 8px 40px rgba(99,35,218,0.16)",
        "fammi-elevated": "0 16px 64px rgba(99,35,218,0.20)",
        // neon: efek glow ungu saat hover
        "neon": "0 0 0 1px rgba(99,35,218,0.12), 0 0 20px rgba(99,35,218,0.25), 0 8px 32px rgba(99,35,218,0.18)",
        "neon-success": "0 0 0 1px rgba(0,184,148,0.15), 0 0 20px rgba(0,184,148,0.25), 0 8px 32px rgba(0,184,148,0.15)",
        "neon-warning": "0 0 0 1px rgba(243,156,18,0.15), 0 0 20px rgba(243,156,18,0.25), 0 8px 32px rgba(243,156,18,0.15)",
        "neon-danger": "0 0 0 1px rgba(231,76,60,0.15), 0 0 20px rgba(231,76,60,0.25), 0 8px 32px rgba(231,76,60,0.15)",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      keyframes: {
        countUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "count-up": "countUp 1.2s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
      backgroundImage: {
        "gradient-fammi":
          "linear-gradient(135deg, #6323DA 0%, #9B59B6 100%)",
        "gradient-fammi-soft":
          "linear-gradient(135deg, #EDE5FF 0%, #F8F5FF 100%)",
        "gradient-wallet":
          "linear-gradient(135deg, #1E0857 0%, #4A0F99 50%, #6323DA 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
