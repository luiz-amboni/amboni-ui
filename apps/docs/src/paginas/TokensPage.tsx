import { useEffect, useMemo, useState } from 'react'
import { Campo, EstadoVazio, Button } from '@amboni/ui'
import { contraste, WCAG } from '@amboni/tokens'
import { Titulo, Secao, P, H3, Aviso, Bloco, FacaNaoFaca } from '../lib/blocos'
import './TokensPage.css'

/**
 * O visualizador de tokens.
 *
 * ── A DECISÃO CENTRAL ───────────────────────────────────────────────────────────
 * Esta página não tem lista de tokens escrita à mão. Ela pergunta ao NAVEGADOR quais
 * variáveis `--amb-*` existem e quanto elas valem agora.
 *
 * Por quê: uma lista digitada apodrece no primeiro token novo. E o modo como ela apodrece
 * é o pior possível — a página continua bonita, continua carregando, e passa a mentir com
 * cara de autoridade. Ninguém percebe, porque documentação errada é indistinguível de
 * documentação certa até alguém confiar nela.
 *
 * Lendo do CSS computado, o pior caso vira "faltou um token na lista" em vez de "a lista
 * afirma um valor que não existe". E de brinde: a página reage sozinha ao seletor de
 * marca/tema do topo, sem saber que ele existe.
 *
 * É a mesma tese da página de Cores, que calcula o contraste em vez de repetir o número.
 */

// ── Descoberta ───────────────────────────────────────────────────────────────────

/**
 * Token é o que está num seletor GLOBAL: `:root`, ou os blocos de marca/tema.
 *
 * Existe `--amb-*` que não é token. Os componentes usam a mesma sintaxe para variável
 * interna — `--amb-selo-fundo` mora dentro de `.amb-selo--neutro`, `--amb-etiqueta-hover`
 * dentro de `.amb-etiqueta--marca`. São detalhe de implementação: ninguém escreve
 * `var(--amb-selo-fundo)` num produto, e trocar isso não é decisão de quem usa a
 * biblioteca.
 *
 * Sem este filtro a página listava 102 "tokens" em vez de 91 — e as onze linhas extras
 * eram `fundo`, `texto`, `borda`, `borda`, `fundo`… repetidas e sem sentido fora do
 * componente delas. Um contador errado numa página que existe para ser a autoridade sobre
 * os tokens é pior que não ter contador.
 *
 * O corte é pelo seletor, não por uma lista de nomes proibidos: é a diferença estrutural
 * de verdade (global = API pública; classe de componente = interno), então continua certa
 * quando alguém criar o próximo componente.
 */
function seletorGlobal(seletor: string): boolean {
  return seletor.split(',').some(parte => {
    const s = parte.trim()
    return s === ':root' || /^(\[data-amb-(brand|theme)="[^"]*"\])+$/.test(s)
  })
}

/**
 * `@media`/`@supports` são CSSGroupingRule: têm regras dentro. Sem recursão, os tokens
 * de duração declarados no bloco `prefers-reduced-motion` do tokens.css sumiriam da varredura.
 */
function nomesDaRegra(regra: CSSRule, saida: Set<string>) {
  const { selectorText, style } = regra as CSSStyleRule
  if (style && selectorText && seletorGlobal(selectorText)) {
    for (let i = 0; i < style.length; i++) {
      const prop = style.item(i)
      if (prop.startsWith('--amb-')) saida.add(prop)
    }
  }

  const filhas = (regra as CSSGroupingRule).cssRules
  if (filhas) for (let i = 0; i < filhas.length; i++) nomesDaRegra(filhas[i], saida)
}

/**
 * Varre as folhas de estilo atrás dos nomes.
 *
 * `sheet.cssRules` LANÇA SecurityError quando a folha veio de outra origem — o navegador
 * trata o conteúdo de um CSS de terceiro como dado privado. Acontece de verdade neste
 * site: o `index.html` carrega as fontes do Google, e essa folha é ilegível daqui.
 *
 * Por isso as bloqueadas viram uma NOTA DISCRETA com a origem de cada uma, e não um
 * alarme. Um alarme que aparece em todo carregamento por causa de um CSS de fonte — que
 * obviamente não declara token nosso — é o mesmo erro que esta página acusa duas seções
 * acima: quem grita sempre não é ouvido quando importa. A origem fica à vista para o
 * leitor julgar sozinho; o alarme fica reservado para quando a lista sai vazia.
 */
function descobrirNomes(): { nomes: string[]; bloqueadas: string[] } {
  const nomes = new Set<string>()
  const bloqueadas: string[] = []

  for (const folha of Array.from(document.styleSheets)) {
    let regras: CSSRuleList | null = null
    try {
      regras = folha.cssRules
    } catch {
      // O href continua legível mesmo quando o conteúdo não é — é o que permite dizer
      // QUAL folha ficou de fora em vez de só quantas.
      bloqueadas.push(folha.href ? new URL(folha.href).host : 'folha sem origem')
      continue
    }
    if (!regras) continue
    for (let i = 0; i < regras.length; i++) nomesDaRegra(regras[i], nomes)
  }

  return { nomes: [...nomes].sort(), bloqueadas: [...new Set(bloqueadas)] }
}

// ── Cor: resolver e medir ────────────────────────────────────────────────────────

interface RGBA { r: number; g: number; b: number; a: number }

/** `rgb(1 2 3 / 50%)`, `rgba(1,2,3,.5)` e `color(srgb .1 .2 .3 / .5)` — as formas que o
 *  getComputedStyle devolve. Devolve null em vez de lançar: valor de cor que este parser
 *  não conhece é motivo para a página omitir o número, nunca para ela quebrar. */
function lerCor(css: string): RGBA | null {
  const num = (s: string, escala: number) =>
    s.endsWith('%') ? (parseFloat(s) / 100) * escala : parseFloat(s)

  const rgb = css.match(/^rgba?\(([^)]+)\)$/)
  if (rgb) {
    const p = rgb[1].split(/[\s,/]+/).filter(Boolean)
    if (p.length < 3) return null
    const [r, g, b] = p.slice(0, 3).map(v => num(v, 255))
    const a = p[3] === undefined ? 1 : num(p[3], 1)
    return [r, g, b, a].some(Number.isNaN) ? null : { r, g, b, a }
  }

  const srgb = css.match(/^color\(srgb\s+([^)]+)\)$/)
  if (srgb) {
    const p = srgb[1].split(/[\s,/]+/).filter(Boolean)
    if (p.length < 3) return null
    const [r, g, b] = p.slice(0, 3).map(v => num(v, 1) * 255)
    const a = p[3] === undefined ? 1 : num(p[3], 1)
    return [r, g, b, a].some(Number.isNaN) ? null : { r, g, b, a }
  }

  return null
}

const paraHex = ({ r, g, b }: RGBA) =>
  '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

/**
 * Usa o navegador como parser de cor em vez de reimplementar `color-mix`, `oklch` e a
 * lista de cores nomeadas do CSS. Quem já sabe resolver qualquer cor válida é ele.
 */
function resolverCor(sonda: HTMLElement, valor: string): RGBA | null {
  sonda.style.color = ''
  sonda.style.color = valor
  if (!sonda.style.color) return null // o navegador recusou: não é cor
  return lerCor(getComputedStyle(sonda).color)
}

/** Achata a transparência contra o fundo. Um token translúcido não TEM contraste próprio
 *  — ele só ganha um quando se sabe o que está atrás. Compor aqui é o que torna o número
 *  do `*-subtle` do tema escuro verdadeiro em vez de teórico. */
function compor(frente: RGBA, fundo: RGBA): RGBA {
  const m = (f: number, t: number) => f * frente.a + t * (1 - frente.a)
  return { r: m(frente.r, fundo.r), g: m(frente.g, fundo.g), b: m(frente.b, fundo.b), a: 1 }
}

type Papel = 'texto' | 'interface' | 'borda' | 'fundo'

/**
 * Contra qual fundo medir cada token, e o que cobrar dele.
 *
 * Espelha os pares que `packages/tokens/src/tokens.test.ts` trava no CI — texto sobre
 * `surface`, e `text-onBrand` sobre `brand-solid`. A página tinha que concordar com o
 * teste: se ela inventasse pares próprios, passaria a existir uma segunda opinião sobre
 * o que é legível, e duas fontes de verdade divergem sempre.
 *
 * Medir TUDO contra `surface` e reprovar quem não chega a 4,5 seria fácil e estaria
 * errado: `brand-solid` é fundo de botão, não texto. Marcá-lo de vermelho ensina a pessoa
 * a ignorar o vermelho — e aí o aviso que importa também passa batido.
 */
function papelDoToken(nome: string): { papel: Papel; fundo: string; minimo: number } {
  const sobre = (fundo: string, papel: Papel, minimo: number) => ({ papel, fundo, minimo })

  // O par do botão primário: este texto nunca encosta no fundo do card.
  if (nome === '--amb-color-text-onBrand') return sobre('--amb-color-brand-solid', 'texto', WCAG.AA_TEXTO)

  // Anel de foco é componente de interface, não texto: a norma pede 3:1, não 4,5:1.
  if (nome === '--amb-color-border-focus') return sobre('--amb-color-surface', 'interface', WCAG.AA_NAO_TEXTO)

  if (/^--amb-color-(text-|[a-z]+-text$)/.test(nome)) return sobre('--amb-color-surface', 'texto', WCAG.AA_TEXTO)
  if (/border/.test(nome)) return sobre('--amb-color-surface', 'borda', WCAG.AA_NAO_TEXTO)

  return sobre('--amb-color-surface', 'fundo', WCAG.AA_TEXTO)
}

// ── Famílias ─────────────────────────────────────────────────────────────────────

type Amostra = 'cor' | 'espaco' | 'raio' | 'altura' | 'fonte' | 'texto' | 'peso' | 'leading' | 'sombra' | 'duracao' | 'easing' | 'camada'

interface Familia {
  chave: string
  rotulo: string
  amostra: Amostra
  ajuda: string
}

/** A ordem é a da página, e é deliberada: cor primeiro porque é o que se procura. */
const FAMILIAS: Familia[] = [
  { chave: 'color', rotulo: 'Cor', amostra: 'cor', ajuda: 'O papel da cor, não o pigmento. Trocar a marca no topo troca o valor; o nome não muda.' },
  { chave: 'espaco', rotulo: 'Espaço', amostra: 'espaco', ajuda: 'Distância. A escala existe para a tela ter ritmo em vez de dezessete margens parecidas.' },
  { chave: 'raio', rotulo: 'Raio', amostra: 'raio', ajuda: 'Arredondamento. Misturar raios na mesma tela é o que faz um layout parecer remendado.' },
  { chave: 'altura', rotulo: 'Altura', amostra: 'altura', ajuda: 'Altura dos controles. É o que alinha campo, botão e seleção na mesma linha.' },
  { chave: 'fonte', rotulo: 'Fonte', amostra: 'fonte', ajuda: 'As famílias. Cada uma termina em fontes do sistema — se a web font não carregar, o texto continua.' },
  { chave: 'texto', rotulo: 'Texto', amostra: 'texto', ajuda: 'Tamanho. Poucos degraus, bem separados: escala com meio-tom vira decisão sem critério.' },
  { chave: 'peso', rotulo: 'Peso', amostra: 'peso', ajuda: 'Espessura. Hierarquia por peso funciona onde cor não chega — impressão, daltonismo, tela ruim.' },
  { chave: 'leading', rotulo: 'Leading', amostra: 'leading', ajuda: 'Altura da linha. Texto longo pede mais; título pede menos.' },
  { chave: 'shadow', rotulo: 'Sombra', amostra: 'sombra', ajuda: 'Elevação. A sombra diz a que distância da página a coisa está.' },
  { chave: 'duracao', rotulo: 'Duração', amostra: 'duracao', ajuda: 'Quanto tempo o movimento leva. Zeram sozinhas em prefers-reduced-motion.' },
  { chave: 'easing', rotulo: 'Easing', amostra: 'easing', ajuda: 'A curva do movimento. É o que separa animação de coisa escorregando.' },
  { chave: 'camada', rotulo: 'Camada', amostra: 'camada', ajuda: 'z-index nomeado. Sem isto, o número vira leilão: 999, 9999, 99999.' },
]

const familiaDe = (nome: string) => nome.replace('--amb-', '').split('-')[0]
const curto = (nome: string) => nome.replace(`--amb-${familiaDe(nome)}-`, '')

/** `0.25rem` → 0.25, `80ms` → 80, `.14s` → 140, `400` → 400. Null quando não é medida
 *  (hex, cubic-bezier, lista de fontes). */
function medida(valor: string): number | null {
  const m = valor.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))(px|rem|em|ms|s)?$/)
  if (!m) return null
  const n = parseFloat(m[1])
  if (Number.isNaN(n)) return null
  return m[2] === 's' ? n * 1000 : n // segundo e milissegundo na mesma régua
}

/** A ordem das camisetas, para quem não tem número: sombra `sm md lg xl`. */
const TSHIRT = ['none', 'xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', 'full']

/**
 * Ordena pelo VALOR, não pelo nome.
 *
 * Por ordem alfabética a escala de espaço saía `0 1 10 12 16 2 20 24 3…` — treze barras
 * em zigue-zague. Uma escala que não lê em ordem deixa de ser escala: a pessoa vem aqui
 * justamente para ver o degrau entre um token e o próximo, e o alfabeto embaralha
 * exatamente essa informação.
 *
 * A régua sai do próprio valor, então um token novo entra no lugar certo sozinho — pela
 * mesma razão que os nomes não são digitados à mão.
 */
function ordenar(a: Token, b: Token): number {
  const [ma, mb] = [medida(a.valor), medida(b.valor)]
  if (ma !== null && mb !== null && ma !== mb) return ma - mb

  const [ta, tb] = [TSHIRT.indexOf(curto(a.nome)), TSHIRT.indexOf(curto(b.nome))]
  if (ta !== -1 && tb !== -1 && ta !== tb) return ta - tb

  return a.nome.localeCompare(b.nome, 'pt')
}

// ── Leitura ──────────────────────────────────────────────────────────────────────

interface Token {
  nome: string
  valor: string
  /** Só para família `color`: o contraste medido contra o fundo do papel dele. */
  cor?: {
    hex: string
    razao: number
    papel: Papel
    minimo: number
    fundo: string
    translucido: boolean
  }
}

function lerTokens(nomes: string[]): Token[] {
  const raiz = getComputedStyle(document.documentElement)
  const valor = (n: string) => raiz.getPropertyValue(n).trim()

  // Uma sonda só para a página inteira. `position: fixed` + tamanho zero mantém ela fora
  // do fluxo; ela nunca chega a pintar nada.
  const sonda = document.createElement('span')
  sonda.style.cssText = 'position:fixed;width:0;height:0;pointer-events:none;opacity:0'
  document.body.appendChild(sonda)

  try {
    return nomes.map(nome => {
      const bruto = valor(nome)
      if (familiaDe(nome) !== 'color') return { nome, valor: bruto }

      const { papel, fundo, minimo } = papelDoToken(nome)
      const frente = resolverCor(sonda, bruto)
      const atras = resolverCor(sonda, valor(fundo))
      if (!frente || !atras) return { nome, valor: bruto }

      const composta = compor(frente, atras)
      const hexFundo = paraHex(atras)
      return {
        nome,
        valor: bruto,
        cor: {
          hex: paraHex(composta),
          // A MESMA função que roda no CI. Não é uma segunda implementação "pra tela".
          razao: contraste(paraHex(composta), hexFundo),
          papel,
          minimo,
          fundo,
          translucido: frente.a < 1,
        },
      }
    })
  } finally {
    sonda.remove()
  }
}

/**
 * O App escreve `data-amb-brand`/`data-amb-theme` no <html> num efeito próprio. Efeito de
 * filho roda ANTES do efeito do pai: se esta página lesse o CSS computado no próprio
 * render, pegaria o tema anterior e mostraria o valor errado por um frame — ou para
 * sempre, já que nada a mandaria ler de novo.
 *
 * Por isso o observador: ele dispara depois do atributo mudar de verdade.
 *
 * O App.tsx conta que a primeira versão dele travava a aba — um MutationObserver que
 * ESCREVIA o atributo que observava. Este aqui só lê. Sem escrita, sem laço.
 */
function useTemaAtual(): number {
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const obs = new MutationObserver(() => setVersao(v => v + 1))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-amb-brand', 'data-amb-theme'],
    })
    return () => obs.disconnect()
  }, [])

  return versao
}

// ── Amostras ─────────────────────────────────────────────────────────────────────

function Amostra({ token, familia }: { token: Token; familia: Amostra }) {
  const v = token.valor

  switch (familia) {
    case 'cor':
      return <span className="tok-am tok-am--cor" style={{ background: v }} />
    case 'espaco':
      return (
        <span className="tok-am tok-am--medida">
          <span className="tok-barra" style={{ width: v === '0' ? '1px' : v }} />
        </span>
      )
    case 'raio':
      return <span className="tok-am tok-am--raio" style={{ borderRadius: v }} />
    case 'altura':
      return (
        <span className="tok-am tok-am--medida">
          <span className="tok-caixa-altura" style={{ height: v }} />
        </span>
      )
    case 'sombra':
      return (
        <span className="tok-am tok-am--medida">
          <span className="tok-sombra" style={{ boxShadow: v }} />
        </span>
      )
    case 'fonte':
      return <span className="tok-am tok-am--tipo" style={{ fontFamily: v }}>Ag</span>
    case 'texto':
      return <span className="tok-am tok-am--tipo" style={{ fontSize: v, lineHeight: 1 }}>Ag</span>
    case 'peso':
      return <span className="tok-am tok-am--tipo" style={{ fontWeight: v }}>Ag</span>
    case 'leading':
      return (
        <span className="tok-am tok-am--leading" style={{ lineHeight: v }}>
          uma linha
          <br />
          outra linha
        </span>
      )
    case 'duracao':
      // Animação real, na duração real: ler "300ms" não dá noção de nada; ver dois
      // tokens correndo lado a lado, sim.
      return (
        <span className="tok-am tok-am--medida">
          <span className="tok-corrida" style={{ animationDuration: v }} />
        </span>
      )
    case 'easing':
      return (
        <span className="tok-am tok-am--medida">
          <span className="tok-corrida" style={{ animationTimingFunction: v, animationDuration: '900ms' }} />
        </span>
      )
    case 'camada':
      return <span className="tok-am tok-am--camada">{v}</span>
  }
}

// ── Linha ────────────────────────────────────────────────────────────────────────

const ROTULO_PAPEL: Record<Papel, string> = {
  texto: 'texto',
  interface: 'interface',
  borda: 'borda',
  fundo: 'fundo',
}

function Linha({ token, familia, copiado, aoCopiar }: {
  token: Token
  familia: Amostra
  copiado: boolean
  aoCopiar: (nome: string) => void
}) {
  const { cor } = token
  const reprova = cor ? cor.razao < cor.minimo : false
  // Só é falha de verdade quando o token FOI FEITO para o papel que ele não cumpre.
  const falha = reprova && (cor?.papel === 'texto' || cor?.papel === 'interface')
  // Informativo, não acusação: um fundo com 1,2:1 está certo — só não serve para escrever.
  const fracoParaTexto = Boolean(cor) && cor!.razao < WCAG.AA_TEXTO && !falha

  return (
    <button
      type="button"
      className="tok-linha"
      onClick={() => aoCopiar(token.nome)}
      aria-label={`Copiar var(${token.nome})`}
    >
      <span className="tok-linha__am">
        <Amostra token={token} familia={familia} />
      </span>

      <span className="tok-linha__txt">
        <code className="tok-nome">{curto(token.nome)}</code>
        <span className="tok-valor">{token.valor}</span>
      </span>

      {cor && (
        <span className="tok-linha__wcag">
          <span className={`tok-razao${falha ? ' tok-razao--falha' : ''}`}>
            {cor.razao.toFixed(2)}:1
          </span>
          <span className="tok-papel">{ROTULO_PAPEL[cor.papel]}</span>
          {falha && <span className="tok-flag tok-flag--falha">reprova AA</span>}
          {fracoParaTexto && <span className="tok-flag">não use para texto</span>}
        </span>
      )}

      <span className={`tok-copia${copiado ? ' tok-copia--on' : ''}`}>
        {copiado ? '✓ copiado' : 'copiar'}
      </span>
    </button>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────────

export default function TokensPage() {
  const versaoTema = useTemaAtual()
  const [busca, setBusca] = useState('')
  const [copiado, setCopiado] = useState<string | null>(null)

  // Os NOMES não mudam com o tema — só os valores. Varrer as folhas de estilo a cada
  // troca de marca seria trabalho jogado fora.
  const [{ nomes, bloqueadas }, setDescoberta] = useState<{ nomes: string[]; bloqueadas: string[] }>(
    { nomes: [], bloqueadas: [] },
  )
  useEffect(() => setDescoberta(descobrirNomes()), [])

  const tokens = useMemo(
    () => (nomes.length ? lerTokens(nomes) : []),
    // versaoTema entra de propósito: é o gatilho para reler os valores no tema novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nomes, versaoTema],
  )

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? tokens.filter(t => t.nome.toLowerCase().includes(q)) : tokens
  }, [tokens, busca])

  async function copiar(nome: string) {
    // `var(--amb-x)`, não `--amb-x`: o que se cola no CSS é a chamada inteira. Copiar só
    // o nome obriga a pessoa a digitar a casca toda vez — e é onde nasce o typo.
    const texto = `var(${nome})`
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(nome)
      setTimeout(() => setCopiado(c => (c === nome ? null : c)), 1500)
    } catch {
      // clipboard exige HTTPS e permissão. O valor está na tela e dá para selecionar à
      // mão; derrubar a página por causa disso, não.
    }
  }

  // `.filter()` já devolve array novo — o sort não mexe na lista original.
  const porFamilia = FAMILIAS.map(f => ({
    familia: f,
    itens: filtrados.filter(t => familiaDe(t.nome) === f.chave).sort(ordenar),
  })).filter(g => g.itens.length > 0)

  // Um token de família desconhecida é token novo que esta página ainda não sabe
  // desenhar. Mostrar é melhor que sumir: some do site e ninguém nunca fica sabendo.
  const orfaos = filtrados.filter(t => !FAMILIAS.some(f => f.chave === familiaDe(t.nome))).sort(ordenar)

  const total = tokens.length
  const filtrando = busca.trim().length > 0

  return (
    <>
      <Titulo
        eyebrow="Fundamentos"
        lead="Todo token da biblioteca, com o valor que ele tem agora, na marca e no tema que estão ligados aí em cima."
      >
        Tokens
      </Titulo>

      <Secao titulo="Por que existe um nome no lugar do valor">
        <P>
          O valor cru responde <em>qual cor é</em>. O token responde <em>para que serve</em>.
          São perguntas diferentes, e só a segunda sobrevive a uma troca de tema.
        </P>
        <P>
          <code>#0c86a0</code> não diz nada. <code>--amb-color-brand-solid</code> diz: é a
          marca, cheia, para fundo de botão. Quando o tema escuro entra, esse mesmo nome vale
          outra coisa — e nenhum componente precisou saber.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Pedir pelo papel',
            texto: 'background: var(--amb-color-brand-solid). Funciona em iSafe e VEAR, claro e escuro, sem uma linha a mais.',
          }}
          naoFaca={{
            titulo: 'Copiar o valor que apareceu na tela',
            texto: 'background: #0c86a0 congela o tema claro da iSafe dentro do componente. No escuro ele fica lá, errado, e ninguém lembra por quê.',
          }}
        />
        <Aviso>
          <strong>Os valores desta página são lidos do CSS, não digitados.</strong> A página
          pergunta ao navegador quais variáveis <code>--amb-*</code> existem e quanto valem.
          Um token novo aparece aqui sozinho — e nenhum valor daqui pode divergir do que está
          na tela, porque é o mesmo lugar.
        </Aviso>
      </Secao>

      <Secao titulo="O contraste é medido aqui, agora">
        <P>
          Cada token de cor é medido contra o fundo em que ele realmente vive, com a mesma
          função <code>contraste()</code> que roda no CI — texto sobre{' '}
          <code>surface</code>, e <code>text-onBrand</code> sobre <code>brand-solid</code>,
          que são os pares que o teste da biblioteca trava.
        </P>
        <P>
          Um token de fundo com 1,2:1 não está errado: ele é fundo. Por isso a página só
          reprova quem falha <strong>no próprio papel</strong> — texto que não chega a{' '}
          {WCAG.AA_TEXTO}:1, ou anel de foco abaixo de {WCAG.AA_NAO_TEXTO}:1. O resto ganha
          um aviso discreto de “não use para texto”, que é informação, não acusação.
        </P>
        <Aviso tipo="warn">
          Marcar tudo de vermelho é o mesmo que não marcar nada. Quem vê a página inteira
          gritando aprende a rolar por cima do vermelho — e aí o aviso que importava passa
          batido junto.
        </Aviso>
      </Secao>

      <Secao titulo="Todos os tokens">
        <div className="tok-barra-topo">
          <div className="tok-busca">
            <Campo
              size="md"
              placeholder="Buscar token — brand, espaco, sombra…"
              value={busca}
              limpar
              onChange={e => setBusca(e.currentTarget.value)}
              iconeEsq={
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9.2 9.2 L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
              aria-label="Buscar token pelo nome"
            />
          </div>
          <div className="tok-contador" aria-live="polite">
            {filtrando ? <><strong>{filtrados.length}</strong> de {total} tokens</> : <><strong>{total}</strong> tokens</>}
          </div>
        </div>

        {total === 0 && (
          <Aviso tipo="warn">
            Nenhuma variável <code>--amb-*</code> foi encontrada nas folhas de estilo legíveis.
            Ou o <code>tokens.css</code> não foi importado, ou este navegador não expõe custom
            properties em <code>CSSStyleDeclaration</code>
            {bloqueadas.length > 0 && <>, ou os tokens vivem numa das folhas bloqueadas ({bloqueadas.join(', ')})</>}.
            A página prefere dizer isso a mostrar uma lista inventada.
          </Aviso>
        )}

        {filtrados.length === 0 && total > 0 ? (
          <div className="tok-vazio">
            <EstadoVazio
              titulo={`Nenhum token com “${busca.trim()}” no nome`}
              descricao="A busca olha só o nome do token. Tente um pedaço menor — “brand”, “text”, “raio” — ou veja a lista inteira."
              acao={<Button onClick={() => setBusca('')}>Limpar busca</Button>}
            />
          </div>
        ) : (
          <>
            {porFamilia.map(({ familia, itens }) => (
              <div className="tok-grupo" key={familia.chave}>
                {/* A contagem fica FORA do H3 de propósito: o H3 do site gera a âncora a
                    partir do texto do título, e um número lá dentro faria o id virar
                    "cor-31" — trocando a cada tecla digitada na busca. Link de seção que
                    muda sozinho não é link. */}
                <H3>{familia.rotulo}</H3>
                <p className="tok-grupo__ajuda">
                  <span className="tok-grupo__n">{itens.length}</span>
                  {familia.ajuda}
                </p>
                {/* A família na classe: é o que deixa o CSS dar à amostra a caixa do
                    tamanho da medida que ela mostra. Ver TokensPage.css. */}
                <div className={`tok-lista tok-lista--${familia.chave}`}>
                  {itens.map(t => (
                    <Linha
                      key={t.nome}
                      token={t}
                      familia={familia.amostra}
                      copiado={copiado === t.nome}
                      aoCopiar={copiar}
                    />
                  ))}
                </div>
              </div>
            ))}

            {orfaos.length > 0 && (
              <div className="tok-grupo">
                <H3>Sem família</H3>
                <p className="tok-grupo__ajuda">
                  <span className="tok-grupo__n">{orfaos.length}</span>
                  Existem no CSS mas esta página ainda não sabe desenhar uma amostra para eles.
                  Aparecem assim mesmo — token escondido é token que ninguém corrige.
                </p>
                <div className="tok-lista">
                  {orfaos.map(t => (
                    <Linha key={t.nome} token={t} familia="camada" copiado={copiado === t.nome} aoCopiar={copiar} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {total > 0 && (
          <p className="tok-rodape">
            A lista sai dos seletores globais — <code>:root</code> e os blocos de marca e tema.
            Componente também declara <code>--amb-*</code> por dentro (<code>--amb-selo-fundo</code>{' '}
            vive em <code>.amb-selo--neutro</code>), e isso fica de fora de propósito: é
            implementação, não API. Ninguém escreve <code>var(--amb-selo-fundo)</code> num produto.
            {bloqueadas.length > 0 && (
              <>
                {' '}A varredura também não lê {bloqueadas.join(', ')} — CSS de outra origem é
                privado para o navegador. São as fontes, e não declaram token nenhum; mas se um
                dia declararem, os {total} acima deixam de ser a lista inteira.
              </>
            )}
          </p>
        )}
      </Secao>

      <Secao titulo="Como usar">
        <P>Clicar em qualquer linha copia a chamada pronta para colar no CSS.</P>
        <Bloco lang="css">{`.meu-card {
  background: var(--amb-color-surface);
  border: 1px solid var(--amb-color-border-default);
  border-radius: var(--amb-raio-lg);
  padding: var(--amb-espaco-4);
  box-shadow: var(--amb-shadow-sm);
}`}</Bloco>
        <P>
          Nenhum valor acima está escrito nesse trecho. É por isso que ele funciona nas duas
          marcas e nos dois temas sem variação.
        </P>
      </Secao>
    </>
  )
}
