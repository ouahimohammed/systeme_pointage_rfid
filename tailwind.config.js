/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Tous les fichiers dans src
    "./public/**/*.{html,js}",    // Fichiers dans le dossier public
    "./components/**/*.{js,jsx}", // Si tu as un dossier components global
    "./pages/**/*.{js,jsx}",      // Si tu as un dossier pages global
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};


