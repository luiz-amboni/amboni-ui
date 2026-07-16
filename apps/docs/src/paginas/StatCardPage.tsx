import { StatCard } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

export default function StatCardPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="Um número que importa — com o contexto que impede alguém de tirar a conclusão errada dele."
      >
        StatCard
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { StatCard } from '@amboni/ui'`}</Bloco>
        <P>
          É o padrão mais copiado de qualquer painel. Antes desta biblioteca ele existia
          reescrito em <strong>3 telas do iSafe e 4 do VEAR</strong>, todos ligeiramente
          diferentes. Este é o único.
        </P>
      </Secao>

      <Secao titulo="Os três estados">
        <Demo
          variante="grid"
          codigo={`<StatCard label="Investido" value="R$ 1.994,31" sub="159.111 exibições" />
<StatCard label="Investido" value={null} />               // carregando
<StatCard label="Retorno (ROAS)" value="—"
          emptyReason="precisa de vendas atribuídas" />    // vazio`}
        >
          <StatCard label="Investido" value="R$ 1.994,31" sub="159.111 exibições" />
          <StatCard label="Investido" value={null} />
          <StatCard label="Retorno (ROAS)" value="—" emptyReason="precisa de vendas atribuídas" />
        </Demo>

        <H3>O estado vazio é o que separa o joio do trigo</H3>
        <P>
          Um traço solto na tela não informa nada. A pessoa fica sem saber se o sistema quebrou,
          se ainda está carregando, ou se o valor é zero mesmo — e a leitura mais comum é
          "está quebrado". <strong>Por isso <code>emptyReason</code> existe:</strong> ele
          transforma um traço mudo em "ainda não dá para calcular, e aqui está o porquê".
        </P>
        <Aviso>
          Quando o valor está vazio, o <code>sub</code> some e o <code>emptyReason</code> manda.
          Explicar por que não há número é sempre mais útil que dizer de onde ele viria.
        </Aviso>
      </Secao>

      <Secao titulo="Variação (delta)">
        <Demo
          variante="grid"
          codigo={`<StatCard label="Custo por conversa" value="R$ 14,25"
          delta={{ percent: 46, betterWhenUp: false }} />

<StatCard label="Pessoas alcançadas" value="140"
          delta={{ percent: 20, betterWhenUp: true }} />

<StatCard label="Investido" value="R$ 1.994"
          delta={{ percent: -23 }} />   // sem julgamento`}
        >
          <StatCard label="Custo por conversa" value="R$ 14,25" delta={{ percent: 46, betterWhenUp: false }} />
          <StatCard label="Pessoas alcançadas" value="140" delta={{ percent: 20, betterWhenUp: true }} />
          <StatCard label="Investido" value="R$ 1.994" delta={{ percent: -23 }} />
        </Demo>

        <H3>A prop mais importante é a que você pode omitir</H3>
        <P>
          <code>betterWhenUp</code> diz se subir é bom. <strong>Omitir é uma escolha
          válida e frequentemente a certa.</strong> Gastar 23% menos não é bom nem ruim por si
          só — depende de a campanha ter sido pausada ou de ter ficado mais eficiente. Pintar
          essa queda de verde seria o card <em>mentindo</em> para quem lê.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Omitir quando não há resposta certa',
            texto: 'Sem betterWhenUp o número fica cinza: mostra a variação, não emite juízo. Quem lê decide.',
          }}
          naoFaca={{
            titulo: 'Verde para tudo que sobe',
            texto: 'Custo subindo pintado de verde é pior que não ter cor nenhuma — vira um erro que parece um acerto.',
          }}
        />
        <P>
          O mesmo <code>betterWhenUp: false</code> serve para os dois lados: custo subindo fica
          vermelho, custo <strong>caindo</strong> fica verde. Uma prop, não duas.
        </P>
      </Secao>

      <Secao titulo="A cor nunca está sozinha">
        <P>
          Todo delta traz <strong>seta + número + texto</strong>, além da cor. Cerca de 1 em cada
          12 homens não distingue vermelho de verde: para essas pessoas, um card que só muda de
          cor não muda de nada. A seta aponta, o texto explica, a cor reforça — nessa ordem de
          importância.
        </P>
        <P>
          Variação abaixo de 1% vira <strong>"estável"</strong>, não "0%". Um "0%" com seta para
          cima é contraditório; "estável" é o que a pessoa queria saber.
        </P>
      </Secao>

      <Secao titulo="Tons">
        <Demo
          variante="grid"
          codigo={`<StatCard tone="brand" … />    // padrão
<StatCard tone="success" … />
<StatCard tone="warning" … />
<StatCard tone="danger" … />
<StatCard tone="neutral" … />`}
        >
          {(['brand', 'success', 'warning', 'danger', 'neutral'] as const).map(t => (
            <StatCard key={t} label={t} value="1.234" tone={t} sub="tom aplicado ao ícone e ao realce" />
          ))}
        </Demo>
        <P>
          O tom vem do <strong>tema</strong>, nunca de um hex. É por isso que estes cards
          continuam legíveis quando você troca a marca ou o tema no topo — sem nenhum ajuste no
          produto.
        </P>
      </Secao>

      <Secao titulo="Props">
        <TabelaProps
          props={[
            { nome: 'label', tipo: 'string', descricao: 'O que o número significa. Curto — vira versalete.' },
            { nome: 'value', tipo: 'string | null', descricao: <>Já formatado (<code>"R$ 1.994,31"</code>). <code>null</code> = carregando; <code>'—'</code> ou <code>''</code> = vazio.</> },
            { nome: 'emptyReason', tipo: 'string', descricao: 'Por que não há número. Mostrado no lugar do sub quando vazio.' },
            { nome: 'sub', tipo: 'ReactNode', descricao: 'De onde vem o número, ou o cálculo por trás.' },
            { nome: 'tone', tipo: "'brand' | 'success' | 'warning' | 'danger' | 'neutral'", padrao: "'brand'", descricao: 'Cor do ícone e do realce.' },
            { nome: 'icon', tipo: 'ReactNode', descricao: 'Decorativo — quem informa é o rótulo.' },
            { nome: 'delta', tipo: 'StatDelta', descricao: 'Variação vs. período anterior.' },
          ]}
        />
        <H3>StatDelta</H3>
        <TabelaProps
          props={[
            { nome: 'percent', tipo: 'number', descricao: 'Variação em %. Negativo = caiu. Abaixo de 1% vira "estável".' },
            { nome: 'betterWhenUp', tipo: 'boolean', descricao: <><strong>Omita quando não há julgamento.</strong> Sem ela o delta fica neutro.</> },
            { nome: 'suffix', tipo: 'string', padrao: "'vs. anterior'", descricao: 'Texto após o número.' },
          ]}
        />
        <Aviso tipo="warn">
          <code>value</code> é <strong>string</strong>, não number. Formatar moeda, porcentagem e
          milhar é decisão do produto (moeda? quantas casas? qual locale?) — o card não tenta
          adivinhar, porque adivinhar errado em dinheiro é caro.
        </Aviso>
      </Secao>
    </>
  )
}
