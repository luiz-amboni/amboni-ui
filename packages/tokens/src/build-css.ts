import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { construirTema, MARCAS, type Marca, type TokensSemanticos } from './semantic.js'
import { espaco, raio, fonte, tamanhoFonte, peso, alturaLinha, duracao, easing, camada } from './primitives.js'

/**
 * Gera o CSS da biblioteca a partir dos tokens em TypeScript.
 *
 * Por que gerar em vez de escrever CSS na mão: a fonte da verdade fica em UM lugar,
 * com tipo e com teste de contraste. CSS escrito à mão sempre acaba divergindo.
 *
 * A saída usa CSS custom properties porque é o único formato que funciona em QUALQUER
 * stack — o iSafe (MUI) e o VEAR (Tailwind) consomem o mesmo arquivo. É isso que torna
 * a biblioteca neutra de verdade.
 */

const PREFIXO = 'amb'

/** Achata { color: { text: { primary: x } } } → 'color-text-primary': x */
function achatar(obj: object, prefixo = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const chave = prefixo ? `${prefixo}-${k}` : k
    if (v && typeof v === 'object') Object.assign(out, achatar(v, chave))
    else out[chave] = String(v)
  }
  return out
}

const vars = (t: object, ind = '  ') =>
  Object.entries(achatar(t))
    .map(([k, v]) => `${ind}--${PREFIXO}-${k}: ${v};`)
    .join('\n')

/** Tokens que não dependem de tema (espaço, raio, fonte, movimento). */
function baseCss(): string {
  const blocos = [
    ['espaco', espaco], ['raio', raio], ['fonte', fonte],
    ['texto', tamanhoFonte], ['peso', peso], ['leading', alturaLinha],
    ['duracao', duracao], ['easing', easing], ['camada', camada],
  ] as const

  return blocos
    .map(([nome, obj]) =>
      Object.entries(obj).map(([k, v]) => `  --${PREFIXO}-${nome}-${k}: ${v};`).join('\n'),
    )
    .join('\n\n')
}

function temaCss(marca: Marca, modo: 'light' | 'dark'): string {
  const t: TokensSemanticos = construirTema(marca, modo)
  // Seletor duplo: `data-theme` explícito OU a preferência do sistema.
  return `[data-amb-brand="${marca}"][data-amb-theme="${modo}"] {\n${vars(t)}\n}`
}

const marcas = Object.keys(MARCAS) as Marca[]

const css = `/**
 * @amboni/ui — tokens
 * ARQUIVO GERADO — não edite à mão. Fonte: packages/tokens/src/*.ts
 * Regenerar: npm run build -w @amboni/tokens
 *
 * Uso:
 *   import '@amboni/tokens/tokens.css'
 *   <html data-amb-brand="isafe" data-amb-theme="light">
 */

:root {
${baseCss()}
}

/* Tema padrão: iSafe claro. Assim a biblioteca funciona mesmo sem configurar nada. */
:root {
${vars(construirTema('isafe', 'light'))}
}

${marcas.flatMap(m => (['light', 'dark'] as const).map(modo => temaCss(m, modo))).join('\n\n')}

/* Respeita quem pediu menos movimento no sistema operacional. Acessibilidade: para
   parte das pessoas, animação causa enjoo e dor de cabeça — não é preferência estética. */
@media (prefers-reduced-motion: reduce) {
  :root {
${Object.keys(duracao).map(k => `    --${PREFIXO}-duracao-${k}: 0ms;`).join('\n')}
  }
}
`

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
mkdirSync(raiz, { recursive: true })
writeFileSync(join(raiz, 'tokens.css'), css, 'utf8')

const totalVars = css.match(/--amb-/g)?.length ?? 0
console.log(`✅ tokens.css gerado — ${marcas.length} marcas × 2 modos, ${totalVars} variáveis`)
