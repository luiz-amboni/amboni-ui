import { createRef, useState } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Selecao, type OpcaoSelecao, type SelecaoRef } from './Selecao'

const opcoes: OpcaoSelecao[] = [
  { valor: 'bling', rotulo: 'Bling' },
  { valor: 'shopify', rotulo: 'Shopify' },
  { valor: 'tiny', rotulo: 'Tiny', desabilitada: true },
  { valor: 'omie', rotulo: 'Omie' },
]

/** Envolve em estado real: um select controlado que nunca atualiza esconde bug de valor. */
function SelecaoControlada(props: { buscavel?: boolean; inicial?: string; aoMudar?: (v: string) => void }) {
  const [valor, setValor] = useState(props.inicial ?? '')
  return (
    <Selecao
      aria-label="Integração"
      opcoes={opcoes}
      valor={valor}
      buscavel={props.buscavel}
      placeholder="Escolha a integração"
      onChange={v => {
        setValor(v)
        props.aoMudar?.(v)
      }}
    />
  )
}

describe('Selecao — modo nativo (o padrão)', () => {
  test('é um <select> de verdade — é dele que vem a roda nativa do celular', () => {
    render(<Selecao aria-label="Integração" opcoes={opcoes} valor="" onChange={vi.fn()} />)
    // Se um dia isto virar uma <div role="combobox">, o teste quebra e a decisão volta à mesa.
    expect(screen.getByRole('combobox', { name: 'Integração' }).tagName).toBe('SELECT')
  })

  test('o rótulo acha o controle', () => {
    render(<Selecao aria-label="Integração" opcoes={opcoes} valor="" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Integração')).toBeInTheDocument()
  })

  test('onChange recebe o VALOR da opção, não o evento', async () => {
    const aoMudar = vi.fn()
    render(<SelecaoControlada aoMudar={aoMudar} />)

    await userEvent.selectOptions(screen.getByLabelText('Integração'), 'shopify')
    // Quem chama quer o dado. Entregar o evento obrigaria todo consumidor a escrever
    // `e.target.value` e a conhecer o DOM por baixo.
    expect(aoMudar).toHaveBeenCalledWith('shopify')
  })

  test('opção desabilitada não é escolhível', async () => {
    const aoMudar = vi.fn()
    render(<SelecaoControlada aoMudar={aoMudar} />)

    expect(screen.getByRole('option', { name: 'Tiny' })).toBeDisabled()

    // Tentar escolher não estoura — simplesmente não acontece nada, que é exatamente o que
    // o navegador faz. A prova de que está travada de verdade (e não só apagada no visual)
    // é o onChange nunca disparar.
    await userEvent.selectOptions(screen.getByLabelText('Integração'), 'tiny')
    expect(aoMudar).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Integração')).not.toHaveValue('tiny')
  })

  test('o placeholder não é escolhível como se fosse um valor', () => {
    render(<SelecaoControlada />)
    // Sem `disabled`, a pessoa "escolhe" o texto de instrução e manda '' para o formulário.
    expect(screen.getByRole('option', { name: 'Escolha a integração' })).toBeDisabled()
  })

  test('com `limpavel`, o placeholder VIRA o caminho de volta para o vazio', () => {
    // No celular é assim que se limpa dentro da roda nativa — melhor que caçar o X.
    render(<Selecao aria-label="Integração" opcoes={opcoes} valor="bling" onChange={vi.fn()} placeholder="Escolha" limpavel />)
    expect(screen.getByRole('option', { name: 'Escolha' })).toBeEnabled()
  })

  test('o X limpa a escolha', async () => {
    const aoMudar = vi.fn()
    render(<Selecao aria-label="Integração" opcoes={opcoes} valor="bling" onChange={aoMudar} limpavel />)

    await userEvent.click(screen.getByRole('button', { name: 'Limpar escolha' }))
    expect(aoMudar).toHaveBeenCalledWith('')
  })

  test('sem escolha não há o que limpar — o X nem aparece', () => {
    render(<Selecao aria-label="Integração" opcoes={opcoes} valor="" onChange={vi.fn()} limpavel />)
    expect(screen.queryByRole('button', { name: 'Limpar escolha' })).not.toBeInTheDocument()
  })

  test('o ref chega no elemento nativo', () => {
    const ref = createRef<SelecaoRef>()
    render(<Selecao ref={ref} aria-label="Integração" opcoes={opcoes} valor="" onChange={vi.fn()} />)
    // O uso real é `.focus()` — mandar o foco para o campo que falhou na validação.
    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })

  test('grupo vira <optgroup> — o nativo já sabe agrupar', () => {
    render(
      <Selecao
        aria-label="Integração"
        valor=""
        onChange={vi.fn()}
        opcoes={[
          { valor: 'a', rotulo: 'Bling', grupo: 'ERP' },
          { valor: 'b', rotulo: 'Shopify', grupo: 'Loja' },
        ]}
      />,
    )
    expect(screen.getByRole('group', { name: 'ERP' })).toBeInTheDocument()
  })

  test('erro: mensagem ligada ao campo por aria-describedby, não só borda vermelha', () => {
    render(
      <Selecao aria-label="Integração" opcoes={opcoes} valor="" onChange={vi.fn()} erro="Escolha uma integração" />,
    )
    const campo = screen.getByLabelText('Integração')
    expect(campo).toBeInvalid()
    // Sem o vínculo, quem usa leitor de tela ouve "inválido" e nunca o motivo.
    expect(campo).toHaveAccessibleDescription('Escolha uma integração')
  })
})

describe('Selecao — modo buscável (combobox)', () => {
  test('vira combobox com listbox controlado — o contrato ARIA inteiro', async () => {
    render(<SelecaoControlada buscavel />)
    const campo = screen.getByRole('combobox', { name: 'Integração' })

    expect(campo).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(campo)
    expect(campo).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
  })

  test('digitar filtra a lista', async () => {
    render(<SelecaoControlada buscavel />)
    await userEvent.type(screen.getByRole('combobox'), 'shop')

    expect(screen.getByRole('option', { name: 'Shopify' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Bling' })).not.toBeInTheDocument()
  })

  test('a busca ignora acento — ninguém acentua enquanto filtra', async () => {
    render(
      <Selecao
        aria-label="Cidade"
        valor=""
        onChange={vi.fn()}
        buscavel
        opcoes={[{ valor: 'sp', rotulo: 'São Paulo' }, { valor: 'rj', rotulo: 'Rio de Janeiro' }]}
      />,
    )
    await userEvent.type(screen.getByRole('combobox'), 'sao')
    // Exigir "são" faria a busca parecer quebrada para quem digita rápido.
    expect(screen.getByRole('option', { name: 'São Paulo' })).toBeInTheDocument()
  })

  test('as setas andam e o aria-activedescendant aponta para a opção certa', async () => {
    render(<SelecaoControlada buscavel />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    // Abriu na primeira: é ela que o Enter escolheria agora.
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Bling' }).id)

    await userEvent.keyboard('{ArrowDown}')
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Shopify' }).id)
  })

  test('o foco NÃO sai do campo de busca — é o que separa combobox de menu', async () => {
    render(<SelecaoControlada buscavel />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    await userEvent.keyboard('{ArrowDown}')
    // Se o foco pulasse para a opção, a pessoa não conseguiria continuar digitando o filtro.
    // Quem "anda" é a marca virtual do aria-activedescendant, não o foco real.
    expect(campo).toHaveFocus()
  })

  test('as setas PULAM a opção desabilitada', async () => {
    render(<SelecaoControlada buscavel />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    // Bling → Shopify → (Tiny está desabilitada) → Omie
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Omie' }).id)
  })

  test('as setas circulam nas pontas', async () => {
    render(<SelecaoControlada buscavel />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    // Da primeira para cima → última válida. Sem circular, a seta "trava" e parece quebrada.
    await userEvent.keyboard('{ArrowUp}')
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Omie' }).id)
  })

  test('Home e End vão para a primeira e a última válidas', async () => {
    render(<SelecaoControlada buscavel />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    await userEvent.keyboard('{End}')
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Omie' }).id)

    await userEvent.keyboard('{Home}')
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Bling' }).id)
  })

  test('Enter escolhe a opção ativa e fecha', async () => {
    const aoMudar = vi.fn()
    render(<SelecaoControlada buscavel aoMudar={aoMudar} />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(aoMudar).toHaveBeenCalledWith('shopify')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    // Fechado, o campo mostra o rótulo do escolhido — não o texto que foi digitado.
    expect(campo).toHaveValue('Shopify')
  })

  test('Enter numa opção desabilitada não escolhe nada', async () => {
    const aoMudar = vi.fn()
    render(<SelecaoControlada buscavel aoMudar={aoMudar} />)

    await userEvent.type(screen.getByRole('combobox'), 'tiny')
    // A marca ativa não para em desabilitada, então não há o que o Enter escolha.
    await userEvent.keyboard('{Enter}')
    expect(aoMudar).not.toHaveBeenCalled()
  })

  test('clicar numa opção escolhe (o clique tem que sobreviver ao pointerdown que fecha)', async () => {
    const aoMudar = vi.fn()
    render(<SelecaoControlada buscavel aoMudar={aoMudar} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: 'Omie' }))
    // Sem a checagem `contains` no listener de pointerdown, a lista sumiria no aperto do
    // dedo e este clique nunca chegaria na opção.
    expect(aoMudar).toHaveBeenCalledWith('omie')
  })

  test('clicar numa opção desabilitada não escolhe nada', async () => {
    const aoMudar = vi.fn()
    render(<SelecaoControlada buscavel aoMudar={aoMudar} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: 'Tiny' }))
    expect(aoMudar).not.toHaveBeenCalled()
  })

  test('Esc fecha sem escolher e o foco fica no campo', async () => {
    const aoMudar = vi.fn()
    render(<SelecaoControlada buscavel aoMudar={aoMudar} />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(aoMudar).not.toHaveBeenCalled()
    // Diferente do Menu, aqui o foco nunca saiu do campo — não há nada para devolver.
    expect(campo).toHaveFocus()
  })

  test('clique fora fecha', async () => {
    render(
      <div>
        <SelecaoControlada buscavel />
        <button type="button">fora</button>
      </div>,
    )
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'fora' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  test('reabrir não carrega a busca antiga', async () => {
    render(<SelecaoControlada buscavel />)
    const campo = screen.getByRole('combobox')

    await userEvent.type(screen.getByRole('combobox'), 'shop')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(campo)

    // Se o filtro sobrevivesse, a lista reabriria cortada por uma busca que a pessoa não
    // lembra ter feito — e pareceria que as opções sumiram.
    expect(screen.getByRole('option', { name: 'Bling' })).toBeInTheDocument()
  })

  test('busca sem resultado explica em vez de mostrar lista vazia', async () => {
    render(<SelecaoControlada buscavel />)
    await userEvent.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.getByText(/nada encontrado/i)).toBeInTheDocument()
  })

  test('a opção escolhida é marcada com aria-selected', async () => {
    render(<SelecaoControlada buscavel inicial="omie" />)
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('option', { name: 'Omie' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Bling' })).toHaveAttribute('aria-selected', 'false')
  })

  test('o ref chega no input do combobox', () => {
    const ref = createRef<SelecaoRef>()
    render(<Selecao ref={ref} buscavel aria-label="Integração" opcoes={opcoes} valor="" onChange={vi.fn()} />)
    // Neste modo o elemento nativo é um input — o componente muda de natureza junto com a prop.
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})

// ── A Selecao obedece ao <CampoForm> ────────────────────────────────────────
// Regressão de uma assimetria real: Campo e AreaTexto liam o `aria-invalid` que o
// CampoForm injeta pelo clone, e a Selecao o sobrescrevia para `undefined` — o estado de
// erro do wrapper sumia em silêncio, só neste controle. Uma família de formulário onde
// um membro ignora o wrapper é pior que um wrapper que não existe: o produto declara o
// erro uma vez, acredita que declarou, e o leitor de tela nunca fica sabendo.
describe('Selecao — respeita o erro declarado por fora', () => {
  test.each([
    ['nativo', false],
    ['buscável', true],
  ])('modo %s: o aria-invalid vindo do CampoForm sobrevive', (_nome, buscavel) => {
    render(
      <Selecao
        buscavel={buscavel}
        aria-label="Integração"
        aria-invalid  // é isto que o <CampoForm erro="..."> injeta pelo clone
        opcoes={opcoes}
        valor=""
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('sem erro nenhum, o atributo não é inventado', () => {
    // `aria-invalid="false"` num campo intocado faz o leitor de tela anunciar "inválido,
    // não" — ruído em todo campo da tela. Ausente é o certo.
    render(<Selecao aria-label="Integração" opcoes={opcoes} valor="" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid')
  })
})
