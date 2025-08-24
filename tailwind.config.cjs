/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // tweak these to your exact brand hex if you have them
        'mishby-green': '#16a34a',   // green-600-ish
        'mishby-beige': '#faf7f2',   // soft beige
        'mishby-dark':  '#1f2937',   // gray-800-ish
      },
      // optional: explicit aliases (not strictly needed since `colors` above covers it)
      borderColor: {
        'mishby-green': '#16a34a',
      },
      textColor: {
        'mishby-green': '#16a34a',
        'mishby-dark':  '#1f2937',
      },
      backgroundColor: {
        'mishby-beige': '#faf7f2',
      },
    },
  },
  plugins: [],
}
