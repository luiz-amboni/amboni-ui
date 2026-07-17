import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card, CardHeader, CardBody, CardFooter } from './Card'

/**
 * Estes testes existiam — moravam dentro de `StatCard.test.tsx`, porque o StatCard usa o
 * Card por dentro e foi ali que eles nasceram.
 *
 * O problema não era cobertura, era ENDEREÇO: quem abrisse o `Card.tsx` para mexer não
 * tinha como saber que existia teste, e a suíte que protege o arquivo não roda ao filtrar
 * por `vitest Card`. Teste que não é encontrado por quem mexe no código protege menos do
 * que parece.
 */

describe('Card', () => {
  test('renderiza cabeçalho e corpo', () => {
    render(
      <Card>
        <CardHeader title="Campanhas" subtitle="ativas primeiro" />
        <CardBody>conteúdo</CardBody>
      </Card>,
    )
    expect(screen.getByText('Campanhas')).toBeInTheDocument()
    expect(screen.getByText('ativas primeiro')).toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  test('o título é um heading de verdade — leitor de tela navega por eles', () => {
    render(<Card><CardHeader title="Campanhas" /></Card>)
    expect(screen.getByRole('heading', { name: 'Campanhas', level: 3 })).toBeInTheDocument()
  })

  test('o nível do heading é configurável (nível pulado quebra o índice da página)', () => {
    render(<Card><CardHeader title="Seção" headingLevel={2} /></Card>)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  test('card clicável vira <button> — não uma div com onClick', () => {
    const clicar = vi.fn()
    render(<Card onCardClick={clicar}><CardBody>Ver detalhes</CardBody></Card>)
    // Uma <div onClick> não recebe foco, ignora Enter/Espaço e o leitor de tela não
    // anuncia que dá para clicar.
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  test('card clicável funciona no teclado', async () => {
    const clicar = vi.fn()
    render(<Card onCardClick={clicar}><CardBody>Ver</CardBody></Card>)

    const btn = screen.getByRole('button')
    btn.focus()
    await userEvent.keyboard('{Enter}')
    expect(clicar).toHaveBeenCalled()
  })

  test('card NÃO clicável não vira botão (não polui a navegação)', () => {
    render(<Card><CardBody>só leitura</CardBody></Card>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test.each(['flat', 'raised', 'floating'] as const)('elevação %s', e => {
    const { container } = render(<Card elevation={e}>x</Card>)
    expect(container.querySelector(`.amb-card--${e}`)).toBeTruthy()
  })
})
