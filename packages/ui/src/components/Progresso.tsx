import { forwardRef, useId, type HTMLAttributes } from 'react'
import { cx } from '../utils/cx'
import './Progresso.css'

export type ProgressoTom = 'brand' | 'success' | 'warning' | 'danger'
export type ProgressoSize = 'sm' | 'md' | 'lg'

export interface ProgressoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'> {
  /** Quanto já foi, de 0 a `max`. Fora da faixa é grampeado — ver `normalizar`. */
  valor?: number
  /** @default 100 */
  max?: number
  /** O que está progredindo. Vira texto visível E o nome acessível da barra. */
  rotulo?: string
  /** Mostra "42%" ao lado do rótulo. */
  mostrarValor?: boolean
  /** @default 'brand' */
  tom?: ProgressoTom
  /** @default 'md' */
  size?: ProgressoSize
  /**
   * Está acontecendo, mas não dá para saber quanto falta. **Ignora `valor`** — e é
   * assim que tem que ser: barra indeterminada com número é mentira.
   */
  indeterminado?: boolean
}

/**
 * Grampeia o valor na faixa válida.
 *
 * Progresso vem de conta feita em produção (`enviados / total`), e produção manda
 * lixo: `total` zero vira `Infinity`, uma soma errada vira 120%, um contador que
 * decrementa vira negativo. Estourar a barra para fora do trilho ou renderizar
 * `aria-valuenow="NaN"` seria transformar um erro de dado em bug visual e em leitor de
 * tela quebrado. Grampeia, e a tela continua honesta dentro do que dá.
 */
function normalizar(valor: number, max: number): { valor: number; max: number; pct: number } {
  // max inválido (0, negativo, NaN, Infinity) → volta ao padrão 100. Dividir por zero
  // aqui daria Infinity e a barra sumiria sem ninguém entender por quê.
  const maxSeguro = Number.isFinite(max) && max > 0 ? max : 100

  // NaN e Infinity são erros DIFERENTES e viram coisas diferentes:
  // · NaN ("não é número", saiu de 0/0) → 0. Não dá para afirmar nada, então nada foi.
  // · Infinity (saiu de x/0) → é um número acima de qualquer max, e cai na mesma regra
  //   de "acima do max vira max". Uma exceção a menos para lembrar.
  const valorSeguro = Number.isNaN(valor) ? 0 : Math.min(Math.max(valor, 0), maxSeguro)

  return { valor: valorSeguro, max: maxSeguro, pct: (valorSeguro / maxSeguro) * 100 }
}

/**
 * Progresso — quanto falta.
 *
 * ## A decisão que quase todo mundo erra: `aria-valuenow` ausente ≠ zero
 *
 * Quando `indeterminado`, `aria-valuenow` é **omitido**, não zerado. A norma ARIA trata
 * os dois como coisas diferentes, e o leitor de tela também:
 *
 * · `aria-valuenow="0"` → "0 por cento". A pessoa entende que a tarefa está PARADA no
 *   começo, e fica esperando um número que nunca vem.
 * · sem `aria-valuenow` → "ocupado". A pessoa entende que está andando e que ninguém
 *   sabe quanto falta — que é a verdade.
 *
 * Zerar por comodidade (o atributo "sempre presente" é mais fácil de escrever) troca
 * uma informação correta por uma mentira precisa.
 *
 * ## Por que a barra não é `role="alert"`
 *
 * `progressbar` já carrega o estado por conta própria. Quem quiser anunciar o começo do
 * carregamento usa o `role="status"` do Esqueleto ou do Giro — assertivo aqui faria o
 * leitor de tela interromper a pessoa a cada tique da barra.
 *
 * @example
 * <Progresso valor={42} rotulo="Sincronizando pedidos" mostrarValor />
 *
 * @example Não dá para saber quanto falta — e a barra diz isso
 * <Progresso indeterminado rotulo="Consultando o Bling" />
 */
export const Progresso = forwardRef<HTMLDivElement, ProgressoProps>(function Progresso(
  {
    valor = 0,
    max = 100,
    rotulo,
    mostrarValor,
    tom = 'brand',
    size = 'md',
    indeterminado = false,
    className,
    ...rest
  },
  ref,
) {
  const idRotulo = useId()
  const n = normalizar(valor, max)
  const temTopo = Boolean(rotulo) || Boolean(mostrarValor)

  return (
    <div className={cx('amb-progresso', className)} {...rest}>
      {temTopo && (
        <div className="amb-progresso__topo">
          {rotulo && (
            <span className="amb-progresso__rotulo" id={idRotulo}>
              {rotulo}
            </span>
          )}
          {/* Nada de "0%" no indeterminado: a barra não sabe, então não fala. */}
          {mostrarValor && !indeterminado && (
            <span className="amb-progresso__valor">{Math.round(n.pct)}%</span>
          )}
        </div>
      )}

      <div
        ref={ref}
        role="progressbar"
        // Rótulo visível vira o nome acessível por referência (aria-labelledby): assim
        // o texto existe uma vez só. Sem rótulo, cai num nome genérico — barra sem nome
        // nenhum é anunciada como "barra de progresso" e a pessoa não sabe do quê.
        aria-labelledby={rotulo ? idRotulo : undefined}
        aria-label={rotulo ? undefined : 'Progresso'}
        aria-valuemin={0}
        aria-valuemax={n.max}
        // O ponto do componente: ausente ≠ zero. Ver o bloco de documentação acima.
        aria-valuenow={indeterminado ? undefined : n.valor}
        className={cx('amb-progresso__trilho', `amb-progresso__trilho--${size}`)}
      >
        <div
          className={cx(
            'amb-progresso__barra',
            `amb-progresso__barra--${tom}`,
            indeterminado && 'amb-progresso__barra--indeterminada',
          )}
          // Largura inline: é o único valor que só existe em tempo de execução.
          // Indeterminada tem largura própria no CSS — aqui não mandamos nada.
          style={indeterminado ? undefined : { width: `${n.pct}%` }}
        />
      </div>
    </div>
  )
})
