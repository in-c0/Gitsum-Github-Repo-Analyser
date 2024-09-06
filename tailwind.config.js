
// tailwind.config.css
/** @type {import('tailwindcss').Config} */

export default {
  content : [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    'node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      fontFamily:{
        satoshi:["Satoshi", "sans-serif"],
        inter : ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [
      require('@tailwindcss/forms'),
      require('preline/plugin'),
  ],
}
