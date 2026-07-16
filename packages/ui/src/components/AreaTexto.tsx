import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from 'react'
import { cx } from '../utils/cx'
import './AreaTexto.css'

export interface AreaTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * A caixa cresce conforme o texto, sem barra de rolagem interna.
   * Desliga o "puxador" de redimensionar do navegador — os dois brigam pela altura.
   */
  autoResize?: boolean
  /**
   * Mostra a contagem embaixo. Com `maxLength`, vira "120/500"; sem ele, "120 caracteres".
   * O porquê de contar sem limite: ver o comentário no componente.
   */
  contador?: boolean
  /**
   * Limite de caracteres. **Atenção:** o navegador bloqueia a digitação no limite EM
   * SILÊNCIO e corta texto colado sem avisar. É por isso que o `contador` existe.
   */
  maxLength?: number
  /**
   * Pinta a moldura de erro. Como no `Campo`, não precisa passar se estiver dentro de um
   * `<CampoForm erro="...">` — o `aria-invalid` do wrapper já faz isso.
   */
  erro?: boolean
}

/** A partir de quanto do limite o contador muda de cor (90%). */
const LIMITE_ALERTA = 0.9

/**
 * Área de texto (textarea).
 *
 * @example
 * <CampoForm label="Observação" ajuda="máximo de 500 caracteres">
 *   <AreaTexto maxLength={500} contador autoResize />
 * </CampoForm>
 */
export const AreaTexto = forwardRef<HTMLTextAreaElement, AreaTextoProps>(function AreaTexto(
  { autoResize, contador, maxLength, erro, className, style, rows = 3, onChange, ...rest },
  ref,
) {
  const refInterno = useRef<HTMLTextAreaElement>(null)
  // Igual ao Campo: o ref de fora tem que chegar no <textarea>, não no <div> de fora,
  // ou o `register` do react-hook-form quebra em silêncio.
  useImperativeHandle(ref, () => refInterno.current as HTMLTextAreaElement, [])

  const controlado = rest.value !== undefined
  const [tamanhoLocal, setTamanhoLocal] = useState(() => String(rest.defaultValue ?? '').length)
  const tamanho = controlado ? String(rest.value ?? '').length : tamanhoLocal

  const ajustarAltura = useCallback(() => {
    const el = refInterno.current
    if (!el || !autoResize) return
    // O 'auto' antes de medir NÃO é redundante. `scrollHeight` nunca é menor que a altura
    // atual do elemento; se a altura continuar fixa em 200px de uma medição anterior, ele
    // devolve 200 para sempre. Resultado: a caixa cresce e nunca mais encolhe ao apagar.
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [autoResize])

  // useLayoutEffect e não useEffect: o ajuste acontece antes do navegador pintar. Com
  // useEffect a caixa aparece na altura errada por um frame e "pula" na frente da pessoa.
  // Depende de `rest.value` para acompanhar o campo controlado; o não controlado é
  // ajustado no onChange, porque nele o React não re-renderiza a cada tecla.
  useLayoutEffect(ajustarAltura, [ajustarAltura, rest.value])

  function aoDigitar(e: ChangeEvent<HTMLTextAreaElement>) {
    if (contador && !controlado) setTamanhoLocal(e.currentTarget.value.length)
    ajustarAltura()
    onChange?.(e)
  }

  const ariaInvalid = rest['aria-invalid']
  const invalido = erro === true || ariaInvalid === true || ariaInvalid === 'true'

  // Contador sem maxLength: contra o que contar? Decisão — conta mesmo assim, e mostra só
  // o número ("120 caracteres"). Existe caso real sem limite técnico mas com limite humano
  // (uma observação que ninguém vai ler se passar de 3 linhas), e ver o número já regula a
  // escrita. Some seria pior: a prop foi pedida de propósito, e ignorá-la em silêncio é o
  // tipo de coisa que se descobre em produção.
  const temLimite = typeof maxLength === 'number'
  const perto = temLimite && tamanho >= maxLength * LIMITE_ALERTA

  return (
    <div className={cx('amb-area', className)} style={style}>
      <textarea
        ref={refInterno}
        className={cx(
          'amb-area__campo',
          'amb-focus-ring',
          invalido && 'amb-area__campo--erro',
          autoResize && 'amb-area__campo--auto',
        )}
        rows={rows}
        maxLength={maxLength}
        onChange={aoDigitar}
        {...rest}
        aria-invalid={invalido || undefined}
      />

      {/* O contador NÃO é live region. Um aria-live aqui dispararia a cada tecla e o leitor
          de tela ficaria interrompendo a própria pessoa a cada letra — inutilizável. Ele
          fica no DOM, legível por quem navegar até ele; o limite quem anuncia é o texto de
          `ajuda` do CampoForm ("máximo de 500 caracteres"), dito uma vez, no foco. */}
      {contador && (
        <div
          className={cx('amb-area__contador', 'amb-tabular', perto && 'amb-area__contador--perto')}
        >
          {temLimite ? `${tamanho}/${maxLength}` : `${tamanho} caracteres`}
        </div>
      )}
    </div>
  )
})
