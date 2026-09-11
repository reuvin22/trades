import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * The dev server proxies /api to the local backend for the same reason
 * vercel.json rewrites it in production: a session cookie set by a different
 * site is a third-party cookie, and Safari blocks those outright. Proxying
 * through this origin makes it first-party, and the client needs no CORS.
 */
const API_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/health': { target: API_TARGET, changeOrigin: true },
    },
    fs: {
      // Service account keys are an admin credential. None should exist in
      // this checkout any more — they belong to the backend — but the deny
      // list stays as a backstop against one being dropped here by habit.
      deny: [
        'trading.json',
        '**/*firebase-adminsdk*.json',
        '**/serviceAccount*.json',
        '.env',
        '.env.*',
      ],
    },
  },
})
