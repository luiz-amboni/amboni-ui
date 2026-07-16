import { Card, CardHeader, CardBody, CardFooter, Button } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

export default function CardPage() {
  return (
    <>
      <Titulo eyebrow="Componentes" lead="A superfície que agrupa o que é relacionado — e só isso.">
        Card
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Card, CardHeader, CardBody, CardFooter } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Estrutura">
        <Demo
          variante="plain"
          codigo={`<Card>
  <CardHeader title="Campanhas" subtitle="ativas primeiro" />
  <CardBody>O conteúdo.</CardBody>
  <CardFooter>
    <Button variant="ghost" size="sm">Ver todas</Button>
  </CardFooter>
</Card>`}
        >
          <Card style={{ maxWidth: 420, width: '100%' }}>
            <CardHeader title="Campanhas" subtitle="ativas primeiro" />
            <CardBody>Três campanhas rodando, R$ 1.994 investidos nos últimos 30 dias.</CardBody>
            <CardFooter>
              <Button variant="ghost" size="sm">Ver todas</Button>
            </CardFooter>
          </Card>
        </Demo>
        <P>
          As partes são independentes: um card pode ter só corpo, ou cabeçalho e corpo, sem
          rodapé. Não existe ordem obrigatória imposta em código — mas inverter cabeçalho e
          corpo é sinal de que o que você quer não é um card.
        </P>
      </Secao>

      <Secao titulo="Elevação">
        <Demo
          variante="plain"
          codigo={`<Card elevation="flat">…</Card>      // padrão
<Card elevation="raised">…</Card>
<Card elevation="floating">…</Card>`}
        >
          {(['flat', 'raised', 'floating'] as const).map(e => (
            <Card key={e} elevation={e} style={{ width: 180 }}>
              <CardBody>
                <strong>{e}</strong>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                  {e === 'flat' ? 'o padrão' : e === 'raised' ? 'separa do fundo' : 'flutua de verdade'}
                </div>
              </CardBody>
            </Card>
          ))}
        </Demo>
        <Aviso>
          <strong>Por que o padrão é <code>flat</code>?</strong> Num painel de CRM tudo é card.
          Sombra em tudo vira ruído: quando tudo está elevado, nada está. A sombra fica reservada
          para o que realmente está por cima do resto — menu, modal, popover.
        </Aviso>
      </Secao>

      <Secao titulo="Card clicável">
        <Demo
          variante="plain"
          codigo={`<Card onCardClick={abrirDetalhe}>
  <CardBody>Clique em qualquer lugar</CardBody>
</Card>`}
        >
          <Card onCardClick={() => alert('Abriu o detalhe')} style={{ maxWidth: 320 }}>
            <CardBody>
              <strong>Campanha de julho</strong>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                Clique em qualquer lugar — ou dê Tab e Enter.
              </div>
            </CardBody>
          </Card>
        </Demo>
        <H3>Isso não é detalhe de implementação</H3>
        <P>
          Com <code>onCardClick</code> o card <strong>vira um <code>&lt;button&gt;</code> de
          verdade</strong> — não uma div com onClick. A diferença é o que a pessoa consegue fazer:
        </P>
        <FacaNaoFaca
          faca={{
            titulo: '<button> — recebe Tab, responde a Enter e Espaço',
            texto: 'O leitor de tela anuncia "botão, Campanha de julho". Quem não usa mouse chega lá.',
          }}
          naoFaca={{
            titulo: '<div onClick> — invisível para o teclado',
            texto: 'Não recebe foco, ignora Enter, e o leitor de tela lê o texto sem dizer que dá para clicar. A funcionalidade simplesmente não existe para essas pessoas.',
          }}
        />
      </Secao>

      <Secao titulo="O nível do título importa">
        <Demo
          variante="plain"
          codigo={`<CardHeader title="Resumo" headingLevel={2} />`}
        >
          <Card style={{ maxWidth: 320 }}>
            <CardHeader title="Resumo do mês" headingLevel={2} subtitle="renderiza um <h2> de verdade" />
          </Card>
        </Demo>
        <P>
          O título do card é um heading real (<code>h3</code> por padrão). Quem usa leitor de tela
          <strong> navega pelos títulos como um índice</strong> — pular do <code>h2</code> direto
          para o <code>h4</code> quebra esse índice. Ajuste <code>headingLevel</code> para o card
          caber na hierarquia da página onde ele está.
        </P>
      </Secao>

      <Secao titulo="Tabela dentro do card">
        <Demo
          variante="plain"
          codigo={`<CardBody flush>
  <table>…</table>
</CardBody>`}
        >
          <Card style={{ maxWidth: 420, width: '100%' }}>
            <CardHeader title="Últimos envios" />
            <CardBody flush>
              <table className="doc-table doc-table--fit">
                <thead><tr><th>Cliente</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>Maria S.</td><td><span className="doc-pill doc-pill--ok">lida</span></td></tr>
                  <tr><td>João P.</td><td><span className="doc-pill doc-pill--ok">entregue</span></td></tr>
                </tbody>
              </table>
            </CardBody>
          </Card>
        </Demo>
        <P>
          <code>flush</code> tira o respiro interno. Uma tabela precisa encostar na borda do card
          — com padding, a linha do cabeçalho fica "flutuando" e o alinhamento das colunas some.
        </P>
      </Secao>

      <Secao titulo="Props">
        <H3>Card</H3>
        <TabelaProps
          props={[
            { nome: 'elevation', tipo: "'flat' | 'raised' | 'floating'", padrao: "'flat'", descricao: 'Quanto o card se separa do fundo.' },
            { nome: 'onCardClick', tipo: '() => void', descricao: <>Torna o card inteiro clicável. <strong>Vira um <code>&lt;button&gt;</code></strong>, com foco e teclado.</> },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: 'Passado para o elemento raiz.' },
          ]}
        />
        <H3>CardHeader</H3>
        <TabelaProps
          props={[
            { nome: 'title', tipo: 'ReactNode', descricao: 'O título. Vira um heading de verdade.' },
            { nome: 'subtitle', tipo: 'ReactNode', descricao: 'Linha de apoio abaixo do título.' },
            { nome: 'action', tipo: 'ReactNode', descricao: 'Canto direito: filtro, botão, menu.' },
            { nome: 'headingLevel', tipo: '2 | 3 | 4 | 5 | 6', padrao: '3', descricao: 'Nível do título no documento.' },
          ]}
        />
        <Aviso>
          <strong>Por que <code>title</code> é ReactNode e não string?</strong> Porque o HTML já
          tem um atributo <code>title</code> — a dica que aparece ao passar o mouse — e ele só
          aceita texto. Os dois não cabem no mesmo nome, então a interface faz
          <code> Omit&lt;…, 'title'&gt;</code> para o nosso vencer. É o mesmo caminho que o MUI
          usa, e sem ele o TypeScript recusa a interface inteira.
        </Aviso>
        <H3>CardBody</H3>
        <TabelaProps
          props={[
            { nome: 'flush', tipo: 'boolean', padrao: 'false', descricao: 'Sem respiro interno — para tabela.' },
          ]}
        />
      </Secao>
    </>
  )
}
