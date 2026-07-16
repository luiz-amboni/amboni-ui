import { useState } from 'react'
import { Dialogo, Gaveta, Button, type GavetaLado } from '@amboni/ui'
// `Aviso` da biblioteca é o toast; `Aviso` dos blocos é a caixa de destaque do site.
import { Secao, P, Demo, Titulo, H3, Aviso as Destaque, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

/** O modal é controlado: o exemplo precisa do estado que o produto teria. */
function DemoDialogo() {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <Button variant="danger" onClick={() => setAberto(true)}>Excluir cliente</Button>
      <Dialogo
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo="Excluir cliente"
        descricao="Esta ação não tem volta."
        rodape={
          <>
            <Button onClick={() => setAberto(false)}>Cancelar</Button>
            <Button variant="danger" onClick={() => setAberto(false)}>Excluir</Button>
          </>
        }
      >
        O histórico de mensagens de Maria Silva será apagado junto. Os pedidos continuam no
        Bling.
      </Dialogo>
    </>
  )
}

function DemoGaveta() {
  const [lado, setLado] = useState<GavetaLado | null>(null)
  return (
    <>
      {(['esquerda', 'direita', 'baixo'] as const).map(l => (
        <Button key={l} onClick={() => setLado(l)}>{l}</Button>
      ))}
      <Gaveta
        aberto={lado !== null}
        onFechar={() => setLado(null)}
        lado={lado ?? 'direita'}
        titulo="Filtros"
        descricao="A lista atrás continua visível."
        rodape={<Button variant="primary" onClick={() => setLado(null)}>Aplicar</Button>}
      >
        Período, status de entrega, categoria do produto. Enquanto a pessoa mexe aqui, a
        tabela continua ali atrás — é para isso que a gaveta serve.
      </Gaveta>
    </>
  )
}

export default function DialogoPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="O modal e a gaveta. São o mesmo componente por dentro — e o mesmo motivo: seis problemas difíceis que ninguém quer resolver duas vezes."
      >
        Dialogo e Gaveta
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Dialogo, Gaveta } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Uso">
        <Demo
          variante="centro"
          codigo={`const [aberto, setAberto] = useState(false)

<Dialogo
  aberto={aberto}
  onFechar={() => setAberto(false)}
  titulo="Excluir cliente"
  descricao="Esta ação não tem volta."
  rodape={<>
    <Button onClick={() => setAberto(false)}>Cancelar</Button>
    <Button variant="danger" onClick={excluir}>Excluir</Button>
  </>}
>
  O histórico de mensagens de {nome} será apagado junto.
</Dialogo>`}
        >
          <DemoDialogo />
        </Demo>
        <P>
          <strong>O modal nunca fecha sozinho por dentro.</strong> <code>onFechar</code> é
          chamado em toda tentativa de fechar — X, Esc, clique no fundo — e quem fecha de fato é
          você, virando o <code>aberto</code> para false. É de propósito: assim dá para segurar o
          modal aberto ("há alterações não salvas") sem lutar contra o componente.
        </P>
        <P>
          <code>titulo</code> é obrigatório porque é o <strong>nome acessível</strong> do modal.
          Sem ele o leitor de tela anuncia "diálogo" e nada mais — a pessoa é interrompida por
          uma caixa sem nome.
        </P>
      </Secao>

      <Secao titulo="Por que o <dialog> nativo">
        <P>
          O componente usa o <code>&lt;dialog&gt;</code> do navegador com
          <code> showModal()</code>. É a decisão central, e é o que faz este arquivo ter 150
          linhas em vez de 400. De graça, e certo:
        </P>
        <P>
          <strong>Top layer.</strong> O modal fica acima de qualquer <code>z-index</code> da
          página. A guerra do <code>z-index: 9999</code> simplesmente não acontece.
        </P>
        <P>
          <strong><code>::backdrop</code>.</strong> O fundo escurecido é do navegador, sem div
          extra.
        </P>
        <P>
          <strong>Esc.</strong> O navegador já trata (nós só precisamos avisar o React — veja
          abaixo).
        </P>
        <P>
          <strong>Inertização.</strong> O resto da página para de receber clique, foco e leitor
          de tela. Sozinho.
        </P>
        <P>
          Reimplementar isso com div + portal + focus trap é o caminho conhecido de 200 linhas
          com bugs sutis de foco. O <code>&lt;dialog&gt;</code> custa alguns cuidados — os que
          vêm a seguir.
        </P>
      </Secao>

      <Secao titulo="O bug clássico: o Esc que mata o modal">
        <P>
          O Esc fecha o <code>&lt;dialog&gt;</code> no navegador, <strong>sem passar pelo
          React</strong>. Se ninguém avisar, o estado fica <code>aberto: true</code> com o modal
          fechado na tela. Aí <code>setAberto(true)</code> não muda prop nenhuma, o efeito não
          roda, e <strong>o modal nunca mais abre</strong>.
        </P>
        <P>
          A saída é ouvir o evento <code>cancel</code> e dar <code>preventDefault()</code>
          <em> sempre</em>: o navegador não fecha nada, e quem fecha é só o <code>aberto</code>.
          Três portas (X, Esc, fundo), um caminho de saída só.
        </P>
        <P>
          O mesmo vale para o evento <code>close</code>: um <code>&lt;form
          method="dialog"&gt;</code> nos children é HTML legítimo e fecha o dialog por fora do
          React. Ele também é ouvido, senão cai no mesmo buraco.
        </P>
        <Destaque>
          Os dois casos têm teste. O do Esc se chama, literalmente, "depois do Esc, o modal
          ABRE DE NOVO" — porque o sintoma só aparece na <em>segunda</em> vez que alguém tenta
          abrir, e é o tipo de bug que passa por toda revisão manual.
        </Destaque>
      </Secao>

      <Secao titulo="Clique no fundo: geometria + mousedown">
        <P>
          O <code>::backdrop</code> é pseudo-elemento: não dá para pôr <code>onClick</code> nele,
          e o clique no fundo chega com <code>target</code> = o <strong>próprio</strong>
          <code> &lt;dialog&gt;</code>. Então "clicou fora" se descobre por geometria —
          comparando o ponto do clique com o retângulo do modal.
        </P>
        <P>
          E não basta olhar o <code>click</code>. Selecionar um texto de dentro do modal e soltar
          o mouse lá fora dispara um <code>click</code> no ancestral comum (o dialog) com as
          coordenadas da <em>soltura</em> — e o modal fecharia no meio da seleção, levando o
          texto junto. Por isso o componente guarda onde o botão <strong>desceu</strong>
          (<code>mousedown</code>) e só fecha se pressionar <em>e</em> soltar caíram fora.
        </P>
        <P>
          Há ainda o <code>detail === 0</code>: clique sintético de teclado (Enter num botão de
          dentro) vem com <code>clientX/clientY</code> zerados, que caem fora do retângulo. Sem
          esse guarda, cada Enter fecharia o modal. Teclado não clica no fundo.
        </P>
      </Secao>

      <Secao titulo="Trava de rolagem contada">
        <P>
          Com o modal aberto, a página do fundo não rola — senão a pessoa gira a roda e perde o
          lugar sem ter fechado nada. A trava é um <strong>contador</strong>, não um booleano:
          com dois modais abertos (um confirmando o outro), o primeiro a fechar devolveria a
          rolagem com o segundo ainda na tela. <strong>Só o último destrava.</strong>
        </P>
        <P>
          A trava também é liberada quando o componente <em>desmonta aberto</em> — troca de rota,
          item da lista que some. Sem isso a página fica congelada sem nenhum modal na tela, e
          ninguém liga o sintoma à causa.
        </P>
        <P>
          Esconder a rolagem some com a barra e a página do fundo pula uns 15px para a direita: o
          modal abre e o mundo atrás dele se mexe. O componente devolve a largura da barra como
          <code> padding-right</code>. (Em Mac com barra flutuante a conta dá 0 e nada muda.)
        </P>
      </Secao>

      <Secao titulo="O foco volta para quem abriu">
        <P>
          Quem abriu é guardado <em>antes</em> do <code>showModal()</code> — depois dele o foco
          já está dentro do modal e o <code>activeElement</code> não serve mais para nada. Ao
          fechar, o foco volta para lá.
        </P>
        <P>
          Sem isso a pessoa é cuspida no topo do documento e precisa navegar a página inteira de
          novo até onde estava. Para quem usa teclado ou leitor de tela, é perder o lugar no meio
          da tarefa. Os navegadores atuais já fazem isso sozinhos — mas não todos, e não quando o
          modal fecha por mudança de estado em vez de interação.
        </P>
        <P>
          Se o abridor saiu da tela junto (a linha da tabela que foi excluída pelo próprio
          modal), o componente checa <code>isConnected</code> e não explode.
        </P>
      </Secao>

      <Secao titulo="Gaveta">
        <Demo
          variante="centro"
          codigo={`<Gaveta aberto={aberto} onFechar={fechar} titulo="Filtros" lado="direita"
        rodape={<Button variant="primary">Aplicar</Button>}>
  <CampoData /> <SeletorStatus />
</Gaveta>`}
        >
          <DemoGaveta />
        </Demo>
        <P>
          <strong>A Gaveta é o Dialogo por dentro</strong>, só que ancorada numa borda em vez de
          centralizada. Não é economia de digitação: modal e gaveta têm exatamente os
          <strong> mesmos seis problemas difíceis</strong> — top layer, Esc avisando o React,
          foco de volta em quem abriu, trava de rolagem contada, clique no fundo por geometria,
          inertizar o resto da página. Duplicar isso significaria consertar cada bug duas vezes
          e, na prática, esquecer de um lado. Aqui a Gaveta é CSS: posição, tamanho e o deslize.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Gaveta quando a pessoa precisa ver a lista atrás',
            texto: 'Filtro, detalhe de um item da tabela, formulário lateral. O contexto continua na tela.',
          }}
          naoFaca={{
            titulo: 'Gaveta para confirmar uma exclusão',
            texto: 'Decidir agora pede o modal centralizado: ele interrompe de propósito, e é isso que você quer numa ação sem volta.',
          }}
        />
        <P>
          <code>lado="direita"</code> é o padrão: é o padrão da web ocidental — a ação nasce à
          direita e é para lá que o olho vai. <code>esquerda</code> é para navegação (o menu do
          celular, que mora lá). <code>baixo</code> é a folha do celular, ao alcance do polegar.
        </P>
        <P>
          O deslize aqui não é enfeite: é ele que diz de <em>onde</em> a gaveta veio e, portanto,
          para onde ela volta. Com <code>prefers-reduced-motion</code> ela aparece no lugar, e
          quem avisa que o contexto mudou é o fundo escurecido.
        </P>
      </Secao>

      <Secao titulo="Dois bugs que só o navegador real pegou">
        <P>
          O jsdom não avalia CSS: ele não faz layout, não calcula altura, não sabe o que é
          <code> content-box</code>. Estes dois passariam por qualquer suíte de testes unitários
          — apareceram quando o componente rodou num Chromium de verdade.
        </P>
        <H3>1. O &lt;dialog&gt; é content-box</H3>
        <P>
          A folha do navegador não dá <code>box-sizing: border-box</code> ao
          <code> &lt;dialog&gt;</code>. Então <code>height: 100dvh</code> quer dizer "100dvh
          <strong> mais</strong> as duas bordas": a Gaveta ficava 2px mais alta que a tela e o
          rodapé saía por baixo. <strong>Medido: 802px numa janela de 800.</strong>
        </P>
        <Bloco lang="css">{`.amb-dialogo {
  /* 1px de borda em cima + 1px embaixo = 2px de gaveta fora da tela */
  box-sizing: border-box;
}`}</Bloco>
        <H3>2. dialog:modal tem inset: 0</H3>
        <P>
          O navegador dá <code>position: fixed; inset: 0; margin: auto</code> ao dialog modal — é
          isso que o centraliza. Só que caixa posicionada com <strong>top e bottom fixos</strong>
          e <code>height: auto</code> não encolhe: ela <strong>estica</strong> para preencher os
          dois. A folha de baixo colava na <code>max-height</code> e virava uma parede de 28rem
          em branco com três linhas de conteúdo dentro. <strong>Medido: 449px para um conteúdo de
          ~130px.</strong>
        </P>
        <Bloco lang="css">{`.amb-gaveta.amb-gaveta--baixo {
  /* soltar o top é o que devolve a altura para o conteúdo */
  top: auto;
  bottom: 0;
  height: auto;
  max-height: min(var(--amb-gaveta-medida), calc(100dvh - var(--amb-espaco-12)));
}`}</Bloco>
        <P>
          Um detalhe da mesma família: as medidas usam <code>dvh</code> e não <code>vh</code>. No
          celular a barra do navegador entra e sai, e <code>vh</code> é a altura <em>com</em> a
          barra escondida — o rodapé do modal fica embaixo dela, inalcançável.
        </P>
      </Secao>

      <Secao titulo="Tamanhos">
        <P>
          O mesmo <code>size</code> serve aos dois, e cada um o traduz no eixo que faz sentido —
          largura máxima no modal, largura (ou altura, embaixo) na gaveta:
        </P>
        <TabelaProps
          props={[
            { nome: 'sm', tipo: 'Dialogo: 24rem', padrao: 'Gaveta: 20rem', descricao: 'Confirmação curta.' },
            { nome: 'md', tipo: 'Dialogo: 32rem', padrao: 'Gaveta: 28rem', descricao: 'O padrão. Formulário pequeno, detalhe de um item.' },
            { nome: 'lg', tipo: 'Dialogo: 48rem', padrao: 'Gaveta: 40rem', descricao: 'Formulário de verdade.' },
            { nome: 'full', tipo: 'Dialogo: a tela toda', padrao: 'Gaveta: 100%', descricao: 'Tabela, pré-visualização. Não encosta na borda: a moldura de fundo é o que diz "tem um fora".' },
          ]}
        />
        <P>
          As larguras são em <code>rem</code>, não px: quem aumenta a fonte do navegador ganha um
          modal maior junto, em vez de um funil de texto.
        </P>
        <P>
          No celular (abaixo de 30rem) os botões do rodapé viram uma coluna. Dois botões
          espremidos lado a lado numa tela estreita é onde se erra o alvo e se aperta "Excluir"
          sem querer.
        </P>
      </Secao>

      <Secao titulo="Limitações honestas">
        <P>
          <strong>1. O fundo pode não escurecer em navegador velho.</strong> O
          <code> ::backdrop</code> só herda custom property do elemento de origem a partir do
          Chrome 122, Safari 17.4 e Firefox 121. Antes disso o <code>var(--amb-dialogo-scrim)</code>
          não resolve e o fundo fica transparente. <strong>O modal funciona</strong> — top layer,
          Esc, foco, inertização, tudo. Só não escurece o que está atrás.
        </P>
        <P>
          <strong>2. Não há animação de saída.</strong> Animar a saída de um
          <code> &lt;dialog&gt;</code> exige <code>allow-discrete</code>, novo demais para a base
          de navegadores que estes produtos atendem. E um modal que some na hora incomoda muito
          menos do que um que demora a sumir.
        </P>
        <P>
          <strong>3. Não existe "modal sem saída".</strong> Não há prop para isso. O X aparece
          sempre, mesmo com <code>fecharNoFundo</code> e <code>fecharNoEsc</code> desligados: no
          celular não há Esc, e um modal sem saída visível é uma armadilha. Se o seu caso pede um
          modal do qual não se sai, o problema provavelmente não é o modal.
        </P>
        <Destaque tipo="warn">
          <code>fecharNoEsc={'{false}'}</code> só quando perder o que está na tela for caro (um
          formulário longo). Esc é o jeito que as pessoas esperam sair — tirar isso surpreende, e
          surpresa em modal é a pessoa achando que o site travou.
        </Destaque>
      </Secao>

      <Secao titulo="Props — Dialogo">
        <TabelaProps
          props={[
            { nome: 'aberto', tipo: 'boolean', descricao: 'Fonte única da verdade. O modal nunca fecha sozinho por dentro.' },
            { nome: 'onFechar', tipo: '() => void', descricao: 'Chamado em TODA tentativa (X, Esc, fundo). Quem fecha de fato é você.' },
            { nome: 'titulo', tipo: 'ReactNode', descricao: <><strong>Obrigatório</strong> — é o nome acessível. Vira um <code>&lt;h2&gt;</code> de verdade.</> },
            { nome: 'descricao', tipo: 'ReactNode', descricao: <>Uma linha do que está em jogo. Vira <code>aria-describedby</code>.</> },
            { nome: 'children', tipo: 'ReactNode', descricao: 'O corpo. É ele que rola — o cabeçalho e o rodapé ficam parados.' },
            { nome: 'rodape', tipo: 'ReactNode', descricao: 'Barra de ações. A primária vai por último, à direita: junto do polegar e do olhar.' },
            { nome: 'size', tipo: "'sm' | 'md' | 'lg' | 'full'", padrao: "'md'", descricao: '24rem, 32rem, 48rem ou a tela toda.' },
            { nome: 'fecharNoFundo', tipo: 'boolean', padrao: 'true', descricao: 'Clique no fundo escurecido fecha.' },
            { nome: 'fecharNoEsc', tipo: 'boolean', padrao: 'true', descricao: 'Esc fecha. Desligue só quando perder o conteúdo for caro.' },
            { nome: 'className', tipo: 'string', descricao: <>Vai no <code>&lt;dialog&gt;</code>. É por aqui que a Gaveta se ancora numa borda.</> },
          ]}
        />
      </Secao>

      <Secao titulo="Props — Gaveta">
        <TabelaProps
          props={[
            { nome: 'aberto', tipo: 'boolean', descricao: <>Ver <code>Dialogo.aberto</code> — mesma regra.</> },
            { nome: 'onFechar', tipo: '() => void', descricao: 'Idem: quem fecha é você, virando o `aberto`.' },
            { nome: 'lado', tipo: "'esquerda' | 'direita' | 'baixo'", padrao: "'direita'", descricao: 'direita = detalhe/filtro/formulário; esquerda = navegação; baixo = folha do celular.' },
            { nome: 'titulo', tipo: 'ReactNode', descricao: 'Obrigatório: é o nome acessível.' },
            { nome: 'descricao', tipo: 'ReactNode', descricao: 'Opcional, mesma função do Dialogo.' },
            { nome: 'children', tipo: 'ReactNode', descricao: 'O corpo rolável.' },
            { nome: 'rodape', tipo: 'ReactNode', descricao: 'Fixo no pé. Numa gaveta de formulário, é onde mora o "Aplicar".' },
            { nome: 'size', tipo: "'sm' | 'md' | 'lg' | 'full'", padrao: "'md'", descricao: 'Largura (esquerda/direita) ou altura máxima (baixo): 20rem, 28rem, 40rem, 100%.' },
            { nome: 'className', tipo: 'string', descricao: 'Somado às classes da gaveta.' },
          ]}
        />
      </Secao>
    </>
  )
}
