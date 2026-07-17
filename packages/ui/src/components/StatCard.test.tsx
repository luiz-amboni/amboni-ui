import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatCard } from './StatCard'

describe('StatCard — os três estados', () => {
  test('com valor: mostra rótulo, número e apoio', () => {
    render(<StatCard label="Investido" value="R$ 1.994,31" sub="159.111 exibições" />)
    expect(screen.getByText('Investido')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.994,31')).toBeInTheDocument()
    expect(screen.getByText('159.111 exibições')).toBeInTheDocument()
  })

  test('carregando: esqueleto anunciado ao leitor de tela, sem número falso', () => {
    render(<StatCard label="Investido" value={null} />)
    // Sem role/aria-label, quem usa leitor de tela ouve um card vazio e não sabe se
    // está carregando ou se deu erro.
    expect(screen.getByRole('status', { name: /investido: carregando/i })).toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  test('vazio: explica o motivo em vez de deixar um traço mudo', () => {
    render(<StatCard label="Retorno (ROAS)" value="—" emptyReason="precisa de vendas atribuídas" />)
    expect(screen.getByText('precisa de vendas atribuídas')).toBeInTheDocument()
  })

  test('vazio esconde o `sub` — quem manda é o motivo', () => {
    render(<StatCard label="X" value="—" sub="não deveria aparecer" emptyReason="o motivo" />)
    expect(screen.getByText('o motivo')).toBeInTheDocument()
    expect(screen.queryByText('não deveria aparecer')).not.toBeInTheDocument()
  })

  test('string vazia conta como vazio', () => {
    render(<StatCard label="X" value="" emptyReason="sem dados" />)
    expect(screen.getByText('sem dados')).toBeInTheDocument()
  })
})

describe('StatCard — variação (delta)', () => {
  test('a cor NUNCA é o único sinal: texto e seta também dizem', () => {
    const { container } = render(
      <StatCard label="Custo" value="R$ 14,25" delta={{ percent: 46, betterWhenUp: false }} />,
    )
    // Quem não distingue vermelho de verde precisa entender do mesmo jeito.
    expect(screen.getByText('46%')).toBeInTheDocument()
    expect(screen.getByText('vs. anterior')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeTruthy()
  })

  test('custo subindo é RUIM (betterWhenUp=false)', () => {
    const { container } = render(
      <StatCard label="Custo" value="R$ 14,25" delta={{ percent: 46, betterWhenUp: false }} />,
    )
    expect(container.querySelector('.amb-stat__delta--bad')).toBeTruthy()
  })

  test('pessoas subindo é BOM (betterWhenUp=true)', () => {
    const { container } = render(
      <StatCard label="Pessoas" value="140" delta={{ percent: 20, betterWhenUp: true }} />,
    )
    expect(container.querySelector('.amb-stat__delta--good')).toBeTruthy()
  })

  test('custo CAINDO é bom — a mesma prop, invertida', () => {
    const { container } = render(
      <StatCard label="Custo" value="R$ 9,00" delta={{ percent: -23, betterWhenUp: false }} />,
    )
    expect(container.querySelector('.amb-stat__delta--good')).toBeTruthy()
  })

  test('SEM betterWhenUp = sem julgamento (fica neutro)', () => {
    // Gastar menos não é bom nem ruim por si só. Pintar de verde mentiria.
    const { container } = render(
      <StatCard label="Investido" value="R$ 1.994" delta={{ percent: -23 }} />,
    )
    expect(container.querySelector('.amb-stat__delta--neutral')).toBeTruthy()
    expect(container.querySelector('.amb-stat__delta--good')).toBeFalsy()
  })

  test('variação menor que 1% é "estável", não "0%"', () => {
    render(<StatCard label="X" value="10" delta={{ percent: 0.4, betterWhenUp: true }} />)
    expect(screen.getByText('estável')).toBeInTheDocument()
  })

  test('não mostra variação quando o valor está vazio (comparar com o quê?)', () => {
    render(<StatCard label="X" value="—" delta={{ percent: 50, betterWhenUp: true }} emptyReason="sem dados" />)
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })
})
