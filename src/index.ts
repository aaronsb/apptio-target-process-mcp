#!/usr/bin/env node
import 'dotenv/config';
import { TargetProcessServer } from './server.js';
import { logger } from './utils/logger.js';

const server = new TargetProcessServer();
server.run().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
