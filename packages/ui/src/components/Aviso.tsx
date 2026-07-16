import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './Aviso.css'

export type AvisoTom = 'sucesso' | 'erro' | 'aviso' | 'info'

export interface AvisoAcao {
  /** O verbo. "Desfazer", "Tentar de novo", "Ver pedido". */
  rotulo: string
  onClick: () => void
}

export interface AvisoOpcoes {
  /** Uma linha que resolve sozinha. Quem só passou o olho lê apenas isto. */
  titulo: string
  /** O detalhe. Opcional de propósito: aviso é interrupção, não documentação. */
  descricao?: ReactNode
  /**
   * `sucesso` / `info` — esperam a leitura atual terminar (`role="status"`).
   * `aviso` — idem: importante, não urgente.
   * `erro` — **interrompe** o leitor de tela (`role="alert"`) e **não some sozinho**.
   * @default 'info'
   */
  tom?: AvisoTom
  /**
   * Tempo de tela, em ms. **Passe só quando souber por quê** — sem isto o componente
   * calcula pelo tamanho do texto (ver `duracaoPorTexto`), o que acerta mais do que
   * um número redondo escolhido no olho.
   *
   * Passar `duracao` explicitamente **vence as regras automáticas** (inclusive as de
   * `erro` e `acao` não sumirem). É a saída de emergência de quem tem um caso que a
   * biblioteca não previu — e assume a decisão.
   */
  duracao?: number
  /**
   * Um botão dentro do aviso. Um só: duas saídas viram nenhuma.
   * Clicar executa e **fecha** o aviso — a ação já foi tomada, manter na tela vira
   * dúvida ("cliquei mesmo?").
   */
  acao?: AvisoAcao
  /** Fica até fecharem na mão. Use quando a mensagem exige decisão. */
  fixo?: boolean
}

/** O que `useAviso()` devolve. */
export interface ApiAvisos {
  /** Forma completa. Devolve o `id` — guarde se precisar fechar na mão depois. */
  mostrar: (opcoes: AvisoOpcoes) => string
  sucesso: (titulo: string, opcoes?: Omit<AvisoOpcoes, 'titulo' | 'tom'>) => string
  erro: (titulo: string, opcoes?: Omit<AvisoOpcoes, 'titulo' | 'tom'>) => string
  aviso: (titulo: string, opcoes?: Omit<AvisoOpcoes, 'titulo' | 'tom'>) => string
  info: (titulo: string, opcoes?: Omit<AvisoOpcoes, 'titulo' | 'tom'>) => string
  /** Fecha na mão. Ex.: o upload terminou, o aviso de "enviando..." não serve mais. */
  fechar: (id: string) => void
}

export interface ProvedorAvisosProps {
  children?: ReactNode
  /**
   * Quantos aparecem ao mesmo tempo. O excedente **espera na fila** (ver o bloco
   * "A fila" abaixo) — não é descartado.
   * @default 3
   */
  limite?: number
}

interface AvisoInterno extends AvisoOpcoes {
  id: string
  tom: AvisoTom
  /** Já resolvido no `mostrar` — ver `resolverTempo`. */
  fixo: boolean
  duracao: number
}

/**
 * Os quatro ícones. Cada tom tem uma FORMA diferente, não só uma cor diferente —
 * círculo-i, círculo-✓, triângulo-! e octógono-✕. Cerca de 1 em cada 12 homens não
 * distingue vermelho de verde: para essas pessoas, um "sucesso" verde e um "erro"
 * vermelho são o mesmo retângulo cinza. A forma é o que sobra.
 *
 * São as mesmas formas do `Alerta` — redesenhadas aqui porque ele não exporta o mapa
 * de ícones. No dia em que exportar, isto vira um import e some.
 */
const ICONES: Record<AvisoTom, ReactNode> = {
  info: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9.25v4.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10" cy="6.3" r="1" fill="currentColor" />
    </svg>
  ),
  sucesso: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.25 10.25 8.75 12.75 13.75 7.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // Triângulo — "atenção" na sinalização de trânsito do mundo inteiro.
  aviso: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M10 2.75 18.25 17.25H1.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8v3.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10" cy="14.4" r="1" fill="currentColor" />
    </svg>
  ),
  // Octógono com ✕ — a forma de "pare". Reconhecível em miniatura e sem cor nenhuma.
  erro: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M6.9 1.75h6.2L17.5 6.9v6.2l-4.4 5.15H6.9L2.5 13.1V6.9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.6 7.6 12.4 12.4M12.4 7.6 7.6 12.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
}

function IconeX() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M4 4 12 12M12 4 4 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Quanto tempo o aviso fica na tela, pelo tamanho do texto.
 *
 * "3 segundos" é o padrão da indústria e é hostil: some antes de quem lê devagar, de
 * quem usa lupa e de quem só desviou o olho para o teclado. A WCAG 2.2.1 trata isso
 * como falha de acessibilidade, não como gosto.
 *
 * Aqui: 400ms por palavra (≈150 palavras/min — velocidade de leitura sem pressa),
 * com piso de 5s (tempo de perceber que algo apareceu e virar o olho) e teto de 12s
 * (passou disso o texto é grande demais para um aviso — era para ser um Alerta na
 * própria tela).
 *
 * A descrição só entra na conta quando é texto puro: `ReactNode` pode ser uma árvore
 * inteira e não dá para medir sem renderizar. Medir o que dá é melhor que ignorar.
 */
function duracaoPorTexto(titulo: string, descricao?: ReactNode): number {
  const texto = `${titulo} ${typeof descricao === 'string' ? descricao : ''}`.trim()
  const palavras = texto.split(/\s+/).filter(Boolean).length
  return Math.min(12_000, Math.max(5_000, palavras * 400))
}

/**
 * As regras de "some ou não some". A ordem importa e cada linha tem um motivo:
 *
 * 1. `fixo` — quem pediu, mandou.
 * 2. `duracao` explícita — quem passou um número assumiu a decisão (ver a prop).
 * 3. **Erro não some sozinho.** Um erro que evapora deixa a pessoa com o problema e
 *    sem o texto do problema — e é exatamente o texto que ela precisaria copiar para
 *    pedir ajuda. Erro sai quando a pessoa fecha, não quando o relógio bate.
 * 4. **Com ação também não.** Sumir sozinho leva o botão junto: a pessoa vê "Desfazer",
 *    move o mouse, e o botão some no caminho. Ou some antes de ela decidir. Um aviso
 *    com ação é uma pergunta — pergunta espera resposta.
 * 5. O resto: pelo tamanho do texto.
 */
function resolverTempo(o: AvisoOpcoes): { fixo: boolean; duracao: number } {
  if (o.fixo) return { fixo: true, duracao: 0 }
  if (o.duracao !== undefined) return { fixo: false, duracao: o.duracao }
  if (o.tom === 'erro' || o.acao) return { fixo: true, duracao: 0 }
  return { fixo: false, duracao: duracaoPorTexto(o.titulo, o.descricao) }
}

const AvisosContexto = createContext<ApiAvisos | null>(null)

let sequencia = 0

/**
 * Um aviso na pilha.
 *
 * O cronômetro mora aqui, e não no provedor, por um motivo prático: cada aviso tem o
 * seu, e `pausado` para todos de uma vez sem que o provedor precise saber de tempo.
 */
function ItemAviso({
  aviso,
  pausado,
  onFechar,
}: {
  aviso: AvisoInterno
  pausado: boolean
  onFechar: (id: string) => void
}) {
  // O que sobra do relógio. Vive num ref porque pausar/retomar não é assunto de
  // renderização — se fosse estado, cada pausa repintaria o aviso à toa.
  const restanteRef = useRef(aviso.duracao)

  useEffect(() => {
    if (aviso.fixo || pausado) return

    const inicio = Date.now()
    const t = setTimeout(() => onFechar(aviso.id), restanteRef.current)

    return () => {
      clearTimeout(t)
      // Guarda o saldo ANTES de sair. Sem esta linha, todo hover reiniciaria o
      // cronômetro do zero e um aviso de 5s sobreviveria a tarde inteira de quem
      // costuma passar o mouse pela tela sem querer.
      restanteRef.current -= Date.now() - inicio
    }
  }, [aviso.fixo, aviso.id, pausado, onFechar])

  const urgente = aviso.tom === 'erro'

  return (
    <div
      // Só o erro interrompe a leitura em curso (`alert` = assertive). O resto espera a
      // frase atual terminar (`status` = polite). Marcar tudo como `alert` é gritar toda
      // frase: a pessoa desliga o recurso e aí nem o erro de verdade chega.
      //
      // Este `role` fica no ITEM, dentro da região `aria-live="polite"` do provedor. É
      // o mais próximo do nó inserido que manda na urgência (ARIA), então o erro sai
      // assertivo mesmo dentro de uma região polite.
      role={urgente ? 'alert' : 'status'}
      className={cx('amb-aviso', `amb-aviso--${aviso.tom}`)}
    >
      <span className="amb-aviso__icone" aria-hidden="true">
        {ICONES[aviso.tom]}
      </span>

      <div className="amb-aviso__corpo">
        <p className="amb-aviso__titulo">{aviso.titulo}</p>
        {aviso.descricao && <div className="amb-aviso__descricao">{aviso.descricao}</div>}

        {aviso.acao && (
          <button
            type="button"
            className={cx('amb-aviso__acao', 'amb-focus-ring')}
            onClick={() => {
              aviso.acao?.onClick()
              // Fecha depois de agir: a ação já foi tomada, deixar o botão na tela
              // convida a clicar de novo (e "desfazer o desfazer" ninguém espera).
              onFechar(aviso.id)
            }}
          >
            {aviso.acao.rotulo}
          </button>
        )}
      </div>

      <button
        type="button"
        className={cx('amb-aviso__x', 'amb-focus-ring')}
        onClick={() => onFechar(aviso.id)}
        // O título entra no rótulo de propósito. Com três avisos na tela, três botões
        // "Fechar" são indistinguíveis na lista de botões do leitor de tela — a pessoa
        // não sabe qual está fechando.
        aria-label={`Fechar aviso: ${aviso.titulo}`}
      >
        <IconeX />
      </button>
    </div>
  )
}

/**
 * ProvedorAvisos — a região onde os avisos aparecem. Um por app, no topo da árvore.
 *
 * ## A região existe desde sempre, vazia
 *
 * É o ponto central deste componente e o bug que a maioria das bibliotecas de toast
 * tem: **criar o container junto com o primeiro aviso não anuncia nada.** O leitor de
 * tela monta a lista de regiões vivas quando a página carrega e observa as que já
 * existiam; uma região `aria-live` que nasce com conteúdo dentro tipicamente não
 * dispara — o conteúdo já estava lá quando ela passou a ser observada.
 *
 * O sintoma é cruel: funciona perfeitamente no olho, passa em todo teste visual, e
 * quem depende de leitor de tela simplesmente nunca é avisado de nada. Por isso a
 * `<div aria-live>` abaixo é renderizada sempre, mesmo sem nenhum aviso.
 *
 * ## A fila
 *
 * Só `limite` (3) aparecem juntos — 20 avisos empilhados viram uma parede que tampa a
 * tela e ninguém lê. O excedente **espera a vez**, não é descartado: descartar perde
 * informação, e empurrar o mais antigo para fora arranca da tela justamente o que a
 * pessoa pode estar lendo agora (e se for erro, arranca o erro).
 *
 * O preço, assumido: três erros fixos na tela seguram a fila até alguém fechá-los. É o
 * caso em que empilhar mais cinco avisos por cima seria pior — o erro é que precisa de
 * atenção, não o aviso de "copiado!".
 *
 * @example
 * <ProvedorAvisos><App /></ProvedorAvisos>
 */
export function ProvedorAvisos({ children, limite = 3 }: ProvedorAvisosProps) {
  const [avisos, setAvisos] = useState<AvisoInterno[]>([])
  const [pausado, setPausado] = useState(false)

  const fechar = useCallback((id: string) => {
    setAvisos(atual => atual.filter(a => a.id !== id))
  }, [])

  const api = useMemo<ApiAvisos>(() => {
    const mostrar = (opcoes: AvisoOpcoes): string => {
      const id = `amb-aviso-${++sequencia}`
      setAvisos(atual => [...atual, { ...opcoes, ...resolverTempo(opcoes), id, tom: opcoes.tom ?? 'info' }])
      return id
    }

    const atalho =
      (tom: AvisoTom) =>
      (titulo: string, opcoes?: Omit<AvisoOpcoes, 'titulo' | 'tom'>): string =>
        mostrar({ ...opcoes, titulo, tom })

    return {
      mostrar,
      fechar,
      sucesso: atalho('sucesso'),
      erro: atalho('erro'),
      aviso: atalho('aviso'),
      info: atalho('info'),
    }
    // Sem dependências: a API é estável para sempre. Se ela mudasse a cada aviso na
    // tela, todo componente que chama `useAviso()` repintaria junto.
  }, [fechar])

  // Os da frente aparecem; o resto espera. Como os novos entram no fim, os primeiros
  // `limite` são sempre os mais antigos — a fila cai fora de graça, sem estado extra.
  const visiveis = avisos.slice(0, limite)

  return (
    <AvisosContexto.Provider value={api}>
      {children}

      <div
        className="amb-avisos"
        // Ver o bloco acima: esta div existe desde o primeiro render, vazia.
        aria-live="polite"
        // Só anuncia o que ENTRA. Sem isto, fechar um aviso faz o leitor de tela ler a
        // remoção — a pessoa ouve de novo o que já ouviu, no momento em que dispensou.
        aria-relevant="additions"
        // Um rótulo para a região não ser "grupo sem nome" na lista do leitor de tela.
        aria-label="Avisos"
        // Pausa a PILHA INTEIRA, não só o aviso sob o cursor: se os outros continuassem
        // correndo, o de baixo sumiria enquanto a pessoa lê o de cima — e o movimento
        // reposiciona justamente o que ela está tentando ler.
        //
        // Foco junto com mouse: quem navega por teclado chega no X ou no botão de ação
        // e o aviso não pode evaporar por baixo do foco (WCAG 2.2.1).
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={() => setPausado(false)}
      >
        {visiveis.map(aviso => (
          // A ordem no DOM é a ordem em que aconteceram — é assim que o leitor de tela
          // lê e é assim que a pessoa espera.
          <ItemAviso key={aviso.id} aviso={aviso} pausado={pausado} onFechar={fechar} />
        ))}
      </div>
    </AvisosContexto.Provider>
  )
}

/**
 * useAviso — dispara avisos de qualquer lugar da app.
 *
 * @example
 * const aviso = useAviso()
 * aviso.sucesso('Cliente salvo')
 *
 * @example Erro fica até fecharem — ver `resolverTempo`
 * aviso.erro('Não foi possível enviar', { descricao: 'O WhatsApp recusou: número sem conta.' })
 *
 * @example Com ação — não some sozinho, senão o botão foge
 * aviso.sucesso('Mensagem agendada', { acao: { rotulo: 'Desfazer', onClick: cancelar } })
 *
 * @example Fechar na mão
 * const id = aviso.info('Enviando...', { fixo: true })
 * await enviar()
 * aviso.fechar(id)
 */
export function useAviso(): ApiAvisos {
  const api = useContext(AvisosContexto)
  if (!api) {
    // Falha alto e cedo. Sem o provedor, o aviso não teria onde aparecer e o `mostrar`
    // viraria um no-op silencioso — a pessoa clica em "Salvar", nada acontece, e o bug
    // só aparece em produção.
    throw new Error('[@amboni/ui] useAviso() precisa de um <ProvedorAvisos> acima na árvore.')
  }
  return api
}
