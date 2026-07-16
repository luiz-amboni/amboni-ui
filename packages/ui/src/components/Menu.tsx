import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from '../utils/cx'
import './Menu.css'

export type MenuAlinhamento = 'inicio' | 'fim'

/** O que injetamos no gatilho. Só o que o padrão de menu exige — nada de estilo. */
interface GatilhoProps {
  ref?: Ref<HTMLElement>
  onClick?: (e: MouseEvent<HTMLElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void
  'aria-haspopup'?: 'menu'
  'aria-expanded'?: boolean
  'aria-controls'?: string
}

interface MenuContexto {
  fechar: () => void
}

// null fora do Menu: um ItemMenu solto na página não deve explodir, só não fecha nada.
const CtxMenu = createContext<MenuContexto | null>(null)

/**
 * Junta dois refs num só. Existe aqui, em 8 linhas, para não trazer dependência —
 * o gatilho pode já ter um ref do consumidor, e o Menu precisa do dele para devolver o foco.
 */
function comporRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (valor: T | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(valor)
      else if (r) (r as { current: T | null }).current = valor
    }
  }
}

export interface MenuProps {
  /**
   * O botão que abre. Recebe `aria-haspopup`, `aria-expanded` e o ref por clonagem —
   * então precisa ser **um elemento que aceite ref e repasse props para o DOM**
   * (`<Button>` da casa, ou um `<button>`). Um componente que engole props não funciona.
   */
  gatilho: ReactElement
  /**
   * De que lado o painel cresce. `fim` = alinhado à direita do gatilho — é o certo para
   * menu de ação no fim de uma linha de tabela, senão ele cresce para fora da tela.
   * @default 'inicio'
   */
  alinhamento?: MenuAlinhamento
  children: ReactNode
  className?: string
}

/**
 * Menu — uma lista de **ações**.
 *
 * ## Menu ou Selecao?
 *
 * **Menu é AÇÃO. Selecao é VALOR.** A diferença não é visual, é de natureza:
 *
 * - `Menu` — "Editar", "Duplicar", "Excluir". Clicar **faz algo agora**. Não guarda estado,
 *   não entra em formulário, não tem "escolhido".
 * - `Selecao` — "Categoria: Fones". Clicar **guarda um dado** que vai ser enviado depois.
 *
 * Usar Menu para escolher valor quebra o formulário (não há valor para submeter, e o padrão
 * ARIA de menu não tem como dizer "este está escolhido"). Usar Selecao para ações confunde:
 * a pessoa escolhe "Excluir" na lista e fica esperando um botão de confirmar que não existe.
 *
 * ## Foco: o oposto do combobox
 *
 * Ao abrir, o foco **vai para o primeiro item**. No `Selecao buscavel` o foco **fica no campo**
 * e só uma marca virtual (`aria-activedescendant`) anda pela lista. Essa é a confusão mais
 * comum entre os dois padrões — e é proposital: no menu não há nada para digitar, então o
 * foco real pode (e deve) ir para os itens; no combobox, tirar o foco do campo mataria a digitação.
 *
 * @example
 * <Menu gatilho={<Button variant="ghost" aria-label="Ações do cliente"><Dots /></Button>} alinhamento="fim">
 *   <RotuloMenu>Cliente</RotuloMenu>
 *   <ItemMenu icone={<Lapis />} onClick={editar} atalho="E">Editar</ItemMenu>
 *   <SeparadorMenu />
 *   <ItemMenu perigo icone={<Lixeira />} onClick={excluir}>Excluir</ItemMenu>
 * </Menu>
 */
export function Menu({ gatilho, alinhamento = 'inicio', children, className }: MenuProps) {
  const [aberto, setAberto] = useState(false)
  const idMenu = useId()

  const raizRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLElement>(null)
  // Guarda a intenção da abertura entre o evento e o efeito que move o foco: Seta pra cima
  // abre no ÚLTIMO item (atalho consagrado para chegar em "Excluir" sem percorrer o menu).
  const focoInicial = useRef<'primeiro' | 'ultimo'>('primeiro')

  /**
   * Lê os itens do DOM em vez de mantê-los num registro em estado. É o que permite ao Menu
   * aceitar `children` arbitrários (separadores, rótulos, condicionais) sem que cada um
   * precise se cadastrar. O DOM já é a lista — duplicá-la em estado só criaria divergência.
   *
   * Os desabilitados ficam de fora: as setas pulam por cima deles. É o comportamento dos
   * menus nativos do sistema. O custo é assumido: quem navega só por teclado não descobre
   * que a ação existe ali — por isso, prefira ESCONDER a ação impossível a desabilitá-la,
   * e deixe `disabled` para o que fica disponível daqui a pouco.
   */
  const itensFocaveis = useCallback(
    () =>
      Array.from(
        painelRef.current?.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([data-desabilitado="true"])',
        ) ?? [],
      ),
    [],
  )

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false)
    // Sem devolver o foco, quem fecha pelo teclado é jogado para o topo da página (o foco
    // volta para o <body>) e precisa navegar tudo de novo até onde estava.
    if (devolverFoco) gatilhoRef.current?.focus()
  }, [])

  // O contexto só entrega o caso comum: item clicado → fecha e devolve o foco ao gatilho.
  const ctx = useRef<MenuContexto>({ fechar: () => fechar(true) })
  ctx.current.fechar = () => fechar(true)

  // Ao abrir, o foco entra no menu. Efeito e não evento: o painel só existe no DOM depois
  // do render, então no momento do clique ainda não há item para focar.
  useEffect(() => {
    if (!aberto) return
    const itens = itensFocaveis()
    const alvo = focoInicial.current === 'ultimo' ? itens[itens.length - 1] : itens[0]
    alvo?.focus()
  }, [aberto, itensFocaveis])

  // Fecha ao apontar para fora — SEM devolver o foco: a pessoa clicou em outro lugar porque
  // quer ir para lá; puxar o foco de volta para o gatilho seria roubar o gesto dela.
  //
  // `pointerdown` e não `click`, e a checagem `contains` não é detalhe: sem ela, o toque no
  // próprio item desmontaria o painel ainda no aperto do dedo, o `click` nunca chegaria ao
  // item e o `onClick` não rodaria. Bug clássico — o menu "não faz nada quando clico".
  useEffect(() => {
    if (!aberto) return
    function aoApontar(e: PointerEvent) {
      if (!raizRef.current?.contains(e.target as Node)) fechar(false)
    }
    document.addEventListener('pointerdown', aoApontar)
    return () => document.removeEventListener('pointerdown', aoApontar)
  }, [aberto, fechar])

  function aoTeclarNoPainel(e: KeyboardEvent<HTMLDivElement>) {
    const itens = itensFocaveis()

    if (e.key === 'Escape') {
      e.preventDefault()
      // stopPropagation: dentro de um modal, o mesmo Esc fecharia o menu E o modal atrás dele.
      // Um Esc, um nível.
      e.stopPropagation()
      fechar(true)
      return
    }
    if (e.key === 'Tab') {
      // Sem preventDefault: o Tab tem que continuar levando para o próximo campo da página.
      // Só não deixamos o painel aberto e órfão por cima do conteúdo.
      fechar(false)
      return
    }
    if (itens.length === 0) return

    const atual = itens.indexOf(document.activeElement as HTMLElement)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        // Circula: no último, volta ao primeiro. `atual` = -1 (foco fora) cai no primeiro.
        itens[(atual + 1) % itens.length]?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        itens[atual < 0 ? itens.length - 1 : (atual - 1 + itens.length) % itens.length]?.focus()
        break
      case 'Home':
        e.preventDefault()
        itens[0]?.focus()
        break
      case 'End':
        e.preventDefault()
        itens[itens.length - 1]?.focus()
        break
    }
    // Enter e Espaço não aparecem aqui de propósito: o item É um <button>, e o navegador já
    // dispara o clique dele nas duas teclas. Reimplementar só criaria disparo em dobro.
  }

  const propsGatilho = gatilho.props as GatilhoProps

  const gatilhoClonado = cloneElement(gatilho as ReactElement<GatilhoProps>, {
    // Passar `ref` pelo cloneElement funciona no React 18 e no 19 (que trata ref como prop
    // normal). Compomos com o ref que o consumidor já tenha posto no gatilho em vez de
    // substituí-lo — o dele continua valendo.
    ref: comporRefs(gatilhoRef, propsGatilho.ref),
    'aria-haspopup': 'menu',
    // Anuncia aberto/fechado. Sem isto, o leitor de tela diz "botão" e a pessoa não sabe
    // que abriu nada.
    'aria-expanded': aberto,
    'aria-controls': aberto ? idMenu : undefined,
    onClick: (e: MouseEvent<HTMLElement>) => {
      // O handler original do gatilho roda primeiro — não sequestramos o clique de quem passou um.
      propsGatilho.onClick?.(e)
      focoInicial.current = 'primeiro'
      setAberto(a => !a)
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      propsGatilho.onKeyDown?.(e)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // preventDefault: senão a página rola atrás do menu que acabou de abrir.
        e.preventDefault()
        focoInicial.current = e.key === 'ArrowUp' ? 'ultimo' : 'primeiro'
        setAberto(true)
      }
    },
  })

  return (
    <div ref={raizRef} className={cx('amb-menu', className)}>
      {gatilhoClonado}
      {/* Só existe no DOM quando aberto: um menu escondido por CSS continua sendo lido pelo
          leitor de tela e tabulável em alguns navegadores. */}
      {aberto && (
        <div
          ref={painelRef}
          id={idMenu}
          role="menu"
          aria-orientation="vertical"
          className={cx('amb-menu__painel', `amb-menu__painel--${alinhamento}`)}
          onKeyDown={aoTeclarNoPainel}
        >
          <CtxMenu.Provider value={ctx.current}>{children}</CtxMenu.Provider>
        </div>
      )}
    </div>
  )
}

export interface ItemMenuProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'children' | 'onClick'> {
  /** Ícone à esquerda. Decorativo — quem nomeia a ação é o texto. */
  icone?: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  /**
   * Ação destrutiva. Pinta de vermelho — mas **o rótulo precisa dizer a palavra**
   * ("Excluir"), porque parte das pessoas não distingue vermelho e para elas a cor
   * não existe. Cor é reforço, nunca o aviso.
   */
  perigo?: boolean
  /** Indisponível agora. As setas pulam por cima — ver a nota em `itensFocaveis`. */
  disabled?: boolean
  /** Atalho de teclado, à direita (ex.: "⌘E"). Só a dica visual — não registra nada. */
  atalho?: string
  children: ReactNode
}

/** Um item do Menu. É um `<button>` de verdade: Enter e Espaço vêm do navegador. */
export function ItemMenu({
  icone, perigo, disabled, atalho, children, className, onClick, ...rest
}: ItemMenuProps) {
  const ctx = useContext(CtxMenu)

  return (
    <button
      {...rest}
      type="button"
      role="menuitem"
      // tabIndex -1: quem move o foco entre os itens é a seta, não o Tab. O Tab sai do menu
      // inteiro (padrão APG) — senão a pessoa fica presa tabulando item por item.
      tabIndex={-1}
      className={cx('amb-menu__item', 'amb-focus-ring', perigo && 'amb-menu__item--perigo', className)}
      // aria-disabled em vez do `disabled` do HTML: o item continua sendo anunciado e
      // recebendo hover (dá para explicar por que está indisponível). Um `disabled` de
      // verdade some do leitor de tela em parte dos navegadores.
      aria-disabled={disabled || undefined}
      // O seletor de navegação lê este atributo. Fica em data- e não na classe porque
      // classe é para aparência, e isto é comportamento.
      data-desabilitado={disabled || undefined}
      onClick={e => {
        if (disabled) {
          e.preventDefault()
          return
        }
        onClick?.(e)
        // Fecha depois de agir. O menu já cumpriu o papel; deixá-lo aberto tampando o
        // resultado da ação que a pessoa acabou de disparar é o erro clássico aqui.
        ctx?.fechar()
      }}
    >
      {icone && <span className="amb-menu__item-icone" aria-hidden="true">{icone}</span>}
      <span className="amb-menu__item-rotulo">{children}</span>
      {/* O atalho NÃO é aria-hidden: ele é informação útil justamente para quem navega por
          teclado. Escondê-lo deixaria o menu "mais limpo" no leitor de tela tirando o dado
          de quem mais precisa dele. O nome do item vira "Editar E" — e tudo bem. */}
      {atalho && <span className="amb-menu__item-atalho">{atalho}</span>}
    </button>
  )
}

/**
 * Linha entre grupos de ações. `role="separator"` e não uma div qualquer: assim o leitor de
 * tela também percebe a divisão que o olho percebe.
 */
export function SeparadorMenu({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cx('amb-menu__separador', className)} {...rest} />
}

/**
 * Título de uma seção do menu ("Cliente", "Pedido").
 *
 * **Limitação assumida**: é rótulo VISUAL. Não agrupa semanticamente (`role="group"` +
 * `aria-labelledby`), porque para isso os itens teriam que ser filhos dele — e isso mudaria
 * a forma de escrever o menu inteiro. Para o leitor de tela os itens seguem soltos no menu.
 * Se a distinção entre as seções for essencial, ponha a palavra no rótulo do item.
 */
export function RotuloMenu({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div role="presentation" className={cx('amb-menu__rotulo', className)} {...rest} />
}
