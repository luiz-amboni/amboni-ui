import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from '../utils/cx'
import './Etiqueta.css'

export type EtiquetaTom = 'neutro' | 'marca' | 'sucesso' | 'aviso' | 'perigo' | 'info'
export type EtiquetaSize = 'sm' | 'md'

export interface EtiquetaProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick'> {
  /** @default 'neutro' */
  tom?: EtiquetaTom
  /** @default 'md' */
  size?: EtiquetaSize
  /** Ícone antes do texto. Decorativo — o texto é que nomeia a etiqueta. */
  icone?: ReactNode
  /** Mostra o X. Só faz sentido junto com `onRemover`. */
  removivel?: boolean
  /** Chamado ao clicar no X. */
  onRemover?: () => void
  /**
   * Torna o corpo da etiqueta clicável (ex.: clicar no filtro para editá-lo).
   * Ler a nota sobre alvos aninhados no componente antes de combinar com `removivel`.
   */
  onClick?: () => void
  /**
   * Rótulo acessível do X, por extenso. Só é necessário quando `children` não é texto
   * puro (tem ícone, `<strong>`, etc.) — aí o componente não consegue adivinhar o nome.
   *
   * Diga O QUE remove: `"Remover filtro Ativos"`, não `"Remover"`. Numa barra com 8
   * filtros, 8 botões "Remover" idênticos deixam quem usa leitor de tela sem saber qual
   * é qual — é a diferença entre uma lista navegável e um labirinto.
   */
  rotuloRemover?: string
  /** O texto da etiqueta. É ele que a nomeia — para o olho e para o leitor de tela. */
  children: ReactNode
}

/** X desenhado aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function IconeX() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path
        d="M1 1 L9 9 M9 1 L1 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Etiqueta — uma ENTRADA que você criou e pode tirar.
 *
 * ## Etiqueta não é Selo (o erro mais comum)
 * · **Selo** é ESTADO: o sistema decidiu, você lê. "Entregue", "Falhou". Read-only.
 * · **Etiqueta** é ENTRADA: você pôs, você tira. Um filtro aplicado, um destinatário
 *   escolhido, uma tag num cliente.
 *
 * O teste rápido: **existe um X?** Se a pessoa pode remover aquilo, é Etiqueta. Se ela
 * só está sendo informada, é Selo — e um Selo com X é uma promessa que a tela não pode
 * cumprir ("posso desentregar a mensagem?").
 *
 * @example Filtro removível
 * <Etiqueta removivel onRemover={() => tirarFiltro('ativos')}>Ativos</Etiqueta>
 * // O X vira aria-label="Remover Ativos" sozinho.
 *
 * @example Conteúdo que não é texto puro — aí o rótulo do X precisa ser dito
 * <Etiqueta removivel onRemover={tirar} rotuloRemover="Remover filtro Ativos">
 *   <strong>Status:</strong> Ativos
 * </Etiqueta>
 */
export const Etiqueta = forwardRef<HTMLElement, EtiquetaProps>(function Etiqueta(
  {
    tom = 'neutro',
    size = 'md',
    icone,
    removivel,
    onRemover,
    onClick,
    rotuloRemover,
    children,
    className,
    ...rest
  },
  ref,
) {
  const clicavel = Boolean(onClick)

  // Só dá para deduzir o nome quando o filho é texto puro. `<strong>Status:</strong> X`
  // vira "[object Object]" se a gente tentar ser esperto — melhor exigir `rotuloRemover`.
  const textoDoFilho = typeof children === 'string' || typeof children === 'number' ? String(children) : null
  const rotuloX = rotuloRemover ?? (textoDoFilho ? `Remover ${textoDoFilho}` : 'Remover')

  if (process.env.NODE_ENV !== 'production' && removivel && !rotuloRemover && !textoDoFilho) {
    console.warn(
      '[@amboni/ui] <Etiqueta removivel> com conteúdo que não é texto puro precisa de ' +
        '`rotuloRemover`. Sem ele o leitor de tela ouve só "Remover" e não sabe o quê.',
    )
  }

  const conteudo = (
    <>
      {icone && (
        <span className="amb-etiqueta__icone" aria-hidden="true">
          {icone}
        </span>
      )}
      <span className="amb-etiqueta__texto">{children}</span>
    </>
  )

  const botaoX = removivel && (
    <button
      type="button"
      className="amb-etiqueta__x amb-focus-ring"
      // Diz O QUE remove. Ver a nota em `rotuloRemover`.
      aria-label={rotuloX}
      onClick={e => {
        // Sem isto, clicar no X numa etiqueta clicável dispara TAMBÉM o onClick do corpo
        // (o clique sobe pelo DOM): a pessoa remove o filtro e a tela abre a edição do
        // filtro que acabou de sumir. No caso `--dupla` o X é irmão do corpo e não
        // haveria borbulho, mas manter aqui protege quem envolver a etiqueta inteira
        // num container clicável — que acontece.
        e.stopPropagation()
        onRemover?.()
      }}
    >
      <IconeX />
    </button>
  )

  const classes = cx(
    'amb-etiqueta',
    `amb-etiqueta--${tom}`,
    `amb-etiqueta--${size}`,
    removivel && 'amb-etiqueta--removivel',
    className,
  )

  // ── Alvos aninhados: a decisão ────────────────────────────────────────────
  // Etiqueta clicável + X de remover são DUAS ações no mesmo desenho. A saída
  // preguiçosa seria `<button>` com `<button>` dentro — HTML inválido, e o navegador
  // "conserta" jogando o X para fora da etiqueta, quebrando o layout de um jeito
  // que só aparece em produção. Além disso, um alvo dentro do outro deixa a ação
  // destrutiva a 3px da ação inofensiva.
  //
  // Aqui os dois botões são IRMÃOS dentro de um <span> que não recebe foco: a pílula
  // é só desenho. O teclado recebe dois pontos de parada distintos, na ordem esperada
  // (corpo, depois X), e o HTML fica válido.
  if (clicavel && removivel) {
    return (
      <span ref={ref as Ref<HTMLSpanElement>} className={cx(classes, 'amb-etiqueta--dupla')} {...rest}>
        <button type="button" className="amb-etiqueta__corpo amb-focus-ring" onClick={onClick}>
          {conteudo}
        </button>
        {botaoX}
      </span>
    )
  }

  // Clicável e só. A etiqueta INTEIRA é o botão — alvo maior, mais fácil de acertar.
  if (clicavel) {
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        className={cx(classes, 'amb-etiqueta--clicavel', 'amb-focus-ring')}
        onClick={onClick}
        {...rest}
      >
        {conteudo}
      </button>
    )
  }

  // Sem onClick: <span>. Uma <div onClick> disfarçada de botão não recebe foco nem
  // responde a Enter — e aqui não há clique nenhum, então não há por que fingir.
  return (
    <span ref={ref as Ref<HTMLSpanElement>} className={classes} {...rest}>
      {conteudo}
      {botaoX}
    </span>
  )
})
