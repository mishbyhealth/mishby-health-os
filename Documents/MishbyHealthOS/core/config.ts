export const AppConfig = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  },
  features: {
    healthMonitoring: import.meta.env.VITE_FEATURE_HEALTH_MONITORING === 'true',
    telemedicine: import.meta.env.VITE_FEATURE_TELEMEDICINE === 'true'
  },
  collections: {
    users: 'users',
    healthMetrics: 'healthMetrics'
  },
  defaults: {
    locale: import.meta.env.VITE_DEFAULT_LOCALE || 'en',
    timezone: 'UTC'
  }
};

if (!AppConfig.firebase.apiKey) {
  throw new Error('Missing Firebase configuration. Check your .env file');
}
