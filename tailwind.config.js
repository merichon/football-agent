import nativewindPreset from "nativewind/preset";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#04120a",
          900: "#071f12",
          800: "#0d3520",
          700: "#14532d",
          500: "#22c55e"
        },
        agent: {
          gold: "#fbbf24",
          ice: "#7dd3fc",
          ink: "#0f172a"
        }
      },
      borderRadius: {
        game: "8px"
      }
    }
  },
  plugins: []
};
