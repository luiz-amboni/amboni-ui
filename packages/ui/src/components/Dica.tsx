import {
  Children, cloneElement, useCallback, useEffect, useId, useRef, useState,
  type ReactElement, type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './Dica.css'

export type DicaLado = 'cima' | 'baixo' | 'esq' | 'dir'

export interface DicaProps {
  /** Texto curto. Sem link, sem botão — ver a limitação de "hoverable" no JSDoc. */
  conteudo: ReactNode
  /**
   * Preferência, não garantia: se não couber, a Dica é empurrada para dentro da janela.
   * @default 'cima'
   */
  lado?: DicaLado
  /**
   * Espera antes de abrir no hover, em ms. Existe para o mouse poder ATRAVESSAR a tela
   * sem acender uma dica atrás da outra pelo caminho. No foco por teclado o atraso não
   * se aplica — ver JSDoc.
   * @default 500
   */
  atraso?: number
  /** UM elemento, e ele precisa receber foco (`<button>`, `<a>`, campo). */
  children: ReactElement<{ 'aria-describedby'?: string }>
  className?: string
}

/** Distância entre o gatilho e o balão, e da borda da janela. */
const RESPIRO = 8

/**
 * Dica — o balão de ajuda.
 *
 * ## Leia antes de usar: a Dica não é um lugar seguro para informação
 *
 * **Nunca ponha na Dica algo que a pessoa PRECISE saber.** Não é conservadorismo, é o
 * que o formato é:
 *
 *  · **no celular não existe hover.** Toque não é passar o mouse. Quem está no celular
 *    — a maioria — simplesmente nunca vê o conteúdo de uma Dica;
 *  · **quem enxerga pouco navega com zoom de 200–400%.** O balão aparece fora do
 *    recorte ampliado, ou tampa exatamente o que a pessoa estava lendo;
 *  · **quem tem tremor ou usa switch** não consegue segurar o ponteiro parado o tempo
 *    todo da leitura.
 *
 * Se a informação é necessária para decidir ou agir, ela vai NA TELA: um rótulo, um
 * texto de apoio embaixo do campo, uma linha no card. A Dica serve para o que é bônus:
 * lembrar o nome inteiro de uma sigla, dizer de onde veio um número.
 *
 * ## O que ela faz certo
 *
 *  · abre no **foco** também, não só no hover — senão não existe para o teclado;
 *  · **Esc fecha** (WCAG 1.4.13), mesmo com a dica aberta por hover;
 *  · liga por **`aria-describedby`**, não por `title` (que é lento, feio, não estilizável
 *    e some no celular) nem por um `role="tooltip"` solto, que o leitor de tela ignora
 *    quando ninguém aponta para ele.
 *
 * @example
 * <Dica conteudo="Retorno sobre o investimento em anúncios">
 *   <button aria-label="Sobre o ROAS">?</button>
 * </Dica>
 *
 * @example ERRADO — a única forma de saber o que o botão faz
 * <Dica conteudo="Excluir cliente"><button><Lixeira /></button></Dica>
 * // Certo: o botão diz quem é sozinho, e a Dica só complementa.
 * <button aria-label="Excluir cliente"><Lixeira /></button>
 */
export function Dica({ conteudo, lado = 'cima', atraso = 500, children, className }: DicaProps) {
  const [aberto, setAberto] = useState(false)
  // `null` = ainda não medido. O balão nasce invisível e só aparece já posicionado —
  // senão pisca no canto superior esquerdo antes de achar o lugar.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const gatilhoRef = useRef<HTMLSpanElement>(null)
  const balaoRef = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dicaId = useId()

  const cancelarTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const fechar = useCallback(() => {
    cancelarTimer()
    setAberto(false)
    // Zera a medida: da próxima vez o gatilho pode ter andado (a tabela rolou, a linha
    // mudou de lugar) e o balão apareceria por um quadro no endereço antigo.
    setPos(null)
  }, [cancelarTimer])

  // ── Posicionamento ─────────────────────────────────────────────────────────
  // `position: fixed` + getBoundingClientRect, sem Floating UI. É a conta simples:
  // ancora no gatilho, e se estourar a janela, empurra para dentro. Ver as limitações
  // no fim do arquivo — elas são reais e conhecidas.
  const posicionar = useCallback(() => {
    const gatilho = gatilhoRef.current?.getBoundingClientRect()
    const balao = balaoRef.current?.getBoundingClientRect()
    if (!gatilho || !balao) return

    let top: number
    let left: number

    switch (lado) {
      case 'baixo':
        top = gatilho.bottom + RESPIRO
        left = gatilho.left + gatilho.width / 2 - balao.width / 2
        break
      case 'esq':
        top = gatilho.top + gatilho.height / 2 - balao.height / 2
        left = gatilho.left - balao.width - RESPIRO
        break
      case 'dir':
        top = gatilho.top + gatilho.height / 2 - balao.height / 2
        left = gatilho.right + RESPIRO
        break
      default:
        top = gatilho.top - balao.height - RESPIRO
        left = gatilho.left + gatilho.width / 2 - balao.width / 2
    }

    // Empurra para dentro da janela. Não é "flip": o balão pode acabar em cima do
    // gatilho num canto apertado. Preferimos tampar o gatilho a cortar o texto pela
    // metade — texto cortado não se lê de jeito nenhum.
    const limite = (valor: number, maximo: number) =>
      Math.max(RESPIRO, Math.min(valor, Math.max(RESPIRO, maximo - RESPIRO)))

    setPos({
      top: limite(top, window.innerHeight - balao.height),
      left: limite(left, window.innerWidth - balao.width),
    })
  }, [lado])

  useEffect(() => {
    if (!aberto) return

    posicionar()

    // A Dica é `fixed`: se a página rolar, ela fica parada e o gatilho vai embora
    // debaixo dela. `capture: true` para pegar rolagem de QUALQUER contêiner no
    // caminho (a tabela com overflow), não só a da janela — evento de rolagem de
    // elemento não borbulha.
    const recalcular = () => posicionar()
    window.addEventListener('scroll', recalcular, true)
    window.addEventListener('resize', recalcular)
    return () => {
      window.removeEventListener('scroll', recalcular, true)
      window.removeEventListener('resize', recalcular)
    }
  }, [aberto, posicionar])

  // ── Esc ────────────────────────────────────────────────────────────────────
  // No documento, e não no gatilho: aberta por hover, a Dica não tem o foco, e um
  // listener no gatilho nunca veria a tecla. WCAG 1.4.13 pede que dê para dispensar
  // sem tirar o ponteiro do lugar.
  useEffect(() => {
    if (!aberto) return
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') fechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, fechar])

  // Timer pendente com o componente já desmontado = setState no vazio.
  useEffect(() => cancelarTimer, [cancelarTimer])

  function aoEntrarMouse() {
    cancelarTimer()
    timer.current = setTimeout(() => {
      timer.current = null
      setAberto(true)
    }, atraso)
  }

  function aoFocar() {
    // Sem atraso no foco: o atraso do hover existe para o mouse não acender dicas de
    // passagem. Quem chegou de Tab pediu para estar ali — esperar meio segundo é só
    // um travamento.
    //
    // Abre em qualquer foco, inclusive o do clique de mouse. A alternativa seria
    // checar `:focus-visible` no `matches()`, que nem todo motor implementa igual: o
    // preço do erro seria a Dica nunca abrir no teclado, que é justamente o caso que
    // ela precisa cobrir. Uma dica a mais depois do clique é o mal menor.
    cancelarTimer()
    setAberto(true)
  }

  const gatilho = Children.only(children)

  return (
    <span
      ref={gatilhoRef}
      className={cx('amb-dica', className)}
      onMouseEnter={aoEntrarMouse}
      onMouseLeave={fechar}
      // onFocus/onBlur do React são focusin/focusout: BORBULHAM. Por isso a ligação
      // fica no invólucro e o children não precisa aceitar ref nem handler nenhum —
      // ele continua sendo o elemento que o produto escreveu.
      onFocus={aoFocar}
      onBlur={fechar}
    >
      {/* cloneElement só para o aria-describedby, e ele TEM que ficar no elemento que
          recebe foco: descrição pendurada no <span> de fora não é anunciada, porque
          não é o span que o leitor de tela está lendo. Preserva o describedby que o
          produto já tenha posto lá — sobrescrever seria apagar uma ligação alheia. */}
      {cloneElement(gatilho, {
        'aria-describedby': [gatilho.props['aria-describedby'], dicaId]
          .filter(Boolean)
          .join(' '),
      })}

      <span
        ref={balaoRef}
        id={dicaId}
        role="tooltip"
        // `hidden` em vez de desmontar: o balão fica sempre no documento para o
        // `aria-describedby` ter um alvo estável. Elemento escondido referenciado por
        // describedby continua entrando no cálculo da descrição — é assim que o leitor
        // de tela anuncia o texto no foco, sem depender de hover que ele não faz.
        hidden={!aberto}
        className={cx('amb-dica__balao', `amb-dica__balao--${lado}`)}
        style={{
          top: pos?.top ?? 0,
          left: pos?.left ?? 0,
          // Invisível, mas COM caixa: `visibility` mantém o balão medível pelo
          // posicionar(). Com `display: none` a medida daria zero e ele cairia sempre
          // no canto.
          visibility: pos ? undefined : 'hidden',
        }}
      >
        {conteudo}
      </span>
    </span>
  )
}

/* ── Limitações conhecidas (honestas, para virar documentação) ────────────────
 *
 * 1. **Ancestral com `transform`/`filter`/`will-change`** vira bloco contedor do
 *    `position: fixed`, e a Dica passa a se posicionar em relação a ELE, não à janela:
 *    sai do lugar. A saída seria um portal para o <body> — que trocaria este bug por um
 *    pior: dentro de um <dialog> (top layer), a Dica portalada renderiza ATRÁS do modal
 *    e some. Como esta biblioteca tem Dialogo e Gaveta cheios de controles com dica,
 *    escolhemos o bug raro em vez do garantido.
 *
 * 2. **Não faz "flip"**: num canto apertado, o balão é empurrado para dentro da janela e
 *    pode cobrir o gatilho, em vez de virar para o lado oposto.
 *
 * 3. **O balão não é "hoverable"** (`pointer-events: none`): quem usa lupa não consegue
 *    levar o ponteiro até ele para ler devagar — mover o mouse na direção do balão
 *    fecha a Dica. É o desvio consciente da WCAG 1.4.13 neste componente, e a razão de
 *    `conteudo` ser texto curto: para o que precisa de leitura calma, ou de um link
 *    dentro, o certo é o Dialogo — não uma dica maior.
 *
 * 4. **Esc dentro de um Dialogo fecha os dois**: o mesmo Esc dispensa a Dica e cancela o
 *    modal, porque o `cancel` do <dialog> é ação padrão do navegador e não passa por
 *    aqui para ser barrado.
 */
