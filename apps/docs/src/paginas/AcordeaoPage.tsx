import { Acordeao, ItemAcordeao } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco, Teclado } from '../lib/blocos'

export default function AcordeaoPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="Seções que abrem e fecham. O trabalho de verdade é o painel fechado sumir de verdade."
      >
        Acordeao
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Acordeao, ItemAcordeao } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Uso">
        <Demo
          variante="plain"
          codigo={`<Acordeao valorPadrao="entrega">
  <ItemAcordeao valor="entrega" titulo="Prazo de entrega">
    Sai em até 2 dias úteis.
  </ItemAcordeao>
  <ItemAcordeao valor="troca" titulo="Troca e devolução">
    30 dias corridos a partir do recebimento.
  </ItemAcordeao>
  <ItemAcordeao valor="nf" titulo="Nota fiscal" disabled>
    …
  </ItemAcordeao>
</Acordeao>`}
        >
          <div style={{ maxWidth: 520, width: '100%' }}>
            <Acordeao valorPadrao="entrega">
              <ItemAcordeao valor="entrega" titulo="Prazo de entrega">
                Sai em até 2 dias úteis. Criciúma e região no mesmo dia.
              </ItemAcordeao>
              <ItemAcordeao valor="troca" titulo="Troca e devolução">
                30 dias corridos a partir do recebimento.
              </ItemAcordeao>
              <ItemAcordeao valor="nf" titulo="Nota fiscal" disabled>
                Em breve.
              </ItemAcordeao>
            </Acordeao>
          </div>
        </Demo>
        <P>
          Não controlado é o caso comum: passe <code>valorPadrao</code> e esqueça. O modo
          controlado (<code>valor</code> + <code>onChange</code>) existe para quando o produto
          precisa <strong>vetar</strong> a abertura — uma seção que exige permissão, por exemplo.
          A escolha entre os dois é feita uma vez: trocar de modo em runtime é o clássico "input
          muda de controlado para não controlado" do React, e o estado interno some junto.
        </P>
      </Secao>

      <Secao titulo="Por que o gatilho mora dentro de um heading">
        <P>
          Cada seção é um <code>&lt;h3&gt;&lt;button&gt;…&lt;/button&gt;&lt;/h3&gt;</code>. Sem o
          heading, o acordeão vira uma pilha de botões — e quem usa leitor de tela navega a página{' '}
          <strong>pulando de heading em heading</strong>. É o atalho mais usado que existe. Sem
          eles, a única forma de achar a seção certa é ouvir todas em ordem.
        </P>
        <P>
          O heading não tem estilo próprio: tamanho, peso e margem vêm do botão. Ele existe para a
          estrutura, não para o olho.
        </P>
        <Aviso>
          <code>nivelTitulo</code> é <code>3</code> por padrão e <strong>você deve mexer quando a
          página exigir</strong>. Um <code>h3</code> dentro de uma seção <code>h4</code> quebra o
          índice que o leitor de tela monta — o mesmo estrago de pular do <code>h2</code> para o{' '}
          <code>h5</code> num artigo.
        </Aviso>
      </Secao>

      <Secao titulo="unico ou multiplo">
        <Demo
          variante="plain"
          codigo={`<Acordeao tipo="multiplo" valorPadrao={['a', 'b']}>…</Acordeao>`}
        >
          <div style={{ maxWidth: 520, width: '100%' }}>
            <Acordeao tipo="multiplo" valorPadrao={['ios', 'mac']}>
              <ItemAcordeao valor="ios" titulo="iPhone">
                Dicas de bateria, iCloud e transferência.
              </ItemAcordeao>
              <ItemAcordeao valor="mac" titulo="Mac">
                Migração, Time Machine e AppleCare.
              </ItemAcordeao>
            </Acordeao>
          </div>
        </Demo>
        <FacaNaoFaca
          faca={{
            titulo: 'unico quando comparar não faz sentido',
            texto: 'FAQ, formulário em etapas: os painéis são longos e ver dois ao mesmo tempo só afasta o que importa.',
          }}
          naoFaca={{
            titulo: 'unico quando a pessoa precisa dos dois na tela',
            texto: 'Se ela abre um, rola, abre o outro e volta — o acordeão está brigando com ela. É multiplo.',
          }}
        />
        <P>
          <code>unico</code> <strong>também fecha</strong> quando você clica no que já está
          aberto. Um acordeão que só deixa trocar prende a pessoa com um painel sempre aberto na
          cara — e não há nenhum jeito de dizer "não quero ver nada disso".
        </P>
        <H3>O tipo do onChange acompanha o tipo do acordeão</H3>
        <Bloco lang="jsx">{`// unico → string | null. Fechado é null, não '' nem [].
<Acordeao valor={aberto} onChange={v => setAberto(v)}>          // v: string | null

// multiplo → string[]. A lista inteira, sempre.
<Acordeao tipo="multiplo" valor={abertos} onChange={v => …}>    // v: string[]`}</Bloco>
        <P>
          São tipos discriminados de propósito: quem usa <code>unico</code> não deveria ter que
          lidar com um array de um elemento só, nem adivinhar se "fechado" é <code>[]</code>,{' '}
          <code>''</code> ou <code>null</code>. O tipo diz a verdade sobre o que aconteceu.
        </P>
      </Secao>

      <Secao titulo="A linha mais importante do CSS">
        <Bloco lang="css">{`.amb-acordeao__painel[hidden] {
  display: none;
}`}</Bloco>
        <P>
          Parece redundante — o navegador já faz isso. <strong>Não faz.</strong> O painel usa{' '}
          <code>display: grid</code> para animar, e uma regra de <em>autor</em> vence a regra de{' '}
          <em>user-agent</em> <code>[hidden] &#123; display: none &#125;</code>, mesmo com a mesma
          especificidade. Sem esta linha, o <code>hidden</code> que o JS coloca no painel fechado{' '}
          <strong>não faz absolutamente nada</strong>.
        </P>
        <P>
          E o bug seria invisível: o painel continua com altura 0, ninguém vê diferença. Só que ele
          volta a ser <strong>alcançável pelo Tab</strong> — a pessoa tecleja, o foco entra num
          painel fechado, o anel de foco desaparece da tela, e não há nada para clicar nem para
          onde voltar. O foco "sumiu".
        </P>
        <Aviso tipo="warn">
          Este é o motivo de o componente existir. "Fechado" aqui é o atributo <code>hidden</code>{' '}
          (= <code>display: none</code>), <strong>não altura zero</strong>. Um painel com{' '}
          <code>height: 0</code> e <code>overflow: hidden</code> — a solução que todo mundo escreve
          primeiro — continua focável, continua sendo lido pelo leitor de tela, e passa em qualquer
          teste feito com mouse.
        </Aviso>
      </Secao>

      <Secao titulo="E a animação, então?">
        <P>
          <code>height: auto</code> não anima (o navegador não sabe para qual número ir) e{' '}
          <code>display: none</code> corta qualquer transição. A saída é uma máquina de dois
          estados, cada um com um trabalho:
        </P>
        <Bloco lang="jsx">{`visivel    → manda no \`hidden\`. Entra ANTES da animação de abrir, sai DEPOIS
             da de fechar. É a garantia de acessibilidade.

expandido  → manda no \`grid-template-rows: 0fr → 1fr\`. É a animação.`}</Bloco>
        <P>
          <code>grid-template-rows</code> em vez de medir <code>scrollHeight</code>: medir obriga a{' '}
          <strong>ler o layout a cada abertura</strong> (custo e travada), quebra quando o conteúdo
          muda de tamanho sozinho (uma imagem que carrega, uma lista que cresce) e trava a altura
          num número que envelhece. O <code>1fr</code> é "o que o conteúdo pedir" — e isso o
          navegador sabe interpolar. Sem medir nada, sem altura cravada.
        </P>
        <H3>O JS pergunta a duração ao CSS</H3>
        <Bloco lang="jsx">{`const segundos = parseFloat(getComputedStyle(el).transitionDuration)`}</Bloco>
        <P>
          O JS precisa saber quando a animação acabou, para só então esconder o painel de verdade.
          A alternativa óbvia — cravar <code>260</code> no TSX — cria dois lugares para mudar uma
          coisa só: alguém ajusta o token de duração, ninguém lembra do outro arquivo, e o painel
          some antes de terminar de fechar (ou fica fantasma depois de fechado).
        </P>
        <P>De brinde, isso resolve dois casos sem nenhuma linha a mais:</P>
        <P>
          <strong>1.</strong> <code>prefers-reduced-motion</code> zera a duração nos tokens → o
          valor lido é 0 → o painel some na hora, sem esperar uma animação que não vai acontecer.
        </P>
        <P>
          <strong>2.</strong> Em teste, o jsdom não aplica CSS → o valor lido é 0 → o comportamento
          é síncrono e não precisa de timer falso para ser verificado.
        </P>
      </Secao>

      <Secao titulo="Teclado">
        <P>
          O acordeão é uma pilha de <code>&lt;button&gt;</code> dentro de headings, e o teclado é o
          deles — não há <code>onKeyDown</code> no componente. A tabela é curta de propósito, e a
          linha mais informativa dela é a última: <strong>a ausência das setas é uma decisão</strong>,
          não um esquecimento.
        </P>
        <Teclado
          apg="https://www.w3.org/WAI/ARIA/apg/patterns/accordion/"
          atalhos={[
            { tecla: 'Tab', faz: <>Anda de gatilho em gatilho e, com a seção aberta, entra no painel. Painel fechado usa <code>hidden</code> de verdade, então o Tab <strong>pula o conteúdo escondido</strong> em vez de mandar o foco para um lugar invisível.</> },
            { tecla: 'Enter Espaço', faz: <>Abrem e fecham a seção focada. No modo <code>unico</code>, apertar na seção já aberta <strong>fecha</strong> — um acordeão que só deixa trocar prende a pessoa com um painel sempre na cara.</> },
            { tecla: '↑ ↓', faz: <><strong>Não fazem nada — de propósito.</strong> A APG trata setas em acordeão como <em>opcional</em>, e o Tab já alcança todos os gatilhos. Roubá-las quebraria as setas de dentro do painel, onde pode haver um campo, uma lista ou uma tabela que precisa delas. Meia implementação é pior que nenhuma.</> },
          ]}
        />
        <P>
          <code>ItemAcordeao disabled</code> usa o <code>disabled</code> de verdade do HTML (ao
          contrário da <code>Aba</code>): o gatilho <strong>sai da ordem de foco</strong>. Aqui isso
          não prende ninguém — cada seção é independente, então um gatilho fora do Tab não deixa o
          componente inalcançável. A seção continua na tela, visivelmente indisponível.
        </P>
      </Secao>

      <Secao titulo="Props">
        <H3>Acordeao</H3>
        <TabelaProps
          props={[
            { nome: 'tipo', tipo: "'unico' | 'multiplo'", padrao: "'unico'", descricao: 'Abrir um fecha o outro, ou cada um por si.' },
            { nome: 'valor', tipo: 'string | null  ·  string[]', descricao: <>Controlado. O tipo segue o <code>tipo</code>. Presente = controlado, e isso não muda no meio do caminho.</> },
            { nome: 'valorPadrao', tipo: 'string | null  ·  string[]', descricao: 'Não controlado: quem começa aberto. O caso comum.' },
            { nome: 'onChange', tipo: '(v: string | null) => void  ·  (v: string[]) => void', descricao: <>Discriminado pelo <code>tipo</code>. <code>unico</code> nunca entrega array.</> },
            { nome: 'className', tipo: 'string', descricao: 'Vai na raiz.' },
          ]}
        />
        <H3>ItemAcordeao</H3>
        <TabelaProps
          props={[
            { nome: 'valor', tipo: 'string', descricao: 'Identidade do item. Único e estável.' },
            { nome: 'titulo', tipo: 'ReactNode', descricao: 'O que a pessoa lê para decidir se abre. É o nome acessível do gatilho e da região.' },
            { nome: 'icone', tipo: 'ReactNode', descricao: 'Decorativo (aria-hidden). Quem narra a seção é o título.' },
            { nome: 'disabled', tipo: 'boolean', descricao: 'Sem conteúdo para mostrar (ainda). O gatilho continua visível: sumir com a seção faz a pessoa procurar o que "estava ali ontem".' },
            { nome: 'nivelTitulo', tipo: '2 | 3 | 4 | 5 | 6', padrao: '3', descricao: 'O nível do heading que embrulha o gatilho. Ajuste ao índice da página.' },
            { nome: 'className', tipo: 'string', descricao: 'Vai no item.' },
          ]}
        />
        <Aviso>
          Repare que <code>ItemAcordeao</code> usa o <code>disabled</code> <strong>de verdade</strong>{' '}
          do HTML — ao contrário de <code>&lt;Aba&gt;</code> e <code>&lt;ItemMenu&gt;</code>, que usam{' '}
          <code>aria-disabled</code>. Aqui não há roving tabindex: cada gatilho é tabulável por si,
          então um gatilho fora da ordem de foco não deixa ninguém preso. A consequência honesta é
          que o Tab pula a seção desabilitada — ela continua na tela, visivelmente indisponível.
        </Aviso>
        <P>
          <code>&lt;ItemAcordeao&gt;</code> fora de um <code>&lt;Acordeao&gt;</code> lança erro em
          vez de renderizar quebrado em silêncio.
        </P>
      </Secao>
    </>
  )
}
