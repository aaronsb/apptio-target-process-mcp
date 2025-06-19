#!/usr/bin/env node
import 'dotenv/config';
import { TargetProcessServer } from './server.js';
import { logger } from './utils/logger.js';

const server = new TargetProcessServer();
server.run().catch((error) => {
  logger.error('Server failed to start:', error);
  process.exit(1);
});
