import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Trilha, ItemTrilha } from './Trilha'

function Caminho({ max }: { max?: number }) {
  return (
    <Trilha max={max}>
      <ItemTrilha href="/">Início</ItemTrilha>
      <ItemTrilha href="/clientes">Clientes</ItemTrilha>
      <ItemTrilha href="/clientes/sc">Santa Catarina</ItemTrilha>
      <ItemTrilha href="/clientes/sc/criciuma">Criciúma</ItemTrilha>
      <ItemTrilha>Maria Silva</ItemTrilha>
    </Trilha>
  )
}

describe('Trilha — semântica', () => {
  test('é uma <nav> nomeada — leitor de tela pula direto para ela', () => {
    render(<Caminho />)
    expect(screen.getByRole('navigation', { name: 'Trilha' })).toBeInTheDocument()
  })

  test('a ordem é informação: usa lista ordenada', () => {
    const { container } = render(<Caminho />)
    expect(container.querySelector('ol')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })

  test('o rótulo da nav é sobrescrevível (duas navs com o mesmo nome não distinguem nada)', () => {
    render(
      <Trilha aria-label="Onde você está">
        <ItemTrilha>Aqui</ItemTrilha>
      </Trilha>,
    )
    expect(screen.getByRole('navigation', { name: 'Onde você está' })).toBeInTheDocument()
  })
})

describe('Trilha — o item atual', () => {
  test('tem aria-current="page" e NÃO é link', () => {
    render(<Caminho />)
    // Não se navega para onde já se está: o clique recarregaria a mesma tela e, no teclado,
    // seria mais uma parada que não leva a lugar nenhum.
    expect(screen.getByText('Maria Silva').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.queryByRole('link', { name: 'Maria Silva' })).not.toBeInTheDocument()
  })

  test('o último item ignora o href — continua não sendo link', () => {
    render(
      <Trilha>
        <ItemTrilha href="/">Início</ItemTrilha>
        <ItemTrilha href="/aqui">Aqui</ItemTrilha>
      </Trilha>,
    )
    expect(screen.queryByRole('link', { name: 'Aqui' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument()
  })

  test('só os itens anteriores viram link', () => {
    render(<Caminho />)
    expect(screen.getAllByRole('link')).toHaveLength(4)
  })
})

describe('Trilha — separador', () => {
  test('é decorativo: aria-hidden, senão o leitor lê "barra" entre cada item', () => {
    const { container } = render(<Caminho />)
    const seps = container.querySelectorAll('.amb-trilha__sep')
    expect(seps.length).toBeGreaterThan(0)
    seps.forEach(s => expect(s).toHaveAttribute('aria-hidden', 'true'))
  })

  test('o último item não tem separador solto na ponta', () => {
    const { container } = render(<Caminho />)
    // 5 itens = 4 separadores. Um a mais e a trilha termina em "Maria Silva /".
    expect(container.querySelectorAll('.amb-trilha__sep')).toHaveLength(4)
  })
})

describe('Trilha — colapso do meio (max)', () => {
  test('sem max, mostra tudo', () => {
    render(<Caminho />)
    expect(screen.getByText('Santa Catarina')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('colapsa o meio mantendo a origem e o lugar atual', () => {
    render(<Caminho max={3} />)
    // 5 itens, max 3 → Início / … / Criciúma / Maria Silva
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Criciúma')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument()
    expect(screen.queryByText('Santa Catarina')).not.toBeInTheDocument()
  })

  test('o "…" é um botão que expande, não um beco sem saída', async () => {
    render(<Caminho max={3} />)

    // Um "…" morto anuncia que existe caminho escondido e não deixa chegar nele.
    await userEvent.click(screen.getByRole('button', { name: /mostrar 2 itens ocultos/i }))

    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Santa Catarina')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('o botão de expandir tem rótulo acessível (um "…" narrado não diz nada)', () => {
    render(<Caminho max={3} />)
    expect(screen.getByRole('button', { name: /mostrar 2 itens ocultos do caminho/i })).toBeInTheDocument()
  })

  test('NUNCA troca um único item por "…" — ocupa o mesmo espaço e entrega menos', () => {
    // 5 itens com max=4 esconderia exatamente 1. Mostra os 5.
    render(<Caminho max={4} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })

  test('max maior que o total não colapsa nada', () => {
    render(<Caminho max={10} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('max=1 é tratado como 2 — origem e destino são o mínimo de uma trilha', () => {
    render(<Caminho max={1} />)
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
  })

  test('depois de expandir, o item atual continua sendo o último (e não vira link)', async () => {
    render(<Caminho max={3} />)
    await userEvent.click(screen.getByRole('button', { name: /mostrar/i }))
    expect(screen.queryByRole('link', { name: 'Maria Silva' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(4)
  })
})

describe('ItemTrilha — formas', () => {
  test('com href vira <a> de verdade (abre em nova aba, o router não engole)', () => {
    render(
      <Trilha>
        <ItemTrilha href="/clientes">Clientes</ItemTrilha>
        <ItemTrilha>Atual</ItemTrilha>
      </Trilha>,
    )
    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('href', '/clientes')
  })

  test('só com onClick vira <button> — não um <a href="#"> mentiroso', async () => {
    const ir = vi.fn()
    render(
      <Trilha>
        <ItemTrilha onClick={ir}>Clientes</ItemTrilha>
        <ItemTrilha>Atual</ItemTrilha>
      </Trilha>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Clientes' }))
    expect(ir).toHaveBeenCalledTimes(1)
  })

  test('sem href e sem onClick é só texto — nada de link falso', () => {
    render(
      <Trilha>
        <ItemTrilha>Rascunho</ItemTrilha>
        <ItemTrilha>Atual</ItemTrilha>
      </Trilha>,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
  })

  test('o ícone é decorativo — quem narra é o texto', () => {
    render(
      <Trilha>
        <ItemTrilha href="/" icone={<svg data-testid="casa" />}>
          Início
        </ItemTrilha>
        <ItemTrilha>Atual</ItemTrilha>
      </Trilha>,
    )
    expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument()
    expect(screen.getByTestId('casa').parentElement).toHaveAttribute('aria-hidden', 'true')
  })
})
