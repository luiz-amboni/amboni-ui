import { useState, type ReactNode } from 'react'
import { Button, Caixa, Campo, CampoForm, Selecao } from '@amboni/ui'
import { Bloco } from './blocos'
import './Playground.css'

/**
 * Playground — mexer nas props e ver o código junto.
 *
 * A documentação escrita ensina o que a prop faz; isto ensina o que a API PARECE. São
 * coisas diferentes: dá para ler a página inteira do Button e ainda escrever
 * `<Button variant="secondary" size="md" loading={false}>`, porque nada nunca mostrou
 * como o código fica quando você não pede nada.
 *
 * É por isso que a geração de código omite o que está no padrão (ver `gerarCodigo`).
 * Um playground que imprime todas as props é um gerador de ruído com aparência de
 * exemplo — ele ensina exatamente o hábito que a biblioteca tenta evitar.
 *
 * Os controles são componentes da PRÓPRIA biblioteca, de propósito. Dogfooding: se
 * ajustar um Selecao aqui for desconfortável, o problema é do Selecao, e este é o
 * primeiro lugar onde isso aparece.
 */

export type ValorControle = string | number | boolean

interface ControleBase {
  /** O nome da prop — é ele que sai no código gerado. */
  prop: string
  /** Rótulo do controle, se o nome da prop não bastar. @default a própria prop */
  rotulo?: string
  /**
   * A prop é **obrigatória** no componente: sai no código sempre, mesmo parada no valor
   * inicial. Sem isto, o `label` e o `value` do StatCard — que não têm padrão porque quem
   * chama é obrigado a passá-los — sumiriam do código, e a página do design system
   * publicaria um `<StatCard />` que nem compila.
   */
  sempre?: boolean
}

export interface ControleSelect extends ControleBase {
  tipo: 'select'
  opcoes: readonly string[]
  padrao: string
}
export interface ControleBool extends ControleBase {
  tipo: 'bool'
  padrao: boolean
}
export interface ControleTexto extends ControleBase {
  tipo: 'texto'
  padrao: string
  placeholder?: string
}
export interface ControleNumero extends ControleBase {
  tipo: 'numero'
  padrao: number
  min?: number
  max?: number
  passo?: number
}

export type Controle = ControleSelect | ControleBool | ControleTexto | ControleNumero

/** O tipo do valor que cada controle produz. Um `select` vale a UNIÃO das suas opções. */
type ValorDe<C> = C extends { tipo: 'select'; opcoes: readonly (infer O)[] }
  ? O
  : C extends { tipo: 'bool' }
    ? boolean
    : C extends { tipo: 'texto' }
      ? string
      : C extends { tipo: 'numero' }
        ? number
        : never

/**
 * A lista de controles vira o tipo do objeto que o `render` recebe.
 *
 * É isto que faz `render={(p) => <Button {...p} />}` ser conferido de verdade: `p.variant`
 * chega como `'primary' | 'secondary' | 'ghost' | 'danger'`, não como `string`. Se alguém
 * escrever uma opção que o Button não aceita, o erro é aqui, na página — que é onde a
 * documentação mente antes de qualquer outro lugar.
 */
export type ValoresDe<C extends readonly Controle[]> = {
  [K in C[number] as K['prop']]: ValorDe<K>
}

/* ══════════════════════════════════════════════════════════════════════════════
 * Geração de código — lógica pura, testada em Playground.test.tsx
 * ════════════════════════════════════════════════════════════════════════════ */

/** Acima disto a linha quebra em uma prop por linha. É a largura de um bloco confortável. */
const LARGURA_MAX = 60

/** `children` é o único que vira filho em vez de atributo — e o único isento do padrão. */
const FILHO = 'children'

/** Aspa simples como literal JS: é a forma que sobrevive a aspas duplas no conteúdo. */
function literalJs(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
}

function comoAtributo(c: Controle, v: ValorControle): string {
  // Booleano `true` sai na forma curta porque é assim que se escreve JSX à mão. Sair como
  // `loading={true}` ensinaria a forma que ninguém usa — e o playground é um exemplo.
  if (c.tipo === 'bool') return v ? c.prop : `${c.prop}={false}`
  if (c.tipo === 'numero') return `${c.prop}={${v}}`

  const s = String(v)
  // Aspas duplas no valor terminariam o atributo no meio e gerariam código que não compila.
  // `<` e `{` são inofensivos aqui: dentro de aspas, o JSX não os interpreta.
  return s.includes('"') ? `${c.prop}={${literalJs(s)}}` : `${c.prop}="${s}"`
}

function comoFilho(s: string): string {
  // `<` e `{` soltos no texto de um filho SÃO sintaxe para o JSX — `<Button>a < b</Button>`
  // não compila. Nesses casos o texto vira expressão.
  return /[<>{}]/.test(s) ? `{${literalJs(s)}}` : s
}

/**
 * Monta o JSX que corresponde aos valores atuais.
 *
 * **Prop no valor padrão não aparece.** É a regra inteira do componente. Ninguém escreve
 * `<Button variant="secondary" size="md" loading={false}>Salvar</Button>` — escreve
 * `<Button>Salvar</Button>`. Mostrar o primeiro seria documentar um hábito ruim com a
 * autoridade do site oficial. O que sobra na tela é exatamente o que você pediu, e é aí
 * que a pessoa aprende quais são os padrões: pelo que NÃO precisou escrever.
 */
export function gerarCodigo(
  componente: string,
  controles: readonly Controle[],
  valores: Record<string, ValorControle>,
): string {
  const atributos = controles
    .filter(c => c.prop !== FILHO)
    .filter(c => c.sempre || (valores[c.prop] ?? c.padrao) !== c.padrao)
    .map(c => comoAtributo(c, valores[c.prop] ?? c.padrao))

  // `children` foge da regra do padrão: ele é o texto visível do componente. Omiti-lo por
  // "estar no padrão" geraria `<Button />`, que não é o que está na tela ao lado.
  const temFilho = controles.some(c => c.prop === FILHO)
  const texto = temFilho ? String(valores[FILHO] ?? '') : ''
  const filho = texto.trim() ? comoFilho(texto) : ''

  const abertura = atributos.length ? `<${componente} ${atributos.join(' ')}` : `<${componente}`
  const umaLinha = filho ? `${abertura}>${filho}</${componente}>` : `${abertura} />`

  // Sem atributos não há o que quebrar: um filho longo em uma linha só continua legível,
  // e quebrar `<Selo>` em três linhas por causa do texto seria pior que a linha comprida.
  if (umaLinha.length <= LARGURA_MAX || atributos.length === 0) return umaLinha

  const linhas = [`<${componente}`, ...atributos.map(a => `  ${a}`)]
  return filho
    ? [...linhas, '>', `  ${filho}`, `</${componente}>`].join('\n')
    : [...linhas, '/>'].join('\n')
}

/* ══════════════════════════════════════════════════════════════════════════════
 * A UI
 * ════════════════════════════════════════════════════════════════════════════ */

function padroes(controles: readonly Controle[]): Record<string, ValorControle> {
  return Object.fromEntries(controles.map(c => [c.prop, c.padrao]))
}

function UmControle({
  controle,
  valor,
  aoMudar,
}: {
  controle: Controle
  valor: ValorControle
  aoMudar: (v: ValorControle) => void
}) {
  // O rótulo é o nome da prop em monoespaçada: o controle e a linha do código gerado
  // dizem a mesma palavra, e o olho liga os dois sem legenda.
  const rotulo = <code className="doc-pg__prop">{controle.rotulo ?? controle.prop}</code>

  switch (controle.tipo) {
    case 'select':
      return (
        <CampoForm label={rotulo}>
          <Selecao
            size="sm"
            opcoes={controle.opcoes.map(o => ({ valor: o, rotulo: o }))}
            valor={String(valor)}
            onChange={aoMudar}
          />
        </CampoForm>
      )

    case 'bool':
      // Sem CampoForm: a Caixa já traz o próprio <label> ligado ao input. Envolvê-la daria
      // dois rótulos para o mesmo controle — o leitor de tela leria o nome duas vezes.
      return (
        <div className="doc-pg__caixa">
          <Caixa
            label={rotulo}
            checked={Boolean(valor)}
            onChange={e => aoMudar(e.currentTarget.checked)}
          />
        </div>
      )

    case 'numero':
      return (
        <CampoForm label={rotulo}>
          <Campo
            size="sm"
            type="number"
            value={String(valor)}
            min={controle.min}
            max={controle.max}
            step={controle.passo}
            onChange={e => aoMudar(e.currentTarget.valueAsNumber)}
          />
        </CampoForm>
      )

    case 'texto':
      return (
        <CampoForm label={rotulo}>
          <Campo
            size="sm"
            value={String(valor)}
            placeholder={controle.placeholder}
            onChange={e => aoMudar(e.currentTarget.value)}
          />
        </CampoForm>
      )
  }
}

export interface PlaygroundProps<C extends readonly Controle[]> {
  /** O nome que sai na tag do código gerado. */
  componente: string
  controles: C
  render: (valores: ValoresDe<C>) => ReactNode
  /** Igual ao `<Demo>`: `centro` para uma peça só, `grid` para cards. @default 'padrao' */
  variante?: 'padrao' | 'plain' | 'centro' | 'grid'
}

/**
 * `<const C>` é o que faz a tipagem funcionar sem ninguém anotar nada na página: sem ele,
 * `opcoes: ['primary', …]` chegaria aqui como `string[]` e `render` receberia `variant:
 * string` — que o Button recusa. Com ele, as opções continuam literais e o `render` é
 * conferido contra as props de verdade do componente.
 */
export function Playground<const C extends readonly Controle[]>({
  componente,
  controles,
  render,
  variante = 'padrao',
}: PlaygroundProps<C>) {
  const [valores, setValores] = useState<Record<string, ValorControle>>(() => padroes(controles))

  const noPadrao = controles.every(c => valores[c.prop] === c.padrao)
  const mod = variante === 'padrao' ? '' : ` doc-demo__stage--${variante}`

  return (
    <div className="doc-demo doc-pg">
      <div className={`doc-demo__stage${mod}`}>
        {/* A ponte entre o estado (um mapa de prop → valor, que é o que dá para guardar) e
            o tipo derivado dos controles. É o único ponto onde os dois se encontram, e é
            aqui que a asserção fica presa em vez de vazar para cada página. */}
        {render(valores as ValoresDe<C>)}
      </div>

      <div className="doc-pg__controles">
        {controles.map(c => (
          <UmControle
            key={c.prop}
            controle={c}
            valor={valores[c.prop]}
            aoMudar={v => setValores(atual => ({ ...atual, [c.prop]: v }))}
          />
        ))}

        <div className="doc-pg__acoes">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setValores(padroes(controles))}
            // Desabilitado quando já está no padrão porque não há nada para restaurar — e
            // o botão apagado é, ele mesmo, a resposta para "o que é o padrão?": é isto aqui.
            disabled={noPadrao}
          >
            Restaurar padrões
          </Button>
        </div>
      </div>

      {/* O <Bloco> já resolve realce e o botão de copiar. Reescrever os dois aqui seria a
          segunda versão do mesmo bloco de código no site que prega o contrário. */}
      <Bloco lang="jsx">{gerarCodigo(componente, controles, valores)}</Bloco>
    </div>
  )
}
