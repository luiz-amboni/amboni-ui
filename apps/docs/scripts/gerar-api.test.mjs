import { describe, it, expect } from 'vitest'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extrairDeFontes, extrairDoPacote } from './gerar-api.mjs'

/**
 * A extração é onde mora o risco: se ela errar calado, a doc mente com a autoridade de
 * "isto veio do código". Por isso o teste é contra um trecho de TS de mentira, com as
 * armadilhas escolhidas a dedo — são exatamente os casos em que uma regex passaria.
 *
 * O caminho é dentro do app de propósito: o arquivo não existe em disco (o host serve da
 * memória), mas o compilador resolve as libs a partir dele normalmente.
 */
const CAMINHO = resolve(dirname(fileURLToPath(import.meta.url)), '__falso__.tsx')

const FALSO = `
export type Tom =
  | 'calmo'
  | 'urgente'

export interface FalsoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** O rótulo. Sem ele o componente não existe. */
  titulo: string
  /**
   * Primeira linha da explicação.
   * Segunda linha, que continua a frase anterior.
   * @default 'calmo'
   */
  tom?: Tom
  /** @default 3 */
  nivel?: 2 | 3 | 4
  /** União escrita direto na prop, quebrada em várias linhas. */
  estado?:
    | 'novo'
    | 'antigo'
    | null
  /** Genérico com objeto dentro — onde a regex tropeça no \`<\` e na \`{\`. */
  itens?: Array<{ id: string; peso: number }>
  aoTrocar?: (valor: string | null) => void
}

/**
 * Falso — componente de mentira.
 *
 * @example
 * <Falso titulo="oi" />
 */
export function Falso(_: FalsoProps) { return null }
`

function extrair(texto = FALSO) {
  return extrairDeFontes([{ caminho: CAMINHO, texto }])
}

function prop(componente, nome) {
  return componente.props.find(p => p.nome === nome)
}

describe('extração da API a partir do código', () => {
  const api = extrair()
  const falso = api.Falso

  it('usa a convenção XxxProps como nome do componente', () => {
    expect(Object.keys(api)).toContain('Falso')
    expect(falso.tipo).toBe('FalsoProps')
  })

  it('distingue prop obrigatória de opcional', () => {
    expect(prop(falso, 'titulo').obrigatoria).toBe(true)
    expect(prop(falso, 'tom').obrigatoria).toBe(false)
  })

  it('tira o @default do JSDoc e não o deixa vazar para a descrição', () => {
    expect(prop(falso, 'tom').padrao).toBe("'calmo'")
    expect(prop(falso, 'nivel').padrao).toBe('3')
    expect(prop(falso, 'tom').descricao).not.toContain('@default')
    expect(prop(falso, 'titulo').padrao).toBeUndefined()
  })

  it('junta o JSDoc multi-linha numa descrição só', () => {
    expect(prop(falso, 'tom').descricao).toBe(
      'Primeira linha da explicação. Segunda linha, que continua a frase anterior.',
    )
  })

  it('abre o apelido de união em várias linhas nos valores aceitos', () => {
    expect(prop(falso, 'tom').tipo).toBe("'calmo' | 'urgente'")
  })

  it('achata união multi-linha escrita direto na prop', () => {
    expect(prop(falso, 'estado').tipo).toBe("'novo' | 'antigo' | null")
  })

  it('preserva tipo genérico com objeto dentro', () => {
    expect(prop(falso, 'itens').tipo).toBe('Array<{ id: string; peso: number }>')
    expect(prop(falso, 'aoTrocar').tipo).toBe('(valor: string | null) => void')
  })

  it('lista só as props próprias e cita a herança numa linha', () => {
    expect(falso.props.map(p => p.nome)).toEqual([
      'titulo', 'tom', 'nivel', 'estado', 'itens', 'aoTrocar',
    ])
    expect(falso.heranca).toEqual(["Omit<HTMLAttributes<HTMLDivElement>, 'title'>"])
  })

  it('pega a descrição do componente sem arrastar o @example', () => {
    expect(falso.descricao).toBe('Falso — componente de mentira.')
  })

  it('não abre apelido que não é união de valores (ReactNode viraria 10 linhas)', () => {
    const api = extrair(`
      import { type ReactNode } from 'react'
      export interface XProps { icone?: ReactNode }
    `)
    expect(prop(api.X, 'icone').tipo).toBe('ReactNode')
  })

  it('mostra as duas variantes quando a união é do componente inteiro', () => {
    const api = extrair(`
      interface Base { children: ReactNode }
      export type XProps = Base & (
        | { tipo?: 'unico'; valor?: string }
        | { tipo: 'multiplo'; valor?: string[] }
      )
    `)
    expect(api.X.variantes).toBe(true)
    // A prop comum não se repete; a que muda de tipo entre as variantes aparece duas vezes.
    expect(api.X.props.filter(p => p.nome === 'children')).toHaveLength(1)
    expect(api.X.props.filter(p => p.nome === 'valor').map(p => p.tipo)).toEqual(['string', 'string[]'])
  })

  it('abre tipo derivado, que não tem união escrita para copiar', () => {
    // O padrão do Avatar: `(typeof TONS)[number]`. Não há união no arquivo para copiar,
    // então aqui o compilador é a única fonte possível — e é o caso em que ele deve mandar.
    const api = extrair(`
      const TONS = ['limao', 'uva'] as const
      export type Tom = (typeof TONS)[number]
      export interface XProps { tom?: Tom }
    `)
    expect(prop(api.X, 'tom').tipo).toBe("'limao' | 'uva'")
  })

  it('interface auxiliar exportada entra com o próprio nome', () => {
    const api = extrair(`
      export interface Delta { /** Variação. */ percent: number }
    `)
    expect(api.Delta.props.map(p => p.nome)).toEqual(['percent'])
  })
})

describe('extração dos componentes de verdade', () => {
  const api = extrairDoPacote()

  it('o Button sai com as props que estão no arquivo', () => {
    expect(api.Button.props.map(p => p.nome)).toEqual([
      'variant', 'size', 'block', 'loading', 'type', 'iconLeft', 'iconRight', 'children',
    ])
  })

  it('os padrões do Button vêm do JSDoc, não de um chute', () => {
    expect(prop(api.Button, 'variant').padrao).toBe("'secondary'")
    expect(prop(api.Button, 'size').padrao).toBe("'md'")
    expect(prop(api.Button, 'variant').tipo).toBe("'primary' | 'secondary' | 'ghost' | 'danger'")
  })

  it('pega os padrões booleanos — eles some(ia)m em silêncio', () => {
    // `loading`, `block` e `flush` tinham padrão no CÓDIGO (`loading = false` no
    // destructuring) e nada no JSDoc. A tabela escrita à mão dizia "false" e estava
    // certa; a gerada não tinha como saber. Foi este gerador que expôs a lacuna — e o
    // conserto foi no JSDoc, não aqui: quem tem que ficar completo é a fonte.
    expect(prop(api.Button, 'loading').padrao).toBe('false')
    expect(prop(api.Button, 'block').padrao).toBe('false')
    expect(prop(api.CardBody, 'flush').padrao).toBe('false')
  })

  it('enxerga o `type` do Button, que é herdado mas tem o padrão invertido', () => {
    // O caso mais escorregadio da referência gerada: `type` vem de
    // `ButtonHTMLAttributes`, e o componente inverte o padrão do HTML (`submit` →
    // `button`) no destructuring. Padrão aplicado a prop HERDADA é invisível para
    // qualquer doc gerada — a decisão mais importante do componente ficaria de fora.
    // A saída foi redeclarar `type` em `ButtonProps` só para a doc poder vê-lo.
    expect(prop(api.Button, 'type').padrao).toBe("'button'")
  })

  it('o CardFooter existe — componente sem interface própria SOME da referência', () => {
    // Ele era tipado direto com `HTMLAttributes<HTMLDivElement>` e simplesmente não
    // aparecia. Sumir em silêncio é pior que quebrar: parece que não existe.
    expect(api.CardFooter).toBeDefined()
  })

  it('preserva a ordem da união como o arquivo escreve', () => {
    // Regressão de verdade: o `typeToString` do compilador devolvia
    // 'danger' | 'brand' | 'success' | 'warning' | 'neutral' — ele ordena pela ordem em que
    // viu cada literal no programa, não pela do arquivo. A ordem é decisão de quem escreveu
    // (o padrão primeiro, o perigoso por último) e a doc não pode reescrevê-la.
    expect(prop(api.StatCard, 'tone').tipo).toBe(
      "'brand' | 'success' | 'warning' | 'danger' | 'neutral'",
    )
  })

  it('cobre a biblioteca inteira', () => {
    // Sentinela: se um dia a extração quebrar e devolver meia dúzia de componentes, o
    // teste cai aqui em vez de o site publicar uma referência silenciosamente furada.
    expect(Object.keys(api).length).toBeGreaterThan(25)
  })
})
