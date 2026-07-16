import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progresso } from './Progresso'

describe('Progresso — determinado', () => {
  test('anuncia os três valores', () => {
    render(<Progresso valor={42} max={100} rotulo="Sincronizando" />)
    const barra = screen.getByRole('progressbar')
    // Os três juntos: sem valuemin/valuemax o leitor de tela não sabe converter 42 em
    // "42 por cento" — 42 de 400 é outra história.
    expect(barra).toHaveAttribute('aria-valuenow', '42')
    expect(barra).toHaveAttribute('aria-valuemin', '0')
    expect(barra).toHaveAttribute('aria-valuemax', '100')
  })

  test('o rótulo visível é o nome acessível da barra', () => {
    render(<Progresso valor={42} rotulo="Sincronizando pedidos" />)
    // Uma barra sem nome é anunciada como "barra de progresso, 42%" — 42% de quê?
    expect(screen.getByRole('progressbar', { name: 'Sincronizando pedidos' })).toBeInTheDocument()
  })

  test('sem rótulo, cai num nome genérico em vez de ficar anônima', () => {
    render(<Progresso valor={10} />)
    expect(screen.getByRole('progressbar', { name: 'Progresso' })).toBeInTheDocument()
  })

  test('mostrarValor exibe a porcentagem', () => {
    render(<Progresso valor={30} max={120} mostrarValor />)
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  test('max diferente de 100 é respeitado na conta e no ARIA', () => {
    const { container } = render(<Progresso valor={25} max={50} mostrarValor />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '50')
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(container.querySelector<HTMLElement>('.amb-progresso__barra')?.style.width).toBe('50%')
  })

  test.each(['brand', 'success', 'warning', 'danger'] as const)('tom %s', tom => {
    const { container } = render(<Progresso valor={10} tom={tom} />)
    expect(container.querySelector(`.amb-progresso__barra--${tom}`)).toBeTruthy()
  })
})

describe('Progresso — indeterminado: ausente ≠ zero', () => {
  test('indeterminado OMITE aria-valuenow', () => {
    render(<Progresso indeterminado rotulo="Consultando o Bling" />)
    const barra = screen.getByRole('progressbar')
    // O erro clássico é mandar aria-valuenow={0} porque "o atributo tem que estar lá".
    // Só que 0 significa "parado no começo" — a pessoa fica esperando um número que
    // nunca vem. AUSENTE significa "está indo, ninguém sabe quanto falta", que é a
    // verdade. São coisas diferentes na norma ARIA e no leitor de tela.
    expect(barra).not.toHaveAttribute('aria-valuenow')
    // Os limites continuam: quem some é só o "quanto já foi".
    expect(barra).toHaveAttribute('aria-valuemin', '0')
    expect(barra).toHaveAttribute('aria-valuemax', '100')
  })

  test('indeterminado não mostra número nem com mostrarValor', () => {
    // Barra indeterminada com "0%" ao lado é mentira com cara de precisão.
    render(<Progresso indeterminado mostrarValor rotulo="Consultando" />)
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
  })

  test('indeterminado ignora o valor recebido', () => {
    render(<Progresso indeterminado valor={80} />)
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
  })

  test('a barra indeterminada não tem largura inline (quem manda é o keyframe)', () => {
    const { container } = render(<Progresso indeterminado />)
    const barra = container.querySelector<HTMLElement>('.amb-progresso__barra')
    expect(barra).toHaveClass('amb-progresso__barra--indeterminada')
    expect(barra?.style.width).toBe('')
  })
})

describe('Progresso — valor fora da faixa', () => {
  // Progresso vem de conta feita em produção (enviados/total). Produção manda lixo:
  // contador que decrementa, soma errada, total zero. Nada disso pode virar barra
  // estourando o trilho nem aria-valuenow="NaN".

  test('negativo vira 0', () => {
    const { container } = render(<Progresso valor={-30} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(container.querySelector<HTMLElement>('.amb-progresso__barra')?.style.width).toBe('0%')
  })

  test('acima do max vira max (a barra não vaza para fora do trilho)', () => {
    const { container } = render(<Progresso valor={150} max={100} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(container.querySelector<HTMLElement>('.amb-progresso__barra')?.style.width).toBe('100%')
  })

  test('NaN vira 0 — nunca aria-valuenow="NaN"', () => {
    // NaN sai de `0/0` sem ninguém perceber. O leitor de tela leria um atributo inválido.
    render(<Progresso valor={NaN} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  test('Infinity vira max', () => {
    render(<Progresso valor={Infinity} max={100} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  test('max=0 volta ao padrão 100 em vez de dividir por zero', () => {
    // Divisão por zero daria width: Infinity% e a barra sumiria sem ninguém entender.
    const { container } = render(<Progresso valor={10} max={0} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
    expect(container.querySelector<HTMLElement>('.amb-progresso__barra')?.style.width).toBe('10%')
  })

  test('max negativo também volta ao padrão', () => {
    render(<Progresso valor={10} max={-50} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
  })
})
