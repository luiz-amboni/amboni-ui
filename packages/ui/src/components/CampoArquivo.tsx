import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import { Etiqueta } from './Etiqueta'
import { Progresso } from './Progresso'
import './CampoArquivo.css'

export interface CampoArquivoProps {
  /**
   * Recebe os arquivos que passaram na validação. **Só é chamado quando sobra alguém**:
   * se tudo foi barrado, o que existe é uma mensagem de erro, não uma escolha.
   */
  onArquivos: (arquivos: File[]) => void
  /**
   * O mesmo formato do `accept` do HTML: `'image/*'`, `'.pdf,.csv'`, `'image/png'`.
   *
   * **Isto não é segurança, é conveniência.** O `accept` só filtra o que aparece na
   * janela do sistema — e ainda assim a pessoa troca o filtro para "Todos os arquivos" e
   * escolhe o que quiser. Arquivo ARRASTADO ignora o `accept` por completo: o navegador
   * nem consulta. Por isso o componente revalida em JS, o que também não é segurança —
   * JS roda na máquina de quem usa. Quem decide se um `.exe` renomeado para `.pdf` entra
   * é o **servidor**, olhando o conteúdo. Aqui a gente só evita a viagem perdida.
   */
  aceita?: string
  /** Aceita mais de um por vez. @default false */
  multiplo?: boolean
  /** Limite por arquivo, em **bytes** (`5 * 1024 * 1024`). Sem isto, não há limite aqui. */
  tamanhoMax?: number
  /** Os arquivos já escolhidos, para mostrar como etiquetas. O estado é de quem usa. */
  arquivos?: File[]
  /** Sem isto, a etiqueta não ganha X — um X que não remove nada é uma promessa falsa. */
  onRemover?: (arquivo: File, indice: number) => void
  disabled?: boolean
  /**
   * 0 a 100. Presente = tem envio em curso e aparece a `<Progresso>`. `undefined` (e não
   * `0`) quando não há envio: `0` desenharia uma barra parada no começo, dizendo que
   * algo está acontecendo quando não está.
   */
  progresso?: number
  /** O texto da área. Vira o **nome acessível** do input. @default 'Escolher arquivo' */
  rotulo?: ReactNode
  /** Restrições e formato ("PNG ou PDF"). O limite de tamanho já entra sozinho. */
  ajuda?: ReactNode
  /** Id fixo, se precisar. Do contrário um é gerado. */
  id?: string
  /** Nome do campo, para envio por `<form>` nativo. */
  name?: string
  className?: string
}

/**
 * Bytes em algo legível.
 *
 * Base 1024 com rótulo "MB" — a mesma régua do Windows, do Android e da maioria dos
 * gerenciadores de arquivo. Não é a definição do SI (que faria 1 MB = 1.000.000), e dá
 * para brigar por isso; o que decide é que a mensagem compara DUAS grandezas medidas
 * pela MESMA régua ("tem 12 MB; o limite é 5 MB"). Misturar as bases é que produziria a
 * cena absurda: um arquivo de "5,0 MB" recusado por um limite de "5 MB".
 *
 * `toLocaleString` e não `.replace('.', ',')`: o separador decimal é do idioma de quem lê.
 */
function formatarTamanho(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${Math.round(bytes)} B`

  const unidades = ['KB', 'MB', 'GB', 'TB']
  let valor = bytes / 1024
  let i = 0
  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024
    i++
  }
  // Uma casa decimal só embaixo de 10 ("1,4 MB"); acima disso o decimal é ruído ("12 MB").
  const texto = valor.toLocaleString(undefined, { maximumFractionDigits: valor < 10 ? 1 : 0 })
  return `${texto} ${unidades[i]}`
}

/**
 * O arquivo bate com o `aceita`?
 *
 * Regra de extensão (`.pdf`) é a confiável. Regra de MIME (`image/png`, `image/*`) depende
 * do `file.type`, que o navegador **adivinha pela extensão** e deixa em branco (`''`)
 * quando não conhece — um `.csv` no Windows costuma vir sem tipo, ou como
 * `application/vnd.ms-excel` se o Excel estiver instalado. Por isso, na dúvida entre as
 * duas, escreva a extensão.
 */
function tipoAceito(arquivo: File, aceita?: string): boolean {
  if (!aceita) return true
  const regras = aceita
    .split(',')
    .map(r => r.trim().toLowerCase())
    .filter(Boolean)
  if (regras.length === 0) return true

  const nome = arquivo.name.toLowerCase()
  const tipo = (arquivo.type || '').toLowerCase()

  return regras.some(regra => {
    if (regra.startsWith('.')) return nome.endsWith(regra)
    if (regra.endsWith('/*')) return tipo.startsWith(regra.slice(0, -1))
    return tipo === regra
  })
}

/**
 * CampoArquivo — anexar contrato, foto, planilha.
 *
 * ## A armadilha nº 1: o input escondido com `display: none`
 *
 * Quase toda biblioteca faz assim — some com o `<input type="file">` e põe um `<button>`
 * que chama `input.click()`. Custa caro e não aparece em nenhum teste de render:
 *
 * · `display: none` **tira o elemento da árvore de acessibilidade**. O leitor de tela não
 *   anuncia "escolher arquivo, botão de seleção" — anuncia "botão", como qualquer outro.
 *   A pessoa não sabe que ali vai abrir uma janela do sistema.
 * · O input some do Tab, então quem navega por teclado depende do botão falso funcionar.
 * · O `.click()` disparado por JS é bloqueado por navegador quando não vem de um gesto
 *   direto — e é o tipo de coisa que quebra num navegador só, meses depois.
 *
 * Aqui: o input é NATIVO, fica escondido só visualmente (`.amb-sr-only` recorta em 1px,
 * sem tirar da árvore), continua no Tab e continua sendo anunciado como o que é. Quem
 * abre a janela é um `<label>` de verdade em volta dele — comportamento do HTML, zero JS.
 * O anel de foco aparece na área inteira via `:has()`, no CSS.
 *
 * ## Arrastar e soltar é ATALHO, nunca o caminho
 *
 * Não existe arrastar no teclado, e no celular não existe de jeito nenhum. A área de
 * soltar é o mesmo `<label>` que se clica: quem arrasta ganha um atalho, e quem não pode
 * arrastar não perde nada. Uma zona que SÓ aceita `onDrop` exclui, em silêncio, todo
 * mundo que usa toque ou teclado.
 *
 * @example
 * <CampoArquivo
 *   aceita=".pdf,.png"
 *   tamanhoMax={5 * 1024 * 1024}
 *   ajuda="PDF ou PNG"
 *   arquivos={anexos}
 *   onArquivos={novos => setAnexos([...anexos, ...novos])}
 *   onRemover={(_, i) => setAnexos(anexos.filter((_, j) => j !== i))}
 * />
 */
export const CampoArquivo = forwardRef<HTMLInputElement, CampoArquivoProps>(function CampoArquivo(
  {
    onArquivos,
    aceita,
    multiplo = false,
    tamanhoMax,
    arquivos,
    onRemover,
    disabled = false,
    progresso,
    rotulo = 'Escolher arquivo',
    ajuda,
    id: idProp,
    name,
    className,
  },
  ref,
) {
  const gerado = useId()
  const id = idProp ?? gerado
  const idAjuda = `${id}-ajuda`
  const idErro = `${id}-erro`

  const [erros, setErros] = useState<string[]>([])
  const [arrastando, setArrastando] = useState(false)

  // ── O contador de arrasto ──────────────────────────────────────────────────
  // `dragenter` e `dragleave` disparam também ao passar por cima dos FILHOS da área (o
  // texto, o ícone): entrar no <span> do texto dispara um `dragleave` no <label>, e a
  // borda "pisca" enquanto a pessoa move o mouse dentro da própria zona. O contador
  // resolve: só desliga quando o número de entradas volta a zero — aí saiu de verdade.
  // Fica num ref e não em estado: é contabilidade interna, e cada `dragenter` re-renderizando
  // a árvore por causa de um número que ninguém desenha seria desperdício puro.
  const profundidade = useRef(0)

  const listaArquivos = arquivos ?? []

  function validar(lista: File[]): { validos: File[]; problemas: string[] } {
    const validos: File[] = []
    const problemas: string[] = []

    for (const arquivo of lista) {
      if (!tipoAceito(arquivo, aceita)) {
        // Diz o que veio E o que se espera. "Arquivo inválido" deixa a pessoa tentando de
        // novo com o mesmo arquivo, porque ela não faz ideia do que está errado.
        problemas.push(`"${arquivo.name}" não é de um tipo aceito aqui. Aceitos: ${aceita}.`)
        continue
      }
      if (tamanhoMax !== undefined && arquivo.size > tamanhoMax) {
        problemas.push(
          `"${arquivo.name}" tem ${formatarTamanho(arquivo.size)}; o limite é ${formatarTamanho(tamanhoMax)}.`,
        )
        continue
      }
      validos.push(arquivo)
    }

    return { validos, problemas }
  }

  function tratar(lista: File[]) {
    if (disabled || lista.length === 0) return

    let entrada = lista
    const problemas: string[] = []

    // Soltar 3 arquivos numa área de um só: usa o primeiro e AVISA. Descartar em silêncio
    // é o pior dos mundos — a pessoa larga três, vê um, e conclui que o sistema comeu dois.
    if (!multiplo && lista.length > 1) {
      entrada = [lista[0]]
      problemas.push(`Só dá para enviar um arquivo por vez; usamos "${lista[0].name}".`)
    }

    const { validos, problemas: barrados } = validar(entrada)
    setErros([...problemas, ...barrados])
    if (validos.length > 0) onArquivos(validos)
  }

  function aoTrocar(e: ChangeEvent<HTMLInputElement>) {
    tratar(Array.from(e.target.files ?? []))

    // ── Zerar o value: o bug do "mesmo arquivo de novo" ──────────────────────
    // O `change` só dispara quando o valor MUDA. Escolher `foto.png`, remover a etiqueta e
    // escolher `foto.png` outra vez não muda valor nenhum — e nada acontece. A pessoa
    // clica, escolhe, a janela fecha e a tela fica igual; ela tenta mais duas vezes e
    // desiste. Zerando aqui, toda escolha é uma mudança.
    e.target.value = ''
  }

  function aoArrastarPorCima(e: DragEvent<HTMLLabelElement>) {
    // Sem este preventDefault o `onDrop` NUNCA dispara. O padrão do navegador é recusar o
    // arrasto; prevenir o `dragover` é o jeito (nada intuitivo) de dizer "aqui pode".
    // É a armadilha clássica: o código do drop está certo e simplesmente não roda.
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
  }

  function aoEntrar(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    if (disabled) return
    profundidade.current += 1
    setArrastando(true)
  }

  function aoSair(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    if (disabled) return
    profundidade.current = Math.max(0, profundidade.current - 1)
    if (profundidade.current === 0) setArrastando(false)
  }

  function aoSoltar(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    // Zera direto: soltar encerra o arrasto inteiro, e os `dragleave` dos filhos que
    // ficaram pelo caminho não vêm mais para descontar o contador.
    profundidade.current = 0
    setArrastando(false)
    if (disabled) return
    tratar(Array.from(e.dataTransfer?.files ?? []))
  }

  const temAjuda = Boolean(ajuda) || tamanhoMax !== undefined
  const temErro = erros.length > 0
  const descrito = cx(temErro && idErro, temAjuda && idAjuda) || undefined

  return (
    <div className={cx('amb-campo-arquivo', className)}>
      {/* O <label> É a área de soltar. Um por cima do outro seriam dois alvos disputando
          o mesmo pixel; aqui é um só, e é o do HTML. */}
      <label
        htmlFor={id}
        className="amb-campo-arquivo__area"
        data-amb-arrastando={arrastando || undefined}
        data-amb-disabled={disabled || undefined}
        onDragEnter={aoEntrar}
        onDragOver={aoArrastarPorCima}
        onDragLeave={aoSair}
        onDrop={aoSoltar}
      >
        <input
          ref={ref}
          id={id}
          name={name}
          type="file"
          // Escondido só para o olho. Continua no Tab, continua na árvore de
          // acessibilidade, continua sendo o input nativo que abre a janela do sistema.
          // Ver o bloco no topo do arquivo — é a decisão central deste componente.
          className="amb-sr-only amb-campo-arquivo__input"
          accept={aceita}
          multiple={multiplo}
          disabled={disabled}
          aria-describedby={descrito}
          aria-invalid={temErro ? true : undefined}
          onChange={aoTrocar}
        />

        <span className="amb-campo-arquivo__icone" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" focusable="false">
            <path
              d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {/* Este texto vira o nome acessível do input (o label o envolve E aponta por
            htmlFor — os dois concordam). "ou arraste até aqui" entra no nome de
            propósito: é informação, e diz que existe o atalho. */}
        <span className="amb-campo-arquivo__texto">
          {rotulo}
          <span className="amb-campo-arquivo__atalho"> ou arraste até aqui</span>
        </span>
      </label>

      {/* A ajuda fica FORA do <label>: dentro, ela entraria no nome acessível e o input
          passaria a se chamar "Escolher arquivo ou arraste até aqui PDF ou PNG até 5 MB".
          Nome é para identificar; restrição é descrição — daí o aria-describedby. */}
      {temAjuda && (
        <p id={idAjuda} className="amb-campo-arquivo__ajuda">
          {ajuda}
          {Boolean(ajuda) && tamanhoMax !== undefined && ' · '}
          {tamanhoMax !== undefined && `até ${formatarTamanho(tamanhoMax)}`}
        </p>
      )}

      {temErro && (
        // `key` com o texto dos erros: role="alert" só é anunciado quando o nó é MONTADO
        // com a mensagem. Trocar o texto de um <p role="alert"> que já estava lá passa
        // batido em parte dos leitores de tela — e o segundo arquivo grande demais
        // seguido não seria avisado. A key força um nó novo a cada mensagem nova.
        <div key={erros.join('|')} id={idErro} className="amb-campo-arquivo__erros" role="alert">
          {erros.map(erro => (
            <p key={erro} className="amb-campo-arquivo__erro">
              {erro}
            </p>
          ))}
        </div>
      )}

      {listaArquivos.length > 0 && (
        // role="list" num <ul> que já é lista: `list-style: none` faz o Safari largar a
        // semântica, e é ela que anuncia "lista de 3 itens" — a única pista de quantos
        // anexos existem para quem não vê as etiquetas. Ver o CSS.
        <ul role="list" className="amb-campo-arquivo__lista">
          {listaArquivos.map((arquivo, i) => (
            // A key inclui o índice: dois arquivos de mesmo nome e mesmo tamanho existem
            // (`foto.png` de duas pastas), e chave repetida faria o React remover a
            // etiqueta errada ao clicar num X.
            <li key={`${arquivo.name}-${arquivo.size}-${i}`}>
              <Etiqueta
                removivel={Boolean(onRemover)}
                onRemover={() => onRemover?.(arquivo, i)}
                // O conteúdo não é texto puro (tem o peso num <span>), então a própria
                // <Etiqueta> exige que o rótulo do X seja dito. E ele diz O QUE remove:
                // numa lista de 5 anexos, 5 botões "Remover" iguais não navegam.
                rotuloRemover={`Remover ${arquivo.name}`}
                icone={
                  <svg width="10" height="12" viewBox="0 0 12 14" fill="none" focusable="false">
                    <path d="M7 1H3a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 3 13h6a1.5 1.5 0 0 0 1.5-1.5V4.5L7 1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                    <path d="M7 1v3.5h3.5" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                  </svg>
                }
              >
                <span className="amb-campo-arquivo__nome">{arquivo.name}</span>
                <span className="amb-campo-arquivo__peso">{formatarTamanho(arquivo.size)}</span>
              </Etiqueta>
            </li>
          ))}
        </ul>
      )}

      {progresso !== undefined && (
        <Progresso
          className="amb-campo-arquivo__progresso"
          valor={progresso}
          mostrarValor
          rotulo={
            listaArquivos.length === 1 ? `Enviando ${listaArquivos[0].name}` : 'Enviando arquivos'
          }
        />
      )}
    </div>
  )
})
