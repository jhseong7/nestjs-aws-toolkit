module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testMatch: ["**/__tests__/**/*.+(ts|js)", "**/?(*.)+(spec|test)+(ts|js)"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  coverageDirectory: "coverage",
  collectCoverage: true,
};
