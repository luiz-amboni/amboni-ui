import {
  forwardRef,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type Ref,
} from 'react'
import { cx } from '../utils/cx'
import { normalizar, useCombobox, type OpcaoBase } from '../utils/combobox'
import './Selecao.css'

export type SelecaoSize = 'sm' | 'md' | 'lg'

/** `valor`, `rotulo` e `desabilitada` vêm do miolo compartilhado do combobox. */
export interface OpcaoSelecao extends OpcaoBase {
  /** Agrupa visualmente. Vira `<optgroup>` no nativo e `role="group"` no buscável. */
  grupo?: string
}

/**
 * O ref muda de elemento junto com o modo: no nativo aponta para o `<select>`, com
 * `buscavel` aponta para o `<input>` do combobox — são componentes diferentes por baixo.
 * O que interessa na prática (`.focus()`) funciona nos dois.
 */
export type SelecaoRef = HTMLSelectElement | HTMLInputElement

export interface SelecaoProps
  extends Omit<HTMLAttributes<HTMLElement>, 'onChange' | 'children' | 'defaultValue'> {
  opcoes: OpcaoSelecao[]
  /** Controlado, sempre. `''` = nada escolhido (mostra o `placeholder`). */
  valor: string
  /** Recebe o `valor` da opção — não o evento. Quem chama quer o dado, não o DOM. */
  onChange: (valor: string) => void
  /** Texto de quando nada foi escolhido. Diga a escolha ("Escolha a categoria"), não "Selecione…". */
  placeholder?: string
  /** @default 'md' */
  size?: SelecaoSize
  /**
   * A mensagem do erro. **É texto, não booleano, de propósito**: pintar a borda de vermelho
   * sem dizer o que está errado não conserta nada — e quem não distingue vermelho não vê
   * nem o aviso. Liga `aria-invalid` e amarra a mensagem por `aria-describedby`.
   */
  erro?: string
  disabled?: boolean
  /**
   * Troca o `<select>` nativo por um combobox com filtro por digitação.
   * **Só ligue com lista longa** (30+). Ver a nota de decisão no JSDoc do componente:
   * isto custa a roda nativa do celular.
   */
  buscavel?: boolean
  /** Mostra um X para voltar ao estado "nada escolhido". Só quando vazio é um valor válido. */
  limpavel?: boolean
  /** Nome no formulário. Só o modo nativo participa de um submit — ver a nota sobre `buscavel`. */
  name?: string
  required?: boolean
}

/** Ícones desenhados aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function Seta() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3.5 5.5 L7 9 L10.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Xis() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** Agrupa preservando o índice na lista plana — é ele que as setas e o `aria-activedescendant` usam. */
function agrupar(opcoes: OpcaoSelecao[]) {
  const blocos: Array<{ grupo?: string; itens: Array<{ opcao: OpcaoSelecao; indice: number }> }> = []
  opcoes.forEach((opcao, indice) => {
    const ultimo = blocos[blocos.length - 1]
    if (ultimo && ultimo.grupo === opcao.grupo) ultimo.itens.push({ opcao, indice })
    else blocos.push({ grupo: opcao.grupo, itens: [{ opcao, indice }] })
  })
  return blocos
}

/**
 * Selecao — escolher **um valor** de uma lista.
 *
 * ## A decisão: nativo por padrão, customizado só com `buscavel`
 *
 * Este componente entrega um `<select>` de verdade, e isso é deliberado. O nativo dá de
 * graça o que um combobox customizado leva meses para imitar mal: teclado completo, busca
 * por digitação, e — o que mais pesa — **a roda nativa do celular**, aquela lista grande e
 * confortável do iOS/Android. Nenhum select customizado ganha dela no toque.
 *
 * O preço é honesto: **a lista aberta do `<select>` é desenhada pelo sistema operacional,
 * não pelo nosso CSS.** Não dá para pôr ícone na opção, nem alinhar a fonte da lista com a
 * do resto do painel. O `appearance: base-select` resolve isso (Chrome 135+, Safari 27),
 * mas o Firefox ainda não tem — então não dependemos dele. O que estilizamos é o campo
 * fechado, que é o que fica na tela o tempo todo.
 *
 * Com `buscavel`, aí sim viramos um combobox `role="combobox"` completo (setas, Enter, Esc,
 * Home/End, `aria-activedescendant`, foco preso no campo de busca). Ligue só quando a lista
 * for longa o bastante para justificar perder a roda do celular.
 *
 * **O rótulo é obrigação de quem usa**: passe `aria-label` ou um `<label htmlFor>` apontando
 * para o `id`. Um select sem rótulo é um campo mudo no leitor de tela.
 *
 * @example
 * <Selecao aria-label="Categoria" opcoes={cats} valor={cat} onChange={setCat} placeholder="Escolha a categoria" />
 *
 * @example Lista longa — aí vale o combobox
 * <Selecao buscavel limpavel opcoes={cidades} valor={cidade} onChange={setCidade} placeholder="Busque a cidade" />
 *
 * @see Menu — para AÇÕES (Editar, Excluir). Selecao é para VALOR.
 */
export const Selecao = forwardRef<SelecaoRef, SelecaoProps>(function Selecao(props, ref) {
  // Os dois modos são componentes diferentes de verdade (um tem estado de abertura e filtro,
  // o outro não tem estado nenhum). Separados, cada um chama seus hooks sem condicional.
  return props.buscavel ? <SelecaoBuscavel {...props} ref={ref} /> : <SelecaoNativa {...props} ref={ref} />
})

/* ══════════════════════════════════════════════════════════════════════════════
 * Modo nativo — o padrão
 * ════════════════════════════════════════════════════════════════════════════ */

const SelecaoNativa = forwardRef<SelecaoRef, SelecaoProps>(function SelecaoNativa(
  {
    opcoes, valor, onChange, placeholder, size = 'md', erro, disabled,
    limpavel, className, id: idProp, buscavel: _buscavel, ...rest
  },
  ref,
) {
  // O <CampoForm> declara o erro UMA vez e injeta `aria-invalid` pelo clone. Ler o que
  // chega é o que faz este controle obedecer ao wrapper, igual a Campo e AreaTexto.
  const ariaInvalidDeFora = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'
  const idBase = useId()
  const idErro = `${idBase}-erro`
  const mostrarLimpar = Boolean(limpavel && valor && !disabled)

  const blocos = useMemo(() => agrupar(opcoes), [opcoes])

  return (
    <div
      className={cx(
        'amb-selecao',
        `amb-selecao--${size}`,
        erro && 'amb-selecao--erro',
        mostrarLimpar && 'amb-selecao--limpavel',
        className,
      )}
    >
      <div className="amb-selecao__controle">
        <select
          // `rest` vem PRIMEIRO de propósito: o que este componente controla (valor, erro,
          // aria-describedby) tem que vencer o que passarem por fora. Espalhar por último
          // deixaria um `aria-describedby` do consumidor apagar o vínculo com a mensagem de erro.
          {...rest}
          ref={ref as Ref<HTMLSelectElement>}
          id={idProp}
          className="amb-selecao__campo amb-focus-ring"
          value={valor}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          // `|| ariaInvalidDeFora`: sem isso, um `aria-invalid` vindo do <CampoForm> era
          // sobrescrito para `undefined` e o estado de erro do wrapper sumia em silêncio —
          // enquanto Campo e AreaTexto o respeitam. Uma família de formulário onde um
          // controle ignora o wrapper é pior que um wrapper que não existe.
          aria-invalid={erro || ariaInvalidDeFora ? true : undefined}
          // Sem isto o leitor de tela lê o campo e nunca chega no motivo do erro.
          aria-describedby={cx(erro && idErro, rest['aria-describedby']) || undefined}
        >
          {placeholder !== undefined && (
            // `disabled` quando não é limpável: sem isso a pessoa escolhe "Escolha a categoria"
            // como se fosse um valor. Quando É limpável, esta opção é justamente o caminho de
            // volta para o vazio dentro da roda nativa — melhor que o X no celular.
            <option value="" disabled={!limpavel}>
              {placeholder}
            </option>
          )}
          {blocos.map(bloco =>
            bloco.grupo ? (
              <optgroup key={bloco.grupo} label={bloco.grupo}>
                {bloco.itens.map(({ opcao }) => (
                  <option key={opcao.valor} value={opcao.valor} disabled={opcao.desabilitada}>
                    {opcao.rotulo}
                  </option>
                ))}
              </optgroup>
            ) : (
              bloco.itens.map(({ opcao }) => (
                <option key={opcao.valor} value={opcao.valor} disabled={opcao.desabilitada}>
                  {opcao.rotulo}
                </option>
              ))
            ),
          )}
        </select>

        {mostrarLimpar && (
          <button
            type="button"
            className="amb-selecao__limpar amb-focus-ring"
            aria-label="Limpar escolha"
            onClick={() => onChange('')}
          >
            <Xis />
          </button>
        )}

        <span className="amb-selecao__seta">
          <Seta />
        </span>
      </div>

      {/* Cor + PALAVRA. A borda vermelha sozinha não diz o que está errado. */}
      {erro && <p id={idErro} className="amb-selecao__erro">{erro}</p>}
    </div>
  )
})

/* ══════════════════════════════════════════════════════════════════════════════
 * Modo buscável — combobox (APG)
 * ════════════════════════════════════════════════════════════════════════════ */

const SelecaoBuscavel = forwardRef<SelecaoRef, SelecaoProps>(function SelecaoBuscavel(
  {
    opcoes, valor, onChange, placeholder, size = 'md', erro, disabled,
    limpavel, className, id: idProp, buscavel: _buscavel, ...rest
  },
  ref,
) {
  // O <CampoForm> declara o erro UMA vez e injeta `aria-invalid` pelo clone. Ler o que
  // chega é o que faz este controle obedecer ao wrapper, igual a Campo e AreaTexto.
  const ariaInvalidDeFora = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'
  const idErro = `${useId()}-erro`

  const [busca, setBusca] = useState('')

  const campoRef = useRef<HTMLInputElement>(null)
  // O ref público aponta para o input — é o elemento que existe neste modo.
  useImperativeHandle(ref, () => campoRef.current as HTMLInputElement, [])

  const selecionada = opcoes.find(o => o.valor === valor)

  const filtradas = useMemo(() => {
    const alvo = normalizar(busca)
    if (!alvo) return opcoes
    return opcoes.filter(o => normalizar(o.rotulo).includes(alvo))
  }, [opcoes, busca])

  const blocos = useMemo(() => agrupar(filtradas), [filtradas])

  // Toda a máquina do combobox (marca ativa, setas, Enter, Esc, clique de fora, ids do
  // ARIA) vem do miolo compartilhado com o Autocomplete — ver `utils/combobox.ts`. Aqui
  // fica só o que é da Selecao: o filtro local e o valor único.
  const cb = useCombobox<OpcaoSelecao, HTMLInputElement>({
    itens: filtradas,
    disabled,
    reancorarQuando: busca,
    aoEscolher: indice => {
      onChange(filtradas[indice].valor)
      cb.fechar()
    },
    // A lista é curta: reabrir marcando o que já está valendo é o que a pessoa espera.
    indiceInicialAoAbrir: () => opcoes.findIndex(o => o.valor === valor && !o.desabilitada),
    // Limpa o filtro ao fechar: senão, ao reabrir, a lista aparece cortada por uma busca
    // antiga que a pessoa não lembra ter feito.
    aoFechar: () => setBusca(''),
  })
  const { aberto, idLista, idOpcao, indiceAtivo } = cb

  const mostrarLimpar = Boolean(limpavel && valor && !disabled)

  return (
    <div
      ref={cb.raizRef}
      className={cx(
        'amb-selecao',
        `amb-selecao--${size}`,
        erro && 'amb-selecao--erro',
        mostrarLimpar && 'amb-selecao--limpavel',
        className,
      )}
    >
      <div className="amb-selecao__controle">
        <input
          // Mesmo motivo do modo nativo: o controlado vence o que vier por fora.
          {...rest}
          ref={campoRef}
          id={idProp}
          type="text"
          role="combobox"
          className="amb-selecao__campo amb-focus-ring"
          // autoComplete off: o preenchimento automático do navegador cobre a nossa lista
          // com a dele e a pessoa vê duas listas empilhadas.
          autoComplete="off"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          // É isto que faz o leitor de tela narrar a opção ativa SEM tirar o foco do campo.
          aria-activedescendant={cb.idAtivo}
          // `|| ariaInvalidDeFora`: sem isso, um `aria-invalid` vindo do <CampoForm> era
          // sobrescrito para `undefined` e o estado de erro do wrapper sumia em silêncio —
          // enquanto Campo e AreaTexto o respeitam. Uma família de formulário onde um
          // controle ignora o wrapper é pior que um wrapper que não existe.
          aria-invalid={erro || ariaInvalidDeFora ? true : undefined}
          aria-describedby={cx(erro && idErro, rest['aria-describedby']) || undefined}
          // Fechado mostra a escolha; aberto mostra o que está sendo digitado.
          value={aberto ? busca : selecionada?.rotulo ?? ''}
          placeholder={placeholder}
          disabled={disabled}
          onChange={e => {
            setBusca(e.target.value)
            // Digitar com a lista fechada abre. Já aberta, quem reancora a marca ativa na
            // primeira opção é o efeito do `reancorarQuando` — chamar `abrir()` aqui de novo
            // faria o mesmo trabalho duas vezes.
            if (!aberto) cb.abrir()
          }}
          onClick={() => { if (!aberto) cb.abrir() }}
          onKeyDown={cb.aoTeclar}
        />

        {mostrarLimpar && (
          <button
            type="button"
            className="amb-selecao__limpar amb-focus-ring"
            aria-label="Limpar escolha"
            onClick={() => { onChange(''); setBusca('') }}
          >
            <Xis />
          </button>
        )}

        <span className="amb-selecao__seta">
          <Seta />
        </span>

        {/* A lista existe no DOM só quando aberta: um listbox escondido continua sendo lido
            por leitor de tela em alguns navegadores. */}
        {aberto && (
          <ul
            id={idLista}
            role="listbox"
            className="amb-combobox__lista"
            // O clique numa opção tiraria o foco do input (indo para o body, já que <li> não
            // é focável) e o combobox ficaria sem dono. O padrão APG exige o foco no campo.
            onMouseDown={e => e.preventDefault()}
          >
            {filtradas.length === 0 && (
              // Lista vazia sem explicação parece bug. O texto diz que a busca é que não achou.
              <li className="amb-combobox__vazio" role="presentation">
                Nada encontrado para “{busca}”
              </li>
            )}

            {blocos.map((bloco, i) =>
              bloco.grupo ? (
                <li key={`${bloco.grupo}-${i}`} role="presentation">
                  <ul role="group" aria-label={bloco.grupo} className="amb-combobox__grupo">
                    <li className="amb-combobox__grupo-rotulo" role="presentation" aria-hidden="true">
                      {bloco.grupo}
                    </li>
                    {bloco.itens.map(({ opcao, indice }) => (
                      <Opcao
                        key={opcao.valor}
                        id={idOpcao(indice)}
                        opcao={opcao}
                        ativa={indice === indiceAtivo}
                        escolhida={opcao.valor === valor}
                        aoEscolher={() => cb.escolher(indice)}
                      />
                    ))}
                  </ul>
                </li>
              ) : (
                bloco.itens.map(({ opcao, indice }) => (
                  <Opcao
                    key={opcao.valor}
                    id={idOpcao(indice)}
                    opcao={opcao}
                    ativa={indice === indiceAtivo}
                    escolhida={opcao.valor === valor}
                    aoEscolher={() => cb.escolher(indice)}
                  />
                ))
              ),
            )}
          </ul>
        )}
      </div>

      {erro && <p id={idErro} className="amb-selecao__erro">{erro}</p>}
    </div>
  )
})

function Opcao({
  id, opcao, ativa, escolhida, aoEscolher,
}: {
  id: string
  opcao: OpcaoSelecao
  ativa: boolean
  escolhida: boolean
  aoEscolher: () => void
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={escolhida}
      // aria-disabled e não `hidden`: a opção continua anunciada, só não é escolhível.
      aria-disabled={opcao.desabilitada || undefined}
      className={cx(
        'amb-combobox__opcao',
        ativa && 'amb-combobox__opcao--ativa',
        opcao.desabilitada && 'amb-combobox__opcao--desabilitada',
      )}
      onClick={() => { if (!opcao.desabilitada) aoEscolher() }}
    >
      {opcao.rotulo}
    </li>
  )
}
