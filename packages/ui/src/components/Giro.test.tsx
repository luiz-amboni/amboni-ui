import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Giro } from './Giro'

describe('Giro', () => {
  test('tem rótulo acessível mesmo sem ninguém passar um', () => {
    render(<Giro />)
    // A armadilha: um giro é uma imagem em movimento — para quem usa leitor de tela é o
    // nada absoluto. Sem rótulo a pessoa não sabe se a página está trabalhando ou se
    // travou, e a resposta às duas coisas é oposta (esperar × recarregar). Por isso o
    // padrão existe: não sai Giro mudo daqui.
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
  })

  test('rótulo específico diz QUAL pedaço da tela está ocupado', () => {
    render(<Giro rotulo="Carregando campanhas" />)
    expect(screen.getByRole('status', { name: 'Carregando campanhas' })).toBeInTheDocument()
  })

  test('usa role="status", não "alert"', () => {
    render(<Giro />)
    // status (polite) espera a pessoa terminar de ouvir a frase. Um spinner assertivo
    // cortaria a leitura a cada requisição — o painel viraria inusável no leitor de tela.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  test.each(['sm', 'md', 'lg'] as const)('tamanho %s', size => {
    const { container } = render(<Giro size={size} />)
    expect(container.querySelector(`.amb-giro__anel--${size}`)).toBeTruthy()
  })

  test('o anel é decorativo — quem informa é o rótulo do container', () => {
    const { container } = render(<Giro />)
    expect(container.querySelector('.amb-giro__anel')).toHaveAttribute('aria-hidden', 'true')
  })

  test('centralizado aplica a classe de bloco', () => {
    const { container } = render(<Giro centralizado />)
    expect(container.querySelector('.amb-giro--centralizado')).toBeTruthy()
  })

  test('dá para silenciar quando o pai já anuncia (ex.: dentro de um botão)', () => {
    // O Button já diz "ocupado" por aria-busy. Dois anúncios para o mesmo estado é ruído.
    render(<Giro aria-hidden="true" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
