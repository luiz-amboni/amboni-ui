import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Menu, ItemMenu, SeparadorMenu, RotuloMenu } from './Menu'
import { Button } from './Button'

function MenuDeTeste(props: { aoEditar?: () => void; aoExcluir?: () => void; aoDuplicar?: () => void }) {
  return (
    <Menu gatilho={<Button>Ações</Button>}>
      <RotuloMenu>Cliente</RotuloMenu>
      <ItemMenu onClick={props.aoEditar}>Editar</ItemMenu>
      {/* Desabilitado no MEIO de propósito: é o caso que pega o bug de navegação. */}
      <ItemMenu disabled onClick={props.aoDuplicar}>Duplicar</ItemMenu>
      <SeparadorMenu />
      <ItemMenu perigo onClick={props.aoExcluir}>Excluir</ItemMenu>
    </Menu>
  )
}

const gatilho = () => screen.getByRole('button', { name: 'Ações' })

describe('Menu — abrir e fechar', () => {
  test('nasce fechado e o gatilho anuncia que abre um menu', () => {
    render(<MenuDeTeste />)
    // Sem aria-haspopup, o leitor de tela diz só "botão" e a pessoa não sabe que há um menu.
    expect(gatilho()).toHaveAttribute('aria-haspopup', 'menu')
    expect(gatilho()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('aria-expanded acompanha o estado', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())
    expect(gatilho()).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(gatilho())
    expect(gatilho()).toHaveAttribute('aria-expanded', 'false')
  })

  test('ao abrir, o foco vai para o PRIMEIRO item', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())
    // O oposto do combobox, onde o foco fica no campo. Aqui não há o que digitar.
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus()
  })

  test('Seta pra cima abre no ÚLTIMO item — atalho para a ação do fim', async () => {
    render(<MenuDeTeste />)
    gatilho().focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus()
  })

  test('Seta pra baixo no gatilho abre no primeiro item', async () => {
    render(<MenuDeTeste />)
    gatilho().focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus()
  })
})

describe('Menu — teclado', () => {
  test('as setas navegam PULANDO o item desabilitado', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())

    await userEvent.keyboard('{ArrowDown}')
    // "Duplicar" está desabilitado e é pulado — parar nele deixaria o Enter sem efeito e
    // pareceria que o menu travou.
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus()
  })

  test('as setas circulam nas duas pontas', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())

    // Último → primeiro
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus()

    // Primeiro → último (para trás)
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus()
  })

  test('Home e End vão para as pontas', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())

    await userEvent.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveFocus()

    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus()
  })

  test('Enter ativa o item focado', async () => {
    const aoEditar = vi.fn()
    render(<MenuDeTeste aoEditar={aoEditar} />)

    await userEvent.click(gatilho())
    await userEvent.keyboard('{Enter}')
    expect(aoEditar).toHaveBeenCalledTimes(1)
  })

  test('Espaço ativa o item focado', async () => {
    const aoEditar = vi.fn()
    render(<MenuDeTeste aoEditar={aoEditar} />)

    await userEvent.click(gatilho())
    // Vem de graça por o item ser um <button> de verdade — e é justamente por isso que ele é.
    await userEvent.keyboard(' ')
    expect(aoEditar).toHaveBeenCalledTimes(1)
  })

  test('Esc fecha E devolve o foco ao gatilho', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    // Sem devolver o foco, a pessoa é jogada para o topo da página e refaz todo o caminho.
    expect(gatilho()).toHaveFocus()
  })

  test('Tab fecha o menu', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())
    await userEvent.tab()
    // O Tab sai do menu; deixá-lo aberto e órfão sobre a página seria pior que fechar.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('Menu — ponteiro', () => {
  test('clicar num item dispara o onClick dele', async () => {
    const aoExcluir = vi.fn()
    render(<MenuDeTeste aoExcluir={aoExcluir} />)

    await userEvent.click(gatilho())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Excluir' }))

    // O bug clássico: o listener de fechar (pointerdown no document) roda ANTES do click.
    // Sem a checagem `contains`, o painel sumiria no aperto do dedo, o click nunca chegaria
    // no item e o menu "não faria nada".
    expect(aoExcluir).toHaveBeenCalledTimes(1)
  })

  test('o item fecha o menu depois de agir', async () => {
    render(<MenuDeTeste aoEditar={vi.fn()} />)
    await userEvent.click(gatilho())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Editar' }))
    // Deixar aberto taparia o resultado da ação que a pessoa acabou de disparar.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('item desabilitado não dispara nada nem fecha', async () => {
    const aoDuplicar = vi.fn()
    render(<MenuDeTeste aoDuplicar={aoDuplicar} />)

    await userEvent.click(gatilho())
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicar' }))

    expect(aoDuplicar).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  test('clique fora fecha o menu', async () => {
    render(
      <div>
        <MenuDeTeste />
        <button type="button">outro lugar</button>
      </div>,
    )
    await userEvent.click(gatilho())
    await userEvent.click(screen.getByRole('button', { name: 'outro lugar' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('clique fora NÃO rouba o foco de volta para o gatilho', async () => {
    render(
      <div>
        <MenuDeTeste />
        <button type="button">outro lugar</button>
      </div>,
    )
    await userEvent.click(gatilho())
    const fora = screen.getByRole('button', { name: 'outro lugar' })
    await userEvent.click(fora)

    // A pessoa clicou ali porque quer ir para lá. Devolver o foco ao gatilho (como no Esc)
    // seria desfazer o gesto dela.
    expect(fora).toHaveFocus()
  })
})

describe('Menu — semântica e conteúdo', () => {
  test('o painel é um menu e os itens são menuitem', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())

    expect(screen.getByRole('menu')).toBeInTheDocument()
    // Rótulo e separador não podem contar como item: eles não são acionáveis.
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  test('o item desabilitado é anunciado como indisponível, não escondido', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())
    // aria-disabled em vez do disabled do HTML: continua anunciado, só não age.
    expect(screen.getByRole('menuitem', { name: 'Duplicar' })).toHaveAttribute('aria-disabled', 'true')
  })

  test('a ação destrutiva diz a PALAVRA, não confia só no vermelho', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())
    // Para quem não distingue vermelho, o rótulo é o único aviso que resta.
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeInTheDocument()
  })

  test('o atalho continua legível para o leitor de tela', async () => {
    render(
      <Menu gatilho={<Button>Ações</Button>}>
        <ItemMenu atalho="⌘E" onClick={vi.fn()}>Editar</ItemMenu>
      </Menu>,
    )
    await userEvent.click(gatilho())
    // Escondê-lo tiraria a dica de teclado justamente de quem navega por teclado.
    expect(screen.getByRole('menuitem', { name: /Editar/ })).toHaveAccessibleName('Editar ⌘E')
  })

  test('o onClick que já existia no gatilho continua funcionando', async () => {
    const aoClicar = vi.fn()
    render(
      <Menu gatilho={<Button onClick={aoClicar}>Ações</Button>}>
        <ItemMenu onClick={vi.fn()}>Editar</ItemMenu>
      </Menu>,
    )
    await userEvent.click(gatilho())
    // O Menu clona o gatilho — não pode sequestrar o handler de quem o passou.
    expect(aoClicar).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  test('aria-controls aponta para o painel aberto', async () => {
    render(<MenuDeTeste />)
    await userEvent.click(gatilho())
    expect(gatilho()).toHaveAttribute('aria-controls', screen.getByRole('menu').id)
  })
})
