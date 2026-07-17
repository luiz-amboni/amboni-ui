import { useState } from 'react'
import {
  Abas,
  Aba,
  Button,
  Card,
  CardBody,
  CardHeader,
  EstadoVazio,
  ListaAbas,
  PainelAba,
  Selo,
  StatCard,
  Tabela,
  type Coluna,
  type SeloTom,
} from '@amboni/ui'
import { Secao, P, Titulo, H3, Aviso as Destaque, Bloco, FacaNaoFaca } from '../lib/blocos'
import './exemplos.css'

/**
 * Painel de CRM — a tela que todo produto tem e quase todo produto erra do mesmo jeito:
 * números grandes, bonitos, e sem nada que impeça a leitura errada deles.
 */

type StatusEnvio = 'entregue' | 'lido' | 'enviado' | 'falhou'

interface Envio {
  id: number
  cliente: string
  template: string
  quando: string
  status: StatusEnvio
}

/**
 * O texto vem primeiro no par, e é isso que o mapa deixa explícito: o tom REFORÇA a
 * palavra, nunca a substitui. Quem não distingue vermelho lê "Falhou" do mesmo jeito.
 */
const STATUS: Record<StatusEnvio, { rotulo: string; tom: SeloTom }> = {
  lido: { rotulo: 'Lido', tom: 'sucesso' },
  entregue: { rotulo: 'Entregue', tom: 'info' },
  enviado: { rotulo: 'Enviado', tom: 'neutro' },
  falhou: { rotulo: 'Falhou', tom: 'perigo' },
}

const ENVIOS: Envio[] = [
  { id: 1, cliente: 'Marina Rodrigues', template: 'dica_d15_iphone', quando: 'há 12 min', status: 'lido' },
  { id: 2, cliente: 'Carlos Eduardo Souza', template: 'boas_vindas_d3', quando: 'há 40 min', status: 'entregue' },
  { id: 3, cliente: 'Juliana Beatriz Alves', template: 'oferta_d90_capa', quando: 'há 1 h', status: 'entregue' },
  { id: 4, cliente: 'Rafael Menezes', template: 'dica_d15_macbook', quando: 'há 2 h', status: 'falhou' },
  { id: 5, cliente: 'Patrícia Nogueira', template: 'aniversario_d365', quando: 'há 3 h', status: 'enviado' },
  { id: 6, cliente: 'Bruno Tavares', template: 'prova_social_d30', quando: 'há 4 h', status: 'lido' },
]

const COLUNAS: Coluna<Envio>[] = [
  { chave: 'cliente', titulo: 'Cliente' },
  {
    chave: 'template',
    titulo: 'Template',
    render: l => <code className="ex-mono">{l.template}</code>,
  },
  { chave: 'quando', titulo: 'Quando', alinhar: 'direita' },
  {
    chave: 'status',
    titulo: 'Status',
    alinhar: 'direita',
    render: l => (
      <Selo tom={STATUS[l.status].tom} pontinho>
        {STATUS[l.status].rotulo}
      </Selo>
    ),
  },
]

/** Os números de cada período. Fixos: é um exemplo, não um relatório. */
const PERIODOS = {
  '7d': {
    investido: 'R$ 1.994,31',
    investidoSub: '159.111 exibições',
    investidoDelta: { percent: -12.4, suffix: 'vs. 7 dias antes' },
    conversas: '184',
    conversasDelta: { percent: 8.2, betterWhenUp: true, suffix: 'vs. 7 dias antes' },
    custo: 'R$ 10,84',
    custoDelta: { percent: -19.1, betterWhenUp: false, suffix: 'vs. 7 dias antes' },
    envios: ENVIOS,
  },
  '30d': {
    investido: 'R$ 8.412,00',
    investidoSub: '702.480 exibições',
    investidoDelta: { percent: 4.9, suffix: 'vs. 30 dias antes' },
    conversas: '731',
    conversasDelta: { percent: -3.1, betterWhenUp: true, suffix: 'vs. 30 dias antes' },
    custo: 'R$ 11,51',
    custoDelta: { percent: 6.4, betterWhenUp: false, suffix: 'vs. 30 dias antes' },
    envios: ENVIOS,
  },
  hoje: {
    investido: 'R$ 96,20',
    investidoSub: '7.310 exibições',
    investidoDelta: undefined,
    conversas: '9',
    conversasDelta: undefined,
    custo: 'R$ 10,69',
    custoDelta: undefined,
    envios: [] as Envio[],
  },
} as const

type ChavePeriodo = keyof typeof PERIODOS

function Painel() {
  const [periodo, setPeriodo] = useState<ChavePeriodo>('7d')
  const p = PERIODOS[periodo]

  return (
    <div className="ex-palco">
      <div className="ex-topo">
        <span className="ex-topo__nome">iSafe CRM</span>
        <span className="ex-topo__spacer" />
        <Button size="sm">Exportar</Button>
      </div>

      <div className="ex-corpo">
        <div>
          <h3 className="ex-corpo__titulo">Painel</h3>
          <p className="ex-corpo__sub">Campanhas de WhatsApp e anúncios, lado a lado.</p>
        </div>

        {/* `pilula` e não `linha`: as abas aqui não navegam entre seções — elas trocam a
            LENTE sobre o mesmo dado. A pastilha é o que diz "é o mesmo painel, outro
            recorte". */}
        <Abas valor={periodo} onChange={v => setPeriodo(v as ChavePeriodo)} variante="pilula">
          <ListaAbas aria-label="Período do painel">
            <Aba valor="hoje">Hoje</Aba>
            <Aba valor="7d">7 dias</Aba>
            <Aba valor="30d">30 dias</Aba>
          </ListaAbas>

          <PainelAba valor={periodo}>
            <div className="ex-pilha ex-painel">
              <div className="ex-stats">
                <StatCard
                  label="Investido"
                  value={p.investido}
                  sub={p.investidoSub}
                  tone="neutral"
                  delta={p.investidoDelta}
                />
                <StatCard
                  label="Conversas iniciadas"
                  value={p.conversas}
                  sub="cliques que viraram conversa"
                  delta={p.conversasDelta}
                />
                <StatCard
                  label="Custo por conversa"
                  value={p.custo}
                  sub="investido ÷ conversas"
                  tone="success"
                  delta={p.custoDelta}
                />
                {/* Carregando de verdade: este número vem da Meta, que demora — e o
                    esqueleto segura o layout no lugar em vez de deixar a linha pular
                    quando ele chega. */}
                <StatCard label="Alcance" value={null} sub="direto da Meta" />
                {/* Vazio COM motivo. Um traço solto faria a pessoa achar que quebrou. */}
                <StatCard
                  label="Retorno (ROAS)"
                  value="—"
                  emptyReason="precisa de vendas atribuídas"
                  tone="neutral"
                />
              </div>

              <Card>
                <CardHeader
                  title="Últimos envios"
                  subtitle="Mensagens automáticas do pipeline D+N"
                  headingLevel={4}
                  action={<Button size="sm">Ver todos</Button>}
                />
                {/* flush: a tabela precisa encostar na borda do card. Com o respiro
                    padrão do CardBody, ela flutuaria dentro dele. */}
                <CardBody flush>
                  <Tabela
                    rotulo="Últimos envios do pipeline"
                    colunas={COLUNAS}
                    linhas={p.envios}
                    chaveLinha={l => l.id}
                    vazio={
                      <EstadoVazio
                        titulo="Nenhum envio hoje ainda"
                        descricao="O pipeline roda às 9h. Os envios de hoje aparecem aqui a partir daí."
                        acao={<Button size="sm">Ver os de ontem</Button>}
                        size="sm"
                      />
                    }
                  />
                </CardBody>
              </Card>
            </div>
          </PainelAba>
        </Abas>
      </div>
    </div>
  )
}

export default function ExemploDashboardPage() {
  return (
    <>
      <Titulo
        eyebrow="Exemplos de tela"
        lead="Um painel de CRM inteiro: os três estados do StatCard, a tabela que explica o próprio vazio, e um delta que se recusa a julgar."
      >
        Painel
      </Titulo>

      <Secao>
        <P>
          Painel é a tela mais fácil de fazer bonita e a mais fácil de fazer mentirosa.
          Número grande, seta verde, pronto — ninguém pergunta verde por quê. As decisões
          abaixo são todas sobre isso.
        </P>
        <P>Troque o período: "Hoje" ainda não tem envios, e é aí que a tela mostra do que é feita.</P>
      </Secao>

      <Secao titulo="A tela">
        <Painel />
      </Secao>

      <Secao titulo="As decisões desta tela">
        <H3>O delta de "Investido" não tem betterWhenUp — de propósito</H3>
        <P>
          Gastar 12% menos em anúncios é bom ou ruim? <strong>Não dá para saber.</strong> Pode
          ser eficiência, pode ser que a campanha morreu e ninguém viu. Se passássemos{' '}
          <code>betterWhenUp: false</code>, a queda apareceria em verde — e o painel estaria
          afirmando, em cor, uma conclusão que ninguém apurou. Sem a prop, o delta mostra o
          número e a direção, e cala a boca sobre o mérito.
        </P>
        <P>
          "Conversas iniciadas" tem <code>betterWhenUp: true</code> porque aí existe
          julgamento: mais conversa é mais oportunidade, sempre. E "Custo por conversa" tem{' '}
          <code>betterWhenUp: false</code> — cair é bom, e o cartão diz isso.
        </P>

        <FacaNaoFaca
          faca={{
            titulo: 'Omita quando não há resposta',
            texto: 'delta={{ percent: -12.4 }} — mostra a variação sem pintar um veredito que ninguém deu.',
          }}
          naoFaca={{
            titulo: 'Escolher uma cor no chute',
            texto: 'betterWhenUp: false em "Investido" pinta de verde o dia em que a campanha caiu.',
          }}
        />

        <H3>Os três estados do StatCard aparecem juntos</H3>
        <P>
          <code>value</code> preenchido, <code>value={'{null}'}</code> (esqueleto) e{' '}
          <code>value="—"</code> com <code>emptyReason</code>. O terceiro é o que separa o
          joio do trigo: "Retorno (ROAS) —" sozinho faz a pessoa abrir um chamado. "Retorno
          (ROAS) — precisa de vendas atribuídas" faz ela entender que o sistema está bem e o
          dado é que não chegou.
        </P>

        <H3>A tabela vazia diz o que fazer</H3>
        <P>
          "Nenhum resultado" é a informação que a pessoa já tinha, olhando a tela em branco. O{' '}
          <code>vazio</code> desta tabela diz <em>por que</em> ("o pipeline roda às 9h") e
          oferece a saída ("ver os de ontem"). Um estado vazio sem motivo é indistinguível de
          um bug.
        </P>

        <Destaque>
          O <code>EstadoVazio</code> vai <code>size="sm"</code> aqui: ele está dentro de um
          card, não ocupando a página. O <code>lg</code> é para quando a tela inteira está
          vazia.
        </Destaque>

        <H3>Selo com texto, sempre</H3>
        <P>
          A coluna de status usa <code>Selo</code> — "Lido", "Entregue", "Falhou" escritos por
          extenso, com o tom só reforçando. O <code>pontinho</code> existe para o olho achar a
          linha certa varrendo a coluna, não para informar. Tire as cores da tela e ela
          continua legível: é o teste.
        </P>

        <H3>CardBody flush para a tabela</H3>
        <P>
          A tabela encosta na borda do card. Com o respiro padrão do <code>CardBody</code>,
          ela ficaria flutuando dentro dele, com duas molduras concêntricas e um corredor de
          nada entre as duas.
        </P>

        <Bloco lang="tsx">{`<StatCard label="Investido" value="R$ 1.994,31"
          delta={{ percent: -12.4, suffix: 'vs. 7 dias antes' }} />        // sem julgamento
<StatCard label="Custo por conversa" value="R$ 10,84" tone="success"
          delta={{ percent: -19.1, betterWhenUp: false }} />               // cair é bom
<StatCard label="Alcance" value={null} />                                 // carregando
<StatCard label="Retorno (ROAS)" value="—"
          emptyReason="precisa de vendas atribuídas" />                    // vazio, com motivo

<Card>
  <CardHeader title="Últimos envios" headingLevel={4} action={<Button size="sm">Ver todos</Button>} />
  <CardBody flush>
    <Tabela colunas={COLUNAS} linhas={envios} chaveLinha={l => l.id}
            vazio={<EstadoVazio titulo="Nenhum envio hoje ainda" size="sm"
                                descricao="O pipeline roda às 9h." />} />
  </CardBody>
</Card>`}</Bloco>
      </Secao>
    </>
  )
}
