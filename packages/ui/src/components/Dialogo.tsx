import { useEffect, useId, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { Button } from './Button'
import { cx } from '../utils/cx'
import './Dialogo.css'

export type DialogoSize = 'sm' | 'md' | 'lg' | 'full'

export interface DialogoProps {
  /** Fonte única da verdade. O modal NUNCA fecha sozinho por dentro — ver `onFechar`. */
  aberto: boolean
  /**
   * Chamado em TODA tentativa de fechar (X, Esc, clique no fundo). Quem fecha de fato é
   * você, virando o `aberto` para false. Isso é de propósito: dá para segurar o modal
   * aberto ("há alterações não salvas") sem lutar contra o componente.
   */
  onFechar: () => void
  /** Obrigatório: é o nome acessível do modal. Um modal sem nome é "diálogo" e nada mais. */
  titulo: ReactNode
  /** Uma linha explicando o que está em jogo. Vira `aria-describedby`. */
  descricao?: ReactNode
  children?: ReactNode
  /** Barra de ações. A primária vai à direita, junto do polegar/olhar. */
  rodape?: ReactNode
  /** @default 'md' */
  size?: DialogoSize
  /** Clique no fundo escurecido fecha. @default true */
  fecharNoFundo?: boolean
  /**
   * Esc fecha. @default true
   * Desligue só quando perder o que está na tela for caro (formulário longo) — Esc é o
   * jeito que as pessoas esperam sair, e tirar isso surpreende.
   */
  fecharNoEsc?: boolean
  className?: string
}

/* ── Trava da rolagem do fundo ────────────────────────────────────────────────
 * Contada, não booleana: com dois modais abertos (um confirmando o outro), o
 * primeiro a fechar devolveria a rolagem com o segundo ainda aberto. O contador só
 * destrava quando o último sai.
 *
 * Fica no módulo, e não em estado do React, justamente porque a trava é do documento
 * — é compartilhada por todas as instâncias, inclusive as da Gaveta.
 */
let travas = 0
let overflowOriginal = ''
let paddingOriginal = ''

function travarRolagem() {
  if (travas === 0) {
    overflowOriginal = document.body.style.overflow
    paddingOriginal = document.body.style.paddingRight

    // Esconder a rolagem some com a barra e a página do fundo PULA uns 15px para a
    // direita — o modal abre e o mundo atrás dele se mexe. Devolvemos a largura da
    // barra como respiro. (Em Mac com barra flutuante a conta dá 0 e nada muda.)
    const larguraDaBarra = window.innerWidth - document.documentElement.clientWidth
    if (larguraDaBarra > 0) {
      const atual = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0
      document.body.style.paddingRight = `${atual + larguraDaBarra}px`
    }
    document.body.style.overflow = 'hidden'
  }
  travas += 1
}

function destravarRolagem() {
  travas = Math.max(0, travas - 1)
  if (travas === 0) {
    document.body.style.overflow = overflowOriginal
    document.body.style.paddingRight = paddingOriginal
  }
}

/** Desenhado aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function IconeX() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"
    >
      <path d="M4 4 L12 12 M12 4 L4 12" />
    </svg>
  )
}

/**
 * Dialogo — o modal.
 *
 * Usa o `<dialog>` NATIVO com `showModal()`. Essa é a decisão central do componente, e
 * ela é o que faz este arquivo ter 150 linhas em vez de 400. De graça, e certo:
 *
 *  · **top layer** — o modal fica acima de QUALQUER z-index da página. A guerra de
 *    `z-index: 9999` simplesmente não acontece;
 *  · **`::backdrop`** — o fundo escurecido é do navegador, sem div extra;
 *  · **Esc** — o navegador já trata (nós só precisamos avisar o React, ver abaixo);
 *  · **inertização** — o resto da página para de receber clique, foco e leitor de tela.
 *
 * Reimplementar isso com div + portal + focus trap é o caminho conhecido de 200 linhas
 * com bugs sutis de foco. O `<dialog>` custa alguns cuidados, todos comentados aqui.
 *
 * @example
 * const [aberto, setAberto] = useState(false)
 * <Dialogo
 *   aberto={aberto}
 *   onFechar={() => setAberto(false)}
 *   titulo="Excluir cliente"
 *   descricao="Esta ação não tem volta."
 *   rodape={<>
 *     <Button onClick={() => setAberto(false)}>Cancelar</Button>
 *     <Button variant="danger" onClick={excluir}>Excluir</Button>
 *   </>}
 * >
 *   O histórico de mensagens de {nome} será apagado junto.
 * </Dialogo>
 */
export function Dialogo({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  size = 'md',
  fecharNoFundo = true,
  fecharNoEsc = true,
  className,
}: DialogoProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pressionouNoFundo = useRef(false)
  const fechandoPeloReact = useRef(false)

  const id = useId()
  const tituloId = `${id}-titulo`
  const descricaoId = `${id}-descricao`

  // ── Abrir, travar a rolagem e devolver o foco ──────────────────────────────
  // Tudo num efeito só, porque a limpeza é a mesma nos dois caminhos que importam:
  // `aberto` virar false E o componente desmontar aberto (troca de rota, item da lista
  // que some). Separado em dois efeitos, o segundo caminho vaza a trava da rolagem e a
  // página fica congelada sem nenhum modal na tela — bug difícil de ligar à causa.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !aberto) return

    // Quem abriu, guardado ANTES do showModal(): depois dele o foco já está dentro do
    // modal e `activeElement` não serve mais para nada.
    const abridor = document.activeElement instanceof HTMLElement ? document.activeElement : null

    // `showModal()` num dialog JÁ aberto lança InvalidStateError. Sem este guarda o app
    // quebra no StrictMode, que roda os efeitos duas vezes em desenvolvimento.
    if (!dialog.open) dialog.showModal()
    travarRolagem()

    return () => {
      destravarRolagem()

      if (dialog.open) {
        // Ver `aoFecharNativo`: este close() é nosso, não pode voltar como onFechar.
        fechandoPeloReact.current = true
        dialog.close()
        fechandoPeloReact.current = false
      }

      // O foco volta para quem abriu. Sem isto a pessoa é cuspida no topo do documento
      // e precisa navegar a página inteira de novo até onde estava — para quem usa
      // teclado ou leitor de tela, é perder o lugar no meio da tarefa.
      // Os navegadores atuais já fazem isso sozinhos, mas não todos, e não quando o
      // modal fecha por mudança de estado em vez de interação. `isConnected` cobre o
      // caso do abridor ter saído da tela junto (a linha da tabela que foi excluída).
      if (abridor?.isConnected) abridor.focus()
    }
  }, [aberto])

  // ── Esc e fechamento por fora do React ─────────────────────────────────────
  // `cancel` e `close` NÃO borbulham. Ligamos no elemento em vez de usar as props
  // onCancel/onClose do JSX para não depender de como o React trata evento sem bolha —
  // é um detalhe interno dele que já mudou de versão para versão.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    function aoCancelar(evento: Event) {
      // ESTE é o bug clássico do <dialog>: o Esc fecha o modal no navegador, mas o
      // React continua com `aberto === true`. Aí `setAberto(true)` não muda prop
      // nenhuma, o efeito não roda, e o modal NUNCA MAIS abre.
      //
      // preventDefault() sempre: assim quem fecha é só o `aberto`, e o componente tem
      // um caminho de saída só, para as três portas (X, Esc, fundo).
      evento.preventDefault()
      if (fecharNoEsc) onFechar()
    }

    function aoFecharNativo() {
      // Algo fechou o dialog sem passar por nós — tipicamente um
      // <form method="dialog"> nos children, que é HTML legítimo. Avisa o React, senão
      // cai no mesmo buraco do Esc: fechado na tela, aberto no estado.
      if (fechandoPeloReact.current) return
      onFechar()
    }

    dialog.addEventListener('cancel', aoCancelar)
    dialog.addEventListener('close', aoFecharNativo)
    return () => {
      dialog.removeEventListener('cancel', aoCancelar)
      dialog.removeEventListener('close', aoFecharNativo)
    }
  }, [fecharNoEsc, onFechar])

  // ── Clique no fundo ────────────────────────────────────────────────────────
  // O `::backdrop` é pseudo-elemento: não dá para pôr onClick nele, e o clique no fundo
  // chega com `target` = o PRÓPRIO <dialog>. Por isso "clicou fora" se descobre por
  // geometria — comparando o ponto do clique com o retângulo do dialog.
  function foraDoDialogo(evento: { clientX: number; clientY: number }) {
    const r = dialogRef.current?.getBoundingClientRect()
    if (!r) return false
    return (
      evento.clientX < r.left || evento.clientX > r.right ||
      evento.clientY < r.top || evento.clientY > r.bottom
    )
  }

  function aoPressionar(evento: ReactMouseEvent<HTMLDialogElement>) {
    // Guarda ONDE o botão do mouse desceu. Sem isso, selecionar um texto de dentro do
    // modal e soltar o mouse fora fecha tudo no meio da seleção: o `click` sai no
    // ancestral comum (o dialog) com as coordenadas da soltura, lá fora.
    pressionouNoFundo.current = evento.target === dialogRef.current && foraDoDialogo(evento)
  }

  function aoClicar(evento: ReactMouseEvent<HTMLDialogElement>) {
    const comecouNoFundo = pressionouNoFundo.current
    pressionouNoFundo.current = false

    if (!fecharNoFundo) return
    // `detail === 0` = clique sintético do teclado (Enter/Espaço num botão de dentro).
    // Ele vem com clientX/clientY zerados, que caem fora do retângulo e fechariam o
    // modal a cada Enter. Teclado não clica no fundo.
    if (evento.detail === 0) return

    if (comecouNoFundo && foraDoDialogo(evento)) onFechar()
  }

  return (
    <dialog
      ref={dialogRef}
      className={cx('amb-dialogo', `amb-dialogo--${size}`, className)}
      // O <dialog> modal já tem role="dialog" e aria-modal="true" do navegador — não
      // repetimos aqui. Falta só dizer QUAL diálogo é este.
      aria-labelledby={tituloId}
      aria-describedby={descricao ? descricaoId : undefined}
      onMouseDown={aoPressionar}
      onClick={aoClicar}
    >
      <header className="amb-dialogo__cabecalho">
        <div className="amb-dialogo__textos">
          {/* h2 fixo: o modal é um contexto próprio, começa do topo da hierarquia útil
              (h1 é da página, que continua ali atrás). */}
          <h2 id={tituloId} className="amb-dialogo__titulo">{titulo}</h2>
          {descricao && <p id={descricaoId} className="amb-dialogo__descricao">{descricao}</p>}
        </div>
        {/* O X existe mesmo com fecharNoFundo/fecharNoEsc desligados: no celular não há
            Esc, e um modal sem saída visível é uma armadilha. */}
        <Button
          variant="ghost" size="sm" aria-label="Fechar"
          className="amb-dialogo__fechar" onClick={onFechar} iconLeft={<IconeX />}
        />
      </header>

      <div className="amb-dialogo__corpo">{children}</div>

      {rodape && <footer className="amb-dialogo__rodape">{rodape}</footer>}
    </dialog>
  )
}
