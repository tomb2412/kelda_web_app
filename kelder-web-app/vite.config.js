import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':      ['react', 'react-dom'],
          'vendor-highcharts': ['highcharts', 'highcharts-react-official'],
          'vendor-maps':       ['react-simple-maps'],
          'vendor-ai':         ['ai', '@ai-sdk/react', '@ai-sdk/openai'],
          'vendor-clerk':      ['@clerk/clerk-react'],
        },
      },
    },
  },
})
