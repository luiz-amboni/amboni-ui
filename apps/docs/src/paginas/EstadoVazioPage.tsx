import { EstadoVazio, Button, Card, CardBody } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

/** Ícones desenhados aqui: a biblioteca não impõe pacote de ícones, e a doc segue a regra. */
function IconeMegafone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z" strokeLinejoin="round" />
      <path d="M14 8.5a4 4 0 0 1 0 7M17 6a7.5 7.5 0 0 1 0 12" strokeLinecap="round" />
    </svg>
  )
}

function IconeLupa() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" strokeLinecap="round" />
    </svg>
  )
}

export default function EstadoVazioPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="A tela em branco que explica a si mesma. É o componente que mais gente trata como detalhe e mais gera chamado no suporte."
      >
        EstadoVazio
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { EstadoVazio } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo='"Nenhum resultado" não ajuda ninguém'>
        <Demo
          variante="plain"
          codigo={`<EstadoVazio
  titulo="Nenhum cliente com esse filtro"
  descricao="Ninguém comprou nos últimos 7 dias. Tente um período maior."
  acao={<Button onClick={limparFiltros}>Limpar filtros</Button>}
/>`}
        >
          <Card style={{ width: '100%' }}>
            <CardBody>
              <EstadoVazio
                titulo="Nenhum cliente com esse filtro"
                descricao="Ninguém comprou nos últimos 7 dias. Tente um período maior."
                acao={<Button onClick={() => {}}>Limpar filtros</Button>}
              />
            </CardBody>
          </Card>
        </Demo>
        <P>
          A pessoa está olhando para o nada. Ela <strong>já sabe</strong> que não há resultado —
          é a única coisa que a tela em branco comunica sozinha. O que ela não sabe é se filtrou
          demais, se ainda não cadastrou nada, ou se o sistema quebrou.{' '}
          <strong>E a leitura mais comum é "quebrou".</strong>
        </P>
        <P>
          Um estado vazio bom responde três coisas: <strong>o que aconteceu</strong> (título),{' '}
          <strong>por quê</strong> (descrição) e <strong>o que fazer agora</strong> (ação). É a
          mesma tese do <code>emptyReason</code> do StatCard: explicar a ausência vale mais que
          decorá-la.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: '"Nenhum cliente com esse filtro"',
            texto: 'Nomeia o que faltou e insinua a causa na mesma linha. A pessoa já sabe onde mexer antes de ler a descrição.',
          }}
          naoFaca={{
            titulo: '"Nenhum resultado"',
            texto: 'Repete para a pessoa o que ela está vendo. Ocupa o espaço da explicação sem explicar — é uma tela vazia com mais passos.',
          }}
        />
      </Secao>

      <Secao titulo="Os dois vazios são problemas diferentes">
        <P>
          Esta é a decisão que o componente não pode tomar por você — e a que separa um estado
          vazio útil de um enfeite.
        </P>

        <H3>1. Vazio por filtro — existem dados, o filtro escondeu</H3>
        <Demo
          variante="plain"
          codigo={`<EstadoVazio
  icone={<Lupa />}
  titulo="Nenhum cliente com esse filtro"
  descricao="Nenhum cliente comprou nos últimos 7 dias. Tente um período maior."
  acao={<Button onClick={limparFiltros}>Limpar filtros</Button>}
/>`}
        >
          <Card style={{ width: '100%' }}>
            <CardBody>
              <EstadoVazio
                icone={<IconeLupa />}
                titulo="Nenhum cliente com esse filtro"
                descricao="Nenhum cliente comprou nos últimos 7 dias. Tente um período maior."
                acao={<Button onClick={() => {}}>Limpar filtros</Button>}
              />
            </CardBody>
          </Card>
        </Demo>
        <P>
          A pessoa fez algo e o sistema respondeu com nada. Ela precisa{' '}
          <strong>desfazer</strong>. A ação é <em>limpar o filtro</em>, nunca "criar":{' '}
          <strong>oferecer "Novo cliente" para quem tem 4.000 clientes e filtrou errado é
          responder outra pergunta.</strong>
        </P>

        <H3>2. Vazio porque é novo — não existe dado nenhum</H3>
        <Demo
          variante="plain"
          codigo={`<EstadoVazio
  icone={<Megafone />}
  titulo="Nenhuma campanha ainda"
  descricao="Campanhas reativam quem não compra há mais de 6 meses."
  acao={<Button variant="primary" onClick={criar}>Criar campanha</Button>}
  size="lg"
/>`}
        >
          <Card style={{ width: '100%' }}>
            <CardBody>
              <EstadoVazio
                icone={<IconeMegafone />}
                titulo="Nenhuma campanha ainda"
                descricao="Campanhas reativam quem não compra há mais de 6 meses."
                acao={<Button variant="primary" onClick={() => {}}>Criar campanha</Button>}
                size="lg"
              />
            </CardBody>
          </Card>
        </Demo>
        <P>
          Aqui a tela vazia é a <strong>primeira aula do produto</strong> — e muitas vezes a única
          que a pessoa vai ter. Diga para que serve a coisa e dê o caminho para começar. A ação é{' '}
          <em>criar</em>, e aqui a primária se justifica: é literalmente o que a pessoa veio
          fazer.
        </P>
        <Aviso tipo="warn">
          <strong>Vazio por erro é outra coisa — não use este componente.</strong> Erro pede
          tentar de novo e <em>precisa parecer erro</em>. Vazio é um estado normal do sistema; se
          os dois têm o mesmo desenho, a pessoa aprende a ignorar os dois.
        </Aviso>
      </Secao>

      <Secao titulo="O título é um <p>, não um heading">
        <Bloco lang="jsx">{`// Dentro de um Card que já tem heading:
<Card>
  <CardHeader title="Clientes" />        {/* <h3> — este é o heading da seção */}
  <CardBody flush>
    <Tabela vazio={<EstadoVazio titulo="Nenhum cliente com esse filtro" />} … />
  </CardBody>
</Card>`}</Bloco>
        <P>
          Este componente quase sempre vive <strong>dentro</strong> de um card ou de uma tabela. Um{' '}
          <code>&lt;h3&gt;</code> solto ali dentro entra no índice que o leitor de tela usa para
          navegar a página — e{' '}
          <strong>"Nenhum cliente com esse filtro" viraria uma seção do documento</strong>, ao
          lado de "Clientes" e "Campanhas". A lista de headings é o mapa da página; ela não pode
          ter estados transitórios dentro.
        </P>
        <P>
          Quem precisa de um heading de verdade põe um <code>&lt;CardHeader&gt;</code> em volta —
          que é onde o heading pertence de qualquer forma.
        </P>
      </Secao>

      <Secao titulo="Tamanhos">
        <Demo
          variante="plain"
          codigo={`<EstadoVazio size="sm" … />   // dentro de tabela ou card pequeno
<EstadoVazio size="md" … />   // dentro de card — o padrão
<EstadoVazio size="lg" … />   // página inteira vazia`}
        >
          {(['sm', 'md', 'lg'] as const).map(s => (
            <Card key={s} style={{ width: '100%' }}>
              <CardBody>
                <EstadoVazio size={s} titulo={`size="${s}"`} descricao="O título e o respiro crescem juntos." />
              </CardBody>
            </Card>
          ))}
        </Demo>
        <P>
          O componente <strong>não tem borda nem fundo próprio</strong>, de propósito: ele aparece
          dentro de um Card ou de uma Tabela, que já têm a sua superfície. Caixa dentro de caixa é
          ruído.
        </P>
        <P>
          O texto para em <strong>42ch</strong>. Linha longa demais é cansativa de ler, e aqui são
          uma ou duas frases que precisam ser lidas <em>de fato</em> — se ninguém ler a descrição,
          o componente inteiro perde a razão de existir. Pelo mesmo motivo a descrição usa o cinza{' '}
          <code>secondary</code>, não o <code>muted</code>: ela é a parte que explica.
        </P>
      </Secao>

      <Secao titulo="Dentro da Tabela">
        <Bloco lang="jsx">{`<Tabela
  linhas={[]}
  vazio={
    <EstadoVazio
      size="sm"
      titulo="Nenhum cliente com esse filtro"
      acao={<Button size="sm" onClick={limpar}>Limpar filtros</Button>}
    />
  }
  …
/>`}</Bloco>
        <P>
          É o casamento mais comum dos dois. A <code>&lt;Tabela&gt;</code>{' '}
          <strong>avisa no console, em desenvolvimento</strong>, quando fica vazia sem a prop{' '}
          <code>vazio</code> — o mesmo tipo de aviso que o Button dá para botão de ícone sem{' '}
          <code>aria-label</code>. Sem a prop, ela cai num "Nada para mostrar aqui" genérico, que
          é exatamente o que esta página inteira desaconselha: um pedido de socorro, não um
          padrão.
        </P>
        <P>
          Use <code>size="sm"</code> ali: a tabela já tem cabeçalho em volta, e o{' '}
          <code>md</code> empurraria demais o rodapé da página.
        </P>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'titulo', tipo: 'string', descricao: <><strong>Obrigatório.</strong> O que aconteceu, em uma linha. Nunca "Nenhum resultado".</> },
            { nome: 'descricao', tipo: 'ReactNode', descricao: 'Por que está vazio e o que fazer agora. É aqui que o componente ganha utilidade.' },
            { nome: 'acao', tipo: 'ReactNode', descricao: <>Um <code>&lt;Button&gt;</code>. Limpar o filtro ou criar o primeiro registro — nunca os dois.</> },
            { nome: 'icone', tipo: 'ReactNode', descricao: 'Decorativo (aria-hidden). Discreto de propósito: quem resolve o problema da pessoa é o texto.' },
            { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'sm dentro de tabela; md dentro de card; lg para página inteira vazia.' },
            { nome: 'className', tipo: 'string', descricao: 'Para o raro caso de precisar de um espaçamento diferente.' },
          ]}
        />
        <Aviso>
          Não há <code>…rest</code>: a lista de props é fechada. Um estado vazio que aceita{' '}
          <code>onClick</code> no container é um convite a transformá-lo em botão gigante
          invisível — e a ação já tem lugar próprio.
        </Aviso>
      </Secao>
    </>
  )
}
