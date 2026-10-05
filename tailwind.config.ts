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
        teak: {
          50: "#f4f7f4",
          100: "#e4ebe5",
          200: "#c9d7cb",
          300: "#a3bba7",
          400: "#76987d",
          500: "#557a5d",
          600: "#416149",
          700: "#354e3b",
          800: "#2c3f31",
          900: "#253429",
          950: "#121c15",
        },
        saffron: {
          50: "#fff8ed",
          100: "#ffefd4",
          200: "#ffdba8",
          300: "#ffc170",
          400: "#ff9b37",
          500: "#ff7c10",
          600: "#f05f06",
          700: "#c74607",
          800: "#9e370e",
          900: "#7f2f0f",
          950: "#451505",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#b0b9c9",
          400: "#8694ab",
          500: "#677791",
          600: "#525f77",
          700: "#434e61",
          800: "#3a4352",
          900: "#343a46",
          950: "#22262f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        hindi: ["var(--font-hindi)", "Noto Sans Devanagari", "sans-serif"],
      },
      backgroundImage: {
        "mesh":
          "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(85,122,93,0.18), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(240,95,6,0.12), transparent), radial-gradient(ellipse 50% 30% at 50% 100%, rgba(37,52,41,0.06), transparent)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        shimmer: "shimmer 1.5s infinite linear",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
