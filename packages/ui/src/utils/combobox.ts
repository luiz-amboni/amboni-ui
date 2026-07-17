import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import './combobox.css'

/**
 * O miolo do padrão combobox (APG), sem nenhuma opinião sobre desenho.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * ## Por que isto existe
 *
 * Esta biblioteca tem DOIS comboboxes, e eles são diferentes de verdade:
 *
 *  · `Selecao buscavel` — lista **fechada e curta**, filtrada aqui mesmo, um valor só.
 *  · `Autocomplete` — lista **grande ou do servidor**, com busca assíncrona, seleção
 *    múltipla e "criar novo".
 *
 * O que NÃO é diferente é a máquina: qual item está marcado, como as setas andam, o que
 * o Enter faz, quando a lista fecha, quem escuta o clique de fora, e o contrato ARIA que
 * amarra tudo (`aria-activedescendant` + `aria-controls`). Escrever isso duas vezes é
 * garantir que os dois divirjam no primeiro ajuste — o Enter passa a pular a opção
 * desabilitada num e não no outro, e ninguém descobre até um cliente reclamar.
 *
 * Então o miolo mora aqui e os dois componentes o consomem. O que ficou fora é o que é
 * genuinamente de cada um: o modelo de valor (uma string × um array), o que o campo
 * mostra quando fechado, e de onde vêm os itens.
 */

/** O mínimo que qualquer opção precisa ter. Selecao e Autocomplete estendem. */
export interface OpcaoBase {
  /** O que vai para o `onChange` e para o banco. */
  valor: string
  /** O que a pessoa lê. */
  rotulo: string
  /**
   * Existe, mas não pode ser escolhida agora. **Não é o mesmo que sumir da lista**:
   * some quando não faz sentido; desabilita quando faz sentido mas está bloqueada
   * (e aí a pessoa entende que a opção existe).
   */
  desabilitada?: boolean
}

/**
 * Tira acento e caixa para comparar. Quem digita "sao" tem que achar "São Paulo":
 * ninguém acentua enquanto filtra, e uma busca que exige acento parece quebrada.
 */
export function normalizar(texto: string): string {
  // U+0300–U+036F = os acentos que o NFD separa da letra. Escrito por código, e não com os
  // caracteres literais, porque combinantes soltos num arquivo-fonte somem em qualquer
  // ferramenta que reindente ou normalize o texto.
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/** Anda pela lista pulando as desabilitadas, circulando nas pontas. -1 = não há nenhuma válida. */
export function proximoIndiceValido(
  itens: ReadonlyArray<{ desabilitada?: boolean }>,
  de: number,
  passo: number,
): number {
  const total = itens.length
  if (total === 0) return -1
  let i = de
  for (let volta = 0; volta < total; volta++) {
    i = (i + passo + total) % total
    if (!itens[i].desabilitada) return i
  }
  return -1
}

export interface ArgsCombobox<T extends { desabilitada?: boolean }> {
  /** A lista JÁ na ordem e no recorte que a pessoa vê. Os índices daqui são os que valem. */
  itens: readonly T[]
  /** Chamado no Enter e no clique. O item desabilitado nunca chega aqui. */
  aoEscolher: (indice: number) => void
  /**
   * Onde a marca ativa nasce ao abrir. A `Selecao` começa na opção já escolhida (a lista é
   * curta, e reabrir no que está valendo é o esperado); o `Autocomplete` começa na primeira.
   * @default primeira válida
   */
  indiceInicialAoAbrir?: () => number
  /** Efeito colateral do fechamento — tipicamente limpar o texto do filtro. */
  aoFechar?: () => void
  /**
   * **Quando esta string muda, a marca ativa volta para a primeira opção válida.**
   *
   * É `string` e não a lista de itens de propósito. Reancorar por identidade do array
   * parece mais elegante e é uma armadilha: quem passar `opcoes={[...]}` inline cria um
   * array novo a cada render, e a marca ativa seria zerada no meio da navegação — a seta
   * "não anda" e ninguém liga o sintoma à causa. Passe aqui o texto da busca.
   */
  reancorarQuando: string
  disabled?: boolean
}

export interface Combobox<E extends HTMLElement = HTMLElement> {
  aberto: boolean
  abrir: () => void
  fechar: () => void
  indiceAtivo: number
  setIndiceAtivo: (i: number) => void
  /** Vai no `id` da lista e no `aria-controls` do campo — é este par que liga os dois. */
  idLista: string
  idOpcao: (i: number) => string
  /** Já resolvido: o id da opção ativa, ou `undefined` quando não há. Vai no `aria-activedescendant`. */
  idAtivo: string | undefined
  /** Na raiz que envolve campo + lista. É o `contains` do clique de fora que depende dele. */
  raizRef: RefObject<HTMLDivElement | null>
  /** Guarda o disabled: o item travado não passa. Use no `onClick` da opção. */
  escolher: (indice: number) => void
  /** Devolve `true` se tratou a tecla — quem chama pode agir antes e sair na frente. */
  aoTeclar: (e: KeyboardEvent<E>) => boolean
}

export function useCombobox<T extends { desabilitada?: boolean }, E extends HTMLElement = HTMLInputElement>({
  itens,
  aoEscolher,
  indiceInicialAoAbrir,
  aoFechar,
  reancorarQuando,
  disabled,
}: ArgsCombobox<T>): Combobox<E> {
  const idBase = useId()
  const idLista = `${idBase}-lista`
  const idOpcao = useCallback((i: number) => `${idBase}-opcao-${i}`, [idBase])

  const [aberto, setAberto] = useState(false)
  const [indiceAtivo, setIndiceAtivo] = useState(-1)
  const raizRef = useRef<HTMLDivElement>(null)

  // Refs para o `aoTeclar` não precisar ser recriado (e não obrigar quem chama a
  // memoizar handlers) sem nunca ler item velho.
  const itensRef = useRef(itens)
  itensRef.current = itens
  const aoEscolherRef = useRef(aoEscolher)
  aoEscolherRef.current = aoEscolher
  const aoFecharRef = useRef(aoFechar)
  aoFecharRef.current = aoFechar
  const inicialRef = useRef(indiceInicialAoAbrir)
  inicialRef.current = indiceInicialAoAbrir

  const fechar = useCallback(() => {
    setAberto(false)
    setIndiceAtivo(-1)
    aoFecharRef.current?.()
  }, [])

  const abrir = useCallback(() => {
    if (disabled) return
    setAberto(true)
    const pedido = inicialRef.current?.()
    setIndiceAtivo(
      pedido !== undefined && pedido >= 0 ? pedido : proximoIndiceValido(itensRef.current, -1, 1),
    )
  }, [disabled])

  const escolher = useCallback((indice: number) => {
    const item = itensRef.current[indice]
    if (!item || item.desabilitada) return
    aoEscolherRef.current(indice)
  }, [])

  // Digitou → a lista mudou de tamanho e o índice antigo aponta para outra opção. Reancorar na
  // primeira válida é o que impede o Enter de escolher algo que a pessoa nem viu.
  useEffect(() => {
    if (aberto) setIndiceAtivo(proximoIndiceValido(itensRef.current, -1, 1))
    // Só quando a busca muda. `aberto` e `itens` aqui são leitura, não gatilho — ver a nota
    // em `reancorarQuando`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reancorarQuando])

  // Fecha ao apontar para fora. `pointerdown` e não `click`: o fechamento tem que acompanhar o
  // gesto, não esperar o dedo levantar. E o `contains` não é detalhe — sem ele, o toque na
  // PRÓPRIA opção desmontaria a lista antes do `click` chegar nela, e o onChange nunca rodaria.
  useEffect(() => {
    if (!aberto) return
    function aoApontar(e: PointerEvent) {
      if (!raizRef.current?.contains(e.target as Node)) fechar()
    }
    document.addEventListener('pointerdown', aoApontar)
    return () => document.removeEventListener('pointerdown', aoApontar)
  }, [aberto, fechar])

  // A opção ativa tem que estar visível — navegar por seta até um item fora da área rolável
  // deixa a pessoa às cegas.
  useEffect(() => {
    if (!aberto || indiceAtivo < 0) return
    const el = document.getElementById(idOpcao(indiceAtivo))
    // jsdom não implementa scrollIntoView. Sem a checagem, o teste explode num detalhe visual.
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
  }, [aberto, indiceAtivo, idOpcao])

  const aoTeclar = useCallback(
    (e: KeyboardEvent<E>): boolean => {
      const lista = itensRef.current
      switch (e.key) {
        case 'ArrowDown':
          // preventDefault senão o cursor de texto pula para o fim do campo junto.
          e.preventDefault()
          if (!aberto) abrir()
          else setIndiceAtivo(i => proximoIndiceValido(lista, i, 1))
          return true
        case 'ArrowUp':
          e.preventDefault()
          if (!aberto) abrir()
          else setIndiceAtivo(i => proximoIndiceValido(lista, i, -1))
          return true
        case 'Home':
          if (!aberto) return false
          e.preventDefault()
          setIndiceAtivo(proximoIndiceValido(lista, -1, 1))
          return true
        case 'End':
          if (!aberto) return false
          e.preventDefault()
          setIndiceAtivo(proximoIndiceValido(lista, 0, -1))
          return true
        case 'Enter':
          // preventDefault só quando há o que escolher: com a lista fechada, o Enter tem que
          // continuar enviando o formulário como em qualquer campo.
          if (!aberto || indiceAtivo < 0) return false
          e.preventDefault()
          escolher(indiceAtivo)
          return true
        case 'Escape':
          if (!aberto) return false
          e.preventDefault()
          // stopPropagation: dentro de um Dialogo, o mesmo Esc fecharia a lista E o modal
          // atrás dela. Um Esc, um nível.
          e.stopPropagation()
          fechar()
          return true
        case 'Tab':
          // Sem preventDefault: o Tab tem que sair do campo. Só garantimos que a lista não
          // fique órfã, aberta, sobre o resto da tela.
          if (aberto) fechar()
          return false
        default:
          return false
      }
    },
    [aberto, abrir, fechar, escolher, indiceAtivo],
  )

  return {
    aberto,
    abrir,
    fechar,
    indiceAtivo,
    setIndiceAtivo,
    idLista,
    idOpcao,
    idAtivo: aberto && indiceAtivo >= 0 ? idOpcao(indiceAtivo) : undefined,
    raizRef,
    escolher,
    aoTeclar,
  }
}
