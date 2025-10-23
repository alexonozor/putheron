export const environment = {
  production: false,
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 10000
  },
  auth: {
    tokenKey: 'access_token',
    userKey: 'current_user'
  },
  features: {
    enableLogging: true,
    enableDevTools: true
  },
  stripe: {
    publishableKey: 'pk_test_fhBCq492t3wQwU5NWvqYAm6D00ZTsX5wpW'
  }
};
