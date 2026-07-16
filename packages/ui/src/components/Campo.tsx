import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './Campo.css'

export type CampoSize = 'sm' | 'md' | 'lg'

// Omit<'size'>: o <input> do HTML já tem um atributo `size` — a largura em número de
// caracteres, coisa de 1995 que ninguém usa. A nossa prop `size` é a altura do controle
// ('sm'|'md'|'lg'). Os dois não cabem no mesmo nome e, sem o Omit, o TypeScript recusa a
// interface inteira. Mesmo caminho que o MUI usa.
export interface CampoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Altura do controle. @default 'md' */
  size?: CampoSize
  /** Ícone antes do texto (lupa, calendário). Decorativo — quem narra o campo é o label. */
  iconeEsq?: ReactNode
  /** Ícone depois do texto. */
  iconeDir?: ReactNode
  /**
   * Pinta a moldura de erro. **Não precisa passar** se o campo está dentro de um
   * `<CampoForm erro="...">`: o wrapper já manda `aria-invalid` e o campo se pinta sozinho.
   * Use apenas para validação solta, sem CampoForm.
   */
  erro?: boolean
  /**
   * Texto colado na esquerda, dentro da moldura ("R$", "https://").
   * **Não é lido pelo leitor de tela** — veja o comentário no JSX.
   */
  prefixo?: ReactNode
  /** Texto colado na direita, dentro da moldura ("kg", "%", ".com.br"). */
  sufixo?: ReactNode
  /** Mostra um X para esvaziar o campo quando ele tem conteúdo. */
  limpar?: boolean
}

/** X desenhado aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function IconeX() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Campo de texto.
 *
 * As cores vêm do tema e já passaram no teste de contraste (@amboni/tokens), então ele é
 * legível em iSafe/VEAR × claro/escuro sem nenhum ajuste no produto.
 *
 * @example
 * <Campo placeholder="Buscar cliente" iconeEsq={<Lupa />} limpar />
 * <Campo prefixo="R$" inputMode="decimal" size="lg" />
 *
 * @example O jeito certo — dentro de um CampoForm, que amarra label e erro
 * <CampoForm label="E-mail" erro={erros.email} obrigatorio>
 *   <Campo type="email" />
 * </CampoForm>
 */
export const Campo = forwardRef<HTMLInputElement, CampoProps>(function Campo(
  {
    size = 'md',
    iconeEsq,
    iconeDir,
    erro,
    prefixo,
    sufixo,
    limpar,
    className,
    style,
    disabled,
    readOnly,
    onChange,
    ...rest
  },
  ref,
) {
  const refInterno = useRef<HTMLInputElement>(null)
  // O ref de fora precisa chegar no <input> de verdade, não no <div> da moldura:
  // react-hook-form chama ref.current.focus() e lê ref.current.value. Se ele pegasse a
  // div, o `register` da lib quebra em silêncio.
  useImperativeHandle(ref, () => refInterno.current as HTMLInputElement, [])

  // Controlado (o produto manda `value`) ou não? O botão de limpar precisa saber se o
  // campo tem conteúdo, e em campo não controlado o React não sabe — só o DOM sabe.
  const controlado = rest.value !== undefined
  const [temValorLocal, setTemValorLocal] = useState(
    () => String(rest.defaultValue ?? '').length > 0,
  )
  const temValor = controlado ? String(rest.value ?? '').length > 0 : temValorLocal

  function aoDigitar(e: ChangeEvent<HTMLInputElement>) {
    // Só guarda estado quando `limpar` está ligado e o campo é não controlado. Sem esta
    // guarda, TODO campo desta biblioteca re-renderizaria a cada tecla digitada só para
    // decidir se mostra um X que nem existe.
    if (limpar && !controlado) setTemValorLocal(e.currentTarget.value.length > 0)
    onChange?.(e)
  }

  function aoLimpar() {
    const input = refInterno.current
    if (!input) return

    // Por que não `input.value = ''` e pronto: o React guarda o último valor num tracker
    // interno; escrever direto na propriedade atualiza o tracker junto, o React conclui
    // que "nada mudou" e o onChange NUNCA dispara. Quem usa react-hook-form ou um
    // useState fica com o estado sujo enquanto a tela mostra o campo vazio.
    // Chamar o setter nativo do prototype passa por fora do tracker: o React vê a
    // diferença e dispara o onChange de verdade.
    const setterNativo = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set
    setterNativo?.call(input, '')
    input.dispatchEvent(new Event('input', { bubbles: true }))

    // O foco volta para o campo porque o botão que acabou de ser clicado some do DOM.
    // Sem isto o foco cai no <body> e quem navega por teclado é jogado para o topo da
    // página, perdendo o lugar no formulário.
    input.focus()
    if (!controlado) setTemValorLocal(false)
  }

  // O CampoForm manda `aria-invalid` pelo cloneElement. Ler esse atributo aqui é o que
  // faz a moldura ficar vermelha sozinha: o produto declara o erro UMA vez, no CampoForm,
  // e não precisa repetir `erro` neste campo. Duas fontes de verdade divergem cedo ou tarde.
  const ariaInvalid = rest['aria-invalid']
  const invalido = erro === true || ariaInvalid === true || ariaInvalid === 'true'

  const mostrarLimpar = Boolean(limpar) && temValor && !disabled && !readOnly

  return (
    // `className` e `style` vão na moldura, não no <input>: a moldura é a caixa que
    // aparece na tela. Quem escreve `<Campo className="w-full">` está falando da caixa.
    <div
      className={cx(
        'amb-campo',
        `amb-campo--${size}`,
        invalido && 'amb-campo--erro',
        disabled && 'amb-campo--desabilitado',
        className,
      )}
      style={style as CSSProperties}
    >
      {/* Afixo é aria-hidden de propósito. Solto no meio da moldura, o leitor de tela leria
          "R$" antes do rótulo, fora de ordem e sem contexto. A unidade é informação do
          RÓTULO: use <CampoForm label="Valor" ajuda="em reais"> — aí ela é anunciada junto
          com o campo, no lugar certo. */}
      {prefixo && (
        <span className="amb-campo__afixo amb-campo__afixo--prefixo" aria-hidden="true">
          {prefixo}
        </span>
      )}
      {iconeEsq && (
        <span className="amb-campo__icone" aria-hidden="true">
          {iconeEsq}
        </span>
      )}

      <input
        ref={refInterno}
        className="amb-campo__input"
        disabled={disabled}
        readOnly={readOnly}
        onChange={aoDigitar}
        {...rest}
        // aria-invalid depois do spread: o `erro` local precisa vencer o atributo cru,
        // senão `<Campo erro />` avisaria o olho e não o leitor de tela.
        aria-invalid={invalido || undefined}
      />

      {/* Ordem dos adornos, da esquerda para a direita: prefixo · ícone · TEXTO · limpar ·
          ícone · sufixo. O X fica colado no texto que ele apaga; o que é moldura (afixo)
          fica na borda. */}
      {mostrarLimpar && (
        <button
          type="button"
          className="amb-campo__limpar amb-focus-ring"
          onClick={aoLimpar}
          // Focável de propósito. Muita biblioteca põe tabIndex={-1} aqui "para não poluir
          // o Tab" — e aí a ação só existe para quem tem mouse. É uma ação de verdade:
          // entra na ordem de tabulação como qualquer botão.
          aria-label="Limpar campo"
        >
          <IconeX />
        </button>
      )}
      {iconeDir && (
        <span className="amb-campo__icone" aria-hidden="true">
          {iconeDir}
        </span>
      )}
      {sufixo && (
        <span className="amb-campo__afixo amb-campo__afixo--sufixo" aria-hidden="true">
          {sufixo}
        </span>
      )}
    </div>
  )
})
