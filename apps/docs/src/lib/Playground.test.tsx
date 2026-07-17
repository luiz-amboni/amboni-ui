import { describe, test, expect } from 'vitest'
import { gerarCodigo, type Controle } from './Playground'

/**
 * A geração de código é a única lógica do playground — o resto é estado e JSX. E é lógica
 * com armadilha: cada teste aqui é uma forma de gerar código que não compila, ou que
 * ensina a escrever JSX de um jeito que ninguém escreve à mão.
 */

const BOTAO: Controle[] = [
  { prop: 'variant', tipo: 'select', opcoes: ['primary', 'secondary', 'ghost', 'danger'], padrao: 'secondary' },
  { prop: 'size', tipo: 'select', opcoes: ['sm', 'md', 'lg'], padrao: 'md' },
  { prop: 'loading', tipo: 'bool', padrao: false },
  { prop: 'block', tipo: 'bool', padrao: false },
  { prop: 'children', tipo: 'texto', padrao: 'Salvar' },
]

const padroes = () => Object.fromEntries(BOTAO.map(c => [c.prop, c.padrao]))
const botao = (mudancas: Record<string, string | number | boolean> = {}) =>
  gerarCodigo('Button', BOTAO, { ...padroes(), ...mudancas })

describe('o que está no padrão não aparece', () => {
  test('nada mudado = tag limpa', () => {
    // O teste que justifica o componente. Um playground que imprime todas as props
    // ensinaria a escrever `<Button variant="secondary" size="md" loading={false}>`.
    expect(botao()).toBe('<Button>Salvar</Button>')
  })

  test('só o que difere do padrão entra', () => {
    expect(botao({ variant: 'danger' })).toBe('<Button variant="danger">Salvar</Button>')
  })

  test('voltar ao padrão remove a prop do código', () => {
    expect(botao({ variant: 'ghost' })).toContain('variant="ghost"')
    expect(botao({ variant: 'secondary' })).not.toContain('variant')
  })

  test('prop obrigatória (`sempre`) sai mesmo parada no valor inicial', () => {
    // Sem isto o StatCard, cujo label e value não têm padrão, geraria `<StatCard />` —
    // um exemplo que não compila, publicado pelo site que define a API.
    const controles: Controle[] = [
      { prop: 'label', tipo: 'texto', padrao: 'Investido', sempre: true },
      { prop: 'tone', tipo: 'select', opcoes: ['brand', 'danger'], padrao: 'brand' },
    ]
    expect(gerarCodigo('StatCard', controles, { label: 'Investido', tone: 'brand' })).toBe(
      '<StatCard label="Investido" />',
    )
  })

  test('duas props fora do padrão saem juntas, na ordem em que foram declaradas', () => {
    expect(botao({ size: 'lg', variant: 'primary' })).toBe(
      '<Button variant="primary" size="lg">Salvar</Button>',
    )
  })
})

describe('booleano', () => {
  test('true vira a forma curta — não `loading={true}`', () => {
    expect(botao({ loading: true })).toBe('<Button loading>Salvar</Button>')
  })

  test('false só aparece quando o padrão da prop é true', () => {
    const controles: Controle[] = [{ prop: 'plano', tipo: 'bool', padrao: true }]
    expect(gerarCodigo('Card', controles, { plano: false })).toBe('<Card plano={false} />')
    expect(gerarCodigo('Card', controles, { plano: true })).toBe('<Card />')
  })
})

describe('children', () => {
  test('vira filho, nunca atributo', () => {
    const r = botao({ variant: 'danger', children: 'Apagar' })
    expect(r).toBe('<Button variant="danger">Apagar</Button>')
    expect(r).not.toContain('children=')
  })

  test('children no padrão AINDA aparece — é o texto que está na tela', () => {
    // A exceção à regra do padrão. Sem ela, "nada mudado" geraria `<Button />`, que não é
    // o botão ao lado.
    expect(botao()).toContain('>Salvar<')
  })

  test('sem texto, a tag se fecha sozinha', () => {
    expect(botao({ children: '' })).toBe('<Button />')
    expect(botao({ children: '   ' })).toBe('<Button />')
  })

  test('componente sem controle de children é sempre auto-fechado', () => {
    const controles: Controle[] = [{ prop: 'label', tipo: 'texto', padrao: 'Investido' }]
    expect(gerarCodigo('StatCard', controles, { label: 'Retorno' })).toBe(
      '<StatCard label="Retorno" />',
    )
  })
})

describe('número', () => {
  test('sai entre chaves, não entre aspas', () => {
    const controles: Controle[] = [{ prop: 'total', tipo: 'numero', padrao: 1 }]
    expect(gerarCodigo('Paginacao', controles, { total: 12 })).toBe('<Paginacao total={12} />')
  })
})

describe('caractere especial não quebra o código gerado', () => {
  test('aspas duplas no atributo viram expressão com aspas simples', () => {
    // `placeholder="diz "oi""` fecharia o atributo no meio e não compila.
    const controles: Controle[] = [{ prop: 'placeholder', tipo: 'texto', padrao: '' }]
    expect(gerarCodigo('Campo', controles, { placeholder: 'diz "oi"' })).toBe(
      `<Campo placeholder={'diz "oi"'} />`,
    )
  })

  test('`<` no children vira expressão — texto cru com `<` não é JSX válido', () => {
    expect(botao({ children: 'a < b' })).toBe(`<Button>{'a < b'}</Button>`)
  })

  test('chaves no children viram expressão', () => {
    expect(botao({ children: 'usa {valor}' })).toBe(`<Button>{'usa {valor}'}</Button>`)
  })

  test('aspa simples dentro do texto é escapada', () => {
    expect(botao({ children: "d'água < 5" })).toBe(`<Button>{'d\\'água < 5'}</Button>`)
  })

  test('barra invertida é escapada antes das aspas (senão o escape se autodestrói)', () => {
    expect(botao({ children: 'a\\b < c' })).toBe(`<Button>{'a\\\\b < c'}</Button>`)
  })

  test('acento e emoji passam intactos — não são sintaxe', () => {
    expect(botao({ children: 'Ação 🚀' })).toBe('<Button>Ação 🚀</Button>')
  })

  test('aspas duplas no children NÃO viram expressão — só custariam ruído', () => {
    expect(botao({ children: 'diz "oi"' })).toBe('<Button>diz "oi"</Button>')
  })
})

describe('quebra de linha', () => {
  test('linha longa vira uma prop por linha', () => {
    const r = botao({ variant: 'primary', size: 'lg', loading: true, block: true })
    expect(r).toBe(
      `<Button
  variant="primary"
  size="lg"
  loading
  block
>
  Salvar
</Button>`,
    )
  })

  test('auto-fechado longo fecha em `/>` na própria linha', () => {
    const controles: Controle[] = [
      { prop: 'label', tipo: 'texto', padrao: '' },
      { prop: 'value', tipo: 'texto', padrao: '' },
    ]
    expect(
      gerarCodigo('StatCard', controles, {
        label: 'Investido no período',
        value: 'R$ 1.994,31 em 159.111 exibições',
      }),
    ).toBe(
      `<StatCard
  label="Investido no período"
  value="R$ 1.994,31 em 159.111 exibições"
/>`,
    )
  })

  test('curto continua em uma linha só', () => {
    expect(botao({ variant: 'danger' })).not.toContain('\n')
  })

  test('sem atributos não quebra, por mais longo que o texto seja', () => {
    // Não há o que quebrar: quebrar em três linhas por causa do texto seria pior.
    const r = botao({ children: 'Um rótulo absurdamente longo para um botão de verdade' })
    expect(r).not.toContain('\n')
  })
})
