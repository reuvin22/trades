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

  build: {
    rollupOptions: {
      output: {
        /*
         * Vendor code in its own chunks, split by how often it changes.
         *
         * React and the Firebase SDK change a few times a year; this app
         * changes several times a week. Bundled together, every deploy
         * invalidates all of it and a returning trader re-downloads a
         * megabyte of library they already had. Apart, the vendor chunk
         * keeps its hash across releases and stays in the browser cache.
         *
         * Firebase is split from React for a second reason: it is only
         * reached by the Google popup and live chat, so signing in with a
         * password and never opening chat should not cost anything.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('firebase')) return 'firebase'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'

          return undefined
        },
      },
    },

    // What is left above this is jsPDF, already its own lazy chunk and only
    // fetched when somebody exports a PDF. Set here so a real regression in
    // the main bundle is what makes the build speak up.
    chunkSizeWarningLimit: 450,
  },
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
