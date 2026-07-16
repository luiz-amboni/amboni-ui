import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './Caixa.css'

export interface CaixaProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** O que está sendo marcado. Clicar nele marca a caixa — é o que todo mundo espera. */
  label: ReactNode
  /**
   * Linha de apoio abaixo do rótulo: a consequência da escolha, não a repetição dela.
   * Ruim: "Receber e-mails". Bom: "no máximo um por semana, dá para sair quando quiser".
   */
  descricao?: ReactNode
  /**
   * Parcialmente marcada — o caso do "selecionar todos" com alguns filhos marcados.
   * **Não é um terceiro valor de `checked`**: visualmente e para o leitor de tela é
   * "misto", mas o `checked` por baixo continua sendo o que vai no `<form>`.
   */
  indeterminado?: boolean
  /**
   * A mensagem do erro, não um booleano: `erro` pintado de vermelho sem texto obriga
   * a pessoa a adivinhar o que fez de errado. O texto é lido pelo leitor de tela via
   * `aria-describedby`, então a cor nunca é o único sinal.
   */
  erro?: string
}

/** Marcas desenhadas aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function Check() {
  return (
    <svg className="amb-caixa__check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.2 L4.8 8.5 L9.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Traco() {
  return (
    <svg className="amb-caixa__traco" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 6 H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Caixa de seleção.
 *
 * **Caixa ou Interruptor?** A caixa faz parte de um formulário: a escolha só vale
 * depois do "Salvar", e dá para desistir. O `<Interruptor>` aplica na hora, sem
 * confirmação. Trocar um pelo outro é o erro de uso mais comum — a pessoa marca a
 * caixa achando que já ligou algo, ou aciona o interruptor achando que ainda pode
 * voltar atrás.
 *
 * @example
 * <Caixa label="Enviar dica no D+15" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
 *
 * @example "Selecionar todos" com parte dos filhos marcada
 * <Caixa
 *   label="Todos os clientes"
 *   checked={todosMarcados}
 *   indeterminado={algunsMarcados && !todosMarcados}
 *   onChange={alternarTodos}
 * />
 */
export const Caixa = forwardRef<HTMLInputElement, CaixaProps>(function Caixa(
  {
    label,
    descricao,
    indeterminado = false,
    erro,
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
  const idErro = `${idInput}-erro`

  // Precisamos do nó real para mexer em `.indeterminate`, mas quem usa o componente
  // também tem direito ao ref (react-hook-form registra por ele). Os dois apontam
  // para o MESMO <input> nativo — não para um wrapper.
  const interno = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => interno.current as HTMLInputElement, [])

  useEffect(() => {
    // Armadilha: "indeterminate" não existe como atributo HTML. Escrever
    // `<input indeterminate>` não faz absolutamente nada — só a propriedade do DOM
    // liga o estado misto (e o `:indeterminate` do CSS, que é quem desenha o traço).
    // Por isso este efeito existe: não há como fazer isso declarativamente no JSX.
    if (interno.current) interno.current.indeterminate = indeterminado
  }, [indeterminado])

  // Ternário em vez de `descricao && id`: ReactNode aceita 0, e `0 && x` devolve 0 —
  // que o cx() jogaria fora, mas o TypeScript reclama antes. Uma descrição "0" é
  // improvável; o custo de não confiar no && aqui é zero.
  const descrito =
    cx(ariaDescribedBy, descricao ? idDescricao : undefined, erro ? idErro : undefined) || undefined

  return (
    <div
      className={cx(
        'amb-caixa',
        erro && 'amb-caixa--erro',
        disabled && 'amb-caixa--desabilitada',
        className,
      )}
    >
      <input
        // `type` sai das props de propósito: uma <Caixa type="text"> compila mas
        // destrói o componente inteiro em silêncio.
        type="checkbox"
        ref={interno}
        id={idInput}
        className={cx('amb-caixa__input', 'amb-focus-ring')}
        disabled={disabled}
        // A propriedade do DOM acima já faz o navegador anunciar "misto", mas só
        // quando ele está de bom humor: alguns leitores de tela leem o atributo ARIA
        // e ignoram a propriedade. Espelhar aqui cobre os dois. Quando NÃO é misto,
        // fica `undefined` — aí o estado nativo manda, que é sempre mais confiável
        // do que a gente reescrever `checked` em ARIA.
        aria-checked={indeterminado ? 'mixed' : undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito}
        {...rest}
      />

      {/* O desenho é um IRMÃO do input, pintado por `:checked +` no CSS. Ver o
          comentário do Caixa.css: é a decisão que sustenta o componente. */}
      <span className="amb-caixa__marca" aria-hidden="true">
        <Check />
        <Traco />
      </span>

      <label htmlFor={idInput} className="amb-caixa__rotulo">
        {label}
      </label>

      {descricao && (
        <p id={idDescricao} className="amb-caixa__descricao">
          {descricao}
        </p>
      )}

      {erro && (
        <p id={idErro} className="amb-caixa__erro">
          {erro}
        </p>
      )}
    </div>
  )
})
