import { type ReactNode } from 'react'
import { Card } from './Card'
import { cx } from '../utils/cx'
import './StatCard.css'

export type StatTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'

export interface StatDelta {
  /**
   * Variação em %. Negativo = caiu.
   *
   * Abaixo de 1% (em módulo) vira "estável", não "0%": um "0%" com seta para cima é
   * contraditório, e "estável" é o que a pessoa queria saber.
   */
  percent: number
  /**
   * Se subir é bom. **Omita quando não há julgamento** — gastar menos não é bom nem
   * ruim por si só, e pintar de verde uma queda de investimento mente para quem lê.
   */
  betterWhenUp?: boolean
  /** Texto após o número. @default 'vs. anterior' */
  suffix?: string
}

export interface StatCardProps {
  /** O que o número significa. Curto — vira versalete. */
  label: string
  /**
   * O valor JÁ FORMATADO ("R$ 1.994,31", "91%", "140").
   * `null` = carregando (mostra esqueleto).
   * `'—'` ou `''` = vazio (mostra o `emptyReason`).
   */
  value: string | null
  /** Ícone. Decorativo — o rótulo é que informa. */
  icon?: ReactNode
  /** Linha de apoio: de onde vem o número, ou o cálculo. */
  sub?: ReactNode
  /**
   * Por que está vazio. **Um traço solto não informa nada** — a pessoa fica sem saber
   * se quebrou ou se é zero mesmo.
   */
  emptyReason?: string
  /** @default 'brand' */
  tone?: StatTone
  /** Variação vs. período anterior. Um número sozinho não diz se está bom. */
  delta?: StatDelta
  className?: string
}

/** Seta desenhada aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function Seta({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  const d = dir === 'up' ? 'M7 3.5 L11 8 H8.5 V11 H5.5 V8 H3 Z'
    : dir === 'down' ? 'M7 10.5 L3 6 H5.5 V3 H8.5 V6 H11 Z'
    : 'M3 6.25 H11 V7.75 H3 Z'
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
}

function Delta({ percent, betterWhenUp, suffix = 'vs. anterior' }: StatDelta) {
  const estavel = Math.abs(percent) < 1
  const subiu = percent > 0
  // Sem `betterWhenUp`, não há julgamento — fica cinza. Ver o comentário na prop.
  const bom = betterWhenUp === undefined ? null : betterWhenUp === subiu
  const tom = estavel || bom === null ? 'neutral' : bom ? 'good' : 'bad'

  return (
    <span className={cx('amb-stat__delta', `amb-stat__delta--${tom}`)}>
      <Seta dir={estavel ? 'flat' : subiu ? 'up' : 'down'} />
      {/* A cor não carrega o significado sozinha: a seta e o texto também dizem. */}
      {estavel ? 'estável' : `${Math.abs(percent).toFixed(0)}%`}
      <span className="amb-stat__delta-sufixo">{suffix}</span>
    </span>
  )
}

/**
 * StatCard — um número que importa.
 *
 * O padrão mais copiado dos painéis: hoje existe reescrito em 3 páginas do iSafe e em
 * 4 do VEAR, todos ligeiramente diferentes. Este é o único.
 *
 * @example
 * <StatCard label="Investido no período" value="R$ 1.994,31" sub="159.111 exibições" />
 *
 * @example Com comparação — um número sozinho não diz se está bom
 * <StatCard
 *   label="Custo por pessoa" value="R$ 14,25" tone="warning"
 *   delta={{ percent: 46, betterWhenUp: false }}   // custo subindo = ruim
 *   sub="quanto menor, melhor"
 * />
 *
 * @example Vazio — explica em vez de deixar um traço mudo
 * <StatCard label="Retorno (ROAS)" value="—" emptyReason="precisa de vendas atribuídas" />
 */
export function StatCard({
  label, value, icon, sub, emptyReason, tone = 'brand', delta, className,
}: StatCardProps) {
  const carregando = value === null
  const vazio = !carregando && (value === '' || value === '—')

  return (
    <Card className={cx('amb-stat', className)} style={{ height: '100%' }}>
      {icon && (
        <div className={cx('amb-stat__icon', `amb-stat__icon--${tone}`)} aria-hidden="true">
          {icon}
        </div>
      )}

      <div className="amb-stat__content">
        <span className="amb-stat__label">{label}</span>

        {carregando ? (
          // O leitor de tela anuncia "carregando" em vez de ler um card vazio.
          <div className="amb-stat__skeleton" role="status" aria-label={`${label}: carregando`} />
        ) : (
          <div className={cx('amb-stat__value', vazio && 'amb-stat__value--empty')}>
            {vazio ? '—' : value}
          </div>
        )}

        {!carregando && (
          <div className="amb-stat__foot">
            {delta && !vazio && <Delta {...delta} />}
            {vazio && emptyReason ? (
              <span className="amb-stat__sub amb-stat__sub--empty">{emptyReason}</span>
            ) : (
              sub && <span className="amb-stat__sub">{sub}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
