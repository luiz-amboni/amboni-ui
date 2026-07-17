import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './Tecla.css'

export interface TeclaProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** A tecla. Uma por componente — ver a nota sobre combinações. */
  children: ReactNode
}

/**
 * Tecla — o atalho de teclado, do jeito que ele aparece no teclado.
 *
 * `<kbd>` existe no HTML desde sempre e diz exatamente isto: "este texto é uma tecla que
 * você aperta". Um `<span>` pintado de cinza com borda entrega o mesmo desenho e nenhuma
 * informação — e é o que a documentação estava fazendo à mão, em cada página, com classes
 * copiadas.
 *
 * ## Combinação é uma tecla por `<Tecla>`
 *
 * O "+" fica FORA, como texto normal. Enfiar `Ctrl+K` dentro de um `<kbd>` só desenha uma
 * caixa comprida: some a noção de que são duas teclas, e o "+" ganha a mesma borda de
 * tecla — só que não existe tecla "+" nesse atalho.
 *
 * @example
 * <Tecla>Ctrl</Tecla> + <Tecla>K</Tecla>
 *
 * @example Símbolo sozinho precisa de nome — leitor de tela não sabe ler ⌘
 * <Tecla aria-label="Command">⌘</Tecla>
 * // Sem o rótulo, parte dos leitores anuncia "sinal de local de interesse" (o nome
 * // Unicode do caractere) e outra parte anuncia NADA. Vale para ⌘ ⌥ ⇧ ⏎ ⌫ e as setas.
 */
export const Tecla = forwardRef<HTMLElement, TeclaProps>(function Tecla(
  { children, className, ...rest },
  ref,
) {
  return (
    <kbd ref={ref} className={cx('amb-tecla', className)} {...rest}>
      {children}
    </kbd>
  )
})
