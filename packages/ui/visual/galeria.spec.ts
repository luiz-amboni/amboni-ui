import { test, expect, type Page } from '@playwright/test'
import { PODE_TIRAR_PRINT } from '../playwright.config'

/**
 * O print — 4 marcas × temas, todos os componentes.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Este arquivo cobre o buraco que os 739 testes de jsdom não alcançam: nenhum deles olha
 * um pixel. jsdom não faz layout — `getBoundingClientRect()` devolve zero, CSS não é
 * avaliado, `getComputedStyle` responde o que você mesmo escreveu no style inline. Numa
 * biblioteca cujo produto É a aparência, isso deixava a parte principal sem rede.
 *
 * Já custou caro duas vezes, e as duas passaram por toda a suíte verde:
 *  · a busca do docs presa em 108px, porque um `backdrop-filter` num ancestral criou
 *    bloco contedor; ela pintava certo e engolia todo clique;
 *  · o `<dialog>` do modal esticando para 802px numa janela de 800 — é content-box.
 *
 * AS 4 COMBINAÇÕES SÃO OBRIGATÓRIAS. "Troca de marca e de tema sem tocar numa linha de
 * código" é a promessa central da biblioteca; hoje ela é verificada só na aritmética de
 * contraste dos tokens. Um componente com uma cor cravada na mão passa em contraste
 * (o token está lá, só não é usado) e passa em jsdom (que não pinta) — e aparece na hora
 * no print do tema escuro, como um retângulo branco no meio da tela preta.
 */

const MARCAS = ['isafe', 'vear'] as const
const TEMAS = ['light', 'dark'] as const
const SECOES = ['acao', 'formulario', 'entrada', 'dados', 'identidade', 'retorno', 'navegacao', 'utilitario'] as const

/**
 * O relógio do navegador, parado em 12/03/2026 — a mesma data que a galeria usa nos dados.
 *
 * Não basta a cena passar datas fixas: os componentes de data leem o relógio POR DENTRO.
 * O Calendario calcula `hoje` para decidir qual dia recebe o `tabindex` quando o foco
 * ainda não entrou na grade, e os atalhos do CampoPeriodo ("últimos 7 dias") são funções
 * que chamam `new Date()` na hora. Com o relógio andando, o print de hoje e o de amanhã
 * podem sair diferentes com o código idêntico — e a suíte reprova sozinha na virada do
 * mês, que é quando ninguém está esperando e todo mundo desconfia do teste.
 *
 * `setFixedTime` e não `install()`: o `install` troca os TIMERS por falsos, e aí um
 * `setTimeout` que nunca dispara trava componente que espera timer (a Dica é um deles).
 * Aqui só congelamos `Date.now()`/`new Date()`, que é exatamente o que faz falta.
 */
const AGORA = new Date('2026-03-12T13:30:00.000Z') // 10h30 em São Paulo (UTC-3)

test.skip(
  !PODE_TIRAR_PRINT,
  'Print só compara em Linux — a baseline é a do CI. Chromium do macOS desenha texto e ' +
    'sombra com outros pixels, então TODA imagem reprovaria aqui por motivo errado. ' +
    'Para iterar local: AMB_VISUAL_LOCAL=1 npm run visual (baseline própria, fora do git). ' +
    'Para atualizar a do CI: rode o workflow "Atualizar baseline visual" no GitHub.',
)

/**
 * Abre a cena e só devolve quando a página está PARADA de verdade.
 *
 * As três esperas existem por motivos diferentes, e tirar qualquer uma reintroduz uma
 * classe de print intermitente:
 *  1. `document.fonts.ready` — a fonte é local (ver galeria/fontes/fontes.css), então ela
 *     chega rápido; mas "rápido" não é "antes do print". Sem esperar, o texto pode sair
 *     na fonte de sistema num run e em Manrope no outro. Cinto e suspensório do
 *     `font-display: block`.
 *  2. `waitForLoadState('networkidle')` — o React ainda está montando na primeira pintura.
 *  3. `requestAnimationFrame` duplo — garante um quadro inteiro desenhado depois de tudo.
 */
async function abrir(page: Page, params: Record<string, string>) {
  // Antes do goto: depois, o React já teria lido o relógio de verdade na primeira pintura.
  await page.clock.setFixedTime(AGORA)
  const q = new URLSearchParams(params).toString()
  await page.goto(`/?${q}`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))))
}

for (const marca of MARCAS) {
  for (const tema of TEMAS) {
    test.describe(`${marca} / ${tema}`, () => {
      for (const secao of SECOES) {
        test(`seção ${secao}`, async ({ page }) => {
          await abrir(page, { marca, tema, cena: 'tudo' })

          /**
           * O print é da SEÇÃO, não da página inteira.
           *
           * Página inteira daria um diff enorme e ilegível: mexeu no Button, a imagem de
           * 6000px reprova e você caça o que mudou com a lupa. Por seção, o relatório já
           * diz "foi na ação" e o diff cabe na tela. É por isso que o Ant Design tem 6.000
           * prints em vez de 4.
           */
          await expect(page.locator(`[data-secao="${secao}"]`)).toHaveScreenshot(`${marca}-${tema}-${secao}.png`)
        })
      }

      /**
       * Foco em cena própria. O anel só existe em `:focus-visible` — não dá para forçar
       * por CSS de fora, tem que focar o elemento de verdade. `.focus()` programático
       * conta como foco de teclado para o Chromium, que é o caso que importa.
       */
      test('anel de foco', async ({ page }) => {
        await abrir(page, { marca, tema, cena: 'tudo' })
        await page.locator('#alvo-foco-botao').focus()
        await expect(page.locator('[data-secao="acao"]')).toHaveScreenshot(`${marca}-${tema}-foco-botao.png`)

        await page.locator('#alvo-foco-campo').focus()
        await expect(page.locator('[data-secao="formulario"]')).toHaveScreenshot(`${marca}-${tema}-foco-campo.png`)
      })
    })
  }
}

/**
 * As sobreposições: janela inteira, e só na marca iSafe.
 *
 * Aqui a decisão é ASSIMÉTRICA de propósito. O que se testa nelas é geometria — o modal
 * cabe na janela, a gaveta cola na borda, a dica aponta para o lado certo — e geometria não
 * muda entre marcas: os tokens de marca trocam COR, não medida. Fotografar as 10 cenas nas
 * 4 combinações somaria 40 imagens que reprovariam sempre juntas, dizendo a mesma coisa
 * quatro vezes. A cor delas já está coberta pelas seções.
 *
 * Os dois temas ficam porque o fundo escurecido e a sombra do modal SÃO diferentes no
 * escuro — e é exatamente lá que sobreposição costuma sumir dentro do fundo.
 */
const CENAS = [
  'dialogo-sm', 'dialogo-md', 'dialogo-lg', 'dialogo-full',
  'gaveta-direita', 'gaveta-esquerda', 'gaveta-baixo',
  'aviso',
] as const

for (const tema of TEMAS) {
  for (const cena of CENAS) {
    test(`sobreposição ${cena} / isafe / ${tema}`, async ({ page }) => {
      await abrir(page, { marca: 'isafe', tema, cena })
      await expect(page).toHaveScreenshot(`sobreposicao-${cena}-${tema}.png`)
    })
  }

  /**
   * Menu e Dica precisam de uma ação para existir na tela, e a ação é DAQUI.
   *
   * A cena não tenta se abrir sozinha: quando tentava, com evento fabricado no
   * `useEffect`, os dois falharam calados e os prints saíram vazios — prontos para virar
   * baseline e passar a exigir que o menu ficasse fechado. `click()` e `focus()` do
   * Playwright acionam o navegador de verdade.
   *
   * A asserção de visibilidade antes do print não é decoração: é ela que separa "o menu
   * abriu e está assim" de "o menu não abriu e o print está vazio". Sem ela, o print
   * fotografa o fracasso e chama de esperado.
   */
  test(`sobreposição menu / isafe / ${tema}`, async ({ page }) => {
    await abrir(page, { marca: 'isafe', tema, cena: 'menu' })
    await page.locator('#gatilho-menu').click()
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page).toHaveScreenshot(`sobreposicao-menu-${tema}.png`)
  })

  // O Popover é controlado: a cena já abre aberta, sem clique nenhum para dar errado.
  test(`sobreposição popover / isafe / ${tema}`, async ({ page }) => {
    await abrir(page, { marca: 'isafe', tema, cena: 'popover' })
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page).toHaveScreenshot(`sobreposicao-popover-${tema}.png`)
  })

  for (const lado of ['cima', 'baixo', 'esq', 'dir'] as const) {
    test(`sobreposição dica ${lado} / isafe / ${tema}`, async ({ page }) => {
      await abrir(page, { marca: 'isafe', tema, cena: 'dica' })
      // foco, não hover: o hover depende da seta parada em cima do elemento na hora do
      // print, e é a origem clássica do print intermitente. No foco a Dica abre sem atraso.
      await page.locator(`#gatilho-dica-${lado}`).focus()
      await expect(page.getByRole('tooltip')).toBeVisible()
      await expect(page).toHaveScreenshot(`sobreposicao-dica-${lado}-${tema}.png`)
    })
  }
}
