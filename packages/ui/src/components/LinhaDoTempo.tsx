import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './LinhaDoTempo.css'

export type LinhaDoTempoTom = 'neutro' | 'marca' | 'sucesso' | 'aviso' | 'perigo' | 'info'
export type LinhaDoTempoOrientacao = 'vertical' | 'horizontal'

/** A forma do pontinho. É ela que carrega o tom para quem não distingue as cores. */
type Forma = 'ponto-vazado' | 'ponto-cheio' | 'check' | 'alerta' | 'x' | 'info'

/**
 * Cada tom tem uma FORMA própria, e não só uma cor.
 *
 * A regra da casa é "cor nunca sozinha", e aqui ela é literal: 1 em cada 12 homens não
 * separa o verde do vermelho, e num histórico de envios "deu certo" e "falhou" ficariam
 * idênticos — dois pontinhos cinzas iguais. Com forma, o ✓ e o ✕ se distinguem no
 * monocromático, na impressão e no tema de alto contraste do sistema.
 */
const FORMA_POR_TOM: Record<LinhaDoTempoTom, Forma> = {
  neutro: 'ponto-vazado',
  marca: 'ponto-cheio',
  sucesso: 'check',
  aviso: 'alerta',
  perigo: 'x',
  info: 'info',
}

export interface ItemLinhaDoTempo {
  /** Chave do React. Use o id do evento — índice do array reordena errado ao inserir. */
  id: string | number
  /** O que aconteceu. É ELE que informa — ver a nota sobre `tom`. */
  titulo: ReactNode
  /** Detalhe: quem fez, o valor, o motivo. */
  descricao?: ReactNode
  /**
   * Quando. `Date`, ISO completo (`2026-07-16T14:32:00-03:00`) ou só a data
   * (`2026-07-16`) — este último é tratado como dia LOCAL, ver `analisarData`.
   */
  data: string | Date
  /**
   * O texto legível da data. Sem ele, sai a data formatada no idioma de quem está
   * lendo. Passe quando quiser o jeito do produto ("há 3 dias", "ontem às 14h").
   * O formato de máquina continua no `dateTime`, então nada se perde.
   */
  dataTexto?: ReactNode
  /** Substitui a forma padrão do tom. Decorativo — quem narra o evento é o título. */
  icone?: ReactNode
  /** @default 'neutro' */
  tom?: LinhaDoTempoTom
}

export interface LinhaDoTempoProps extends Omit<HTMLAttributes<HTMLOListElement>, 'children'> {
  /** Os eventos, na ordem em que devem ser lidos (normalmente o mais novo primeiro). */
  itens: ItemLinhaDoTempo[]
  /** @default 'vertical' */
  orientacao?: LinhaDoTempoOrientacao
  /** Menos respiro entre eventos. Para caber num painel lateral. @default false */
  compacta?: boolean
}

const SO_DATA = /^\d{4}-\d{2}-\d{2}$/

/**
 * Descobre o valor de máquina e o texto legível de uma data.
 *
 * ## A armadilha do dia que anda para trás
 *
 * `new Date('2026-07-16')` **não** é 16 de julho aqui. Uma string só-data é lida pela
 * norma como meia-noite em **UTC**; no Brasil (UTC−3) isso é 15 de julho às 21h, e a
 * linha do tempo mostra o dia anterior ao que o banco tem. O bug é sutil (some entre 21h
 * e meia-noite, aparece no resto do dia), sazonal e sempre culpam o backend.
 *
 * `new Date('2026-07-16T00:00:00')` — a mesma string SEM o `Z` — é lida como meia-noite
 * LOCAL, que é o que uma data sem hora quer dizer. Uma data de nascimento, uma data de
 * compra, um vencimento: nenhum deles tem fuso.
 *
 * Já `Date` e ISO com hora vêm com o instante certo embutido e passam direto.
 */
function analisarData(data: string | Date): { d: Date; iso: string; soData: boolean } {
  if (data instanceof Date) {
    const valida = !Number.isNaN(data.getTime())
    return { d: data, iso: valida ? data.toISOString() : '', soData: false }
  }
  if (SO_DATA.test(data)) {
    return { d: new Date(`${data}T00:00:00`), iso: data, soData: true }
  }
  return { d: new Date(data), iso: data, soData: false }
}

/**
 * Formata no idioma de QUEM ESTÁ LENDO (`undefined` = locale do navegador).
 *
 * Cravar 'pt-BR' seria o caminho fácil — os dois produtos são em português —, mas o
 * `Intl` já resolve, é da plataforma (não é dependência nova) e não custa nada. Data
 * é o tipo de coisa que a pessoa lê no formato que ela conhece, ou lê errado.
 */
function textoDaData(d: Date, soData: boolean): string {
  return d.toLocaleString(
    undefined,
    soData
      ? { day: '2-digit', month: 'short', year: 'numeric' }
      : { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  )
}

/** ✓ e ✕ desenhados aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function Glifo({ forma }: { forma: Forma }) {
  if (forma === 'check') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
        <path d="M1.5 5.2 L4 7.5 L8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (forma === 'x') {
    return (
      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
        <path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    )
  }
  if (forma === 'alerta') return <span className="amb-linha-tempo__glifo">!</span>
  if (forma === 'info') return <span className="amb-linha-tempo__glifo">i</span>
  // ponto-cheio e ponto-vazado não têm glifo: a forma É o próprio pontinho (o CSS
  // preenche um e deixa o outro vazado). Um "•" dentro de um círculo seria redundante.
  return null
}

/**
 * LinhaDoTempo — o histórico de um cliente, de um pedido, de uma campanha.
 *
 * ## Por que `<ol>` e não um monte de `<div>`
 *
 * Isto é uma lista ORDENADA de eventos, e a ordem é metade da informação. Com `<ol>`, quem
 * usa leitor de tela ouve "lista de 8 itens" antes de entrar e "item 3 de 8" em cada
 * parada: sabe o tamanho do histórico, sabe onde está e pode pular a lista inteira com um
 * comando. Com `<div>`, tudo isso vira um texto corrido em que "Mensagem enviada 14:32
 * Mensagem entregue 14:33" chega sem fronteira nenhuma entre um evento e o outro.
 *
 * ## `tom` não é informação nova
 *
 * O tom (e a forma) reforçam o que o **título** já diz. "Envio falhou" com pontinho ✕
 * vermelho é a mesma frase duas vezes — de propósito. O componente não injeta um
 * "erro:" escondido para leitor de tela justamente porque isso duplicaria o anúncio no
 * caso normal. Se o título não contar o que aconteceu, nenhum pontinho conta.
 *
 * @example
 * <LinhaDoTempo itens={[
 *   { id: 1, titulo: 'Mensagem entregue', data: '2026-07-16T14:33:00-03:00', tom: 'sucesso' },
 *   { id: 2, titulo: 'Envio falhou', descricao: 'Número sem WhatsApp', data: pedido.criadoEm, tom: 'perigo' },
 * ]} />
 */
export const LinhaDoTempo = forwardRef<HTMLOListElement, LinhaDoTempoProps>(function LinhaDoTempo(
  { itens, orientacao = 'vertical', compacta = false, className, ...rest },
  ref,
) {
  return (
    // <ol> com a lista de eventos. `list-style: none` no CSS tira a bolinha, e o CSS
    // reexplica por que isso exige `role="list"` no Safari.
    <ol
      ref={ref}
      role="list"
      className={cx(
        'amb-linha-tempo',
        `amb-linha-tempo--${orientacao}`,
        compacta && 'amb-linha-tempo--compacta',
        className,
      )}
      {...rest}
    >
      {itens.map((item, i) => {
        const tom = item.tom ?? 'neutro'
        const forma = FORMA_POR_TOM[tom]
        const { d, iso, soData } = analisarData(item.data)
        const dataValida = !Number.isNaN(d.getTime()) && iso !== ''
        // Último item: a linha que sai do pontinho não é desenhada. Sem isto sobra um
        // traço pendurado embaixo do último evento, sugerindo que vem mais coisa.
        const ultimo = i === itens.length - 1

        if (process.env.NODE_ENV !== 'production' && !dataValida) {
          console.warn(
            `[@amboni/ui] <LinhaDoTempo> recebeu uma data que o navegador não entende: ` +
              `${String(item.data)}. Use Date ou ISO 8601 — o <time dateTime> exige formato ` +
              `de máquina, e texto solto ali é HTML inválido. Para "há 3 dias", use dataTexto.`,
          )
        }

        return (
          <li key={item.id} className="amb-linha-tempo__item">
            {/* O eixo — pontinho e linha — é DESENHO. Sem aria-hidden o leitor de tela
                lê um ruído a cada evento ("gráfico", "!"), e o "!" do tom aviso viraria
                literalmente a palavra "exclamação" no meio do histórico. */}
            <span className="amb-linha-tempo__eixo" aria-hidden="true">
              <span
                className={cx('amb-linha-tempo__ponto', `amb-linha-tempo__ponto--${tom}`)}
                // A forma vai no DOM para o teste poder provar que dois tons diferentes
                // não são só duas cores. É o invariante do "cor nunca sozinha".
                data-amb-forma={item.icone ? 'icone' : forma}
              >
                {item.icone ?? <Glifo forma={forma} />}
              </span>
              {!ultimo && <span className="amb-linha-tempo__linha" />}
            </span>

            <div className="amb-linha-tempo__conteudo">
              <p className="amb-linha-tempo__titulo">{item.titulo}</p>

              {/* <time>: o formato legível fica no texto, o de máquina no atributo. É o
                  que deixa o navegador, o leitor de tela e um raspador entenderem "16 de
                  jul." como uma data — e não como uma frase qualquer. */}
              {dataValida ? (
                <time className="amb-linha-tempo__data" dateTime={iso}>
                  {item.dataTexto ?? textoDaData(d, soData)}
                </time>
              ) : (
                // Data que não dá para interpretar vira texto puro: <time dateTime="ontem">
                // é HTML inválido e não ajuda ninguém. O aviso acima já apontou o dedo.
                <span className="amb-linha-tempo__data">{item.dataTexto ?? String(item.data)}</span>
              )}

              {item.descricao && <p className="amb-linha-tempo__descricao">{item.descricao}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
})
