import { useState } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover } from './Popover'

/** O caso real: um painel de filtro com controles dentro. É por eles que o Popover existe. */
function PopoverDeFiltro(props: { onAbrirChange?: (a: boolean) => void }) {
  return (
    <div>
      <Popover rotulo="Filtros" gatilho={<button type="button">Filtrar</button>} {...props}>
        <input aria-label="Nome" />
        <button type="button">Aplicar</button>
      </Popover>
      <button type="button">depois</button>
    </div>
  )
}

describe('Popover — o que o separa da Dica', () => {
  test('é um diálogo NÃO modal: agrupa o conteúdo sem esconder a página', async () => {
    render(<PopoverDeFiltro />)
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    const painel = screen.getByRole('dialog', { name: 'Filtros' })
    // `aria-modal="true"` aqui faria o leitor de tela esconder a PÁGINA INTEIRA enquanto um
    // painelzinho de filtro está aberto — a pessoa perderia acesso a tudo que está atrás.
    // É a mentira que separa este componente do Dialogo.
    expect(painel).toHaveAttribute('aria-modal', 'false')
    // A prova de que a página continua acessível: o botão de fora ainda está lá para todos.
    expect(screen.getByRole('button', { name: 'depois' })).toBeInTheDocument()
  })

  test('o gatilho anuncia que abre um diálogo, e o estado dele', async () => {
    render(<PopoverDeFiltro />)
    const gatilho = screen.getByRole('button', { name: 'Filtrar' })

    // Sem aria-expanded, o leitor de tela diz "botão" e a pessoa não sabe que abriu nada.
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')
    expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog')

    await userEvent.click(gatilho)
    expect(gatilho).toHaveAttribute('aria-expanded', 'true')
    expect(gatilho).toHaveAttribute('aria-controls', screen.getByRole('dialog').id)
  })

  test('o foco ENTRA no painel ao abrir — senão o teclado não alcança o conteúdo', async () => {
    render(<PopoverDeFiltro />)
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    // No primeiro controle. Deixar o foco no gatilho faria o Tab seguir para o próximo botão
    // da PÁGINA, por baixo de um painel aberto que ninguém consegue usar.
    expect(screen.getByLabelText('Nome')).toHaveFocus()
  })

  test('painel sem controle nenhum: o foco cai no próprio painel', async () => {
    render(
      <Popover rotulo="Quem viu" gatilho={<button type="button">Ver</button>}>
        <p>Ana, Bruno e Carla</p>
      </Popover>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ver' }))
    // Não há para onde mandar o foco, e deixá-lo no gatilho deixaria o conteúdo inalcançável
    // para quem navega por teclado. O painel é `tabIndex={-1}` justamente para ser este destino.
    expect(screen.getByRole('dialog')).toHaveFocus()
  })
})

describe('Popover — foco', () => {
  test('Esc fecha E DEVOLVE O FOCO ao gatilho', async () => {
    render(<PopoverDeFiltro />)
    const gatilho = screen.getByRole('button', { name: 'Filtrar' })

    await userEvent.click(gatilho)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Sem devolver, o foco volta para o <body> e a pessoa é cuspida no TOPO da página —
    // precisa navegar tudo de novo até onde estava. É a metade esquecida do "Esc fecha".
    expect(gatilho).toHaveFocus()
  })

  test('Tab CIRCULA dentro do painel enquanto ele está aberto', async () => {
    render(<PopoverDeFiltro />)
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    expect(screen.getByLabelText('Nome')).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Aplicar' })).toHaveFocus()

    // Do último volta ao primeiro. Sem a armadilha, o foco iria para o botão "depois" — que
    // está ATRÁS do painel aberto: o foco sumiria da vista da pessoa.
    await userEvent.tab()
    expect(screen.getByLabelText('Nome')).toHaveFocus()
    expect(screen.getByRole('button', { name: 'depois' })).not.toHaveFocus()
  })

  test('Shift+Tab circula para trás', async () => {
    render(<PopoverDeFiltro />)
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    // Do primeiro para trás → o último. Sem isto o foco escaparia para o gatilho, que está
    // fora do painel, e a armadilha só funcionaria numa direção.
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Aplicar' })).toHaveFocus()
  })
})

describe('Popover — clique', () => {
  test('clique FORA fecha', async () => {
    render(<PopoverDeFiltro />)
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'depois' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('clique DENTRO não fecha — e o handler do controle roda', async () => {
    const aplicar = vi.fn()
    render(
      <Popover rotulo="Filtros" gatilho={<button type="button">Filtrar</button>}>
        <button type="button" onClick={aplicar}>Aplicar</button>
      </Popover>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))

    // O bug clássico: sem a checagem `contains` no listener de `pointerdown`, o painel
    // desmontaria no aperto do dedo, o `click` nunca chegaria ao botão e o onClick não
    // rodaria. O sintoma é "o botão do painel não faz nada".
    expect(aplicar).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  test('clicar de novo no gatilho fecha', async () => {
    render(<PopoverDeFiltro />)
    const gatilho = screen.getByRole('button', { name: 'Filtrar' })

    await userEvent.click(gatilho)
    await userEvent.click(gatilho)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Popover — controlado', () => {
  test('quem manda é a prop: sem `onAbrirChange` virar o estado, o painel NÃO abre', async () => {
    render(
      <Popover rotulo="Filtros" aberto={false} gatilho={<button type="button">Filtrar</button>}>
        <button type="button">Aplicar</button>
      </Popover>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    // É o que permite segurar o painel ("salve antes de sair") sem lutar contra o componente.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('avisa a INTENÇÃO de abrir e de fechar', async () => {
    const aoMudar = vi.fn()
    render(<PopoverDeFiltro onAbrirChange={aoMudar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))
    expect(aoMudar).toHaveBeenCalledWith(true)

    await userEvent.keyboard('{Escape}')
    expect(aoMudar).toHaveBeenCalledWith(false)
  })

  test('controlado de fora: fechar depois de salvar funciona', async () => {
    function Formulario() {
      const [aberto, setAberto] = useState(false)
      return (
        <Popover
          rotulo="Novo cliente"
          aberto={aberto}
          onAbrirChange={setAberto}
          gatilho={<button type="button">Novo</button>}
        >
          <button type="button" onClick={() => setAberto(false)}>Salvar</button>
        </Popover>
      )
    }
    render(<Formulario />)

    await userEvent.click(screen.getByRole('button', { name: 'Novo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Popover — o gatilho continua sendo de quem o escreveu', () => {
  test('o onClick original roda junto com a abertura', async () => {
    const meu = vi.fn()
    render(
      <Popover rotulo="Filtros" gatilho={<button type="button" onClick={meu}>Filtrar</button>}>
        <button type="button">Aplicar</button>
      </Popover>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }))

    // Não sequestramos o clique de quem passou um handler — o Popover soma, não substitui.
    expect(meu).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
