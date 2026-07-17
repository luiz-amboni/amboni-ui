import { writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Gera a imagem social (og.png) — a caixa que aparece quando alguém cola o link no
 * WhatsApp, no Slack ou no LinkedIn.
 *
 * Feita aqui, com o navegador que já está instalado, em vez de num serviço de terceiro
 * (@vercel/og e afins): a imagem é ESTÁTICA — muda uma vez por ano —, e pagar uma
 * dependência, uma conta e um ponto de falha externo para desenhar um retângulo com
 * texto é o tipo de troca que ninguém revisa e todo mundo herda.
 *
 * As cores saem dos tokens, não de hex digitado. Se a marca mudar, esta imagem muda
 * junto — sem alguém lembrar de reabrir o Figma.
 *
 * NÃO roda no build por padrão. O Playwright não é dependência deste repositório (ele
 * vive noutro projeto da máquina), então o CI não teria como executá-lo, e um prebuild
 * que falha no CI por falta de navegador é pior que uma imagem gerada à mão. O og.png
 * fica versionado; este script existe para regerá-lo quando a marca mudar:
 *
 *   node apps/docs/scripts/gerar-og.mjs
 */

const AQUI = dirname(fileURLToPath(import.meta.url))
const SAIDA = join(AQUI, '../public/og.png')

// O Playwright mora noutro projeto da máquina — importado por caminho para não virar
// dependência deste repositório por causa de uma imagem.
const CAMINHO_PW = '/Users/amboni/Documents/isafe-web/node_modules/playwright/index.mjs'

if (!existsSync(CAMINHO_PW)) {
  console.log('⏭  og.png: Playwright não encontrado — a imagem versionada continua valendo.')
  process.exit(0)
}

const { chromium } = await import(CAMINHO_PW)
const { construirTema } = await import('../../../packages/tokens/dist/index.js')

const t = construirTema('isafe', 'dark')

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: ${t.color.bg};
    color: ${t.color.text.primary};
    font-family: Manrope, sans-serif;
    padding: 72px;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
  }
  /* Brilho da marca no canto: dá profundidade sem virar enfeite gratuito. */
  .brilho {
    position: absolute; top: -280px; right: -180px;
    width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, ${t.color.brand.solid}44 0%, transparent 68%);
  }
  .topo { display: flex; align-items: center; gap: 16px; position: relative; }
  .marca {
    width: 52px; height: 52px; border-radius: 13px;
    background: ${t.color.brand.solid}; color: ${t.color.text.onBrand};
    display: grid; place-items: center;
    font-size: 28px; font-weight: 800;
  }
  .nome { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
  h1 {
    font-size: 74px; font-weight: 800; line-height: 1.03;
    letter-spacing: -0.035em; max-width: 15ch; position: relative;
  }
  .destaque { color: ${t.color.brand.text}; }
  .rodape { display: flex; gap: 14px; position: relative; }
  .selo {
    font-size: 19px; font-weight: 700;
    padding: 11px 20px; border-radius: 999px;
    background: ${t.color.surface}; border: 1px solid ${t.color.border.default};
    color: ${t.color.text.secondary};
  }
  .selo b { color: ${t.color.text.primary}; }
  .mono { font-family: 'JetBrains Mono', monospace; font-weight: 500; }
</style></head>
<body>
  <div class="brilho"></div>
  <div class="topo">
    <div class="marca">A</div>
    <div class="nome">@amboni/ui</div>
  </div>
  <h1>O contraste é <span class="destaque">testado</span>,<br>não prometido.</h1>
  <div class="rodape">
    <div class="selo"><b>28</b> componentes React</div>
    <div class="selo"><b>2</b> marcas · claro e escuro</div>
    <div class="selo"><b class="mono">30 kB</b> comprimido</div>
  </div>
</body></html>`

const navegador = await chromium.launch()
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } })
await pagina.setContent(html, { waitUntil: 'networkidle' })
// A fonte precisa ter carregado antes do clique do obturador — sem isto a imagem sai na
// fonte de sistema, e o cartão social é a primeira coisa que alguém vê da biblioteca.
await pagina.evaluate(() => document.fonts.ready)
await pagina.waitForTimeout(300)
writeFileSync(SAIDA, await pagina.screenshot({ type: 'png' }))
await navegador.close()

console.log('og.png gerado (1200×630) → apps/docs/public/og.png')
