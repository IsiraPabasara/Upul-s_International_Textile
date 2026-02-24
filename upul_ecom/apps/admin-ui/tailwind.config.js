// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');
const plugin = require("tailwindcss/plugin"); // 👈 1. Import the plugin function

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}",
    "!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}",
    //    ...createGlobPatternsForDependencies(__dirname)
  ],
  theme: {
    extend: {
      fontFamily: {
        Roboto: ["var(--font-roboto)"],
        Poppins: ["var(--font-poppins)"],
        outfit: ["var(--font-outfit)"],
        cormorant: ["var(--font-cormorant)"],
      },
    },
  },
  plugins: [
    // 👇 2. Add the scrollbar hide utility here
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-none::-webkit-scrollbar": {
          display: "none",
        },
        ".scrollbar-none::-webkit-scrollbar": {
          display: "none" /* Chrome, Safari and Opera */,
        },
      });
    }),
  ],
};
