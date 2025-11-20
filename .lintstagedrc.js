module.exports = {
  // Run ESLint with auto-fix on JS/TS files
  "*.{js,jsx,ts,tsx}": ["eslint --fix"],

  // Run Prettier on all supported files
  "*.{js,jsx,ts,tsx,json,css,md,prisma}": ["prettier --write"],
};
