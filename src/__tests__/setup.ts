// Jest setup file - runs before all tests
import 'dotenv/config';

// Validate required environment variables for tests
if (!process.env.TP_DOMAIN || !process.env.TP_USERNAME || !process.env.TP_PASSWORD) {
  console.warn('⚠️  Missing required environment variables for tests. Check .env file.');
}