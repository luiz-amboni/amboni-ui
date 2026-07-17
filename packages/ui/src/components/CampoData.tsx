import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cx } from '../utils/cx'
import { Campo, type CampoSize } from './Campo'
import { Calendario, compararDias, criarData, type CalendarioProps } from './Calendario'
import './CampoData.css'

/**
 * Os dois formatos que o campo edita.
 *
 * **Não é um pattern livre** à la `date-fns` ('dd MMM yy'). Um pattern livre num campo com
 * máscara obriga a gerar máscara, parser, placeholder e mensagem de erro a partir da string
 * — vira um mini-interpretador, e cada formato novo é uma classe nova de bug de parsing.
 * Estes dois cobrem o que um CRM brasileiro precisa: o que a pessoa digita, e o que o
 * sistema troca com máquina. Para EXIBIR data em outro formato, use `Intl.DateTimeFormat`
 * — formatar é fácil, o que é difícil (e o que este campo faz) é ler o que foi digitado.
 */
export type FormatoData = 'dd/mm/aaaa' | 'aaaa-mm-dd'

const SEPARADOR: Record<FormatoData, string> = { 'dd/mm/aaaa': '/', 'aaaa-mm-dd': '-' }
const GRUPOS: Record<FormatoData, number[]> = { 'dd/mm/aaaa': [2, 2, 4], 'aaaa-mm-dd': [4, 2, 2] }

/**
 * Ano de 2 dígitos → 4. A janela é 1970–2069.
 *
 * Não existe resposta certa: "26" pode ser 1926 ou 2026, e o computador não tem como saber.
 * A janela é a mesma do `strptime` do POSIX, e serve ao caso real (venda de 2026, nascimento
 * de 1985). O que torna o chute aceitável não é a janela — é o campo **reescrever o texto
 * com 4 dígitos assim que a pessoa sai dele**: ela VÊ o que o campo entendeu e corrige se
 * errou. Adivinhar em silêncio seria indefensável; adivinhar e mostrar é honesto.
 */
function expandirAno(texto: string): number {
  const n = Number(texto)
  if (texto.length !== 2) return n
  return n <= 69 ? 2000 + n : 1900 + n
}

/**
 * Lê o que a pessoa digitou. Aceita "15/06/2026", "15/06/26", "15/6/26" e "150626".
 * Devolve `null` para qualquer coisa que não seja uma data de verdade — inclusive "31/02".
 */
export function analisarData(texto: string, formato: FormatoData = 'dd/mm/aaaa'): Date | null {
  // Separa por QUALQUER não-dígito: quem digita rápido produz "15.06.2026" e "15-06-2026",
  // e recusar isso seria implicância — a intenção é inequívoca.
  const partes = texto.trim().split(/\D+/).filter(Boolean)

  let campos: string[] | null = null
  if (partes.length === 3) {
    campos = partes
  } else if (partes.length === 1) {
    const d = partes[0]
    if (formato === 'dd/mm/aaaa' && (d.length === 6 || d.length === 8)) {
      campos = [d.slice(0, 2), d.slice(2, 4), d.slice(4)]
    } else if (formato === 'aaaa-mm-dd' && d.length === 8) {
      campos = [d.slice(0, 4), d.slice(4, 6), d.slice(6)]
    }
    // "260615" em aaaa-mm-dd fica de fora: seria ano 26? 2606 de quê? Ambíguo. Uma data
    // errada em silêncio é muito pior que um erro na cara.
  }
  if (!campos) return null

  const [p1, p2, p3] = campos
  const textoDia = formato === 'dd/mm/aaaa' ? p1 : p3
  const textoMes = p2
  const textoAno = formato === 'dd/mm/aaaa' ? p3 : p1

  if (!/^\d{1,2}$/.test(textoDia)) return null
  if (!/^\d{1,2}$/.test(textoMes)) return null
  if (!/^(\d{2}|\d{4})$/.test(textoAno)) return null

  const ano = expandirAno(textoAno)
  const mes = Number(textoMes)
  const dia = Number(textoDia)
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null

  const d = criarData(ano, mes - 1, dia)
  // A prova dos nove. O `Date` "conserta" o impossível sozinho: pedir 31 de fevereiro
  // devolve 3 de março, sem erro, sem aviso. Quem digitou "31/02" erraria o dedo e o
  // sistema guardaria março — a volta é a única forma de pegar isso.
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null
  return d
}

/** Data → texto. Campos LOCAIS, nunca `toISOString()` — ver a nota do modo nativo. */
export function formatarData(d: Date, formato: FormatoData = 'dd/mm/aaaa'): string {
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = String(d.getFullYear()).padStart(4, '0')
  const sep = SEPARADOR[formato]
  return formato === 'dd/mm/aaaa' ? `${dia}${sep}${mes}${sep}${ano}` : `${ano}${sep}${mes}${sep}${dia}`
}

/**
 * Põe os separadores enquanto a pessoa digita.
 *
 * Duas decisões, e as duas foram um teste vermelho antes de serem uma decisão:
 *
 * **1. A barra que a pessoa digita FECHA o grupo, completando com zero.** A máscara ingênua
 * joga fora tudo que não é dígito e reagrupa em blocos fixos — e aí quem digita "15/6/26"
 * (que é como gente escreve data) recebe "15/62/6". O "/" não é enfeite: é a pessoa dizendo
 * "o mês acabou". Aqui ele vira "15/06/…". Sem separador não dá para adivinhar: "156" pode
 * ser dia 15 mês 6 ou dia 15 mês 62 pela metade, então aí vale a posição — quem digita só
 * dígitos digita os 8 ("15062026"), que é a rajada de quem preenche CRM o dia todo.
 *
 * **2. Nunca devolve separador no fim.** Não é estética, é o que impede o campo de travar:
 * máscara que gruda o "/" assim que o grupo enche transforma "15/0" + Backspace em "15/" →
 * sobram os dígitos "15" → a máscara devolve "15/" de novo → a tecla não faz nada e a
 * pessoa fica presa apertando Backspace. Separador de grupo vazio é ignorado.
 */
function mascarar(texto: string, formato: FormatoData): string {
  const larguras = GRUPOS[formato]
  const fechados: string[] = []
  let aberto = ''
  let grupo = 0

  for (const ch of texto) {
    if (grupo >= larguras.length) break
    if (ch >= '0' && ch <= '9') {
      aberto += ch
      if (aberto.length === larguras[grupo]) {
        fechados.push(aberto)
        aberto = ''
        grupo++
      }
    } else if (aberto.length > 0) {
      fechados.push(aberto.padStart(larguras[grupo], '0'))
      aberto = ''
      grupo++
    }
  }

  const partes = aberto ? [...fechados, aberto] : fechados
  return partes.join(SEPARADOR[formato])
}

/**
 * `matchMedia` como fonte externa, via `useSyncExternalStore`.
 *
 * `getServer` devolve `false` fixo: no SSR não há janela, e chutar "é celular" ou "é
 * desktop" no HTML do servidor produz hidratação divergente — o React reclama e, pior, o
 * campo troca de tipo debaixo do dedo de quem já começou a digitar.
 */
export function useMedia(consulta: string): boolean {
  const inscrever = useCallback(
    (avisar: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mql = window.matchMedia(consulta)
      mql.addEventListener('change', avisar)
      return () => mql.removeEventListener('change', avisar)
    },
    [consulta],
  )
  const ler = useCallback(
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(consulta).matches
        : false,
    [consulta],
  )
  return useSyncExternalStore(inscrever, ler, () => false)
}

function IconeCalendario() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6.5 H14 M5.5 1.75 V4 M10.5 1.75 V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export interface CampoDataProps
  extends Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'defaultValue'> {
  /** Controlado. `null` = campo vazio. */
  valor: Date | null
  /** Recebe o DIA (meia-noite local) ou `null` quando a pessoa esvazia o campo. */
  onChange: (d: Date | null) => void
  min?: Date
  max?: Date
  /**
   * Desabilita dias avulsos no calendário. **Ignorado no modo nativo** — ver a limitação
   * no JSDoc do componente.
   */
  desabilitar?: CalendarioProps['desabilitar']
  /** @default 'dd/mm/aaaa' */
  formato?: FormatoData
  /** @default o próprio formato ("dd/mm/aaaa") — é a instrução mais curta que existe. */
  placeholder?: string
  /**
   * A mensagem do erro de fora (validação do formulário). O campo tem os erros DELE
   * ("Data inválida"), que aparecem sozinhos — este é para o que só o produto sabe
   * ("Escolha uma data depois do pedido").
   */
  erro?: string
  disabled?: boolean
  /** @default 'md' */
  size?: CampoSize
  /** @default 'pt-BR' */
  locale?: string
  /**
   * Força o `<input type="date">` do sistema (`true`) ou o campo com máscara (`false`).
   * Por padrão decide pelo ponteiro: dedo → nativo, mouse → máscara. Ver o JSDoc.
   */
  nativo?: boolean
  name?: string
  id?: string
}

/**
 * CampoData — o campo de data.
 *
 * ## A decisão: texto com máscara no mouse, `<input type="date">` no dedo
 *
 * As duas opções são ruins de um jeito diferente, e escolher só uma é escolher errado para
 * metade das pessoas.
 *
 * O **nativo** dá de graça o que ninguém imita bem: o teclado do sistema, o calendário do
 * SO e — o que mais pesa — **a roda do celular**. No toque ele ganha de qualquer coisa que
 * a gente desenhe. Mas ele é quase inestilizável, o formato dele obedece ao locale do
 * SISTEMA (um Mac em inglês mostra mm/dd/yyyy no meio de um painel em português, e não há
 * CSS que conserte), e ele não sabe desabilitar dias avulsos — só `min`/`max`.
 *
 * O **texto com máscara** é o certo para quem preenche CRM o dia todo: digitar "15/06/2026"
 * é uma rajada de 8 dígitos, contra três cliques e uma mira no calendário. E quem procura
 * uma data de nascimento (1985) não tem paciência para 40 cliques em "ano anterior".
 *
 * Então: **`(pointer: coarse)` → nativo; senão, máscara + botão que abre o `Calendario`**.
 * O critério é o ponteiro e não a largura da tela, porque o que muda o jogo é o dedo, não o
 * tamanho da janela. Force com `nativo` quando souber mais que a heurística.
 *
 * ## Limitações, sem maquiagem
 *
 *  · **no modo nativo, `desabilitar` não vale** (o `type=date` só entende min/max). Se dias
 *    avulsos são essenciais, passe `nativo={false}` e aceite perder a roda do SO;
 *  · **no modo nativo, o formato é o do SISTEMA**, não o `formato`. `formato` continua
 *    valendo para o `valor` que entra e sai — o que muda é só o que aparece na tela;
 *  · **o painel é `position: absolute`**: um ancestral com `overflow: hidden` corta o
 *    calendário. Ele vira para cima quando não cabe embaixo, mas não escapa de um recorte.
 *    O conserto de verdade é o anchor positioning do CSS, que ainda não tem Firefox.
 *
 * @example
 * const [d, setD] = useState<Date | null>(null)
 * <CampoForm label="Data da venda"><CampoData valor={d} onChange={setD} max={new Date()} /></CampoForm>
 *
 * @see CampoPeriodo — para intervalo ("últimos 30 dias"). É o que um CRM usa 90% do tempo.
 */
export const CampoData = forwardRef<HTMLInputElement, CampoDataProps>(function CampoData(
  props,
  ref,
) {
  // Dedo → roda do sistema. `(pointer: coarse)` e não largura: um tablet de 1024px é dedo,
  // uma janela estreita no desktop não é.
  const ponteiroGrosso = useMedia('(pointer: coarse)')
  const nativo = props.nativo ?? ponteiroGrosso
  // Dois componentes de verdade: um tem painel, foco e máscara; o outro não tem estado
  // nenhum. Separados, cada um chama seus hooks sem condicional.
  return nativo ? <CampoDataNativo {...props} ref={ref} /> : <CampoDataMascara {...props} ref={ref} />
})

/* ══════════════════════════════════════════════════════════════════════════════
 * Modo nativo — celular
 * ════════════════════════════════════════════════════════════════════════════ */

/**
 * O `<input type="date">` fala uma língua só: 'aaaa-mm-dd'. E é AQUI que mora o bug de fuso
 * mais caro do arquivo: `d.toISOString().slice(0,10)` parece a resposta óbvia e está errada
 * — `toISOString` converte para UTC, então 15/06 à meia-noite em São Paulo vira
 * "2026-06-15T03:00Z"… e o dia 1º de junho à meia-noite vira "2026-05-31". O campo mostraria
 * o dia anterior. Montamos a string com os campos LOCAIS, que é o que o input espera.
 */
function paraValorNativo(d: Date): string {
  return `${String(d.getFullYear()).padStart(4, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** E a volta: `new Date('2026-06-15')` seria lido como UTC e viraria 14/06 no Brasil. */
function deValorNativo(texto: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto)
  if (!m) return null
  return criarData(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

const CampoDataNativo = forwardRef<HTMLInputElement, CampoDataProps>(function CampoDataNativo(
  {
    valor, onChange, min, max, erro, disabled, size = 'md', name, id,
    formato: _formato, placeholder: _placeholder, locale: _locale, nativo: _nativo,
    desabilitar: _desabilitar, className, ...rest
  },
  ref,
) {
  const idBase = useId()
  const idErro = `${idBase}-erro`

  return (
    <div className={cx('amb-campo-data', className)}>
      <Campo
        {...rest}
        ref={ref}
        id={id}
        name={name}
        type="date"
        size={size}
        disabled={disabled}
        value={valor ? paraValorNativo(valor) : ''}
        min={min ? paraValorNativo(min) : undefined}
        max={max ? paraValorNativo(max) : undefined}
        erro={Boolean(erro)}
        aria-describedby={cx(erro && idErro, rest['aria-describedby']) || undefined}
        onChange={e => onChange(e.target.value ? deValorNativo(e.target.value) : null)}
      />
      {erro && (
        <p id={idErro} className="amb-campo-data__erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
})

/* ══════════════════════════════════════════════════════════════════════════════
 * Modo máscara — desktop
 * ════════════════════════════════════════════════════════════════════════════ */

const CampoDataMascara = forwardRef<HTMLInputElement, CampoDataProps>(function CampoDataMascara(
  {
    valor, onChange, min, max, desabilitar, formato = 'dd/mm/aaaa', placeholder,
    erro, disabled, size = 'md', locale = 'pt-BR', nativo: _nativo, name, id,
    className, ...rest
  },
  ref,
) {
  const idBase = useId()
  const idErro = `${idBase}-erro`
  const ariaInvalidDeFora = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'

  const [texto, setTexto] = useState(() => (valor ? formatarData(valor, formato) : ''))
  const [erroInterno, setErroInterno] = useState<string | undefined>(undefined)
  const [aberto, setAberto] = useState(false)
  const [acima, setAcima] = useState(false)

  const raizRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const campoRef = useRef<HTMLInputElement>(null)
  const focadoRef = useRef(false)
  useImperativeHandle(ref, () => campoRef.current as HTMLInputElement, [])

  const chaveValor = valor ? valor.getTime() : null

  // `chaveValor` na dependência, e não o `valor`: `<CampoData valor={new Date(x)} />` cria um
  // objeto novo a CADA render do consumidor, o efeito rodaria a cada tecla e reescreveria o
  // texto que a pessoa está digitando. A guarda do foco é o segundo cinto: enquanto o campo
  // está com a pessoa, quem manda no texto é ela — não o `valor` que ela mesma acabou de gerar.
  useEffect(() => {
    if (focadoRef.current) return
    setTexto(chaveValor === null ? '' : formatarData(new Date(chaveValor), formato))
    setErroInterno(undefined)
  }, [chaveValor, formato])

  const foraDosLimites = useCallback(
    (d: Date): string | undefined => {
      if (min && compararDias(d, min) < 0) return `A data precisa ser a partir de ${formatarData(min, formato)}`
      if (max && compararDias(d, max) > 0) return `A data precisa ser até ${formatarData(max, formato)}`
      if (desabilitar?.(d)) return 'Esta data não está disponível'
      return undefined
    },
    [min, max, desabilitar, formato],
  )

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false)
    // Sem devolver o foco, quem fecha pelo teclado é jogado para o <body> e recomeça a
    // navegar o formulário do topo.
    if (devolverFoco) campoRef.current?.focus()
  }, [])

  // Fecha ao apontar para fora — sem devolver o foco: a pessoa clicou em outro lugar porque
  // quer ir para lá. `pointerdown` + `contains` pelo mesmo motivo do Menu e da Selecao: sem
  // o `contains`, o toque no PRÓPRIO dia desmontaria o painel antes do clique chegar nele.
  useEffect(() => {
    if (!aberto) return
    function aoApontar(e: PointerEvent) {
      if (!raizRef.current?.contains(e.target as Node)) fechar(false)
    }
    document.addEventListener('pointerdown', aoApontar)
    return () => document.removeEventListener('pointerdown', aoApontar)
  }, [aberto, fechar])

  // Abrir para baixo é o padrão; vira para cima só quando não cabe. Um campo de data no pé
  // de um formulário é o caso mais comum que existe, e um calendário que abre para fora da
  // tela simplesmente não existe para quem está lá embaixo.
  useEffect(() => {
    if (!aberto) return
    const painel = painelRef.current
    const raiz = raizRef.current
    if (!painel || !raiz) return
    const caixa = raiz.getBoundingClientRect()
    const altura = painel.offsetHeight
    setAcima(window.innerHeight - caixa.bottom < altura + 8 && caixa.top > altura + 8)
  }, [aberto])

  // O foco entra na grade: quem abriu quer escolher um dia, não ouvir "diálogo".
  useEffect(() => {
    if (!aberto) return
    painelRef.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus()
  }, [aberto])

  function escolherNoCalendario(d: Date) {
    const problema = foraDosLimites(d)
    if (problema) return
    setTexto(formatarData(d, formato))
    setErroInterno(undefined)
    onChange(d)
    fechar(true)
  }

  function aoDigitar(novo: string) {
    const limpo = mascarar(novo, formato)
    setTexto(limpo)
    // Não repreende no meio da digitação: "31/1" ainda vai virar "31/12". O erro é assunto
    // de quando a pessoa termina — ver `aoSair`.
    setErroInterno(undefined)

    if (limpo === '') {
      onChange(null)
      return
    }
    // Só com os 8 dígitos. Com 6 ("15/06/20") a data já É válida — 15/06/2020 —, e avisar o
    // resto da tela ali faria o calendário pular para 2020 no caminho de "15/06/2026".
    if (limpo.replace(/\D/g, '').length !== 8) return
    const d = analisarData(limpo, formato)
    if (!d) return
    if (foraDosLimites(d)) return
    onChange(d)
  }

  function aoSair() {
    focadoRef.current = false
    if (texto === '') {
      setErroInterno(undefined)
      onChange(null)
      return
    }
    const d = analisarData(texto, formato)
    if (!d) {
      // Data impossível não pode virar outra data em silêncio, e não pode sumir como se a
      // pessoa não tivesse digitado nada: o texto FICA na tela, com o motivo do lado.
      setErroInterno(`Data inválida — use ${formato}`)
      return
    }
    const problema = foraDosLimites(d)
    if (problema) {
      setErroInterno(problema)
      return
    }
    setErroInterno(undefined)
    // Reescreve normalizado: "15/6/26" vira "15/06/2026". É aqui que a pessoa confere o que
    // o campo entendeu do ano de dois dígitos.
    setTexto(formatarData(d, formato))
    onChange(d)
  }

  function aoTeclarNoCampo(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && aberto) {
      e.preventDefault()
      // stopPropagation: dentro de um Dialogo, o mesmo Esc fecharia o calendário E o modal
      // atrás dele. Um Esc, um nível.
      e.stopPropagation()
      fechar(true)
    }
    if (e.key === 'ArrowDown' && e.altKey && !aberto) {
      // Alt+↓ abre — é o atalho que o próprio <select> e o combobox do sistema usam.
      e.preventDefault()
      setAberto(true)
    }
  }

  /**
   * Tab circula DENTRO do painel, ao contrário do Menu (onde o Tab sai).
   *
   * A diferença tem motivo: o painel do Menu tem uma coisa só (itens, e a seta anda neles);
   * este tem quatro setas de navegação e uma grade. Deixar o Tab escapar tornaria as setas
   * de mês inalcançáveis para quem não sabe que PageUp existe. É o que o APG faz no Date
   * Picker Dialog: prende o Tab e devolve a saída para o Esc — que aqui também devolve o
   * foco ao campo.
   */
  function aoTeclarNoPainel(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      fechar(true)
      return
    }
    if (e.key !== 'Tab') return
    const focaveis = painelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [role="gridcell"][tabindex="0"]',
    )
    if (!focaveis || focaveis.length === 0) return
    const primeiro = focaveis[0]
    const ultimo = focaveis[focaveis.length - 1]
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault()
      primeiro.focus()
    }
  }

  const mensagem = erroInterno ?? erro
  const idDoCampo = id ?? `${idBase}-campo`

  return (
    <div ref={raizRef} className={cx('amb-campo-data', className)}>
      <div className="amb-campo-data__controle">
        <Campo
          {...rest}
          ref={campoRef}
          id={idDoCampo}
          name={name}
          className="amb-campo-data__campo"
          size={size}
          disabled={disabled}
          value={texto}
          // O placeholder É o formato: nenhuma instrução é mais curta nem mais exata que
          // mostrar o que se espera.
          placeholder={placeholder ?? formato}
          // inputMode numeric: no tablet (ponteiro fino com teclado virtual) abre o teclado
          // de números em vez do alfabético.
          inputMode="numeric"
          autoComplete="off"
          erro={Boolean(mensagem) || ariaInvalidDeFora}
          aria-describedby={cx(mensagem && idErro, rest['aria-describedby']) || undefined}
          onChange={e => aoDigitar(e.target.value)}
          onFocus={() => {
            focadoRef.current = true
          }}
          onBlur={aoSair}
          onKeyDown={aoTeclarNoCampo}
        />

        <button
          type="button"
          className="amb-campo-data__gatilho amb-focus-ring"
          // haspopup="dialog" e não "true": o leitor de tela anuncia que abre um DIÁLOGO, e
          // não um menu — a pessoa já sabe que vai precisar de Esc para sair.
          aria-haspopup="dialog"
          aria-expanded={aberto}
          aria-label={aberto ? 'Fechar calendário' : 'Abrir calendário'}
          disabled={disabled}
          onClick={() => (aberto ? fechar(true) : setAberto(true))}
        >
          <IconeCalendario />
        </button>

        {/* Só existe no DOM quando aberto: um calendário escondido por CSS continua sendo
            lido por leitor de tela e tabulável em parte dos navegadores. */}
        {aberto && (
          <div
            ref={painelRef}
            role="dialog"
            // Sem aria-modal: o resto da página não fica inerte, e é de propósito — quem
            // navega por leitura ainda pode sair para conferir o formulário. Quem navega por
            // Tab fica preso aqui até o Esc, que é o combinado do APG.
            aria-label="Escolher data"
            className={cx('amb-campo-data__painel', acima && 'amb-campo-data__painel--acima')}
            onKeyDown={aoTeclarNoPainel}
          >
            <Calendario
              valor={valor}
              onChange={escolherNoCalendario}
              min={min}
              max={max}
              desabilitar={desabilitar}
              locale={locale}
            />
          </div>
        )}
      </div>

      {/* Cor + PALAVRA. A moldura vermelha sozinha não diz o que está errado, e quem não
          distingue vermelho não vê aviso nenhum. role="alert" porque o <p> é MONTADO junto
          com o erro — um parágrafo que vive no DOM e só troca de texto passa despercebido. */}
      {mensagem && (
        <p id={idErro} className="amb-campo-data__erro" role="alert">
          {mensagem}
        </p>
      )}
    </div>
  )
})
