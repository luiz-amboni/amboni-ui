import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cx } from '../utils/cx'
import { normalizar, useCombobox, type OpcaoBase } from '../utils/combobox'
import { Etiqueta } from './Etiqueta'
import './Autocomplete.css'

export type AutocompleteSize = 'sm' | 'md' | 'lg'

/** Mesma forma da `OpcaoSelecao`, sem `grupo` — ver a nota sobre grupos no JSDoc. */
export type OpcaoAutocomplete = OpcaoBase

/** O item "Criar “fulano”" é sintético: entra na lista para as setas e o ARIA o enxergarem. */
interface ItemLista extends OpcaoBase {
  criar?: boolean
}

interface AutocompleteBase
  extends Omit<HTMLAttributes<HTMLInputElement>, 'onChange' | 'children' | 'defaultValue' | 'value'> {
  /**
   * O que mostrar. Com `onBuscar`, é o resultado da última busca (e serve de lista inicial
   * antes da primeira). Sem `onBuscar`, é a lista inteira e o filtro acontece aqui.
   */
  opcoes: OpcaoAutocomplete[]
  /**
   * Busca no servidor. Devolva a lista já pronta. **Respostas fora de ordem são tratadas
   * aqui** — ver a nota sobre corrida no JSDoc do componente.
   *
   * Sem isto, o filtro é local (`opcoes` inteira, sem acento, sem caixa).
   */
  onBuscar?: (texto: string) => Promise<OpcaoAutocomplete[]>
  /**
   * Força o estado "buscando". Use quando a busca é sua (React Query, por exemplo) em vez
   * de `onBuscar`. Com `onBuscar`, o componente já sabe sozinho — isto só soma.
   */
  carregando?: boolean
  placeholder?: string
  /** O que dizer quando a busca não achou nada. @default 'Nada encontrado' */
  semResultado?: string
  /**
   * Só busca a partir daqui. Numa base de 10 mil clientes, buscar por "a" devolve 4 mil
   * linhas que ninguém vai ler e derruba o servidor a cada tecla. @default 0
   */
  minCaracteres?: number
  /**
   * Oferece "Criar “o que foi digitado”" no fim da lista, quando o texto não bate exatamente
   * com nenhuma opção. Recebe o texto cru — a criação (e o `onChange` depois dela) é sua.
   */
  criarNovo?: (texto: string) => void
  /** @default 'md' */
  size?: AutocompleteSize
  /**
   * A mensagem do erro. **É texto, não booleano, de propósito**: pintar a borda de vermelho
   * sem dizer o que está errado não conserta nada — e quem não distingue vermelho não vê
   * nem o aviso.
   */
  erro?: string
  disabled?: boolean
  id?: string
}

/**
 * O modelo de valor MUDA com `multiplo`, e o tipo acompanha: com `multiplo`, `valor` é um
 * array e o `onChange` devolve array. Uma união aqui é o que impede o erro de escrever
 * `valor={cliente}` num campo múltiplo e descobrir em produção.
 */
export type AutocompleteProps =
  | (AutocompleteBase & {
      multiplo?: false
      /** Controlado. `null` = nada escolhido (mostra o `placeholder`). */
      valor: string | null
      onChange: (valor: string | null) => void
    })
  | (AutocompleteBase & {
      multiplo: true
      /** Controlado. `[]` = nada escolhido. */
      valor: string[]
      onChange: (valor: string[]) => void
    })

/** Ícones desenhados aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function Lupa() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 9 L12.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Autocomplete — buscar numa lista GRANDE, ou que vem do servidor.
 *
 * ## Autocomplete ou Selecao buscável?
 *
 * O miolo dos dois é o mesmo código (`utils/combobox.ts`), então a escolha é só sobre a
 * NATUREZA da lista:
 *
 * · **`Selecao buscavel`** — lista **fechada e curta**: as 27 UFs, 8 categorias. Todas as
 *   opções cabem na memória e na tela, o filtro é local, e reabrir mostra tudo de novo.
 * · **`Autocomplete`** — lista **grande ou remota**: achar um cliente entre 10 mil. Não há
 *   "mostrar tudo" — a lista só existe como resposta a uma busca. É aqui que moram
 *   `onBuscar`, `minCaracteres`, `carregando`, `multiplo` e `criarNovo`.
 *
 * Na dúvida: **se dá para rolar a lista inteira e escolher, é Selecao.**
 *
 * ## A corrida — o bug clássico do assíncrono
 *
 * Quem digita "maria" dispara cinco buscas. Elas voltam **fora de ordem** (a rede não
 * promete nada), e a resposta de "mar" chegando DEPOIS da de "maria" pinta a tela com o
 * resultado errado — o campo mostra 300 nomes enquanto o texto diz "maria", e some quando
 * a pessoa digita mais uma letra. Ninguém reproduz isso na própria máquina; só aparece em
 * 4G ruim, que é onde os clientes estão.
 *
 * Aqui cada busca leva um número de série e **a resposta que não for da última busca é
 * descartada**. É o `buscaAtual` lá embaixo, e é a razão de este componente existir separado
 * da Selecao.
 *
 * ## Grupos não existem aqui, de propósito
 *
 * `OpcaoAutocomplete` não tem `grupo`. Agrupar pressupõe conhecer o conjunto inteiro — o que
 * é justamente o que não se tem quando a lista vem do servidor em pedaços. Se a sua lista dá
 * para agrupar, ela é curta o bastante para ser uma `Selecao`.
 *
 * @example Busca no servidor
 * <Autocomplete
 *   aria-label="Cliente" minCaracteres={2} placeholder="Busque pelo nome"
 *   opcoes={achados} valor={clienteId} onChange={setClienteId}
 *   onBuscar={async texto => (await api.get(`/clientes?q=${texto}`)).data}
 * />
 *
 * @example Múltiplo, com criação
 * <Autocomplete
 *   multiplo aria-label="Etiquetas" opcoes={tags} valor={escolhidas} onChange={setEscolhidas}
 *   criarNovo={nome => criarTag(nome)}
 * />
 *
 * @see Selecao — lista fechada e curta.
 */
export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(function Autocomplete(
  props,
  ref,
) {
  const {
    opcoes,
    onBuscar,
    carregando,
    placeholder,
    semResultado = 'Nada encontrado',
    minCaracteres = 0,
    criarNovo,
    size = 'md',
    erro,
    disabled,
    className,
    id: idProp,
    multiplo,
    valor,
    ...rest
  } = props as AutocompleteBase & { multiplo?: boolean; valor: string | string[] | null }

  // O <CampoForm> declara o erro UMA vez e injeta `aria-invalid` pelo clone. Ler o que
  // chega é o que faz este controle obedecer ao wrapper, igual a Campo e AreaTexto.
  const ariaInvalidDeFora = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'
  const idBase = useId()
  const idErro = `${idBase}-erro`
  const idStatus = `${idBase}-status`

  const [busca, setBusca] = useState('')
  const [remotas, setRemotas] = useState<OpcaoAutocomplete[] | null>(null)
  const [buscandoRemoto, setBuscandoRemoto] = useState(false)

  const campoRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => campoRef.current as HTMLInputElement, [])

  const escolhidos = useMemo(
    () => (multiplo ? (valor as string[]) ?? [] : valor ? [valor as string] : []),
    [multiplo, valor],
  )

  const textoCru = busca.trim()
  const abaixoDoMinimo = textoCru.length < minCaracteres
  /**
   * Campo intocado NÃO busca no servidor.
   *
   * Sem esta condição, montar a tela dispara `onBuscar('')` — uma busca vazia que devolve a
   * base inteira, antes de a pessoa digitar qualquer coisa. Numa listagem com seis
   * autocompletes é meia dúzia de consultas caras por abertura de página, e nenhuma delas
   * foi pedida. Enquanto não há texto, quem preenche a lista é a prop `opcoes`.
   */
  const deveBuscar = Boolean(onBuscar) && textoCru.length > 0 && !abaixoDoMinimo

  // ── A corrida ──────────────────────────────────────────────────────────────
  // Número de série da busca. A resposta que não for da ÚLTIMA disparada é jogada fora —
  // ver a nota no JSDoc. Fica em ref e não em estado: mudá-lo não deve renderizar nada, e
  // um estado aqui ainda daria o valor velho para o `await` de baixo.
  const buscaAtual = useRef(0)

  useEffect(() => {
    if (!onBuscar) return

    if (!deveBuscar) {
      // Sem texto (ou abaixo do mínimo) não se busca NEM se mostra o resultado anterior: a
      // lista velha ao lado de um texto novo é a mesma mentira que a resposta fora de ordem.
      // O `++` invalida a busca em voo — é o que impede a resposta de "ana" de aparecer
      // depois de a pessoa apagar tudo.
      buscaAtual.current += 1
      setRemotas(null)
      setBuscandoRemoto(false)
      return
    }

    const serie = ++buscaAtual.current
    setBuscandoRemoto(true)

    onBuscar(busca)
      .then(resultado => {
        // A resposta é de uma busca que já foi superada: descarta. SEM ISTO, "mar" chegando
        // depois de "maria" sobrescreve o resultado mais novo.
        if (serie !== buscaAtual.current) return
        setRemotas(resultado)
        setBuscandoRemoto(false)
      })
      .catch(() => {
        if (serie !== buscaAtual.current) return
        // Lista vazia + o texto de "nada encontrado". Deixar o "Buscando…" rodando para
        // sempre depois de um erro de rede é o pior dos mundos: a pessoa espera algo que
        // nunca vem.
        setRemotas([])
        setBuscandoRemoto(false)
      })
  }, [busca, deveBuscar, onBuscar])

  const filtradas = useMemo<OpcaoAutocomplete[]>(() => {
    // Abaixo do mínimo não há lista: há o aviso de que falta letra.
    if (abaixoDoMinimo) return []
    if (onBuscar) {
      // Sem texto, `opcoes` é a lista inicial (os últimos usados, os favoritos) — ver `deveBuscar`.
      if (!textoCru) return opcoes
      // Remoto: quem filtra é o servidor. Filtrar de novo aqui esconderia resultado que ele
      // achou por apelido, CPF ou telefone — coisas que não estão no rótulo.
      return remotas ?? []
    }
    const alvo = normalizar(busca)
    if (!alvo) return opcoes
    return opcoes.filter(o => normalizar(o.rotulo).includes(alvo))
  }, [onBuscar, remotas, opcoes, busca, textoCru, abaixoDoMinimo])

  const buscando = Boolean(carregando) || buscandoRemoto

  // No modo múltiplo o que já foi escolhido sai da lista: ele está ali em cima, como
  // etiqueta. Mostrar de novo convida a escolher duas vezes o mesmo.
  const disponiveis = useMemo(
    () => (multiplo ? filtradas.filter(o => !escolhidos.includes(o.valor)) : filtradas),
    [multiplo, filtradas, escolhidos],
  )

  const jaExiste = disponiveis.some(o => normalizar(o.rotulo) === normalizar(textoCru)) ||
    filtradas.some(o => normalizar(o.rotulo) === normalizar(textoCru))

  // O "criar" entra COMO ITEM DA LISTA, e não como um botão solto embaixo. É o que faz as
  // setas chegarem nele, o `aria-activedescendant` apontá-lo e o Enter escolhê-lo sem uma
  // segunda regra de teclado só para ele.
  const itens = useMemo<ItemLista[]>(() => {
    const base: ItemLista[] = [...disponiveis]
    if (criarNovo && textoCru && !jaExiste && !buscando && !abaixoDoMinimo) {
      base.push({ valor: `__criar__${textoCru}`, rotulo: `Criar “${textoCru}”`, criar: true })
    }
    return base
  }, [disponiveis, criarNovo, textoCru, jaExiste, buscando, abaixoDoMinimo])

  const aoEscolher = useCallback(
    (indice: number) => {
      const item = itens[indice]
      if (!item) return

      if (item.criar) {
        criarNovo?.(textoCru)
        setBusca('')
        cb.fechar()
        return
      }

      if (multiplo) {
        ;(props.onChange as (v: string[]) => void)([...escolhidos, item.valor])
        // Fica ABERTO: quem escolhe várias quer escolher a próxima, e reabrir a lista a cada
        // item transforma três cliques em nove. O campo é limpo para a próxima busca.
        setBusca('')
      } else {
        ;(props.onChange as (v: string | null) => void)(item.valor)
        cb.fechar()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itens, multiplo, escolhidos, criarNovo, textoCru, props.onChange],
  )

  // Toda a máquina do combobox vem do miolo compartilhado com a Selecao — `utils/combobox.ts`.
  const cb = useCombobox<ItemLista, HTMLInputElement>({
    itens,
    disabled,
    reancorarQuando: busca,
    aoEscolher,
    aoFechar: () => {
      // No modo único o campo mostra o rótulo do escolhido quando fechado, então o texto da
      // busca tem que sair do caminho. No múltiplo ele já é limpo a cada escolha.
      if (!multiplo) setBusca('')
    },
  })

  const selecionado = !multiplo ? opcoes.find(o => o.valor === valor) : undefined

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    // Backspace com o campo VAZIO remove a última etiqueta. É o comportamento que todo
    // campo de destinatário tem (e-mail, Slack, Jira) — quem usa espera, e sem isso a pessoa
    // precisa mirar num X de 16px para desfazer o que acabou de digitar.
    //
    // Antes do `cb.aoTeclar` porque é uma tecla que o combobox não trata: se o campo tem
    // texto, o Backspace é do navegador (apaga uma letra) e não passa por aqui.
    if (multiplo && e.key === 'Backspace' && busca === '' && escolhidos.length > 0) {
      e.preventDefault()
      ;(props.onChange as (v: string[]) => void)(escolhidos.slice(0, -1))
      return
    }
    cb.aoTeclar(e)
  }

  const mostrarLista = cb.aberto && !disabled
  const rotuloDe = (v: string) => opcoes.find(o => o.valor === v)?.rotulo ?? v

  // ── A contagem anunciada ───────────────────────────────────────────────────
  // Quem usa leitor de tela digita e não vê a lista crescer. Sem este aviso, a pessoa não
  // sabe se a busca achou 8 nomes ou nenhum — ela digita no escuro e o único jeito de
  // descobrir é apertar a seta para baixo e torcer. `role="status"` (polite) e não `alert`:
  // o anúncio espera a pessoa parar de digitar em vez de cortar a fala a cada tecla.
  const anuncio = !mostrarLista
    ? ''
    : buscando
      ? 'Buscando…'
      : abaixoDoMinimo
        ? `Digite ao menos ${minCaracteres} caracteres para buscar`
        : itens.length === 0
          ? semResultado
          : `${itens.length} ${itens.length === 1 ? 'resultado' : 'resultados'}`

  return (
    <div
      ref={cb.raizRef}
      className={cx(
        'amb-autocomplete',
        `amb-autocomplete--${size}`,
        erro && 'amb-autocomplete--erro',
        disabled && 'amb-autocomplete--desabilitado',
        className,
      )}
    >
      {/* O invólucro parece o campo; o <input> de dentro é transparente. É o que permite as
          etiquetas morarem DENTRO da moldura, com o cursor logo depois delas — que é o que
          as pessoas esperam de um campo de destinatários. */}
      <div
        className="amb-autocomplete__controle"
        // Clicar na sobra do campo (ao lado das etiquetas) tem que focar o campo. Sem isto,
        // a área maior da moldura é morta e a pessoa precisa acertar o texto fino.
        onClick={() => campoRef.current?.focus()}
      >
        <span className="amb-autocomplete__lupa" aria-hidden="true">
          <Lupa />
        </span>

        {multiplo &&
          escolhidos.map(v => (
            <Etiqueta
              key={v}
              size="sm"
              removivel
              // Diz O QUE remove: numa barra com 8 etiquetas, 8 botões "Remover" idênticos
              // deixam quem usa leitor de tela sem saber qual é qual.
              rotuloRemover={`Remover ${rotuloDe(v)}`}
              onRemover={() => (props.onChange as (x: string[]) => void)(escolhidos.filter(x => x !== v))}
            >
              {rotuloDe(v)}
            </Etiqueta>
          ))}

        <input
          // `rest` vem PRIMEIRO de propósito: o que este componente controla (valor, erro,
          // aria-describedby) tem que vencer o que passarem por fora. Espalhar por último
          // deixaria um `aria-describedby` do consumidor apagar o vínculo com o erro.
          {...rest}
          ref={campoRef}
          id={idProp}
          type="text"
          role="combobox"
          className="amb-autocomplete__campo"
          // autoComplete off: o preenchimento automático do navegador cobre a nossa lista
          // com a dele e a pessoa vê duas listas empilhadas.
          autoComplete="off"
          aria-expanded={mostrarLista}
          aria-controls={cb.idLista}
          aria-autocomplete="list"
          // É isto que faz o leitor de tela narrar a opção ativa SEM tirar o foco do campo.
          aria-activedescendant={cb.idAtivo}
          aria-invalid={erro || ariaInvalidDeFora ? true : undefined}
          aria-describedby={cx(erro && idErro, rest['aria-describedby']) || undefined}
          // Único e fechado: mostra a escolha. Aberto (ou múltiplo): mostra o que se digita.
          value={cb.aberto || multiplo ? busca : selecionado?.rotulo ?? ''}
          // No múltiplo o placeholder sumiria atrás das etiquetas e viraria ruído.
          placeholder={multiplo && escolhidos.length > 0 ? undefined : placeholder}
          disabled={disabled}
          onChange={e => {
            setBusca(e.target.value)
            if (!cb.aberto) cb.abrir()
          }}
          onClick={() => { if (!cb.aberto) cb.abrir() }}
          onKeyDown={aoTeclar}
        />

        {mostrarLista && (
          <ul
            id={cb.idLista}
            role="listbox"
            className="amb-combobox__lista"
            // O clique numa opção tiraria o foco do input (indo para o body, já que <li> não
            // é focável) e o combobox ficaria sem dono. O padrão APG exige o foco no campo.
            onMouseDown={e => e.preventDefault()}
          >
            {buscando && (
              // Texto, e não o <Giro>: o Giro é `role="status"`, uma região viva. Aninhada
              // dentro do listbox ela anunciaria "Carregando" junto com a nossa contagem —
              // duas falas para o mesmo fato, e uma delas dentro de um listbox, onde o
              // leitor de tela espera opções. Quem avisa aqui é o `role="status"` do rodapé.
              <li className="amb-combobox__carregando" role="presentation">
                <span className="amb-autocomplete__pulso" aria-hidden="true" />
                Buscando…
              </li>
            )}

            {!buscando && abaixoDoMinimo && (
              // Campo que não responde parece quebrado. Dizer o mínimo é o que evita a
              // pessoa digitar duas letras e concluir que a busca não funciona.
              <li className="amb-combobox__vazio" role="presentation">
                Digite ao menos {minCaracteres} {minCaracteres === 1 ? 'caractere' : 'caracteres'}
              </li>
            )}

            {!buscando && !abaixoDoMinimo && itens.length === 0 && (
              <li className="amb-combobox__vazio" role="presentation">
                {semResultado}
              </li>
            )}

            {!buscando &&
              !abaixoDoMinimo &&
              itens.map((item, i) => (
                <li
                  key={item.valor}
                  id={cb.idOpcao(i)}
                  role="option"
                  aria-selected={escolhidos.includes(item.valor)}
                  // aria-disabled e não `hidden`: a opção continua anunciada, só não é escolhível.
                  aria-disabled={item.desabilitada || undefined}
                  className={cx(
                    'amb-combobox__opcao',
                    i === cb.indiceAtivo && 'amb-combobox__opcao--ativa',
                    item.desabilitada && 'amb-combobox__opcao--desabilitada',
                    item.criar && 'amb-combobox__opcao--criar',
                  )}
                  onClick={() => cb.escolher(i)}
                >
                  {item.rotulo}
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* Fora da lista de propósito: uma região viva que é DESMONTADA junto com a lista não
          chega a ser anunciada — o leitor de tela precisa que o elemento já esteja no
          documento para notar a mudança de texto dentro dele. */}
      <p id={idStatus} role="status" className="amb-sr-only">
        {anuncio}
      </p>

      {/* Cor + PALAVRA. A borda vermelha sozinha não diz o que está errado. */}
      {erro && <p id={idErro} className="amb-autocomplete__erro">{erro}</p>}
    </div>
  )
})
