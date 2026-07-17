import { useState } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Autocomplete, type OpcaoAutocomplete } from './Autocomplete'

const clientes: OpcaoAutocomplete[] = [
  { valor: '1', rotulo: 'Ana Souza' },
  { valor: '2', rotulo: 'Bruno Lima' },
  { valor: '3', rotulo: 'Carla Dias', desabilitada: true },
  { valor: '4', rotulo: 'Décio Alves' },
]

/** Envolve em estado real: um campo controlado que nunca atualiza esconde bug de valor. */
function Unico(props: {
  inicial?: string | null
  aoMudar?: (v: string | null) => void
  semResultado?: string
}) {
  const [valor, setValor] = useState<string | null>(props.inicial ?? null)
  return (
    <Autocomplete
      aria-label="Cliente"
      opcoes={clientes}
      valor={valor}
      placeholder="Busque o cliente"
      semResultado={props.semResultado}
      onChange={v => {
        setValor(v)
        props.aoMudar?.(v)
      }}
    />
  )
}

function Multiplo(props: { inicial?: string[]; aoMudar?: (v: string[]) => void }) {
  const [valor, setValor] = useState<string[]>(props.inicial ?? [])
  return (
    <Autocomplete
      multiplo
      aria-label="Clientes"
      opcoes={clientes}
      valor={valor}
      onChange={v => {
        setValor(v)
        props.aoMudar?.(v)
      }}
    />
  )
}

describe('Autocomplete — o contrato ARIA do combobox', () => {
  test('combobox + listbox amarrados por aria-controls', async () => {
    render(<Unico />)
    const campo = screen.getByRole('combobox', { name: 'Cliente' })

    expect(campo).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(campo)
    expect(campo).toHaveAttribute('aria-expanded', 'true')
    expect(campo).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
  })

  test('↑↓ andam e o aria-activedescendant aponta para a opção CERTA', async () => {
    render(<Unico />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    // Abriu na primeira: é ela que o Enter escolheria agora.
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Ana Souza' }).id)

    await userEvent.keyboard('{ArrowDown}')
    // Sem este vínculo o leitor de tela narra a opção errada — a pessoa ouve "Ana" e o Enter
    // escolhe "Bruno". É pior que não anunciar nada.
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Bruno Lima' }).id)
  })

  test('Enter escolhe a opção ativa', async () => {
    const aoMudar = vi.fn()
    render(<Unico aoMudar={aoMudar} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(aoMudar).toHaveBeenCalledWith('2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  test('o foco NUNCA sai do campo — é o que separa combobox de menu (APG)', async () => {
    render(<Unico />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    // Se o foco pulasse para a opção, a pessoa não conseguiria continuar digitando a busca.
    // Quem "anda" é a marca virtual do aria-activedescendant, não o foco real.
    expect(campo).toHaveFocus()
  })

  test('as setas pulam a opção desabilitada', async () => {
    render(<Unico />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    // Ana → Bruno → (Carla está desabilitada) → Décio
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Décio Alves' }).id)
  })

  test('Esc fecha sem escolher e o foco fica no campo', async () => {
    const aoMudar = vi.fn()
    render(<Unico aoMudar={aoMudar} />)
    const campo = screen.getByRole('combobox')

    await userEvent.click(campo)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(aoMudar).not.toHaveBeenCalled()
    // Diferente do Popover, aqui o foco nunca saiu do campo — não há o que devolver.
    expect(campo).toHaveFocus()
  })

  test('a busca local ignora acento — ninguém acentua enquanto filtra', async () => {
    render(<Unico />)
    await userEvent.type(screen.getByRole('combobox'), 'decio')
    expect(screen.getByRole('option', { name: 'Décio Alves' })).toBeInTheDocument()
  })
})

/* ══════════════════════════════════════════════════════════════════════════════
 * A contagem anunciada
 * ════════════════════════════════════════════════════════════════════════════ */
describe('Autocomplete — anuncia quantos resultados achou', () => {
  test('a contagem sai por role="status"', async () => {
    render(<Unico />)
    await userEvent.type(screen.getByRole('combobox'), 'a')

    // Sem isto, quem usa leitor de tela digita e NÃO SABE se achou algo: a lista é visual,
    // e o único jeito de descobrir seria apertar a seta e torcer. Os quatro têm "a" no
    // rótulo — inclusive "Bruno Lima".
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^4 resultados$/))
  })

  test('um resultado é "1 resultado", não "1 resultados"', async () => {
    render(<Unico />)
    await userEvent.type(screen.getByRole('combobox'), 'bruno')
    // Âncora nas pontas: `toHaveTextContent('1 resultado')` casaria com "1 resultados" e o
    // teste passaria justamente no caso que ele existe para pegar. Plural quebrado é o cheiro
    // de software que ninguém revisou — e aqui ele é lido em voz alta.
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^1 resultado$/))
  })

  test('busca sem resultado anuncia E explica na tela', async () => {
    render(<Unico semResultado="Nenhum cliente com esse nome" />)
    await userEvent.type(screen.getByRole('combobox'), 'zzz')

    // Lista vazia sem explicação parece bug. `within` porque o mesmo texto aparece de
    // propósito nos dois lugares: na lista (para o olho) e no status (para o ouvido).
    expect(
      within(screen.getByRole('listbox')).getByText('Nenhum cliente com esse nome'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Nenhum cliente com esse nome'),
    )
  })
})

/* ══════════════════════════════════════════════════════════════════════════════
 * O assíncrono — onde todo mundo erra
 * ════════════════════════════════════════════════════════════════════════════ */
describe('Autocomplete — busca no servidor', () => {
  test('A RESPOSTA FORA DE ORDEM NÃO SOBRESCREVE A MAIS NOVA', async () => {
    // ── O bug clássico, encenado ────────────────────────────────────────────
    // Quem digita "ab" dispara duas buscas: "a" e "ab". A rede não promete ordem nenhuma, e
    // a de "a" — mais LENTA — chega DEPOIS da de "ab". Sem tratar, o resultado velho pinta a
    // tela por cima do novo: o campo mostra "Resultado de A" enquanto o texto diz "ab".
    //
    // Ninguém reproduz isso na própria máquina (localhost responde em ordem). Só aparece em
    // 4G ruim — que é onde os clientes estão. Por isso o teste força a inversão à mão.
    let resolverA: (v: OpcaoAutocomplete[]) => void = () => {}
    let resolverAB: (v: OpcaoAutocomplete[]) => void = () => {}

    const onBuscar = vi.fn((texto: string) => {
      if (texto === 'a') return new Promise<OpcaoAutocomplete[]>(r => { resolverA = r })
      return new Promise<OpcaoAutocomplete[]>(r => { resolverAB = r })
    })

    render(
      <Autocomplete
        aria-label="Cliente" opcoes={[]} valor={null} onChange={vi.fn()} onBuscar={onBuscar}
      />,
    )

    await userEvent.type(screen.getByRole('combobox'), 'ab')
    // Duas, e não três: o campo intocado NÃO busca. Ver `deveBuscar` — foi este teste que
    // pegou o `onBuscar('')` disparando na montagem.
    await waitFor(() => expect(onBuscar).toHaveBeenCalledTimes(2))

    // A busca NOVA ("ab") responde primeiro…
    resolverAB([{ valor: 'novo', rotulo: 'Resultado de AB' }])
    await waitFor(() => expect(screen.getByRole('option', { name: 'Resultado de AB' })).toBeInTheDocument())

    // …e a VELHA ("a") chega atrasada, depois dela.
    resolverA([{ valor: 'velho', rotulo: 'Resultado de A' }])

    // O resultado velho tem que ser JOGADO FORA. Se este teste falhar, o campo está mostrando
    // resposta de um texto que a pessoa já apagou.
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Resultado de A' })).not.toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Resultado de AB' })).toBeInTheDocument()
    })
  })

  test('quem filtra no modo remoto é o SERVIDOR — não filtramos de novo por cima', async () => {
    // Filtrar localmente o que voltou do servidor esconderia o resultado que ele achou por
    // CPF, telefone ou apelido — dados que não estão no rótulo. A busca pareceria não achar
    // um cliente que existe.
    const onBuscar = vi.fn(async () => [{ valor: '9', rotulo: 'Zulmira Rocha' }])
    render(<Autocomplete aria-label="Cliente" opcoes={[]} valor={null} onChange={vi.fn()} onBuscar={onBuscar} />)

    await userEvent.type(screen.getByRole('combobox'), '99887766')
    await waitFor(() => expect(screen.getByRole('option', { name: 'Zulmira Rocha' })).toBeInTheDocument())
  })

  test('minCaracteres segura a busca — e diz por quê', async () => {
    const onBuscar = vi.fn(async () => [])
    render(
      <Autocomplete
        aria-label="Cliente" minCaracteres={3} opcoes={[]} valor={null} onChange={vi.fn()} onBuscar={onBuscar}
      />,
    )

    await userEvent.type(screen.getByRole('combobox'), 'an')
    // Buscar por "a" numa base de 10 mil devolve 4 mil linhas que ninguém lê e derruba o
    // servidor a cada tecla.
    expect(onBuscar).not.toHaveBeenCalled()
    // Campo que não responde parece quebrado: a pessoa precisa saber que falta uma letra.
    expect(
      within(screen.getByRole('listbox')).getByText('Digite ao menos 3 caracteres'),
    ).toBeInTheDocument()

    await userEvent.keyboard('a')
    await waitFor(() => expect(onBuscar).toHaveBeenCalledWith('ana'))
  })

  test('erro de rede não deixa o giro rodando para sempre', async () => {
    const onBuscar = vi.fn(async () => { throw new Error('caiu') })
    render(<Autocomplete aria-label="Cliente" opcoes={[]} valor={null} onChange={vi.fn()} onBuscar={onBuscar} />)

    await userEvent.type(screen.getByRole('combobox'), 'ana')
    // "Buscando…" eterno é o pior dos mundos: a pessoa espera algo que nunca vem.
    await waitFor(() =>
      expect(within(screen.getByRole('listbox')).getByText('Nada encontrado')).toBeInTheDocument(),
    )
  })
})

/* ══════════════════════════════════════════════════════════════════════════════
 * Múltiplo
 * ════════════════════════════════════════════════════════════════════════════ */
describe('Autocomplete — multiplo', () => {
  test('as escolhas viram etiquetas removíveis DENTRO do campo', async () => {
    render(<Multiplo inicial={['1']} />)
    // O X diz O QUE remove: com 8 etiquetas, 8 botões "Remover" idênticos deixam quem usa
    // leitor de tela sem saber qual é qual.
    expect(screen.getByRole('button', { name: 'Remover Ana Souza' })).toBeInTheDocument()
  })

  test('BACKSPACE com o campo vazio remove a última etiqueta', async () => {
    const aoMudar = vi.fn()
    render(<Multiplo inicial={['1', '2']} aoMudar={aoMudar} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.keyboard('{Backspace}')

    // É o que todo campo de destinatário faz (e-mail, Slack, Jira) — quem usa espera. Sem
    // isso, desfazer o que acabou de digitar exige mirar num X de 16px.
    expect(aoMudar).toHaveBeenCalledWith(['1'])
  })

  test('Backspace com TEXTO no campo apaga a letra, não a etiqueta', async () => {
    const aoMudar = vi.fn()
    render(<Multiplo inicial={['1']} aoMudar={aoMudar} />)

    await userEvent.type(screen.getByRole('combobox'), 'br')
    await userEvent.keyboard('{Backspace}')

    // A armadilha: sem checar o campo vazio, quem erra uma letra perde o destinatário
    // anterior junto. O Backspace é do navegador enquanto houver texto.
    expect(aoMudar).not.toHaveBeenCalled()
    expect(screen.getByRole('combobox')).toHaveValue('b')
  })

  test('escolher soma ao array e a lista FICA aberta', async () => {
    const aoMudar = vi.fn()
    render(<Multiplo inicial={['1']} aoMudar={aoMudar} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: 'Bruno Lima' }))

    expect(aoMudar).toHaveBeenCalledWith(['1', '2'])
    // Quem escolhe várias quer escolher a próxima: fechar a cada item transforma três
    // cliques em nove.
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  test('o que já foi escolhido sai da lista', async () => {
    render(<Multiplo inicial={['1']} />)
    await userEvent.click(screen.getByRole('combobox'))

    // Mostrar de novo o que já é etiqueta em cima convida a escolher duas vezes o mesmo.
    expect(screen.queryByRole('option', { name: 'Ana Souza' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Bruno Lima' })).toBeInTheDocument()
  })

  test('o X da etiqueta remove só ela', async () => {
    const aoMudar = vi.fn()
    render(<Multiplo inicial={['1', '2']} aoMudar={aoMudar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remover Ana Souza' }))
    expect(aoMudar).toHaveBeenCalledWith(['2'])
  })
})

/* ══════════════════════════════════════════════════════════════════════════════
 * Criar novo
 * ════════════════════════════════════════════════════════════════════════════ */
describe('Autocomplete — criarNovo', () => {
  test('o "criar" é UM ITEM DA LISTA: as setas chegam nele e o Enter o escolhe', async () => {
    const criar = vi.fn()
    render(<Autocomplete aria-label="Etiqueta" opcoes={clientes} valor={null} onChange={vi.fn()} criarNovo={criar} />)

    await userEvent.type(screen.getByRole('combobox'), 'Zulmira')
    // Um botão solto embaixo da lista precisaria de uma segunda regra de teclado só para ele
    // — e o aria-activedescendant não o alcançaria.
    const opcao = screen.getByRole('option', { name: 'Criar “Zulmira”' })
    expect(opcao).toBeInTheDocument()

    await userEvent.keyboard('{Enter}')
    expect(criar).toHaveBeenCalledWith('Zulmira')
  })

  test('não oferece criar o que já existe', async () => {
    const criar = vi.fn()
    render(<Autocomplete aria-label="Etiqueta" opcoes={clientes} valor={null} onChange={vi.fn()} criarNovo={criar} />)

    await userEvent.type(screen.getByRole('combobox'), 'Ana Souza')
    // Oferecer "Criar “Ana Souza”" com a Ana Souza logo acima é como o sistema criaria
    // duplicata sozinho.
    expect(screen.queryByRole('option', { name: /^Criar/ })).not.toBeInTheDocument()
  })

  test('sem texto não há o que criar', async () => {
    render(<Autocomplete aria-label="Etiqueta" opcoes={clientes} valor={null} onChange={vi.fn()} criarNovo={vi.fn()} />)
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.queryByRole('option', { name: /^Criar/ })).not.toBeInTheDocument()
  })
})

/* ══════════════════════════════════════════════════════════════════════════════
 * Formulário
 * ════════════════════════════════════════════════════════════════════════════ */
describe('Autocomplete — erro e wrapper', () => {
  test('erro: mensagem ligada ao campo por aria-describedby, não só borda vermelha', () => {
    render(
      <Autocomplete aria-label="Cliente" opcoes={clientes} valor={null} onChange={vi.fn()} erro="Escolha um cliente" />,
    )
    const campo = screen.getByRole('combobox')
    expect(campo).toBeInvalid()
    // Sem o vínculo, quem usa leitor de tela ouve "inválido" e nunca o motivo.
    expect(campo).toHaveAccessibleDescription('Escolha um cliente')
  })

  test('o aria-invalid vindo do CampoForm sobrevive', () => {
    // Regressão da mesma assimetria que a Selecao já teve: um controle que sobrescreve para
    // `undefined` o que o wrapper injetou faz o estado de erro sumir em silêncio.
    render(<Autocomplete aria-label="Cliente" aria-invalid opcoes={clientes} valor={null} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('sem erro nenhum, o atributo não é inventado', () => {
    // `aria-invalid="false"` num campo intocado faz o leitor de tela anunciar "inválido,
    // não" — ruído em todo campo da tela.
    render(<Autocomplete aria-label="Cliente" opcoes={clientes} valor={null} onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid')
  })

  test('fechado e único, o campo mostra o RÓTULO do escolhido — não o id', async () => {
    render(<Unico inicial="2" />)
    expect(screen.getByRole('combobox')).toHaveValue('Bruno Lima')
  })
})
