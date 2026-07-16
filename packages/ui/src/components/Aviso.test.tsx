import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRef } from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProvedorAvisos, useAviso, type AvisoOpcoes } from './Aviso'

/**
 * Relógio falso em tudo: metade das promessas deste componente é sobre TEMPO (some
 * depois de X, pausa no hover, erro não some). Testar isso com relógio de verdade
 * significaria esperar 5 segundos de verdade por teste.
 *
 * ## As DUAS armadilhas de "userEvent + fake timers"
 *
 * 1. O userEvent tem um relógio próprio para simular ponteiro e digitação. Sem
 *    `advanceTimers`, ele espera por um relógio que ninguém está tocando e o teste
 *    trava até estourar o timeout.
 *
 * 2. A não óbvia, e que custa uma tarde: a Testing Library, depois de CADA interação,
 *    drena a fila de microtasks com um `setTimeout(resolve, 0)` — e só adianta o
 *    relógio para fazê-lo disparar se existir um global `jest`. Sob o Vitest esse
 *    global não existe, ninguém adianta o relógio falso, o `setTimeout(0)` nunca
 *    dispara e **todo `await user.click()` trava para sempre**. O sintoma não tem nada
 *    a ver com a causa: qualquer clique, até num `<button>` pelado, pendura o teste.
 *
 * O `jest` abaixo é só isso: um bilhete dizendo à Testing Library como adiantar o
 * relógio do Vitest (que é o do sinon, não o do Jest). Três linhas no lugar de
 * `shouldAdvanceTime: true` — que resolveria o travamento mas faria o relógio andar
 * sozinho junto com o tempo real, e aí as asserções de fronteira deste arquivo
 * ("4999ms ainda está lá, 5001ms sumiu") passariam a depender de quão rápido a máquina
 * do dia rodou o teste. Um teste de tempo que às vezes falha não vale nada.
 */
function ligarRelogioFalso() {
  ;(globalThis as unknown as { jest?: unknown }).jest = {
    advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
  }
  vi.useFakeTimers()
}

function desligarRelogioFalso() {
  vi.useRealTimers()
  delete (globalThis as unknown as { jest?: unknown }).jest
}

function usuario() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

/** Avança o relógio dentro de `act`: o timeout do aviso chama setState, e um setState
 *  fora do act é uma atualização que o React pode nem ter processado quando o expect
 *  roda — o teste passa ou falha conforme o dia. */
function avancar(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function Disparador({ opcoes, rotulo = 'disparar' }: { opcoes: AvisoOpcoes; rotulo?: string }) {
  const aviso = useAviso()
  return (
    <button onClick={() => aviso.mostrar(opcoes)}>{rotulo}</button>
  )
}

beforeEach(ligarRelogioFalso)
afterEach(desligarRelogioFalso)

describe('Aviso — o anúncio para quem não vê a tela', () => {
  test('a região aria-live EXISTE antes do primeiro aviso, e vazia', () => {
    // O bug nº 1 das bibliotecas de toast. O leitor de tela observa as regiões vivas
    // que JÁ existiam; uma região criada junto com o primeiro aviso nasce com o
    // conteúdo dentro e tipicamente não anuncia nada. Sintoma cruel: perfeito no olho,
    // mudo para quem depende do leitor. Por isso a região é montada vazia, desde o
    // primeiro render.
    const { container } = render(
      <ProvedorAvisos>
        <p>app</p>
      </ProvedorAvisos>,
    )

    const regiao = container.querySelector('[aria-live]')
    expect(regiao).toBeTruthy()
    expect(regiao).toBeEmptyDOMElement()
  })

  test('a região só anuncia o que ENTRA (aria-relevant)', () => {
    // Sem isto, fechar um aviso faz o leitor de tela ler a remoção: a pessoa dispensa
    // a mensagem e ouve a mensagem de novo, como prêmio.
    const { container } = render(<ProvedorAvisos />)
    expect(container.querySelector('[aria-live]')).toHaveAttribute('aria-relevant', 'additions')
  })

  test('erro INTERROMPE a leitura (role="alert")', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Falhou', tom: 'erro' }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
  })

  test('sucesso ESPERA a leitura terminar (role="status")', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Salvo', tom: 'sucesso' }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))
    // Marcar tudo como `alert` é gritar toda frase: a pessoa desliga o recurso e aí
    // nem o erro de verdade chega.
    expect(screen.getByRole('status')).toHaveTextContent('Salvo')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Aviso — tempo de tela (WCAG 2.2.1)', () => {
  test('some depois da duração pedida', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Copiado', duracao: 5000 }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))
    expect(screen.getByText('Copiado')).toBeInTheDocument()

    avancar(4999)
    expect(screen.getByText('Copiado')).toBeInTheDocument() // ainda não

    avancar(2)
    expect(screen.queryByText('Copiado')).not.toBeInTheDocument()
  })

  test('sem duração explícita, o piso é 5s — nunca os 3s da praxe', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Salvo', tom: 'sucesso' }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    // 3s é o padrão da indústria e some antes de quem lê devagar, de quem usa lupa e de
    // quem só desviou o olho para o teclado.
    avancar(4999)
    expect(screen.getByText('Salvo')).toBeInTheDocument()

    avancar(2)
    expect(screen.queryByText('Salvo')).not.toBeInTheDocument()
  })

  test('texto maior fica mais tempo na tela', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador
          opcoes={{
            titulo: 'A sincronização com o Bling terminou com dezoito pedidos novos e três atualizados',
            tom: 'sucesso',
          }}
        />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    // Quem escreve mais precisa dar mais tempo de leitura. 5s de piso não servem para
    // um parágrafo.
    avancar(5001)
    expect(screen.getByText(/sincronização com o Bling/)).toBeInTheDocument()
  })

  test('ERRO não some sozinho — fica até fecharem', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Não foi possível enviar', tom: 'erro' }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    // Um erro que evapora deixa a pessoa com o problema e sem o texto do problema —
    // justamente o texto que ela copiaria para pedir ajuda.
    avancar(60_000)
    expect(screen.getByText('Não foi possível enviar')).toBeInTheDocument()
  })

  test('aviso com AÇÃO não some sozinho — senão o botão foge', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Mensagem agendada', acao: { rotulo: 'Desfazer', onClick: vi.fn() } }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    // Sumir sozinho levaria o "Desfazer" junto: a pessoa vê o botão, move o mouse, e o
    // botão some no caminho. Um aviso com ação é uma pergunta — pergunta espera resposta.
    avancar(60_000)
    expect(screen.getByRole('button', { name: 'Desfazer' })).toBeInTheDocument()
  })

  test('`duracao` explícita vence as regras automáticas (saída de emergência)', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Erro bobo', tom: 'erro', duracao: 5000 }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))
    avancar(5001)
    // Quem passou um número assumiu a decisão. A biblioteca opina, não algema.
    expect(screen.queryByText('Erro bobo')).not.toBeInTheDocument()
  })
})

describe('Aviso — hover e foco pausam o cronômetro', () => {
  test('hover PAUSA e sair RETOMA, contando só o que sobrou', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Copiado', duracao: 5000 }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    avancar(3000) // gastou 3s dos 5s
    await user.hover(screen.getByText('Copiado'))

    // Ler uma mensagem não pode ser uma corrida contra o relógio (WCAG 2.2.1).
    avancar(60_000)
    expect(screen.getByText('Copiado')).toBeInTheDocument()

    await user.unhover(screen.getByText('Copiado'))

    // Retomar é continuar de onde parou, não recomeçar: sobravam 2s.
    avancar(1999)
    expect(screen.getByText('Copiado')).toBeInTheDocument()
    avancar(2)
    expect(screen.queryByText('Copiado')).not.toBeInTheDocument()
  })

  test('o FOCO pausa também — quem usa teclado não perde o aviso por baixo do foco', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Copiado', duracao: 5000 }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    // Quem navega por teclado chega no X pelo Tab. Se o aviso continuasse correndo, ele
    // sumiria com o foco em cima — e o foco iria parar no <body>, do nada.
    act(() => {
      screen.getByRole('button', { name: /Fechar aviso/ }).focus()
    })
    avancar(60_000)
    expect(screen.getByText('Copiado')).toBeInTheDocument()
  })

  test('hover pausa a PILHA inteira, não só o aviso sob o cursor', async () => {
    const user = usuario()
    function Dois() {
      const aviso = useAviso()
      return (
        <button
          onClick={() => {
            aviso.mostrar({ titulo: 'Primeiro', duracao: 5000 })
            aviso.mostrar({ titulo: 'Segundo', duracao: 5000 })
          }}
        >
          disparar
        </button>
      )
    }
    render(
      <ProvedorAvisos>
        <Dois />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))
    await user.hover(screen.getByText('Primeiro'))
    avancar(60_000)

    // Se os outros continuassem correndo, o de baixo sumiria enquanto a pessoa lê o de
    // cima — e a pilha se reposiciona justamente sob o olho dela.
    expect(screen.getByText('Segundo')).toBeInTheDocument()
  })
})

describe('Aviso — a pilha tem limite e o excedente espera', () => {
  test('mostra até o limite; o excedente NÃO some, fica na fila', async () => {
    const user = usuario()
    function Quatro() {
      const aviso = useAviso()
      return (
        <button
          onClick={() => {
            aviso.mostrar({ titulo: 'Um', fixo: true })
            aviso.mostrar({ titulo: 'Dois', fixo: true })
            aviso.mostrar({ titulo: 'Três', fixo: true })
            aviso.mostrar({ titulo: 'Quatro', fixo: true })
          }}
        >
          disparar
        </button>
      )
    }
    render(
      <ProvedorAvisos limite={3}>
        <Quatro />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    // 20 avisos empilhados viram uma parede que tampa a tela e ninguém lê.
    expect(screen.getByText('Um')).toBeInTheDocument()
    expect(screen.getByText('Três')).toBeInTheDocument()
    expect(screen.queryByText('Quatro')).not.toBeInTheDocument()

    // Descartar o novo perderia informação; empurrar o antigo para fora arrancaria da
    // tela o que a pessoa pode estar lendo agora. A fila não faz nem um nem outro.
    await user.click(screen.getByRole('button', { name: 'Fechar aviso: Um' }))
    expect(screen.getByText('Quatro')).toBeInTheDocument()
  })

  test('o cronômetro do que está na fila só começa quando ele APARECE', async () => {
    const user = usuario()
    function Dois() {
      const aviso = useAviso()
      const idRef = useRef('')
      return (
        <>
          <button
            onClick={() => {
              idRef.current = aviso.mostrar({ titulo: 'Na tela', fixo: true })
              aviso.mostrar({ titulo: 'Na fila', duracao: 5000 })
            }}
          >
            disparar
          </button>
          {/* A vaga é liberada por um botão FORA da região dos avisos, de propósito.
              Fechar pelo X deixaria o cursor parado sobre a pilha — e a pilha, como
              promete, continuaria pausada até o mouse se mexer. O teste passaria a
              medir a pausa em vez do cronômetro da fila. */}
          <button onClick={() => aviso.fechar(idRef.current)}>liberar vaga</button>
        </>
      )
    }
    render(
      <ProvedorAvisos limite={1}>
        <Dois />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    // Se o relógio corresse na fila, o aviso venceria a validade esperando a vez e
    // apareceria por um piscar — ou nem apareceria.
    avancar(60_000)
    await user.click(screen.getByRole('button', { name: 'liberar vaga' }))
    expect(screen.getByText('Na fila')).toBeInTheDocument()

    avancar(5001)
    expect(screen.queryByText('Na fila')).not.toBeInTheDocument()
  })
})

describe('Aviso — fechar', () => {
  test('o X diz QUAL aviso fecha', async () => {
    const user = usuario()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Cliente salvo', fixo: true }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))

    // Com três avisos na tela, três botões "Fechar" são indistinguíveis na lista de
    // botões do leitor de tela: a pessoa não sabe qual está fechando.
    await user.click(screen.getByRole('button', { name: 'Fechar aviso: Cliente salvo' }))
    expect(screen.queryByText('Cliente salvo')).not.toBeInTheDocument()
  })

  test('clicar na ação executa e fecha', async () => {
    const user = usuario()
    const desfazer = vi.fn()
    render(
      <ProvedorAvisos>
        <Disparador opcoes={{ titulo: 'Mensagem agendada', acao: { rotulo: 'Desfazer', onClick: desfazer } }} />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'disparar' }))
    await user.click(screen.getByRole('button', { name: 'Desfazer' }))

    expect(desfazer).toHaveBeenCalledOnce()
    // A ação já foi tomada: deixar o botão na tela convida a clicar de novo.
    expect(screen.queryByText('Mensagem agendada')).not.toBeInTheDocument()
  })

  test('`fechar(id)` fecha na mão — o caso do "enviando..."', async () => {
    const user = usuario()
    function Fluxo() {
      const aviso = useAviso()
      // useRef, não um objeto solto: mostrar um aviso repinta este componente, e um
      // `{ current }` criado no corpo do render nasceria vazio de novo — o id se perde
      // e o "terminar" não fecha nada.
      const idRef = useRef('')
      return (
        <>
          <button onClick={() => (idRef.current = aviso.mostrar({ titulo: 'Enviando...', fixo: true }))}>abrir</button>
          <button onClick={() => aviso.fechar(idRef.current)}>terminar</button>
        </>
      )
    }
    // O id devolvido pelo `mostrar` é o que torna isto possível sem estado global.
    render(
      <ProvedorAvisos>
        <Fluxo />
      </ProvedorAvisos>,
    )

    await user.click(screen.getByRole('button', { name: 'abrir' }))
    expect(screen.getByText('Enviando...')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'terminar' }))
    expect(screen.queryByText('Enviando...')).not.toBeInTheDocument()
  })
})

describe('Aviso — uso errado', () => {
  test('useAviso() sem provedor falha alto, na hora', () => {
    // Sem o provedor o aviso não teria onde aparecer e o `mostrar` viraria um no-op
    // silencioso: a pessoa clica em "Salvar", nada acontece, e o bug só aparece em
    // produção. Melhor quebrar no primeiro render, na cara de quem está codando.
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Solto() {
      useAviso()
      return null
    }
    expect(() => render(<Solto />)).toThrow(/ProvedorAvisos/)
    silencio.mockRestore()
  })
})
