import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Paginacao, janelaPaginas, type ItemPagina } from './Paginacao'

/**
 * A tabela de casos. É aqui que a paginação quebra na vida real — a régua de botões em volta
 * é enfeite perto disto.
 */
const casos: Array<[string, number, number, ItemPagina[]]> = [
  // nome, página atual, total, esperado
  ['uma página só: nada de "…"', 1, 1, [1]],
  ['duas páginas, na primeira', 1, 2, [1, 2]],
  ['duas páginas, na última', 2, 2, [1, 2]],
  ['três páginas cabem inteiras', 2, 3, [1, 2, 3]],
  ['cinco páginas, no meio: cabem todas', 3, 5, [1, 2, 3, 4, 5]],
  ['sete páginas, no meio: ainda cabem todas', 4, 7, [1, 2, 3, 4, 5, 6, 7]],
  ['começo: colapsa só à direita', 1, 10, [1, 2, 'elipse-fim', 10]],
  ['segunda página', 2, 10, [1, 2, 3, 'elipse-fim', 10]],
  ['meio: colapsa dos dois lados', 5, 10, [1, 'elipse-inicio', 4, 5, 6, 'elipse-fim', 10]],
  ['fim: colapsa só à esquerda', 10, 10, [1, 'elipse-inicio', 9, 10]],
  ['penúltima', 9, 10, [1, 'elipse-inicio', 8, 9, 10]],
  ['total enorme, no meio', 50, 100, [1, 'elipse-inicio', 49, 50, 51, 'elipse-fim', 100]],
  ['total enorme, no começo', 1, 100, [1, 2, 'elipse-fim', 100]],
  ['total enorme, no fim', 100, 100, [1, 'elipse-inicio', 99, 100]],

  // ── Entrada suja: isto vem de `?page=` na URL, que é texto que qualquer um digita ──
  ['total 0: lista vazia (não existe "página 1 de 0")', 1, 0, []],
  ['total negativo', 1, -5, []],
  ['página 0 prende em 1', 0, 10, [1, 2, 'elipse-fim', 10]],
  ['página negativa prende em 1', -3, 10, [1, 2, 'elipse-fim', 10]],
  ['página acima do total prende na última', 999, 10, [1, 'elipse-inicio', 9, 10]],
  ['página NaN não explode', NaN, 10, [1, 2, 'elipse-fim', 10]],
  ['página quebrada é truncada', 3.7, 10, [1, 2, 3, 4, 'elipse-fim', 10]],
]

describe('janelaPaginas — a lógica das reticências', () => {
  test.each(casos)('%s', (_nome, pagina, total, esperado) => {
    expect(janelaPaginas(pagina, total)).toEqual(esperado)
  })

  test('NUNCA troca UMA página por "…" — à esquerda', () => {
    // Na página 4 de 10, o buraco à esquerda é só a página 2. O "…" ocuparia o mesmo espaço
    // do número e ainda esconderia para onde ele leva.
    const janela = janelaPaginas(4, 10)
    expect(janela).toEqual([1, 2, 3, 4, 5, 'elipse-fim', 10])
    expect(janela).not.toContain('elipse-inicio')
  })

  test('NUNCA troca UMA página por "…" — à direita', () => {
    const janela = janelaPaginas(7, 10)
    expect(janela).toEqual([1, 'elipse-inicio', 6, 7, 8, 9, 10])
    expect(janela).not.toContain('elipse-fim')
  })

  test('colapsa quando o buraco tem DUAS páginas ou mais', () => {
    // Página 5 de 10: à esquerda faltam 2 e 3 — aí o "…" ganha.
    expect(janelaPaginas(5, 10)).toContain('elipse-inicio')
  })

  test('raio maior alarga a janela', () => {
    expect(janelaPaginas(50, 100, 2)).toEqual([
      1,
      'elipse-inicio',
      48,
      49,
      50,
      51,
      52,
      'elipse-fim',
      100,
    ])
  })

  test('a primeira e a última SEMPRE aparecem — são as âncoras do começo e do fim', () => {
    for (let total = 1; total <= 40; total++) {
      for (let p = 1; p <= total; p++) {
        const janela = janelaPaginas(p, total)
        expect(janela[0]).toBe(1)
        expect(janela[janela.length - 1]).toBe(total)
      }
    }
  })

  test('a atual sempre está na janela (senão a pessoa não vê onde está)', () => {
    for (let total = 1; total <= 40; total++) {
      for (let p = 1; p <= total; p++) {
        expect(janelaPaginas(p, total)).toContain(p)
      }
    }
  })

  test('nunca repete página, nunca sai de ordem, nunca põe dois "…" colados', () => {
    for (let total = 1; total <= 60; total++) {
      for (let p = 1; p <= total; p++) {
        const janela = janelaPaginas(p, total)
        const numeros = janela.filter((i): i is number => typeof i === 'number')

        expect(new Set(numeros).size).toBe(numeros.length)
        expect([...numeros].sort((a, b) => a - b)).toEqual(numeros)

        janela.forEach((item, i) => {
          if (typeof item === 'string') expect(typeof janela[i + 1]).toBe('number')
        })
      }
    }
  })
})

describe('Paginação — rótulos acessíveis', () => {
  test('os botões dizem para onde levam — não só o número solto', () => {
    render(<Paginacao pagina={5} totalPaginas={10} onChange={() => {}} />)
    // Um leitor de tela lendo "botão 4, botão 5, botão 6" não diz nada a ninguém.
    expect(screen.getByRole('button', { name: 'Ir para a página 4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir para a página 6' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeInTheDocument()
  })

  test('a página atual tem aria-current="page"', () => {
    render(<Paginacao pagina={3} totalPaginas={10} onChange={() => {}} />)
    const atual = screen.getByRole('button', { name: 'Página 3' })
    expect(atual).toHaveAttribute('aria-current', 'page')
  })

  test('só UM botão é a página atual', () => {
    const { container } = render(<Paginacao pagina={3} totalPaginas={10} onChange={() => {}} />)
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  })

  test('é uma <nav> nomeada', () => {
    render(<Paginacao pagina={1} totalPaginas={5} onChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
  })

  test('as reticências são aria-hidden — "reticências" narrado não informa nada', () => {
    const { container } = render(<Paginacao pagina={5} totalPaginas={20} onChange={() => {}} />)
    const elipses = container.querySelectorAll('.amb-pag__elipse')
    expect(elipses.length).toBe(2)
    elipses.forEach(e => expect(e).toHaveAttribute('aria-hidden', 'true'))
  })

  test('anuncia a mudança para o leitor de tela', () => {
    // A tabela muda longe daqui: sem esta região viva, a pessoa clica em "Próxima" e não
    // ouve nada acontecer.
    render(<Paginacao pagina={3} totalPaginas={10} onChange={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('Página 3 de 10')
  })
})

describe('Paginação — navegação', () => {
  test('clicar num número navega', async () => {
    const onChange = vi.fn()
    render(<Paginacao pagina={1} totalPaginas={10} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ir para a página 2' }))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  test('clicar na página ATUAL não dispara nada', async () => {
    const onChange = vi.fn()
    render(<Paginacao pagina={3} totalPaginas={10} onChange={onChange} />)

    // Sem o guarda, cada clique repetiria a mesma busca no servidor.
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('anterior e próxima andam de um em um', async () => {
    const onChange = vi.fn()
    render(<Paginacao pagina={5} totalPaginas={10} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(onChange).toHaveBeenLastCalledWith(6)

    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(onChange).toHaveBeenLastCalledWith(4)
  })

  test('na primeira página, "anterior" fica desabilitado', () => {
    render(<Paginacao pagina={1} totalPaginas={10} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeEnabled()
  })

  test('na última, "próxima" fica desabilitado', () => {
    render(<Paginacao pagina={10} totalPaginas={10} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })

  test('página fora da faixa não vira botão para o nada', async () => {
    const onChange = vi.fn()
    render(<Paginacao pagina={999} totalPaginas={10} onChange={onChange} />)

    // `?page=999` colado no navegador: trata como a última, não como um estado impossível.
    expect(screen.getByRole('status')).toHaveTextContent('Página 10 de 10')
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })
})

describe('Paginação — resumo e itens por página', () => {
  test('mostra a faixa de registros', () => {
    render(
      <Paginacao pagina={1} totalPaginas={7} onChange={() => {}} totalItens={137} porPagina={20} />,
    )
    expect(screen.getByText('1–20 de 137')).toBeInTheDocument()
  })

  test('a última página não inventa registros além do total', () => {
    render(
      <Paginacao pagina={7} totalPaginas={7} onChange={() => {}} totalItens={137} porPagina={20} />,
    )
    // 7 × 20 = 140, mas só existem 137. "121–140 de 137" é uma conta que mente.
    expect(screen.getByText('121–137 de 137')).toBeInTheDocument()
  })

  test('lista vazia diz que está vazia, em vez de "1–0 de 0"', () => {
    render(
      <Paginacao pagina={1} totalPaginas={0} onChange={() => {}} totalItens={0} porPagina={20} />,
    )
    expect(screen.getByText('Nenhum item')).toBeInTheDocument()
  })

  test('número grande sai formatado em pt-BR', () => {
    render(
      <Paginacao
        pagina={1}
        totalPaginas={100}
        onChange={() => {}}
        totalItens={12345}
        porPagina={20}
      />,
    )
    expect(screen.getByText('1–20 de 12.345')).toBeInTheDocument()
  })

  test('o seletor tem rótulo VISÍVEL (não só aria-label)', async () => {
    const onPorPagina = vi.fn()
    render(
      <Paginacao
        pagina={1}
        totalPaginas={7}
        onChange={() => {}}
        porPagina={20}
        onPorPaginaChange={onPorPagina}
      />,
    )

    // Quem enxerga também precisa saber o que é o "20" solto no canto.
    const select = screen.getByLabelText('Por página')
    await userEvent.selectOptions(select, '50')
    expect(onPorPagina).toHaveBeenCalledWith(50)
  })

  test('um porPagina fora da lista padrão entra na lista, em vez de o select mentir', () => {
    render(
      <Paginacao
        pagina={1}
        totalPaginas={7}
        onChange={() => {}}
        porPagina={25}
        onPorPaginaChange={() => {}}
      />,
    )
    // Um <select> cujo value não existe entre as options mostra a primeira e mente.
    expect(screen.getByLabelText('Por página')).toHaveValue('25')
    expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument()
  })
})

describe('Paginação — quando some', () => {
  test('sem nada para mostrar, não renderiza', () => {
    const { container } = render(<Paginacao pagina={1} totalPaginas={1} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('com uma página só, os botões somem mas o resumo fica', () => {
    // A linha inteira sumindo faz a tabela pular de altura toda vez que um filtro reduz o
    // resultado a uma página.
    render(
      <Paginacao pagina={1} totalPaginas={1} onChange={() => {}} totalItens={8} porPagina={20} />,
    )
    expect(screen.getByText('1–8 de 8')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Próxima página' })).not.toBeInTheDocument()
  })

  test.each(['sm', 'md'] as const)('tamanho %s', s => {
    render(<Paginacao pagina={1} totalPaginas={5} onChange={() => {}} size={s} />)
    expect(screen.getByRole('button', { name: 'Ir para a página 2' })).toHaveClass(`amb-btn--${s}`)
  })
})
