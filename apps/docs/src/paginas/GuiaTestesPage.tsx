import { Secao, P, H3, Bloco, Aviso, Titulo, FacaNaoFaca } from '../lib/blocos'

export default function GuiaTestesPage() {
  return (
    <>
      <Titulo
        eyebrow="Guias"
        lead="Um teste que confere classe CSS passa verde com o componente quebrado. Aqui testamos o que a pessoa faz e o que o leitor de tela ouve."
      >
        Testes
      </Titulo>

      <Secao titulo="A filosofia da casa, em uma linha">
        <P>
          <strong>Teste comportamento e acessibilidade. Nunca classe CSS.</strong> "A classe é{' '}
          <code>amb-btn--primary</code>" não prova nada para quem usa; "o clique não dispara
          enquanto carrega" prova.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: "getByRole('button', { name: 'Salvar' })",
            texto: 'Se o teste acha o botão pelo papel e pelo nome, é porque um leitor de tela também acha. O teste vira, de graça, uma auditoria de acessibilidade.',
          }}
          naoFaca={{
            titulo: "container.querySelector('.amb-btn')",
            texto: 'Prova que existe uma div com uma classe. Não prova que dá para clicar, focar, ou que alguém sem visão sabe o que ela faz. E quebra quando renomeamos a classe — um refactor sem risco nenhum.',
          }}
        />
        <P>
          A ferramenta é Vitest + Testing Library. O setup mora em{' '}
          <code>packages/ui/src/test-setup.ts</code> — leia-o antes de qualquer outra coisa; é onde
          está o remendo da seção "a armadilha".
        </P>
      </Secao>

      <Secao titulo="O que testar: o contrato, não a implementação">
        <P>
          O <code>Button.test.tsx</code> é o modelo. Repare que nenhum teste sabe como o botão é
          feito por dentro:
        </P>
        <Bloco lang="jsx">{`test('mostra o rótulo e dispara o clique', async () => {
  const aoClicar = vi.fn()
  render(<Button onClick={aoClicar}>Salvar alterações</Button>)

  await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(aoClicar).toHaveBeenCalledOnce()
})

test('não dispara clique duplicado enquanto carrega', async () => {
  const aoClicar = vi.fn()
  render(<Button loading onClick={aoClicar}>Salvar</Button>)

  await userEvent.click(screen.getByRole('button'))
  // Sem isto, dois cliques rápidos = dois pedidos = dois cadastros duplicados.
  expect(aoClicar).not.toHaveBeenCalled()
})`}</Bloco>
        <P>
          O segundo teste é o tipo que paga o aluguel: ele descreve um <strong>prejuízo</strong>{' '}
          (dois cadastros duplicados), não uma aparência. Se um dia trocarmos o mecanismo de
          bloqueio, o teste continua valendo — porque ele nunca soube qual era o mecanismo.
        </P>

        <H3>Quando a classe CSS é a única testemunha</H3>
        <P>
          Existe exceção, e ela está no <code>StatCard.test.tsx</code>. "Custo subindo é ruim" é uma
          decisão que <em>só</em> se manifesta em cor:
        </P>
        <Bloco lang="jsx">{`test('custo subindo é RUIM (betterWhenUp=false)', () => {
  const { container } = render(
    <StatCard label="Custo" value="R$ 14,25" delta={{ percent: 46, betterWhenUp: false }} />,
  )
  expect(container.querySelector('.amb-stat__delta--bad')).toBeTruthy()
})`}</Bloco>
        <P>
          Repare que o arquivo <strong>não para aí</strong>. O teste vizinho é o que importa de
          verdade:
        </P>
        <Bloco lang="jsx">{`test('a cor NUNCA é o único sinal: texto e seta também dizem', () => {
  const { container } = render(
    <StatCard label="Custo" value="R$ 14,25" delta={{ percent: 46, betterWhenUp: false }} />,
  )
  // Quem não distingue vermelho de verde precisa entender do mesmo jeito.
  expect(screen.getByText('46%')).toBeInTheDocument()
  expect(screen.getByText('vs. anterior')).toBeInTheDocument()
  expect(container.querySelector('svg')).toBeTruthy()
})`}</Bloco>
        <P>
          A regra que sai daí: <strong>conferir classe é aceitável quando a classe é o único
          lugar onde a decisão existe — e nesse caso um teste irmão precisa provar que a
          informação também chega sem a cor.</strong> Cerca de 1 em cada 12 homens não distingue
          vermelho de verde. Um design system que só testa a cor está testando o que essas
          pessoas não veem.
        </P>
      </Secao>

      <Secao titulo="A armadilha: userEvent + fake timers travam o Vitest">
        <Aviso tipo="warn">
          <strong>Isto custou uma tarde a dois agentes deste projeto, em paralelo, sem que um
          soubesse do outro.</strong> Se você ligou <code>vi.useFakeTimers()</code> e todo{' '}
          <code>await user.click()</code> passou a travar até estourar o timeout, é isto. Não é o
          seu componente.
        </Aviso>
        <P>
          O sintoma não tem <em>nenhuma</em> relação com a causa: trava até num{' '}
          <code>&lt;button&gt;</code> pelado, sem estado, sem efeito, sem timer. Você passa a tarde
          olhando o componente errado.
        </P>

        <H3>A causa</H3>
        <P>
          Depois de cada interação, a Testing Library drena a fila de microtasks com um{' '}
          <code>setTimeout(resolve, 0)</code>. Com relógio falso, esse timer só dispara se alguém
          adiantar o relógio — e a Testing Library só sabe adiantar o relógio{' '}
          <strong>se existir um global <code>jest</code></strong>. Sob o Vitest esse global não
          existe. Ninguém adianta o relógio, o <code>setTimeout(0)</code> nunca dispara, e a espera
          fica pendurada para sempre.
        </P>

        <H3>O remendo (já está em test-setup.ts)</H3>
        <Bloco lang="ts">{`// packages/ui/src/test-setup.ts
;(globalThis as unknown as { jest?: unknown }).jest = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
}`}</Bloco>
        <P>
          É só um bilhete dizendo à Testing Library como adiantar o relógio do Vitest — que é o do
          sinon, não o do Jest. Fica instalado sempre e é inócuo com relógio real:{' '}
          <code>advanceTimersByTime</code> sem relógio falso não faz nada.
        </P>
        <P>
          No arquivo de teste, o <code>userEvent</code> ainda precisa do <em>seu</em> caminho para o
          relógio (ele tem um cronômetro próprio para simular ponteiro e digitação):
        </P>
        <Bloco lang="ts">{`function usuario() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}`}</Bloco>
        <P>São duas armadilhas, não uma. O <code>advanceTimers</code> do setup resolve o cronômetro
          do userEvent; o global <code>jest</code> resolve o dreno de microtasks da Testing Library.
          Faltando qualquer um dos dois, trava igual.</P>

        <H3>Por que não shouldAdvanceTime: true</H3>
        <P>
          Existe um atalho: <code>vi.useFakeTimers({'{ shouldAdvanceTime: true }'})</code>. Ele
          destrava — e estraga o motivo de existir do relógio falso, porque o relógio passa a
          correr junto com o tempo real. Aí uma asserção de fronteira como a do{' '}
          <code>Aviso.test.tsx</code>:
        </P>
        <Bloco lang="jsx">{`avancar(4999)
expect(screen.getByText('Copiado')).toBeInTheDocument()  // ainda não

avancar(2)
expect(screen.queryByText('Copiado')).not.toBeInTheDocument()`}</Bloco>
        <P>
          passa a depender de quão rápido a máquina do dia rodou o teste. Um teste de tempo que às
          vezes falha não vale nada — <strong>teste instável é pior que teste ausente</strong>,
          porque ensina o time a ignorar vermelho.
        </P>

        <H3>E o avancar() dentro do act()</H3>
        <Bloco lang="ts">{`function avancar(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}`}</Bloco>
        <P>
          O timeout do aviso chama <code>setState</code>. Um <code>setState</code> fora do{' '}
          <code>act</code> é uma atualização que o React pode nem ter processado quando o{' '}
          <code>expect</code> roda — o teste passa ou falha conforme o dia.
        </P>
      </Secao>

      <Secao titulo="Mutation testing: o teste que passava com o bug dentro">
        <P>
          A pergunta que revela um teste inútil: <strong>se eu quebrar o código de propósito, o
          teste fica vermelho?</strong> Se não fica, ele não estava testando nada — só acompanhando.
        </P>
        <P>
          Aconteceu aqui. O agente da Tabela trocou o <code>chaveLinha</code> obrigatório pelo
          índice do array — exatamente o bug que a prop existe para impedir. <strong>Os 40 testes
          continuaram verdes.</strong>
        </P>
        <P>O teste era este:</P>
        <Bloco lang="jsx">{`test('reordenar redesenha as linhas na ordem nova', () => {
  const { rerender } = renderTabela()
  const invertido = [...clientes].reverse()
  rerender(<Tabela colunas={colunas} linhas={invertido} chaveLinha={(l) => l.id} />)

  expect(screen.getAllByRole('rowheader').map((l) => l.textContent)).toEqual([
    'Carla Dias', 'Bruno Lima', 'Ana Souza',
  ])
})`}</Bloco>
        <P>
          Ele confere a ordem do <strong>texto</strong>. E o React reescreve o texto de qualquer
          jeito — com key errada ele reaproveita o nó e sobrescreve o conteúdo. O resultado na tela
          é idêntico. O teste nunca teve chance de pegar o bug.
        </P>

        <H3>A reescrita: estado que só vive no DOM</H3>
        <P>
          A key só importa para o que o React <em>não</em> reescreve: texto digitado, checkbox
          marcado, foco, rolagem. Estado não controlado. Daí o <code>{'<input defaultValue>'}</code>:
        </P>
        <Bloco lang="jsx">{`test('a identidade viaja com o REGISTRO, não com a posição', async () => {
  const comNota: Coluna<Cliente>[] = [
    { chave: 'nome', titulo: 'Cliente' },
    { chave: 'nota', titulo: 'Nota', render: (l) => <input defaultValue="" aria-label={\`Nota de \${l.nome}\`} /> },
  ]

  const { rerender } = render(<Tabela colunas={comNota} linhas={clientes} chaveLinha={(l) => l.id} />)
  await userEvent.type(screen.getByLabelText('Nota de Ana Souza'), 'importante')

  rerender(<Tabela colunas={comNota} linhas={[...clientes].reverse()} chaveLinha={(l) => l.id} />)

  // Com índice como key, o React reaproveita o <input> que já estava na posição 1 e o
  // texto fica preso lá — agora sob o nome de outro cliente.
  expect(screen.getByLabelText('Nota de Ana Souza')).toHaveValue('importante')
  expect(screen.getByLabelText('Nota de Carla Dias')).toHaveValue('')
})`}</Bloco>
        <Aviso tipo="warn">
          <strong>A lição, para levar para qualquer projeto: teste de key com estado controlado não
          protege nada.</strong> Se o valor vem de <code>props</code>/<code>useState</code> do pai, o
          React reconcilia e a tela fica certa mesmo com a key errada. Só o estado que mora no DOM
          — <code>defaultValue</code>, <code>defaultChecked</code>, foco, seleção de texto — denuncia
          a key trocada. É por isso que o bug real era tão feio: a pessoa ordenava a lista e o
          checkbox marcado ficava na linha errada. Alguém apagou o cliente errado por causa disso.
        </Aviso>
      </Secao>

      <Secao titulo="Componente com <dialog>: o jsdom não tem um">
        <P>
          O <code>HTMLDialogElement</code> do jsdom 25 é uma casca: tem o <code>open</code>{' '}
          (atributo refletido) e mais nada. <strong>Não existe <code>showModal</code>,{' '}
          <code>close</code>, evento <code>cancel</code>, top layer nem <code>::backdrop</code></strong> —
          a implementação é literalmente uma classe vazia. Sem dublê, o <code>Dialogo</code> estoura
          no primeiro render e nenhum teste de modal roda.
        </P>
        <P>
          O dublê do <code>Dialogo.test.tsx</code> imita só o contrato que o componente usa — mas
          imita <strong>do jeito que o navegador se comporta</strong>, inclusive nas partes chatas:
        </P>
        <Bloco lang="ts">{`const abertos: HTMLDialogElement[] = []

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    // O navegador LANÇA ao abrir um dialog já aberto. Um mock que não lançasse
    // passaria verde com o bug em produção.
    if (this.open) {
      throw new DOMException('The element already has an "open" attribute', 'InvalidStateError')
    }
    this.open = true
    abertos.push(this)
    // O navegador manda o foco para dentro do modal ao abrir. Sem isto, o teste do
    // "foco volta para quem abriu" passaria sozinho — o foco nunca teria saído.
    this.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )?.focus()
  }

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    abertos.splice(abertos.indexOf(this), 1)
    this.dispatchEvent(new Event('close'))
  }

  // O Esc do navegador: 'cancel' cancelável no dialog do topo e, se ninguém barrar, fecha.
  document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return
    const topo = abertos[abertos.length - 1]
    if (!topo) return
    if (topo.dispatchEvent(new Event('cancel', { cancelable: true }))) topo.close()
  })
})`}</Bloco>
        <P>
          <strong>O ponto do dublê não é fazer o teste rodar. É fazer o teste mentir o mínimo
          possível.</strong> As duas partes acima — o <code>showModal</code> que lança e o{' '}
          <code>cancel</code> cancelável — são exatamente os dois comportamentos que o{' '}
          <code>Dialogo</code> existe para tratar. Um dublê simpático, que só ligasse{' '}
          <code>open = true</code>, deixaria passar o bug clássico: o navegador fecha o dialog no
          Esc sem passar pelo React, o estado fica <code>aberto: true</code> para sempre, e o modal
          nunca mais abre.
        </P>

        <H3>O outro buraco: o jsdom não faz layout</H3>
        <P>
          Todo retângulo é zero. "Dentro" e "fora" são o mesmo ponto, e o teste de clique no fundo
          não prova nada. Finja um:
        </P>
        <Bloco lang="ts">{`function fingirRetangulo(el: Element, r: { left: number; top: number; right: number; bottom: number }) {
  el.getBoundingClientRect = () =>
    ({ ...r, x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top, toJSON: () => '' }) as DOMRect
}`}</Bloco>
        <P>
          Vale para qualquer teste que dependa de geometria — clique no backdrop, posição de dica,
          menu que decide abrir para cima. Se o seu teste de posição passa sem isso, ele está
          passando por acidente.
        </P>
      </Secao>

      <Secao titulo="Testar o ProvedorAvisos">
        <P>
          O <code>useAviso()</code> exige um <code>&lt;ProvedorAvisos&gt;</code> acima na árvore —
          então todo teste renderiza os dois. O padrão é um componente-disparador de três linhas:
        </P>
        <Bloco lang="jsx">{`function Disparador({ opcoes }: { opcoes: AvisoOpcoes }) {
  const aviso = useAviso()
  return <button onClick={() => aviso.mostrar(opcoes)}>disparar</button>
}

test('erro INTERROMPE a leitura (role="alert")', async () => {
  const user = usuario()
  render(
    <ProvedorAvisos>
      <Disparador opcoes={{ titulo: 'Falhou', tom: 'erro' }} />
    </ProvedorAvisos>,
  )

  await user.click(screen.getByRole('button', { name: 'disparar' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
})`}</Bloco>
        <P>
          Repare no que está sendo afirmado: <strong>não</strong> "o aviso apareceu", e sim "o aviso
          apareceu com o papel que interrompe o leitor de tela". <code>role="alert"</code> para erro,{' '}
          <code>role="status"</code> para o resto. Um teste de <code>getByText('Falhou')</code> passaria
          nos dois casos e não protegeria a decisão.
        </P>

        <H3>O teste que quase ninguém escreve</H3>
        <Bloco lang="jsx">{`test('a região aria-live EXISTE antes do primeiro aviso, e vazia', () => {
  const { container } = render(<ProvedorAvisos><p>app</p></ProvedorAvisos>)

  const regiao = container.querySelector('[aria-live]')
  expect(regiao).toBeTruthy()
  expect(regiao).toBeEmptyDOMElement()
})`}</Bloco>
        <P>
          É o bug nº 1 das bibliotecas de toast, e é o único teste desta página que usa{' '}
          <code>querySelector</code> sem pedir desculpas — porque uma região viva <em>vazia</em> não
          tem role, nem nome, nem texto: não há por onde pegá-la a não ser pelo atributo.
        </P>
        <P>
          O leitor de tela monta a lista de regiões vivas quando a página carrega e observa as que
          já existiam. Uma região <code>aria-live</code> criada junto com o primeiro aviso nasce com
          o conteúdo dentro e tipicamente não anuncia nada. <strong>O sintoma é cruel: funciona
          perfeitamente no olho, passa em todo teste visual, e quem depende de leitor de tela
          simplesmente nunca é avisado de nada.</strong> Nenhum teste de comportamento pegaria isso —
          por isso ele é explícito.
        </P>

        <H3>Uso errado também é contrato</H3>
        <Bloco lang="jsx">{`test('useAviso() sem provedor falha alto, na hora', () => {
  const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})
  function Solto() {
    useAviso()
    return null
  }
  expect(() => render(<Solto />)).toThrow(/ProvedorAvisos/)
  silencio.mockRestore()
})`}</Bloco>
        <P>
          O <code>spyOn(console.error)</code> é só para o React não sujar a saída do teste com o
          erro que nós mesmos provocamos. O que está sendo testado é a decisão de{' '}
          <strong>quebrar em vez de virar no-op</strong>: sem provedor, o <code>mostrar</code>{' '}
          silencioso faria a pessoa clicar em "Salvar", nada acontecer, e o bug só aparecer em
          produção.
        </P>
      </Secao>

      <Secao titulo="Resumo operacional">
        <P>
          <strong>1.</strong> Busque por <code>getByRole</code> / <code>getByLabelText</code>. Se não
          der para achar assim, o problema é o componente, não o teste.
        </P>
        <P>
          <strong>2.</strong> Escreva o prejuízo no nome do teste ("não dispara clique duplicado"),
          não o mecanismo.
        </P>
        <P>
          <strong>3.</strong> Ligou <code>vi.useFakeTimers()</code>? Precisa do global{' '}
          <code>jest</code> (setup) <em>e</em> do <code>advanceTimers</code> no{' '}
          <code>userEvent.setup()</code>. Faltando um, trava.
        </P>
        <P>
          <strong>4.</strong> Antes de confiar num teste, quebre o código de propósito. Se ele
          continuar verde, reescreva o teste — não comemore.
        </P>
        <P>
          <strong>5.</strong> Campo obrigatório ganha " (obrigatório)" no nome acessível. Em teste,{' '}
          <code>getByLabelText(/nome/i)</code>, nunca a string exata.
        </P>
      </Secao>
    </>
  )
}
