#!/usr/bin/env node
import 'dotenv/config';
import { TargetProcessServer } from './server.js';

const server = new TargetProcessServer();
server.run().catch(console.error);
