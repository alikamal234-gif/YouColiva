import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

// Resolve local mongod binary cached at monorepo root
const rootCacheDir = path.resolve(__dirname, '../../node_modules/.cache/mongodb-memory-server');
const binaryPath = path.resolve(rootCacheDir, 'mongod-x64-win32-7.0.24.exe');

if (fs.existsSync(binaryPath)) {
  process.env.MONGOMS_SYSTEM_BINARY = binaryPath;
} else if (fs.existsSync(rootCacheDir)) {
  process.env.MONGOMS_DOWNLOAD_DIR = rootCacheDir;
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
