import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('Fatal error during API startup:', error);
  process.exit(1);
});
