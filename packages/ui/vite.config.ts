import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es'], fileName: () => 'index.js' },
    // react/react-dom são do consumidor — empacotar duplicaria o React e quebraria hooks
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // o nome tem que bater com o "exports" do package.json ('./styles.css')
        assetFileNames: (info) => (info.name?.endsWith('.css') ? 'styles.css' : '[name][extname]'),
      },
    },
    cssCodeSplit: false,
    // o nome do CSS precisa bater com o exports do package.json ('./styles.css')
    sourcemap: true,
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
})
