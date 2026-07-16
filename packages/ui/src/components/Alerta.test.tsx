import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Alerta, type AlertaTom } from './Alerta'

const TONS: AlertaTom[] = ['info', 'sucesso', 'aviso', 'perigo']

describe('Alerta — conteúdo', () => {
  test('mostra título, texto e ação', () => {
    render(
      <Alerta tom="perigo" titulo="Não foi possível enviar" acao={<button>Tentar de novo</button>}>
        O WhatsApp recusou a mensagem.
      </Alerta>,
    )
    expect(screen.getByText('Não foi possível enviar')).toBeInTheDocument()
    expect(screen.getByText('O WhatsApp recusou a mensagem.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  test.each(TONS)('tom %s aplica a classe do tom', tom => {
    const { container } = render(<Alerta tom={tom} titulo="x" />)
    expect(container.querySelector(`.amb-alerta--${tom}`)).toBeTruthy()
  })
})

describe('Alerta — quem interrompe e quem espera', () => {
  test('perigo usa role="alert" — INTERROMPE a leitura', () => {
    render(<Alerta tom="perigo" titulo="Pagamento recusado" />)
    // role="alert" = aria-live="assertive": corta a frase que o leitor de tela está
    // lendo. É o certo aqui, e SÓ aqui: a pessoa precisa saber que falhou antes de
    // continuar digitando/clicando como se tivesse dado certo.
    expect(screen.getByRole('alert')).toHaveTextContent('Pagamento recusado')
  })

  test.each(['info', 'sucesso', 'aviso'] as const)('%s usa role="status" — ESPERA a vez', tom => {
    render(<Alerta tom={tom} titulo="Cliente salvo" />)
    // role="status" = aria-live="polite": espera a leitura atual terminar. Marcar isto
    // como assertivo seria gritar toda frase — a pessoa desliga o recurso e aí nem o
    // erro de verdade (o único assertivo) chega.
    expect(screen.getByRole('status')).toHaveTextContent('Cliente salvo')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Alerta — a cor nunca vai sozinha', () => {
  test('cada tom tem um ÍCONE de forma diferente, não só uma cor diferente', () => {
    // A armadilha: quatro alertas idênticos pintados de azul/verde/amarelo/vermelho.
    // Para quem não distingue vermelho de verde (~1 em 12 homens), "sucesso" e "perigo"
    // viram o MESMO alerta. Este teste trava as formas: se alguém unificar os ícones
    // "para ficar mais limpo", quebra aqui.
    const desenhos = TONS.map(tom => {
      const { container, unmount } = render(<Alerta tom={tom} titulo="x" />)
      const svg = container.querySelector('.amb-alerta__icone svg')?.innerHTML ?? ''
      unmount()
      return svg
    })

    expect(desenhos.every(d => d.length > 0)).toBe(true)
    expect(new Set(desenhos).size).toBe(TONS.length)
  })

  test('o ícone é decorativo — quem narra é o título', () => {
    // Ícone narrado faria o leitor de tela dizer "imagem" antes de cada alerta, sem
    // acrescentar nada: o texto já diz o que é.
    const { container } = render(<Alerta tom="aviso" titulo="Estoque baixo" />)
    expect(container.querySelector('.amb-alerta__icone')).toHaveAttribute('aria-hidden', 'true')
  })

  test('ícone customizado substitui o padrão', () => {
    const { container } = render(
      <Alerta tom="info" titulo="x" icone={<svg data-testid="meu" />} />,
    )
    expect(container.querySelector('[data-testid="meu"]')).toBeTruthy()
  })
})

describe('Alerta — dispensar', () => {
  test('dispensar chama onDispensar', async () => {
    const dispensar = vi.fn()
    render(<Alerta titulo="x" dispensavel onDispensar={dispensar} />)

    await userEvent.click(screen.getByRole('button', { name: /dispensar/i }))
    expect(dispensar).toHaveBeenCalledTimes(1)
  })

  test('o X é um <button> com rótulo acessível', () => {
    render(<Alerta titulo="x" dispensavel onDispensar={vi.fn()} />)
    // Sem aria-label, o leitor de tela anuncia só "botão" — ninguém fecha o que não
    // consegue nomear. E <button>, não <span onClick>: recebe foco e responde a Enter.
    expect(screen.getByRole('button', { name: 'Dispensar aviso' })).toBeInTheDocument()
  })

  test('o X funciona no teclado', async () => {
    const dispensar = vi.fn()
    render(<Alerta titulo="x" dispensavel onDispensar={dispensar} />)

    screen.getByRole('button', { name: /dispensar/i }).focus()
    await userEvent.keyboard('{Enter}')
    expect(dispensar).toHaveBeenCalled()
  })

  test('sem `dispensavel` não existe X (não polui a navegação por teclado)', () => {
    render(<Alerta titulo="x" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
