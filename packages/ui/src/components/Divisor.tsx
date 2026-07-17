import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from '../utils/cx'
import './Divisor.css'

export type DivisorOrientacao = 'horizontal' | 'vertical'
export type DivisorEspessura = 'fina' | 'grossa'

export interface DivisorProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /**
   * `vertical` só funciona dentro de um container que tenha altura (um flex row, uma
   * barra de ferramentas). Solto no fluxo, ele mede 0 e some — não é bug do componente,
   * é que não existe "altura" para herdar.
   * @default 'horizontal'
   */
  orientacao?: DivisorOrientacao
  /**
   * Uma palavra no meio da linha ("ou"). Muda o componente por dentro — ver o bloco
   * sobre filhos presentacionais na documentação do componente.
   */
  rotulo?: ReactNode
  /**
   * `fina` (1px) separa itens de uma mesma lista; `grossa` (2px) separa seções que não
   * têm nada a ver uma com a outra. Se estiver em dúvida, é `fina`: divisor é pontuação,
   * não título.
   * @default 'fina'
   */
  espessura?: DivisorEspessura
}

/**
 * Divisor — a linha entre duas coisas.
 *
 * ## Por que o divisor COM rótulo não é `role="separator"`
 *
 * A tentação é marcar os dois casos igual e pendurar o texto dentro. Não funciona: pela
 * norma ARIA, um `separator` que não recebe foco tem **filhos presentacionais** — o leitor
 * de tela descarta a árvore de dentro e anuncia só "separador". O "ou" que a pessoa vê no
 * meio da linha simplesmente não existe para quem ouve a tela. (É o que boa parte das
 * bibliotecas faz hoje, inclusive as grandes.)
 *
 * Então os dois casos são componentes diferentes de verdade:
 *
 * · **sem rótulo** → `<hr>`: nada além da linha, e o papel `separator` é justamente o que
 *   se quer anunciar. `aria-orientation` explícito porque o implícito do `<hr>` é sempre
 *   horizontal, e mentiria no modo vertical.
 * · **com rótulo** → o rótulo é CONTEÚDO (texto normal, lido como qualquer texto) e as
 *   duas linhas ao lado é que são decoração (`aria-hidden`). Sem papel nenhum no wrapper:
 *   marcá-lo como `separator` seria trocar a informação pelo silêncio.
 *
 * @example
 * <Divisor />
 * <Divisor rotulo="ou" />
 * <Divisor orientacao="vertical" />   // dentro de um flex row
 */
export const Divisor = forwardRef<HTMLElement, DivisorProps>(function Divisor(
  { orientacao = 'horizontal', rotulo, espessura = 'fina', className, ...rest },
  ref,
) {
  const classes = cx(
    'amb-divisor',
    `amb-divisor--${orientacao}`,
    `amb-divisor--${espessura}`,
    className,
  )

  if (rotulo !== undefined && rotulo !== null && rotulo !== false) {
    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        className={cx(classes, 'amb-divisor--com-rotulo')}
        {...rest}
      >
        {/* As duas metades da linha são desenho. Sem aria-hidden, o leitor de tela
            anunciaria "separador, ou, separador" — três coisas onde há uma. */}
        <hr className="amb-divisor__linha" aria-hidden="true" />
        <span className="amb-divisor__rotulo">{rotulo}</span>
        <hr className="amb-divisor__linha" aria-hidden="true" />
      </div>
    )
  }

  return (
    <hr
      ref={ref as Ref<HTMLHRElement>}
      className={classes}
      // `<hr>` já É um separator para o navegador; o que ele não sabe é a orientação.
      aria-orientation={orientacao}
      {...rest}
    />
  )
})
