import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EstadoVazio } from './EstadoVazio'
import { Button } from './Button'

describe('EstadoVazio — diz o que aconteceu, por quê, e o que fazer', () => {
  test('mostra título, descrição e ação', () => {
    render(
      <EstadoVazio
        titulo="Nenhum cliente com esse filtro"
        descricao="Nenhum cliente comprou nos últimos 7 dias."
        acao={<Button>Limpar filtros</Button>}
      />,
    )
    expect(screen.getByText('Nenhum cliente com esse filtro')).toBeInTheDocument()
    expect(screen.getByText('Nenhum cliente comprou nos últimos 7 dias.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument()
  })

  test('o título NÃO é um heading — não inventa seção no índice da página', () => {
    // Este componente vive dentro de tabela e de card. Um <h3> aqui entraria na lista
    // de títulos que o leitor de tela usa para navegar, e "Nenhum resultado" viraria
    // uma seção do documento.
    render(<EstadoVazio titulo="Nenhuma campanha ainda" />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('Nenhuma campanha ainda')).toBeInTheDocument()
  })

  test('o ícone é decorativo — quem informa é o texto', () => {
    const { container } = render(<EstadoVazio icone={<svg data-testid="i" />} titulo="Vazio" />)
    // Ícone anunciado pelo leitor de tela só acrescenta ruído antes da frase que importa.
    expect(container.querySelector('.amb-vazio__icone')).toHaveAttribute('aria-hidden', 'true')
  })

  test('a ação funciona', async () => {
    const criar = vi.fn()
    render(<EstadoVazio titulo="Nenhuma campanha ainda" acao={<Button onClick={criar}>Criar campanha</Button>} />)
    await userEvent.click(screen.getByRole('button', { name: 'Criar campanha' }))
    expect(criar).toHaveBeenCalled()
  })

  test('só o título é obrigatório: sem descrição/ação, nada de caixa vazia sobrando', () => {
    const { container } = render(<EstadoVazio titulo="Vazio" />)
    expect(container.querySelector('.amb-vazio__descricao')).toBeNull()
    expect(container.querySelector('.amb-vazio__acao')).toBeNull()
    expect(container.querySelector('.amb-vazio__icone')).toBeNull()
  })

  test.each(['sm', 'md', 'lg'] as const)('tamanho %s', (size) => {
    const { container } = render(<EstadoVazio titulo="Vazio" size={size} />)
    expect(container.querySelector(`.amb-vazio--${size}`)).toBeTruthy()
  })

  test('o padrão é `md` (dentro de card, o caso mais comum)', () => {
    const { container } = render(<EstadoVazio titulo="Vazio" />)
    expect(container.querySelector('.amb-vazio--md')).toBeTruthy()
  })
})
