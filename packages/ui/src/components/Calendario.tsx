import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cx } from '../utils/cx'
import './Calendario.css'

/* ══════════════════════════════════════════════════════════════════════════════
 * Aritmética de data — a parte que parece trivial e não é
 *
 * Regra da casa, uma só: **aqui data é dia do calendário local, nunca instante.**
 * Nada de `Date.parse`, nada de string ISO, nada de UTC, nada de somar milissegundos.
 * Toda data que sai daqui é meia-noite LOCAL do dia certo.
 *
 * As três armadilhas que essas funções existem para não deixar acontecer:
 *
 *  1. `new Date('2026-06-15')` é lido como UTC — no Brasil vira 14/06 às 21h. A mesma
 *     linha em Tóquio vira 15/06 às 9h. É o bug de data mais comum que existe, e ele
 *     só aparece para quem está a oeste de Greenwich (ou seja: nós).
 *  2. Comparar por `getTime()` erra sempre que as horas diferem — 15/06 08:00 e
 *     15/06 22:00 são o mesmo DIA e dois instantes diferentes. Um seletor que compara
 *     instante marca o dia errado dependendo da hora em que a pessoa abriu a tela.
 *  3. Somar 24h ≠ dia seguinte. No dia em que o horário de verão entra, o dia tem 23h;
 *     `data.getTime() + 86400000` pula o dia ou repete. Por isso `somarDias` reconstrói
 *     a data pelo construtor (que resolve o estouro sozinho) em vez de somar tempo.
 *     O Brasil não tem mais horário de verão desde 2019 — mas a biblioteca é pública, e
 *     no Chile, no México e em quase toda a Europa tem.
 * ════════════════════════════════════════════════════════════════════════════ */

/**
 * Cria um dia do calendário local, à meia-noite. O construtor com estouro é intencional:
 * `criarData(2026, 0, 32)` é 01/02/2026, e é assim que `somarDias` atravessa mês e ano
 * sem uma única condicional.
 */
export function criarData(ano: number, mes: number, dia: number): Date {
  const d = new Date(ano, mes, dia)
  // Anos de 0 a 99 viram 19xx no construtor (compatibilidade com 1995). Quem digita
  // "15/06/26" quer 2026 e o parser já expande — mas esta função é pública, e o ano 26
  // d.C. não pode virar 1926 em silêncio só porque o JavaScript tem 30 anos.
  if (ano >= 0 && ano <= 99) d.setFullYear(ano)
  return d
}

/** Descarta a hora. Use antes de guardar ou comparar qualquer data que veio de fora. */
export function inicioDoDia(d: Date): Date {
  return criarData(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Mesmo DIA — não o mesmo instante. Ver a armadilha 2 no topo do arquivo. */
export function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function mesmoMes(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** -1 / 0 / 1 comparando só o dia. É o `<` e o `>` de data desta biblioteca. */
export function compararDias(a: Date, b: Date): number {
  const ma = a.getFullYear() * 10000 + a.getMonth() * 100 + a.getDate()
  const mb = b.getFullYear() * 10000 + b.getMonth() * 100 + b.getDate()
  return ma < mb ? -1 : ma > mb ? 1 : 0
}

/** Reconstrói pelo construtor em vez de somar 86.400.000 — ver a armadilha 3 no topo. */
export function somarDias(d: Date, n: number): Date {
  return criarData(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export function diasNoMes(ano: number, mes: number): number {
  // Dia 0 do mês seguinte = último dia deste mês. Aceita `mes` fora de 0–11 (o construtor
  // normaliza), que é o que permite `somarMeses` não tratar virada de ano na mão.
  return new Date(ano, mes + 1, 0).getDate()
}

/**
 * Soma meses **grampeando o dia no fim do mês**.
 *
 * `setMonth` não serve: em 31/01, `setMonth(1)` pede "31 de fevereiro" e o Date entrega
 * 03/03. O PageDown do calendário viraria de janeiro para MARÇO, pulando fevereiro
 * inteiro — e a pessoa nunca entende por quê. Aqui 31/01 + 1 mês = 28/02.
 */
export function somarMeses(d: Date, n: number): Date {
  const ano = d.getFullYear()
  const mes = d.getMonth() + n
  return criarData(ano, mes, Math.min(d.getDate(), diasNoMes(ano, mes)))
}

export function inicioDoMes(d: Date): Date {
  return criarData(d.getFullYear(), d.getMonth(), 1)
}

/* ══════════════════════════════════════════════════════════════════════════════
 * Semana e idioma — o Intl faz, nós não
 * ════════════════════════════════════════════════════════════════════════════ */

/** Um domingo qualquer, âncora para gerar os nomes dos dias da semana pelo Intl. */
const DOMINGO_REF = criarData(2024, 0, 7)

type LocaleComSemana = Intl.Locale & {
  weekInfo?: { firstDay?: number }
  getWeekInfo?: () => { firstDay?: number }
}

/**
 * As regiões onde a semana começa no DOMINGO, para os navegadores sem `weekInfo`.
 *
 * A tabela é curta de propósito. A resposta certa mora no CLDR, que tem ~200 regiões e
 * muda de tempos em tempos; copiá-lo para cá seria assumir a manutenção de um dado que
 * não é nosso e que envelhece calado. Quando o navegador expõe `weekInfo`, é o CLDR de
 * verdade que responde — esta lista só cobre o buraco (hoje: Firefox) para as regiões
 * que a biblioteca realmente atende. Para todo o resto, segunda-feira: é o padrão
 * ISO-8601 e o certo em quase toda a Europa.
 *
 * Atende uma região fora da lista num navegador sem `weekInfo`? Passe `primeiroDiaSemana`.
 */
const REGIOES_DOMINGO = new Set(['BR', 'US', 'CA', 'MX', 'JP', 'PT-BR'])

/** 0 = domingo … 6 = sábado. */
function detectarPrimeiroDia(locale: string): number {
  try {
    const info = new Intl.Locale(locale) as LocaleComSemana
    // Duas grafias porque a especificação mudou no meio do caminho: o Chrome entregou
    // `weekInfo` como propriedade e a proposta virou `getWeekInfo()`. Tentar as duas
    // custa uma linha e evita depender de qual navegador chegou primeiro.
    const semana = info.getWeekInfo?.() ?? info.weekInfo
    // O CLDR devolve 1 = segunda … 7 = domingo. O `% 7` traduz para a contagem do
    // `Date.getDay()` (0 = domingo), sem tabela de-para.
    if (semana?.firstDay) return semana.firstDay % 7

    const regiao = info.region ?? locale.split('-')[1]?.toUpperCase()
    return regiao && REGIOES_DOMINGO.has(regiao) ? 0 : 1
  } catch {
    // Locale inválido não pode derrubar a tela inteira por causa de uma coluna.
    return 0
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
 * Calendario
 * ════════════════════════════════════════════════════════════════════════════ */

/** Ponta a ponta de um intervalo. `null` nas duas pontas = nada escolhido ainda. */
export interface IntervaloDatas {
  inicio: Date | null
  fim: Date | null
}

export type SetasCalendario = 'ambas' | 'esquerda' | 'direita' | 'nenhuma'

export interface CalendarioProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** O dia escolhido. `null` = nenhum. */
  valor: Date | null
  /** Recebe o DIA (meia-noite local), não o evento. */
  onChange: (d: Date) => void
  /** Primeiro dia escolhível. Dias antes ficam desabilitados de verdade — a seta não pousa neles. */
  min?: Date
  /** Último dia escolhível. */
  max?: Date
  /** Desabilita dias avulsos (fim de semana, feriado, agenda cheia). Roda para cada célula. */
  desabilitar?: (d: Date) => boolean
  /**
   * O mês visível — qualquer data dentro dele. Controlado: se passar, precisa atualizar
   * no `onMesChange`, senão a navegação não sai do lugar. Omita para o Calendario cuidar sozinho.
   */
  mes?: Date
  onMesChange?: (mes: Date) => void
  /** @default 'pt-BR' */
  locale?: string
  /**
   * Força o começo da semana (0 = domingo). Só para quando a detecção erra — ver a nota
   * em `REGIOES_DOMINGO`. Por padrão quem responde é o `Intl`.
   */
  primeiroDiaSemana?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Pinta um intervalo. É o que o `CampoPeriodo` usa para desenhar as duas pontas, o miolo
   * e a prévia do mouse. Com `realce`, o `valor` some do desenho — são dois modos de seleção.
   */
  realce?: IntervaloDatas | null
  /** Mouse entrou num dia (ou saiu da grade, com `null`). Serve à prévia do intervalo. */
  onDiaEntrar?: (d: Date | null) => void
  /**
   * Quais setas de navegação aparecem. `esquerda`/`direita` existem para a vista de dois
   * meses, onde as setas ficam nas pontas de fora e o miolo respira.
   * @default 'ambas'
   */
  setas?: SetasCalendario
}

function Chevron({ duplo, invertido }: { duplo?: boolean; invertido?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={invertido ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d={duplo ? 'M8 3.5 L4.5 7 L8 10.5 M11.5 3.5 L8 7 L11.5 10.5' : 'M9 3.5 L5.5 7 L9 10.5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Calendario — a grade de dias.
 *
 * ## É uma tabela de verdade
 *
 * `<table role="grid">` com `<th scope="col">` nos dias da semana, e não uma pilha de
 * `<div>`. Um calendário **é** uma tabela: tem linhas (semanas), colunas (dias da semana) e
 * cabeçalho. Quem usa leitor de tela navega calendário como navega tabela — e num monte de
 * divs não há coluna, não há "segunda-feira", não há nada. O custo de fazer certo aqui é
 * zero; o de fazer errado é o componente não existir para quem não enxerga.
 *
 * ## O teclado é o componente
 *
 * Padrão APG, e não é enfeite: escolher 15/06/2026 no mouse são três cliques e uma mira;
 * no teclado é uma seta. Setas andam 1 dia, ↑↓ andam 1 semana, Home/End vão às pontas da
 * semana, PageUp/PageDown trocam o mês, Shift+PageUp/PageDown trocam o ano, Enter/Espaço
 * escolhem. **Roving tabindex**: um Tab entra na grade e o próximo Tab sai dela — só o dia
 * focado é tabulável. Sem isso, sair de um calendário custa 42 Tabs.
 *
 * A seta **nunca pousa em dia desabilitado**: ela pula por cima e, no limite do `min`/`max`,
 * para na ponta válida. Um foco que pousa onde o Enter não faz nada é um beco sem saída.
 *
 * ## `aria-selected` e `aria-current` são coisas diferentes
 *
 * `aria-current="date"` é HOJE — o dia em que a pessoa está. `aria-selected` é o dia
 * ESCOLHIDO. Trocar um pelo outro (ou usar só um) faz o leitor de tela anunciar "hoje" para
 * uma data de 2019. São dois fatos independentes e a grade marca os dois.
 *
 * @example
 * const [d, setD] = useState<Date | null>(null)
 * <Calendario valor={d} onChange={setD} min={new Date()} />
 *
 * @example Sem fim de semana
 * <Calendario valor={d} onChange={setD} desabilitar={x => x.getDay() === 0 || x.getDay() === 6} />
 *
 * @see CampoData — o campo com máscara que abre este calendário. É quase sempre o que você quer.
 */
export const Calendario = forwardRef<HTMLDivElement, CalendarioProps>(function Calendario(
  {
    valor,
    onChange,
    min,
    max,
    desabilitar,
    mes,
    onMesChange,
    locale = 'pt-BR',
    primeiroDiaSemana,
    realce,
    onDiaEntrar,
    setas = 'ambas',
    className,
    ...rest
  },
  ref,
) {
  const idTitulo = useId()

  // Calculado uma vez: numa página aberta há 12 horas, "hoje" continua sendo o dia em que a
  // grade montou. É o preço de não pendurar um timer só para virar a meia-noite — e é a
  // troca certa, porque o calendário sempre remonta ao abrir o painel.
  const hoje = useMemo(() => inicioDoDia(new Date()), [])

  // Duas linhas, e não `primeiroDiaSemana ?? useMemo(...)`: o `??` só avalia a direita
  // quando a esquerda é nula, ou seja, o hook rodaria em uns renders e em outros não —
  // e a ordem dos hooks quebraria no instante em que alguém passasse a prop.
  const diaDetectado = useMemo(() => detectarPrimeiroDia(locale), [locale])
  const primeiroDia = primeiroDiaSemana ?? diaDetectado

  const [mesInterno, setMesInterno] = useState(() => inicioDoMes(mes ?? valor ?? hoje))
  const mesVisivel = mes ? inicioDoMes(mes) : mesInterno

  const irParaMes = useCallback(
    (novo: Date) => {
      setMesInterno(inicioDoMes(novo))
      onMesChange?.(inicioDoMes(novo))
    },
    [onMesChange],
  )

  const fmt = useMemo(
    () => ({
      titulo: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
      // Nada de tabela de nomes de mês escrita à mão: o Intl entrega pt-BR, en-US e mais
      // 300 locales de graça, e acentua certo.
      dia: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
      semanaCurto: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      semanaLongo: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
    }),
    [locale],
  )

  const diasDaSemana = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = somarDias(DOMINGO_REF, primeiroDia + i)
        return {
          // pt-BR devolve "seg." com ponto — o ponto some, que a coluna é estreita.
          curto: fmt.semanaCurto.format(d).replace(/\.$/, ''),
          longo: fmt.semanaLongo.format(d),
        }
      }),
    [fmt, primeiroDia],
  )

  const estaDesabilitado = useCallback(
    (d: Date) => {
      if (min && compararDias(d, min) < 0) return true
      if (max && compararDias(d, max) > 0) return true
      return desabilitar?.(d) ?? false
    },
    [min, max, desabilitar],
  )

  /**
   * Empurra o alvo para um dia em que dá para pousar.
   *
   * Primeiro grampeia em `min`/`max` — e é isso que faz a seta PARAR na ponta em vez de
   * sumir no vazio. Depois pula os dias que o `desabilitar` recusou, andando no sentido da
   * viagem (ou para dentro do intervalo, quando o grampo mandou). `null` = não há onde
   * pousar, e aí o foco fica onde estava (melhor que saltar para um lugar arbitrário).
   */
  const acomodar = useCallback(
    (alvo: Date, sentido: 1 | -1): Date | null => {
      let d = alvo
      let passo = sentido
      if (min && compararDias(d, min) < 0) {
        d = inicioDoDia(min)
        passo = 1
      } else if (max && compararDias(d, max) > 0) {
        d = inicioDoDia(max)
        passo = -1
      }
      // Teto de 366: um `desabilitar` que recusa o ano inteiro não pode travar a aba.
      for (let i = 0; i < 366; i++) {
        if (!estaDesabilitado(d)) return d
        d = somarDias(d, passo)
        if (min && compararDias(d, min) < 0) return null
        if (max && compararDias(d, max) > 0) return null
      }
      return null
    },
    [min, max, estaDesabilitado],
  )

  /** O dia tabulável quando o foco ainda não entrou na grade: o escolhido > hoje > dia 1. */
  const ancora = useMemo(() => {
    const preferido =
      valor && mesmoMes(valor, mesVisivel)
        ? inicioDoDia(valor)
        : mesmoMes(hoje, mesVisivel)
          ? hoje
          : mesVisivel
    if (!estaDesabilitado(preferido)) return preferido

    // Procura um dia válido DENTRO do mês visível — para frente, depois para trás. Não sai
    // do mês de propósito: um tabIndex=0 em outro mês deixaria a grade visível sem entrada
    // pelo Tab. Se o mês inteiro está desabilitado, fica no preferido mesmo: desabilitado,
    // mas alcançável — a grade precisa continuar tendo uma porta.
    const total = diasNoMes(mesVisivel.getFullYear(), mesVisivel.getMonth())
    for (let dia = preferido.getDate() + 1; dia <= total; dia++) {
      const d = criarData(mesVisivel.getFullYear(), mesVisivel.getMonth(), dia)
      if (!estaDesabilitado(d)) return d
    }
    for (let dia = preferido.getDate() - 1; dia >= 1; dia--) {
      const d = criarData(mesVisivel.getFullYear(), mesVisivel.getMonth(), dia)
      if (!estaDesabilitado(d)) return d
    }
    return preferido
  }, [valor, mesVisivel, hoje, estaDesabilitado])

  const [diaFocado, setDiaFocado] = useState<Date | null>(null)
  // Derivado, não sincronizado por efeito: quando o mês muda (por seta, por teclado ou
  // porque o pai mandou), o foco cai na âncora do mês novo sem um `useEffect` de espelho —
  // que é onde essas grades costumam ganhar um render a mais e um foco fantasma.
  const focado = diaFocado && mesmoMes(diaFocado, mesVisivel) ? diaFocado : ancora

  const celulaFocadaRef = useRef<HTMLTableCellElement>(null)
  // Só o teclado move o foco de verdade. Sem esta trava, a grade roubaria o foco da página
  // no primeiro render — e roubaria de volta do botão "próximo mês" a cada clique.
  const deveFocar = useRef(false)

  useEffect(() => {
    if (!deveFocar.current) return
    deveFocar.current = false
    celulaFocadaRef.current?.focus()
  })

  const escolher = useCallback(
    (d: Date) => {
      if (estaDesabilitado(d)) return
      setDiaFocado(d)
      onChange(d)
    },
    [estaDesabilitado, onChange],
  )

  function aoTeclar(e: KeyboardEvent<HTMLTableElement>) {
    let alvo: Date | null = null
    let sentido: 1 | -1 = 1

    switch (e.key) {
      case 'ArrowLeft':
        alvo = somarDias(focado, -1)
        sentido = -1
        break
      case 'ArrowRight':
        alvo = somarDias(focado, 1)
        break
      case 'ArrowUp':
        alvo = somarDias(focado, -7)
        sentido = -1
        break
      case 'ArrowDown':
        alvo = somarDias(focado, 7)
        break
      case 'Home':
        alvo = somarDias(focado, -((focado.getDay() - primeiroDia + 7) % 7))
        sentido = -1
        break
      case 'End':
        alvo = somarDias(focado, 6 - ((focado.getDay() - primeiroDia + 7) % 7))
        break
      case 'PageUp':
        alvo = somarMeses(focado, e.shiftKey ? -12 : -1)
        sentido = -1
        break
      case 'PageDown':
        alvo = somarMeses(focado, e.shiftKey ? 12 : 1)
        break
      case 'Enter':
      case ' ':
        // preventDefault no Espaço senão a página rola atrás do calendário aberto.
        e.preventDefault()
        escolher(focado)
        return
      default:
        // Esc e Tab caem aqui e SOBEM: quem fecha o painel é o painel, não a grade. Se a
        // grade engolisse o Esc, o CampoData nunca saberia que é para fechar.
        return
    }

    e.preventDefault()
    const destino = acomodar(alvo, sentido)
    if (!destino) return
    deveFocar.current = true
    setDiaFocado(destino)
    if (!mesmoMes(destino, mesVisivel)) irParaMes(destino)
  }

  /**
   * Sempre 6 semanas, mesmo quando o mês cabe em 5.
   *
   * Com o número de linhas variando, o painel muda de altura ao trocar de mês e o botão
   * "próximo mês" foge de debaixo do cursor: quem clica três meses seguidos erra o terceiro
   * e escolhe um dia sem querer. Altura fixa é mais importante que a linha vazia.
   */
  const semanas = useMemo(() => {
    const primeiroDoMes = inicioDoMes(mesVisivel)
    const recuo = (primeiroDoMes.getDay() - primeiroDia + 7) % 7
    const inicio = somarDias(primeiroDoMes, -recuo)
    return Array.from({ length: 6 }, (_, s) =>
      Array.from({ length: 7 }, (_, d) => somarDias(inicio, s * 7 + d)),
    )
  }, [mesVisivel, primeiroDia])

  const dentroDoRealce = useCallback(
    (d: Date) => {
      if (!realce?.inicio || !realce.fim) return false
      return compararDias(d, realce.inicio) >= 0 && compararDias(d, realce.fim) <= 0
    },
    [realce],
  )

  const tituloMes = fmt.titulo.format(mesVisivel)
  const mostrarEsq = setas === 'ambas' || setas === 'esquerda'
  const mostrarDir = setas === 'ambas' || setas === 'direita'

  const rotuloSalto = (destino: Date, texto: string) => `${texto}, ${fmt.titulo.format(destino)}`

  return (
    <div ref={ref} className={cx('amb-calendario', className)} {...rest}>
      <div className="amb-calendario__cabecalho">
        {mostrarEsq ? (
          <>
            {/* O ano tem botão próprio: sem ele, chegar em 1985 (data de nascimento) custa
                490 cliques no "mês anterior". Continua sendo lento — o caminho rápido para
                isso é DIGITAR no CampoData, e é por isso que aquele campo aceita texto. */}
            <button
              type="button"
              className="amb-calendario__nav amb-focus-ring"
              aria-label={rotuloSalto(somarMeses(mesVisivel, -12), 'Ano anterior')}
              onClick={() => irParaMes(somarMeses(mesVisivel, -12))}
            >
              <Chevron duplo />
            </button>
            <button
              type="button"
              className="amb-calendario__nav amb-focus-ring"
              // O rótulo diz PARA ONDE vai, não só "anterior": quem usa leitor de tela ouve
              // "Mês anterior, maio de 2026" e sabe onde vai cair antes de clicar.
              aria-label={rotuloSalto(somarMeses(mesVisivel, -1), 'Mês anterior')}
              onClick={() => irParaMes(somarMeses(mesVisivel, -1))}
            >
              <Chevron />
            </button>
          </>
        ) : (
          <span className="amb-calendario__nav-vazio" aria-hidden="true" />
        )}

        <div id={idTitulo} className="amb-calendario__titulo">
          {tituloMes}
        </div>

        {mostrarDir ? (
          <>
            <button
              type="button"
              className="amb-calendario__nav amb-focus-ring"
              aria-label={rotuloSalto(somarMeses(mesVisivel, 1), 'Próximo mês')}
              onClick={() => irParaMes(somarMeses(mesVisivel, 1))}
            >
              <Chevron invertido />
            </button>
            <button
              type="button"
              className="amb-calendario__nav amb-focus-ring"
              aria-label={rotuloSalto(somarMeses(mesVisivel, 12), 'Próximo ano')}
              onClick={() => irParaMes(somarMeses(mesVisivel, 12))}
            >
              <Chevron duplo invertido />
            </button>
          </>
        ) : (
          <span className="amb-calendario__nav-vazio" aria-hidden="true" />
        )}
      </div>

      {/**
       * A troca de mês precisa ser ANUNCIADA. Sem isto, quem usa leitor de tela clica em
       * "próximo mês", ouve "botão próximo mês" de novo e não faz ideia de onde chegou — a
       * única coisa que mudou na tela foi justamente o que ele não vê.
       *
       * Região viva à parte, e não o próprio título: um elemento que é `aria-labelledby` da
       * grade E região viva ao mesmo tempo é anunciado duas vezes (na troca, e de novo
       * quando o foco entra na grade). Aqui cada um faz um trabalho.
       */}
      <div role="status" className="amb-sr-only">
        {tituloMes}
      </div>

      <table
        role="grid"
        aria-labelledby={idTitulo}
        // Com realce, o miolo inteiro do intervalo está selecionado — e aí a grade precisa
        // dizer que aceita mais de um.
        aria-multiselectable={realce ? true : undefined}
        className="amb-calendario__tabela"
        onKeyDown={aoTeclar}
        onMouseLeave={() => onDiaEntrar?.(null)}
      >
        <thead>
          <tr>
            {diasDaSemana.map(d => (
              <th key={d.longo} scope="col" className="amb-calendario__dia-semana">
                {/* Abreviação para o olho, nome inteiro para o leitor de tela. O `abbr` do
                    HTML seria o caminho elegante, mas metade dos leitores de tela o ignora;
                    dois spans funcionam em todos. E "S" (narrow) não serve nem para o olho:
                    em pt-BR daria S, T, Q, Q, S, S. */}
                <span aria-hidden="true">{d.curto}</span>
                <span className="amb-sr-only">{d.longo}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana, i) => (
            <tr key={i}>
              {semana.map(d => {
                /**
                 * Dias dos meses vizinhos: aparecem em cinza e são INERTES — não clicam,
                 * não recebem foco, não entram no realce.
                 *
                 * Aparecem porque a grade de 6 linhas ficaria com buracos nos cantos, e
                 * buraco parece defeito. São inertes porque "30" na grade de junho é maio:
                 * clicar ali é exatamente o erro que põe a data errada no campo — e o
                 * caminho honesto para maio é a seta, que troca o mês e mostra o que fez.
                 */
                const fora = !mesmoMes(d, mesVisivel)
                const desabilitado = fora || estaDesabilitado(d)
                const ehFocado = mesmoDia(d, focado)
                const selecionado = realce
                  ? dentroDoRealce(d) && !fora
                  : Boolean(valor && mesmoDia(d, valor))
                const pontaInicio = Boolean(realce?.inicio && mesmoDia(d, realce.inicio))
                const pontaFim = Boolean(realce?.fim && mesmoDia(d, realce.fim))

                return (
                  <td
                    key={d.getTime()}
                    ref={ehFocado ? celulaFocadaRef : undefined}
                    role="gridcell"
                    // Roving tabindex: um Tab entra, o próximo Tab sai. As 41 outras células
                    // ficam fora da ordem de tabulação — é o teclado da grade que anda nelas.
                    tabIndex={ehFocado ? 0 : -1}
                    aria-selected={selecionado}
                    // HOJE não é o ESCOLHIDO. Dois fatos, duas marcas.
                    aria-current={mesmoDia(d, hoje) ? 'date' : undefined}
                    // aria-disabled e não `disabled`: a célula continua sendo anunciada
                    // ("indisponível") em vez de sumir da tabela e furar a semana.
                    aria-disabled={desabilitado || undefined}
                    // "15" sozinho não diz nada quando o leitor de tela pula direto para a
                    // célula. O dia da semana fica de fora porque o `<th>` da coluna já o dá.
                    aria-label={fmt.dia.format(d)}
                    className={cx(
                      'amb-calendario__dia',
                      fora && 'amb-calendario__dia--fora',
                      !fora && estaDesabilitado(d) && 'amb-calendario__dia--desabilitado',
                      selecionado && !realce && 'amb-calendario__dia--selecionado',
                      realce && selecionado && 'amb-calendario__dia--realce',
                      pontaInicio && !fora && 'amb-calendario__dia--ponta-inicio',
                      pontaFim && !fora && 'amb-calendario__dia--ponta-fim',
                    )}
                    onClick={() => !desabilitado && escolher(d)}
                    onMouseEnter={() => !desabilitado && onDiaEntrar?.(d)}
                  >
                    <span className="amb-calendario__numero">{d.getDate()}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})
