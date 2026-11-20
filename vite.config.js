import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    testTimeout: 20000, // certains tests lancent des processus Node : marge sous forte charge
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
