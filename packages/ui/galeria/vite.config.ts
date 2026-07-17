import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/**
 * A app da galeria — o cenário que o Playwright fotografa.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * DECISÃO: uma app Vite própria dentro de `packages/ui/`, em vez de reusar o site de
 * documentação.
 *
 * PORQUÊ: o docs tem roteador, busca, índice lateral, blocos de código com realce e uma
 * barra que troca tema. Cada uma dessas peças é uma razão de o print mudar sem que
 * nenhum COMPONENTE tenha mudado — mexer no menu da doc reprovaria o Button. O teste
 * apontaria para o lugar errado e a suspeita cairia na biblioteca. A galeria não tem
 * navegação, não tem estado próprio e não tem conteúdo editorial: ela existe só para
 * pousar os 28 componentes num fundo liso e sair da frente.
 *
 * O contrário também vale: o docs pode ser reescrito à vontade sem tocar na baseline.
 *
 * `root` é esta pasta, e o alias aponta para a FONTE (`src/index.ts`), não para o `dist` —
 * mesma escolha do docs. Fotografar o `dist` significaria rodar o build antes de cada
 * print e, pior, testar o bundle minificado em vez do código que a pessoa acabou de
 * escrever. Aqui, salvou o arquivo, o print seguinte já é do código novo.
 */
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@amboni/ui': resolve(__dirname, '../src/index.ts'),
      '@amboni/tokens/tokens.css': resolve(__dirname, '../../tokens/tokens.css'),
      '@amboni/tokens': resolve(__dirname, '../../tokens/src/index.ts'),
    },
  },
  server: {
    port: 5199, // porta fixa e fora do comum: o playwright.config.ts aponta para ela
    strictPort: true,
    /**
     * `127.0.0.1` explícito, e não o `localhost` padrão do Vite.
     *
     * `localhost` resolve para ::1 (IPv6) antes de 127.0.0.1 em Mac e em boa parte dos
     * Linux. O Vite então escuta SÓ no IPv6, e o Playwright — que fala 127.0.0.1 — bate
     * numa porta fechada e morre em "Timed out waiting for webServer", sem uma pista do
     * porquê. Aconteceu aqui na primeira execução. Fixar os dois lados no mesmo endereço
     * literal tira o DNS da jogada.
     */
    host: '127.0.0.1',
  },
})
