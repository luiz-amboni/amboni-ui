import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './Trilha.css'

/**
 * Só o <Trilha> sabe quantos itens existem, e o item precisa saber se é o último para
 * virar `aria-current` em vez de link. O contexto carrega essa resposta sem cloneElement
 * (que quebraria com qualquer wrapper entre os dois).
 */
const CtxItem = createContext<{ atual: boolean }>({ atual: false })

export interface TrilhaProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children?: ReactNode
  /**
   * Máximo de itens visíveis antes de colapsar o meio em "…". O primeiro e o último
   * SEMPRE aparecem — são a origem e o lugar onde a pessoa está.
   * Sem `max`, mostra tudo.
   */
  max?: number
  className?: string
}

/**
 * Trilha (breadcrumb) — o caminho até aqui.
 *
 * O último item é o lugar atual: vira `aria-current="page"` e deixa de ser link.
 *
 * @example
 * <Trilha>
 *   <ItemTrilha href="/">Início</ItemTrilha>
 *   <ItemTrilha href="/clientes">Clientes</ItemTrilha>
 *   <ItemTrilha>Maria Silva</ItemTrilha>
 * </Trilha>
 *
 * @example Caminho fundo — colapsa o meio, com botão para expandir
 * <Trilha max={3}>…</Trilha>
 */
export function Trilha({
  children,
  max,
  className,
  'aria-label': rotulo = 'Trilha',
  ...rest
}: TrilhaProps) {
  const [expandido, setExpandido] = useState(false)

  const itens = Children.toArray(children).filter(isValidElement)
  const total = itens.length

  // Mínimo de 2: com max=1 não sobraria nem origem nem destino, e a trilha perderia a
  // razão de existir.
  const maxEfetivo = max === undefined ? undefined : Math.max(2, Math.trunc(max))

  // `total > maxEfetivo + 1`, e não `> maxEfetivo`: se colapsar esconderia UM item só, o "…"
  // ocupa o mesmo espaço que o próprio item e entrega menos. Nunca troque um item por "…".
  const colapsar = maxEfetivo !== undefined && !expandido && total > maxEfetivo + 1

  const visiveis =
    colapsar && maxEfetivo !== undefined
      ? [itens[0], ...itens.slice(total - (maxEfetivo - 1))]
      : itens

  const ocultos = total - visiveis.length

  const nos: ReactNode[] = []
  visiveis.forEach((item, i) => {
    nos.push(
      <CtxItem.Provider key={`item-${i}`} value={{ atual: i === visiveis.length - 1 }}>
        {item}
      </CtxItem.Provider>,
    )
    if (colapsar && i === 0) {
      nos.push(
        <li className="amb-trilha__item" key="colapso">
          {/* O "…" é um BOTÃO, não um texto. Um "…" morto anuncia que existe caminho
              escondido e não deixa chegar nele — beco sem saída. Botão que expande no
              lugar resolve com o que a biblioteca já tem; um menu suspenso exigiria
              camada, foco preso e fechar-no-Esc, e a Trilha não é lugar de estrear isso. */}
          <button
            type="button"
            className="amb-trilha__colapso amb-focus-ring"
            onClick={() => setExpandido(true)}
            aria-label={`Mostrar ${ocultos} ${ocultos === 1 ? 'item oculto' : 'itens ocultos'} do caminho`}
          >
            …
          </button>
          <span className="amb-trilha__sep" aria-hidden="true">
            /
          </span>
        </li>,
      )
    }
  })

  return (
    // <nav> + aria-label: quem usa leitor de tela pula direto para a trilha pela lista de
    // regiões. Uma <div> de links não aparece nessa lista.
    <nav aria-label={rotulo} className={cx('amb-trilha', className)} {...rest}>
      {/* <ol> e não <ul>: a ordem É a informação — Início vem antes de Clientes. O leitor de
          tela anuncia "lista de 4 itens", que já diz a profundidade do caminho. */}
      <ol className="amb-trilha__lista">{nos}</ol>
    </nav>
  )
}

export interface ItemTrilhaProps {
  /** Link de verdade. Sem href e sem onClick, o item vira texto. */
  href?: string
  /** Para navegação por router (sem recarregar a página). */
  onClick?: () => void
  /** Decorativo — quem narra o item é o texto. */
  icone?: ReactNode
  children?: ReactNode
  className?: string
}

export function ItemTrilha({ href, onClick, icone, children, className }: ItemTrilhaProps) {
  const { atual } = useContext(CtxItem)

  const conteudo = (
    <>
      {icone && (
        <span className="amb-trilha__icone" aria-hidden="true">
          {icone}
        </span>
      )}
      <span className="amb-truncate">{children}</span>
    </>
  )

  return (
    <li className={cx('amb-trilha__item', className)}>
      {atual ? (
        // O item atual NÃO é link, mesmo com href: não se navega para onde já se está — o
        // clique recarrega a mesma tela e, no teclado, é mais uma parada que não leva a lugar
        // nenhum. `aria-current="page"` é o que faz o leitor de tela anunciar "página atual".
        <span className="amb-trilha__atual" aria-current="page">
          {conteudo}
        </span>
      ) : href ? (
        <a href={href} onClick={onClick} className="amb-trilha__link amb-focus-ring">
          {conteudo}
        </a>
      ) : onClick ? (
        // Ação sem destino é botão, não <a href="#">: um link falso é anunciado como link,
        // não abre em nova aba e suja o histórico.
        <button type="button" onClick={onClick} className="amb-trilha__link amb-focus-ring">
          {conteudo}
        </button>
      ) : (
        <span className="amb-trilha__texto">{conteudo}</span>
      )}

      {/* O separador é decorativo: sem aria-hidden o leitor de tela lê "barra" entre cada
          item ("Início barra Clientes barra Maria"). A hierarquia já vem do <ol>. */}
      {!atual && (
        <span className="amb-trilha__sep" aria-hidden="true">
          /
        </span>
      )}
    </li>
  )
}
