import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * `primary` — a ação principal da tela. **Uma só por tela.** Duas ações primárias
   * competindo é o mesmo que nenhuma.
   * `secondary` — a alternativa (Cancelar, Voltar).
   * `ghost` — ação terciária, sem peso visual.
   * `danger` — destrutivo e irreversível. Sempre com rótulo explícito ("Excluir"),
   * nunca só a cor: parte das pessoas não distingue vermelho.
   * @default 'secondary'
   */
  variant?: ButtonVariant
  /** @default 'md' */
  size?: ButtonSize
  /** Ocupa a largura toda (comum em formulário no celular). */
  block?: boolean
  /**
   * Mostra giro e bloqueia o clique. O rótulo some visualmente mas continua ocupando
   * espaço — assim o botão não encolhe e "foge" do dedo no meio do clique.
   */
  loading?: boolean
  /** Ícone antes do rótulo. Decorativo — quem narra o botão é o texto. */
  iconLeft?: ReactNode
  /** Ícone depois do rótulo. */
  iconRight?: ReactNode
  children?: ReactNode
}

/**
 * Botão.
 *
 * As cores vêm do tema e já passaram no teste de contraste (@amboni/tokens), então
 * ele é legível em iSafe/VEAR × claro/escuro sem nenhum ajuste no produto.
 *
 * @example
 * <Button variant="primary" onClick={salvar}>Salvar alterações</Button>
 * <Button variant="danger" loading={apagando}>Excluir cliente</Button>
 *
 * @example Só ícone — o rótulo acessível é OBRIGATÓRIO
 * <Button aria-label="Fechar"><X /></Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    block,
    loading = false,
    iconLeft,
    iconRight,
    children,
    className,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  // Sem filho de texto = botão só de ícone (fica quadrado).
  const somenteIcone = !children && Boolean(iconLeft ?? iconRight)

  if (process.env.NODE_ENV !== 'production' && somenteIcone && !rest['aria-label']) {
    // Botão só com ícone é mudo para leitor de tela. Avisa em desenvolvimento em vez
    // de deixar passar — este é o erro de acessibilidade mais comum em painéis.
    console.warn(
      '[@amboni/ui] <Button> só com ícone precisa de aria-label. ' +
        'Sem ele, quem usa leitor de tela ouve apenas "botão".',
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      // `type="button"` por padrão: o default do HTML é "submit", que dentro de um
      // <form> envia o formulário sem querer. Bug clássico e difícil de achar.
      className={cx(
        'amb-btn',
        'amb-focus-ring',
        `amb-btn--${variant}`,
        `amb-btn--${size}`,
        somenteIcone && 'amb-btn--icon',
        block && 'amb-btn--block',
        className,
      )}
      disabled={disabled ?? loading}
      data-amb-loading={loading || undefined}
      // aria-busy avisa o leitor de tela que a ação está em curso.
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="amb-btn__spinner" aria-hidden="true" />}
      <span className="amb-btn__label" style={{ display: 'contents' }}>
        {iconLeft && <span aria-hidden="true" style={{ display: 'inline-flex' }}>{iconLeft}</span>}
        {children}
        {iconRight && <span aria-hidden="true" style={{ display: 'inline-flex' }}>{iconRight}</span>}
      </span>
    </button>
  )
})
