import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/**
 * A versão do selo do topo sai do package.json do PACOTE, no build.
 *
 * Ela estava cravada como "v0.1" no App.tsx — e no dia em que publicamos a 0.2.1, o site
 * passou a mentir. É o mesmo erro que este projeto já cometeu três vezes hoje: número
 * digitado à mão envelhece calado, e ninguém abre chamado de "o selo diz a versão
 * errada". Lendo do package.json, ele não tem como divergir.
 */
const versao = JSON.parse(
  readFileSync(resolve(__dirname, '../../packages/ui/package.json'), 'utf8'),
).version as string

export default defineConfig({
  define: { __VERSAO__: JSON.stringify(versao) },
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
