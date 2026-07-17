import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from '../utils/cx'
import { comporRefs } from '../utils/comporRefs'
import './Popover.css'

export type PopoverLado = 'cima' | 'baixo' | 'esq' | 'dir'
export type PopoverAlinhamento = 'inicio' | 'centro' | 'fim'

/** O que injetamos no gatilho. Só o que o padrão exige — nada de estilo. */
interface GatilhoProps {
  ref?: Ref<HTMLElement>
  onClick?: (e: MouseEvent<HTMLElement>) => void
  'aria-haspopup'?: 'dialog'
  'aria-expanded'?: boolean
  'aria-controls'?: string
}

export interface PopoverProps {
  /**
   * O botão que abre. Recebe `aria-haspopup`, `aria-expanded` e o ref por clonagem —
   * então precisa ser **um elemento que aceite ref e repasse props para o DOM**
   * (`<Button>` da casa, ou um `<button>`). Um componente que engole props não funciona.
   */
  gatilho: ReactElement
  /**
   * O nome do painel. **Obrigatório**: `role="dialog"` sem nome é anunciado como "diálogo"
   * e nada mais — a pessoa sabe que algo abriu e não o quê. Diga o conteúdo ("Filtros",
   * "Quem viu isto"), não a ação.
   */
  rotulo: string
  /** Conteúdo INTERATIVO. Se for só texto de apoio, o certo é a `Dica` — ver o JSDoc. */
  children: ReactNode
  /**
   * Preferência, não garantia: se não couber, o painel é empurrado para dentro da janela.
   * @default 'baixo'
   */
  lado?: PopoverLado
  /**
   * Como o painel se alinha ao gatilho no eixo transversal. `fim` é o certo para um botão
   * no canto direito da tela — senão o painel cresce para fora.
   * @default 'inicio'
   */
  alinhamento?: PopoverAlinhamento
  /**
   * Controlado. Passe junto com `onAbrirChange`. Omita para o Popover cuidar sozinho —
   * que é o caso comum.
   */
  aberto?: boolean
  /** Chamado em toda intenção de abrir/fechar (clique no gatilho, Esc, clique fora). */
  onAbrirChange?: (aberto: boolean) => void
  className?: string
}

/** Distância entre o gatilho e o painel, e da borda da janela. */
const RESPIRO = 8

/**
 * O que o Tab enxerga. `[tabindex="-1"]` fica de fora de propósito: é focável por código,
 * não por tabulação — incluí-lo faria a armadilha parar num elemento que a pessoa não
 * alcançaria na página normal.
 */
const FOCAVEIS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Popover — o painel com conteúdo que se USA.
 *
 * ## Popover, Dica ou Dialogo? A pergunta é o que tem dentro
 *
 * Os três abrem algo por cima da página. O que os separa não é o tamanho, é **se dá para
 * interagir com o conteúdo** e **se o resto da página continua viva**:
 *
 * · **`Dica`** — texto curto, abre no hover, **não recebe foco**. O balão tem
 *   `pointer-events: none`: o ponteiro atravessa. Um link ali dentro é inalcançável, e no
 *   celular (onde hover não existe) ninguém nunca vê o conteúdo. É para o que é bônus.
 * · **`Popover`** — um filtro, um mini-formulário, um "quem viu isto". O conteúdo **recebe
 *   foco e tem controles**. A página atrás continua clicável e lida pelo leitor de tela.
 * · **`Dialogo`** — decisão que precisa de resposta antes de seguir. Bloqueia a página
 *   inteira (`aria-modal="true"`, top layer, resto inertizado).
 *
 * ## O que "ter conteúdo interativo" muda — e é tudo
 *
 * A `Dica` só precisa aparecer. O Popover precisa ser **habitável**, e isso obriga:
 *
 * · **o foco entra** ao abrir (primeiro controle, ou o painel se não houver nenhum) —
 *   senão quem usa teclado abre um painel que não consegue alcançar;
 * · **Esc fecha E devolve o foco ao gatilho** — sem devolver, a pessoa é cuspida no topo
 *   do documento e navega tudo de novo até onde estava;
 * · **`role="dialog"` + `aria-modal="false"`** — é diálogo (agrupa e nomeia o conteúdo),
 *   mas NÃO é modal: dizer `aria-modal="true"` aqui faria o leitor de tela esconder a
 *   página inteira enquanto um painelzinho de filtro está aberto. A mentira é pior que o
 *   silêncio.
 *
 * ## Limitações conhecidas (as mesmas da Dica, pelas mesmas razões)
 *
 * 1. **Sem detecção de colisão fina.** `position: fixed` + `getBoundingClientRect`, sem
 *    floating-ui. Perto da borda o painel é **empurrado para dentro da janela**, não vira
 *    para o lado oposto ("flip"), e num canto apertado pode cobrir o próprio gatilho.
 *    Preferimos tampar o gatilho a cortar o conteúdo — conteúdo cortado não se usa.
 * 2. **Ancestral com `transform`/`filter`/`will-change`** vira bloco contedor do `fixed`, e
 *    o painel passa a se posicionar em relação a ELE: sai do lugar. A saída seria um
 *    portal para o `<body>`, que trocaria este bug por um pior — dentro de um `Dialogo`
 *    (top layer) o painel portalado renderiza ATRÁS do modal e some.
 * 3. **A armadilha de foco desvia do APG**, de propósito. Ver o comentário em `aoTeclar`.
 *
 * @example Um filtro
 * <Popover rotulo="Filtros" gatilho={<Button>Filtrar</Button>}>
 *   <Caixa label="Só ativos" />
 *   <Button size="sm" onClick={aplicar}>Aplicar</Button>
 * </Popover>
 *
 * @example Controlado — fechar de fora depois de salvar
 * <Popover rotulo="Novo cliente" aberto={aberto} onAbrirChange={setAberto} gatilho={<Button>Novo</Button>}>
 *   <FormularioCliente onSalvo={() => setAberto(false)} />
 * </Popover>
 */
export function Popover({
  gatilho,
  rotulo,
  children,
  lado = 'baixo',
  alinhamento = 'inicio',
  aberto: abertoProp,
  onAbrirChange,
  className,
}: PopoverProps) {
  // Controlado ou não pelo MESMO caminho: o estado interno existe sempre, mas quem manda é
  // a prop quando ela vem. Sem isto, um Popover controlado que o produto se recusa a fechar
  // ("salve antes de sair") fecharia sozinho na tela e mentiria sobre o estado.
  const [abertoInterno, setAbertoInterno] = useState(false)
  const controlado = abertoProp !== undefined
  const aberto = controlado ? abertoProp : abertoInterno

  // `null` = ainda não medido. O painel nasce invisível e só aparece já posicionado —
  // senão pisca no canto superior esquerdo antes de achar o lugar.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const raizRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLElement>(null)

  const idPainel = useId()

  const mudar = useCallback(
    (novo: boolean) => {
      if (!controlado) setAbertoInterno(novo)
      onAbrirChange?.(novo)
    },
    [controlado, onAbrirChange],
  )

  const fechar = useCallback(
    (devolverFoco: boolean) => {
      mudar(false)
      setPos(null)
      // Sem devolver o foco, quem fecha pelo teclado é jogado para o topo da página e
      // precisa navegar tudo de novo até onde estava.
      if (devolverFoco) gatilhoRef.current?.focus()
    },
    [mudar],
  )

  // ── Posicionamento ─────────────────────────────────────────────────────────
  // Ver a limitação 1 no JSDoc: é a conta simples, não é floating-ui.
  const posicionar = useCallback(() => {
    const g = gatilhoRef.current?.getBoundingClientRect()
    const p = painelRef.current?.getBoundingClientRect()
    if (!g || !p) return

    // No eixo transversal, `inicio`/`fim` colam as BORDAS do painel e do gatilho — é o que
    // faz um painel largo num botão pequeno crescer para dentro da tela, e não a partir do
    // centro do botão (que o jogaria metade para fora).
    const transversal = (inicioG: number, fimG: number, tamanhoP: number) => {
      if (alinhamento === 'centro') return inicioG + (fimG - inicioG) / 2 - tamanhoP / 2
      if (alinhamento === 'fim') return fimG - tamanhoP
      return inicioG
    }

    let top: number
    let left: number

    switch (lado) {
      case 'cima':
        top = g.top - p.height - RESPIRO
        left = transversal(g.left, g.right, p.width)
        break
      case 'esq':
        top = transversal(g.top, g.bottom, p.height)
        left = g.left - p.width - RESPIRO
        break
      case 'dir':
        top = transversal(g.top, g.bottom, p.height)
        left = g.right + RESPIRO
        break
      default:
        top = g.bottom + RESPIRO
        left = transversal(g.left, g.right, p.width)
    }

    const limite = (valor: number, maximo: number) =>
      Math.max(RESPIRO, Math.min(valor, Math.max(RESPIRO, maximo - RESPIRO)))

    setPos({
      top: limite(top, window.innerHeight - p.height),
      left: limite(left, window.innerWidth - p.width),
    })
  }, [lado, alinhamento])

  useEffect(() => {
    if (!aberto) return

    posicionar()

    // O painel é `fixed`: se a página rolar, ele fica parado e o gatilho vai embora debaixo
    // dele. `capture: true` para pegar rolagem de QUALQUER contêiner no caminho (a tabela
    // com overflow), não só a da janela — evento de rolagem de elemento não borbulha.
    const recalcular = () => posicionar()
    window.addEventListener('scroll', recalcular, true)
    window.addEventListener('resize', recalcular)
    return () => {
      window.removeEventListener('scroll', recalcular, true)
      window.removeEventListener('resize', recalcular)
    }
  }, [aberto, posicionar])

  const focaveis = useCallback(
    () => Array.from(painelRef.current?.querySelectorAll<HTMLElement>(FOCAVEIS) ?? []),
    [],
  )

  // Ao abrir, o foco ENTRA no painel. Efeito e não evento: o painel só existe no DOM depois
  // do render, então no momento do clique ainda não há o que focar.
  //
  // Cai no próprio painel quando não há controle nenhum dentro (um "quem viu isto" que é só
  // uma lista de nomes). Sem isso o foco ficaria no gatilho, o Tab seguiria para o próximo
  // botão da PÁGINA e o painel aberto seria um conteúdo que o teclado nunca alcança.
  useEffect(() => {
    if (!aberto) return
    const dentro = focaveis()
    ;(dentro[0] ?? painelRef.current)?.focus()
  }, [aberto, focaveis])

  // Fecha ao apontar para fora — SEM devolver o foco: a pessoa clicou em outro lugar porque
  // quer ir para lá; puxar o foco de volta para o gatilho seria roubar o gesto dela.
  //
  // `pointerdown` e não `click`, e a checagem `contains` não é detalhe: sem ela, o toque num
  // controle DE DENTRO desmontaria o painel ainda no aperto do dedo, o `click` nunca chegaria
  // ao controle e o handler não rodaria. É o bug clássico — "o botão do painel não faz nada".
  useEffect(() => {
    if (!aberto) return
    function aoApontar(e: PointerEvent) {
      if (!raizRef.current?.contains(e.target as Node)) fechar(false)
    }
    document.addEventListener('pointerdown', aoApontar)
    return () => document.removeEventListener('pointerdown', aoApontar)
  }, [aberto, fechar])

  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      // stopPropagation: dentro de um Dialogo, o mesmo Esc fecharia o Popover E o modal
      // atrás dele. Um Esc, um nível.
      e.stopPropagation()
      fechar(true)
      return
    }

    if (e.key !== 'Tab') return

    // ── A armadilha de foco: por que ela existe, e o que ela custa ────────────
    // O APG diz que num diálogo NÃO modal o Tab deveria sair para a página. Divergimos, e o
    // motivo é honesto: o painel continua ABERTO e por cima do conteúdo depois que o foco
    // sai, então a pessoa tabula "por baixo" de um painel que ainda está na tela — o foco
    // fica num lugar que ela não está vendo. Circular resolve isso sem prender ninguém: Esc
    // e o clique fora continuam sendo saídas de um gesto só, e o Esc devolve o foco ao
    // gatilho, de onde o Tab segue naturalmente.
    //
    // O preço assumido: quem espera o comportamento do APG estranha. Vale menos que o foco
    // invisível.
    const dentro = focaveis()

    if (dentro.length === 0) {
      // Painel sem controle nenhum: o foco está no próprio painel e não há para onde
      // circular. Segurar aqui é melhor que deixar o Tab escapar para trás do painel.
      e.preventDefault()
      return
    }

    const primeiro = dentro[0]
    const ultimo = dentro[dentro.length - 1]
    const atual = document.activeElement

    if (e.shiftKey && (atual === primeiro || atual === painelRef.current)) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && atual === ultimo) {
      e.preventDefault()
      primeiro.focus()
    }
  }

  const propsGatilho = gatilho.props as GatilhoProps

  const gatilhoClonado = cloneElement(gatilho as ReactElement<GatilhoProps>, {
    // Passar `ref` pelo cloneElement funciona no React 18 e no 19 (que trata ref como prop
    // normal). Compomos com o ref que o consumidor já tenha posto no gatilho em vez de
    // substituí-lo — o dele continua valendo.
    ref: comporRefs(gatilhoRef, propsGatilho.ref),
    // `dialog` e não `menu`: o que abre tem conteúdo, não uma lista de ações. É o que faz o
    // leitor de tela anunciar "abre uma janela" em vez de prometer um menu que não existe.
    'aria-haspopup': 'dialog',
    'aria-expanded': aberto,
    'aria-controls': aberto ? idPainel : undefined,
    onClick: (e: MouseEvent<HTMLElement>) => {
      // O handler original do gatilho roda primeiro — não sequestramos o clique de quem passou um.
      propsGatilho.onClick?.(e)
      mudar(!aberto)
    },
  })

  return (
    <div ref={raizRef} className={cx('amb-popover', className)}>
      {gatilhoClonado}

      {/* Só existe no DOM quando aberto: um painel escondido por CSS continua sendo lido
          pelo leitor de tela e tabulável em alguns navegadores. */}
      {aberto && (
        <div
          ref={painelRef}
          id={idPainel}
          role="dialog"
          // A diferença que dá nome ao componente: NÃO bloqueia a página. Ver o JSDoc.
          aria-modal="false"
          aria-label={rotulo}
          // -1: focável por código (é o destino quando não há controle dentro), nunca uma
          // parada do Tab.
          tabIndex={-1}
          className={cx('amb-popover__painel', `amb-popover__painel--${lado}`)}
          style={{
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            // Invisível, mas COM caixa: `visibility` mantém o painel medível pelo
            // posicionar(). Com `display: none` a medida daria zero e ele cairia sempre no
            // canto — e o foco entraria num elemento que o navegador considera escondido.
            visibility: pos ? undefined : 'hidden',
          }}
          onKeyDown={aoTeclar}
        >
          {children}
        </div>
      )}
    </div>
  )
}
