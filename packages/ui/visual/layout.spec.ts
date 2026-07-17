import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * Layout — medida de verdade, num motor de layout de verdade.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * O print pega QUE mudou. Ele não diz O QUE mudou nem POR QUÊ — a imagem reprova, você
 * olha o diff e interpreta. Estas asserções são o contrário: poucas, numéricas, e cada uma
 * com um nome que já é o diagnóstico. Quando "botão e campo têm a mesma altura" reprova,
 * ninguém precisa da lupa.
 *
 * Elas também são as únicas que rodam em QUALQUER sistema — no seu Mac, no CI, em
 * qualquer lugar. Antialiasing muda pixel, não muda `getBoundingClientRect().height`. Por
 * isso não têm o `test.skip` de plataforma que o galeria.spec.ts tem: são a rede de
 * segurança que você tem antes de abrir o PR.
 *
 * Nenhuma delas seria possível em jsdom. Lá, todas as alturas são 0 — as cinco passariam
 * sem verificar nada, que é a pior espécie de teste verde.
 */

/** Mesmo relógio congelado do galeria.spec.ts — ver a explicação longa lá. */
const AGORA = new Date('2026-03-12T13:30:00.000Z')

async function abrir(page: Page, params: Record<string, string>) {
  await page.clock.setFixedTime(AGORA)
  await page.goto(`/?${new URLSearchParams(params)}`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
}

const altura = async (l: Locator) => (await l.boundingBox())!.height

test.describe('alinhamento da linha de base', () => {
  /**
   * O motivo de o token `--amb-altura-*` existir.
   *
   * Botão ao lado de campo é o arranjo mais comum de toda interface — busca com botão,
   * filtro com aplicar, formulário em linha. Um pixel de diferença e a linha inteira fica
   * torta. Hoje isto é uma AFIRMAÇÃO da documentação: os dois leem o mesmo token, logo
   * teriam a mesma altura. Ninguém nunca mediu. Bastava alguém pôr um `padding` a mais no
   * Button, ou um `border-width` diferente no Campo, para a promessa cair — e nenhum dos
   * 739 testes notaria, porque em jsdom os dois medem zero e zero é igual a zero.
   */
  for (const tamanho of ['sm', 'md', 'lg'] as const) {
    test(`Button ${tamanho} e Campo ${tamanho} têm exatamente a mesma altura`, async ({ page }) => {
      await abrir(page, { cena: 'tudo' })

      const botao = page.locator('[data-secao="acao"] button', { hasText: 'Salvar' }).nth(['sm', 'md', 'lg'].indexOf(tamanho))
      /**
       * O `.amb-campo` (a caixa com a borda), não o `<input>` de dentro.
       *
       * Erro que cometi ao escrever este teste, e que vale registrar: medir o `<input>`
       * dá 42px onde o botão dá 44px, e o teste "acha um bug" que não existe — o input
       * tem `height: 100%` e vive DENTRO da borda de 1px de cada lado. O que se alinha com
       * o botão na tela é a caixa externa. Medir a peça errada é o jeito mais fácil de um
       * teste de layout mentir com números convincentes.
       */
      const campo = page.locator(`[data-secao="formulario"] input[aria-label="${tamanho}"]`).locator('xpath=ancestor::*[contains(@class,"amb-campo")][1]')

      const [hb, hc] = [await altura(botao), await altura(campo)]

      // Exatamente igual, sem tolerância: os dois leem o MESMO token. Qualquer diferença é
      // alguém tendo escrito uma medida na mão em vez de usar o token.
      expect(hb, `Button ${tamanho}=${hb}px vs Campo ${tamanho}=${hc}px — o token --amb-altura-${tamanho} deixou de valer para um dos dois`).toBe(hc)
    })
  }
})

test.describe('sobreposição cabe na janela', () => {
  /**
   * O bug do `<dialog>` esticando para 802px numa janela de 800, que só apareceu quando um
   * agente rodou Chromium de verdade: `<dialog>` é content-box, então `max-height: 100%`
   * mais padding e borda dá MAIS que 100%. O modal passa da tela, o rodapé com o botão
   * "Confirmar" fica fora do alcance e não há rolagem para chegar nele.
   */
  for (const size of ['sm', 'md', 'lg', 'full'] as const) {
    test(`Dialogo ${size} aberto não passa da altura nem da largura da janela`, async ({ page }) => {
      await abrir(page, { cena: `dialogo-${size}` })

      const caixa = (await page.locator('dialog[open]').boundingBox())!
      const janela = page.viewportSize()!

      expect(caixa.height, `o modal ${size} tem ${caixa.height}px numa janela de ${janela.height}px — o rodapé fica inalcançável`).toBeLessThanOrEqual(janela.height)
      expect(caixa.width).toBeLessThanOrEqual(janela.width)
      // e não pode começar acima do topo: um modal alto demais escapa para cima
      expect(caixa.y).toBeGreaterThanOrEqual(0)
    })
  }

  test('Gaveta aberta ocupa a altura da janela sem transbordar', async ({ page }) => {
    await abrir(page, { cena: 'gaveta-direita' })
    const caixa = (await page.locator('dialog[open]').boundingBox())!
    const janela = page.viewportSize()!
    expect(caixa.height).toBeLessThanOrEqual(janela.height)
    // colada na borda direita: é o que "gaveta da direita" quer dizer
    expect(Math.round(caixa.x + caixa.width)).toBe(janela.width)
  })
})

test('a coluna fixa da Tabela realmente gruda ao rolar na horizontal', async ({ page }) => {
  /**
   * `position: sticky` é a propriedade que mais falha em silêncio no CSS: basta um
   * `overflow: hidden` num ancestral, ou o pai não ter altura, e ela vira `static` — sem
   * erro, sem aviso. A coluna some ao rolar e ninguém percebe até um cliente reclamar.
   *
   * jsdom não tem rolagem nem sticky: aqui não há teste possível fora de um navegador.
   */
  await abrir(page, { cena: 'tudo' })

  const rolagem = page.locator('#tabela-fixa .amb-tabela__rolagem')
  const primeiraCelula = page.locator('#tabela-fixa .amb-tabela__celula--fixa').first()
  const ultimaCelula = page.locator('#tabela-fixa tbody tr:first-child td:last-child')

  // Primeiro: a tabela transborda mesmo? Sem isto, o teste "passaria" numa tabela que cabe
  // na tela — onde nada rola e o sticky nunca é exercido. Já vi essa armadilha passar por
  // revisão: o teste fica verde para sempre e não protege nada.
  const transborda = await rolagem.evaluate(el => el.scrollWidth > el.clientWidth)
  expect(transborda, 'a tabela cabe na tela — o teste de coluna fixa não está exercendo o sticky').toBe(true)

  const antes = (await primeiraCelula.boundingBox())!.x
  const antesUltima = (await ultimaCelula.boundingBox())!.x

  await rolagem.evaluate(el => { el.scrollLeft = 9999 })
  await page.waitForFunction(() => true)

  const depois = (await primeiraCelula.boundingBox())!.x
  const depoisUltima = (await ultimaCelula.boundingBox())!.x

  // a coluna fixa NÃO andou...
  expect(Math.abs(depois - antes), `a célula fixa andou ${Math.abs(depois - antes)}px ao rolar — o sticky quebrou (basta um overflow: hidden num ancestral)`).toBeLessThanOrEqual(1)
  // ...e o resto andou. As duas metades importam: se nada rolou, a primeira asserção
  // passaria por acidente.
  expect(antesUltima - depoisUltima, 'nada rolou — a asserção da coluna fixa passaria de graça').toBeGreaterThan(50)
})

/**
 * ── O defeito que este teste achou no dia em que nasceu, e já foi corrigido ──
 *
 * A Dica ancora no `<span class="amb-dica">` que ela põe em volta do gatilho. Esse span é
 * `display: inline-flex`, o que resolve a caixa dele quando ele é o container — mas não
 * quando ele é ITEM de outro flex. Aí valia o `align-items: stretch` do pai, de fábrica: o
 * span esticava até a altura da linha e o balão ancorava na caixa esticada, não no botão.
 *
 * Medido aqui, numa janela de 800px: o invólucro ficava com 560px de altura contra 44 do
 * botão, e o balão pousava a ~520px do gatilho. Ele não sumia — pousava no meio do nada,
 * apontando para nada.
 *
 * Não é arranjo exótico: uma barra de ações com `display: flex` é o lugar mais provável de
 * existir uma Dica. E as "limitações conhecidas" no fim de Dica.tsx não mencionavam este
 * caso — ninguém sabia. Nenhum dos 974 testes de jsdom podia saber: jsdom não faz layout.
 * O primeiro print de um navegador de verdade mostrou na primeira tentativa.
 *
 * Corrigido com `align-self: flex-start` no `.amb-dica`. O teste nasceu como `test.fail()`
 * — bug conhecido registrado como vermelho controlado, nunca como comentário que ninguém
 * lê — e virou exigência assim que o conserto entrou. É para isso que o `test.fail()`
 * serve: ele avisa no dia em que deixa de ser verdade.
 */
test('a Dica ancora no gatilho, não no invólucro esticado por um flex pai', async ({ page }) => {
  await abrir(page, { cena: 'dica-flex' })

  const gatilho = page.locator('#gatilho-dica-flex')
  await gatilho.focus()
  const balao = page.getByRole('tooltip')
  await balao.waitFor()

  const g = (await gatilho.boundingBox())!
  const b = (await balao.boundingBox())!

  // lado "baixo": o balão nasce 8px abaixo do gatilho. Damos 4px de folga para
  // arredondamento — o que se quer pegar é o erro de 500px, não o de meio pixel.
  const esperado = g.y + g.height + 8
  expect(
    Math.abs(b.y - esperado),
    `o balão está a ${Math.round(b.y)}px e o gatilho acaba em ${Math.round(g.y + g.height)}px — ${Math.round(b.y - esperado)}px de distância do lugar`,
  ).toBeLessThanOrEqual(4)
})

test('o anel de foco é visível — ninguém apagou o outline', async ({ page }) => {
  /**
   * `outline: none` sem substituto é a falha de acessibilidade nº 1 da web, e o jeito mais
   * fácil de introduzi-la é um reset de CSS bem-intencionado. O axe NÃO pega isso: não é
   * uma regra dele, e em jsdom o outline nem é computado.
   *
   * Medimos os dois caminhos possíveis de anel — `outline` e `box-shadow` — porque as duas
   * técnicas são legítimas; o que não é legítimo é não haver nenhum.
   */
  await abrir(page, { cena: 'tudo' })
  const botao = page.locator('#alvo-foco-botao')

  const semFoco = await botao.evaluate(el => getComputedStyle(el).outlineWidth)
  await botao.focus()
  const comFoco = await botao.evaluate(el => {
    const s = getComputedStyle(el)
    return { largura: parseFloat(s.outlineWidth), estilo: s.outlineStyle, cor: s.outlineColor, sombra: s.boxShadow }
  })

  const temAnel = (comFoco.largura > 0 && comFoco.estilo !== 'none') || (comFoco.sombra !== 'none' && comFoco.sombra !== semFoco)
  expect(temAnel, `botão focado sem anel visível (outline: ${comFoco.largura}px ${comFoco.estilo}, box-shadow: ${comFoco.sombra}) — quem navega por teclado se perde`).toBe(true)
  expect(comFoco.cor).not.toBe('rgba(0, 0, 0, 0)')
})

test('texto longo demais num card cede a caixa, em vez de estourar o layout', async ({ page }) => {
  /**
   * O caso da busca do docs, na forma genérica: conteúdo que não cabe tem que CEDER
   * dentro da caixa, nunca empurrar a caixa. Quando empurra, o vizinho é atropelado, a
   * página ganha rolagem horizontal e o layout ao lado desmonta.
   *
   * Aqui isso é o contrato explícito do Card.css: `min-width: 0` no `.amb-card__header-txt`
   * — comentado lá como "a regra menos óbvia deste arquivo" — mais `flex-shrink: 0` na
   * ação. Traduzido: título longo encolhe, botão fica onde está, dentro do card.
   *
   * Uma linha de CSS que qualquer refactor apaga por engano, e que nada defendia: em jsdom
   * o card, o título e o botão medem todos zero, e zero cabe em zero.
   */
  await abrir(page, { cena: 'tudo' })

  const card = page.locator('#card-texto-longo')
  const titulo = card.locator('.amb-card__title')
  const acao = page.locator('#acao-do-card')

  const cx = (await card.boundingBox())!
  const tx = (await titulo.boundingBox())!
  const ax = (await acao.boundingBox())!

  // O texto é maior que a caixa? Senão o teste não está testando nada — ele passaria para
  // sempre e ninguém saberia que o cenário deixou de apertar.
  const aperta = await titulo.evaluate(el => el.scrollHeight > 40)
  expect(aperta, 'o título cabe numa linha — troque por um mais longo, o teste não prova nada assim').toBe(true)

  // 1. o título cedeu: não passou da borda do card
  expect(tx.x + tx.width, 'o título passou da borda do card — o min-width: 0 do header-txt sumiu').toBeLessThanOrEqual(cx.x + cx.width)

  // 2. a ação continua DENTRO do card — é ela que o min-width: 0 protege
  expect(ax.x + ax.width, `o botão de ação está em ${Math.round(ax.x + ax.width)}px e o card acaba em ${Math.round(cx.x + cx.width)}px — o título empurrou a ação para fora`).toBeLessThanOrEqual(cx.x + cx.width)

  // 3. e nada disso vazou para a página
  const rolagem = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(rolagem, 'a página ganhou rolagem horizontal — algum conteúdo está empurrando o layout').toBe(false)
})

/**
 * ── O Card encolhia dentro de um flex ───────────────────────────────────────
 *
 * Achado migrando a tela de Métricas do iSafe — uma tela de verdade, não um exemplo.
 *
 * Como `<div>`, o card ocupa a linha inteira e o defeito não existe. Dentro de um
 * container flex, o item vale `width: auto` e ele encolhe até o tamanho do texto: quatro
 * KPIs com rótulos de comprimentos diferentes viram quatro caixas de larguras diferentes.
 *
 * O `.amb-card--interactive` já tinha `width: 100%` — porque virar `<button>` deixa o
 * encolhimento óbvio na hora. Como `<div>`, o MESMO defeito existia e só aparecia em
 * flex: mais raro, e por isso pior. Passa no teste e aparece na tela de alguém.
 *
 * Quem tropeçou nisso resolveu com `sx={{ display: 'flex' }}` no pai — uma muleta no
 * produto para um defeito da biblioteca. É esse tipo de contorno que este teste evita.
 */
test('quatro cards num flex têm a mesma largura, apesar de textos diferentes', async ({ page }) => {
  await abrir(page, { cena: 'card-flex' })

  const cards = page.locator('.amb-card')
  await cards.first().waitFor()

  const larguras: number[] = []
  for (let i = 0; i < (await cards.count()); i++) {
    const caixa = await cards.nth(i).boundingBox()
    larguras.push(Math.round(caixa!.width))
  }

  // Sem `width: 100%`, o card com "Taxa de entrega no período selecionado" fica MUITO
  // mais largo que o de "Falhas". Com ela, o flex reparte igual.
  const menor = Math.min(...larguras)
  const maior = Math.max(...larguras)
  expect(
    maior - menor,
    `larguras: ${larguras.join(', ')} — o card está encolhendo para o tamanho do texto`,
  ).toBeLessThanOrEqual(1)
})

/**
 * ── O símbolo dentro da caixa saía do centro ────────────────────────────────
 *
 * Achado NO OLHO, por quem usava — não por teste. É o tipo de defeito que a gente
 * documenta que "não dá para automatizar" até alguém apontar.
 *
 * A causa: dentro da marca vivem DOIS desenhos, o ✓ e o tracinho do estado parcial. Só
 * um aparece por vez; o outro é escondido com `opacity: 0`. Mas **transparente não é
 * ausente** — como itens de flex, os dois continuavam ocupando espaço lado a lado.
 *
 * Medido antes do conserto: o ✓ ENCOLHIA de 12 para 8px e ficava com 1px de folga de um
 * lado e 9px do outro, numa caixa de 18. O `justify-content: center` estava lá e
 * funcionava — só que centralizava o PAR, não o símbolo visível. Por isso ninguém achou
 * lendo o CSS: ele parecia certo.
 *
 * Consertado com grid + `grid-area: 1/1` nos dois: empilhados, não enfileirados.
 *
 * Este teste é de LAYOUT e não de print de propósito: um print pega a diferença, mas um
 * número diz o que houve. "esq=1 dir=9" aponta para a causa; uma imagem vermelha, não.
 */
test.describe('o símbolo fica no centro da caixa', () => {
  test('o ✓ da caixa marcada', async ({ page }) => {
    await abrir(page, { cena: 'formulario' })

    const folgas = await page.evaluate(() => {
      const marca = document.querySelector('.amb-caixa__input:checked + .amb-caixa__marca')
      if (!marca) return null
      const svg = marca.querySelector('.amb-caixa__check')!
      const d = marca.getBoundingClientRect(), s = svg.getBoundingClientRect()
      return {
        esq: +(s.left - d.left).toFixed(1),
        dir: +(d.right - s.right).toFixed(1),
        topo: +(s.top - d.top).toFixed(1),
        baixo: +(d.bottom - s.bottom).toFixed(1),
        largura: +s.width.toFixed(1),
      }
    })

    expect(folgas, 'não achei caixa marcada na cena').not.toBeNull()
    // Um símbolo espremido denuncia o mesmo bug por outro ângulo: se o ✓ deixar de ser
    // quadrado, alguma coisa está roubando o espaço dele.
    expect(folgas!.largura, `o ✓ deveria ter 12px de largura, tem ${folgas!.largura}`).toBe(12)
    expect(folgas!.esq, `horizontal torto: esq=${folgas!.esq} dir=${folgas!.dir}`).toBe(folgas!.dir)
    expect(folgas!.topo, `vertical torto: topo=${folgas!.topo} baixo=${folgas!.baixo}`).toBe(folgas!.baixo)
  })

  test('o tracinho da caixa parcial', async ({ page }) => {
    // O outro símbolo tem que estar centrado pelo mesmo motivo — e é ele que estava
    // empurrando o ✓. Testar só o ✓ deixaria metade da causa sem rede.
    await abrir(page, { cena: 'formulario' })

    const folgas = await page.evaluate(() => {
      const marca = document.querySelector('.amb-caixa__input:indeterminate + .amb-caixa__marca')
      if (!marca) return null
      const svg = marca.querySelector('.amb-caixa__traco')!
      const d = marca.getBoundingClientRect(), s = svg.getBoundingClientRect()
      return {
        esq: +(s.left - d.left).toFixed(1),
        dir: +(d.right - s.right).toFixed(1),
      }
    })

    expect(folgas, 'não achei caixa parcial na cena').not.toBeNull()
    expect(folgas!.esq, `torto: esq=${folgas!.esq} dir=${folgas!.dir}`).toBe(folgas!.dir)
  })
})
