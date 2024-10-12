/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f1f8f3",
          100: "#ddeee1",
          200: "#bdddc7",
          300: "#91c4a5",
          400: "#62a57e",
          500: "#428a62",
          600: "#2f6c4b",
          700: "#26563d",
          800: "#204533",
          900: "#1b392a",
          950: "#0e2018",
        },
        secondary: {
          50: "#fcf8f0",
          100: "#fx8eedc",
          200: "#efdbb9",
          300: "#e5c18c",
          400: "#dba566",
          500: "#d1873e",
          600: "#c37133",
          700: "#a2582c",
          800: "#82482a",
          900: "#693c25",
          950: "#381d12",
        },
        gray: {
          50: "#f8f8f8",
          100: "#f0f0f0",
          200: "#e5e4e3",
          300: "#d3d2d1",
          400: "#b6b4b3",
          500: "#9c9a97",
          600: "#83817f",
          700: "#6c6a69",
          800: "#5b5a59",
          900: "#4f4e4d",
          950: "#282827",
        },
      },
      fontFamily: {
        onest: ["Onest", "sans-serif"],
      },
    },
  },
  plugins: [],
};
