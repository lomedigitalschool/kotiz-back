module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  moduleFileExtensions: ["js", "mjs", "cjs", "jsx", "json"],
  transformIgnorePatterns: [
    "node_modules/(?!(@adminjs|@babel|@tiptap)/)"
  ],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"]
};