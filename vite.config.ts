import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This is the magic part:
  define: {
    'process.env.API_KEY': 'import.meta.env.VITE_GEMINI_API_KEY'
  }
})
