import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.js',
        'src/index.js' // Main server entry point
      ]
    },
    testTimeout: 10000, // 10 seconds for database operations
    hookTimeout: 10000
  }
})