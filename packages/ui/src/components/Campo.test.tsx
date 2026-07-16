import { createRef, useState } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Campo } from './Campo'

describe('Campo — o básico de um input', () => {
  test('digitar dispara onChange com o que foi digitado', async () => {
    const aoMudar = vi.fn()
    render(<Campo aria-label="Nome" onChange={aoMudar} />)

    await userEvent.type(screen.getByRole('textbox'), 'iSafe')
    expect(aoMudar).toHaveBeenCalledTimes(5)
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('iSafe')
  })

  test('o ref chega no <input>, não na moldura', () => {
    // A moldura é uma <div>. Se o ref parasse nela, o react-hook-form chamaria
    // ref.current.focus() e leria ref.current.value num elemento que não tem nenhum dos
    // dois — e falharia calado.
    const ref = createRef<HTMLInputElement>()
    render(<Campo aria-label="Nome" ref={ref} />)

    expect(ref.current?.tagName).toBe('INPUT')
    ref.current?.focus()
    expect(ref.current).toHaveFocus()
  })

  test('atributos nativos passam direto (é um <input> de verdade)', () => {
    render(<Campo aria-label="Telefone" name="telefone" type="tel" maxLength={15} required />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('name', 'telefone')
    expect(input).toHaveAttribute('type', 'tel')
    expect(input).toHaveAttribute('maxlength', '15')
    expect(input).toBeRequired()
  })

  test('desabilitado não aceita digitação', async () => {
    const aoMudar = vi.fn()
    render(<Campo aria-label="Nome" disabled onChange={aoMudar} />)

    await userEvent.type(screen.getByRole('textbox'), 'x')
    expect(aoMudar).not.toHaveBeenCalled()
  })
})

describe('Campo — erro', () => {
  test('erro liga aria-invalid (o olho vê a borda; o leitor de tela precisa do atributo)', () => {
    render(<Campo aria-label="E-mail" erro />)
    expect(screen.getByRole('textbox')).toBeInvalid()
  })

  test('sem erro, NÃO manda aria-invalid="false" — manda nada', () => {
    // aria-invalid="false" em todo campo é ruído: alguns leitores anunciam "válido" em
    // campo que a pessoa nem tocou ainda.
    render(<Campo aria-label="E-mail" />)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
  })

  test('aria-invalid vindo de fora (do CampoForm) pinta a moldura sozinho', () => {
    // É o contrato com o CampoForm: o produto declara o erro UMA vez, no wrapper, e não
    // precisa repetir `erro` aqui. Sem isto, o campo ficaria com ARIA de inválido e visual
    // de válido — a pessoa que ouve sabe do erro, a que vê não.
    const { container } = render(<Campo aria-label="E-mail" aria-invalid />)
    expect(container.querySelector('.amb-campo--erro')).toBeTruthy()
  })
})

describe('Campo — adornos', () => {
  test('prefixo e sufixo aparecem, mas são invisíveis ao leitor de tela', () => {
    // Soltos no meio da moldura, seriam lidos fora de ordem ("R$" antes do rótulo). A
    // unidade é papel do label/ajuda do CampoForm.
    const { container } = render(<Campo aria-label="Valor" prefixo="R$" sufixo="/mês" />)

    expect(screen.getByText('R$')).toBeInTheDocument()
    expect(container.querySelector('.amb-campo__afixo--prefixo')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('.amb-campo__afixo--sufixo')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  test('ícone é decorativo e não entra no nome acessível do campo', () => {
    render(<Campo aria-label="Buscar" iconeEsq={<svg data-testid="lupa" />} />)
    expect(screen.getByTestId('lupa').parentElement).toHaveAttribute('aria-hidden', 'true')
    // O nome continua vindo do rótulo, não do ícone.
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
  })
})

describe('Campo — botão de limpar', () => {
  test('só aparece quando há conteúdo (limpar o vazio não faz sentido)', async () => {
    render(<Campo aria-label="Busca" limpar />)
    expect(screen.queryByRole('button', { name: /limpar/i })).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox'), 'a')
    expect(screen.getByRole('button', { name: /limpar/i })).toBeInTheDocument()
  })

  test('limpar dispara onChange com valor vazio — a armadilha do value tracker do React', async () => {
    // `input.value = ''` direto atualiza o tracker interno do React junto, o React conclui
    // que nada mudou e o onChange NUNCA dispara: a tela mostra o campo vazio e o estado do
    // formulário continua com o texto antigo. Este teste trava o setter nativo.
    const aoMudar = vi.fn()
    render(<Campo aria-label="Busca" limpar onChange={aoMudar} />)

    await userEvent.type(screen.getByRole('textbox'), 'iPhone')
    aoMudar.mockClear()

    await userEvent.click(screen.getByRole('button', { name: /limpar/i }))

    expect(aoMudar).toHaveBeenCalledTimes(1)
    expect(aoMudar.mock.calls[0][0].target.value).toBe('')
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('')
  })

  test('limpar funciona em campo CONTROLADO (o caminho de todo formulário React)', async () => {
    function Controlado() {
      const [v, setV] = useState('MacBook')
      return <Campo aria-label="Busca" limpar value={v} onChange={e => setV(e.target.value)} />
    }
    render(<Controlado />)

    await userEvent.click(screen.getByRole('button', { name: /limpar/i }))
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('')
    expect(screen.queryByRole('button', { name: /limpar/i })).not.toBeInTheDocument()
  })

  test('o foco volta para o campo depois de limpar', async () => {
    // O botão clicado some do DOM. Sem devolver o foco, ele cai no <body> e quem navega
    // por teclado é jogado para o topo da página, perdendo o lugar no formulário.
    render(<Campo aria-label="Busca" limpar defaultValue="iPad" />)

    await userEvent.click(screen.getByRole('button', { name: /limpar/i }))
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  test('o botão de limpar é alcançável pelo teclado', async () => {
    // Muita biblioteca põe tabIndex={-1} aqui "para não poluir o Tab" — e a ação passa a
    // existir só para quem tem mouse.
    render(<Campo aria-label="Busca" limpar defaultValue="iPad" />)

    await userEvent.tab()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: /limpar/i })).toHaveFocus()
  })

  test('defaultValue já mostra o botão no primeiro render', () => {
    render(<Campo aria-label="Busca" limpar defaultValue="Apple Watch" />)
    expect(screen.getByRole('button', { name: /limpar/i })).toBeInTheDocument()
  })

  test('campo desabilitado ou só-leitura não mostra o botão', () => {
    const { rerender } = render(<Campo aria-label="X" limpar defaultValue="a" disabled />)
    expect(screen.queryByRole('button', { name: /limpar/i })).not.toBeInTheDocument()

    rerender(<Campo aria-label="X" limpar defaultValue="a" readOnly />)
    expect(screen.queryByRole('button', { name: /limpar/i })).not.toBeInTheDocument()
  })
})

describe('Campo — tamanhos', () => {
  test.each(['sm', 'md', 'lg'] as const)('tamanho %s', t => {
    const { container } = render(<Campo aria-label="X" size={t} />)
    expect(container.querySelector(`.amb-campo--${t}`)).toBeTruthy()
  })

  test('a prop `size` NÃO vaza como o atributo `size` do HTML', () => {
    // O <input> nativo tem um atributo `size` (largura em caracteres). Deixar 'md' cair
    // nele geraria size="md" — inválido, e o navegador reclama no console.
    render(<Campo aria-label="X" size="lg" />)
    expect(screen.getByRole('textbox')).not.toHaveAttribute('size')
  })
})
