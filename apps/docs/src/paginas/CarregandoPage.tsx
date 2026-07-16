import { Giro, Progresso, Esqueleto } from '@amboni/ui'
// `Aviso` da biblioteca é o toast; `Aviso` dos blocos é a caixa de destaque do site.
import { Secao, P, Demo, Titulo, H3, Aviso as Destaque, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

export default function CarregandoPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead='Três jeitos de dizer "estou trabalhando". A escolha entre eles é sobre o que você sabe — e o que não sabe.'
      >
        Giro, Progresso e Esqueleto
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Giro, Progresso, Esqueleto } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="Qual dos três">
        <P>
          <strong><code>Esqueleto</code></strong> — você sabe o <em>formato</em> do que vem. Uma
          lista de clientes, um card, um parágrafo. É o melhor dos três quando serve: a tela não
          pula quando o conteúdo chega, porque o espaço já estava reservado.
        </P>
        <P>
          <strong><code>Progresso</code></strong> — você sabe <em>quanto falta</em>. Sincronizar
          420 de 1.200 pedidos. Ou sabe que está acontecendo e não sabe quanto falta: aí é
          <code> indeterminado</code>, e a barra diz isso em vez de fingir um número.
        </P>
        <P>
          <strong><code>Giro</code></strong> — você não sabe nem o formato nem o tempo. É o
          último recurso: cabe dentro de um botão, de uma célula de tabela, de um canto. Não
          reserva espaço, então a tela pula quando o conteúdo chega.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Esqueleto para a lista, Giro para o botão',
            texto: 'A lista tem formato conhecido — desenhe-o. O botão que acabou de ser clicado não tem: ele só está ocupado.',
          }}
          naoFaca={{
            titulo: 'Um giro no meio da tela para tudo',
            texto: 'Não diz o que está carregando, não reserva espaço e faz o layout saltar quando o conteúdo chega. Funciona; é só o pior dos três.',
          }}
        />
      </Secao>

      <Secao titulo="Giro">
        <Demo
          codigo={`<Giro size="sm" />
<Giro />                                     // md é o padrão
<Giro size="lg" rotulo="Carregando campanhas" />`}
        >
          <Giro size="sm" />
          <Giro />
          <Giro size="lg" rotulo="Carregando campanhas" />
        </Demo>
        <H3>Não existe Giro mudo saindo daqui</H3>
        <P>
          Um giro é uma imagem em movimento: para quem usa leitor de tela, é o nada absoluto. A
          pessoa fica sem saber se a página está trabalhando ou se travou de vez — e a resposta a
          essas duas situações é oposta (esperar × recarregar). Por isso <code>rotulo</code> tem
          padrão (<code>"Carregando"</code>) em vez de ser opcional-de-verdade.
        </P>
        <P>
          <strong>Vale ser específico.</strong> "Carregando" é melhor que nada, mas "Carregando
          campanhas" diz qual pedaço da tela está ocupado — a pessoa não precisa adivinhar se
          travou ou se é outra coisa.
        </P>
        <P>
          O rótulo vive no <code>aria-label</code>, não em texto visível: o giro precisa caber em
          botão e em célula de tabela. Quem enxerga já entende pelo movimento.
        </P>
        <Destaque>
          Dentro de um botão que já se anuncia por <code>aria-busy</code>, o giro seria um
          segundo anúncio da mesma coisa. Aí:
          <Bloco lang="jsx">{`<Giro size="sm" aria-hidden="true" />`}</Bloco>
        </Destaque>
        <P>
          O anel herda a cor de onde estiver (<code>currentColor</code> no CSS), então ele
          funciona sobre o botão primário, dentro de um card e num alerta — sem uma variante para
          cada caso, e sem "sumir" no fundo.
        </P>
      </Secao>

      <Secao titulo="Progresso">
        <Demo
          variante="plain"
          codigo={`<Progresso valor={42} rotulo="Sincronizando pedidos" mostrarValor />
<Progresso valor={840} max={1200} rotulo="Enviando mensagens" tom="success" />
<Progresso indeterminado rotulo="Consultando o Bling" />`}
        >
          <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: 460 }}>
            <Progresso valor={42} rotulo="Sincronizando pedidos" mostrarValor />
            <Progresso valor={840} max={1200} rotulo="Enviando mensagens" tom="success" mostrarValor />
            <Progresso indeterminado rotulo="Consultando o Bling" />
          </div>
        </Demo>

        <H3>A decisão que quase todo mundo erra: ausente ≠ zero</H3>
        <P>
          Quando <code>indeterminado</code>, o <code>aria-valuenow</code> é
          <strong> omitido</strong>, não zerado. A norma ARIA trata os dois como coisas
          diferentes, e o leitor de tela também:
        </P>
        <P>
          <code>aria-valuenow="0"</code> → <strong>"0 por cento"</strong>. A pessoa entende que a
          tarefa está parada no começo, e fica esperando um número que nunca vem.
        </P>
        <P>
          <strong>Sem <code>aria-valuenow</code></strong> → "ocupado". A pessoa entende que está
          andando e que ninguém sabe quanto falta — que é a verdade.
        </P>
        <P>
          Zerar por comodidade (o atributo "sempre presente" é mais fácil de escrever) troca uma
          informação correta por uma mentira precisa. Pela mesma razão,
          <code> indeterminado</code> ignora <code>valor</code> e não mostra "0%" nem com
          <code> mostrarValor</code>: a barra não sabe, então não fala.
        </P>

        <H3>Menos movimento não pode virar "terminou"</H3>
        <P>
          Em <code>prefers-reduced-motion</code> o segmento indeterminado para de atravessar — e
          <strong> não vira barra cheia parada</strong>. Barra cheia parada significa "terminou",
          o oposto da verdade. Ele fica um bloco parcial e apagado no trilho: "tem algo em curso,
          o tamanho não quer dizer nada". Quem ouve não perde nada, porque a informação real está
          na ausência do <code>aria-valuenow</code>.
        </P>

        <H3>Produção manda lixo, e a barra aguenta</H3>
        <P>
          Progresso vem de conta feita em produção (<code>enviados / total</code>).
          <code> total</code> zero vira <code>Infinity</code>; uma soma errada vira 120%; um
          contador que decrementa vira negativo. Nada disso pode virar barra vazando para fora do
          trilho nem <code>aria-valuenow="NaN"</code>.
        </P>
        <TabelaProps
          props={[
            { nome: 'valor negativo', tipo: '—', padrao: '0', descricao: 'Grampeado no piso.' },
            { nome: 'valor > max', tipo: '—', padrao: 'max', descricao: 'A barra não vaza do trilho.' },
            { nome: 'NaN', tipo: '—', padrao: '0', descricao: <>Saiu de <code>0/0</code>: não dá para afirmar nada, então nada foi.</> },
            { nome: 'Infinity', tipo: '—', padrao: 'max', descricao: <>Saiu de <code>x/0</code>: é um número acima de qualquer max, e cai na mesma regra. Uma exceção a menos.</> },
            { nome: 'max ≤ 0 / NaN / Infinity', tipo: '—', padrao: '100', descricao: 'Volta ao padrão em vez de dividir por zero e sumir com a barra.' },
          ]}
        />
        <Destaque>
          <code>role="progressbar"</code> já carrega o estado por conta própria — a barra não é
          <code> alert</code>. Assertivo aqui faria o leitor de tela interromper a pessoa a cada
          tique. Quem quiser anunciar o <em>começo</em> do carregamento usa o
          <code> role="status"</code> do Giro ou do Esqueleto.
        </Destaque>
      </Secao>

      <Secao titulo="Esqueleto">
        <Demo
          variante="plain"
          codigo={`<Esqueleto variante="texto" linhas={3} />
<Esqueleto variante="circulo" largura={42} />
<Esqueleto variante="retangulo" altura={120} />`}
        >
          <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: 460 }}>
            <Esqueleto variante="texto" linhas={3} />
            <Esqueleto variante="circulo" largura={42} />
            <Esqueleto variante="retangulo" altura={120} />
          </div>
        </Demo>

        <H3>A decisão que quase todo mundo erra: o esqueleto é mudo</H3>
        <P>
          O esqueleto é um desenho do que vai chegar. Para quem usa leitor de tela, ele não é
          nada — e é isso mesmo que tem que ser. Deixar as caixas visíveis à árvore de
          acessibilidade faz a pessoa ouvir <strong>"grupo, grupo, grupo, grupo"</strong> e
          tentar navegar por cinco retângulos vazios que somem em 300ms.
        </P>
        <P>
          Então: as formas são <code>aria-hidden</code>, e quem fala é <strong>um</strong>
          <code> role="status"</code> no container. Uma frase, uma vez, no lugar de um monte de
          caixas vazias.
        </P>

        <H3>Numa lista, use anunciar={'{false}'}</H3>
        <P>
          Dez linhas de esqueleto com dez <code>role="status"</code> fazem o leitor de tela dizer
          "carregando" dez vezes. O certo é desligar o anúncio de cada linha e deixar um só no
          container:
        </P>
        <Bloco lang="jsx">{`<div role="status" aria-label="Carregando clientes">
  {[...Array(10)].map((_, i) => <Esqueleto key={i} anunciar={false} />)}
</div>`}</Bloco>
        <P>
          Com <code>anunciar={'{false}'}</code> o bloco sai inteiro da árvore de acessibilidade:
          vira decoração pura.
        </P>

        <H3>A última linha é curta de propósito</H3>
        <P>
          Com mais de uma linha, a última sai a <strong>60%</strong> da largura. Parágrafo de
          verdade termina no meio da linha; retângulos do mesmo comprimento empilhados não
          parecem texto, <strong>parecem tabela cinza</strong>. É o detalhe que faz o esqueleto
          ser lido como "vem texto aqui".
        </P>
        <P>
          Uma linha só <em>não</em> é encurtada — sozinha, ela ficaria um toco solto. E
          <code> linhas</code> menor que 1 ainda renderiza uma: o valor costuma vir de
          <code> linhas={'{lista.length}'}</code> com a lista ainda vazia, e não renderizar nada
          aí faria a tela pular do vazio direto para o conteúdo.
        </P>
        <Destaque>
          As duas cores do esqueleto vêm de superfícies do tema, não de um cinza fixo: no tema
          escuro ele precisa ser mais <strong>claro</strong> que o fundo, e no claro mais
          <strong> escuro</strong>. Um cinza cravado acerta um dos dois e vira um bloco gritando
          no outro.
        </Destaque>
      </Secao>

      <Secao titulo="Os três param com prefers-reduced-motion">
        <P>
          Animação em loop causa enjoo em parte das pessoas — não é preferência estética. Nos
          três, o movimento some e a informação continua chegando: o Giro fecha o anel e apaga, o
          Esqueleto fica na forma estática, o Progresso indeterminado vira um bloco parcial
          apagado. O <code>role="status"</code> e o <code>aria-valuenow</code> nunca dependeram
          de animação nenhuma.
        </P>
      </Secao>

      <Secao titulo="Props — Giro">
        <TabelaProps
          props={[
            { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Anel de 16, 24 ou 40px. sm em botão/linha de tabela, md em card, lg em tela cheia.' },
            { nome: 'rotulo', tipo: 'string', padrao: "'Carregando'", descricao: <>O que está carregando. Vira <code>aria-label</code> — vale ser específico.</> },
            { nome: 'centralizado', tipo: 'boolean', padrao: 'false', descricao: 'Ocupa a linha inteira e centraliza. Para "a área toda está carregando".' },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: <>Menos <code>role</code> e <code>children</code>. <code>aria-hidden</code> passa: é como se silencia dentro de um botão.</> },
          ]}
        />
      </Secao>

      <Secao titulo="Props — Progresso">
        <TabelaProps
          props={[
            { nome: 'valor', tipo: 'number', padrao: '0', descricao: <>Quanto já foi, de 0 a <code>max</code>. Fora da faixa é grampeado.</> },
            { nome: 'max', tipo: 'number', padrao: '100', descricao: 'Inválido (0, negativo, NaN, Infinity) volta a 100.' },
            { nome: 'rotulo', tipo: 'string', descricao: 'Vira texto visível E o nome acessível da barra — o texto existe uma vez só.' },
            { nome: 'mostrarValor', tipo: 'boolean', padrao: 'false', descricao: <>Mostra "42%" ao lado do rótulo. Ignorado no <code>indeterminado</code>.</> },
            { nome: 'tom', tipo: "'brand' | 'success' | 'warning' | 'danger'", padrao: "'brand'", descricao: 'Cor da barra. Vem do tema.' },
            { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Trilho de 4, 8 ou 12px.' },
            { nome: 'indeterminado', tipo: 'boolean', padrao: 'false', descricao: <>Está acontecendo, não dá para saber quanto falta. <strong>Ignora <code>valor</code></strong> — barra indeterminada com número é mentira.</> },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: <>Menos <code>role</code> e <code>children</code>. Vai no invólucro, não no trilho.</> },
          ]}
        />
      </Secao>

      <Secao titulo="Props — Esqueleto">
        <TabelaProps
          props={[
            { nome: 'variante', tipo: "'texto' | 'circulo' | 'retangulo'", padrao: "'texto'", descricao: 'texto = linhas de parágrafo; circulo = avatar/ícone; retangulo = imagem, gráfico, card.' },
            { nome: 'largura', tipo: 'number | string', descricao: <>Número = px, string = CSS (<code>'100%'</code>, <code>'12rem'</code>). No círculo, vale nos dois eixos.</> },
            { nome: 'altura', tipo: 'number | string', descricao: <>Idem. No <code>circulo</code> é ignorada — senão vira ovo.</> },
            { nome: 'linhas', tipo: 'number', padrao: '1', descricao: <>Só em <code>variante="texto"</code>. Menor que 1 ainda renderiza uma.</> },
            { nome: 'rotulo', tipo: 'string', padrao: "'Carregando'", descricao: 'O anúncio do leitor de tela.' },
            { nome: 'anunciar', tipo: 'boolean', padrao: 'true', descricao: <><strong>Desligue numa lista</strong> e ponha um anúncio só no container.</> },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLDivElement>', descricao: <>Menos <code>children</code> — o esqueleto desenha as próprias formas.</> },
          ]}
        />
      </Secao>
    </>
  )
}
