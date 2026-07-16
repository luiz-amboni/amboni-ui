import { forwardRef, type HTMLAttributes } from 'react'
import { cx } from '../utils/cx'
import './Giro.css'

export type GiroSize = 'sm' | 'md' | 'lg'

export interface GiroProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'> {
  /**
   * `sm` dentro de botão/linha de tabela, `md` em card, `lg` em tela cheia.
   * @default 'md'
   */
  size?: GiroSize
  /**
   * O que está carregando. **Vale a pena ser específico**: "Carregando" é melhor que
   * nada, mas "Carregando campanhas" diz à pessoa qual pedaço da tela está ocupado —
   * ela não precisa adivinhar se travou ou se é outra coisa.
   * @default 'Carregando'
   */
  rotulo?: string
  /** Ocupa a linha inteira e centraliza. Para "a área toda está carregando". */
  centralizado?: boolean
}

/**
 * Giro — carregando.
 *
 * ## Por que o rótulo é obrigatório (com padrão)
 *
 * Um giro é uma imagem em movimento: para quem usa leitor de tela, é o nada absoluto.
 * A pessoa fica sem saber se a página está trabalhando ou se travou de vez — e a
 * resposta a essas duas situações é oposta (esperar × recarregar). Por isso `rotulo`
 * tem padrão em vez de ser opcional-de-verdade: não existe Giro mudo saindo daqui.
 *
 * ## Por que `role="status"` e não `role="alert"`
 *
 * "Está carregando" é informação, não emergência. `status` (= `aria-live="polite"`)
 * espera a pessoa terminar de ouvir a frase atual. Um spinner que corta a leitura a
 * cada requisição tornaria o painel impossível de usar por leitor de tela.
 *
 * @example
 * <Giro rotulo="Carregando campanhas" centralizado />
 *
 * @example Dentro de um botão — aí o botão já se anuncia por aria-busy
 * <Giro size="sm" aria-hidden="true" />
 */
export const Giro = forwardRef<HTMLDivElement, GiroProps>(function Giro(
  { size = 'md', rotulo = 'Carregando', centralizado, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      // status, não alert: carregar é informação, não emergência. Ver o bloco acima.
      role="status"
      // O rótulo VIVE no aria-label e não em texto visível: o giro precisa caber em
      // botão e em célula de tabela. Quem enxerga já entende pelo movimento.
      aria-label={rotulo}
      className={cx('amb-giro', centralizado && 'amb-giro--centralizado', className)}
      {...rest}
    >
      <span className={cx('amb-giro__anel', `amb-giro__anel--${size}`)} aria-hidden="true" />
    </div>
  )
})
