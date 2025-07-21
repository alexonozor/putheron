export const environment = {
  production: true,
  api: {
    baseUrl: 'https://your-production-api-url.com/api', // Update this when you deploy
    timeout: 15000
  },
  auth: {
    tokenKey: 'access_token',
    userKey: 'current_user'
  },
  features: {
    enableLogging: false,
    enableDevTools: false
  }
};
