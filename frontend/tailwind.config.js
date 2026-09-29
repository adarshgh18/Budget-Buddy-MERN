/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        canvas: "#F8FAFC",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          active: "#1E40AF",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        cardHover: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
