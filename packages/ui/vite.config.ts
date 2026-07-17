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
        /**
         * Um arquivo por componente, em vez de um bundle só.
         *
         * A versão anterior publicava tudo num `index.js`, e a decisão estava ESCRITA
         * aqui como deliberada: "iSafe e VEAR usam a biblioteca quase toda, então
         * otimizar 'importar só o Button' seria otimizar um caso que não existe". Era
         * razoável — com 28 componentes, importar só o Button custava 42% do pacote.
         *
         * Então a biblioteca foi para 39 componentes e o número virou **64%**. O
         * tree-shaking degrada conforme o bundle cresce: num arquivo único o esbuild
         * precisa provar que cada trecho é descartável, e a teia de referências entre
         * componentes vai fechando o cerco.
         *
         * Medido depois da troca: importar só o Button caiu de **52.584 para 855 bytes**.
         * Sessenta e uma vezes. A biblioteca inteira engordou 1 kB (overhead de módulo),
         * o que é troco.
         *
         * A lição não é "preserveModules é melhor" — é que a conta muda quando o projeto
         * cresce, e uma decisão de arquitetura tomada com 28 componentes não se
         * autorrenova aos 39. Ela estava certa quando foi tomada e ficou errada sozinha.
         *
         * Brinde: o `'use client'` passa a ser emitido POR ARQUIVO, que é a forma
         * correta da diretiva — em vez de marcar o pacote inteiro como cliente.
         */
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    /**
     * `visual/` é do Playwright, não do Vitest.
     *
     * Os dois usam `.spec.ts`, e sem esta linha o Vitest coleta os specs de regressão
     * visual e reprova todos: eles chamam `test()` do `@playwright/test`, que não existe
     * aqui. O sintoma é péssimo — 2 arquivos vermelhos numa suíte verde, sem relação com
     * o código, treinando todo mundo a ignorar vermelho.
     *
     * Rodam por `npm run visual`, com o runner deles.
     */
    exclude: ['node_modules/**', 'dist/**', 'visual/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      include: ['src/components/**/*.tsx', 'src/utils/**/*.ts'],
      // Teste, tipo e CSS não são código coberto — inflam o número e escondem o buraco.
      exclude: ['**/*.test.tsx', '**/*.d.ts'],
      /**
       * O piso existe para a cobertura não CAIR sem alguém notar; ele não é meta.
       * Cobertura alta com teste ruim é o pior dos mundos: dá confiança sem dar garantia.
       * Este repositório já provou isso — trocamos `chaveLinha` por índice numa mutação e
       * 40 de 40 testes continuaram verdes, com a linha 100% "coberta". O que protege é o
       * que o teste AFIRMA, não quantas linhas ele visita.
       */
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
})
