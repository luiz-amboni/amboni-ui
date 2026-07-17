import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from '../utils/cx'
import './Passos.css'

export type EstadoPasso = 'concluido' | 'atual' | 'futuro' | 'erro'
export type PassosOrientacao = 'horizontal' | 'vertical'

/** A forma da marca. É ela que separa os estados para quem não distingue as cores. */
type FormaMarca = 'check' | 'numero-cheio' | 'numero-vazado' | 'alerta'

/**
 * Cada estado tem uma FORMA, não só uma cor.
 *
 * · `concluido` → ✓            (não é mais um número: já passou, virou fato)
 * · `atual`     → número CHEIO (círculo sólido — o único preenchido da régua)
 * · `futuro`    → número VAZADO (contorno apagado: existe, mas não chegou a vez)
 * · `erro`      → !            (não some com o número por acaso: um passo com erro não
 *                               é "o passo 2", é o passo que precisa de você)
 *
 * Atual e futuro são os dois um número — o que os separa é o preenchimento, que é forma
 * e sobrevive ao monocromático, à impressão e ao tema de alto contraste do sistema.
 */
const FORMA_POR_ESTADO: Record<EstadoPasso, FormaMarca> = {
  concluido: 'check',
  atual: 'numero-cheio',
  futuro: 'numero-vazado',
  erro: 'alerta',
}

export interface Passo {
  /** Chave do React e identidade do passo. */
  id: string
  /** O nome da etapa ("Endereço"). Curto: ele cabe numa régua de 4 colunas. */
  titulo: ReactNode
  /** Uma linha de apoio ("CEP, número e complemento"). */
  descricao?: ReactNode
  /**
   * Force o estado. Sem isto ele sai de `atual`: antes → concluído, igual → atual,
   * depois → futuro. Na prática só se passa `'erro'`, que é a única coisa que a
   * posição no array não tem como saber.
   */
  estado?: EstadoPasso
}

export interface PassosProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** As etapas, na ordem. */
  passos: Passo[]
  /** Índice do passo em que a pessoa está, começando em **0**. Fora da faixa é grampeado. */
  atual: number
  /**
   * Torna os passos já vistos navegáveis. **Ausente = a régua é indicação, não navegação**
   * — ver o bloco sobre isto na documentação do componente.
   */
  onIrPara?: (indice: number, passo: Passo) => void
  /** @default 'horizontal' */
  orientacao?: PassosOrientacao
}

/** Índice fora da faixa não é erro: é `?etapa=9` colado na URL. Prende na borda. */
function grampear(indice: number, total: number): number {
  const i = Math.trunc(indice)
  if (!Number.isFinite(i) || i < 0) return 0
  return Math.min(i, Math.max(0, total - 1))
}

function Marca({ forma, numero }: { forma: FormaMarca; numero: number }) {
  if (forma === 'check') {
    return (
      <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
        <path d="M1.5 5.2 L4 7.5 L8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (forma === 'alerta') return <>!</>
  return <>{numero}</>
}

/**
 * Passos — o formulário longo dividido em etapas.
 *
 * ## Passo futuro não é clicável, e isso é uma decisão
 *
 * Pular para a etapa 4 sem preencher a 2 quebra a validação: o formulário chega no fim
 * sem dados obrigatórios, e o erro aparece longe de onde nasceu. Então:
 *
 * · **concluído / com erro** → clicável (voltar a revisar é legítimo e comum);
 * · **futuro** → nunca (é o passo a seguir que decide quando ele libera);
 * · **atual** → nunca — mesma regra da `<Trilha>`: não se navega para onde já se está.
 *   Um botão que não leva a lugar nenhum é só mais uma parada no Tab.
 *
 * ## Sem `onIrPara`, nada é botão
 *
 * A régua vira indicação pura. Isto não é detalhe de estilo: um `<div onClick>` com cara
 * de clicável, ou um `<button>` que não faz nada, mente para quem navega por teclado —
 * a pessoa para em cima, aperta Enter e não acontece nada. Se não há para onde ir, não
 * há nada no caminho do foco.
 *
 * @example Só indicação
 * <Passos atual={1} passos={[{ id:'dados', titulo:'Dados' }, { id:'end', titulo:'Endereço' }]} />
 *
 * @example Navegável, com um passo em erro
 * <Passos
 *   atual={2}
 *   onIrPara={i => setEtapa(i)}
 *   passos={[
 *     { id: 'dados', titulo: 'Dados' },
 *     { id: 'end', titulo: 'Endereço', estado: 'erro' },
 *     { id: 'pag', titulo: 'Pagamento' },
 *   ]}
 * />
 */
export const Passos = forwardRef<HTMLElement, PassosProps>(function Passos(
  {
    passos,
    atual,
    onIrPara,
    orientacao = 'horizontal',
    className,
    'aria-label': rotulo = 'Etapas',
    ...rest
  },
  ref,
) {
  const total = passos.length
  const indiceAtual = grampear(atual, total)
  const passoAtual = passos[indiceAtual]

  // ── <nav> só quando há para onde navegar ─────────────────────────────────────
  // <nav> é um marco de navegação: ele entra na lista de regiões da página, e quem usa
  // leitor de tela salta para lá esperando encontrar caminhos. Uma régua de indicação
  // pura não tem caminho nenhum — seria um marco que leva ao nada, atrapalhando quem
  // confia nessa lista. Sem `onIrPara`, então, é uma <div> e o nome fica na própria
  // lista (que `aria-label` também aceita).
  const navegacao = Boolean(onIrPara)
  const Envolucro = navegacao ? 'nav' : 'div'

  const lista = (
    <ol
      // role="list" de propósito: `list-style: none` faz o Safari largar a semântica de
      // lista, e é ela que anuncia "lista de 4 itens" antes da régua. Ver o CSS.
      role="list"
      aria-label={navegacao ? undefined : rotulo}
      className={cx('amb-passos__lista', `amb-passos__lista--${orientacao}`)}
    >
      {passos.map((passo, i) => {
        // O estado sai da posição; `estado` no item só sobrescreve. Note que `aria-current`
        // NÃO vem daqui: um passo atual COM erro continua sendo onde a pessoa está.
        const estado: EstadoPasso =
          passo.estado ?? (i < indiceAtual ? 'concluido' : i === indiceAtual ? 'atual' : 'futuro')
        const ehAtual = i === indiceAtual
        const forma = FORMA_POR_ESTADO[estado]

        // Voltar, sim; pular, nunca; ficar parado, não é ir a lugar nenhum.
        const navegavel = Boolean(onIrPara) && !ehAtual && estado !== 'futuro'

        const miolo = (
          <>
            <span
              className={cx('amb-passos__marca', `amb-passos__marca--${estado}`)}
              // A forma vai no DOM para o teste provar que os quatro estados não são só
              // quatro cores. É o invariante do "cor nunca sozinha".
              data-amb-forma={forma}
              aria-hidden="true"
            >
              <Marca forma={forma} numero={i + 1} />
            </span>
            <span className="amb-passos__texto">
              <span className="amb-passos__titulo">
                {passo.titulo}
                {/* Mesma decisão do asterisco do <CampoForm>: o símbolo (✓, !) é
                    decorativo, e quem carrega o sentido é a palavra. Sem isto, quem usa
                    leitor de tela ouve "Endereço" num passo verde e num passo vermelho —
                    exatamente igual. `atual` fica de fora: quem conta isso é o
                    aria-current, e repetir viraria "Pagamento, atual, passo atual". */}
                {estado === 'concluido' && <span className="amb-sr-only"> (concluído)</span>}
                {estado === 'erro' && <span className="amb-sr-only"> (com erro)</span>}
              </span>
              {passo.descricao && <span className="amb-passos__descricao">{passo.descricao}</span>}
            </span>
          </>
        )

        return (
          <li
            key={passo.id}
            className={cx('amb-passos__item', `amb-passos__item--${estado}`)}
          >
            {navegavel ? (
              <button
                type="button"
                className="amb-passos__corpo amb-passos__corpo--botao amb-focus-ring"
                onClick={() => onIrPara?.(i, passo)}
              >
                {miolo}
              </button>
            ) : (
              // Sem clique: <span>. Nunca um <div onClick> nem um <button disabled> — o
              // segundo ainda aparece na árvore como "botão indisponível" e sugere que
              // um dia dá para clicar. O passo futuro não está indisponível: ele só
              // ainda não é a vez dele.
              <span
                className="amb-passos__corpo"
                aria-current={ehAtual ? 'step' : undefined}
              >
                {miolo}
              </span>
            )}

            {/* O traço entre um passo e outro é desenho puro. */}
            {i < total - 1 && <span className="amb-passos__conector" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )

  return (
    <Envolucro
      // O envólucro troca de <nav> para <div> conforme `onIrPara`, então o ref precisa
      // servir aos dois. `HTMLElement` cobre ambos em tempo de execução; o cast só
      // convence o TypeScript de que a união de props aceita o mesmo ref.
      ref={ref as Ref<HTMLElement & HTMLDivElement>}
      aria-label={navegacao ? rotulo : undefined}
      className={cx('amb-passos', className)}
      {...rest}
    >
      {lista}

      {/* ── O anúncio do avanço ────────────────────────────────────────────────
          "Passo 2 de 4: Endereço" quando a etapa troca. Sem isto, quem usa leitor de
          tela aperta "Continuar", o formulário troca de conteúdo e nada é dito: a
          pessoa fica sem saber se avançou, se deu erro ou se o botão não funcionou.

          Este `role="status"` é o OPOSTO do `role="alert"` do <CampoForm>, e a diferença
          é a regra que quase todo mundo erra:
          · alert  → precisa ser MONTADO junto com a mensagem (por isso lá é `{erro && …}`);
          · status → precisa estar SEMPRE no DOM, com o texto trocando dentro dele. Uma
            região viva que nasce junto com o texto costuma passar despercebida.
          Por isso este parágrafo é renderizado sempre, mesmo vazio.

          É sr-only porque na tela a régua já mostra tudo isso, com muito mais clareza. */}
      <p className="amb-sr-only" role="status">
        {passoAtual ? `Passo ${indiceAtual + 1} de ${total}: ` : ''}
        {passoAtual?.titulo}
      </p>
    </Envolucro>
  )
})
