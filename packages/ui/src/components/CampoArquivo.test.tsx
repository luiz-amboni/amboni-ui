import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, createEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampoArquivo } from './CampoArquivo'

/** Um arquivo com o peso que a gente quiser, sem alocar megabytes de verdade no teste. */
function arquivoDe(nome: string, tamanho: number, tipo = 'application/pdf'): File {
  const arquivo = new File(['x'], nome, { type: tipo })
  Object.defineProperty(arquivo, 'size', { value: tamanho })
  return arquivo
}

const MB = 1024 * 1024

/** O que o navegador entrega no `drop`. jsdom não constrói DataTransfer, então é à mão. */
const soltar = (alvo: Element, arquivos: File[]) =>
  fireEvent.drop(alvo, { dataTransfer: { files: arquivos, types: ['Files'] } })

const area = () => document.querySelector('.amb-campo-arquivo__area') as HTMLElement

describe('CampoArquivo — o input nativo, escondido do jeito certo', () => {
  test('o input é ALCANÇÁVEL por Tab', async () => {
    // A armadilha nº 1 da categoria: quase toda biblioteca faz `display: none` no input e
    // põe um <button> que chama .click(). Isso tira o input do Tab E da árvore de
    // acessibilidade — quem navega por teclado depende de um botão falso, e o leitor de
    // tela anuncia "botão" em vez de "botão de seleção de arquivo".
    render(<CampoArquivo onArquivos={() => {}} />)

    await userEvent.tab()
    expect(screen.getByLabelText(/Escolher arquivo/)).toHaveFocus()
  })

  test('o input continua sendo anunciado como seleção de arquivo, com nome', () => {
    // `getByLabelText` só acha porque o <label> aponta para um input que EXISTE na árvore.
    // Com `display: none` o elemento sai da árvore de acessibilidade e o leitor de tela
    // anuncia o botão falso como "botão" — sem dizer que ali abre uma janela do sistema.
    render(<CampoArquivo onArquivos={() => {}} rotulo="Anexar contrato" />)
    const campo = screen.getByLabelText(/Anexar contrato/) as HTMLInputElement
    expect(campo.type).toBe('file')
    // "ou arraste até aqui" entra no nome de propósito: diz que o atalho existe.
    expect(campo).toHaveAccessibleName(/arraste/)
  })

  test('o <label> dispara o input NATIVAMENTE — sem .click() em JS', async () => {
    // É o HTML fazendo o trabalho: label com htmlFor + input dentro. Nenhum JS envolvido,
    // logo nada para um navegador bloquear por "clique não veio de gesto do usuário".
    render(<CampoArquivo onArquivos={() => {}} />)
    const input = screen.getByLabelText(/Escolher arquivo/)
    const espiao = vi.fn()
    input.addEventListener('click', espiao)

    await userEvent.click(screen.getByText('Escolher arquivo'))
    expect(espiao).toHaveBeenCalled()
  })

  test('escolher pelo input entrega os arquivos', async () => {
    const onArquivos = vi.fn()
    render(<CampoArquivo onArquivos={onArquivos} />)

    const arquivo = arquivoDe('contrato.pdf', 1024)
    await userEvent.upload(screen.getByLabelText(/Escolher arquivo/), arquivo)
    expect(onArquivos).toHaveBeenCalledWith([arquivo])
  })

  test('o value é zerado — senão o MESMO arquivo de novo não dispara nada', async () => {
    // `change` só dispara quando o valor muda. Sem zerar: a pessoa escolhe foto.png,
    // remove a etiqueta, escolhe foto.png outra vez — e a tela não faz nada. Ela tenta
    // mais duas vezes e desiste.
    render(<CampoArquivo onArquivos={() => {}} />)
    const input = screen.getByLabelText(/Escolher arquivo/) as HTMLInputElement

    await userEvent.upload(input, arquivoDe('foto.png', 1024, 'image/png'))
    expect(input.value).toBe('')
  })
})

describe('CampoArquivo — arrastar e soltar', () => {
  test('onDragOver chama preventDefault — sem isso o onDrop NUNCA dispara', () => {
    // A armadilha clássica: o código do drop está perfeito e simplesmente não roda. O
    // padrão do navegador é RECUSAR o arrasto; prevenir o dragover é o jeito (nada
    // intuitivo) de dizer "aqui pode soltar".
    render(<CampoArquivo onArquivos={() => {}} />)

    const evento = createEvent.dragOver(area(), { dataTransfer: { files: [], types: ['Files'] } })
    fireEvent(area(), evento)
    expect(evento.defaultPrevented).toBe(true)
  })

  test('soltar um arquivo válido entrega o arquivo', () => {
    const onArquivos = vi.fn()
    render(<CampoArquivo onArquivos={onArquivos} />)

    const arquivo = arquivoDe('planilha.csv', 2048, 'text/csv')
    soltar(area(), [arquivo])
    expect(onArquivos).toHaveBeenCalledWith([arquivo])
  })

  test('a área não "pisca" ao passar por cima dos próprios filhos', () => {
    // dragenter/dragleave disparam também nos FILHOS: entrar no texto dispara um
    // `dragleave` no label. Sem o contador de profundidade, a borda acende e apaga
    // enquanto a pessoa mexe o mouse DENTRO da própria zona.
    render(<CampoArquivo onArquivos={() => {}} />)
    const texto = screen.getByText('Escolher arquivo')

    fireEvent.dragEnter(area()) // entrou na área          → 1
    expect(area()).toHaveAttribute('data-amb-arrastando', 'true')

    fireEvent.dragEnter(texto) // entrou no filho (borbulha) → 2
    fireEvent.dragLeave(area()) // saiu do label por causa do filho → 1
    expect(area()).toHaveAttribute('data-amb-arrastando', 'true')

    fireEvent.dragLeave(area()) // saiu de verdade → 0
    expect(area()).not.toHaveAttribute('data-amb-arrastando')
  })

  test('soltar encerra o realce mesmo com dragleave pendurado', () => {
    render(<CampoArquivo onArquivos={() => {}} />)
    fireEvent.dragEnter(area())
    fireEvent.dragEnter(screen.getByText('Escolher arquivo'))
    soltar(area(), [arquivoDe('a.pdf', 10)])
    expect(area()).not.toHaveAttribute('data-amb-arrastando')
  })

  test('desabilitado não aceita arrasto nem realça', () => {
    const onArquivos = vi.fn()
    render(<CampoArquivo onArquivos={onArquivos} disabled />)

    fireEvent.dragEnter(area())
    expect(area()).not.toHaveAttribute('data-amb-arrastando')
    soltar(area(), [arquivoDe('a.pdf', 10)])
    expect(onArquivos).not.toHaveBeenCalled()
  })
})

describe('CampoArquivo — validação com mensagem que ensina', () => {
  test('arquivo grande demais: erro em role="alert" com os DOIS tamanhos', () => {
    // "Arquivo inválido" deixa a pessoa tentando de novo com o mesmo arquivo, porque ela
    // não faz ideia do que está errado. A mensagem tem que dizer o que veio e o que cabe.
    const onArquivos = vi.fn()
    render(<CampoArquivo onArquivos={onArquivos} tamanhoMax={5 * MB} />)

    soltar(area(), [arquivoDe('foto.png', 12 * MB, 'image/png')])

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('12 MB')
    expect(alerta).toHaveTextContent('5 MB')
    expect(alerta).toHaveTextContent('foto.png')
    // Nada passou: não existe escolha para entregar.
    expect(onArquivos).not.toHaveBeenCalled()
  })

  test('tipo recusado diz o que é aceito', () => {
    const onArquivos = vi.fn()
    render(<CampoArquivo onArquivos={onArquivos} aceita=".pdf" />)

    // O `accept` do HTML não vale para arrasto — o navegador nem consulta. Quem barra
    // aqui é o JS (que também não é segurança: quem decide é o servidor).
    soltar(area(), [arquivoDe('virus.exe', 10, 'application/x-msdownload')])

    expect(screen.getByRole('alert')).toHaveTextContent('.pdf')
    expect(onArquivos).not.toHaveBeenCalled()
  })

  test('numa leva mista, o que presta passa e o resto vira mensagem', () => {
    const onArquivos = vi.fn()
    render(<CampoArquivo onArquivos={onArquivos} multiplo tamanhoMax={5 * MB} />)

    const bom = arquivoDe('ok.pdf', 1 * MB)
    soltar(area(), [bom, arquivoDe('enorme.pdf', 9 * MB)])

    expect(onArquivos).toHaveBeenCalledWith([bom])
    expect(screen.getByRole('alert')).toHaveTextContent('enorme.pdf')
  })

  test('o erro é re-anunciado quando um segundo arquivo ruim cai em seguida', () => {
    // role="alert" só é anunciado quando o nó é MONTADO com a mensagem. Trocar o texto de
    // um <p role="alert"> que já estava lá passa batido em parte dos leitores de tela —
    // daí a `key` com o conteúdo, que força um nó novo a cada mensagem nova.
    render(<CampoArquivo onArquivos={() => {}} tamanhoMax={1 * MB} />)

    soltar(area(), [arquivoDe('um.pdf', 9 * MB)])
    const primeiro = screen.getByRole('alert')

    soltar(area(), [arquivoDe('dois.pdf', 9 * MB)])
    const segundo = screen.getByRole('alert')

    expect(segundo).not.toBe(primeiro)
    expect(segundo).toHaveTextContent('dois.pdf')
  })

  test('sem `multiplo`, soltar vários usa o primeiro e AVISA', () => {
    // Descartar em silêncio é o pior dos mundos: a pessoa larga três, vê um, e conclui que
    // o sistema comeu dois.
    const onArquivos = vi.fn()
    render(<CampoArquivo onArquivos={onArquivos} />)

    const primeiro = arquivoDe('a.pdf', 10)
    soltar(area(), [primeiro, arquivoDe('b.pdf', 10)])

    expect(onArquivos).toHaveBeenCalledWith([primeiro])
    expect(screen.getByRole('alert')).toHaveTextContent('a.pdf')
  })

  test('o erro é ligado ao input por aria-describedby', () => {
    render(<CampoArquivo onArquivos={() => {}} tamanhoMax={1 * MB} />)
    soltar(area(), [arquivoDe('grande.pdf', 9 * MB)])

    const input = screen.getByLabelText(/Escolher arquivo/)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/grande\.pdf/)
  })

  test('regra por extensão vence o `type` em branco do navegador', () => {
    // `file.type` é adivinhado pela extensão e vem vazio para o que o sistema não conhece
    // — um .csv no Windows costuma vir sem tipo. Por isso a regra de extensão existe.
    const onArquivos = vi.fn()
    render(<CampoArquivo onArquivos={onArquivos} aceita=".csv" />)

    const csv = arquivoDe('clientes.csv', 100, '')
    soltar(area(), [csv])
    expect(onArquivos).toHaveBeenCalledWith([csv])
  })
})

describe('CampoArquivo — o que já foi escolhido', () => {
  test('cada arquivo vira uma <Etiqueta> removível que diz O QUE remove', () => {
    const onRemover = vi.fn()
    render(
      <CampoArquivo
        onArquivos={() => {}}
        onRemover={onRemover}
        arquivos={[arquivoDe('contrato.pdf', 2048), arquivoDe('foto.png', 4096, 'image/png')]}
      />,
    )
    // Duas etiquetas com "Remover" idêntico não navegam: o nome do arquivo tem que estar
    // no rótulo do X.
    expect(screen.getByRole('button', { name: 'Remover contrato.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover foto.png' })).toBeInTheDocument()
  })

  test('o X devolve o arquivo e o índice', async () => {
    const onRemover = vi.fn()
    const arquivos = [arquivoDe('a.pdf', 10), arquivoDe('b.pdf', 10)]
    render(<CampoArquivo onArquivos={() => {}} onRemover={onRemover} arquivos={arquivos} />)

    await userEvent.click(screen.getByRole('button', { name: 'Remover b.pdf' }))
    expect(onRemover).toHaveBeenCalledWith(arquivos[1], 1)
  })

  test('sem onRemover não existe X — um X que não remove é promessa falsa', () => {
    render(<CampoArquivo onArquivos={() => {}} arquivos={[arquivoDe('a.pdf', 10)]} />)
    expect(screen.queryByRole('button', { name: /Remover/ })).not.toBeInTheDocument()
  })

  test('o peso do arquivo aparece na etiqueta', () => {
    render(<CampoArquivo onArquivos={() => {}} arquivos={[arquivoDe('a.pdf', 2 * MB)]} />)
    expect(screen.getByText('2 MB')).toBeInTheDocument()
  })
})

describe('CampoArquivo — ajuda e progresso', () => {
  test('o limite de tamanho entra na ajuda, e a ajuda é DESCRIÇÃO, não nome', () => {
    // Dentro do <label>, a restrição entraria no nome acessível e o input passaria a se
    // chamar "Escolher arquivo ou arraste até aqui PDF ou PNG até 5 MB".
    render(<CampoArquivo onArquivos={() => {}} ajuda="PDF ou PNG" tamanhoMax={5 * MB} />)
    const input = screen.getByLabelText(/Escolher arquivo/)

    expect(input).toHaveAccessibleDescription('PDF ou PNG · até 5 MB')
    expect(input).toHaveAccessibleName(/Escolher arquivo/)
    expect(input).not.toHaveAccessibleName(/5 MB/)
  })

  test('progresso indefinido não desenha barra parada no zero', () => {
    // `0` diria "está acontecendo, e está no começo" — quando não está acontecendo nada.
    const { rerender } = render(<CampoArquivo onArquivos={() => {}} arquivos={[arquivoDe('a.pdf', 10)]} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

    rerender(<CampoArquivo onArquivos={() => {}} arquivos={[arquivoDe('a.pdf', 10)]} progresso={42} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42')
  })

  test('com um arquivo só, a barra diz qual está subindo', () => {
    render(<CampoArquivo onArquivos={() => {}} arquivos={[arquivoDe('contrato.pdf', 10)]} progresso={10} />)
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Enviando contrato.pdf')
  })
})
