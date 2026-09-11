import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { devApi } from './vite-plugin-dev-api.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), devApi()],
  server: {
    fs: {
      // The dev server serves the project root, so service account keys sitting
      // there would otherwise be downloadable over HTTP. These are admin
      // credentials — they must never leave the machine.
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
