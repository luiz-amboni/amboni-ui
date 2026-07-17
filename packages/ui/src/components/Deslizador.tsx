import {
  forwardRef,
  useCallback,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from '../utils/cx'
import './Deslizador.css'

export type DeslizadorSize = 'sm' | 'md' | 'lg'

export interface MarcaDeslizador {
  valor: number
  /** O que aparece embaixo do risco. Sem isto, cai no `formatarRotulo` e depois no número. */
  rotulo?: ReactNode
}

/**
 * No modo simples o ref aponta para o `<input type="range">`; com `intervalo`, para a ponta
 * MÍNIMA (que é focável). São elementos diferentes por baixo — o que interessa na prática
 * (`.focus()`, mandar o foco para o controle que falhou na validação) funciona nos dois.
 */
export type DeslizadorRef = HTMLInputElement | HTMLDivElement

interface DeslizadorBase extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** @default 0 */
  min?: number
  /** @default 100 */
  max?: number
  /** @default 1 */
  passo?: number
  /** Riscos de referência. São `aria-hidden`: o valor já é anunciado pelo próprio controle. */
  marcas?: MarcaDeslizador[]
  /**
   * Como o número vira texto. **Ligue sempre que o número não for um número puro.**
   *
   * Vira `aria-valuetext`, e é a diferença entre o leitor de tela dizer "1500" e dizer
   * "R$ 1.500,00" — ver a nota no JSDoc do componente.
   */
  formatarRotulo?: (valor: number) => string
  disabled?: boolean
  /** @default 'md' */
  size?: DeslizadorSize
  /**
   * Mostra o valor atual em cima do controle. Puramente visual (`aria-hidden`) — quem
   * anuncia é o `aria-valuetext`.
   */
  mostrarValor?: boolean
  /**
   * Os nomes das duas pontas, só no modo `intervalo`. Precisam ser DIFERENTES: dois
   * sliders chamados "Preço" deixam quem usa leitor de tela sem saber qual é qual.
   * @default ['Mínimo', 'Máximo']
   */
  rotuloPontas?: [string, string]
}

/**
 * O modelo de valor MUDA com `intervalo`, e o tipo acompanha: com `intervalo`, `valor` é um
 * par e o `onChange` devolve um par.
 */
export type DeslizadorProps =
  | (DeslizadorBase & { intervalo?: false; valor: number; onChange: (valor: number) => void })
  | (DeslizadorBase & {
      intervalo: true
      valor: [number, number]
      onChange: (valor: [number, number]) => void
    })

/**
 * Encaixa no passo e trava nos limites.
 *
 * O `toFixed` não é preciosismo: com `passo={0.1}`, somar em ponto flutuante entrega
 * `0.30000000000000004` — que aparece no rótulo e no valor que vai para o banco.
 */
function noPasso(valor: number, min: number, max: number, passo: number): number {
  const bruto = min + Math.round((valor - min) / passo) * passo
  const casas = (String(passo).split('.')[1] ?? '').length
  return Math.min(max, Math.max(min, Number(bruto.toFixed(casas))))
}

/** Onde a ponta fica na trilha, em %. `max === min` daria divisão por zero. */
function porcento(valor: number, min: number, max: number): number {
  if (max === min) return 0
  return ((valor - min) / (max - min)) * 100
}

/**
 * Deslizador — escolher um número numa faixa.
 *
 * ## A decisão: `<input type="range">` no simples, ARIA só nas duas pontas
 *
 * Uma ponta só é um `<input type="range">` de verdade. Isso é deliberado, e é o que faz
 * este componente não ter os bugs que sliders customizados têm: o teclado, o
 * `aria-valuenow` sempre correto, o arrasto, o suporte a caneta e — o que mais pesa — **o
 * gesto do celular**, onde o navegador já faz o dedo grudar na ponta.
 *
 * Para `intervalo` o nativo simplesmente não serve: não existe input de duas pontas. Aí
 * cada ponta vira um `role="slider"` com `aria-valuemin/now/max` e **`aria-label`
 * diferente em cada uma** ("Mínimo", "Máximo") — sem isso o leitor de tela anuncia dois
 * controles com o mesmo nome e a pessoa não sabe qual está mexendo.
 *
 * ## `aria-valuetext`: o detalhe que quase ninguém faz
 *
 * `aria-valuenow` é **número**, e é o que o leitor de tela lê por padrão. Um slider de preço
 * anuncia **"1500"** quando devia anunciar **"R$ 1.500,00"**; um de prazo anuncia "7" quando
 * devia dizer "7 dias". `aria-valuetext` é o texto que a pessoa OUVE, e é para isso que
 * serve o `formatarRotulo`: ele pinta o rótulo na tela e alimenta o `aria-valuetext` de uma
 * vez, para os dois nunca divergirem.
 *
 * Sem `formatarRotulo` não inventamos `aria-valuetext` — um número puro já é lido certo, e
 * um valuetext redundante só faria o leitor de tela falar duas vezes.
 *
 * ## Teclado
 *
 * Setas = 1 passo · **PageUp/PageDown = 10 passos** · Home/End = min/max.
 *
 * O PageUp/PageDown é tratado por nós **inclusive no modo nativo**, e isso é de propósito:
 * cada navegador escolhe um salto diferente (uns 10% da faixa, outros um punhado de passos),
 * então o mesmo controle andaria distâncias diferentes no Chrome e no Firefox — e diferente
 * do modo `intervalo`, no mesmo produto.
 *
 * ## Limitação conhecida: `intervalo` dentro do `<CampoForm>`
 *
 * No modo simples o `<CampoForm label="Preço">` funciona inteiro: o `<label htmlFor>` acha o
 * `<input>` e o nomeia. **No modo `intervalo` não** — ali o controle é um `<div
 * role="group">`, e `<label htmlFor>` só nomeia elemento de formulário de verdade; um label
 * apontando para um div não nomeia nada. O erro e a ajuda continuam ligados (vão por
 * `aria-describedby` em cada ponta), mas o NOME não.
 *
 * Então, com `intervalo`, passe também um `aria-label`:
 *
 * ```tsx
 * <CampoForm label="Faixa de preço" erro={erro}>
 *   <Deslizador intervalo aria-label="Faixa de preço" valor={faixa} onChange={setFaixa} />
 * </CampoForm>
 * ```
 *
 * Repetir o texto é feio e é o mal menor: a alternativa seria o grupo herdar um
 * `aria-labelledby` do wrapper, o que obrigaria o `<CampoForm>` a dar um id ao próprio
 * `<label>` — mudar o contrato de todos os controles da casa por causa de um.
 *
 * @example Preço — o rótulo formatado é o que se ouve
 * <Deslizador
 *   aria-label="Preço máximo" valor={preco} onChange={setPreco}
 *   min={0} max={5000} passo={50}
 *   formatarRotulo={v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
 * />
 *
 * @example Faixa
 * <Deslizador
 *   intervalo aria-label="Faixa de preço" valor={faixa} onChange={setFaixa}
 *   min={0} max={5000} passo={50} formatarRotulo={reais}
 * />
 */
export const Deslizador = forwardRef<DeslizadorRef, DeslizadorProps>(function Deslizador(props, ref) {
  const {
    min = 0,
    max = 100,
    passo = 1,
    marcas,
    formatarRotulo,
    disabled,
    size = 'md',
    mostrarValor,
    rotuloPontas = ['Mínimo', 'Máximo'],
    intervalo,
    valor,
    className,
    // ── A fiação do formulário: quem é o CONTROLE, e quem é só a caixa ────────
    // Tudo isto é puxado para fora do `rest` porque o dono muda com o modo. `rest` vai no
    // invólucro, que é um <div> de desenho — e um `id` no <div> faz o `<label htmlFor>` do
    // <CampoForm> apontar para uma CAIXA em vez do controle: o rótulo vira mudo, e o axe
    // acusa "Form elements must have labels". Foi assim que este bug apareceu.
    id: idProp,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...rest
  } = props as DeslizadorBase & { intervalo?: boolean; valor: number | [number, number] }

  const trilhaRef = useRef<HTMLDivElement>(null)

  const texto = useCallback((v: number) => formatarRotulo?.(v), [formatarRotulo])

  /** Onde o ponteiro está, já encaixado no passo. */
  const valorNoPonto = useCallback(
    (clientX: number) => {
      const r = trilhaRef.current?.getBoundingClientRect()
      if (!r || r.width === 0) return min
      const razao = (clientX - r.left) / r.width
      return noPasso(min + razao * (max - min), min, max, passo)
    },
    [min, max, passo],
  )

  /**
   * A conta de teclado, uma só para os dois modos. Devolve `null` quando a tecla não é nossa
   * — é o que deixa o Tab e o resto seguirem o caminho normal.
   */
  const teclaParaValor = useCallback(
    (e: KeyboardEvent, atual: number): number | null => {
      // O salto grande é 10 PASSOS, não 10% da faixa: com passo=50 num max=5000, 10% seria
      // exatamente 10 passos por coincidência — mas com passo=1 num max=1000 viraria 100
      // passos, e a pessoa perderia o lugar a cada toque.
      const grande = passo * 10
      switch (e.key) {
        // Direita/cima crescem nos dois eixos: é o que o leitor de tela e o hábito esperam
        // num slider horizontal.
        case 'ArrowRight':
        case 'ArrowUp':
          return atual + passo
        case 'ArrowLeft':
        case 'ArrowDown':
          return atual - passo
        case 'PageUp':
          return atual + grande
        case 'PageDown':
          return atual - grande
        case 'Home':
          return min
        case 'End':
          return max
        default:
          return null
      }
    },
    [min, max, passo],
  )

  const marcasVisiveis = marcas?.length ? (
    <div className="amb-deslizador__marcas" aria-hidden="true">
      {marcas.map(m => (
        <span
          key={m.valor}
          className="amb-deslizador__marca"
          style={{ left: `${porcento(m.valor, min, max)}%` }}
        >
          <span className="amb-deslizador__marca-risco" />
          <span className="amb-deslizador__marca-rotulo">{m.rotulo ?? texto(m.valor) ?? m.valor}</span>
        </span>
      ))}
    </div>
  ) : null

  const classes = cx(
    'amb-deslizador',
    `amb-deslizador--${size}`,
    disabled && 'amb-deslizador--desabilitado',
    marcas?.length && 'amb-deslizador--com-marcas',
    className,
  )

  /* ══════════════════════════════════════════════════════════════════════════
   * Duas pontas — ARIA à mão, porque o nativo não existe
   * ════════════════════════════════════════════════════════════════════════ */
  if (intervalo) {
    const [vMin, vMax] = valor as [number, number]
    const onChange = props.onChange as (v: [number, number]) => void

    /**
     * As pontas se cruzam: o que fazer.
     *
     * Escolhemos **travar uma na outra** — a ponta mínima para quando encosta na máxima.
     * A alternativa comum (deixar cruzar e TROCAR os papéis) parece esperta e é hostil: a
     * ponta que o dedo está arrastando vira, do nada, a outra ponta; e no teclado a pessoa
     * segura a seta para a direita, o valor cruza, o controle passa a ser o outro e o número
     * começa a DESCER enquanto ela ainda aperta para a direita. Travar não surpreende
     * ninguém: acabou, acabou.
     */
    const mexer = (qual: 0 | 1, bruto: number) => {
      const v = noPasso(bruto, min, max, passo)
      if (qual === 0) onChange([Math.min(v, vMax), vMax])
      else onChange([vMin, Math.max(v, vMin)])
    }

    const aoTeclar = (qual: 0 | 1) => (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      const novo = teclaParaValor(e, qual === 0 ? vMin : vMax)
      if (novo === null) return
      // preventDefault: sem ele, a seta e o PageUp rolam a página junto, e o controle "anda"
      // enquanto a tela foge debaixo dele.
      e.preventDefault()
      mexer(qual, novo)
    }

    const aoArrastar = (qual: 0 | 1) => (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return
      const ponta = e.currentTarget
      // setPointerCapture: o arrasto continua valendo mesmo quando o dedo/ponteiro sai de
      // cima da ponta — que é o que SEMPRE acontece num gesto rápido. Sem isto o slider
      // "solta" no meio do caminho.
      ponta.setPointerCapture(e.pointerId)
      // O foco vai para a ponta arrastada: quem pegou no mouse e quer terminar no teclado
      // continua de onde parou.
      ponta.focus()

      const mover = (ev: PointerEvent) => mexer(qual, valorNoPonto(ev.clientX))
      const soltar = () => {
        ponta.removeEventListener('pointermove', mover)
        ponta.removeEventListener('pointerup', soltar)
        ponta.removeEventListener('pointercancel', soltar)
      }
      ponta.addEventListener('pointermove', mover)
      ponta.addEventListener('pointerup', soltar)
      ponta.addEventListener('pointercancel', soltar)
    }

    const propsPonta = (qual: 0 | 1) => {
      const v = qual === 0 ? vMin : vMax
      return {
        role: 'slider' as const,
        // 0 e não -1: as duas pontas são paradas do Tab. É o único jeito de alcançar a
        // segunda sem mouse.
        tabIndex: disabled ? -1 : 0,
        'aria-label': rotuloPontas[qual],
        'aria-valuemin': qual === 0 ? min : vMin,
        'aria-valuemax': qual === 0 ? vMax : max,
        'aria-valuenow': v,
        // O texto que a pessoa OUVE. Ver o JSDoc.
        'aria-valuetext': texto(v),
        'aria-disabled': disabled || undefined,
        'aria-orientation': 'horizontal' as const,
        // A descrição (a mensagem de erro do <CampoForm>) vai em CADA ponta, e não só no
        // grupo: é na ponta que o foco está, e é lá que a pessoa precisa ouvir o motivo.
        'aria-describedby': ariaDescribedBy,
        'aria-invalid': ariaInvalid,
        className: cx('amb-deslizador__ponta', 'amb-focus-ring'),
        style: { left: `${porcento(v, min, max)}%` },
        onKeyDown: aoTeclar(qual),
        onPointerDown: aoArrastar(qual),
      }
    }

    return (
      <div
        // `rest` primeiro: o que este componente controla vence o que vier por fora.
        {...rest}
        // role="group" e não "slider": o slider é cada ponta. O grupo é o que dá um nome
        // guarda-chuva ("Faixa de preço") para as duas — o `aria-label` de quem usa cai aqui.
        role="group"
        id={idProp}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={classes}
      >
        {mostrarValor && (
          <div className="amb-deslizador__valor" aria-hidden="true">
            {texto(vMin) ?? vMin} – {texto(vMax) ?? vMax}
          </div>
        )}

        <div ref={trilhaRef} className="amb-deslizador__trilha">
          <div
            className="amb-deslizador__preenchimento"
            style={{
              left: `${porcento(vMin, min, max)}%`,
              width: `${porcento(vMax, min, max) - porcento(vMin, min, max)}%`,
            }}
          />
          <div ref={ref as Ref<HTMLDivElement>} {...propsPonta(0)} />
          <div {...propsPonta(1)} />
        </div>

        {marcasVisiveis}
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * Uma ponta — o <input type="range"> nativo
   * ════════════════════════════════════════════════════════════════════════ */
  const v = valor as number
  const onChange = props.onChange as (v: number) => void

  return (
    <div {...rest} className={classes}>
      {mostrarValor && (
        <div className="amb-deslizador__valor" aria-hidden="true">
          {texto(v) ?? v}
        </div>
      )}

      <div ref={trilhaRef} className="amb-deslizador__trilha">
        <div className="amb-deslizador__preenchimento" style={{ left: 0, width: `${porcento(v, min, max)}%` }} />
        <input
          ref={ref as Ref<HTMLInputElement>}
          // O id vem para o INPUT, não para o invólucro: é ele que o `<label htmlFor>` do
          // <CampoForm> precisa achar. Ver a nota na desestruturação.
          id={idProp}
          type="range"
          className="amb-deslizador__nativo amb-focus-ring"
          min={min}
          max={max}
          step={passo}
          value={v}
          disabled={disabled}
          // O nativo já entrega valuenow/valuemin/valuemax sozinho. Só o texto falta —
          // ver o JSDoc.
          aria-valuetext={texto(v)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          onChange={e => onChange(noPasso(Number(e.target.value), min, max, passo))}
          onKeyDown={e => {
            if (e.key !== 'PageUp' && e.key !== 'PageDown') return
            // Só estas duas: o resto do teclado o nativo já faz certo, e reimplementar seria
            // trocar um comportamento testado por um nosso. Ver a nota sobre PageUp no JSDoc.
            const novo = teclaParaValor(e, v)
            if (novo === null) return
            e.preventDefault()
            onChange(noPasso(novo, min, max, passo))
          }}
        />
      </div>

      {marcasVisiveis}
    </div>
  )
})
