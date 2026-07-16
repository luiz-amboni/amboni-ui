import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

/**
 * O contrato do Button.
 *
 * Testamos COMPORTAMENTO e ACESSIBILIDADE, não aparência. "A classe é amb-btn--primary"
 * não prova nada para quem usa; "o clique não dispara enquanto carrega" prova.
 */

describe('Button — o básico', () => {
  test('mostra o rótulo e dispara o clique', async () => {
    const aoClicar = vi.fn()
    render(<Button onClick={aoClicar}>Salvar alterações</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(aoClicar).toHaveBeenCalledOnce()
  })

  test('é um <button> de verdade — logo, funciona no teclado de graça', async () => {
    const aoClicar = vi.fn()
    render(<Button onClick={aoClicar}>Enviar</Button>)

    const btn = screen.getByRole('button')
    btn.focus()
    expect(btn).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    // Enter e Espaço acionam botão nativo. Uma <div onClick> não faria nada disso —
    // é por isso que a base é <button>, não div estilizada.
    expect(aoClicar).toHaveBeenCalledTimes(2)
  })
})

describe('Button — type="button" por padrão', () => {
  test('NÃO envia o formulário sem querer', async () => {
    // O default do HTML é type="submit". Um botão "Cancelar" dentro de <form> enviaria
    // o formulário — bug clássico, silencioso e difícil de achar.
    const aoEnviar = vi.fn(e => e.preventDefault())
    render(
      <form onSubmit={aoEnviar}>
        <Button>Cancelar</Button>
      </form>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(aoEnviar).not.toHaveBeenCalled()
  })

  test('mas continua dando para enviar quando é a intenção', async () => {
    const aoEnviar = vi.fn(e => e.preventDefault())
    render(
      <form onSubmit={aoEnviar}>
        <Button type="submit">Salvar</Button>
      </form>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(aoEnviar).toHaveBeenCalledOnce()
  })
})

describe('Button — carregando', () => {
  test('não dispara clique duplicado enquanto carrega', async () => {
    const aoClicar = vi.fn()
    render(<Button loading onClick={aoClicar}>Salvar</Button>)

    await userEvent.click(screen.getByRole('button'))
    // Sem isto, dois cliques rápidos = dois pedidos = dois cadastros duplicados.
    expect(aoClicar).not.toHaveBeenCalled()
  })

  test('avisa o leitor de tela com aria-busy', () => {
    render(<Button loading>Salvar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  test('o rótulo continua no DOM — o botão não encolhe e "foge" do dedo', () => {
    render(<Button loading>Salvar alterações</Button>)
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })
})

describe('Button — desabilitado', () => {
  test('não dispara clique', async () => {
    const aoClicar = vi.fn()
    render(<Button disabled onClick={aoClicar}>Salvar</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(aoClicar).not.toHaveBeenCalled()
  })
})

describe('Button — acessibilidade de ícone', () => {
  const Icone = () => <svg data-testid="ico" />

  test('botão só de ícone SEM aria-label avisa em desenvolvimento', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Button iconLeft={<Icone />} />)
    // Sem rótulo, o leitor de tela anuncia só "botão" — a pessoa não sabe o que faz.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('aria-label'))
    warn.mockRestore()
  })

  test('com aria-label, não avisa e o botão tem nome acessível', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Button aria-label="Fechar" iconLeft={<Icone />} />)

    expect(warn).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
    warn.mockRestore()
  })

  test('ícone junto de texto é escondido do leitor — quem narra é o texto', () => {
    render(<Button iconLeft={<Icone />}>Adicionar cliente</Button>)
    // Sem aria-hidden, o leitor poderia ler o SVG e poluir o nome do botão.
    expect(screen.getByTestId('ico').parentElement).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Adicionar cliente' })).toBeInTheDocument()
  })
})

describe('Button — API', () => {
  test('encaminha a ref (necessário para tooltip, menu, foco programático)', () => {
    let no: HTMLButtonElement | null = null
    render(<Button ref={el => { no = el }}>Oi</Button>)
    expect(no).toBeInstanceOf(HTMLButtonElement)
  })

  test('aceita className do produto sem perder as classes da biblioteca', () => {
    render(<Button className="minha-classe">Oi</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('minha-classe')
    expect(btn).toHaveClass('amb-btn')
    // O anel de foco é obrigatório e não pode ser removido por acidente.
    expect(btn).toHaveClass('amb-focus-ring')
  })

  test('repassa atributos nativos (data-*, aria-*, title)', () => {
    render(<Button data-testid="x" aria-describedby="dica" title="dica">Oi</Button>)
    const btn = screen.getByTestId('x')
    expect(btn).toHaveAttribute('aria-describedby', 'dica')
    expect(btn).toHaveAttribute('title', 'dica')
  })

  test.each(['primary', 'secondary', 'ghost', 'danger'] as const)('variante %s renderiza', v => {
    render(<Button variant={v}>Oi</Button>)
    expect(screen.getByRole('button')).toHaveClass(`amb-btn--${v}`)
  })

  test.each(['sm', 'md', 'lg'] as const)('tamanho %s renderiza', s => {
    render(<Button size={s}>Oi</Button>)
    expect(screen.getByRole('button')).toHaveClass(`amb-btn--${s}`)
  })
})
