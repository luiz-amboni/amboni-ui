import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cx } from '../utils/cx'
import {
  Calendario,
  compararDias,
  inicioDoDia,
  inicioDoMes,
  criarData,
  diasNoMes,
  somarDias,
  somarMeses,
  type IntervaloDatas,
} from './Calendario'
import { formatarData, useMedia, type FormatoData } from './CampoData'
import type { CampoSize } from './Campo'
import './CampoPeriodo.css'

/** Um intervalo de dias. As duas pontas nulas = nada escolhido. */
export type Periodo = IntervaloDatas

export interface AtalhoPeriodo {
  rotulo: string
  /**
   * Função, não valor: um atalho calculado no import congelaria "hoje" no instante em que o
   * módulo carregou. Numa aba aberta desde ontem, "Hoje" traria ontem.
   */
  periodo: () => Periodo
}

/**
 * Os atalhos que cobrem quase todo o uso real.
 *
 * **"7 dias" são 7 dias contando hoje** (hoje-6 até hoje), não 8. É o off-by-one clássico
 * desta lista, e o teste crava os dois extremos justamente por isso.
 *
 * **"Este mês" vai do dia 1 até HOJE**, não até o dia 31. Num CRM o período serve para olhar
 * o que já aconteceu; um intervalo que termina no futuro faz a média diária despencar por
 * causa de dias que ainda nem chegaram. "Mês passado" é o mês inteiro porque ele acabou.
 */
export const ATALHOS_PADRAO: AtalhoPeriodo[] = [
  {
    rotulo: 'Hoje',
    periodo: () => {
      const hoje = inicioDoDia(new Date())
      return { inicio: hoje, fim: hoje }
    },
  },
  {
    rotulo: 'Últimos 7 dias',
    periodo: () => {
      const hoje = inicioDoDia(new Date())
      return { inicio: somarDias(hoje, -6), fim: hoje }
    },
  },
  {
    rotulo: 'Últimos 30 dias',
    periodo: () => {
      const hoje = inicioDoDia(new Date())
      return { inicio: somarDias(hoje, -29), fim: hoje }
    },
  },
  {
    rotulo: 'Este mês',
    periodo: () => {
      const hoje = inicioDoDia(new Date())
      return { inicio: inicioDoMes(hoje), fim: hoje }
    },
  },
  {
    rotulo: 'Mês passado',
    periodo: () => {
      const passado = somarMeses(inicioDoMes(new Date()), -1)
      return {
        inicio: passado,
        fim: criarData(passado.getFullYear(), passado.getMonth(), diasNoMes(passado.getFullYear(), passado.getMonth())),
      }
    },
  },
]

/**
 * Põe as pontas na ordem.
 *
 * Vale para o que a pessoa clica E para o que o produto passa em `valor`: um `{inicio:
 * 30/06, fim: 15/06}` vindo de um filtro salvo torto pintaria um intervalo vazio e o
 * componente pareceria quebrado. Ordenar na leitura conserta os dois de uma vez.
 */
function ordenar(p: Periodo): Periodo {
  if (!p.inicio || !p.fim) return p
  return compararDias(p.inicio, p.fim) > 0 ? { inicio: p.fim, fim: p.inicio } : p
}

// HTMLElement e não HTMLDivElement: o que sobra do `rest` (aria-label, data-*) é espalhado
// no <button> do gatilho, não na raiz — é o botão que a pessoa aperta e que o leitor de tela
// anuncia. Mesma escolha da Selecao, pelo mesmo motivo.
export interface CampoPeriodoProps
  extends Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'defaultValue'> {
  /** Controlado. `{ inicio: null, fim: null }` = nada escolhido. */
  valor: Periodo
  /** Só dispara com o intervalo COMPLETO — ver a nota sobre o rascunho no JSDoc. */
  onChange: (p: Periodo) => void
  min?: Date
  max?: Date
  /** @default ATALHOS_PADRAO */
  atalhos?: AtalhoPeriodo[]
  /** @default 'pt-BR' */
  locale?: string
  /** @default 'dd/mm/aaaa' — como as datas aparecem no botão. */
  formato?: FormatoData
  /** @default 'Escolha o período' */
  placeholder?: string
  disabled?: boolean
  /** @default 'md' */
  size?: CampoSize
}

function IconeCalendario() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6.5 H14 M5.5 1.75 V4 M10.5 1.75 V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/**
 * CampoPeriodo — o intervalo de datas. É o que um CRM realmente usa.
 *
 * ## Os atalhos são o componente; o calendário é o plano B
 *
 * "Campanhas dos últimos 30 dias", "vendas deste mês" — quase ninguém quer apontar duas
 * datas, as pessoas querem um recorte pronto. Por isso os atalhos vêm PRIMEIRO, à esquerda,
 * e é neles que o foco entra ao abrir: para 9 em cada 10 pessoas o fluxo inteiro é um clique
 * (ou um Enter). A grade existe para as outras — e para elas o teclado do `Calendario` vale
 * igual: as duas pontas se escolhem com seta e Enter.
 *
 * ## Duas pontas, um rascunho
 *
 * O primeiro clique NÃO chama `onChange`: meio intervalo não é um valor, e avisar o produto
 * de um `{inicio, fim: null}` faria a tela inteira recarregar com um filtro que a pessoa
 * ainda está montando. O rascunho vive aqui dentro até a segunda ponta; aí sim `onChange`
 * dispara uma vez, com o intervalo pronto, e o painel fecha.
 *
 * **Clicou a segunda ponta antes da primeira** (30/06 e depois 15/06)? O intervalo vira
 * 15–30, invertido em silêncio. Recusar obrigaria a pessoa a recomeçar por causa de uma
 * ordem que ela não sabia que existia, e a intenção é inequívoca: ela apontou as duas pontas.
 * O mesmo vale para um `valor` que chegue trocado — ver `ordenar`.
 *
 * ## Limitações, sem maquiagem
 *
 *  · **não dá para digitar as datas aqui.** O gatilho é um botão, não dois campos. Quem
 *    precisa cravar "15/06/2026 a 30/06/2026" na mão usa dois `<CampoData>`; este componente
 *    é para recorte de relatório, onde atalho e arrasto ganham de digitação;
 *  · **o painel é `position: absolute`**: um ancestral com `overflow: hidden` corta;
 *  · dois meses só a partir de 640px de largura — abaixo disso é um mês, porque dois não
 *    cabem em celular nenhum.
 *
 * @example
 * const [p, setP] = useState<Periodo>({ inicio: null, fim: null })
 * <CampoPeriodo aria-label="Período" valor={p} onChange={setP} max={new Date()} />
 */
export const CampoPeriodo = forwardRef<HTMLButtonElement, CampoPeriodoProps>(function CampoPeriodo(
  {
    valor,
    onChange,
    min,
    max,
    atalhos = ATALHOS_PADRAO,
    locale = 'pt-BR',
    formato = 'dd/mm/aaaa',
    placeholder = 'Escolha o período',
    disabled,
    size = 'md',
    className,
    ...rest
  },
  ref,
) {
  const [aberto, setAberto] = useState(false)
  // Meio intervalo escolhido. Mora aqui e não no `valor` de propósito — ver o JSDoc.
  const [rascunho, setRascunho] = useState<Date | null>(null)
  const [prevendo, setPrevendo] = useState<Date | null>(null)
  const [mesAncora, setMesAncora] = useState(() => inicioDoMes(valor.inicio ?? new Date()))

  const raizRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  // O ref público aponta para o botão — é nele que `.focus()` faz sentido.
  useImperativeHandle(ref, () => gatilhoRef.current as HTMLButtonElement, [])

  /**
   * Dois meses só quando cabem. Sem `matchMedia` (SSR, jsdom) a resposta é "estreito": um
   * mês SEMPRE cabe, dois estouram a tela do celular — errar para o lado que cabe é o único
   * erro reversível dos dois, e o efeito corrige no primeiro paint do cliente.
   */
  const duasVistas = useMedia('(min-width: 640px)')

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false)
    setRascunho(null)
    setPrevendo(null)
    if (devolverFoco) gatilhoRef.current?.focus()
  }, [])

  // Abrir sempre no mês do início escolhido: reabrir o painel três meses adiante de onde o
  // filtro está seria perder o contexto que a pessoa acabou de ver na tela.
  useEffect(() => {
    if (!aberto) return
    setMesAncora(inicioDoMes(valor.inicio ?? new Date()))
    // Só na abertura. `valor` na dependência reancoraria o mês a cada render do consumidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  // Fecha ao apontar para fora, sem devolver o foco — a pessoa clicou em outro lugar porque
  // quer ir para lá. `pointerdown` + `contains`: sem o `contains`, o toque no próprio dia
  // desmontaria o painel antes de o clique chegar nele. Mesmo beco do Menu e da Selecao.
  useEffect(() => {
    if (!aberto) return
    function aoApontar(e: PointerEvent) {
      if (!raizRef.current?.contains(e.target as Node)) fechar(false)
    }
    document.addEventListener('pointerdown', aoApontar)
    return () => document.removeEventListener('pointerdown', aoApontar)
  }, [aberto, fechar])

  // O foco entra no primeiro ATALHO, não na grade: "Últimos 30 dias" é o que a maioria quer,
  // e para essas pessoas o teclado inteiro vira um Enter. Quem quer a grade chega com um Tab.
  useEffect(() => {
    if (!aberto) return
    painelRef.current?.querySelector<HTMLElement>('button')?.focus()
  }, [aberto])

  const limitar = useCallback(
    (p: Periodo): Periodo => {
      // Um atalho de 30 dias num filtro com `min` de 15 dias atrás não pode devolver data
      // fora do permitido só porque o calendário do relógio disse. Grampeia e segue.
      let { inicio, fim } = p
      if (inicio && min && compararDias(inicio, min) < 0) inicio = inicioDoDia(min)
      if (fim && max && compararDias(fim, max) > 0) fim = inicioDoDia(max)
      return { inicio, fim }
    },
    [min, max],
  )

  function aplicarAtalho(atalho: AtalhoPeriodo) {
    onChange(limitar(ordenar(atalho.periodo())))
    fechar(true)
  }

  function clicarDia(d: Date) {
    if (!rascunho) {
      setRascunho(d)
      setPrevendo(null)
      return
    }
    const pronto = ordenar({ inicio: rascunho, fim: d })
    setRascunho(null)
    setPrevendo(null)
    onChange(pronto)
    fechar(true)
  }

  function aoTeclarNoPainel(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      // stopPropagation: dentro de um Dialogo, o mesmo Esc fecharia o painel E o modal atrás.
      e.stopPropagation()
      fechar(true)
      return
    }
    if (e.key !== 'Tab') return
    // Tab circula dentro do painel (igual ao CampoData, e pelo mesmo motivo: aqui há atalhos,
    // setas de mês e grade — deixar o Tab escapar tornaria metade disso inalcançável).
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

  const escolhido = ordenar(valor)
  // Enquanto há rascunho, o realce é a PRÉVIA: a ponta fixa mais onde o mouse (ou o foco do
  // teclado) está agora. Sem isso, escolher intervalo é apontar no escuro e conferir depois.
  const realce: Periodo = rascunho
    ? prevendo
      ? ordenar({ inicio: rascunho, fim: prevendo })
      : { inicio: rascunho, fim: rascunho }
    : escolhido

  const temValor = Boolean(escolhido.inicio && escolhido.fim)

  /**
   * O rótulo de fora **soma** com o valor, não o substitui.
   *
   * Um `aria-label` num `<button>` APAGA o conteúdo dele do nome acessível — então
   * `<CampoPeriodo aria-label="Período">` anunciaria "Período, botão" e o período escolhido,
   * que é a única informação que importa ali, sumiria justamente para quem não vê a tela. O
   * teste que pegou isso é o do travessão. Compondo, a pessoa ouve "Período: 15/06/2026 a
   * 30/06/2026"; sem rótulo nenhum, o nome cai no conteúdo do botão, que já diz as datas.
   */
  const rotuloExterno = rest['aria-label']
  const rotuloValor = temValor
    ? `${formatarData(escolhido.inicio as Date, formato)} a ${formatarData(escolhido.fim as Date, formato)}`
    : placeholder
  const nomeDoGatilho = rotuloExterno ? `${rotuloExterno}: ${rotuloValor}` : undefined

  return (
    <div ref={raizRef} className={cx('amb-campo-periodo', `amb-campo-periodo--${size}`, className)}>
      <button
        {...rest}
        ref={gatilhoRef}
        type="button"
        className="amb-campo-periodo__gatilho amb-focus-ring"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={nomeDoGatilho}
        disabled={disabled}
        onClick={() => (aberto ? fechar(true) : setAberto(true))}
      >
        <span className="amb-campo-periodo__icone" aria-hidden="true">
          <IconeCalendario />
        </span>
        {temValor ? (
          <span className="amb-campo-periodo__texto">
            {formatarData(escolhido.inicio as Date, formato)}
            {/* O travessão é desenho: o leitor de tela leria "traço" ou nada. Quem carrega o
                sentido é o " a ", que só ele ouve — "15/06/2026 a 30/06/2026". */}
            <span aria-hidden="true"> – </span>
            <span className="amb-sr-only"> a </span>
            {formatarData(escolhido.fim as Date, formato)}
          </span>
        ) : (
          <span className="amb-campo-periodo__texto amb-campo-periodo__texto--vazio">
            {placeholder}
          </span>
        )}
      </button>

      {/* Só existe no DOM quando aberto: painel escondido por CSS continua sendo lido por
          leitor de tela e tabulável em parte dos navegadores. */}
      {aberto && (
        <div
          ref={painelRef}
          role="dialog"
          aria-label="Escolher período"
          className="amb-campo-periodo__painel"
          onKeyDown={aoTeclarNoPainel}
        >
          {atalhos.length > 0 && (
            <div className="amb-campo-periodo__atalhos" role="group" aria-label="Períodos prontos">
              {atalhos.map(atalho => (
                <button
                  key={atalho.rotulo}
                  type="button"
                  className="amb-campo-periodo__atalho amb-focus-ring"
                  onClick={() => aplicarAtalho(atalho)}
                >
                  {atalho.rotulo}
                </button>
              ))}
            </div>
          )}

          <div className="amb-campo-periodo__calendarios">
            <Calendario
              // valor={null}: neste modo quem desenha a seleção é o `realce` — as duas pontas
              // e o miolo. Um `valor` solto acenderia um 42º dia sem relação com o intervalo.
              valor={null}
              onChange={clicarDia}
              min={min}
              max={max}
              locale={locale}
              mes={mesAncora}
              onMesChange={setMesAncora}
              realce={realce}
              onDiaEntrar={setPrevendo}
              setas={duasVistas ? 'esquerda' : 'ambas'}
            />
            {duasVistas && (
              <Calendario
                valor={null}
                onChange={clicarDia}
                min={min}
                max={max}
                locale={locale}
                mes={somarMeses(mesAncora, 1)}
                // O segundo mês é sempre âncora+1: navegar por ele move a âncora um mês atrás
                // do que ele pediu, e os dois andam juntos em vez de se cruzarem.
                onMesChange={m => setMesAncora(somarMeses(m, -1))}
                realce={realce}
                onDiaEntrar={setPrevendo}
                setas="direita"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
})
