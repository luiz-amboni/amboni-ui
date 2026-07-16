import {
  createContext,
  useContext,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './Abas.css'

export type VarianteAbas = 'linha' | 'pilula'

interface CtxAbas {
  valor: string
  onChange: (valor: string) => void
  variante: VarianteAbas
  baseId: string
}

const Ctx = createContext<CtxAbas | null>(null)

function useCtx(quem: string): CtxAbas {
  const ctx = useContext(Ctx)
  // Erro explícito em vez de `undefined` silencioso: fora do <Abas> o componente
  // renderizaria sem aria-controls e sem teclado — quebrado, mas parecendo certo.
  if (!ctx) throw new Error(`[@amboni/ui] <${quem}> só funciona dentro de <Abas>.`)
  return ctx
}

/**
 * `aria-controls` e `aria-labelledby` são IDREF: o navegador separa os IDs por ESPAÇO.
 * Um valor com espaço ("meus pedidos") viraria duas referências quebradas e a ligação
 * aba↔painel sumiria sem erro nenhum. Por isso o valor é higienizado antes de virar id.
 */
const idSeguro = (valor: string) => valor.replace(/[^\w-]/g, '_')
const idDaAba = (baseId: string, valor: string) => `${baseId}-aba-${idSeguro(valor)}`
const idDoPainel = (baseId: string, valor: string) => `${baseId}-painel-${idSeguro(valor)}`

export interface AbasProps {
  /** A aba ativa. Componente controlado — quem manda é o produto. */
  valor: string
  onChange: (valor: string) => void
  /**
   * `linha` (padrão) — sublinhado na cor da marca. Para navegação de seção, dentro da página.
   * `pilula` — pastilha sólida. Para alternar visão do MESMO dado (dia/semana/mês).
   * @default 'linha'
   */
  variante?: VarianteAbas
  children?: ReactNode
  className?: string
}

/**
 * Abas.
 *
 * O teclado é o componente inteiro: sem ele, sobra um `<div onClick>` bonito. Implementa o
 * padrão ARIA Tabs — roving tabindex, setas circulando, Home/End, e pula as desabilitadas.
 *
 * @example
 * const [aba, setAba] = useState('pedidos')
 *
 * <Abas valor={aba} onChange={setAba}>
 *   <ListaAbas aria-label="Seções do cliente">
 *     <Aba valor="pedidos" contador={12}>Pedidos</Aba>
 *     <Aba valor="mensagens">Mensagens</Aba>
 *     <Aba valor="nf" disabled>Notas fiscais</Aba>
 *   </ListaAbas>
 *   <PainelAba valor="pedidos">…</PainelAba>
 *   <PainelAba valor="mensagens">…</PainelAba>
 * </Abas>
 */
export function Abas({ valor, onChange, variante = 'linha', children, className }: AbasProps) {
  const baseId = useId()
  return (
    <Ctx.Provider value={{ valor, onChange, variante, baseId }}>
      <div className={cx('amb-abas', `amb-abas--${variante}`, className)}>{children}</div>
    </Ctx.Provider>
  )
}

export type ListaAbasProps = HTMLAttributes<HTMLDivElement>

/** A régua das abas. Precisa de `aria-label`: numa página com duas listas, "abas" e "abas" não distingue nada. */
export function ListaAbas({ children, className, onKeyDown, ...rest }: ListaAbasProps) {
  const ctx = useCtx('ListaAbas')
  const ref = useRef<HTMLDivElement>(null)

  if (process.env.NODE_ENV !== 'production' && !rest['aria-label'] && !rest['aria-labelledby']) {
    console.warn(
      '[@amboni/ui] <ListaAbas> precisa de aria-label. ' +
        'Sem ele, quem usa leitor de tela ouve só "abas" e não sabe abas de quê.',
    )
  }

  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(e)
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return

    const lista = ref.current
    if (!lista) return

    // Lê as abas do DOM em vez de manter um registro em estado: a ordem de foco é a ordem
    // VISUAL, e só o DOM sabe disso depois que o produto reordena/esconde abas.
    const todas = Array.from(lista.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    const habilitada = (el: HTMLButtonElement) => el.getAttribute('aria-disabled') !== 'true'
    const focaveis = todas.filter(habilitada)
    if (focaveis.length === 0) return

    // preventDefault antes de mover: Home/End rolariam a página inteira até o topo/fim, e as
    // setas rolariam a régua na horizontal por baixo do foco.
    e.preventDefault()

    let alvo: HTMLButtonElement | undefined
    if (e.key === 'Home') alvo = focaveis[0]
    else if (e.key === 'End') alvo = focaveis[focaveis.length - 1]
    else {
      const passo = e.key === 'ArrowRight' ? 1 : -1
      const de = todas.indexOf(document.activeElement as HTMLButtonElement)
      // Foco em lugar nenhum (-1) só acontece quando a aba ativa está desabilitada. Ancorar
      // fora da lista faz → cair na primeira e ← cair na última, que é o esperado.
      let i = de === -1 ? (passo === 1 ? -1 : todas.length) : de
      // Circula: da última volta pra primeira. Andar até o fim e travar obriga a pessoa a
      // voltar tecla por tecla. O `for` limita a uma volta — sem ele, uma lista só de abas
      // desabilitadas viraria laço infinito.
      for (let n = 0; n < todas.length; n++) {
        i = (i + passo + todas.length) % todas.length
        const candidata = todas[i]
        // Pula as desabilitadas: parar numa aba morta é um beco sem saída no teclado.
        if (candidata && habilitada(candidata)) {
          alvo = candidata
          break
        }
      }
    }

    if (!alvo) return
    alvo.focus()
    // Ativação automática (recomendação da APG): quem chega pela seta vê o conteúdo na hora,
    // igual a quem clica. O custo é que passar por 5 abas monta 5 painéis — se o painel for
    // caro, quem carrega sob demanda é o conteúdo dele, não a régua.
    const valor = alvo.dataset.ambValor
    if (valor !== undefined) ctx.onChange(valor)
  }

  return (
    <div
      ref={ref}
      role="tablist"
      className={cx('amb-abas__lista', className)}
      onKeyDown={teclado}
      {...rest}
    >
      {children}
    </div>
  )
}

export interface AbaProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Casa com o `valor` de um <PainelAba>. */
  valor: string
  /** Decorativo — quem narra a aba é o texto. */
  icone?: ReactNode
  /** Número ao lado do rótulo (12 pedidos). Entra no nome acessível de propósito. */
  contador?: number
  /** Vira `aria-disabled`, não `disabled`. Veja o comentário no componente. */
  disabled?: boolean
  children?: ReactNode
}

export function Aba({
  valor,
  icone,
  contador,
  disabled = false,
  children,
  className,
  onClick,
  ...rest
}: AbaProps) {
  const ctx = useCtx('Aba')
  const ativa = ctx.valor === valor

  return (
    <button
      type="button"
      role="tab"
      id={idDaAba(ctx.baseId, valor)}
      aria-selected={ativa}
      aria-controls={idDoPainel(ctx.baseId, valor)}
      // `aria-disabled` em vez do `disabled` do HTML: um disabled de verdade some do foco, e
      // se a aba ATIVA for desabilitada por regra de negócio a régua inteira fica inalcançável
      // pelo teclado (ninguém tem tabIndex=0). Assim ela continua descobrível — só não age.
      aria-disabled={disabled || undefined}
      // Roving tabindex: só a aba ativa é tabulável. Com tabIndex=0 em todas, o Tab obriga a
      // pessoa a passar por 8 abas antes de chegar ao conteúdo; aqui ele pula a régua inteira
      // e cai no painel. A navegação entre abas é das setas.
      tabIndex={ativa ? 0 : -1}
      // O teclado da lista lê o valor daqui — é o DOM que sabe a ordem visual.
      data-amb-valor={valor}
      className={cx(
        'amb-aba',
        'amb-focus-ring',
        ativa && 'amb-aba--ativa',
        disabled && 'amb-aba--desabilitada',
        className,
      )}
      onClick={e => {
        // O CSS já bloqueia o clique (pointer-events), mas Enter/Espaço num botão com
        // aria-disabled disparam onClick assim mesmo — o navegador não sabe da nossa regra.
        if (disabled) return
        onClick?.(e)
        if (!ativa) ctx.onChange(valor)
      }}
      {...rest}
    >
      {icone && (
        <span className="amb-aba__icone" aria-hidden="true">
          {icone}
        </span>
      )}
      <span className="amb-aba__rotulo">{children}</span>
      {contador !== undefined && (
        // Sem aria-hidden de propósito: o contador vira parte do nome ("Pedidos 12"). Escondido,
        // quem usa leitor de tela não saberia que existem 12 pedidos ali.
        <span className="amb-aba__contador">{contador}</span>
      )}
    </button>
  )
}

export interface PainelAbaProps extends HTMLAttributes<HTMLDivElement> {
  /** Casa com o `valor` de uma <Aba>. */
  valor: string
  children?: ReactNode
}

export function PainelAba({ valor, children, className, ...rest }: PainelAbaProps) {
  const ctx = useCtx('PainelAba')

  // Só o painel ativo existe no DOM. Trade-off assumido: o estado interno morre ao trocar de
  // aba (um filtro digitado volta ao início) — em troca, 8 abas não viram 8 buscas ao abrir a
  // tela, que é o problema real num painel. Quem precisa preservar estado sobe o estado para
  // fora do painel. Efeito colateral honesto: o aria-controls da aba aponta para um id que não
  // existe enquanto ela está inativa; os leitores de tela lidam bem, e é o que Radix/Reach fazem.
  if (ctx.valor !== valor) return null

  return (
    <div
      role="tabpanel"
      id={idDoPainel(ctx.baseId, valor)}
      aria-labelledby={idDaAba(ctx.baseId, valor)}
      // tabIndex=0: com roving tabindex o Tab sai da régua e precisa cair em algum lugar. Se o
      // painel for só texto, sem isto ele fica inalcançável — e não dá pra rolar pelo teclado.
      tabIndex={0}
      className={cx('amb-abas__painel', 'amb-focus-ring', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
