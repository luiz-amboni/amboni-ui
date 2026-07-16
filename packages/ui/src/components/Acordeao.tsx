import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './Acordeao.css'

export type TipoAcordeao = 'unico' | 'multiplo'

interface AcordeaoBase {
  children: ReactNode
  className?: string
}

/**
 * `unico` — abrir um fecha o outro. Bom quando os painéis são longos e comparar dois
 * não faz sentido (FAQ, formulário em etapas).
 * `multiplo` — cada um por si. Bom quando a pessoa precisa ver dois ao mesmo tempo.
 */
export type AcordeaoProps = AcordeaoBase &
  (
    | {
        tipo?: 'unico'
        /** Controlado: o `valor` do item aberto, ou `null`. Exige `onChange`. */
        valor?: string | null
        /** Não controlado: quem começa aberto. */
        valorPadrao?: string | null
        onChange?: (valor: string | null) => void
      }
    | {
        tipo: 'multiplo'
        /** Controlado: os `valor` dos itens abertos. Exige `onChange`. */
        valor?: string[]
        /** Não controlado: quem começa aberto. */
        valorPadrao?: string[]
        onChange?: (valor: string[]) => void
      }
  )

export interface ItemAcordeaoProps {
  /** Identidade do item dentro do acordeão. Precisa ser único e estável. */
  valor: string
  /** O que a pessoa lê para decidir se abre. */
  titulo: ReactNode
  /** Ícone antes do título. Decorativo — quem narra a seção é o título. */
  icone?: ReactNode
  /** Sem conteúdo para mostrar (ainda). O gatilho continua visível: sumir com a seção
   *  faz a pessoa procurar o que "estava ali ontem". */
  disabled?: boolean
  /**
   * Nível do heading que embrulha o gatilho. **Mexa quando a página exigir** — um h3
   * dentro de uma seção h4 quebra o índice que o leitor de tela monta.
   * @default 3
   */
  nivelTitulo?: 2 | 3 | 4 | 5 | 6
  children: ReactNode
  className?: string
}

interface ContextoAcordeao {
  abertos: string[]
  alternar: (valor: string) => void
}

const AcordeaoContexto = createContext<ContextoAcordeao | null>(null)

function normalizar(valor: string | string[] | null | undefined): string[] {
  if (valor == null) return []
  return Array.isArray(valor) ? valor : [valor]
}

/**
 * Quanto dura a transição do painel, perguntando ao CSS em vez de repetir o número.
 *
 * O JS precisa saber quando a animação acabou (para só então esconder o painel de
 * verdade). A alternativa óbvia — cravar `260` aqui — cria dois lugares para mudar uma
 * coisa só: alguém ajusta o token de duração, ninguém lembra deste arquivo, e o painel
 * some antes de terminar de fechar (ou fica fantasma depois de fechado).
 *
 * De brinde, resolve dois casos sozinho:
 * · `prefers-reduced-motion` zera `--amb-duracao-normal` nos tokens → devolve 0 → o
 *   painel some na hora, sem esperar animação que não vai acontecer;
 * · em teste (jsdom não aplica CSS) → devolve 0 → o comportamento é síncrono e não
 *   precisa de timer falso para ser verificado.
 */
function duracaoDaTransicao(el: HTMLElement | null): number {
  if (!el || typeof getComputedStyle !== 'function') return 0
  const segundos = parseFloat(getComputedStyle(el).transitionDuration)
  return Number.isFinite(segundos) ? segundos * 1000 : 0
}

/**
 * Acordeão — seções que abrem e fecham.
 *
 * ## Por que o gatilho mora dentro de um heading
 *
 * Cada seção é um `<h3><button>…</button></h3>`. Sem o heading o acordeão vira uma
 * pilha de botões: quem usa leitor de tela navega a página **pulando de heading em
 * heading** (é o atalho mais usado que existe) e, sem eles, a única forma de achar a
 * seção certa é ouvir todas em ordem. O heading não tem estilo próprio — o tamanho e o
 * peso vêm do botão. Ele existe para a estrutura, não para o olho.
 *
 * ## Setas do teclado
 *
 * Não implementadas, por decisão. A APG trata setas em acordeão como **opcional**, e
 * Tab já alcança todos os gatilhos. Meia implementação (que rouba as setas de dentro
 * do painel, onde pode haver um campo de texto ou uma lista) é pior que nenhuma.
 *
 * @example Não controlado — o caso comum
 * <Acordeao valorPadrao="entrega">
 *   <ItemAcordeao valor="entrega" titulo="Prazo de entrega">Sai em até 2 dias.</ItemAcordeao>
 *   <ItemAcordeao valor="troca" titulo="Troca e devolução">30 dias corridos.</ItemAcordeao>
 * </Acordeao>
 *
 * @example Vários abertos ao mesmo tempo
 * <Acordeao tipo="multiplo" valorPadrao={['a', 'b']}>…</Acordeao>
 *
 * @example Controlado
 * <Acordeao valor={aberto} onChange={setAberto}>…</Acordeao>
 */
export function Acordeao(props: AcordeaoProps) {
  const { tipo = 'unico', children, className } = props

  // `valor` presente = controlado. A escolha é feita uma vez e não muda no meio do
  // caminho — trocar de modo em runtime é o clássico "input muda de controlado para
  // não controlado" do React, e o estado interno some junto.
  const controlado = props.valor !== undefined
  const [interno, setInterno] = useState<string[]>(() => normalizar(props.valorPadrao))
  const abertos = controlado ? normalizar(props.valor) : interno

  const alternar = (valor: string) => {
    const jaAberto = abertos.includes(valor)
    const proximos =
      tipo === 'multiplo'
        ? jaAberto
          ? abertos.filter(v => v !== valor)
          : [...abertos, valor]
        : // `unico` também FECHA quando clica no que já está aberto. Um acordeão que só
          // deixa trocar prende a pessoa com um painel sempre aberto na cara — e não há
          // nenhum jeito de dizer "não quero ver nada disso".
          jaAberto
          ? []
          : [valor]

    if (!controlado) setInterno(proximos)

    // O tipo do `onChange` acompanha o tipo do acordeão: quem usa `unico` recebe
    // string|null e não precisa lidar com array de um elemento só.
    if (props.tipo === 'multiplo') props.onChange?.(proximos)
    else props.onChange?.(proximos[0] ?? null)
  }

  return (
    <AcordeaoContexto.Provider value={{ abertos, alternar }}>
      <div className={cx('amb-acordeao', className)}>{children}</div>
    </AcordeaoContexto.Provider>
  )
}

function Chevron() {
  return (
    <svg className="amb-acordeao__chevron" viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M4 6 8 10 12 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Uma seção do acordeão.
 *
 * ## O painel fechado precisa sumir de verdade
 *
 * "Fechado" aqui é o atributo `hidden` (= `display: none`), não altura zero. A diferença
 * é invisível para quem testa com mouse e é a razão deste componente existir: um painel
 * com `height: 0` e `overflow: hidden` continua **alcançável pelo Tab**. A pessoa
 * tecleja, o foco entra num painel fechado, o anel de foco desaparece da tela — e não
 * há nada para clicar, nem para onde voltar. O foco "sumiu".
 *
 * ## E a animação, então?
 *
 * `height: auto` não anima (o navegador não sabe para qual número ir), e `display: none`
 * corta qualquer transição. A saída é uma máquina de dois estados:
 *
 * · `visivel` — manda no `hidden`. Entra ANTES da animação de abrir, sai DEPOIS da de
 *   fechar. É a garantia de acessibilidade.
 * · `expandido` — manda no `grid-template-rows: 0fr → 1fr`. É a animação.
 *
 * `grid-template-rows` em vez de medir `scrollHeight`: medir obriga a ler o layout a
 * cada abertura (custo e travada), quebra quando o conteúdo muda de tamanho sozinho
 * (imagem que carrega, lista que cresce) e trava a altura num número que envelhece.
 * O grid deixa o navegador continuar decidindo a altura — anima do zero até "o que for".
 */
export function ItemAcordeao({
  valor,
  titulo,
  icone,
  disabled,
  nivelTitulo = 3,
  children,
  className,
}: ItemAcordeaoProps) {
  const ctx = useContext(AcordeaoContexto)
  if (!ctx) {
    throw new Error('[@amboni/ui] <ItemAcordeao> só funciona dentro de um <Acordeao>.')
  }

  const id = useId()
  const idGatilho = `${id}-gatilho`
  const idPainel = `${id}-painel`
  const aberto = ctx.abertos.includes(valor)

  const painelRef = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(aberto)
  const [expandido, setExpandido] = useState(aberto)

  useEffect(() => {
    const ms = duracaoDaTransicao(painelRef.current)

    if (aberto) {
      setVisivel(true) // tira o `hidden` primeiro: sem layout não há o que animar
      if (ms === 0) {
        setExpandido(true)
        return
      }
      // Dois quadros, não um. O primeiro `requestAnimationFrame` ainda roda antes de o
      // navegador pintar o painel com 0fr; mudar para 1fr aí é a mesma coisa que mudar
      // tudo de uma vez, e a transição não acontece (o navegador precisa ter pintado o
      // estado inicial para ter de onde sair). O segundo garante o quadro pintado.
      let segundo = 0
      const primeiro = requestAnimationFrame(() => {
        segundo = requestAnimationFrame(() => setExpandido(true))
      })
      return () => {
        cancelAnimationFrame(primeiro)
        cancelAnimationFrame(segundo)
      }
    }

    setExpandido(false) // dispara a animação de fechar
    if (ms === 0) {
      setVisivel(false)
      return
    }
    // `hidden` só no fim: durante a animação o painel ainda está encolhendo na tela.
    // Timer em vez de `transitionend` de propósito — `transitionend` não dispara quando
    // a duração é 0, não dispara se a aba estiver em segundo plano, e dispara uma vez
    // por propriedade. Um timer que espera o mesmo tempo que o CSS não tem nenhum
    // desses três buracos.
    const t = setTimeout(() => setVisivel(false), ms)
    return () => clearTimeout(t)
  }, [aberto])

  const Heading = `h${nivelTitulo}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return (
    <div className={cx('amb-acordeao__item', className)} data-amb-aberto={aberto || undefined}>
      {/* O heading é só estrutura — todo o estilo está no botão. Ver o bloco de
          documentação do Acordeao. */}
      <Heading className="amb-acordeao__cabecalho">
        <button
          type="button"
          id={idGatilho}
          className={cx('amb-acordeao__gatilho', 'amb-focus-ring')}
          // `aria-expanded` é o que faz o leitor de tela anunciar "recolhido"/"expandido".
          // Sem ele o botão é mudo: a pessoa clica e não tem como saber que algo abriu.
          aria-expanded={aberto}
          // Aponta para o painel que este botão comanda. Por isso o painel está SEMPRE
          // no DOM (mesmo fechado): `aria-controls` apontando para um id inexistente é
          // uma referência quebrada, e alguns leitores de tela ignoram o botão inteiro.
          aria-controls={idPainel}
          disabled={disabled}
          onClick={() => ctx.alternar(valor)}
        >
          {icone && (
            <span className="amb-acordeao__icone" aria-hidden="true">
              {icone}
            </span>
          )}
          <span className="amb-acordeao__titulo">{titulo}</span>
          <Chevron />
        </button>
      </Heading>

      <div
        ref={painelRef}
        id={idPainel}
        // `region` + `aria-labelledby` = a seção aparece na lista de regiões do leitor
        // de tela com o nome do próprio gatilho. É o que permite sair de dentro do
        // painel e voltar sem se perder.
        role="region"
        aria-labelledby={idGatilho}
        className={cx('amb-acordeao__painel', expandido && 'amb-acordeao__painel--expandido')}
        hidden={!visivel}
      >
        {/* Três camadas, cada uma com um trabalho: o painel é o grid que anima; o
            "interno" corta o que vaza enquanto a linha encolhe; o "conteudo" segura o
            respiro. Padding na camada que anima faria o painel fechado ter a altura do
            próprio padding — nunca chegaria a zero. */}
        <div className="amb-acordeao__painel-interno">
          <div className="amb-acordeao__conteudo">{children}</div>
        </div>
      </div>
    </div>
  )
}
