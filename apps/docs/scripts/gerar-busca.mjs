import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Gera o índice de busca a partir das PÁGINAS e das ROTAS, no build.
 *
 * Por que gerar em vez de escrever à mão: uma lista de tópicos digitada apodrece na
 * primeira página nova — e o pior sintoma não é o erro, é o silêncio. A busca
 * simplesmente não acha a página que existe, e ninguém descobre.
 *
 * Por que extrair com regex e não renderizar as páginas: renderizar exigiria SSR, e
 * várias páginas usam estado e contexto (o ProvedorAvisos, os demos interativos) —
 * metade quebraria fora do navegador. O que a busca precisa são os TÍTULOS, e títulos
 * são literais no JSX: `<Titulo>`, `<Secao titulo="...">`, `<H3>`. É o mesmo escopo que
 * o Algolia indexa na maioria dos sites de doc, obtido sem subir um navegador no CI.
 *
 * A limitação é assumida: parágrafo não entra. Buscar "aria-invalid" não acha a frase no
 * meio de um texto. Se um dia incomodar, o caminho é indexar o HTML já construído — não
 * é piorar esta regex.
 *
 * O slug é resolvido AQUI, no build, e não em tempo de execução casando pelo nome da
 * função do componente: minificador renomeia função, e o casamento quebraria só no build
 * de produção — o pior tipo de bug, porque some no `npm run dev`.
 */

const AQUI = dirname(fileURLToPath(import.meta.url))
const DIR_PAGINAS = join(AQUI, '../src/paginas')
const ROTAS = join(AQUI, '../src/rotas.ts')
const SAIDA = join(AQUI, '../src/busca-indice.json')

const limpar = s =>
  s
    .replace(/\{['"`]([^'"`]*)['"`]\}/g, '$1') // {'texto'} → texto
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/&nbsp;|&mdash;|&amp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// ── Rotas: componente → arquivo, e componente → {slug, titulo, grupo} ────────
const fonteRotas = readFileSync(ROTAS, 'utf8')

const arquivoDe = new Map()
for (const m of fonteRotas.matchAll(/import\s+(\w+)\s+from\s+'\.\/paginas\/(\w+)'/g)) {
  arquivoDe.set(m[1], m[2])
}

const rotas = []
for (const m of fonteRotas.matchAll(
  /\{\s*slug:\s*'([^']+)',\s*titulo:\s*'([^']+)',\s*grupo:\s*'([^']+)'[^}]*componente:\s*(\w+)/g,
)) {
  const [, slug, titulo, grupo, comp] = m
  const arquivo = arquivoDe.get(comp)
  if (!arquivo) throw new Error(`rota '${slug}' aponta para ${comp}, que não foi importado`)
  rotas.push({ slug, titulo, grupo, arquivo })
}

if (rotas.length === 0) throw new Error('nenhuma rota reconhecida — o formato de rotas.ts mudou?')

// ── Extração dos títulos de cada página ─────────────────────────────────────
function extrair(fonte) {
  const secoes = []
  for (const m of fonte.matchAll(/<Secao\b[^>]*\btitulo=["']([^"']+)["']/g)) {
    secoes.push({ texto: m[1], nivel: 2 })
  }
  for (const m of fonte.matchAll(/<H3>([\s\S]*?)<\/H3>/g)) {
    const t = limpar(m[1])
    if (t) secoes.push({ texto: t, nivel: 3 })
  }
  return secoes
}

const indice = rotas.map(r => ({
  slug: r.slug,
  titulo: r.titulo,
  grupo: r.grupo,
  secoes: extrair(readFileSync(join(DIR_PAGINAS, `${r.arquivo}.tsx`), 'utf8')),
}))

writeFileSync(SAIDA, JSON.stringify(indice, null, 1) + '\n')

const total = indice.reduce((n, p) => n + p.secoes.length, 0)
const mudas = indice.filter(p => p.secoes.length === 0).map(p => p.slug)
console.log(`busca: ${indice.length} páginas, ${total} seções → src/busca-indice.json`)
// Página sem nenhuma seção provavelmente não é intencional — é um formato que a regex
// não reconheceu. Falha silenciosa de indexação é exatamente o que este script existe
// para evitar, então ela grita.
if (mudas.length) console.warn(`⚠ sem nenhuma seção indexada: ${mudas.join(', ')}`)
