import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'
import { cx } from '../utils/cx'
import './Esqueleto.css'

export type EsqueletoVariante = 'texto' | 'circulo' | 'retangulo'

export interface EsqueletoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * `texto` — linhas de parágrafo (use `linhas`).
   * `circulo` — avatar, ícone.
   * `retangulo` — imagem, gráfico, card.
   * @default 'texto'
   */
  variante?: EsqueletoVariante
  /** Número = px. String = CSS ('100%', '12rem'). */
  largura?: number | string
  /** Número = px. String = CSS. No `circulo`, ignorado: círculo usa `largura` nos dois eixos. */
  altura?: number | string
  /**
   * Quantas linhas de texto. Só faz sentido em `variante="texto"`.
   * @default 1
   */
  linhas?: number
  /**
   * O que está carregando. Vira o anúncio do leitor de tela.
   * @default 'Carregando'
   */
  rotulo?: string
  /**
   * Desliga o anúncio e deixa o bloco 100% decorativo.
   *
   * **Use numa lista**: dez linhas de esqueleto com dez `role="status"` fazem o leitor
   * de tela dizer "carregando" dez vezes. Aí o certo é `anunciar={false}` em cada linha
   * e UM anúncio no container da lista.
   * @default true
   */
  anunciar?: boolean
}

/** number → px; string passa direto. Poupa quem escreve `largura={120}` de digitar 'px'. */
function medida(v: number | string | undefined): string | undefined {
  return typeof v === 'number' ? `${v}px` : v
}

/**
 * Esqueleto — o formato do conteúdo antes do conteúdo.
 *
 * ## A decisão que quase todo mundo erra: o esqueleto é MUDO
 *
 * O esqueleto é um desenho do que vai chegar. Para quem usa leitor de tela, ele não é
 * nada — e é isso mesmo que tem que ser. Deixar as caixas visíveis à árvore de
 * acessibilidade faz a pessoa ouvir "grupo, grupo, grupo, grupo" e tentar navegar por
 * cinco retângulos vazios que somem em 300ms.
 *
 * Então: as formas são `aria-hidden`, e quem fala é **um** `role="status"` no container
 * — o mesmo padrão do StatCard. Uma frase ("Carregando"), uma vez, no lugar de um monte
 * de caixas vazias. Numa lista, `anunciar={false}` nos filhos e um anúncio só no topo.
 *
 * `status` e não `alert`: carregar é informação, não emergência — não corta a frase que
 * a pessoa está ouvindo.
 *
 * @example
 * <Esqueleto variante="texto" linhas={3} />
 * <Esqueleto variante="circulo" largura={42} />
 * <Esqueleto variante="retangulo" altura={180} />
 *
 * @example Lista: um anúncio só, não dez
 * <div role="status" aria-label="Carregando clientes">
 *   {[...Array(10)].map((_, i) => <Esqueleto key={i} anunciar={false} />)}
 * </div>
 */
export const Esqueleto = forwardRef<HTMLDivElement, EsqueletoProps>(function Esqueleto(
  {
    variante = 'texto',
    largura,
    altura,
    linhas = 1,
    rotulo = 'Carregando',
    anunciar = true,
    className,
    style,
    ...rest
  },
  ref,
) {
  // Menos de 1 linha não existe. Vem de `linhas={dados.length}` com lista vazia — e
  // renderizar nada aqui deixaria a tela pular do vazio para o conteúdo.
  const qtd = variante === 'texto' ? Math.max(1, Math.floor(linhas)) : 1

  const forma = (i: number): CSSProperties => {
    // A ÚLTIMA linha é curta. Parágrafo de verdade termina no meio da linha; retângulos
    // do mesmo comprimento empilhados não parecem texto, parecem tabela cinza. É o
    // detalhe que faz o esqueleto ser lido como "vem texto aqui".
    const ultimaDeVarias = qtd > 1 && i === qtd - 1
    if (variante === 'circulo') {
      const d = medida(largura) ?? '40px'
      return { width: d, height: d }
    }
    return {
      width: ultimaDeVarias ? '60%' : (medida(largura) ?? '100%'),
      height: medida(altura),
    }
  }

  return (
    <div
      ref={ref}
      className={cx('amb-esqueleto', `amb-esqueleto--${variante}`, className)}
      // Um anúncio para o bloco todo — ver o bloco de documentação acima.
      role={anunciar ? 'status' : undefined}
      aria-label={anunciar ? rotulo : undefined}
      // Sem anúncio, some inteiro da árvore de acessibilidade: é decoração pura.
      aria-hidden={anunciar ? undefined : true}
      style={style}
      {...rest}
    >
      {Array.from({ length: qtd }, (_, i) => (
        <span
          key={i}
          className="amb-esqueleto__forma"
          style={forma(i)}
          // As formas nunca são narradas — nem quando o container anuncia. Quem tem o
          // texto é o aria-label do container; a caixa é o desenho.
          aria-hidden="true"
        />
      ))}
    </div>
  )
})
