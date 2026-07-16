import { useState, type ReactNode } from 'react'
import { Tabela, EstadoVazio, Selo, Button, Card, CardHeader, CardBody, type Coluna, type Ordem } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

interface Cliente {
  id: number
  nome: string
  cidade: string | null
  valor: number
  status: 'entregue' | 'pendente' | 'falhou'
}

const CLIENTES: Cliente[] = [
  { id: 1, nome: 'Ana Souza', cidade: 'Criciúma', valor: 8888.88, status: 'entregue' },
  { id: 2, nome: 'Bruno Lima', cidade: 'Tubarão', valor: 1111.11, status: 'pendente' },
  { id: 3, nome: 'Carla Dias', cidade: null, valor: 4200, status: 'falhou' },
]

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const COLUNAS: Coluna<Cliente>[] = [
  { chave: 'nome', titulo: 'Cliente', ordenavel: true },
  { chave: 'cidade', titulo: 'Cidade' },
  { chave: 'valor', titulo: 'Valor', numerico: true, ordenavel: true, render: l => brl(l.valor) },
]

/** Largura cheia: o palco da demo é flex, e uma tabela solta encolhe até o conteúdo. */
function Palco({ children }: { children: ReactNode }) {
  return <div style={{ width: '100%' }}>{children}</div>
}

function DemoOrdenacao() {
  const [ordem, setOrdem] = useState<Ordem>({ coluna: 'valor', direcao: 'desc' })

  // Aqui a ordenação é local porque são 3 linhas numa página de documentação. No
  // produto isso é uma chamada ao servidor — veja o texto ao lado.
  const linhas = [...CLIENTES].sort((a, b) => {
    const [x, y] = ordem.direcao === 'asc' ? [a, b] : [b, a]
    return ordem.coluna === 'valor' ? x.valor - y.valor : x.nome.localeCompare(y.nome, 'pt-BR')
  })

  return (
    <Palco>
      <Tabela
        rotulo="Clientes"
        colunas={COLUNAS}
        linhas={linhas}
        chaveLinha={l => l.id}
        ordem={ordem}
        onOrdenar={(coluna, direcao) => setOrdem({ coluna, direcao })}
      />
    </Palco>
  )
}

function DemoSelecao() {
  const [selecionadas, setSelecionadas] = useState<readonly (string | number)[]>([1])

  return (
    <Palco>
      <Tabela
        rotulo="Clientes para a campanha"
        colunas={COLUNAS}
        linhas={CLIENTES}
        chaveLinha={l => l.id}
        selecionaveis
        selecionadas={selecionadas}
        onSelecionar={setSelecionadas}
      />
    </Palco>
  )
}

export default function TabelaPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="A tela de trabalho de um CRM. É onde a pessoa passa o dia — e onde os erros de acessibilidade custam mais caro."
      >
        Tabela
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Tabela, type Coluna, type Ordem } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="É um <table> de verdade">
        <Demo
          variante="plain"
          codigo={`<Tabela
  rotulo="Clientes"
  colunas={[
    { chave: 'nome', titulo: 'Cliente' },
    { chave: 'cidade', titulo: 'Cidade' },
    { chave: 'valor', titulo: 'Valor', numerico: true, render: (l) => brl(l.valor) },
  ]}
  linhas={clientes}
  chaveLinha={(l) => l.id}
/>`}
        >
          <Palco>
            <Tabela rotulo="Clientes" colunas={COLUNAS} linhas={CLIENTES} chaveLinha={l => l.id} />
          </Palco>
        </Demo>
        <P>
          Isso não é purismo de marcação. Quem usa leitor de tela navega tabela{' '}
          <strong>célula a célula</strong> (Ctrl+Alt+setas no VoiceOver) e ouve "Valor, coluna 3
          de 5, R$ 1.200, linha 7". Essa coordenada vem do navegador, de graça, só por a
          marcação estar certa. Divs com <code>role="table"</code> imitam o desenho e perdem
          tudo isso: cada dado vira um texto solto sem endereço.
        </P>
        <P>
          <strong>A primeira coluna é <code>&lt;th scope="row"&gt;</code>.</strong> Num CRM ela é
          sempre o nome de quem ou do quê — e é ela que <em>nomeia</em> a linha. Com
          <code> scope="row"</code>, o leitor de tela diz "Ana Souza, Valor, R$ 8.888,88". Sem
          ela, a pessoa ouve "R$ 8.888,88" e não faz ideia de quem é. Se o nome não for a
          primeira coluna, marque a certa com <code>cabecalhoDeLinha</code>.
        </P>
        <P>
          O <code>rotulo</code> vira um <code>&lt;caption&gt;</code> invisível — o nome acessível
          da tabela. Numa tela com três tabelas, é o que separa "tabela" de "tabela" na lista do
          leitor de tela. Sem ele, a região de rolagem ainda se chama "Tabela", mas as três ficam
          idênticas.
        </P>
        <Aviso>
          Célula sem valor vira <strong>traço</strong>, não branco. Branco é ambíguo: o dado é
          vazio ou a coluna quebrou? O traço afirma "olhamos, e não há valor" — mesma tese do
          <code> emptyReason</code> do StatCard.
        </Aviso>
      </Secao>

      <Secao titulo="Coluna: o tipo trabalha para você">
        <Bloco lang="jsx">{`// Sem \`render\`: \`chave\` precisa ser um campo de T. Um typo não compila.
{ chave: 'valorr', titulo: 'Valor' }
//        ^^^^^^ erro: 'valorr' não existe em Cliente

// Com \`render\`: \`chave\` vira um id livre — coluna calculada, "Ações", "Status".
{ chave: 'acoes', titulo: '', render: (l) => <Button size="sm">Abrir</Button> }`}</Bloco>
        <P>
          <code>Coluna&lt;T&gt;</code> é uma <strong>união</strong>, e ela vale mais do que
          parece. Sem <code>render</code>, o TypeScript só aceita <code>chave</code> que exista
          em <code>T</code> — a tabela vai imprimir esse campo, então ele tem que existir. Com
          <code> render</code>, você já disse de onde vem o conteúdo, e a <code>chave</code>{' '}
          relaxa para um id qualquer.
        </P>
        <P>
          O resultado prático: <strong>é impossível pedir um campo que não existe e receber uma
          coluna de células vazias em produção.</strong> O erro sai no editor, não no chamado do
          cliente.
        </P>
        <Aviso tipo="warn">
          Objeto cru numa célula (um <code>Date</code>, um array) derrubaria a árvore inteira do
          React com "Objects are not valid as a React child" — a tabela toda vira tela branca. A
          tabela intercepta e imprime <code>String(valor)</code>: um "[object Object]" feio, que
          denuncia na hora que falta um <code>render</code> ali.
        </Aviso>
      </Secao>

      <Secao titulo="Números: a coluna que decide se dá para comparar">
        <Demo
          variante="plain"
          codigo={`{ chave: 'valor', titulo: 'Valor', numerico: true, render: (l) => brl(l.valor) }`}
        >
          <Palco>
            <Tabela
              rotulo="Valores"
              colunas={[
                { chave: 'nome', titulo: 'Cliente' },
                { chave: 'valor', titulo: 'Com numerico', numerico: true, render: l => brl(l.valor) },
                { chave: 'copia', titulo: 'Sem numerico', render: l => brl(l.valor) },
              ]}
              linhas={CLIENTES}
              chaveLinha={l => l.id}
            />
          </Palco>
        </Demo>
        <P>
          <code>numerico</code> faz duas coisas de uma vez: alinha à direita e liga{' '}
          <code>tabular-nums</code>. Em fonte proporcional — a Manrope inclusive — o "1" é mais
          estreito que o "8". Então <code>R$ 1.111,11</code> e <code>R$ 8.888,88</code> têm
          larguras diferentes, as casas decimais não caem no mesmo lugar e a coluna vira um
          serrote. <strong>Comparar valor vira adivinhação.</strong>
        </P>
        <P>
          Com <code>tabular-nums</code> todo dígito ocupa a mesma largura: unidade embaixo de
          unidade. Alinhado à direita pelo mesmo motivo — a ordem de grandeza aparece pelo
          comprimento do número, batendo o olho. Compare as duas colunas acima.
        </P>
        <Aviso>
          <code>alinhar</code> existe, mas pense duas vezes antes de usar. Texto à direita é
          difícil de varrer: a coluna perde a margem de leitura da esquerda, que é onde o olho
          volta a cada linha. Quando <code>numerico</code> resolve, deixe ele resolver.
        </Aviso>
      </Secao>

      <Secao titulo="Ordenação">
        <DemoOrdenacao />
        <Bloco lang="jsx">{`const [ordem, setOrdem] = useState<Ordem>({ coluna: 'valor', direcao: 'desc' })

<Tabela
  colunas={colunas}          // { chave: 'valor', ordenavel: true, … }
  linhas={linhas}            // já ordenadas — pelo servidor, quase sempre
  ordem={ordem}
  onOrdenar={(coluna, direcao) => setOrdem({ coluna, direcao })}
/>`}</Bloco>
        <P>
          <strong>A tabela não ordena nada sozinha.</strong> Ela mostra por onde está ordenada e
          avisa quando alguém pede outra coisa. Em CRM a ordenação mora no servidor junto com a
          paginação — e uma tabela que ordena só a página atual{' '}
          <em>mente para quem olha</em>: "maior valor" passa a significar "maior valor entre
          estes 20".
        </P>
        <H3>O que está escondido no cabeçalho</H3>
        <P>
          <strong>1. <code>aria-sort</code> no <code>&lt;th&gt;</code>.</strong> É ele que
          responde "por onde esta tabela está ordenada?". Sem ele a setinha é puro enfeite
          visual: a informação simplesmente não existe para quem não a enxerga. Fica só na coluna
          ordenada e nas outras ordenáveis (<code>none</code>) — coluna que não ordena não recebe
          nem <code>none</code>, porque isso sugeriria um controle que não está lá.
        </P>
        <P>
          <strong>2. O cabeçalho clicável é um <code>&lt;button&gt;</code> de verdade</strong>,
          dentro do <code>&lt;th&gt;</code>. Um <code>&lt;th onClick&gt;</code> não recebe foco,
          não responde a Enter e não é anunciado como algo acionável — a ordenação deixa de
          existir para quem usa teclado. Sem <code>onOrdenar</code> não nasce botão nenhum: nada
          de cabeçalho que finge ser clicável.
        </P>
        <P>
          <strong>3. Coluna de número abre em decrescente.</strong> Quem clica em "Valor" quer
          ver o maior primeiro — ninguém procura o menor pedido do mês. Texto abre em A→Z, que é
          como se procura um nome. O segundo clique inverte.
        </P>
      </Secao>

      <Secao titulo="chaveLinha — obrigatório, e não é implicância">
        <Bloco lang="jsx">{`<Tabela chaveLinha={(l) => l.id} … />   // id de banco: string ou número`}</Bloco>
        <P>
          O índice do array não serve. Ao reordenar, o React reaproveita o DOM pela key: com
          índice, a linha 3 continua sendo "3" mesmo com <em>outro cliente dentro</em>. Todo
          estado preso à posição — o checkbox marcado, o foco, o texto digitado, a linha
          expandida — fica na linha errada.{' '}
          <strong>Já aconteceu de alguém ordenar a lista e apagar o cliente errado por causa
          disso.</strong>
        </P>
        <H3>O teste que passava e não protegia nada</H3>
        <P>
          Esta prop tem um teste. Para saber se ele valia alguma coisa, trocamos o{' '}
          <code>chaveLinha</code> por índice de propósito e rodamos a suíte:{' '}
          <strong>40 de 40 testes continuaram verdes.</strong>
        </P>
        <P>
          O motivo é sutil e vale para o seu código também: o teste conferia a{' '}
          <strong>ordem do texto</strong> depois de reordenar. Só que o React reescreve o
          conteúdo de qualquer jeito — com índice ou com id, o texto acaba certo. O bug do índice
          só aparece no estado que <em>não</em> passa pelo React.
        </P>
        <Bloco lang="jsx">{`// O teste reescrito: estado que vive SÓ no DOM.
{ chave: 'nota', titulo: 'Nota', render: (l) => <input defaultValue="" aria-label={\`Nota de \${l.nome}\`} /> }

await userEvent.type(screen.getByLabelText('Nota de Ana Souza'), 'importante')
rerender(<Tabela linhas={[...clientes].reverse()} … />)

// Com índice como key, o React reaproveita o <input> da posição 1 e o texto fica preso
// lá — agora sob o nome de outro cliente. Este teste morre. O da ordem do texto, não.
expect(screen.getByLabelText('Nota de Ana Souza')).toHaveValue('importante')
expect(screen.getByLabelText('Nota de Carla Dias')).toHaveValue('')`}</Bloco>
        <FacaNaoFaca
          faca={{
            titulo: 'Testar key com estado não controlado',
            texto: 'Um <input defaultValue>, um checkbox, o foco. É o que o React não reescreve — e é exatamente onde o índice como key morde.',
          }}
          naoFaca={{
            titulo: 'Testar key conferindo a ordem do texto',
            texto: 'Passa com índice, passa com id, passa com qualquer coisa. Um teste verde que não protege nada é pior que nenhum teste: dá confiança falsa.',
          }}
        />
      </Secao>

      <Secao titulo="Carregando">
        <Demo variante="plain" codigo={`<Tabela carregando linhasEsqueleto={3} … />`}>
          <Palco>
            <Tabela
              rotulo="Clientes"
              colunas={COLUNAS}
              linhas={CLIENTES}
              chaveLinha={l => l.id}
              carregando
              linhasEsqueleto={3}
            />
          </Palco>
        </Demo>
        <P>
          O esqueleto vai <strong>nas linhas</strong>, com as mesmas colunas: a tabela já nasce
          do tamanho final e nada pula quando os dados chegam. Um spinner solto no meio encolhe a
          área e empurra a página inteira no momento da troca — bem quando a pessoa ia clicar em
          algo. Aproxime <code>linhasEsqueleto</code> do tamanho da sua página.
        </P>
        <P>
          Os 30 tracinhos cinza são <code>aria-hidden</code>. Quem anuncia é um{' '}
          <code>role="status"</code>, <strong>uma vez só</strong> — senão o leitor de tela
          soletra "carregando" trinta vezes seguidas.
        </P>
        <Aviso>
          <strong>Carregando não é vazio.</strong> Com <code>carregando</code>, a tabela não
          mostra o <code>vazio</code> nem os dados antigos. Piscar "nenhum cliente" antes dos
          dados chegarem é dar notícia errada — e a pessoa já saiu da tela quando o dado chega.
        </Aviso>
      </Secao>

      <Secao titulo="Vazia">
        <Demo
          variante="plain"
          codigo={`<Tabela
  linhas={[]}
  vazio={
    <EstadoVazio
      titulo="Nenhum cliente com esse filtro"
      descricao="Ninguém comprou nos últimos 7 dias. Tente um período maior."
      acao={<Button onClick={limpar}>Limpar filtros</Button>}
    />
  }
  …
/>`}
        >
          <Palco>
            <Tabela
              rotulo="Clientes"
              colunas={COLUNAS}
              linhas={[]}
              chaveLinha={l => l.id}
              vazio={
                <EstadoVazio
                  size="sm"
                  titulo="Nenhum cliente com esse filtro"
                  descricao="Ninguém comprou nos últimos 7 dias. Tente um período maior."
                  acao={<Button size="sm">Limpar filtros</Button>}
                />
              }
            />
          </Palco>
        </Demo>
        <P>
          A prop <code>vazio</code> é opcional no tipo e obrigatória na prática:{' '}
          <strong>a tabela avisa no console, em desenvolvimento, quando fica vazia sem
          explicação.</strong> Uma tabela vazia muda deixa a pessoa sem saber se filtrou demais,
          se não há cadastro ainda, ou se o sistema quebrou — e a leitura mais comum é
          "quebrou".
        </P>
        <P>
          O <code>colSpan</code> conta a coluna das caixas de seleção, quando existe. É o
          detalhe que evita o estado vazio nascer espremido embaixo da primeira coluna.
        </P>
      </Secao>

      <Secao titulo="Seleção">
        <DemoSelecao />
        <Bloco lang="jsx">{`const [selecionadas, setSelecionadas] = useState<ChaveDeLinha[]>([])

<Tabela
  selecionaveis
  selecionadas={selecionadas}
  onSelecionar={setSelecionadas}
  …
/>`}</Bloco>
        <H3>Marque uma só e olhe a caixa do cabeçalho</H3>
        <P>
          Ela fica <strong>indeterminada</strong> — o tracinho no lugar do check.{' '}
          <code>indeterminate</code> não existe como atributo em HTML, só como propriedade do
          DOM: não há como escrever isso em JSX, e é por isso que ele quase nunca aparece por aí.
          Sem ele, seleção parcial parece "nenhuma marcada", a pessoa clica achando que vai
          marcar tudo — e desmarca o que já tinha escolhido.
        </P>
        <P>
          <strong>"Selecionar todas" só mexe nas linhas visíveis.</strong> Com filtro ou
          paginação, desmarcar tudo aqui não pode apagar em silêncio o que a pessoa escolheu na
          página anterior. As chaves de fora da página atual voltam intactas no{' '}
          <code>onSelecionar</code>.
        </P>
        <P>
          A célula da caixa inteira segura o clique (<code>stopPropagation</code>), não só o
          checkbox. É a armadilha clássica: sem isso, marcar um cliente para uma ação em massa{' '}
          <em>abre</em> o cliente, porque o clique borbulha até o <code>onLinhaClick</code> da
          linha. O mesmo vale para o Espaço no teclado.
        </P>
        <Aviso>
          A API recebe e devolve <strong>array</strong> — que é o que cabe num{' '}
          <code>useState</code>. Por dentro ela vira <code>Set</code>: um{' '}
          <code>includes()</code> dentro do map faz a tabela ser O(linhas × selecionadas) a cada
          render, e com 500 linhas o clique começa a engasgar.
        </Aviso>
      </Secao>

      <Secao titulo="Clique na linha">
        <Bloco lang="jsx">{`<Tabela onLinhaClick={(cliente) => abrir(cliente)} … />`}</Bloco>
        <P>
          A linha vira uma parada do Tab e responde a Enter e Espaço — o mínimo para quem não usa
          mouse. Linha sem <code>onLinhaClick</code> não recebe <code>tabIndex</code>: uma tabela
          de 50 linhas focáveis por nada seria 50 paradas de Tab no caminho de quem só queria
          chegar no botão do rodapé.
        </P>
        <P>
          <strong>Mas o ideal continua sendo um <code>&lt;a&gt;</code> na primeira célula.</strong>{' '}
          Se clicar na linha <em>navega</em> para o cliente, isso é um link — e link dá
          Ctrl+clique, "abrir em nova aba", botão direito e histórico de graça. É a mesma regra
          do Button: navegar não é executar.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'render com <a> na coluna do nome',
            texto: 'A linha inteira pode continuar clicável por conveniência, mas quem abre em nova aba tem por onde. Ganha o poder de usuário sem tirar nada de ninguém.',
          }}
          naoFaca={{
            titulo: 'onLinhaClick com navigate() e nada mais',
            texto: 'Quebra o Ctrl+clique e o botão direito na tela onde as pessoas mais abrem coisas em abas. Elas acham que o sistema está com defeito.',
          }}
        />
      </Secao>

      <Secao titulo="Rolagem e coluna fixa">
        <Bloco lang="jsx">{`<Tabela colunaFixa … />   // a 1ª coluna (e as caixas) grudam ao rolar`}</Bloco>
        <P>
          <strong>O container que rola é focável por teclado</strong> e é uma região com nome.
          Isso é sutil e quase sempre esquecido: um bloco que rola e não recebe foco é
          intransponível para quem não usa mouse — as colunas da direita simplesmente não
          existem para essa pessoa. O preço é uma parada a mais no Tab; barato perto de dados
          invisíveis.
        </P>
        <P>
          <code>colunaFixa</code> prende o nome ao rolar na horizontal. Sem ele a pessoa lê
          "R$ 8.400" na décima coluna, não sabe de quem é, e rola de volta para conferir — a cada
          linha.
        </P>
        <Aviso>
          Por dentro a tabela usa <code>border-collapse: separate</code>, não{' '}
          <code>collapse</code>: com <code>collapse</code> o navegador funde as bordas numa grade
          só e as bordas das células <code>sticky</code> somem ao rolar. É por isso que a borda
          vive nas células, não na <code>&lt;tr&gt;</code>.
        </Aviso>
      </Secao>

      <Secao titulo="Dentro de um Card">
        <Demo
          variante="plain"
          codigo={`<Card>
  <CardHeader title="Últimas vendas" />
  <CardBody flush>     {/* flush existe para isto: a tabela encosta na borda */}
    <Tabela … />
  </CardBody>
</Card>`}
        >
          <Palco>
            <Card>
              <CardHeader title="Últimas vendas" subtitle="últimos 7 dias" />
              <CardBody flush>
                <Tabela
                  rotulo="Últimas vendas"
                  colunas={[
                    { chave: 'nome', titulo: 'Cliente' },
                    {
                      chave: 'status',
                      titulo: 'Status',
                      render: l => (
                        <Selo
                          tom={l.status === 'entregue' ? 'sucesso' : l.status === 'falhou' ? 'perigo' : 'neutro'}
                          pontinho
                        >
                          {l.status === 'entregue' ? 'Entregue' : l.status === 'falhou' ? 'Falhou' : 'Pendente'}
                        </Selo>
                      ),
                    },
                    { chave: 'valor', titulo: 'Valor', numerico: true, render: l => brl(l.valor) },
                  ]}
                  linhas={CLIENTES}
                  chaveLinha={l => l.id}
                />
              </CardBody>
            </Card>
          </Palco>
        </Demo>
        <P>
          Sem <code>flush</code>, o respiro do <code>CardBody</code> cria uma moldura em volta da
          tabela e a última linha não encosta na borda — fica um vão que parece erro de
          alinhamento. A tabela também não tem zebra de propósito: com 10 colunas a cor alternada
          vira listra e cansa. Uma borda de 1px já guia o olho.
        </P>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'colunas', tipo: 'ReadonlyArray<Coluna<T>>', descricao: <>A definição das colunas. Veja <code>Coluna&lt;T&gt;</code> abaixo.</> },
            { nome: 'linhas', tipo: 'readonly T[]', descricao: 'Os dados. Já ordenados e já paginados — a tabela não mexe neles.' },
            { nome: 'chaveLinha', tipo: '(linha: T) => string | number', descricao: <><strong>Obrigatório.</strong> A identidade da linha. Índice não serve — veja acima.</> },
            { nome: 'rotulo', tipo: 'string', descricao: <>Nome acessível: vira <code>&lt;caption&gt;</code> invisível e nomeia a região de rolagem.</> },
            { nome: 'ordem', tipo: 'Ordem', descricao: <>Por onde está ordenada: <code>{`{ coluna, direcao }`}</code>. Só marca o cabeçalho.</> },
            { nome: 'onOrdenar', tipo: '(coluna: string, direcao: Direcao) => void', descricao: 'Sem ela, nenhum cabeçalho vira botão.' },
            { nome: 'carregando', tipo: 'boolean', padrao: 'false', descricao: 'Esqueleto nas linhas. Esconde dados e estado vazio.' },
            { nome: 'linhasEsqueleto', tipo: 'number', padrao: '5', descricao: 'Aproxime da sua página real para o layout não pular.' },
            { nome: 'vazio', tipo: 'ReactNode', descricao: <>Um <code>&lt;EstadoVazio&gt;</code> que explique o motivo. A ausência avisa no console.</> },
            { nome: 'onLinhaClick', tipo: '(linha: T) => void', descricao: 'Entrega o registro inteiro, não o índice. Prefira um <a> na 1ª célula.' },
            { nome: 'selecionaveis', tipo: 'boolean', padrao: 'false', descricao: 'Liga a coluna de caixas de seleção.' },
            { nome: 'selecionadas', tipo: 'readonly (string | number)[]', descricao: 'As chaves marcadas. Controlado por você.' },
            { nome: 'onSelecionar', tipo: '(chaves: ChaveDeLinha[]) => void', descricao: 'Devolve a seleção nova, preservando o que estava marcado fora da página.' },
            { nome: 'colunaFixa', tipo: 'boolean', padrao: 'false', descricao: 'Prende a primeira coluna ao rolar na horizontal.' },
            { nome: 'className', tipo: 'string', descricao: 'Aplicado no container de rolagem.' },
          ]}
        />

        <H3>Coluna&lt;T&gt;</H3>
        <TabelaProps
          props={[
            { nome: 'chave', tipo: 'keyof T | string', descricao: <>Sem <code>render</code>, precisa ser um campo de <code>T</code>. Com <code>render</code>, é um id livre.</> },
            { nome: 'titulo', tipo: 'ReactNode', descricao: 'Vira versalete no cabeçalho. Curto.' },
            { nome: 'render', tipo: '(linha: T) => ReactNode', descricao: 'Opcional na coluna de campo, obrigatório na coluna calculada.' },
            { nome: 'numerico', tipo: 'boolean', padrao: 'false', descricao: <>Alinha à direita e liga <code>tabular-nums</code>. Use em tudo que é dinheiro, contagem ou percentual.</> },
            { nome: 'ordenavel', tipo: 'boolean', padrao: 'false', descricao: <>Mostra o botão de ordenar. Precisa de <code>onOrdenar</code> na tabela.</> },
            { nome: 'alinhar', tipo: "'esquerda' | 'direita' | 'centro'", padrao: "'esquerda' (ou 'direita' com numerico)", descricao: 'Vence o padrão do numerico. Mexa só quando ele não resolver.' },
            { nome: 'cabecalhoDeLinha', tipo: 'boolean', padrao: 'a primeira coluna', descricao: <>Força esta coluna a ser o <code>&lt;th scope="row"&gt;</code> que nomeia a linha.</> },
          ]}
        />
      </Secao>
    </>
  )
}
