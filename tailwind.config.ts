import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burrow: {
          darkest: "#0c0714",
          dark: "#140c1f",
          surface: "#1c122b",
          card: "#26193b",
          border: "#3d275e",
          accent: "#ffb703",
          gold: "#fbbf24",
          "gold-dark": "#b45309",
          cream: "#fef3c7",
          parchment: "#fae8b6",
          muted: "#a79ab8",
          lantern: "#ff9f1c",
          lava: "#ef233c",
          tunnel: "#08040d",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        silkscreen: ['"Silkscreen"', 'monospace'],
        display: ['"Press Start 2P"', 'monospace'],
        body: ['"Silkscreen"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        pixel: "4px 4px 0px #000000",
        "pixel-sm": "2px 2px 0px #000000",
        "pixel-lg": "6px 6px 0px #000000",
        "pixel-gold": "4px 4px 0px #78350f",
        "pixel-purple": "4px 4px 0px #0d0617",
        "glow-gold": "0 0 20px rgba(251, 191, 36, 0.4)",
        "glow-lantern": "0 0 25px rgba(255, 159, 28, 0.45)",
      },
      animation: {
        bounce_pixel: "pixelBounce 1s steps(2, start) infinite",
        float: "floatSlow 3s ease-in-out infinite",
        flicker: "lanternFlicker 2s infinite",
      },
      keyframes: {
        pixelBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        lanternFlicker: {
          "0%, 100%": { opacity: "1" },
          "25%": { opacity: "0.85" },
          "50%": { opacity: "0.95" },
          "75%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
