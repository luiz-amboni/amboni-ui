import { describe, test, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * O contrato das PÁGINAS de documentação.
 *
 * Estes testes não olham para componente nenhum: olham para o que a documentação
 * promete. Existem porque doc erra em silêncio — ninguém abre chamado dizendo "a página
 * do Menu não explica o teclado". A pessoa só não usa o teclado, ou desiste, e vai embora
 * sem dizer nada.
 *
 * A ideia é do Radix, e eles a executam melhor: lá o link para o padrão WAI-ARIA é campo
 * de frontmatter, e a tabela de teclado é componente dedicado — 22 dos 30 componentes
 * deles têm link do APG, 21 têm tabela de teclado. Dava para saber isso com um grep. Na
 * nossa doc, descobrir quantos componentes documentavam teclado exigiu LER as 41 páginas.
 * Prosa não é auditável; estrutura é.
 */

const DIR = join(__dirname)
const ler = (arq: string) => readFileSync(join(DIR, arq), 'utf8')

/**
 * Componente cujo comportamento por teclado é a razão de ele existir na biblioteca em vez
 * de ser uma `<div>` no produto. Se um destes não documenta o teclado, a página está
 * escondendo justamente o que a biblioteca entrega.
 */
const INTERATIVOS = [
  'ButtonPage', 'MenuPage',
  'CampoPage', 'AreaTextoPage', 'SelecaoPage', 'CaixaPage', 'CampoFormPage',
  'TabelaPage',
  'DialogoPage', 'DicaPage',
  'AbasPage', 'AcordeaoPage', 'TrilhaPage', 'PaginacaoPage',
]

describe('a documentação é auditável, não só bonita', () => {
  test.each(INTERATIVOS)('%s documenta o teclado numa TABELA, não em prosa', arq => {
    const fonte = ler(`${arq}.tsx`)
    // `<Teclado>` em vez de "Esc fecha" escondido num parágrafo: com o componente, esta
    // pergunta vira um grep — e por isso vira um teste.
    expect(
      fonte.includes('<Teclado'),
      `${arq} não usa <Teclado>. O teclado é o motivo de este componente existir na ` +
        `biblioteca; se a página não o documenta em tabela, ninguém consegue auditar.`,
    ).toBe(true)
  })

  test('toda página existe de fato (a rota não aponta para o vazio)', () => {
    const rotas = readFileSync(join(DIR, '../rotas.ts'), 'utf8')
    const arquivos = new Set(readdirSync(DIR).filter(f => f.endsWith('.tsx')).map(f => f.replace('.tsx', '')))
    const importados = [...rotas.matchAll(/from '\.\/paginas\/(\w+)'/g)].map(m => m[1])
    const fantasmas = importados.filter(i => !arquivos.has(i))
    expect(fantasmas, `rotas apontam para páginas que não existem: ${fantasmas.join(', ')}`).toEqual([])
  })

  test('nenhuma página órfã — escrita e nunca ligada no menu', () => {
    // Página que existe no disco e não está na rota é trabalho jogado fora que ninguém
    // percebe: ela compila, o typecheck passa, e ela simplesmente não existe para quem lê.
    const rotas = readFileSync(join(DIR, '../rotas.ts'), 'utf8')
    const orfas = readdirSync(DIR)
      .filter(f => f.endsWith('Page.tsx'))
      .map(f => f.replace('.tsx', ''))
      .filter(p => !rotas.includes(`'./paginas/${p}'`))
    expect(orfas, `páginas escritas e não ligadas em rotas.ts: ${orfas.join(', ')}`).toEqual([])
  })
})
