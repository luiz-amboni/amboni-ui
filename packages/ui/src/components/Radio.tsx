import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './Radio.css'

/**
 * O grupo passa `name`/`value`/`onChange` para os filhos por contexto em vez de
 * clonar `children`: clonar quebra na hora que alguém envolve um <Radio> num
 * wrapper (um `<Tooltip>`, um `.map` dentro de um sub-componente) — e é exatamente
 * o que as pessoas fazem. O contexto atravessa qualquer profundidade.
 */
interface ContextoGrupo {
  name: string
  value?: string
  onChange?: (value: string) => void
}
const GrupoRadioContexto = createContext<ContextoGrupo | null>(null)

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value'> {
  /** A opção. Clicar nele seleciona — como no rótulo de qualquer controle nativo. */
  label: ReactNode
  /** Linha de apoio: a consequência de escolher esta opção, não a repetição do rótulo. */
  descricao?: ReactNode
  /** O valor que vai no formulário quando esta opção estiver escolhida. */
  value: string
}

/**
 * Uma opção de escolha única. Quase sempre dentro de um `<GrupoRadio>` — sozinho
 * ele existe, mas um rádio único é um beco sem saída: não dá para desmarcar.
 * Escolha entre "sim/não" é `<Caixa>` ou `<Interruptor>`, não um rádio.
 *
 * @example
 * <GrupoRadio label="Enviar quando" name="quando" value={quando} onChange={setQuando}>
 *   <Radio value="d3" label="D+3" descricao="logo depois da entrega" />
 *   <Radio value="d15" label="D+15" />
 * </GrupoRadio>
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    label,
    descricao,
    value,
    className,
    id,
    name,
    checked,
    disabled,
    onChange,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const grupo = useContext(GrupoRadioContexto)
  const idAuto = useId()
  const idInput = id ?? idAuto
  const idDescricao = `${idInput}-descricao`

  // Um grupo SEM `value` é um grupo não-controlado (o DOM guarda a escolha). Nesse
  // caso não podemos cravar `checked`: React passaria a chamar de controlado e
  // travaria o rádio para sempre, porque não há estado para atualizar.
  const controladoPeloGrupo = grupo != null && grupo.value !== undefined

  function aoMudar(evento: ChangeEvent<HTMLInputElement>) {
    // O onChange do grupo e o do próprio rádio convivem: o primeiro atualiza a
    // escolha, o segundo é o gancho de quem quer reagir só a esta opção.
    if (evento.target.checked) grupo?.onChange?.(value)
    onChange?.(evento)
  }

  return (
    <div className={cx('amb-radio', disabled && 'amb-radio--desabilitado', className)}>
      <input
        // `type` fora das props: um <Radio type="checkbox"> compila e destrói a
        // semântica de escolha única em silêncio.
        type="radio"
        ref={ref}
        id={idInput}
        className={cx('amb-radio__input', 'amb-focus-ring')}
        value={value}
        // O `name` compartilhado é o que faz o navegador tratar os rádios como um
        // grupo: setas navegando entre eles, um só marcado, um só valor no <form>.
        // É de graça, e reimplementar isso com onKeyDown só quebra o que já funciona.
        name={name ?? grupo?.name}
        checked={controladoPeloGrupo ? grupo.value === value : checked}
        disabled={disabled}
        onChange={aoMudar}
        // Ternário e não `descricao && id`: ReactNode aceita 0, e `0 && x` devolve 0.
        aria-describedby={cx(ariaDescribedBy, descricao ? idDescricao : undefined) || undefined}
        {...rest}
      />

      {/* Desenho é irmão do input, pintado por `:checked +`. Ver o Radio.css. */}
      <span className="amb-radio__marca" aria-hidden="true">
        <span className="amb-radio__ponto" />
      </span>

      <label htmlFor={idInput} className="amb-radio__rotulo">
        {label}
      </label>

      {descricao && (
        <p id={idDescricao} className="amb-radio__descricao">
          {descricao}
        </p>
      )}
    </div>
  )
})

export type OrientacaoGrupoRadio = 'vertical' | 'horizontal'

export interface GrupoRadioProps {
  /** A PERGUNTA ("Enviar quando?"), não a resposta. É o que o leitor de tela anuncia
   *  ao entrar no grupo. */
  label: ReactNode
  /** Compartilhado por todos os rádios do grupo. É ele que liga a navegação por setas. */
  name: string
  /** Omita para um grupo não-controlado (o DOM guarda a escolha). */
  value?: string
  /** Recebe o `value` da opção escolhida — não o evento. O evento quase nunca é o
   *  que se quer aqui, e `e.target.value` em toda tela é ruído. */
  onChange?: (value: string) => void
  /**
   * `horizontal` só para 2–3 opções de rótulo curto. Acima disso a lista vira uma
   * caça ao par certo entre bolinha e texto, e quebra feio no celular.
   * @default 'vertical'
   */
  orientacao?: OrientacaoGrupoRadio
  /** A mensagem do erro. Lida pelo leitor de tela — a cor não é o aviso. */
  erro?: string
  children: ReactNode
  className?: string
}

/**
 * Escolha única entre opções visíveis.
 *
 * O agrupamento não é enfeite: sem ele o leitor de tela anuncia 5 rádios soltos, sem
 * dizer de que pergunta são. Quem chega pelo teclado na terceira opção não faz ideia
 * do que está escolhendo.
 *
 * @example
 * <GrupoRadio label="Canal" name="canal" value={canal} onChange={setCanal} erro={erros.canal}>
 *   <Radio value="wa" label="WhatsApp" descricao="template aprovado pelo Meta" />
 *   <Radio value="sms" label="SMS" />
 * </GrupoRadio>
 */
export function GrupoRadio({
  label,
  name,
  value,
  onChange,
  orientacao = 'vertical',
  erro,
  children,
  className,
}: GrupoRadioProps) {
  const idBase = useId()
  const idLabel = `${idBase}-label`
  const idErro = `${idBase}-erro`

  return (
    // `role="radiogroup"` + `aria-labelledby`: é o par que faz o leitor de tela dizer
    // "Canal, grupo de opções, WhatsApp, 1 de 2". Um <fieldset>/<legend> daria o mesmo
    // de graça, mas legend não se deixa posicionar com grid/flex em nenhum navegador
    // — o custo de estilizar não paga.
    <div
      role="radiogroup"
      aria-labelledby={idLabel}
      aria-describedby={erro ? idErro : undefined}
      aria-invalid={erro ? true : undefined}
      className={cx('amb-radio-grupo', erro && 'amb-radio-grupo--erro', className)}
    >
      <span id={idLabel} className="amb-radio-grupo__label">
        {label}
      </span>

      <GrupoRadioContexto.Provider value={{ name, value, onChange }}>
        <div className={cx('amb-radio-grupo__itens', `amb-radio-grupo__itens--${orientacao}`)}>
          {children}
        </div>
      </GrupoRadioContexto.Provider>

      {erro && (
        <p id={idErro} className="amb-radio-grupo__erro">
          {erro}
        </p>
      )}
    </div>
  )
}
