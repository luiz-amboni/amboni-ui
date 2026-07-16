import { Button, Card, CardHeader, CardBody, StatCard } from '@amboni/ui'
import { Secao, P, Demo, Aviso, Titulo, H3, Bloco } from '../lib/blocos'
import { VERIFICACOES } from './Acessibilidade'

export default function Inicio() {
  return (
    <>
      <Titulo
        eyebrow="Design system"
        lead={
          <>
            Componentes React que <strong>trocam de marca e de tema sem tocar em uma linha de
            código</strong>, e cuja legibilidade é verificada por teste automatizado — não por
            opinião. Use os dois seletores no topo: a página inteira reage.
          </>
        }
      >
        Uma base que não deixa você errar
      </Titulo>

      <Secao>
        <Demo variante="plain">
          <Button variant="primary">Ação principal</Button>
          <Button variant="secondary">Secundária</Button>
          <Button variant="ghost">Sutil</Button>
          <Button variant="danger">Apagar</Button>
          <Button variant="primary" loading>Salvando</Button>
        </Demo>
      </Secao>

      <Secao titulo="Por que ela existe">
        <P>
          Dois CRMs — iSafe e VEAR — repetiam o mesmo botão, o mesmo card e o mesmo número
          grande em telas diferentes, cada um com o seu tom de cinza. Quando o cinza de um
          mudava, o do outro ficava para trás. A biblioteca é onde essas decisões passam a
          morar uma vez só.
        </P>
        <P>
          Ela é <strong>neutra</strong>: não pertence a nenhuma das duas marcas. A cor é um
          parâmetro (<code>data-amb-brand</code>), não uma constante enterrada no CSS.
        </P>
      </Secao>

      <Secao titulo="O que ela resolve de verdade">
        <Demo variante="grid">
          {/* `value` curto de propósito: a própria doc do StatCard diz que o número é o
              protagonista. "28 combinações" quebrava em duas linhas e virava frase. */}
          <StatCard
            label="Contraste verificado"
            value={String(VERIFICACOES)}
            sub="combinações conferidas ao vivo"
            tone="success"
          />
          <StatCard label="Marcas suportadas" value="2" sub="mesmo código, cores diferentes" />
          <StatCard label="Hex nos componentes" value="0" sub="tudo lê var(--amb-*)" tone="brand" />
        </Demo>

        <H3>Acessibilidade que reprova o build</H3>
        <P>
          O teste que verifica contraste descobriu que o <strong>azul da marca iSafe, usado como
          fundo de botão com texto branco, dava 2,91:1</strong> — a norma pede 4,5:1. Os botões
          principais do CRM estavam ilegíveis desde sempre, e ninguém tinha visto. A biblioteca
          viu no primeiro dia.
        </P>
        <Aviso>
          A cor da marca não morreu: ela vive em <code>brandVivid</code>, para decoração — onde
          não existe texto por cima para ficar ilegível. O que mudou foi <strong>onde</strong> ela
          pode aparecer.
        </Aviso>

        <H3>Um tema é um parâmetro, não um fork</H3>
        <Bloco lang="jsx">{`<html data-amb-brand="vear" data-amb-theme="dark">`}</Bloco>
        <P>
          É isso. Nenhum componente sabe que a VEAR existe — todos leem o mesmo
          <code> var(--amb-color-brand-solid)</code>, e o valor por trás é que muda.
        </P>
      </Secao>

      <Secao titulo="Um exemplo real">
        <Demo variante="centro">
          <Card elevation="raised" style={{ maxWidth: 380 }}>
            <CardHeader title="Campanha de julho" subtitle="Meta Ads · últimos 30 dias" />
            <CardBody>
              <div style={{ display: 'grid', gap: 12 }}>
                <StatCard label="Investido" value="R$ 1.994,31" sub="159.111 exibições" />
                <StatCard
                  label="Custo por conversa"
                  value="R$ 14,25"
                  delta={{ percent: 46, betterWhenUp: false }}
                />
              </div>
            </CardBody>
          </Card>
        </Demo>
        <P>
          Troque a marca e o tema no topo. Nada aqui foi escrito duas vezes.
        </P>
      </Secao>

      <Secao titulo="Comece por aqui">
        <Demo variante="plain">
          <Button variant="primary" onClick={() => (location.hash = '#/instalacao')}>
            Instalação →
          </Button>
          <Button variant="secondary" onClick={() => (location.hash = '#/cores')}>
            Ver os fundamentos
          </Button>
        </Demo>
      </Secao>
    </>
  )
}
