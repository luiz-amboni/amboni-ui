import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // aponta para a FONTE, não para o dist: editar um componente reflete na hora
      '@amboni/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@amboni/tokens/tokens.css': resolve(__dirname, '../../packages/tokens/tokens.css'),
      '@amboni/tokens': resolve(__dirname, '../../packages/tokens/src/index.ts'),
    },
  },
  // publicado em subpasta no GitHub Pages
  base: process.env.DOCS_BASE ?? '/',
})
