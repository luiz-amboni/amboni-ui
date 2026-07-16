import { useEffect, useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import { EstadoVazio } from './EstadoVazio'
import './Tabela.css'

export type Direcao = 'asc' | 'desc'
export type Alinhamento = 'esquerda' | 'direita' | 'centro'

/** Volta do `chaveLinha`. Id de banco costuma ser número; slug, string. Aceita os dois. */
export type ChaveDeLinha = string | number

export interface Ordem {
  /** O `chave` da coluna ordenada. String, não `keyof T`: coluna calculada tem id próprio. */
  coluna: string
  direcao: Direcao
}

interface ColunaBase<T> {
  /** Vira versalete no cabeçalho. Curto. */
  titulo: ReactNode
  /**
   * Alinhamento do conteúdo. Só mexa quando `numerico` não resolver — texto à direita
   * é difícil de varrer com o olho, a coluna perde a margem de leitura da esquerda.
   * @default 'esquerda' (ou 'direita' quando `numerico`)
   */
  alinhar?: Alinhamento
  /**
   * Dinheiro, contagem, percentual. Alinha à direita e liga `tabular-nums` — ver o
   * comentário no CSS, é o detalhe que faz coluna de dinheiro ser comparável.
   */
  numerico?: boolean
  /** Mostra o botão de ordenar no cabeçalho. A ordenação em si é sua (`onOrdenar`). */
  ordenavel?: boolean
  /**
   * Força esta coluna a ser (ou não) o cabeçalho da linha — o `<th scope="row">`.
   * Por padrão é a primeira coluna, que num CRM é sempre o nome de quem/do quê.
   * O leitor de tela repete esse valor ao andar pelas células: "João Silva, Valor,
   * R$ 1.200". Sem isso, a pessoa ouve "R$ 1.200" e não sabe de quem é.
   */
  cabecalhoDeLinha?: boolean
}

/** Coluna que aponta para um campo real de `T`. `render` é opcional — o padrão é imprimir o campo. */
interface ColunaCampo<T> extends ColunaBase<T> {
  chave: Extract<keyof T, string>
  render?: (linha: T) => ReactNode
}

/** Coluna calculada (não existe campo com esse nome). Aí `render` é OBRIGATÓRIO. */
interface ColunaCalculada<T> extends ColunaBase<T> {
  chave: string
  render: (linha: T) => ReactNode
}

/**
 * União de propósito, e ela vale mais do que parece: sem `render`, o TypeScript só
 * aceita `chave` que exista em `T` — um typo em `'valorr'` não compila. Com `render`,
 * `chave` vira id livre (coluna "Ações", "Status calculado"). Ou seja: você não
 * consegue pedir um campo que não existe e receber célula vazia em produção.
 */
export type Coluna<T> = ColunaCampo<T> | ColunaCalculada<T>

export interface TabelaProps<T> {
  colunas: ReadonlyArray<Coluna<T>>
  linhas: readonly T[]
  /**
   * Identidade da linha. **Obrigatório de propósito** — o índice do array não serve.
   * Ao reordenar, o React reaproveita o DOM pela key: com índice, a linha 3 continua
   * sendo "3" mesmo com outro cliente dentro, e o estado preso à posição (o checkbox
   * marcado, o foco, a linha aberta) fica na linha errada. Já aconteceu de o usuário
   * ordenar a lista e apagar o cliente errado por causa disso.
   */
  chaveLinha: (linha: T) => ChaveDeLinha
  /**
   * Nome acessível da tabela (vira `<caption>` invisível). Numa tela com 3 tabelas,
   * é o que diferencia "tabela" de "tabela" na lista do leitor de tela.
   */
  rotulo?: string
  /** Por onde está ordenada. Só marca o cabeçalho — quem ordena os dados é você. */
  ordem?: Ordem
  /** A tabela não reordena nada sozinha: em CRM a ordenação quase sempre é do servidor. */
  onOrdenar?: (coluna: string, direcao: Direcao) => void
  carregando?: boolean
  /** Quantas linhas de esqueleto. Aproxime da página real para o layout não pular. @default 5 */
  linhasEsqueleto?: number
  /** O que mostrar sem dados. Passe um `<EstadoVazio>` que EXPLIQUE o motivo. */
  vazio?: ReactNode
  /** Clique na linha inteira. Leia o JSDoc do componente antes de usar. */
  onLinhaClick?: (linha: T) => void
  /** Liga a coluna de caixas de seleção. */
  selecionaveis?: boolean
  selecionadas?: readonly ChaveDeLinha[]
  onSelecionar?: (chaves: ChaveDeLinha[]) => void
  /** Prende a primeira coluna ao rolar na horizontal — o nome não some da vista. */
  colunaFixa?: boolean
  className?: string
}

/** Seta desenhada aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function SetaOrdem({ direcao }: { direcao: Direcao | null }) {
  return (
    <svg
      className={cx('amb-tabela__seta', direcao && 'amb-tabela__seta--ativa')}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="currentColor"
      // Decorativa: quem anuncia a ordenação é o aria-sort no <th>. Se esta seta
      // tivesse texto, o leitor de tela leria a ordem duas vezes.
      aria-hidden="true"
    >
      <path d={direcao === 'asc' ? 'M6 2.5 L9.5 7.5 H2.5 Z' : 'M6 9.5 L2.5 4.5 H9.5 Z'} />
    </svg>
  )
}

function conteudoCelula<T>(coluna: Coluna<T>, linha: T): ReactNode {
  if (coluna.render) return coluna.render(linha)

  // O cast é seguro pelo contrato lá de cima: sem `render`, `chave` é `keyof T`. O
  // TypeScript só não consegue provar isso depois que a união virou `Coluna<T>`.
  const valor = (linha as Record<string, unknown>)[coluna.chave]

  // Célula em branco é ambígua: não dá para saber se o dado é vazio ou se a coluna
  // quebrou. O traço afirma "olhamos, e não há valor" — mesma lição do StatCard.
  if (valor === null || valor === undefined || valor === '') {
    return <span className="amb-tabela__sem-valor">—</span>
  }

  // Objeto cru (Date, {}, array) derruba a árvore inteira do React com "Objects are
  // not valid as a React child" — a tabela toda vira tela branca. Um "[object Object]"
  // feio é melhor que isso, e denuncia na hora que falta um `render` nessa coluna.
  if (typeof valor === 'object') return String(valor)

  return valor as ReactNode
}

/**
 * Tabela — a tela de trabalho de um CRM.
 *
 * É um `<table>` de verdade. Isso não é purismo: quem usa leitor de tela navega tabela
 * célula a célula (Ctrl+Alt+setas no VoiceOver) e ouve "Valor, coluna 3 de 5, R$ 1.200,
 * linha 7" — e isso vem do navegador, de graça, só com a marcação certa. Divs com
 * `role="table"` perdem tudo isso: cada célula vira um texto solto sem coordenada.
 *
 * Não ordena, não pagina e não filtra sozinha. Em CRM esses três moram no servidor —
 * uma tabela que ordena só a página atual mente para quem olha.
 *
 * @example
 * <Tabela
 *   rotulo="Clientes"
 *   colunas={[
 *     { chave: 'nome', titulo: 'Cliente', ordenavel: true },
 *     { chave: 'valor', titulo: 'Valor', numerico: true, ordenavel: true, render: (l) => fmt(l.valor) },
 *   ]}
 *   linhas={clientes}
 *   chaveLinha={(l) => l.id}
 *   ordem={ordem}
 *   onOrdenar={(coluna, direcao) => setOrdem({ coluna, direcao })}
 *   vazio={<EstadoVazio titulo="Nenhum cliente com esse filtro" acao={<Button onClick={limpar}>Limpar filtros</Button>} />}
 * />
 *
 * @example Dentro de Card — o `flush` existe para isto: a tabela encosta na borda
 * <Card>
 *   <CardHeader title="Últimas vendas" />
 *   <CardBody flush><Tabela … /></CardBody>
 * </Card>
 */
export function Tabela<T>({
  colunas,
  linhas,
  chaveLinha,
  rotulo,
  ordem,
  onOrdenar,
  carregando = false,
  linhasEsqueleto = 5,
  vazio,
  onLinhaClick,
  selecionaveis = false,
  selecionadas,
  onSelecionar,
  colunaFixa = false,
  className,
}: TabelaProps<T>) {
  const marcarTodasRef = useRef<HTMLInputElement>(null)

  // Set para consultar em O(1): `selecionadas.includes()` dentro do map faz a tabela
  // ser O(linhas × selecionadas) a cada render — com 500 linhas o clique começa a
  // engasgar. A API externa continua array, que é o que cabe num useState.
  const selecionadasSet = useMemo(() => new Set(selecionadas ?? []), [selecionadas])

  const vazia = !carregando && linhas.length === 0
  const totalColunas = colunas.length + (selecionaveis ? 1 : 0)

  const chavesVisiveis = useMemo(() => linhas.map(chaveLinha), [linhas, chaveLinha])
  const todasMarcadas = chavesVisiveis.length > 0 && chavesVisiveis.every((c) => selecionadasSet.has(c))
  const algumasMarcadas = !todasMarcadas && chavesVisiveis.some((c) => selecionadasSet.has(c))

  // `indeterminate` (o tracinho no lugar do check) NÃO existe como atributo em HTML —
  // só como propriedade do DOM. É por isso que precisa de ref: não há como escrever
  // isso em JSX. Sem ele, seleção parcial parece "nenhuma marcada" e a pessoa clica
  // achando que vai marcar tudo — e desmarca o que tinha.
  useEffect(() => {
    if (marcarTodasRef.current) marcarTodasRef.current.indeterminate = algumasMarcadas
  }, [algumasMarcadas])

  if (process.env.NODE_ENV !== 'production' && vazia && !vazio) {
    // Tabela vazia sem explicação é uma tela muda: a pessoa não sabe se filtrou demais,
    // se não há cadastro ainda, ou se quebrou. Avisa em desenvolvimento, como o Button
    // faz com o aria-label.
    console.warn(
      '[@amboni/ui] <Tabela> sem dados e sem a prop `vazio`. ' +
        'Passe um <EstadoVazio> dizendo POR QUE está vazia e o que fazer.',
    )
  }

  function ordenarPor(coluna: Coluna<T>) {
    if (!onOrdenar) return
    const jaOrdenada = ordem?.coluna === coluna.chave
    // Primeiro clique numa coluna de número abre em decrescente: quem clica em "Valor"
    // quer ver o maior primeiro — ninguém procura o menor pedido do mês. Texto abre em
    // A→Z, que é como se procura um nome.
    const direcao: Direcao = jaOrdenada ? (ordem.direcao === 'asc' ? 'desc' : 'asc') : coluna.numerico ? 'desc' : 'asc'
    onOrdenar(coluna.chave, direcao)
  }

  function alternarTodas() {
    if (!onSelecionar) return
    const outras = (selecionadas ?? []).filter((c) => !chavesVisiveis.includes(c))
    // Preserva o que estava marcado fora desta página: com filtro ou paginação, marcar
    // tudo aqui não pode apagar silenciosamente a seleção que a pessoa fez antes.
    onSelecionar(todasMarcadas ? outras : [...outras, ...chavesVisiveis])
  }

  function alternarUma(chave: ChaveDeLinha) {
    if (!onSelecionar) return
    const atuais = selecionadas ?? []
    onSelecionar(selecionadasSet.has(chave) ? atuais.filter((c) => c !== chave) : [...atuais, chave])
  }

  function teclaNaLinha(e: KeyboardEvent<HTMLTableRowElement>, linha: T) {
    if (!onLinhaClick) return
    // Só reage quando o foco está na LINHA. Sem esta guarda, o Espaço que marca o
    // checkbox borbulha até aqui e abre o cliente sem querer.
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault() // Espaço rola a página se deixar passar
      onLinhaClick(linha)
    }
  }

  return (
    // Rolagem: o container é focável e é uma região com nome de propósito. Um bloco que
    // rola e não recebe foco é inalcançável para quem não usa mouse — a pessoa
    // simplesmente não chega nas colunas da direita. É o erro mais comum de tabela
    // larga, e o preço (uma parada a mais no Tab) é barato perto de dados invisíveis.
    <div
      className={cx('amb-tabela__rolagem', 'amb-focus-ring', className)}
      tabIndex={0}
      role="region"
      aria-label={rotulo ?? 'Tabela'}
    >
      <table className={cx('amb-tabela', colunaFixa && 'amb-tabela--fixa')}>
        {/* <caption> é o jeito nativo de nomear tabela — some do olho, fica para o leitor
            de tela. Visível seria repetir o título que o CardHeader já mostra. */}
        {rotulo && <caption className="amb-sr-only">{rotulo}</caption>}

        <thead className="amb-tabela__cabecalho">
          <tr>
            {selecionaveis && (
              <th scope="col" className="amb-tabela__cel-sel">
                <input
                  ref={marcarTodasRef}
                  type="checkbox"
                  className="amb-tabela__caixa amb-focus-ring"
                  checked={todasMarcadas}
                  onChange={alternarTodas}
                  disabled={chavesVisiveis.length === 0}
                  aria-label="Selecionar todas as linhas"
                />
              </th>
            )}

            {colunas.map((coluna) => {
              const ordenadaPor = ordem?.coluna === coluna.chave
              const alinhar = coluna.alinhar ?? (coluna.numerico ? 'direita' : 'esquerda')

              return (
                <th
                  key={coluna.chave}
                  scope="col"
                  className={cx(
                    'amb-tabela__th',
                    `amb-tabela__celula--${alinhar}`,
                    coluna.numerico && 'amb-tabela__celula--num',
                  )}
                  // aria-sort é o que responde "por onde esta tabela está ordenada?".
                  // Sem ele a seta é puro enfeite visual e a informação não existe para
                  // quem não a enxerga. Fica só na coluna ordenada — em todas seria
                  // ruído; e em coluna não ordenável não tem sentido nenhum.
                  aria-sort={
                    coluna.ordenavel && onOrdenar
                      ? ordenadaPor
                        ? ordem.direcao === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                >
                  {coluna.ordenavel && onOrdenar ? (
                    // <button> dentro do <th>, não onClick no <th>: cabeçalho clicável
                    // que não é botão não recebe foco, não responde a Enter e não é
                    // anunciado como algo acionável.
                    <button
                      type="button"
                      className="amb-tabela__botao-ordem amb-focus-ring"
                      onClick={() => ordenarPor(coluna)}
                    >
                      {coluna.titulo}
                      <SetaOrdem direcao={ordenadaPor ? ordem.direcao : null} />
                    </button>
                  ) : (
                    coluna.titulo
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {carregando &&
            // Esqueleto NAS LINHAS, com as mesmas colunas: a tabela já nasce do tamanho
            // final e nada pula quando os dados chegam. Spinner solto encolhe a área e
            // empurra a página inteira no momento da troca.
            Array.from({ length: linhasEsqueleto }, (_, i) => (
              <tr key={`esqueleto-${i}`} className="amb-tabela__linha">
                {selecionaveis && (
                  <td className="amb-tabela__cel-sel">
                    <div className="amb-tabela__esqueleto" aria-hidden="true" />
                  </td>
                )}
                {colunas.map((coluna) => (
                  <td key={coluna.chave} className="amb-tabela__td">
                    {/* Aria-hidden: são 30 tracinhos cinza. Quem anuncia o estado é o
                        role="status" logo abaixo, uma vez só — senão o leitor de tela
                        soletra "carregando" trinta vezes. */}
                    <div className="amb-tabela__esqueleto" aria-hidden="true" />
                  </td>
                ))}
              </tr>
            ))}

          {vazia && (
            <tr>
              {/* colSpan conta a coluna das caixas: sem isso a célula não atravessa a
                  tabela e o estado vazio nasce torto, encolhido embaixo da 1ª coluna. */}
              <td colSpan={totalColunas} className="amb-tabela__td-vazio">
                {vazio ?? <EstadoVazio size="sm" titulo="Nada para mostrar aqui" />}
              </td>
            </tr>
          )}

          {!carregando &&
            linhas.map((linha) => {
              const chave = chaveLinha(linha)
              const marcada = selecionadasSet.has(chave)

              return (
                <tr
                  key={chave}
                  className={cx(
                    'amb-tabela__linha',
                    onLinhaClick && 'amb-tabela__linha--clicavel amb-focus-ring',
                    marcada && 'amb-tabela__linha--marcada',
                  )}
                  onClick={onLinhaClick ? () => onLinhaClick(linha) : undefined}
                  // Linha clicável precisa ser alcançável e responder a Enter. O ideal
                  // seria um <a> na primeira célula (dá "abrir em nova aba" de graça) —
                  // recomendado no JSDoc. Aqui garantimos o mínimo: foco e teclado.
                  tabIndex={onLinhaClick ? 0 : undefined}
                  onKeyDown={onLinhaClick ? (e) => teclaNaLinha(e, linha) : undefined}
                  aria-selected={selecionaveis ? marcada : undefined}
                >
                  {selecionaveis && (
                    // stopPropagation na CÉLULA inteira, não só na caixa: a área de
                    // clique útil é a célula, e sem isto marcar a caixa também abriria
                    // o cliente — o clique borbulha até o onClick da linha.
                    <td className="amb-tabela__cel-sel" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="amb-tabela__caixa amb-focus-ring"
                        checked={marcada}
                        onChange={() => alternarUma(chave)}
                        aria-label={`Selecionar linha ${chave}`}
                      />
                    </td>
                  )}

                  {colunas.map((coluna, i) => {
                    const alinhar = coluna.alinhar ?? (coluna.numerico ? 'direita' : 'esquerda')
                    const ehCabecalho = coluna.cabecalhoDeLinha ?? i === 0
                    const classes = cx(
                      ehCabecalho ? 'amb-tabela__th-linha' : 'amb-tabela__td',
                      `amb-tabela__celula--${alinhar}`,
                      coluna.numerico && 'amb-tabela__celula--num',
                      colunaFixa && i === 0 && 'amb-tabela__celula--fixa',
                    )
                    const conteudo = conteudoCelula(coluna, linha)

                    return ehCabecalho ? (
                      // scope="row": esta célula NOMEIA a linha. É o que faz o leitor de
                      // tela dizer "João Silva, Valor, R$ 1.200" em vez de "R$ 1.200".
                      <th key={coluna.chave} scope="row" className={classes}>
                        {conteudo}
                      </th>
                    ) : (
                      <td key={coluna.chave} className={classes}>
                        {conteudo}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
        </tbody>
      </table>

      {carregando && (
        // Fora da tabela e uma vez só: role="status" avisa sem roubar o foco de onde a
        // pessoa está.
        <span className="amb-sr-only" role="status">
          {`Carregando ${rotulo ?? 'dados da tabela'}`}
        </span>
      )}
    </div>
  )
}
