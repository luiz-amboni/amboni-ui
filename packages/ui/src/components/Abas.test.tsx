import { useState } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Abas, ListaAbas, Aba, PainelAba } from './Abas'

/** Harness controlado — é assim que o produto usa: o estado é dele. */
function Exemplo({ inicial = 'pedidos', desabilitada }: { inicial?: string; desabilitada?: string }) {
  const [aba, setAba] = useState(inicial)
  return (
    <Abas valor={aba} onChange={setAba}>
      <ListaAbas aria-label="Seções do cliente">
        <Aba valor="pedidos" contador={12} disabled={desabilitada === 'pedidos'}>
          Pedidos
        </Aba>
        <Aba valor="mensagens" disabled={desabilitada === 'mensagens'}>
          Mensagens
        </Aba>
        <Aba valor="notas" disabled={desabilitada === 'notas'}>
          Notas
        </Aba>
      </ListaAbas>
      <PainelAba valor="pedidos">conteúdo de pedidos</PainelAba>
      <PainelAba valor="mensagens">conteúdo de mensagens</PainelAba>
      <PainelAba valor="notas">conteúdo de notas</PainelAba>
    </Abas>
  )
}

const aba = (nome: RegExp | string) => screen.getByRole('tab', { name: nome })

describe('Abas — teclado (o coração do componente)', () => {
  test('→ anda para a próxima aba e já ativa', async () => {
    render(<Exemplo />)
    aba(/pedidos/i).focus()

    await userEvent.keyboard('{ArrowRight}')

    expect(aba('Mensagens')).toHaveFocus()
    expect(aba('Mensagens')).toHaveAttribute('aria-selected', 'true')
  })

  test('→ na ÚLTIMA aba circula para a primeira', async () => {
    // Travar na ponta obriga a pessoa a voltar tecla por tecla até o começo.
    render(<Exemplo inicial="notas" />)
    aba('Notas').focus()

    await userEvent.keyboard('{ArrowRight}')

    expect(aba(/pedidos/i)).toHaveFocus()
  })

  test('← na PRIMEIRA aba circula para a última', async () => {
    render(<Exemplo />)
    aba(/pedidos/i).focus()

    await userEvent.keyboard('{ArrowLeft}')

    expect(aba('Notas')).toHaveFocus()
    expect(aba('Notas')).toHaveAttribute('aria-selected', 'true')
  })

  test('Home vai para a primeira, End para a última', async () => {
    render(<Exemplo inicial="mensagens" />)
    aba('Mensagens').focus()

    await userEvent.keyboard('{Home}')
    expect(aba(/pedidos/i)).toHaveFocus()

    await userEvent.keyboard('{End}')
    expect(aba('Notas')).toHaveFocus()
  })

  test('as setas PULAM a aba desabilitada em vez de parar nela', async () => {
    // Parar numa aba morta é um beco sem saída: a pessoa aperta Enter e nada acontece.
    render(<Exemplo desabilitada="mensagens" />)
    aba(/pedidos/i).focus()

    await userEvent.keyboard('{ArrowRight}')

    expect(aba('Notas')).toHaveFocus()
    expect(aba('Mensagens')).not.toHaveFocus()
  })

  test('End não para na desabilitada da ponta — cai na última que funciona', async () => {
    render(<Exemplo desabilitada="notas" />)
    aba(/pedidos/i).focus()

    await userEvent.keyboard('{End}')

    expect(aba('Mensagens')).toHaveFocus()
  })

  test('tecla que não é de navegação não é sequestrada', async () => {
    render(<Exemplo />)
    aba(/pedidos/i).focus()

    await userEvent.keyboard('{ArrowDown}')

    // ArrowDown rola a página. Chamar preventDefault em tudo quebraria isso.
    expect(aba(/pedidos/i)).toHaveFocus()
  })
})

describe('Abas — roving tabindex', () => {
  test('só a aba ATIVA é tabulável; as outras ficam em -1', () => {
    render(<Exemplo />)
    // Com tabIndex=0 em todas, o Tab obriga a passar por 8 abas antes do conteúdo.
    expect(aba(/pedidos/i)).toHaveAttribute('tabindex', '0')
    expect(aba('Mensagens')).toHaveAttribute('tabindex', '-1')
    expect(aba('Notas')).toHaveAttribute('tabindex', '-1')
  })

  test('o tabIndex=0 acompanha a aba ativa ao trocar', async () => {
    render(<Exemplo />)

    await userEvent.click(aba('Notas'))

    expect(aba('Notas')).toHaveAttribute('tabindex', '0')
    expect(aba(/pedidos/i)).toHaveAttribute('tabindex', '-1')
  })

  test('o Tab pula a régua inteira e cai no painel', async () => {
    render(<Exemplo />)
    aba(/pedidos/i).focus()

    await userEvent.tab()

    // O painel é focável justamente para receber este Tab — se ele só tiver texto, sem isto
    // ninguém consegue rolá-lo pelo teclado.
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })
})

describe('Abas — ligação ARIA', () => {
  test('aria-controls aponta para o id do painel certo, e ele responde com aria-labelledby', () => {
    render(<Exemplo />)
    const ativa = aba(/pedidos/i)
    const painel = screen.getByRole('tabpanel')

    expect(ativa.getAttribute('aria-controls')).toBe(painel.id)
    expect(painel.getAttribute('aria-labelledby')).toBe(ativa.id)
    expect(painel.id).not.toBe('')
  })

  test('o par de ids segue a aba ativa', async () => {
    render(<Exemplo />)

    await userEvent.click(aba('Mensagens'))
    const painel = screen.getByRole('tabpanel')

    expect(aba('Mensagens').getAttribute('aria-controls')).toBe(painel.id)
    expect(painel).toHaveTextContent('conteúdo de mensagens')
  })

  test('valor com espaço não quebra a ligação (id é IDREF separado por espaço)', () => {
    function ComEspaco() {
      const [v, setV] = useState('meus pedidos')
      return (
        <Abas valor={v} onChange={setV}>
          <ListaAbas aria-label="x">
            <Aba valor="meus pedidos">Meus pedidos</Aba>
          </ListaAbas>
          <PainelAba valor="meus pedidos">ok</PainelAba>
        </Abas>
      )
    }
    render(<ComEspaco />)

    const controles = aba('Meus pedidos').getAttribute('aria-controls') ?? ''
    // Um espaço aqui viraria DUAS referências quebradas, em silêncio.
    expect(controles).not.toContain(' ')
    expect(document.getElementById(controles)).toBeTruthy()
  })

  test('a régua tem nome acessível', () => {
    render(<Exemplo />)
    expect(screen.getByRole('tablist', { name: 'Seções do cliente' })).toBeInTheDocument()
  })

  test('sem aria-label na régua, avisa em desenvolvimento', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Abas valor="a" onChange={() => {}}>
        <ListaAbas>
          <Aba valor="a">A</Aba>
        </ListaAbas>
      </Abas>,
    )
    expect(aviso).toHaveBeenCalled()
    aviso.mockRestore()
  })
})

describe('Abas — painéis', () => {
  test('só o painel ativo existe no DOM', () => {
    render(<Exemplo />)
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.getByText('conteúdo de pedidos')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo de notas')).not.toBeInTheDocument()
  })

  test('clicar troca o painel', async () => {
    render(<Exemplo />)

    await userEvent.click(aba('Notas'))

    expect(screen.getByText('conteúdo de notas')).toBeInTheDocument()
    expect(screen.queryByText('conteúdo de pedidos')).not.toBeInTheDocument()
  })
})

describe('Abas — aba desabilitada', () => {
  test('usa aria-disabled, não o disabled do HTML (senão sai do foco e some da régua)', () => {
    render(<Exemplo desabilitada="mensagens" />)
    expect(aba('Mensagens')).toHaveAttribute('aria-disabled', 'true')
    expect(aba('Mensagens')).not.toBeDisabled()
  })

  test('não ativa nem por clique nem por Enter', async () => {
    const onChange = vi.fn()
    render(
      <Abas valor="pedidos" onChange={onChange}>
        <ListaAbas aria-label="x">
          <Aba valor="pedidos">Pedidos</Aba>
          <Aba valor="notas" disabled>
            Notas
          </Aba>
        </ListaAbas>
      </Abas>,
    )

    // Enter num botão com aria-disabled dispara onClick de verdade — o navegador não conhece
    // a nossa regra. Por isso existe o guarda no TSX, além do pointer-events no CSS.
    aba('Notas').focus()
    await userEvent.keyboard('{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  test('a régua não fica presa quando a aba ATIVA está desabilitada', async () => {
    // O caso que justifica o aria-disabled: com disabled de verdade, ninguém teria tabIndex=0
    // e a régua inteira sumiria do teclado.
    render(<Exemplo inicial="pedidos" desabilitada="pedidos" />)
    aba(/pedidos/i).focus()

    await userEvent.keyboard('{ArrowRight}')

    expect(aba('Mensagens')).toHaveFocus()
  })
})

describe('Abas — conteúdo', () => {
  test('o contador entra no nome acessível (12 pedidos é informação, não enfeite)', () => {
    render(<Exemplo />)
    expect(screen.getByRole('tab', { name: 'Pedidos 12' })).toBeInTheDocument()
  })

  test('o ícone é decorativo — quem narra é o texto', () => {
    render(
      <Abas valor="a" onChange={() => {}}>
        <ListaAbas aria-label="x">
          <Aba valor="a" icone={<svg data-testid="icone" />}>
            Início
          </Aba>
        </ListaAbas>
      </Abas>,
    )
    expect(screen.getByRole('tab', { name: 'Início' })).toBeInTheDocument()
    expect(screen.getByTestId('icone').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  test.each(['linha', 'pilula'] as const)('variante %s', v => {
    const { container } = render(
      <Abas valor="a" onChange={() => {}} variante={v}>
        <ListaAbas aria-label="x">
          <Aba valor="a">A</Aba>
        </ListaAbas>
      </Abas>,
    )
    expect(container.querySelector(`.amb-abas--${v}`)).toBeTruthy()
  })

  test('fora de <Abas> o erro é explícito, não um componente quebrado em silêncio', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Aba valor="a">A</Aba>)).toThrow(/dentro de <Abas>/)
    erro.mockRestore()
  })
})
