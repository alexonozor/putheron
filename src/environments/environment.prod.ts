export const environment = {
  production: true,
  api: {
    baseUrl: 'https://putheron-c027767ea741.herokuapp.com/api', // Update this when you deploy
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
