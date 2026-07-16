import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './Card.css'

export type CardElevation = 'flat' | 'raised' | 'floating'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `flat` (padrão) — numa tela cheia de dados, sombra em tudo vira ruído. Quando
   * tudo está elevado, nada está.
   * `raised` — separa do fundo sem gritar.
   * `floating` — para o que realmente flutua (menu, modal).
   * @default 'flat'
   */
  elevation?: CardElevation
  /**
   * Torna o card inteiro clicável. **Vira um `<button>` de verdade** — não uma div com
   * onClick. Isso não é detalhe: uma div não recebe foco, não responde a Enter/Espaço e
   * o leitor de tela não anuncia que dá para clicar.
   */
  onCardClick?: () => void
  children?: ReactNode
}

/**
 * Card — a superfície que agrupa conteúdo relacionado.
 *
 * @example
 * <Card>
 *   <CardHeader title="Campanhas" subtitle="ativas primeiro" />
 *   <CardBody>…</CardBody>
 * </Card>
 *
 * @example Clicável (vira <button>, com teclado e foco de graça)
 * <Card onCardClick={abrirDetalhe}>…</Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevation = 'flat', onCardClick, className, children, ...rest },
  ref,
) {
  const classes = cx(
    'amb-card',
    `amb-card--${elevation}`,
    onCardClick && 'amb-card--interactive amb-focus-ring',
    className,
  )

  if (onCardClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onCardClick}
        {...(rest as HTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    )
  }

  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  )
})

// Omit<'title'>: o HTML já tem um atributo `title` (a dica que aparece ao passar o
// mouse) e ele só aceita string. A nossa prop `title` é o TÍTULO do card e aceita
// ReactNode — os dois não cabem no mesmo nome. Sem o Omit, o TypeScript recusa a
// interface inteira. Mesmo caminho que o MUI usa.
export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** O título do card (não confundir com o atributo title do HTML, que é tooltip). */
  title: ReactNode
  subtitle?: ReactNode
  /** Canto direito: filtro, botão, menu. */
  action?: ReactNode
  /**
   * Nível do título no documento (h2, h3…). **Importe-se com isto:** quem usa leitor de
   * tela navega pelos títulos como um índice. Nível pulado (h2 → h4) quebra o índice.
   * @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

export function CardHeader({
  title, subtitle, action, headingLevel = 3, className, ...rest
}: CardHeaderProps) {
  const H = `h${headingLevel}` as const
  return (
    <div className={cx('amb-card__header', className)} {...rest}>
      <div style={{ minWidth: 0 }}>
        <H className="amb-card__title">{title}</H>
        {subtitle && <p className="amb-card__subtitle">{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** Sem respiro interno — para tabela, que precisa encostar na borda do card. */
  flush?: boolean
}

export function CardBody({ flush, className, ...rest }: CardBodyProps) {
  return <div className={cx('amb-card__body', flush && 'amb-card__body--flush', className)} {...rest} />
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('amb-card__footer', className)} {...rest} />
}
