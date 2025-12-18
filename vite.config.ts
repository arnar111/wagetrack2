import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 1. Load the environment variables (API Key) from Netlify
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 2. Here is the magic: It grabs the VITE_GEMINI_API_KEY and assigns it 
      //    to 'process.env.API_KEY' so the code from AI Studio just works.
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
    }
  }
})
