import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabela, type Coluna } from './Tabela'
import { EstadoVazio } from './EstadoVazio'

interface Cliente {
  id: number
  nome: string
  valor: number
  cidade: string | null
}

const clientes: Cliente[] = [
  { id: 1, nome: 'Ana Souza', valor: 8888.88, cidade: 'Criciúma' },
  { id: 2, nome: 'Bruno Lima', valor: 1111.11, cidade: 'Tubarão' },
  { id: 3, nome: 'Carla Dias', valor: 4200.0, cidade: null },
]

const colunas: Coluna<Cliente>[] = [
  { chave: 'nome', titulo: 'Cliente', ordenavel: true },
  { chave: 'cidade', titulo: 'Cidade' },
  { chave: 'valor', titulo: 'Valor', numerico: true, ordenavel: true, render: (l) => `R$ ${l.valor.toFixed(2)}` },
]

function renderTabela(props: Partial<Parameters<typeof Tabela<Cliente>>[0]> = {}) {
  return render(
    <Tabela
      rotulo="Clientes"
      colunas={colunas}
      linhas={clientes}
      chaveLinha={(l) => l.id}
      {...props}
    />,
  )
}

describe('Tabela — é um <table> de verdade', () => {
  // Divs com role="table" imitam o visual e perdem a navegação por células: o leitor
  // de tela deixa de anunciar "coluna Valor, linha 3" e cada dado vira texto solto.
  test('expõe table, columnheader e rowheader nativos', () => {
    renderTabela()
    expect(screen.getByRole('table', { name: 'Clientes' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(3)
    // O nome do cliente é <th scope="row">: é ele que NOMEIA a linha para o leitor de
    // tela ("Ana Souza, Valor, R$ 8888.88" em vez de um "R$ 8888.88" órfão).
    expect(screen.getByRole('rowheader', { name: 'Ana Souza' })).toBeInTheDocument()
    expect(screen.getAllByRole('rowheader')).toHaveLength(3)
  })

  test('o rótulo vira <caption> — é o nome acessível da tabela', () => {
    const { container } = renderTabela()
    expect(container.querySelector('caption')?.textContent).toBe('Clientes')
  })

  test('uma linha por registro, com cabeçalho', () => {
    renderTabela()
    expect(screen.getAllByRole('row')).toHaveLength(4) // 3 + o cabeçalho
  })

  test('sem `render`, imprime o campo apontado por `chave`', () => {
    renderTabela()
    expect(screen.getByText('Criciúma')).toBeInTheDocument()
  })

  test('valor nulo vira traço, não célula em branco', () => {
    // Branco é ambíguo: dado vazio ou coluna quebrada? O traço afirma "não há valor".
    renderTabela()
    const linha = screen.getByRole('rowheader', { name: 'Carla Dias' }).closest('tr')!
    expect(within(linha).getByText('—')).toBeInTheDocument()
  })
})

describe('Tabela — ordenação', () => {
  test('aria-sort marca a coluna ordenada e as outras ficam em "none"', () => {
    renderTabela({ ordem: { coluna: 'valor', direcao: 'desc' }, onOrdenar: vi.fn() })

    // Sem aria-sort, a seta é enfeite visual: quem não a enxerga não tem como saber
    // por onde a tabela está ordenada.
    expect(screen.getByRole('columnheader', { name: /valor/i })).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByRole('columnheader', { name: /cliente/i })).toHaveAttribute('aria-sort', 'none')
  })

  test('aria-sort SAI da coluna ao ordenar por outra', () => {
    const { rerender } = renderTabela({ ordem: { coluna: 'valor', direcao: 'desc' }, onOrdenar: vi.fn() })
    rerender(
      <Tabela
        rotulo="Clientes"
        colunas={colunas}
        linhas={clientes}
        chaveLinha={(l) => l.id}
        ordem={{ coluna: 'nome', direcao: 'asc' }}
        onOrdenar={vi.fn()}
      />,
    )
    // Duas colunas anunciando ordenação ao mesmo tempo seria mentira.
    expect(screen.getByRole('columnheader', { name: /cliente/i })).toHaveAttribute('aria-sort', 'ascending')
    expect(screen.getByRole('columnheader', { name: /valor/i })).toHaveAttribute('aria-sort', 'none')
  })

  test('coluna não ordenável não tem aria-sort (nem "none")', () => {
    // "none" numa coluna que não ordena é ruído: sugere um controle que não existe.
    renderTabela({ ordem: { coluna: 'valor', direcao: 'desc' }, onOrdenar: vi.fn() })
    expect(screen.getByRole('columnheader', { name: 'Cidade' })).not.toHaveAttribute('aria-sort')
  })

  test('o cabeçalho ordenável é um <button> de verdade', () => {
    // <th onClick> não recebe foco nem responde a Enter — a ordenação simplesmente não
    // existe para quem usa teclado.
    renderTabela({ onOrdenar: vi.fn() })
    expect(screen.getByRole('button', { name: /cliente/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cidade' })).not.toBeInTheDocument()
  })

  test('clicar numa coluna de texto ordena A→Z', async () => {
    const onOrdenar = vi.fn()
    renderTabela({ onOrdenar })
    await userEvent.click(screen.getByRole('button', { name: /cliente/i }))
    expect(onOrdenar).toHaveBeenCalledWith('nome', 'asc')
  })

  test('clicar numa coluna numérica abre em DESC — quem clica em "Valor" quer o maior', async () => {
    const onOrdenar = vi.fn()
    renderTabela({ onOrdenar })
    await userEvent.click(screen.getByRole('button', { name: /valor/i }))
    expect(onOrdenar).toHaveBeenCalledWith('valor', 'desc')
  })

  test('clicar na coluna JÁ ordenada inverte a direção', async () => {
    const onOrdenar = vi.fn()
    renderTabela({ ordem: { coluna: 'valor', direcao: 'desc' }, onOrdenar })
    await userEvent.click(screen.getByRole('button', { name: /valor/i }))
    expect(onOrdenar).toHaveBeenCalledWith('valor', 'asc')
  })

  test('sem onOrdenar não há botão — nada de cabeçalho que finge ser clicável', async () => {
    renderTabela({ ordem: { coluna: 'nome', direcao: 'asc' } })
    expect(screen.queryByRole('button', { name: /cliente/i })).not.toBeInTheDocument()
  })

  test('ordenar por teclado funciona', async () => {
    const onOrdenar = vi.fn()
    renderTabela({ onOrdenar })
    screen.getByRole('button', { name: /cliente/i }).focus()
    await userEvent.keyboard('{Enter}')
    expect(onOrdenar).toHaveBeenCalledWith('nome', 'asc')
  })
})

describe('Tabela — carregando', () => {
  test('mostra esqueleto mantendo a contagem de colunas (o layout não pula)', () => {
    const { container } = renderTabela({ carregando: true, linhasEsqueleto: 4 })
    expect(container.querySelectorAll('.amb-tabela__esqueleto')).toHaveLength(4 * 3)
    // Cabeçalho intacto: as colunas já estão no lugar quando os dados chegarem.
    expect(screen.getAllByRole('columnheader')).toHaveLength(3)
  })

  test('anuncia "carregando" UMA vez só, não uma por célula', () => {
    // 12 esqueletos = 12 anúncios seria o leitor de tela repetindo "carregando" sem parar.
    renderTabela({ carregando: true })
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent(/carregando clientes/i)
  })

  test('carregando não mostra dado velho junto', () => {
    renderTabela({ carregando: true })
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
  })

  test('carregando não é vazio — não chama o EstadoVazio', () => {
    render(
      <Tabela
        colunas={colunas}
        linhas={[]}
        chaveLinha={(l) => l.id}
        carregando
        vazio={<EstadoVazio titulo="Nenhum cliente" />}
      />,
    )
    // Piscar "nenhum cliente" antes dos dados chegarem é dar notícia errada.
    expect(screen.queryByText('Nenhum cliente')).not.toBeInTheDocument()
  })
})

describe('Tabela — vazia', () => {
  test('mostra o EstadoVazio atravessando todas as colunas', () => {
    const { container } = render(
      <Tabela
        colunas={colunas}
        linhas={[]}
        chaveLinha={(l) => l.id}
        vazio={<EstadoVazio titulo="Nenhum cliente com esse filtro" descricao="Tente um período maior." />}
      />,
    )
    expect(screen.getByText('Nenhum cliente com esse filtro')).toBeInTheDocument()
    expect(screen.getByText('Tente um período maior.')).toBeInTheDocument()
    // colSpan errado deixa o estado vazio espremido embaixo da 1ª coluna.
    expect(container.querySelector('td[colspan]')).toHaveAttribute('colspan', '3')
  })

  test('o colSpan conta a coluna das caixas de seleção', () => {
    const { container } = render(
      <Tabela colunas={colunas} linhas={[]} chaveLinha={(l) => l.id} selecionaveis vazio={<EstadoVazio titulo="Vazio" />} />,
    )
    expect(container.querySelector('td[colspan]')).toHaveAttribute('colspan', '4')
  })

  test('avisa em desenvolvimento quando a tabela vazia não explica o motivo', () => {
    // Tabela vazia muda deixa a pessoa sem saber se filtrou demais ou se quebrou.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Tabela colunas={colunas} linhas={[]} chaveLinha={(l) => l.id} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`vazio`'))
    warn.mockRestore()
  })
})

describe('Tabela — seleção', () => {
  test('"selecionar todas" fica INDETERMINADO com seleção parcial', () => {
    renderTabela({ selecionaveis: true, selecionadas: [1], onSelecionar: vi.fn() })

    const todas = screen.getByRole('checkbox', { name: /todas/i }) as HTMLInputElement
    // `indeterminate` só existe como propriedade do DOM — não há atributo HTML. Sem o
    // ref que a seta, a caixa aparece desmarcada e a pessoa clica achando que vai
    // marcar tudo; o clique desmarca o que ela já tinha escolhido.
    expect(todas.indeterminate).toBe(true)
    expect(todas.checked).toBe(false)
  })

  test('tudo marcado: checked, e nada de indeterminado', () => {
    renderTabela({ selecionaveis: true, selecionadas: [1, 2, 3], onSelecionar: vi.fn() })
    const todas = screen.getByRole('checkbox', { name: /todas/i }) as HTMLInputElement
    expect(todas.checked).toBe(true)
    expect(todas.indeterminate).toBe(false)
  })

  test('nada marcado: nem checked nem indeterminado', () => {
    renderTabela({ selecionaveis: true, selecionadas: [], onSelecionar: vi.fn() })
    const todas = screen.getByRole('checkbox', { name: /todas/i }) as HTMLInputElement
    expect(todas.checked).toBe(false)
    expect(todas.indeterminate).toBe(false)
  })

  test('marcar todas devolve as chaves das linhas visíveis', async () => {
    const onSelecionar = vi.fn()
    renderTabela({ selecionaveis: true, selecionadas: [], onSelecionar })
    await userEvent.click(screen.getByRole('checkbox', { name: /todas/i }))
    expect(onSelecionar).toHaveBeenCalledWith([1, 2, 3])
  })

  test('desmarcar todas preserva a seleção de FORA da página', async () => {
    // Com filtro/paginação, marcar tudo aqui não pode apagar em silêncio o que a pessoa
    // escolheu em outra página.
    const onSelecionar = vi.fn()
    renderTabela({ selecionaveis: true, selecionadas: [1, 2, 3, 99], onSelecionar })
    await userEvent.click(screen.getByRole('checkbox', { name: /todas/i }))
    expect(onSelecionar).toHaveBeenCalledWith([99])
  })

  test('marcar uma linha acrescenta só ela', async () => {
    const onSelecionar = vi.fn()
    renderTabela({ selecionaveis: true, selecionadas: [], onSelecionar })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar linha 2' }))
    expect(onSelecionar).toHaveBeenCalledWith([2])
  })

  test('desmarcar uma linha tira só ela', async () => {
    const onSelecionar = vi.fn()
    renderTabela({ selecionaveis: true, selecionadas: [1, 2], onSelecionar })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar linha 2' }))
    expect(onSelecionar).toHaveBeenCalledWith([1])
  })

  test('clicar na CAIXA não dispara o onLinhaClick', async () => {
    // A armadilha clássica: o clique borbulha até a <tr> e o sistema abre o cliente
    // quando a pessoa só queria marcá-lo para uma ação em massa.
    const onLinhaClick = vi.fn()
    const onSelecionar = vi.fn()
    renderTabela({ selecionaveis: true, selecionadas: [], onSelecionar, onLinhaClick })

    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar linha 1' }))
    expect(onSelecionar).toHaveBeenCalledWith([1])
    expect(onLinhaClick).not.toHaveBeenCalled()
  })

  test('Espaço na caixa marca, e NÃO abre a linha', async () => {
    // Mesmo bug, pelo teclado: o keydown do checkbox borbulha até a <tr>.
    const onLinhaClick = vi.fn()
    const onSelecionar = vi.fn()
    renderTabela({ selecionaveis: true, selecionadas: [], onSelecionar, onLinhaClick })

    screen.getByRole('checkbox', { name: 'Selecionar linha 1' }).focus()
    await userEvent.keyboard(' ')
    expect(onSelecionar).toHaveBeenCalledWith([1])
    expect(onLinhaClick).not.toHaveBeenCalled()
  })

  test('"selecionar todas" fica desabilitado sem linhas', () => {
    render(<Tabela colunas={colunas} linhas={[]} chaveLinha={(l) => l.id} selecionaveis vazio={<EstadoVazio titulo="Vazio" />} />)
    expect(screen.getByRole('checkbox', { name: /todas/i })).toBeDisabled()
  })
})

describe('Tabela — clique na linha', () => {
  test('clicar na linha entrega o registro inteiro, não o índice', async () => {
    const onLinhaClick = vi.fn()
    renderTabela({ onLinhaClick })
    await userEvent.click(screen.getByText('Bruno Lima'))
    expect(onLinhaClick).toHaveBeenCalledWith(clientes[1])
  })

  test('linha clicável é alcançável e abre com Enter', async () => {
    const onLinhaClick = vi.fn()
    renderTabela({ onLinhaClick })

    const linha = screen.getByRole('rowheader', { name: 'Ana Souza' }).closest('tr')!
    expect(linha).toHaveAttribute('tabindex', '0')
    linha.focus()
    await userEvent.keyboard('{Enter}')
    expect(onLinhaClick).toHaveBeenCalledWith(clientes[0])
  })

  test('linha NÃO clicável não vira parada do Tab (não polui a navegação)', () => {
    renderTabela()
    const linha = screen.getByRole('rowheader', { name: 'Ana Souza' }).closest('tr')!
    expect(linha).not.toHaveAttribute('tabindex')
  })
})

describe('Tabela — rolagem horizontal', () => {
  test('o container que rola é alcançável por teclado e tem nome', () => {
    // Sutil e quase sempre esquecido: um bloco que rola sem foco é intransponível para
    // quem não usa mouse — as colunas da direita simplesmente não existem.
    renderTabela()
    const regiao = screen.getByRole('region', { name: 'Clientes' })
    expect(regiao).toHaveAttribute('tabindex', '0')
  })

  test('sem rótulo, a região ainda tem nome (região anônima some do menu do leitor)', () => {
    render(<Tabela colunas={colunas} linhas={clientes} chaveLinha={(l) => l.id} />)
    expect(screen.getByRole('region', { name: 'Tabela' })).toBeInTheDocument()
  })
})

describe('Tabela — números', () => {
  test('coluna numérica alinha à direita', () => {
    // Alinhado à direita + tabular-nums é o que faz a casa decimal cair sempre na mesma
    // coluna vertical; sem isso, comparar dinheiro é adivinhação.
    renderTabela()
    const celula = screen.getByText('R$ 8888.88')
    expect(celula).toHaveClass('amb-tabela__celula--direita')
    expect(celula).toHaveClass('amb-tabela__celula--num')
  })

  test('o cabeçalho da coluna numérica acompanha o alinhamento', () => {
    renderTabela()
    expect(screen.getByRole('columnheader', { name: /valor/i })).toHaveClass('amb-tabela__celula--direita')
  })

  test('`alinhar` explícito vence o padrão de `numerico`', () => {
    render(
      <Tabela
        colunas={[{ chave: 'valor', titulo: 'Valor', numerico: true, alinhar: 'centro' }]}
        linhas={[clientes[0]]}
        chaveLinha={(l) => l.id}
      />,
    )
    expect(screen.getByRole('rowheader', { name: '8888.88' })).toHaveClass('amb-tabela__celula--centro')
  })
})

describe('Tabela — chaveLinha', () => {
  test('reordenar redesenha as linhas na ordem nova', () => {
    const { rerender } = renderTabela()
    const invertido = [...clientes].reverse()
    rerender(<Tabela rotulo="Clientes" colunas={colunas} linhas={invertido} chaveLinha={(l) => l.id} />)

    expect(screen.getAllByRole('rowheader').map((l) => l.textContent)).toEqual([
      'Carla Dias',
      'Bruno Lima',
      'Ana Souza',
    ])
  })

  test('a identidade viaja com o REGISTRO, não com a posição', async () => {
    // Este é o teste que justifica o `chaveLinha` obrigatório — e ele só morde com
    // estado NÃO controlado, que vive só no DOM (texto digitado, checkbox marcado,
    // foco). Um teste que confira apenas a ordem do texto passa com índice como key e
    // não protege nada: o React reescreve o conteúdo de qualquer jeito.
    const comNota: Coluna<Cliente>[] = [
      { chave: 'nome', titulo: 'Cliente' },
      { chave: 'nota', titulo: 'Nota', render: (l) => <input defaultValue="" aria-label={`Nota de ${l.nome}`} /> },
    ]

    const { rerender } = render(<Tabela colunas={comNota} linhas={clientes} chaveLinha={(l) => l.id} />)
    await userEvent.type(screen.getByLabelText('Nota de Ana Souza'), 'importante')

    rerender(<Tabela colunas={comNota} linhas={[...clientes].reverse()} chaveLinha={(l) => l.id} />)

    // Com índice como key, o React reaproveita o <input> que já estava na posição 1 e o
    // texto fica preso lá — agora sob o nome de outro cliente. Foi assim que gente
    // ordenou a lista e apagou o registro errado.
    expect(screen.getByLabelText('Nota de Ana Souza')).toHaveValue('importante')
    expect(screen.getByLabelText('Nota de Carla Dias')).toHaveValue('')
  })
})

// ── Largura de coluna ───────────────────────────────────────────────────────
// Nasceu de um atrito real: montando a tela de clientes da documentação, seis colunas
// pediram 899px num card de 674 e a tabela abria já rolada de lado. Sem esta prop, a
// única saída foi CORTAR coluna — decisão de produto tomada por falta de uma prop.
describe('Tabela — largura de coluna', () => {
  const linhas = [{ id: 1, nome: 'Ana Souza', valor: 8888 }]

  test('a largura vira <colgroup>, não style no <th>', () => {
    const { container } = render(
      <Tabela
        rotulo="Clientes"
        colunas={[
          { chave: 'nome', titulo: 'Cliente' },
          { chave: 'valor', titulo: 'Valor', numerico: true, largura: '110px' },
        ]}
        linhas={linhas}
        chaveLinha={l => l.id}
      />,
    )
    // <colgroup> vale para a coluna inteira antes de qualquer linha existir. Largura no
    // <th> é só uma sugestão que o navegador descarta quando o corpo é mais largo.
    const cols = container.querySelectorAll('colgroup col')
    expect(cols).toHaveLength(2)
    expect(cols[1]).toHaveStyle({ width: '110px' })
  })

  test('sem nenhuma largura pedida, não há colgroup', () => {
    // Marcação que não faz nada é ruído para quem for ler isto depois.
    const { container } = render(
      <Tabela
        rotulo="Clientes"
        colunas={[{ chave: 'nome', titulo: 'Cliente' }]}
        linhas={linhas}
        chaveLinha={l => l.id}
      />,
    )
    expect(container.querySelector('colgroup')).toBeNull()
  })

  test('com seleção, o <col> da caixa entra antes — senão as larguras deslizam', () => {
    // A coluna do checkbox é uma coluna de verdade na tabela. Esquecê-la no colgroup faz
    // cada <col> valer para a coluna seguinte, e a largura pedida para "Valor" cai em
    // "Cliente". Erro silencioso: a tabela renderiza, só fica errada.
    const { container } = render(
      <Tabela
        rotulo="Clientes"
        selecionaveis
        selecionadas={[]}
        onSelecionar={() => {}}
        colunas={[
          { chave: 'nome', titulo: 'Cliente' },
          { chave: 'valor', titulo: 'Valor', largura: '110px' },
        ]}
        linhas={linhas}
        chaveLinha={l => l.id}
      />,
    )
    const cols = container.querySelectorAll('colgroup col')
    expect(cols).toHaveLength(3)
    expect(cols[2]).toHaveStyle({ width: '110px' })
  })
})
