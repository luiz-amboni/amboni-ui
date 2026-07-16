import { Dica, Button } from '@amboni/ui'
// `Aviso` da biblioteca é o toast; `Aviso` dos blocos é a caixa de destaque do site.
import { Secao, P, Demo, Titulo, H3, Aviso as Destaque, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

export default function DicaPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="O balão de ajuda — e a verdade incômoda sobre ele: metade das pessoas nunca vai ver o que você escrever aqui."
      >
        Dica
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Dica } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Leia antes de usar">
        <P>
          <strong>Nunca ponha na Dica algo que a pessoa precise saber.</strong> Não é
          conservadorismo — é o que o formato é:
        </P>
        <P>
          <strong>No celular não existe hover.</strong> Toque não é passar o mouse. Quem está no
          celular — a maioria — simplesmente nunca vê o conteúdo de uma Dica. Um tooltip é
          inacessível por natureza ali, e nenhuma implementação conserta isso.
        </P>
        <P>
          <strong>Quem enxerga pouco navega com zoom de 200–400%.</strong> O balão aparece fora
          do recorte ampliado, ou tampa exatamente o que a pessoa estava lendo.
        </P>
        <P>
          <strong>Quem tem tremor ou usa switch</strong> não consegue segurar o ponteiro parado
          o tempo todo da leitura.
        </P>
        <Destaque tipo="warn">
          Se a informação é necessária para decidir ou agir, ela vai <strong>na tela</strong>: um
          rótulo, um texto de apoio embaixo do campo, uma linha no card. A Dica serve para o que
          é bônus — lembrar o nome inteiro de uma sigla, dizer de onde veio um número.
        </Destaque>
        <FacaNaoFaca
          faca={{
            titulo: 'O gatilho se explica sozinho; a Dica complementa',
            texto: '<button aria-label="Excluir cliente"><Lixeira /></button> — a Dica pode repetir ou detalhar, e nada se perde se ela nunca abrir.',
          }}
          naoFaca={{
            titulo: 'A Dica é a única forma de saber o que o botão faz',
            texto: 'Um ícone mudo com <Dica conteudo="Excluir cliente"> some inteiro no celular: a pessoa aperta sem saber o que vai acontecer.',
          }}
        />
      </Secao>

      <Secao titulo="Uso">
        <Demo
          codigo={`<Dica conteudo="Retorno sobre o investimento em anúncios">
  <Button variant="ghost" size="sm" aria-label="Sobre o ROAS">?</Button>
</Dica>

<Dica conteudo="Sai do Bling às 3h da manhã" lado="baixo">
  <Button variant="ghost" size="sm">Atualizado hoje</Button>
</Dica>`}
        >
          <Dica conteudo="Retorno sobre o investimento em anúncios">
            <Button variant="ghost" size="sm" aria-label="Sobre o ROAS">?</Button>
          </Dica>
          <Dica conteudo="Sai do Bling às 3h da manhã" lado="baixo">
            <Button variant="ghost" size="sm">Atualizado hoje</Button>
          </Dica>
          <Dica conteudo="Só pedidos de 26/04/2026 em diante" lado="dir">
            <Button variant="ghost" size="sm">Período</Button>
          </Dica>
        </Demo>
        <P>
          <code>children</code> é <strong>um</strong> elemento, e ele precisa receber foco:
          <code> &lt;button&gt;</code>, <code>&lt;a&gt;</code>, um campo. Um
          <code> &lt;span&gt;</code> não recebe foco — e uma Dica pendurada nele só existe para
          quem tem mouse.
        </P>
      </Secao>

      <Secao titulo="O que ela faz certo">
        <H3>Abre no foco, não só no hover</H3>
        <P>
          Chegou de Tab, a Dica abre — <strong>sem atraso</strong>. O atraso de 500ms existe para
          o mouse poder atravessar a tela sem acender uma dica atrás da outra pelo caminho. Quem
          chegou pelo teclado pediu para estar ali: esperar meio segundo seria só um travamento.
        </P>
        <H3>Esc fecha</H3>
        <P>
          Inclusive a dica aberta por hover, sem foco nenhum. É por isso que o listener de
          teclado fica no <code>document</code> e não no gatilho: aberta por hover, a Dica não
          tem o foco, e um listener no gatilho nunca veria a tecla. A WCAG 1.4.13 pede que dê
          para dispensar sem tirar o ponteiro do lugar.
        </P>
        <H3>Liga por aria-describedby, não por title</H3>
        <P>
          O <code>title</code> do HTML é lento, feio, não estilizável e some no celular. Um
          <code> role="tooltip"</code> solto o leitor de tela ignora, porque ninguém aponta para
          ele. A Dica faz o <code>cloneElement</code> só para pôr o <code>aria-describedby</code>
          <strong> no elemento que recebe foco</strong> — descrição pendurada no invólucro não é
          anunciada. E preserva o <code>aria-describedby</code> que o produto já tenha posto lá:
          sobrescrever seria apagar uma ligação alheia.
        </P>
        <P>
          O balão fica sempre no documento (<code>hidden</code>, não desmontado) para o
          <code> aria-describedby</code> ter um alvo estável. Elemento escondido referenciado por
          <code> describedby</code> continua entrando no cálculo da descrição — é assim que o
          leitor de tela anuncia o texto no foco, sem depender de um hover que ele não faz.
        </P>
      </Secao>

      <Secao titulo="Posição é preferência, não garantia">
        <P>
          <code>lado</code> diz onde você prefere. Se não couber, o balão é <strong>empurrado
          para dentro da janela</strong>, a 8px da borda. A Dica é <code>position: fixed</code> e
          recalcula na rolagem de qualquer contêiner no caminho — a tabela com
          <code> overflow</code> inclusive, porque rolagem de elemento não borbulha.
        </P>
        <P>
          Não há setinha apontando para o gatilho: num balão empurrado para o canto, a seta
          apontaria para o nada — pior do que não ter. Quem liga o balão ao gatilho é o deslize
          de 4px vindo do lado certo.
        </P>
      </Secao>

      <Secao titulo="Limitações conhecidas">
        <P>
          <strong>1. Não faz "flip".</strong> Num canto apertado o balão é empurrado para dentro
          da janela e pode <em>cobrir o gatilho</em>, em vez de virar para o lado oposto.
          Preferimos tampar o gatilho a cortar o texto pela metade — texto cortado não se lê de
          jeito nenhum.
        </P>
        <P>
          <strong>2. O balão não é "hoverable"</strong> (<code>pointer-events: none</code>). Quem
          usa lupa não consegue levar o ponteiro até ele para ler devagar: mover o mouse na
          direção do balão fecha a Dica. É um <strong>desvio consciente da WCAG 1.4.13</strong>,
          e a razão de <code>conteudo</code> ser texto curto. Para o que precisa de leitura calma
          — ou de um link dentro — o certo é o <code>Dialogo</code>, não uma dica maior.
        </P>
        <P>
          <strong>3. Ancestral com <code>transform</code></strong> (ou <code>filter</code>, ou
          <code> will-change</code>) vira bloco contedor do <code>position: fixed</code>: a Dica
          passa a se posicionar em relação a <em>ele</em>, não à janela, e sai do lugar.
        </P>
        <P>
          <strong>4. Esc dentro de um Dialogo fecha os dois.</strong> O mesmo Esc dispensa a Dica
          e cancela o modal, porque o <code>cancel</code> do <code>&lt;dialog&gt;</code> é ação
          padrão do navegador e não passa por aqui para ser barrado.
        </P>
        <Destaque>
          <strong>Por que não usar portal, então?</strong> Um portal para o <code>&lt;body&gt;</code>
          resolveria o item 3 e o clipping — e trocaria um bug raro por um garantido: dentro de um
          <code> &lt;dialog&gt;</code> (top layer), a Dica portalada renderiza <strong>atrás</strong>
          do modal e some. Como esta biblioteca tem <code>Dialogo</code> e <code>Gaveta</code>
          cheios de controles com dica, escolhemos o bug raro em vez do certo.
        </Destaque>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'conteudo', tipo: 'ReactNode', descricao: <>Texto curto. Sem link, sem botão — o balão não é alcançável pelo ponteiro.</> },
            { nome: 'lado', tipo: "'cima' | 'baixo' | 'esq' | 'dir'", padrao: "'cima'", descricao: 'Preferência, não garantia: se não couber, é empurrado para dentro da janela.' },
            { nome: 'atraso', tipo: 'number', padrao: '500', descricao: <>Espera antes de abrir <strong>no hover</strong>, em ms. No foco por teclado não se aplica.</> },
            { nome: 'children', tipo: 'ReactElement', descricao: <>UM elemento, e ele precisa receber foco (<code>&lt;button&gt;</code>, <code>&lt;a&gt;</code>, campo).</> },
            { nome: 'className', tipo: 'string', descricao: 'Vai para o invólucro, não para o balão.' },
          ]}
        />
      </Secao>
    </>
  )
}
