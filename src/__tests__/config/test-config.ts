// Test configuration using environment variables only
export const testConfig = {
  domain: process.env.TP_DOMAIN!,
  username: process.env.TP_USERNAME!, 
  password: process.env.TP_PASSWORD!,
  apiUrl: `https://${process.env.TP_DOMAIN!}`,
  apiV1Url: `https://${process.env.TP_DOMAIN!}/api/v1`,
  userId: process.env.TP_USER_ID!,
  userEmail: process.env.TP_USER_EMAIL!
};

// Validate required environment variables
if (!testConfig.domain || !testConfig.username || !testConfig.password) {
  throw new Error('Missing required environment variables: TP_DOMAIN, TP_USERNAME, TP_PASSWORD');
}
if (!testConfig.userId || !testConfig.userEmail) {
  throw new Error('Missing required environment variables: TP_USER_ID, TP_USER_EMAIL');
}

// Helper to get expected URL for tests
export const getExpectedUrl = (path: string): string => {
  return `${testConfig.apiV1Url}${path.startsWith('/') ? path : '/' + path}`;
};