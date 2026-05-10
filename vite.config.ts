import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['pdf-lately-dreams-colorado.trycloudflare.com', 'ethics-walk-camcorders-mountains.trycloudflare.coms'],
  },
})
