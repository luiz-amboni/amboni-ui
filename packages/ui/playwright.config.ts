import { defineConfig, devices } from '@playwright/test'

/**
 * Regressão visual — a configuração.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * FERRAMENTA: @playwright/test, com `toHaveScreenshot`.
 *
 * PORQUÊ, e não o browser mode do Vitest: o que falta aqui não é "rodar teste num
 * navegador" — é COMPARAR IMAGEM. O Playwright já traz a comparação, o limiar de
 * tolerância, a atualização de baseline (`--update-snapshots`), a espera até dois quadros
 * saírem iguais (mata o print tirado no meio de uma transição) e um relatório HTML com
 * esperado / recebido / diff lado a lado. O browser mode do Vitest roda o teste no
 * navegador, mas a comparação de imagem ainda é experimental — seria construir sozinho o
 * que aqui vem pronto e é o miolo da coisa. O preço é honesto: mais um runner no repo,
 * porque os 739 testes de jsdom continuam no Vitest, que é mais rápido para o que fazem.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BASELINE: Linux (o CI) é a ÚNICA fonte da verdade. Explicando, porque é aqui que
 * projeto de regressão visual morre:
 *
 * Chromium no macOS e no Linux desenham o MESMO HTML com pixels diferentes — outro motor
 * de suavização, outro hinting, sombra arredondando diferente. Não é bug: é o sistema
 * operacional. Uma baseline gerada no Mac reprova INTEIRA no Ubuntu do CI — não uma ou
 * outra, todas. Aí alguém roda `--update-snapshots` no Mac para "consertar", o CI reprova
 * de novo, e em duas semanas o job é marcado como `continue-on-error` e ninguém mais olha.
 *
 * As três saídas possíveis eram:
 *   (a) baseline por plataforma (`{platform}` no caminho) — dobra os arquivos e, na
 *       prática, ninguém regenera a do Linux; ela apodrece e o CI vira ruído;
 *   (b) rodar num container Linux no Mac — resolve de verdade, MAS depende de Docker na
 *       máquina de quem contribui (não há Docker nesta aqui) e cada rodada local custa a
 *       imagem de 2 GB;
 *   (c) baseline só de Linux, gerada pelo CI. ESCOLHIDA.
 *
 * Como (c) funciona no dia a dia:
 *   · no CI (Ubuntu) o print roda e compara — é ele que reprova o PR;
 *   · no Mac, o print é PULADO por padrão, com mensagem dizendo o porquê. Um teste que
 *     você sabe que vai reprovar por motivo errado é pior que teste nenhum;
 *   · para iterar localmente, `AMB_VISUAL_LOCAL=1 npm run visual` usa uma baseline
 *     separada (`__baseline-local__/`, fora do git). Serve para ver a sua mudança, nunca
 *     para alimentar o CI;
 *   · aceitou a mudança? Rode o workflow "Atualizar baseline visual" no GitHub: ele
 *     regenera no Ubuntu e abre o PR com as imagens novas, para alguém OLHAR o diff antes
 *     de entrar. Baseline que se atualiza sozinha não é baseline.
 *
 * E os testes de LAYOUT (visual/layout.spec.ts) rodam em qualquer sistema, sempre: eles
 * medem número — altura, transbordo, posição — e número não muda com antialiasing.
 */

const ehLinux = process.platform === 'linux'
const localForcado = !!process.env.AMB_VISUAL_LOCAL

export const PODE_TIRAR_PRINT = ehLinux || localForcado

export default defineConfig({
  testDir: './visual',
  /**
   * Baselines locais em pasta separada e ignorada pelo git. Sem isto, rodar no Mac
   * sujaria a baseline do CI e o próximo PR viria com 200 imagens trocadas.
   */
  snapshotPathTemplate: localForcado && !ehLinux
    ? '{testDir}/__baseline-local__/{testFileName}/{arg}{ext}'
    : '{testDir}/__baseline__/{testFileName}/{arg}{ext}',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /**
   * Zero repetições, de propósito.
   *
   * `retries` esconde teste intermitente — e teste visual intermitente é justamente o que
   * precisa aparecer, não ser mascarado. Se um print só passa na segunda tentativa, tem
   * dado vivo ou animação na cena; o certo é congelar a cena, não repetir até dar sorte.
   */
  retries: 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['github']]
    : [['list']],

  use: {
    baseURL: 'http://127.0.0.1:5199',
    /**
     * `reducedMotion: 'reduce'` — liga `prefers-reduced-motion` no navegador do teste.
     *
     * Sem isso, todo print é uma corrida: o modal está no meio do deslize, o Giro parou
     * num ângulo qualquer, o Esqueleto está num ponto qualquer do pulso. A imagem sai
     * diferente a cada rodada e o teste reprova sozinho — o clássico "roda de novo que
     * passa" que destrói a confiança na suíte.
     *
     * A biblioteca inteira já honra essa preferência (todo componente tem o bloco
     * @media (prefers-reduced-motion: reduce)), então ligá-la não desenha um estado
     * inventado: desenha o estado final, que é o que queremos comparar. De quebra, este
     * teste passa a ser a prova de que aquele contrato continua valendo — se alguém
     * escrever uma animação que ignora a preferência, a cena vira ruído e o print reprova.
     *
     * Vai dentro de `contextOptions` porque é opção do CONTEXTO do navegador, não do
     * teste — o Playwright 1.6x só aceita `reducedMotion` por aqui.
     */
    contextOptions: {
      reducedMotion: 'reduce',
    },
    /** Fuso e idioma fixos: data e número formatados mudariam de máquina para máquina. */
    timezoneId: 'America/Sao_Paulo',
    locale: 'pt-BR',
    /** O relatório só serve se der para ver o que aconteceu. */
    screenshot: 'only-on-failure',
    trace: process.env.CI ? 'retain-on-failure' : 'off',
  },

  expect: {
    toHaveScreenshot: {
      /**
       * Tolerância: 0,1% dos pixels podem divergir, e cada um até 20/255 de diferença.
       *
       * Não é frouxidão — é a folga mínima para o Chromium desenhar a mesma sombra e o
       * mesmo texto duas vezes sem 1 pixel de diferença arredondando para o outro lado.
       * Zero absoluto reprova por nada; acima disso começa a passar mudança de verdade.
       * O número foi conferido: com 0.1%, trocar o padding do Button em 2px REPROVA
       * (~1,6% dos pixels da seção mudam) — e é isso que este teste existe para pegar.
       */
      maxDiffPixelRatio: 0.001,
      threshold: 0.2,
      /** Espera dois quadros idênticos antes de comparar: mata o print do meio da transição. */
      animations: 'disabled',
      caret: 'hide',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /**
         * Viewport e DPR fixos. `deviceScaleFactor: 1` porque o print em 2x quadruplica o
         * peso das imagens no git sem revelar nenhum defeito que 1x não revele.
         */
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      },
    },
  ],

  /**
   * Sobe a galeria sozinha. `reuseExistingServer` fora do CI: quem está iterando deixa o
   * `npm run galeria` aberto e o teste aproveita, em vez de brigar pela porta.
   */
  webServer: {
    command: 'npm run galeria',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
