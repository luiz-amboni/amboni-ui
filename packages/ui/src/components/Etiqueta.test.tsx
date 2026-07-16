import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Etiqueta } from './Etiqueta'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Etiqueta — o X de remover', () => {
  test('o X diz O QUE remove, não só "Remover"', async () => {
    // Numa barra com 8 filtros, 8 botões "Remover" idênticos deixam quem usa leitor de
    // tela sem saber qual é qual. O nome do filtro tem que estar no rótulo.
    render(
      <>
        <Etiqueta removivel onRemover={() => {}}>Ativos</Etiqueta>
        <Etiqueta removivel onRemover={() => {}}>Sem telefone</Etiqueta>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Remover Ativos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover Sem telefone' })).toBeInTheDocument()
  })

  test('`rotuloRemover` assume quando o conteúdo não é texto puro', () => {
    render(
      <Etiqueta removivel onRemover={() => {}} rotuloRemover="Remover filtro Ativos">
        <strong>Status:</strong> Ativos
      </Etiqueta>,
    )
    expect(screen.getByRole('button', { name: 'Remover filtro Ativos' })).toBeInTheDocument()
  })

  test('conteúdo não-texto sem `rotuloRemover` avisa em desenvolvimento', () => {
    // Sem o aviso, isto vira um "Remover" mudo em produção e ninguém percebe.
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Etiqueta removivel onRemover={() => {}}><em>Ativos</em></Etiqueta>)
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('rotuloRemover'))
  })

  test('o X é um <button> de verdade — funciona no teclado', async () => {
    const remover = vi.fn()
    render(<Etiqueta removivel onRemover={remover}>Ativos</Etiqueta>)

    // Um <span onClick> com cara de X não recebe foco nem responde a Enter.
    const x = screen.getByRole('button', { name: 'Remover Ativos' })
    x.focus()
    await userEvent.keyboard('{Enter}')
    expect(remover).toHaveBeenCalledTimes(1)
  })

  test('clicar no X NÃO dispara o onClick da etiqueta', async () => {
    // Sem stopPropagation, a pessoa remove o filtro e a tela abre a edição do filtro que
    // acabou de sumir. Bug que só aparece quando as duas props andam juntas.
    const remover = vi.fn()
    const clicar = vi.fn()
    render(<Etiqueta removivel onRemover={remover} onClick={clicar}>Ativos</Etiqueta>)

    await userEvent.click(screen.getByRole('button', { name: 'Remover Ativos' }))
    expect(remover).toHaveBeenCalledTimes(1)
    expect(clicar).not.toHaveBeenCalled()
  })

  test('sem `removivel` não existe X', () => {
    render(<Etiqueta>Ativos</Etiqueta>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('Etiqueta — alvos aninhados (clicável + removível)', () => {
  test('nunca gera <button> dentro de <button> — isso é HTML inválido', () => {
    // O navegador "conserta" jogando o botão de dentro para fora da etiqueta: o layout
    // quebra só em produção, nunca no teste de render. Aqui os dois são IRMÃOS.
    const { container } = render(
      <Etiqueta removivel onRemover={() => {}} onClick={() => {}}>Ativos</Etiqueta>,
    )
    expect(container.querySelector('button button')).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  test('os dois alvos são distintos e na ordem esperada: corpo, depois X', async () => {
    const remover = vi.fn()
    const clicar = vi.fn()
    render(<Etiqueta removivel onRemover={remover} onClick={clicar}>Ativos</Etiqueta>)

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Ativos' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Remover Ativos' })).toHaveFocus()
  })

  test('clicar no corpo dispara só o onClick', async () => {
    const remover = vi.fn()
    const clicar = vi.fn()
    render(<Etiqueta removivel onRemover={remover} onClick={clicar}>Ativos</Etiqueta>)

    await userEvent.click(screen.getByRole('button', { name: 'Ativos' }))
    expect(clicar).toHaveBeenCalledTimes(1)
    expect(remover).not.toHaveBeenCalled()
  })
})

describe('Etiqueta — o elemento certo para cada caso', () => {
  test('só clicável: a etiqueta INTEIRA é o botão (alvo maior)', () => {
    render(<Etiqueta onClick={() => {}}>Ativos</Etiqueta>)
    const btn = screen.getByRole('button', { name: 'Ativos' })
    expect(btn.tagName).toBe('BUTTON')
    expect(btn).toHaveClass('amb-etiqueta')
  })

  test('sem clique nenhum: <span>, não um botão falso na navegação', () => {
    // Um botão que não faz nada só polui o Tab de quem navega por teclado.
    const { container } = render(<Etiqueta>Ativos</Etiqueta>)
    expect(container.querySelector('span.amb-etiqueta')).toBeTruthy()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('o botão clicável é type="button" — dentro de <form> não envia o formulário', () => {
    render(<Etiqueta onClick={() => {}}>Ativos</Etiqueta>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  test('o ícone é decorativo — quem nomeia a etiqueta é o texto', () => {
    render(<Etiqueta icone={<svg data-testid="ico" />}>Ativos</Etiqueta>)
    expect(screen.getByTestId('ico').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  test.each(['neutro', 'marca', 'sucesso', 'aviso', 'perigo', 'info'] as const)('tom %s', tom => {
    const { container } = render(<Etiqueta tom={tom}>Ativos</Etiqueta>)
    expect(container.querySelector(`.amb-etiqueta--${tom}`)).toBeTruthy()
  })
})
