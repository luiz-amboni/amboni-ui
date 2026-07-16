import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './Interruptor.css'

export type InterruptorSize = 'sm' | 'md'

export interface InterruptorProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'role'> {
  /** O que liga/desliga. Escreva o ESTADO LIGADO ("Enviar dicas automáticas"), nunca
   *  a ação ("Ligar envio") — o rótulo não muda quando o interruptor muda. */
  label: ReactNode
  /** Linha de apoio: o efeito de ligar. É onde cabe o aviso de que vale na hora. */
  descricao?: ReactNode
  /** `sm` para dentro de linha de tabela; `md` para formulário. @default 'md' */
  size?: InterruptorSize
}

/**
 * Interruptor — liga/desliga que vale AGORA.
 *
 * **Interruptor ou Caixa?** É a confusão mais comum do design system, e a diferença
 * é de comportamento, não de aparência:
 *
 * · `<Interruptor>` aplica na hora. Não existe "Salvar" depois dele. Ao acionar,
 *   algo muda no sistema imediatamente — o envio começa, o robô liga. Se a ação é
 *   lenta ou pode falhar, o produto precisa mostrar o resultado (e reverter o
 *   estado se der erro), porque a pessoa já foi embora achando que ficou feito.
 * · `<Caixa>` é campo de formulário. A escolha só vale no "Salvar" e dá para
 *   desistir antes.
 *
 * O leitor de tela também trata os dois de forma diferente: `role="switch"` é
 * anunciado como "ligado/desligado", checkbox como "marcado/desmarcado". Usar o
 * errado mente sobre o que vai acontecer.
 *
 * @example Vale na hora — o robô liga neste clique
 * <Interruptor
 *   label="Enviar dicas automáticas"
 *   descricao="começa no próximo ciclo, às 9h"
 *   checked={ativo}
 *   onChange={e => salvarAgora(e.target.checked)}
 * />
 *
 * @example Dentro de linha de tabela
 * <Interruptor size="sm" label="Ativa" checked={campanha.ativa} onChange={alternar} />
 */
export const Interruptor = forwardRef<HTMLInputElement, InterruptorProps>(function Interruptor(
  {
    label,
    descricao,
    size = 'md',
    className,
    id,
    disabled,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const idAuto = useId()
  const idInput = id ?? idAuto
  const idDescricao = `${idInput}-descricao`

  return (
    <div
      className={cx(
        'amb-interruptor',
        `amb-interruptor--${size}`,
        disabled && 'amb-interruptor--desabilitado',
        className,
      )}
    >
      <input
        // Continua sendo um checkbox por baixo: é o que dá teclado, foco, o valor no
        // <form> e o `checked` — nada disso existe em <div role="switch">. O `role`
        // só troca o ANÚNCIO: "ligado/desligado" em vez de "marcado/desmarcado", e o
        // navegador deriva o aria-checked do estado nativo sozinho.
        type="checkbox"
        role="switch"
        ref={ref}
        id={idInput}
        className={cx('amb-interruptor__input', 'amb-focus-ring')}
        disabled={disabled}
        // Ternário e não `descricao && id`: ReactNode aceita 0, e `0 && x` devolve 0.
        aria-describedby={cx(ariaDescribedBy, descricao ? idDescricao : undefined) || undefined}
        {...rest}
      />

      {/* Trilho e botão são irmãos do input, pintados por `:checked +`. Ver o CSS. */}
      <span className="amb-interruptor__trilho" aria-hidden="true">
        <span className="amb-interruptor__polegar" />
      </span>

      <label htmlFor={idInput} className="amb-interruptor__rotulo">
        {label}
      </label>

      {descricao && (
        <p id={idDescricao} className="amb-interruptor__descricao">
          {descricao}
        </p>
      )}
    </div>
  )
})
