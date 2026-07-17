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
        /**
         * `'use client'` no topo do pacote inteiro.
         *
         * Sem isto, importar QUALQUER coisa daqui dentro de um Server Component do Next
         * derruba o build — inclusive o `<Button>`, que não tem estado nenhum. O pacote é
         * um bundle único e a primeira linha dele importa `useState`; o Next olha o
         * MÓDULO, não o componente. A mensagem de erro fala de um hook que quem importou
         * nunca chamou, então ninguém liga o erro à causa.
         *
         * Marcar o pacote inteiro como cliente é o que MUI, Chakra e react-aria fazem. O
         * preço é conhecido: os poucos componentes puros também viram cliente. A
         * alternativa (preserveModules + diretiva por arquivo) troca um bundle por
         * dezenas de arquivos e ainda marcaria quase tudo — numa biblioteca de interface
         * quase tudo tem estado mesmo.
         *
         * Nenhum teste daqui pegaria isso: só aparece num build de Next de verdade.
         */
        banner: "'use client';",
        // o nome tem que bater com o "exports" do package.json ('./styles.css')
        assetFileNames: (info) => (info.name?.endsWith('.css') ? 'styles.css' : '[name][extname]'),
      },
    },
    cssCodeSplit: false,
    /**
     * O sourcemap vai publicado, e é uma escolha — ele é 310 kB, quinze vezes o código.
     *
     * Vai porque o `dist` é minificado: sem o mapa, quem instalar e abrir o DevTools para
     * entender por que um componente se comporta de um jeito encontra `function p(e,t)` e
     * desiste. Com ele, lê `Button.tsx`.
     *
     * E o custo é menor do que o número assusta: sourcemap NUNCA é baixado pelo navegador
     * de quem usa o produto final — só pelo DevTools, quando aberto. Ele pesa no
     * `npm install`, não no que o usuário carrega. Fosse o contrário, a conta não fechava.
     *
     * Não vaza nada: o repositório é MIT e público. O mapa só evita uma viagem ao GitHub.
     */
    sourcemap: true,
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
})
