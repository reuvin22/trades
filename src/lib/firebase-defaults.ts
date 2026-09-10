/**
 * The Firebase web config, committed deliberately.
 *
 * These are public identifiers, not credentials. They ship inside the client
 * bundle on every build no matter where they are stored, and Firebase is
 * designed around that: access is controlled by Firestore security rules,
 * authorized domains and API-key referrer restrictions — never by hiding these
 * strings. Google publishes them in its own quickstart snippets.
 *
 * Committing them means a fresh clone and a fresh deployment both work with no
 * environment configuration at all. The VITE_FIREBASE_* variables still take
 * precedence when present, which is what you need to point a preview or staging
 * deployment at a different Firebase project.
 *
 * Nothing secret belongs in this file. The Brevo key, the Gemini key and the
 * service account are read from process.env inside api/ and never reach here.
 */
export const FIREBASE_WEB_CONFIG = {
  apiKey: 'AIzaSyDNqWXWVoaE-jLxYLLwS4sQB7cLvfDMwzg',
  authDomain: 'trading-journal-43d07.firebaseapp.com',
  projectId: 'trading-journal-43d07',
  storageBucket: 'trading-journal-43d07.firebasestorage.app',
  messagingSenderId: '628278688107',
  appId: '1:628278688107:web:71cbc5a265c65c0aa7742e',
  measurementId: 'G-TN1DPHK7F5',
} as const
