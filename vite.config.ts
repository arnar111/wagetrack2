import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This line tells the app: "If you see 'process.env.API_KEY', 
    // secretly swap it with my real Netlify variable."
    'process.env.API_KEY': 'import.meta.env.VITE_GEMINI_API_KEY'
  }
})
