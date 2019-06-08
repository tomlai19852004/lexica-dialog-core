module.exports = {
    verbose: true,
    testEnvironment: "node",
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js"
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
    testMatch: [
        "**/__tests__/**.spec.(ts|tsx|js)"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{ts}',
        '!**/node_modules/**',
        '!**/node_modules/**',
        '!**/vendor/**',
    ]
}