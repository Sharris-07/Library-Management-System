/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F1E6D2",
        caramel: "#B68A68",
        mocha: "#96745A",
        taupe: "#8B8178",
        cocoa: "#684B3B",
        gold: {
          light: "#E6C96A",
          DEFAULT: "#D4AF37",
          dark: "#A8841C",
        },
        brass: {
          light: "#C9A66B",
          DEFAULT: "#B08D57",
          dark: "#8C6B3A",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brass-gradient":
          "linear-gradient(135deg, #8C6B3A 0%, #C9A66B 50%, #B08D57 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #A8841C 0%, #E6C96A 50%, #D4AF37 100%)",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(104, 75, 59, 0.12)",
        brass: "0 2px 10px rgba(176, 141, 87, 0.35)",
      },
    },
  },
  plugins: [],
};