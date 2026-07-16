import { Button } from './Button'
import { cx } from '../utils/cx'
import './Paginacao.css'

/**
 * Uma página, ou um buraco. As duas reticências são valores DIFERENTES de propósito: com
 * `'…'` nos dois lados, o React receberia duas chaves iguais na mesma lista e reclamaria.
 */
export type ItemPagina = number | 'elipse-inicio' | 'elipse-fim'

/**
 * A janela de páginas — a única parte da paginação que tem lógica de verdade.
 *
 * Com 100 páginas não dá para desenhar 100 botões, então mostra-se sempre a primeira, a
 * última, as vizinhas da atual, e colapsa-se o resto. Função pura e exportada porque é aqui
 * que mora todo o risco de erro; a régua de botões em volta é enfeite.
 *
 * Aguenta entrada suja de propósito (página 0, NaN, total negativo): ela é alimentada por
 * `?page=` da URL, que é texto que qualquer um digita.
 *
 * @param raio Quantas vizinhas de cada lado da atual. @default 1
 *
 * @example
 * janelaPaginas(50, 100)  // [1, 'elipse-inicio', 49, 50, 51, 'elipse-fim', 100]
 * janelaPaginas(4, 10)    // [1, 2, 3, 4, 5, 'elipse-fim', 10]  ← o 2 no lugar de "…"
 */
export function janelaPaginas(pagina: number, totalPaginas: number, raio = 1): ItemPagina[] {
  const total = Math.trunc(totalPaginas)
  // Total 0 = lista vazia. Não existe "página 1 de 0" — devolver [1] desenharia um botão
  // que navega para o nada.
  if (!Number.isFinite(total) || total < 1) return []

  const atual = clampPagina(pagina, total)
  const itens: ItemPagina[] = [1]
  if (total === 1) return itens

  const inicio = Math.max(2, atual - raio)
  const fim = Math.min(total - 1, atual + raio)

  // A regra fina dos dois lados: se o buraco tem UMA página só, mostra a página. O "…" ocupa
  // o mesmo espaço do número e ainda esconde para onde ele leva.
  if (inicio > 3) itens.push('elipse-inicio')
  else if (inicio === 3) itens.push(2)

  for (let p = inicio; p <= fim; p++) itens.push(p)

  if (fim < total - 2) itens.push('elipse-fim')
  else if (fim === total - 2) itens.push(total - 1)

  itens.push(total)
  return itens
}

/** Página fora da faixa não é erro: é `?page=999` colado no navegador. Prende na borda. */
function clampPagina(pagina: number, total: number): number {
  const p = Math.trunc(pagina)
  if (!Number.isFinite(p) || p < 1) return 1
  return Math.min(p, Math.max(1, total))
}

/** Opções padrão do seletor. 10/20/50/100 cobre o que um painel precisa sem virar menu longo. */
const OPCOES_POR_PAGINA = [10, 20, 50, 100]

/** pt-BR fixo: a biblioteca é brasileira e "1.234" com ponto é o que se lê aqui. */
const fmt = (n: number) => n.toLocaleString('pt-BR')

function Chevron({ dir }: { dir: 'esq' | 'dir' }) {
  // Desenhado aqui: a biblioteca não impõe pacote de ícones a quem instala.
  const d = dir === 'esq' ? 'M9.5 3.5 L5 8 L9.5 12.5' : 'M6.5 3.5 L11 8 L6.5 12.5'
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

export interface PaginacaoProps {
  pagina: number
  totalPaginas: number
  onChange: (pagina: number) => void
  /** Total de registros. Com `porPagina`, mostra o resumo "1–20 de 137". */
  totalItens?: number
  /** Tamanho da página. Precisa vir junto com `totalItens` para o resumo aparecer. */
  porPagina?: number
  /**
   * Habilita o seletor de itens por página.
   * **Volte para a página 1 ao trocar**: quem estava na página 9 de 10 com 10 itens fica fora
   * da faixa ao pular para 100 por página. O componente não faz isso sozinho — um `onChange`
   * disparado por baixo do pano é pior que o problema que resolve.
   */
  onPorPaginaChange?: (porPagina: number) => void
  /** @default 'md' */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Paginação.
 *
 * @example
 * <Paginacao pagina={p} totalPaginas={10} onChange={setP} />
 *
 * @example Completa — resumo e itens por página
 * <Paginacao
 *   pagina={p} totalPaginas={7} onChange={setP}
 *   totalItens={137} porPagina={20}
 *   onPorPaginaChange={n => { setPorPagina(n); setP(1) }}
 * />
 */
export function Paginacao({
  pagina,
  totalPaginas,
  onChange,
  totalItens,
  porPagina,
  onPorPaginaChange,
  size = 'md',
  className,
}: PaginacaoProps) {
  const total = Math.max(0, Math.trunc(totalPaginas) || 0)
  const atual = clampPagina(pagina, total)
  const itens = janelaPaginas(atual, total)

  const temResumo = totalItens !== undefined && porPagina !== undefined
  const temSeletor = onPorPaginaChange !== undefined && porPagina !== undefined

  // Com uma página só os botões não têm função — mas o resumo e o seletor continuam tendo.
  // Some tudo apenas quando não sobra nada: a linha desaparecendo faz a tabela pular de
  // altura toda vez que um filtro reduz o resultado a uma página.
  if (total <= 1 && !temResumo && !temSeletor) return null

  let resumo: string | null = null
  if (totalItens !== undefined && porPagina !== undefined) {
    if (totalItens === 0) resumo = 'Nenhum item'
    else {
      const de = (atual - 1) * porPagina + 1
      const ate = Math.min(atual * porPagina, totalItens)
      resumo = `${fmt(de)}–${fmt(ate)} de ${fmt(totalItens)}`
    }
  }

  const opcoes =
    porPagina !== undefined && !OPCOES_POR_PAGINA.includes(porPagina)
      ? // Um porPagina fora da lista (25, vindo da URL) entra na lista em vez de sumir: um
        // <select> cujo valor não existe entre as opções mostra a primeira opção e mente.
        [...OPCOES_POR_PAGINA, porPagina].sort((a, b) => a - b)
      : OPCOES_POR_PAGINA

  return (
    <nav aria-label="Paginação" className={cx('amb-pag', className)}>
      {/* Trocar de página troca o conteúdo da tabela, longe daqui — sem isto, quem usa leitor
          de tela clica em "Próxima" e não ouve nada mudar. O role="status" já está no DOM
          desde o começo de propósito: uma região viva inserida junto com o texto não é
          anunciada. */}
      <span className="amb-sr-only" role="status">
        {total > 0 ? `Página ${atual} de ${total}` : 'Nenhuma página'}
      </span>

      {resumo && <span className="amb-pag__resumo amb-tabular">{resumo}</span>}

      {total > 1 && (
        <ul className="amb-pag__lista">
          <li>
            <Button
              variant="ghost"
              size={size}
              aria-label="Página anterior"
              disabled={atual <= 1}
              onClick={() => onChange(atual - 1)}
              iconLeft={<Chevron dir="esq" />}
            />
          </li>

          {itens.map(item =>
            typeof item === 'number' ? (
              <li key={item}>
                {/* Reusa o <Button> em vez de um botão próprio: paginação com botão de casa
                    nasce com outra altura, outro hover e outro anel de foco, e diverge do
                    resto do sistema no primeiro ajuste. O estado "página atual" cabe na
                    variante primary — não precisou parametrizar nada. */}
                <Button
                  variant={item === atual ? 'primary' : 'ghost'}
                  size={size}
                  className="amb-pag__num amb-tabular"
                  // aria-current já faz o leitor de tela anunciar "página atual". Repetir isso
                  // no rótulo faria alguns leitores dizerem duas vezes.
                  aria-current={item === atual ? 'page' : undefined}
                  aria-label={item === atual ? `Página ${item}` : `Ir para a página ${item}`}
                  // Clicar na página em que já se está não é navegação: sem o guarda, cada
                  // clique dispararia outra busca idêntica no servidor.
                  onClick={() => item !== atual && onChange(item)}
                >
                  {item}
                </Button>
              </li>
            ) : (
              // aria-hidden: "reticências" lido em voz alta não informa nada. Quem usa leitor
              // de tela tem o "Página 3 de 10" do role="status", que diz muito mais.
              <li key={item} className="amb-pag__elipse" aria-hidden="true">
                …
              </li>
            ),
          )}

          <li>
            <Button
              variant="ghost"
              size={size}
              aria-label="Próxima página"
              disabled={atual >= total}
              onClick={() => onChange(atual + 1)}
              iconLeft={<Chevron dir="dir" />}
            />
          </li>
        </ul>
      )}

      {temSeletor && onPorPaginaChange && (
        // <label> com texto visível em vez de aria-label: quem enxerga também precisa saber o
        // que é aquele "20" solto no canto.
        <label className="amb-pag__seletor">
          <span className="amb-pag__seletor-rotulo">Por página</span>
          {/* O `size` manda AQUI também. Este select tinha 32px cravados e ignorava a
              prop: ficava 4px mais baixo que os botões no `sm`, e 12px no `md` — bem ao
              lado deles. É a divergência exata que o token `--amb-altura-*` existe para
              impedir, e ela nasceu porque o CSS cravou o número em vez de ler o token.
              Ninguém abriria chamado; a barra só pareceria meio torta. */}
          <select
            className={cx('amb-pag__select', `amb-pag__select--${size}`, 'amb-focus-ring')}
            value={porPagina}
            onChange={e => onPorPaginaChange(Number(e.target.value))}
          >
            {opcoes.map(o => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  )
}
