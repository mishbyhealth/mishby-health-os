/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase (required in your app)
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string

  // Emulators (optional)
  readonly VITE_FIREBASE_EMULATOR_HOST?: string
  readonly VITE_FIREBASE_EMULATOR_AUTH_PORT?: string
  readonly VITE_FIREBASE_EMULATOR_FIRESTORE_PORT?: string
  readonly VITE_FIREBASE_EMULATOR_STORAGE_PORT?: string
  readonly VITE_FIREBASE_EMULATOR_FUNCTIONS_PORT?: string
  readonly VITE_USE_FIREBASE_EMULATORS?: 'true' | 'false'

  // Feature flags / defaults (optional)
  readonly VITE_FEATURE_HEALTH_MONITORING?: 'true' | 'false'
  readonly VITE_FEATURE_TELEMEDICINE?: 'true' | 'false'
  readonly VITE_DEFAULT_LOCALE?: 'en' | 'hi' | 'gu'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
