import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dica } from './Dica'

afterEach(() => {
  vi.useRealTimers()
})

describe('Dica — teclado', () => {
  test('abre no FOCO, não só no hover', async () => {
    // O motivo de o componente existir em vez de um `title`: hover não existe para
    // quem navega por teclado. Sem isto, a Dica é decoração para metade das pessoas.
    render(
      <Dica conteudo="Retorno sobre o investimento">
        <button>ROAS</button>
      </Dica>,
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await userEvent.tab()

    expect(screen.getByRole('button', { name: 'ROAS' })).toHaveFocus()
    expect(screen.getByRole('tooltip')).toBeVisible()
  })

  test('some ao sair do foco', async () => {
    render(
      <>
        <Dica conteudo="ajuda"><button>Alvo</button></Dica>
        <button>Outro</button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('tooltip')).toBeVisible()

    await userEvent.tab()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('Esc fecha (WCAG 1.4.13)', async () => {
    // Aberta, a Dica pode estar tampando exatamente o que a pessoa precisa ler. Tem que
    // dar para dispensar sem sair do lugar.
    render(<Dica conteudo="ajuda"><button>Alvo</button></Dica>)
    await userEvent.tab()
    expect(screen.getByRole('tooltip')).toBeVisible()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('Esc fecha também a dica aberta por HOVER, sem foco nenhum', async () => {
    // Por isso o listener é no documento: sem foco, um listener no gatilho nunca veria
    // a tecla.
    render(<Dica conteudo="ajuda" atraso={0}><button>Alvo</button></Dica>)
    await userEvent.hover(screen.getByRole('button'))
    expect(await screen.findByRole('tooltip')).toBeVisible()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('Dica — ligação com o leitor de tela', () => {
  test('o gatilho aponta para a dica por aria-describedby', async () => {
    // `role="tooltip"` sozinho não faz nada: sem alguém apontando para ele, o leitor de
    // tela nunca lê o balão. A ligação é o componente inteiro.
    render(<Dica conteudo="Retorno sobre o investimento"><button>ROAS</button></Dica>)
    await userEvent.tab()

    const gatilho = screen.getByRole('button', { name: 'ROAS' })
    const balao = screen.getByRole('tooltip')
    expect(gatilho.getAttribute('aria-describedby')).toContain(balao.id)
  })

  test('o aria-describedby fica NO elemento que recebe foco', () => {
    const { container } = render(<Dica conteudo="ajuda"><button>Alvo</button></Dica>)
    // Pendurado no invólucro, não seria anunciado: quem é lido é o botão.
    expect(screen.getByRole('button')).toHaveAttribute('aria-describedby')
    expect(container.querySelector('.amb-dica')).not.toHaveAttribute('aria-describedby')
  })

  test('preserva um aria-describedby que o produto já tinha posto', async () => {
    render(
      <>
        <span id="ajuda-externa">texto de apoio</span>
        <Dica conteudo="ajuda"><button aria-describedby="ajuda-externa">Alvo</button></Dica>
      </>,
    )
    await userEvent.tab()

    const descrito = screen.getByRole('button').getAttribute('aria-describedby')
    // Sobrescrever seria apagar uma ligação alheia sem avisar ninguém.
    expect(descrito).toContain('ajuda-externa')
    expect(descrito).toContain(screen.getByRole('tooltip').id)
  })

  test('não usa o title do HTML', () => {
    // O `title` é lento, feio, não estilizável e não aparece no celular. Se ele
    // vazasse para o gatilho, ainda apareceria a dica nativa por cima da nossa.
    render(<Dica conteudo="ajuda"><button>Alvo</button></Dica>)
    expect(screen.getByRole('button')).not.toHaveAttribute('title')
  })
})

describe('Dica — hover e atraso', () => {
  // fireEvent, e não userEvent, nos dois testes de relógio: o userEvent tem o próprio
  // agendador interno, que trava quando o vitest troca o setTimeout global por baixo
  // dele. Aqui o que importa é só o cronômetro do componente, e fireEvent dispara o
  // evento direto, sem relógio nenhum no meio.
  test('não abre antes do atraso — o mouse pode atravessar a tela em paz', () => {
    vi.useFakeTimers()
    render(<Dica conteudo="ajuda" atraso={500}><button>Alvo</button></Dica>)

    fireEvent.mouseEnter(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByRole('tooltip')).toBeVisible()
  })

  test('sair com o mouse antes do atraso cancela a abertura', () => {
    vi.useFakeTimers()
    render(<Dica conteudo="ajuda" atraso={500}><button>Alvo</button></Dica>)

    const alvo = screen.getByRole('button')
    fireEvent.mouseEnter(alvo)
    fireEvent.mouseLeave(alvo)
    act(() => { vi.advanceTimersByTime(500) })

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('sai com o mouse e a dica fecha', async () => {
    render(<Dica conteudo="ajuda" atraso={0}><button>Alvo</button></Dica>)
    const alvo = screen.getByRole('button')

    await userEvent.hover(alvo)
    expect(await screen.findByRole('tooltip')).toBeVisible()

    await userEvent.unhover(alvo)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('Dica — posicionamento', () => {
  test.each(['cima', 'baixo', 'esq', 'dir'] as const)('lado %s', async lado => {
    render(<Dica conteudo="ajuda" lado={lado}><button>Alvo</button></Dica>)
    await userEvent.tab()
    expect(screen.getByRole('tooltip')).toHaveClass(`amb-dica__balao--${lado}`)
  })

  test('a dica é fixa e sai posicionada, não no canto', async () => {
    // jsdom não faz layout: os retângulos são zero e a conta cai no respiro mínimo de
    // 8px da borda. O que isto prova é que o balão SEMPRE recebe uma posição antes de
    // ficar visível — nunca aparece em (0,0) para depois pular para o lugar.
    render(<Dica conteudo="ajuda"><button>Alvo</button></Dica>)
    await userEvent.tab()

    const balao = screen.getByRole('tooltip')
    expect(balao.style.position).toBe('')
    expect(balao.style.top).toBe('8px')
    expect(balao.style.left).toBe('8px')
    expect(balao.style.visibility).toBe('')
  })
})
