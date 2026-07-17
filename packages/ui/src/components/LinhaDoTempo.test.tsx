import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { LinhaDoTempo, type ItemLinhaDoTempo } from './LinhaDoTempo'

afterEach(() => {
  vi.restoreAllMocks()
})

const itens: ItemLinhaDoTempo[] = [
  { id: 1, titulo: 'Pedido criado', data: '2026-07-14T09:00:00-03:00', tom: 'marca' },
  { id: 2, titulo: 'Mensagem entregue', descricao: 'D+3', data: '2026-07-16T14:33:00-03:00', tom: 'sucesso' },
  { id: 3, titulo: 'Envio falhou', data: '2026-07-16T14:35:00-03:00', tom: 'perigo' },
]

describe('LinhaDoTempo — é uma lista, não um monte de div', () => {
  test('<ol> com um <li> por evento', () => {
    // A armadilha: divs entregam texto solto. "Mensagem entregue 14:33 Envio falhou 14:35"
    // chega sem fronteira nenhuma entre um evento e o outro. Com <ol>, o leitor de tela
    // anuncia "lista de 3 itens" e a posição de cada um — e dá para pular a lista inteira.
    const { container } = render(<LinhaDoTempo itens={itens} />)

    const lista = screen.getByRole('list')
    expect(lista.tagName).toBe('OL')
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3)
    expect(container.querySelector('ol > li')).toBeTruthy()
  })

  test('a ordem do DOM é a ordem do array — a ordem É a informação', () => {
    render(<LinhaDoTempo itens={itens} />)
    const titulos = screen.getAllByRole('listitem').map(li => li.textContent)
    expect(titulos[0]).toContain('Pedido criado')
    expect(titulos[2]).toContain('Envio falhou')
  })
})

describe('LinhaDoTempo — o eixo é decoração', () => {
  test('pontinho e linha ficam fora da árvore de acessibilidade', () => {
    // Sem aria-hidden, cada evento vem com um ruído a reboque: o "!" do tom aviso seria
    // lido como "exclamação" no meio do histórico, e a linha vira "gráfico".
    const { container } = render(<LinhaDoTempo itens={itens} />)
    const eixos = container.querySelectorAll('.amb-linha-tempo__eixo')
    expect(eixos).toHaveLength(3)
    eixos.forEach(eixo => expect(eixo).toHaveAttribute('aria-hidden', 'true'))
  })

  test('o último evento não tem linha pendurada embaixo', () => {
    // Um traço saindo do último pontinho promete que vem mais coisa — e não vem.
    const { container } = render(<LinhaDoTempo itens={itens} />)
    expect(container.querySelectorAll('.amb-linha-tempo__linha')).toHaveLength(2)
  })

  test('o ícone do produto também é decorativo', () => {
    render(<LinhaDoTempo itens={[{ id: 1, titulo: 'Nota emitida', data: '2026-07-16', icone: <svg data-testid="ico" /> }]} />)
    expect(screen.getByTestId('ico').closest('[aria-hidden="true"]')).toBeTruthy()
  })
})

describe('LinhaDoTempo — cor nunca sozinha', () => {
  test('cada tom tem uma FORMA própria, não só uma cor', () => {
    // O invariante da casa. 1 em cada 12 homens não separa verde de vermelho: sem forma,
    // "entregue" e "falhou" seriam dois pontinhos cinzas idênticos.
    const tons = ['neutro', 'marca', 'sucesso', 'aviso', 'perigo', 'info'] as const
    const { container } = render(
      <LinhaDoTempo itens={tons.map((tom, i) => ({ id: i, titulo: tom, data: '2026-07-16', tom }))} />,
    )
    const formas = [...container.querySelectorAll('.amb-linha-tempo__ponto')].map(p =>
      p.getAttribute('data-amb-forma'),
    )
    // Seis tons, seis formas distintas — nenhuma repetida.
    expect(new Set(formas).size).toBe(tons.length)
  })
})

describe('LinhaDoTempo — a data', () => {
  test('<time dateTime> com o formato de máquina, texto legível no conteúdo', () => {
    // O atributo é o que faz o navegador, o leitor de tela e um raspador entenderem
    // "16 de jul." como uma data em vez de uma frase.
    const { container } = render(
      <LinhaDoTempo itens={[{ id: 1, titulo: 'Entregue', data: '2026-07-16T14:33:00-03:00' }]} />,
    )
    const time = container.querySelector('time')
    expect(time).toHaveAttribute('dateTime', '2026-07-16T14:33:00-03:00')
    expect(time?.textContent?.length).toBeGreaterThan(0)
  })

  test('data só-dia NÃO anda para trás por causa do fuso', () => {
    // A armadilha clássica: `new Date('2026-07-16')` é meia-noite em UTC, que no Brasil é
    // dia 15 às 21h — a linha do tempo mostra o dia anterior ao que o banco tem. Some
    // entre 21h e meia-noite e aparece o resto do dia, então sempre culpam o backend.
    const { container } = render(<LinhaDoTempo itens={[{ id: 1, titulo: 'Compra', data: '2026-07-16' }]} />)
    const time = container.querySelector('time')
    expect(time).toHaveAttribute('dateTime', '2026-07-16')
    expect(time?.textContent).toMatch(/16/)
    expect(time?.textContent).not.toMatch(/15/)
  })

  test('`dataTexto` manda no texto e o dateTime continua de máquina', () => {
    const { container } = render(
      <LinhaDoTempo itens={[{ id: 1, titulo: 'Entregue', data: '2026-07-16', dataTexto: 'há 3 dias' }]} />,
    )
    const time = container.querySelector('time')
    expect(time).toHaveTextContent('há 3 dias')
    expect(time).toHaveAttribute('dateTime', '2026-07-16')
  })

  test('data que o navegador não entende vira texto puro + aviso', () => {
    // <time dateTime="ontem"> é HTML inválido. Melhor perder o <time> e avisar quem
    // escreveu do que publicar um atributo que não quer dizer nada.
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<LinhaDoTempo itens={[{ id: 1, titulo: 'Evento', data: 'ontem' }]} />)

    expect(container.querySelector('time')).toBeNull()
    expect(screen.getByText('ontem')).toBeInTheDocument()
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('dateTime'))
  })
})

describe('LinhaDoTempo — variações', () => {
  test.each(['vertical', 'horizontal'] as const)('orientação %s', orientacao => {
    const { container } = render(<LinhaDoTempo itens={itens} orientacao={orientacao} />)
    expect(container.querySelector(`.amb-linha-tempo--${orientacao}`)).toBeTruthy()
  })

  test('compacta', () => {
    const { container } = render(<LinhaDoTempo itens={itens} compacta />)
    expect(container.querySelector('.amb-linha-tempo--compacta')).toBeTruthy()
  })

  test('lista vazia não quebra nem desenha lixo', () => {
    render(<LinhaDoTempo itens={[]} />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
